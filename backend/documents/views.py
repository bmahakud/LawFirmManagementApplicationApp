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
        
        Document Visibility Rules:
        1. Personal Documents (/documents page):
           - Users see ONLY their own uploaded documents
           - Advocates see ONLY their own documents (NOT client or case documents)
           - Clients see ONLY their own documents (NOT case documents here)
        
        2. Case Documents (/cases/{id}/documents - via by_case endpoint):
           - Shows documents where case field is set to that case
           - Visible to: client, assigned advocate, admins
        
        3. Profile Documents (admin view):
           - Admins can see all documents in their firm
        """
        user = self.request.user
        show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
        
        # Base queryset - show ONLY user's own documents
        queryset = UserDocument.objects.filter(uploaded_by=user)
        
        # Admins can see all documents in their firm
        if user.user_type in ['admin', 'super_admin']:
            if user.firm:
                queryset = UserDocument.objects.filter(firm=user.firm)
            else:
                # Solo admin (shouldn't happen but handle it)
                queryset = UserDocument.objects.filter(uploaded_by=user)
        
        # Platform owners see everything
        elif user.user_type == 'platform_owner':
            queryset = UserDocument.objects.all()
        
        # For advocates and clients: show ONLY their own documents
        # Case documents are accessed via the by_case() action endpoint
        
        # Filter by deletion status
        if not show_deleted:
            queryset = queryset.filter(is_deleted=False)
        
        return queryset.distinct()
    
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
        """Create document with proper firm assignment and verification status"""
        user = self.request.user
        
        # Determine firm (can be None for solo advocates and their clients)
        firm = None
        if user.user_type in ['super_admin', 'admin', 'advocate', 'paralegal']:
            firm = user.firm  # Can be None for solo advocates
        elif user.user_type == 'client':
            # Try to get firm from client profiles
            client_profile = user.client_profiles.first()
            if client_profile:
                firm = client_profile.firm  # Can be None if client's advocate is solo
            # Fallback: try to get from user's firm field
            elif user.firm:
                firm = user.firm
        
        # Note: firm can be None for solo advocates and their clients - this is valid
        
        # Auto-assign client if user is a client
        client = None
        if user.user_type == 'client':
            client = user.client_profiles.first()
        
        # Determine verification status
        # Documents uploaded by advocates/admins are auto-verified
        # Documents uploaded by clients need verification
        verification_status = 'pending'
        verified_by = None
        verified_at = None
        
        if user.user_type in ['advocate', 'super_admin', 'admin', 'platform_owner']:
            verification_status = 'verified'
            verified_by = user
            verified_at = timezone.now()
        
        serializer.save(
            uploaded_by=user,
            firm=firm,  # Can be None for solo advocates
            client=client or serializer.validated_data.get('client'),
            verification_status=verification_status,
            verified_by=verified_by,
            verified_at=verified_at
        )
    
    def perform_update(self, serializer):
        """Update document with permission checks"""
        user = self.request.user
        obj = self.get_object()
        
        # Advocates, admins, and super_admins can update verification status
        if 'verification_status' in self.request.data:
            if user.user_type not in ['platform_owner', 'super_admin', 'admin', 'advocate']:
                raise PermissionDenied("Only advocates and admins can verify documents.")
            
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
        """
        Get documents for a specific case.
        
        Returns ALL documents linked to the case (uploaded by anyone).
        Permission check: User must have access to this case.
        """
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response(
                {"detail": "case_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = request.user
        
        # Check if user has permission to access this case
        from cases.models import Case
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response(
                {"detail": "Case not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Permission check
        has_permission = False
        
        if user.user_type == 'platform_owner':
            has_permission = True
        elif user.user_type in ['super_admin', 'admin']:
            # Admins can see cases in their firm
            has_permission = case.firm == user.firm
        elif user.user_type == 'advocate':
            # Advocates can see their assigned cases
            if case.firm:
                has_permission = case.assigned_advocate == user and case.firm == user.firm
            else:
                has_permission = case.solo_advocate == user
        elif user.user_type == 'client':
            # Clients can see their own cases
            # Use filter().exists() to check if the case's client matches any of the user's profiles
            has_permission = user.client_profiles.filter(id=case.client_id).exists()
        
        if not has_permission:
            raise PermissionDenied("You do not have permission to access this case.")
        
        # Return ALL documents for this case
        queryset = UserDocument.objects.filter(case_id=case_id, is_deleted=False)
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
            # Skip check if either user has no firm (solo advocate case)
            if user.firm and target_user.firm and target_user.firm != user.firm:
                raise PermissionDenied("You can only view documents of users in your firm.")
            
            # Can see documents of advocates, paralegals, and clients
            if target_user.user_type not in ['advocate', 'paralegal', 'client']:
                raise PermissionDenied("You cannot view documents of this user type.")
        
        elif user.user_type == 'advocate':
            # Advocate can only see client documents if client is assigned to them
            if target_user.user_type == 'client':
                # Check if this client is assigned to the advocate
                client_profiles = target_user.client_profiles.all()
                if client_profiles.exists():
                    # Check if advocate has any cases with these client profiles OR any profile is directly assigned
                    from cases.models import Case
                    has_case = Case.objects.filter(
                        client__in=client_profiles,
                        assigned_advocate=user
                    ).exists()
                    
                    # Also check if any client profile is directly assigned to this advocate
                    is_assigned = client_profiles.filter(assigned_advocate=user).exists()
                    
                    if not (has_case or is_assigned):
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
