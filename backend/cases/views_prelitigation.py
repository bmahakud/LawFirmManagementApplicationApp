"""
Views for Pre-Litigation features
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.utils import timezone

from .models_prelitigation import (
    DocumentChecklist,
    CaseDocumentChecklistItem,
    CaseResearch,
    LegalNotice
)
from .serializers_prelitigation import (
    DocumentChecklistSerializer,
    CaseDocumentChecklistItemSerializer,
    CaseDocumentChecklistItemListSerializer,
    CaseResearchSerializer,
    CaseResearchListSerializer,
    LegalNoticeSerializer,
    LegalNoticeListSerializer
)
from .models import Case
from firms.permissions import IsSubscriptionActive


class DocumentChecklistViewSet(viewsets.ModelViewSet):
    """
    ViewSet for document checklist templates.
    Platform owner/admin can create templates for different case types.
    """
    queryset = DocumentChecklist.objects.all()
    serializer_class = DocumentChecklistSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document_name', 'description']
    ordering_fields = ['case_type', 'display_order']
    
    def get_queryset(self):
        queryset = DocumentChecklist.objects.all()
        
        # Filter by case type
        case_type = self.request.query_params.get('case_type')
        if case_type:
            queryset = queryset.filter(case_type=case_type)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_case_type(self, request):
        """
        Get checklist for specific case type.
        GET /api/document-checklists/by-case-type/?case_type=civil
        """
        case_type = request.query_params.get('case_type')
        if not case_type:
            return Response(
                {'error': 'case_type parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        checklists = DocumentChecklist.objects.filter(case_type=case_type)
        serializer = self.get_serializer(checklists, many=True)
        
        return Response({
            'case_type': case_type,
            'total_documents': checklists.count(),
            'mandatory_documents': checklists.filter(is_mandatory=True).count(),
            'checklist': serializer.data
        })


class CaseDocumentChecklistItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for case-specific document checklist items.
    """
    queryset = CaseDocumentChecklistItem.objects.all()
    serializer_class = CaseDocumentChecklistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document_name', 'notes']
    ordering_fields = ['status', 'is_mandatory', 'received_date']
    
    def get_queryset(self):
        user = self.request.user
        queryset = CaseDocumentChecklistItem.objects.select_related('case', 'verified_by')
        
        # Permission filtering
        if user.user_type != 'platform_owner':
            if user.firm:
                queryset = queryset.filter(case__firm=user.firm)
            elif user.user_type == 'advocate':
                queryset = queryset.filter(case__solo_advocate=user)
            elif user.user_type == 'client':
                client_profiles = user.client_profiles.all()
                if client_profiles.exists():
                    queryset = queryset.filter(case__client__in=client_profiles)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CaseDocumentChecklistItemListSerializer
        return CaseDocumentChecklistItemSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=False, methods=['get'], url_path='by-case')
    def by_case(self, request):
        """
        Get all checklist items for a specific case.
        GET /api/case-document-checklist/by-case/?case_id=<uuid>
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response(
                {'error': 'case_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Permission check
        user = request.user
        if user.user_type != 'platform_owner':
            if user.firm and case.firm != user.firm:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            elif user.user_type == 'advocate' and case.solo_advocate != user:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        items = CaseDocumentChecklistItem.objects.filter(case=case)
        serializer = CaseDocumentChecklistItemSerializer(items, many=True)
        
        # Calculate statistics
        total = items.count()
        pending = items.filter(status='pending').count()
        received = items.filter(status='received').count()
        verified = items.filter(status='verified').count()
        
        return Response({
            'case_id': str(case.id),
            'case_number': case.case_number,
            'total_documents': total,
            'pending': pending,
            'received': received,
            'verified': verified,
            'completion_percentage': (verified / total * 100) if total > 0 else 0,
            'checklist_items': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def create_from_template(self, request):
        """
        Create checklist items for a case from template.
        POST /api/case-document-checklist/create-from-template/
        {
            "case_id": "uuid",
            "case_type": "civil"
        }
        """
        case_id = request.data.get('case_id')
        case_type = request.data.get('case_type')
        
        if not case_id or not case_type:
            return Response(
                {'error': 'case_id and case_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get template items
        templates = DocumentChecklist.objects.filter(case_type=case_type)
        
        if not templates.exists():
            return Response(
                {'error': f'No checklist template found for case type: {case_type}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create checklist items
        created_items = []
        for template in templates:
            item, created = CaseDocumentChecklistItem.objects.get_or_create(
                case=case,
                document_name=template.document_name,
                defaults={
                    'checklist_template': template,
                    'description': template.description,
                    'is_mandatory': template.is_mandatory,
                    'status': 'pending'
                }
            )
            if created:
                created_items.append(item)
        
        serializer = CaseDocumentChecklistItemSerializer(created_items, many=True)
        
        return Response({
            'message': f'Created {len(created_items)} checklist items',
            'items': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def pending_documents(self, request):
        """
        Get all pending documents across all cases.
        GET /api/case-document-checklist/pending-documents/
        """
        queryset = self.get_queryset()
        pending = queryset.filter(status__in=['pending', 'requested'])
        
        serializer = CaseDocumentChecklistItemSerializer(pending, many=True)
        
        return Response({
            'count': pending.count(),
            'pending_documents': serializer.data
        })


class CaseResearchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for case research notes.
    """
    queryset = CaseResearch.objects.all()
    serializer_class = CaseResearchSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content', 'case_citation', 'act_name']
    ordering_fields = ['created_at', 'relevance_score']
    
    def get_queryset(self):
        user = self.request.user
        queryset = CaseResearch.objects.select_related('case', 'created_by')
        
        # Permission filtering
        if user.user_type != 'platform_owner':
            if user.firm:
                queryset = queryset.filter(case__firm=user.firm)
            elif user.user_type == 'advocate':
                queryset = queryset.filter(case__solo_advocate=user)
            else:
                queryset = queryset.none()
        
        # Filter by research type
        research_type = self.request.query_params.get('research_type')
        if research_type:
            queryset = queryset.filter(research_type=research_type)
        
        # Filter by favorable/unfavorable
        is_favorable = self.request.query_params.get('is_favorable')
        if is_favorable:
            queryset = queryset.filter(is_favorable=is_favorable.lower() == 'true')
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CaseResearchListSerializer
        return CaseResearchSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='by-case')
    def by_case(self, request):
        """
        Get all research notes for a specific case.
        GET /api/case-research/by-case/?case_id=<uuid>
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response(
                {'error': 'case_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        research_notes = CaseResearch.objects.filter(case=case)
        serializer = CaseResearchSerializer(research_notes, many=True)
        
        return Response({
            'case_id': str(case.id),
            'case_number': case.case_number,
            'total_notes': research_notes.count(),
            'research_notes': serializer.data
        })


class LegalNoticeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for legal notices.
    """
    queryset = LegalNotice.objects.all()
    serializer_class = LegalNoticeSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['subject', 'recipient_name', 'tracking_number']
    ordering_fields = ['sent_date', 'response_deadline', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = LegalNotice.objects.select_related('case', 'created_by')
        
        # Permission filtering
        if user.user_type != 'platform_owner':
            if user.firm:
                queryset = queryset.filter(case__firm=user.firm)
            elif user.user_type == 'advocate':
                queryset = queryset.filter(case__solo_advocate=user)
            elif user.user_type == 'client':
                client_profiles = user.client_profiles.all()
                if client_profiles.exists():
                    queryset = queryset.filter(case__client__in=client_profiles)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.none()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by notice type
        notice_type = self.request.query_params.get('notice_type')
        if notice_type:
            queryset = queryset.filter(notice_type=notice_type)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LegalNoticeListSerializer
        return LegalNoticeSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='by-case')
    def by_case(self, request):
        """
        Get all legal notices for a specific case.
        GET /api/legal-notices/by-case/?case_id=<uuid>
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response(
                {'error': 'case_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response(
                {'error': 'Case not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        notices = LegalNotice.objects.filter(case=case)
        serializer = LegalNoticeSerializer(notices, many=True)
        
        return Response({
            'case_id': str(case.id),
            'case_number': case.case_number,
            'total_notices': notices.count(),
            'legal_notices': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def pending_responses(self, request):
        """
        Get all notices awaiting response.
        GET /api/legal-notices/pending-responses/
        """
        today = timezone.now().date()
        queryset = self.get_queryset()
        
        pending = queryset.filter(
            status__in=['sent', 'delivered'],
            response_deadline__gte=today
        )
        
        serializer = LegalNoticeSerializer(pending, many=True)
        
        return Response({
            'count': pending.count(),
            'pending_notices': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def overdue_responses(self, request):
        """
        Get all notices with overdue responses.
        GET /api/legal-notices/overdue-responses/
        """
        today = timezone.now().date()
        queryset = self.get_queryset()
        
        overdue = queryset.filter(
            response_deadline__lt=today,
            status__in=['sent', 'delivered']
        )
        
        serializer = LegalNoticeSerializer(overdue, many=True)
        
        return Response({
            'count': overdue.count(),
            'overdue_notices': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update notice status with notes.
        POST /api/legal-notices/{id}/update-status/
        {
            "status": "delivered",
            "status_notes": "Delivered via email on 15th May",
            "delivered_date": "2024-05-15"
        }
        """
        notice = self.get_object()
        
        # Only advocate, admin, or super_admin can update status
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Only advocates and admins can update notice status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        status_notes = request.data.get('status_notes', '')
        delivered_date = request.data.get('delivered_date')
        read_date = request.data.get('read_date')
        
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [choice[0] for choice in LegalNotice.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update notice
        notice.status = new_status
        notice.status_notes = status_notes
        notice.last_status_update = timezone.now()
        notice.last_status_updated_by = request.user
        
        if delivered_date:
            notice.delivered_date = delivered_date
        if read_date:
            notice.read_date = read_date
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': f'Notice status updated to "{new_status}"',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_sent_email(self, request, pk=None):
        """
        Mark notice as sent via email.
        POST /api/legal-notices/{id}/mark-sent-email/
        {
            "sent_date": "2024-05-15T10:30:00Z",
            "notes": "Sent to recipient@example.com"
        }
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        sent_date = request.data.get('sent_date', timezone.now())
        notes = request.data.get('notes', '')
        
        notice.email_sent = True
        notice.email_sent_date = sent_date
        notice.status = 'sent'
        notice.sent_date = timezone.now().date()
        
        # Add to delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        delivery_attempts.append({
            'method': 'email',
            'sent_date': str(sent_date),
            'status': 'sent',
            'notes': notes
        })
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': 'Notice marked as sent via email',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_delivered_email(self, request, pk=None):
        """
        Mark email as delivered.
        POST /api/legal-notices/{id}/mark-delivered-email/
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notice.email_delivered = True
        notice.status = 'delivered'
        notice.delivered_date = timezone.now().date()
        
        # Update delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        for attempt in delivery_attempts:
            if attempt.get('method') == 'email' and attempt.get('status') == 'sent':
                attempt['status'] = 'delivered'
                attempt['delivered_date'] = str(timezone.now())
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': 'Email marked as delivered',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_opened_email(self, request, pk=None):
        """
        Mark email as opened/read.
        POST /api/legal-notices/{id}/mark-opened-email/
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notice.email_opened = True
        notice.email_opened_date = timezone.now()
        notice.status = 'read'
        notice.read_date = timezone.now().date()
        
        # Update delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        for attempt in delivery_attempts:
            if attempt.get('method') == 'email':
                attempt['status'] = 'read'
                attempt['read_date'] = str(timezone.now())
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': 'Email marked as opened',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_sent_whatsapp(self, request, pk=None):
        """
        Mark notice as sent via WhatsApp.
        POST /api/legal-notices/{id}/mark-sent-whatsapp/
        {
            "sent_date": "2024-05-15T10:30:00Z",
            "notes": "Sent to +91-9876543210"
        }
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        sent_date = request.data.get('sent_date', timezone.now())
        notes = request.data.get('notes', '')
        
        notice.whatsapp_sent = True
        notice.whatsapp_sent_date = sent_date
        notice.status = 'sent'
        notice.sent_date = timezone.now().date()
        
        # Add to delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        delivery_attempts.append({
            'method': 'whatsapp',
            'sent_date': str(sent_date),
            'status': 'sent',
            'notes': notes
        })
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': 'Notice marked as sent via WhatsApp',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_delivered_whatsapp(self, request, pk=None):
        """
        Mark WhatsApp message as delivered.
        POST /api/legal-notices/{id}/mark-delivered-whatsapp/
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notice.whatsapp_delivered = True
        notice.status = 'delivered'
        notice.delivered_date = timezone.now().date()
        
        # Update delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        for attempt in delivery_attempts:
            if attempt.get('method') == 'whatsapp' and attempt.get('status') == 'sent':
                attempt['status'] = 'delivered'
                attempt['delivered_date'] = str(timezone.now())
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': 'WhatsApp message marked as delivered',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_read_whatsapp(self, request, pk=None):
        """
        Mark WhatsApp message as read.
        POST /api/legal-notices/{id}/mark-read-whatsapp/
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notice.whatsapp_read = True
        notice.whatsapp_read_date = timezone.now()
        notice.status = 'read'
        notice.read_date = timezone.now().date()
        
        # Update delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        for attempt in delivery_attempts:
            if attempt.get('method') == 'whatsapp':
                attempt['status'] = 'read'
                attempt['read_date'] = str(timezone.now())
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': 'WhatsApp message marked as read',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_sent_physical(self, request, pk=None):
        """
        Mark notice as sent via physical delivery (post/courier).
        POST /api/legal-notices/{id}/mark-sent-physical/
        {
            "sent_date": "2024-05-15",
            "tracking_number": "RR123456789IN",
            "delivery_method": "registered_post",
            "notes": "Sent via India Post"
        }
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        sent_date = request.data.get('sent_date', timezone.now().date())
        tracking_number = request.data.get('tracking_number', '')
        delivery_method = request.data.get('delivery_method', 'registered_post')
        notes = request.data.get('notes', '')
        
        notice.physical_sent = True
        notice.physical_sent_date = sent_date
        notice.tracking_number = tracking_number
        notice.delivery_method = delivery_method
        notice.status = 'sent'
        notice.sent_date = sent_date
        
        # Add to delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        delivery_attempts.append({
            'method': delivery_method,
            'sent_date': str(sent_date),
            'tracking_number': tracking_number,
            'status': 'sent',
            'notes': notes
        })
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': f'Notice marked as sent via {delivery_method}',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_delivered_physical(self, request, pk=None):
        """
        Mark physical delivery as completed.
        POST /api/legal-notices/{id}/mark-delivered-physical/
        {
            "delivered_date": "2024-05-20",
            "proof_of_delivery": <file upload>
        }
        """
        notice = self.get_object()
        
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        delivered_date = request.data.get('delivered_date', timezone.now().date())
        proof_file = request.FILES.get('proof_of_delivery')
        
        notice.physical_delivered = True
        notice.physical_delivered_date = delivered_date
        notice.status = 'delivered'
        notice.delivered_date = delivered_date
        
        if proof_file:
            notice.proof_of_delivery = proof_file
        
        # Update delivery attempts
        delivery_attempts = notice.delivery_attempts or []
        for attempt in delivery_attempts:
            if attempt.get('method') in ['registered_post', 'speed_post', 'courier', 'hand_delivery']:
                if attempt.get('status') == 'sent':
                    attempt['status'] = 'delivered'
                    attempt['delivered_date'] = str(delivered_date)
        notice.delivery_attempts = delivery_attempts
        
        notice.save()
        
        serializer = self.get_serializer(notice)
        return Response({
            'message': 'Physical delivery marked as completed',
            'legal_notice': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def delivery_status(self, request, pk=None):
        """
        Get complete delivery status for a notice.
        GET /api/legal-notices/{id}/delivery-status/
        """
        notice = self.get_object()
        
        delivery_status = {
            'notice_id': str(notice.id),
            'case_number': notice.case.case_number,
            'recipient_name': notice.recipient_name,
            'current_status': notice.status,
            'status_display': notice.get_status_display(),
            
            'email': {
                'sent': notice.email_sent,
                'sent_date': notice.email_sent_date,
                'delivered': notice.email_delivered,
                'opened': notice.email_opened,
                'opened_date': notice.email_opened_date,
            },
            
            'whatsapp': {
                'sent': notice.whatsapp_sent,
                'sent_date': notice.whatsapp_sent_date,
                'delivered': notice.whatsapp_delivered,
                'read': notice.whatsapp_read,
                'read_date': notice.whatsapp_read_date,
            },
            
            'physical': {
                'sent': notice.physical_sent,
                'sent_date': notice.physical_sent_date,
                'tracking_number': notice.tracking_number,
                'delivered': notice.physical_delivered,
                'delivered_date': notice.physical_delivered_date,
                'proof_available': bool(notice.proof_of_delivery),
            },
            
            'delivery_attempts': notice.delivery_attempts,
            'last_status_update': notice.last_status_update,
            'status_notes': notice.status_notes,
        }
        
        return Response(delivery_status)
