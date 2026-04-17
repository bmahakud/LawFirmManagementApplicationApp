from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.db.models import Q
from .models import UserDocument
from .serializers import UserDocumentSerializer, UserDocumentListSerializer


class UserDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing documents with soft-delete and permission-based access.
    
    Permissions:
    - Super Admin: Can see all documents in their firm
    - Advocate: Can see documents for clients assigned to them
    - Client: Can see only their own documents
    - Everyone can upload documents
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return UserDocumentListSerializer
        return UserDocumentSerializer
    
    def get_queryset(self):
        """
        Filter documents based on user permissions.
        
        For the main documents page (/documents):
        - Users see ONLY their own documents
        
        For user profile pages, use the 'user_documents' action endpoint
        which has different visibility rules.
        """
        user = self.request.user
        show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
        
        # Base queryset - only show user's own documents
        queryset = UserDocument.objects.filter(uploaded_by=user)
        
        # Filter by deletion status
        if not show_deleted:
            queryset = queryset.filter(is_deleted=False)
        
        return queryset
    
    def get_object(self):
        """Check permissions before returning object"""
        pk = self.kwargs.get('pk')
        try:
            obj = UserDocument.objects.get(pk=pk)
        except UserDocument.DoesNotExist:
            from django.http import Http404
            raise Http404
        
        # Check if user has permission to access this document
        if not self.get_queryset().filter(pk=pk).exists():
            raise PermissionDenied("You do not have permission to access this document.")
        
        return obj
    
    def perform_create(self, serializer):
        """Create document with proper firm assignment"""
        user = self.request.user
        
        # Determine firm
        firm = None
        if user.user_type in ['super_admin', 'admin', 'advocate', 'paralegal']:
            firm = user.firm
        elif user.user_type == 'client':
            # Try to get firm from client profile
            if hasattr(user, 'client_profile') and user.client_profile:
                firm = user.client_profile.firm
            # Fallback: try to get from user's firm field
            elif user.firm:
                firm = user.firm
        
        if not firm:
            raise PermissionDenied(
                f"Unable to determine firm for document upload. User type: {user.user_type}, "
                f"Has client_profile: {hasattr(user, 'client_profile')}"
            )
        
        # Auto-assign client if user is a client
        client = None
        if user.user_type == 'client':
            if hasattr(user, 'client_profile') and user.client_profile:
                client = user.client_profile
        
        serializer.save(
            uploaded_by=user,
            firm=firm,
            client=client or serializer.validated_data.get('client')
        )
    
    def perform_update(self, serializer):
        """Update document with permission checks"""
        user = self.request.user
        obj = self.get_object()
        
        # Only super_admin/admin can update verification status
        if 'verification_status' in self.request.data:
            if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
                raise PermissionDenied("Only admins can verify documents.")
            
            # Update verification details
            if self.request.data['verification_status'] in ['verified', 'rejected']:
                serializer.save(
                    verified_by=user,
                    verified_at=timezone.now()
                )
                return
        
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        """
        Soft delete instead of hard delete.
        Only super_admin can delete documents.
        """
        user = request.user
        
        if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            raise PermissionDenied("Only super admins can delete documents.")
        
        document = self.get_object()
        
        if document.is_deleted:
            return Response(
                {"detail": "Document is already deleted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document.soft_delete(user)
        
        return Response(
            {"detail": "Document soft-deleted successfully."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a soft-deleted document"""
        user = request.user
        
        if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            raise PermissionDenied("Only super admins can restore documents.")
        
        document = self.get_object()
        
        if not document.is_deleted:
            return Response(
                {"detail": "Document is not deleted."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document.restore()
        
        return Response(
            {"detail": "Document restored successfully."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """Get documents uploaded by the current user"""
        queryset = self.get_queryset().filter(uploaded_by=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_client(self, request):
        """Get documents for a specific client"""
        client_id = request.query_params.get('client_id')
        
        if not client_id:
            return Response(
                {"detail": "client_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(client_id=client_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_case(self, request):
        """Get documents for a specific case"""
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response(
                {"detail": "case_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(case_id=case_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get documents by document type"""
        doc_type = request.query_params.get('type')
        
        if not doc_type:
            return Response(
                {"detail": "type parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(document_type=doc_type)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def deleted(self, request):
        """Get all soft-deleted documents (admin only)"""
        user = request.user
        
        if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            raise PermissionDenied("Only admins can view deleted documents.")
        
        queryset = self.get_queryset().filter(is_deleted=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def user_documents(self, request):
        """
        Get documents for a specific user (for profile detail pages).
        
        Visibility rules:
        - Platform Owner: Can see ALL users' documents from any firm
        - Firm Admin: Can see documents of Advocates, Paralegals, and Clients within their firm
        - Advocate: Can see Client documents ONLY if that client is assigned to them through a case
        - Paralegal: Can see only their own documents
        - Client: Can see only their own documents
        """
        user = request.user
        target_user_id = request.query_params.get('user_id')
        
        if not target_user_id:
            return Response(
                {"detail": "user_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the target user
        from accounts.models import CustomUser
        try:
            target_user = CustomUser.objects.get(id=target_user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Base queryset for target user's documents
        queryset = UserDocument.objects.filter(
            uploaded_by=target_user,
            is_deleted=False
        )
        
        # Permission checks
        if user.user_type == 'platform_owner':
            # Platform owner can see all documents
            pass
        
        elif user.user_type in ['super_admin', 'admin']:
            # Firm admin can see documents of users in their firm
            if target_user.firm != user.firm:
                raise PermissionDenied("You can only view documents of users in your firm.")
            
            # Can see documents of advocates, paralegals, and clients
            if target_user.user_type not in ['advocate', 'paralegal', 'client']:
                raise PermissionDenied("You cannot view documents of this user type.")
        
        elif user.user_type == 'advocate':
            # Advocate can only see client documents if client is assigned to them
            if target_user.user_type == 'client':
                # Check if this client is assigned to the advocate
                if hasattr(target_user, 'client_profile'):
                    client = target_user.client_profile
                    # Check if advocate has any cases with this client
                    from cases.models import Case
                    has_case = Case.objects.filter(
                        client=client,
                        assigned_advocate=user
                    ).exists()
                    
                    if not has_case:
                        raise PermissionDenied("You can only view documents of clients assigned to you.")
                else:
                    raise PermissionDenied("Client profile not found.")
            else:
                # Advocates cannot view documents of other user types
                raise PermissionDenied("You can only view documents of your assigned clients.")
        
        else:
            # Paralegal and Client can only see their own documents
            if target_user.id != user.id:
                raise PermissionDenied("You can only view your own documents.")
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
