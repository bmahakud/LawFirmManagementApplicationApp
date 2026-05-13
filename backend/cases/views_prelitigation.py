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
                if hasattr(user, 'client_profile'):
                    queryset = queryset.filter(case__client=user.client_profile)
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
                if hasattr(user, 'client_profile'):
                    queryset = queryset.filter(case__client=user.client_profile)
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
