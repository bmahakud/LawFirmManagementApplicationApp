from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.utils import timezone
from .models_document_requests import CaseDocumentRequest
from .serializers_document_requests import (
    CaseDocumentRequestSerializer,
    CaseDocumentRequestCreateSerializer
)
from documents.models import UserDocument


class CaseDocumentRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing case document requests.
    
    Advocates can create document requests for their cases.
    Clients can view requests for their cases and fulfill them by uploading documents.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CaseDocumentRequestCreateSerializer
        return CaseDocumentRequestSerializer
    
    def get_queryset(self):
        """Filter document requests based on user role"""
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            return CaseDocumentRequest.objects.all()
        
        if user.user_type == 'client':
            # Clients see requests for their cases
            if hasattr(user, 'client_profile') and user.client_profile:
                return CaseDocumentRequest.objects.filter(
                    case__client=user.client_profile
                )
            return CaseDocumentRequest.objects.none()
        
        if user.user_type == 'advocate':
            # Advocates see requests for cases they're assigned to
            from cases.models import Case
            if user.firm:
                # Firm advocate
                cases = Case.objects.filter(firm=user.firm, assigned_advocate=user)
            else:
                # Solo advocate
                cases = Case.objects.filter(solo_advocate=user)
            
            return CaseDocumentRequest.objects.filter(case__in=cases)
        
        if user.user_type in ['admin', 'super_admin']:
            # Admins see all requests in their firm
            return CaseDocumentRequest.objects.filter(case__firm=user.firm)
        
        return CaseDocumentRequest.objects.none()
    
    def perform_create(self, serializer):
        """Create document request"""
        user = self.request.user
        
        # Only advocates and admins can create document requests
        if user.user_type not in ['advocate', 'admin', 'super_admin', 'platform_owner']:
            raise PermissionDenied("Only advocates and admins can create document requests.")
        
        serializer.save(requested_by=user)
    
    def perform_update(self, serializer):
        """Update document request with permission checks"""
        user = self.request.user
        instance = self.get_object()
        
        # Advocates can update their own requests
        if user.user_type == 'advocate':
            if instance.requested_by != user:
                raise PermissionDenied("You can only update your own document requests.")
        
        # Clients can update client_notes, uploaded_document, and status when uploading
        elif user.user_type == 'client':
            allowed_fields = {'client_notes', 'uploaded_document', 'status'}
            request_fields = set(self.request.data.keys())
            if not request_fields.issubset(allowed_fields):
                raise PermissionDenied("Clients can only update client_notes, uploaded_document, and status.")
            
            # Clients can only change status to 'uploaded'
            if 'status' in self.request.data and self.request.data['status'] != 'uploaded':
                raise PermissionDenied("Clients can only set status to 'uploaded'.")
        
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        """Delete document request (only advocates and admins)"""
        user = request.user
        instance = self.get_object()
        
        if user.user_type == 'advocate':
            if instance.requested_by != user:
                raise PermissionDenied("You can only delete your own document requests.")
        elif user.user_type not in ['admin', 'super_admin', 'platform_owner']:
            raise PermissionDenied("You do not have permission to delete document requests.")
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'], url_path='by-case')
    def by_case(self, request):
        """
        Get all document requests for a specific case.
        
        GET /api/case-document-requests/by-case/?case_id={case_id}
        """
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response(
                {'error': 'case_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(case_id=case_id)
        
        # Apply status filter if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-requests')
    def my_requests(self, request):
        """
        Get all document requests for the current client.
        
        GET /api/case-document-requests/my-requests/
        Optional: ?status=pending
        """
        user = request.user
        
        if user.user_type != 'client':
            return Response(
                {'error': 'This endpoint is only for clients'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not hasattr(user, 'client_profile') or not user.client_profile:
            return Response(
                {'error': 'Client profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        queryset = CaseDocumentRequest.objects.filter(
            case__client=user.client_profile
        )
        
        # Apply status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply priority filter
        priority_filter = request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        
        # Add summary statistics
        total = queryset.count()
        pending = queryset.filter(status='pending').count()
        uploaded = queryset.filter(status='uploaded').count()
        verified = queryset.filter(status='verified').count()
        
        return Response({
            'requests': serializer.data,
            'summary': {
                'total': total,
                'pending': pending,
                'uploaded': uploaded,
                'verified': verified,
            }
        })
    
    @action(detail=True, methods=['post'], url_path='fulfill')
    def fulfill_request(self, request, pk=None):
        """
        Client fulfills a document request by uploading a document.
        
        POST /api/case-document-requests/{id}/fulfill/
        {
            "document_id": "uuid-of-uploaded-document",
            "client_notes": "Optional notes from client"
        }
        """
        user = request.user
        
        if user.user_type != 'client':
            return Response(
                {'error': 'Only clients can fulfill document requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        document_request = self.get_object()
        document_id = request.data.get('document_id')
        client_notes = request.data.get('client_notes', '')
        
        if not document_id:
            return Response(
                {'error': 'document_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the document exists and belongs to the client
        try:
            document = UserDocument.objects.get(
                id=document_id,
                uploaded_by=user,
                is_deleted=False
            )
        except UserDocument.DoesNotExist:
            return Response(
                {'error': 'Document not found or does not belong to you'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Associate document with the case if not already
        if not document.case:
            document.case = document_request.case
            document.save()
        
        # Update the request
        document_request.uploaded_document = document
        document_request.status = 'uploaded'
        document_request.uploaded_at = timezone.now()
        document_request.client_notes = client_notes
        document_request.save()
        
        serializer = self.get_serializer(document_request)
        return Response({
            'message': 'Document request fulfilled successfully',
            'request': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='verify')
    def verify_document(self, request, pk=None):
        """
        Advocate verifies or rejects the uploaded document.
        
        POST /api/case-document-requests/{id}/verify/
        {
            "action": "verify" or "reject",
            "rejection_reason": "Optional reason if rejecting"
        }
        """
        user = request.user
        
        if user.user_type not in ['advocate', 'admin', 'super_admin', 'platform_owner']:
            return Response(
                {'error': 'Only advocates and admins can verify documents'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        document_request = self.get_object()
        action = request.data.get('action')
        
        if action not in ['verify', 'reject']:
            return Response(
                {'error': 'action must be either "verify" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not document_request.uploaded_document:
            return Response(
                {'error': 'No document has been uploaded yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action == 'verify':
            document_request.status = 'verified'
            document_request.rejection_reason = ''
            
            # Also update the document verification status
            document = document_request.uploaded_document
            document.verification_status = 'verified'
            document.verified_by = user
            document.verified_at = timezone.now()
            document.save()
            
        else:  # reject
            rejection_reason = request.data.get('rejection_reason', '')
            if not rejection_reason:
                return Response(
                    {'error': 'rejection_reason is required when rejecting'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            document_request.status = 'rejected'
            document_request.rejection_reason = rejection_reason
            
            # Update document verification status
            document = document_request.uploaded_document
            document.verification_status = 'rejected'
            document.verification_notes = rejection_reason
            document.verified_by = user
            document.verified_at = timezone.now()
            document.save()
        
        document_request.save()
        
        serializer = self.get_serializer(document_request)
        return Response({
            'message': f'Document {action}ed successfully',
            'request': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='pending-count')
    def pending_count(self, request):
        """
        Get count of pending document requests for the current user.
        Useful for showing badges/notifications.
        
        GET /api/case-document-requests/pending-count/
        """
        user = request.user
        
        if user.user_type == 'client':
            if hasattr(user, 'client_profile') and user.client_profile:
                count = CaseDocumentRequest.objects.filter(
                    case__client=user.client_profile,
                    status='pending'
                ).count()
            else:
                count = 0
        elif user.user_type == 'advocate':
            # Count uploaded documents waiting for verification
            from cases.models import Case
            if user.firm:
                cases = Case.objects.filter(firm=user.firm, assigned_advocate=user)
            else:
                cases = Case.objects.filter(solo_advocate=user)
            
            count = CaseDocumentRequest.objects.filter(
                case__in=cases,
                status='uploaded'
            ).count()
        else:
            count = 0
        
        return Response({'pending_count': count})
