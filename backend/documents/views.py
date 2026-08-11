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
        1. Advocates:
           - Documents uploaded by advocate
           - Documents in advocate's firm
           - Documents linked to cases assigned to advocate (assigned_advocate or solo_advocate)
           - Documents linked to clients assigned to advocate
        
        2. Clients:
           - Documents uploaded by client
           - Documents linked to client's profile or client's cases
        
        3. Admins / Super Admins:
           - All documents in their firm
        
        4. Platform Owners:
           - All documents
        """
        user = self.request.user
        show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
        
        if user.user_type == 'platform_owner':
            queryset = UserDocument.objects.all()
        elif user.user_type in ['admin', 'super_admin']:
            if user.firm:
                queryset = UserDocument.objects.filter(firm=user.firm)
            else:
                queryset = UserDocument.objects.filter(uploaded_by=user)
        elif user.user_type == 'advocate':
            q = Q(uploaded_by=user)
            if user.firm:
                q |= Q(firm=user.firm)
            q |= Q(case__assigned_advocate=user) | Q(case__solo_advocate=user)
            q |= Q(client__assigned_advocate=user)
            queryset = UserDocument.objects.filter(q)
        elif user.user_type == 'client':
            client_profiles = user.client_profiles.all()
            if client_profiles.exists():
                queryset = UserDocument.objects.filter(
                    Q(uploaded_by=user) | Q(client__in=client_profiles) | Q(case__client__in=client_profiles)
                )
            else:
                queryset = UserDocument.objects.filter(uploaded_by=user)
        else:
            queryset = UserDocument.objects.filter(uploaded_by=user)
        
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
        
        # Determine client
        client = None
        if user.user_type == 'client':
            client = user.client_profiles.first()
        else:
            client = serializer.validated_data.get('client')
            if not client and serializer.validated_data.get('case'):
                case_obj = serializer.validated_data.get('case')
                if getattr(case_obj, 'client', None):
                    client = case_obj.client
        
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
            client=client,
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
        Allowed for:
        - Platform owners, Admins, Super admins
        - Advocates (for documents in their firm, assigned cases, or uploaded by them)
        - Clients (for documents uploaded by them)
        """
        user = request.user
        document = self.get_object()
        
        if user.user_type == 'advocate':
            can_delete = (
                document.uploaded_by == user or
                (user.firm and document.firm == user.firm) or
                (document.case and (document.case.assigned_advocate == user or document.case.solo_advocate == user))
            )
            if not can_delete:
                raise PermissionDenied("You do not have permission to delete this document.")
        elif user.user_type == 'client':
            if document.uploaded_by != user:
                raise PermissionDenied("You can only delete your own uploaded documents.")
        elif user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            raise PermissionDenied("You do not have permission to delete documents.")
        
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
        
        # Return documents for this case:
        # If section == 'other', return documents in Other Documents tab.
        # Otherwise return documents in All Documents tab (excluding active unverified document requests).
        section = request.query_params.get('section', 'all')
        if section == 'other':
            queryset = UserDocument.objects.filter(case_id=case_id, is_deleted=False, is_in_other_documents=True)
        else:
            queryset = UserDocument.objects.filter(case_id=case_id, is_deleted=False, is_in_all_documents=True).exclude(
                fulfills_request__status__in=['pending', 'uploaded', 'rejected']
            )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='move-to-other')
    def move_to_other(self, request, pk=None):
        """Move document from All Documents to Other Documents"""
        document = self.get_object()
        document.is_in_all_documents = False
        document.is_in_other_documents = True
        document.is_copied = False
        document.save()
        return Response({"detail": "Document moved to Other Documents successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='copy-to-other')
    def copy_to_other(self, request, pk=None):
        """Copy document from All Documents to Other Documents"""
        document = self.get_object()
        copy_doc = UserDocument.objects.create(
            uploaded_by=request.user,
            firm=document.firm,
            client=document.client,
            case=document.case,
            document_type=document.document_type,
            document_category=document.document_category,
            document_title=f"{document.document_title or 'Document'} (Copy)",
            document_number=document.document_number,
            document_file=document.document_file,
            description=document.description,
            verification_status=document.verification_status,
            verified_by=document.verified_by,
            verified_at=document.verified_at,
            is_in_all_documents=False,
            is_in_other_documents=True,
            is_copied=True
        )
        serializer = self.get_serializer(copy_doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='move-to-all')
    def move_to_all(self, request, pk=None):
        """Move document from Other Documents back to All Documents"""
        document = self.get_object()
        document.is_in_all_documents = True
        document.is_in_other_documents = False
        document.is_copied = False
        document.save()
        return Response({"detail": "Document moved back to All Documents successfully."}, status=status.HTTP_200_OK)
    
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
