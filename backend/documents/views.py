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

    def get_permissions(self):
        if self.action in ['filing_pack_manifest', 'filing_pack_items']:
            return [permissions.AllowAny()]
        return super().get_permissions()
    
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
        
        is_in_all_documents = serializer.validated_data.get('is_in_all_documents', True)
        is_in_other_documents = serializer.validated_data.get('is_in_other_documents', False)

        instance = serializer.save(
            uploaded_by=user,
            firm=firm,  # Can be None for solo advocates
            client=client,
            verification_status=verification_status,
            verified_by=verified_by,
            verified_at=verified_at,
            is_in_all_documents=is_in_all_documents,
            is_in_other_documents=is_in_other_documents
        )

        # Trigger background auto-recompilation of Master Filing Pack if this is a case document
        case_id = instance.case_id or (getattr(instance, 'case', None) and instance.case.id)
        if case_id and not (instance.document_title and 'Master Case Filing Pack' in instance.document_title):
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(case_id), user)
    
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
                if obj.case_id and not (obj.document_title and 'Master Case Filing Pack' in obj.document_title):
                    from .services.pdf_merger import trigger_auto_recompile_master_pack
                    trigger_auto_recompile_master_pack(str(obj.case_id), user)
                return
        
        serializer.save()
        if obj.case_id and not (obj.document_title and 'Master Case Filing Pack' in obj.document_title):
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(obj.case_id), user)
    
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
        
        case_id = document.case_id
        is_master = bool(document.document_title and 'Master Case Filing Pack' in document.document_title)
        document.soft_delete(user)
        
        if case_id and not is_master:
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(case_id), user)

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
        
        if document.case_id and not (document.document_title and 'Master Case Filing Pack' in document.document_title):
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(document.case_id), user)

        return Response(
            {"detail": "Document restored successfully."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def by_case(self, request):
        """Get documents for a specific case with permissions check"""
        case_id = request.query_params.get('case_id')
        
        if not case_id:
            return Response(
                {"detail": "case_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get case to check permissions
        from cases.models import Case
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            raise NotFound("Case not found.")
        
        user = request.user
        
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
        # Otherwise return documents in All Documents tab (with single Master PDF pinned at top).
        section = request.query_params.get('section', 'all')
        if section == 'other':
            queryset = UserDocument.objects.filter(
                case_id=case_id,
                is_deleted=False,
                is_in_other_documents=True
            ).exclude(
                document_title__icontains='.ltproj'
            ).exclude(
                document_file__icontains='.ltproj'
            ).order_by('-uploaded_at')
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        else:
            from .models_templates import FilledCourtForm
            
            # 1. Fetch single canonical Master Case Filing Pack
            master_docs = list(UserDocument.objects.filter(
                case_id=case_id,
                is_deleted=False,
                is_in_all_documents=True,
                document_title__icontains="Master Case Filing Pack"
            ).order_by('-updated_at', '-uploaded_at'))

            master_doc = None
            if master_docs:
                master_doc = master_docs[0]
                # Clean up any duplicate master documents if multiple exist
                if len(master_docs) > 1:
                    for dup in master_docs[1:]:
                        dup.delete()

            master_doc_data = self.get_serializer(master_doc).data if master_doc else None

            # 2. Fetch Filled Court Forms for this case
            filled_forms = FilledCourtForm.objects.filter(case_id=case_id).select_related('template', 'created_by')
            form_items = []
            for f in filled_forms:
                form_title = getattr(f.template, 'name', f"Court Form #{str(f.id)[:8]}") if getattr(f, 'template', None) else f"Court Form #{str(f.id)[:8]}"
                pdf_url = None
                if f.generated_pdf and f.generated_pdf.name:
                    try:
                        pdf_url = request.build_absolute_uri(f.generated_pdf.url)
                    except Exception:
                        pdf_url = f.generated_pdf.url

                form_items.append({
                    'id': str(f.id),
                    'document_title': form_title,
                    'document_type': 'court_form',
                    'document_type_display': 'Court Form',
                    'document_category': 'court_form',
                    'is_court_form': True,
                    'item_type': 'court_form',
                    'document_file': f.generated_pdf.name if f.generated_pdf else None,
                    'file_url': pdf_url,
                    'verification_status': 'verified',
                    'uploaded_by_name': f.created_by.get_full_name() if f.created_by else 'System / Form',
                    'uploaded_at': f.created_at.isoformat() if hasattr(f, 'created_at') and f.created_at else timezone.now().isoformat(),
                    'custom_sequence': getattr(f, 'custom_sequence', 0) or 0,
                    'is_in_all_documents': True,
                    'is_in_other_documents': False,
                    'is_deleted': False,
                    'version': 1,
                })

            # 3. Fetch other regular documents in All Documents (excluding master, .ltproj drafts, and unverified requests)
            other_docs = list(UserDocument.objects.filter(
                case_id=case_id,
                is_deleted=False,
                is_in_all_documents=True
            ).exclude(
                document_title__icontains="Master Case Filing Pack"
            ).exclude(
                document_title__icontains='.ltproj'
            ).exclude(
                document_file__icontains='.ltproj'
            ).exclude(
                fulfills_request__status__in=['pending', 'uploaded', 'rejected']
            ))

            other_docs_data = self.get_serializer(other_docs, many=True).data
            for d in other_docs_data:
                d['is_court_form'] = False
                d['item_type'] = 'document'

            # 4. Sort non-master items by custom sequence if specified, else default order
            all_non_master = form_items + other_docs_data
            has_custom = any(item.get('custom_sequence', 0) > 0 for item in all_non_master)
            if has_custom:
                sorted_non_master = sorted(
                    all_non_master,
                    key=lambda x: (
                        x.get('custom_sequence') if x.get('custom_sequence', 0) > 0 else 999990,
                        x.get('uploaded_at', '')
                    )
                )
            else:
                sorted_non_master = form_items + other_docs_data

            # If no Master PDF exists yet, but this case has at least 1 document or court form,
            # automatically generate the initial Master PDF on demand (self-healing)
            if not master_doc and (filled_forms.exists() or other_docs):
                try:
                    from .services.pdf_merger import generate_merged_case_filing_pdf
                    master_doc = generate_merged_case_filing_pdf(str(case_id), request.user)
                    if master_doc:
                        master_doc_data = self.get_serializer(master_doc).data
                except Exception as e:
                    logger.error(f"Error auto-generating initial master PDF for case {case_id}: {e}", exc_info=True)

            # 5. Master Case Filing Pack is ALWAYS pinned at the very top (index 0)
            combined_docs = ([master_doc_data] if master_doc_data else []) + sorted_non_master
            return Response(combined_docs)

    @action(detail=True, methods=['post'], url_path='move-to-other')
    def move_to_other(self, request, pk=None):
        """Move document from All Documents to Other Documents"""
        document = self.get_object()
        document.is_in_all_documents = False
        document.is_in_other_documents = True
        document.is_copied = False
        document.save()
        if document.case_id:
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(document.case_id), request.user)
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
        if document.case_id:
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(document.case_id), request.user)
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

    @action(detail=False, methods=['post'], url_path='generate-merged-pdf')
    def generate_merged_pdf(self, request):
        """
        Generates a master compiled PDF filing pack containing all case documents, photos, and court forms.
        """
        case_id = request.data.get('case_id') or request.query_params.get('case_id')
        if not case_id:
            return Response({"detail": "case_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from .services.pdf_merger import generate_merged_case_filing_pdf
            master_doc = generate_merged_case_filing_pdf(case_id, user=request.user)
            serializer = UserDocumentSerializer(master_doc, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error generating merged PDF: {e}")
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Failed to generate merged PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='filing-pack-items')
    def filing_pack_items(self, request):
        """
        Returns all compilation items (Court Forms + Evidence Documents) for a case in their current sequence order.
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response({"detail": "case_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        import json
        from .models_templates import FilledCourtForm
        
        # Load master document manifest if available to read accurate page counts
        manifest_map = {}
        master_doc = UserDocument.objects.filter(
            case_id=case_id,
            is_deleted=False,
            is_in_all_documents=True,
            document_title__icontains="Master Case Filing Pack"
        ).order_by('-updated_at').first()

        if master_doc and master_doc.verification_notes:
            try:
                parsed = json.loads(master_doc.verification_notes)
                manifest_items = parsed if isinstance(parsed, list) else parsed.get('manifest_json', parsed.get('manifest', []))
                for m in manifest_items:
                    if m.get('id'):
                        manifest_map[str(m['id'])] = m
            except Exception:
                pass

        # 1. Filled Court Forms
        forms = FilledCourtForm.objects.filter(case_id=case_id).select_related('template')
        form_list = []
        for f in forms:
            form_name = getattr(f.template, 'name', f"Court Form #{str(f.id)[:8]}") if getattr(f, 'template', None) else f"Court Form #{str(f.id)[:8]}"
            m_info = manifest_map.get(str(f.id), {})
            page_count = m_info.get('page_count', 1)

            form_list.append({
                'id': str(f.id),
                'type': 'court_form',
                'title': form_name,
                'type_display': 'Court Form',
                'format': 'FORM',
                'sequence': getattr(f, 'custom_sequence', 0) or 0,
                'page_count': page_count,
                'created_at': f.created_at.isoformat() if hasattr(f, 'created_at') and f.created_at else ''
            })

        # 2. Case Documents (PDFs & Photos)
        docs = UserDocument.objects.filter(
            case_id=case_id,
            is_deleted=False,
            is_in_all_documents=True
        ).exclude(
            document_title__icontains="Master Case Filing Pack"
        ).exclude(
            document_title__icontains=".ltproj"
        ).exclude(
            document_file__icontains=".ltproj"
        )
        
        doc_list = []
        for d in docs:
            import os
            file_ext = os.path.splitext(d.document_file.name)[1].lower() if d.document_file else ''
            item_type = 'PDF'
            if file_ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']:
                item_type = 'PHOTO'
            elif file_ext in ['.doc', '.docx', '.txt']:
                item_type = 'DOC'
            elif file_ext in ['.pdf']:
                item_type = 'PDF'
            elif file_ext:
                item_type = file_ext.replace('.', '').upper()
            else:
                item_type = 'FILE'

            m_info = manifest_map.get(str(d.id), {})
            page_count = m_info.get('page_count')
            if page_count is None:
                if item_type == 'PHOTO':
                    page_count = 1
                elif item_type == 'PDF' and d.document_file:
                    try:
                        from pypdf import PdfReader
                        d.document_file.open('rb')
                        reader = PdfReader(d.document_file)
                        page_count = len(reader.pages)
                        d.document_file.close()
                    except Exception:
                        page_count = 1
                else:
                    page_count = 1

            doc_list.append({
                'id': str(d.id),
                'type': 'document',
                'title': d.document_title or 'Untitled Document',
                'type_display': d.get_document_type_display() if hasattr(d, 'get_document_type_display') else d.document_type,
                'format': item_type,
                'sequence': getattr(d, 'custom_sequence', 0) or 0,
                'page_count': page_count,
                'created_at': d.uploaded_at.isoformat() if d.uploaded_at else ''
            })

        all_items = form_list + doc_list
        has_custom = any(item['sequence'] > 0 for item in all_items)
        if has_custom:
            sorted_items = sorted(
                all_items,
                key=lambda x: (
                    x['sequence'] if x['sequence'] > 0 else 999990,
                    x['created_at']
                )
            )
        else:
            sorted_items = form_list + doc_list

        # Compute running start_page and end_page for every item based on sequence and page counts
        total_items = len(sorted_items)
        cover_page_count = 1 if total_items <= 10 else (2 if total_items <= 25 else 3)
        current_page = cover_page_count + 1

        for idx, itm in enumerate(sorted_items, 1):
            itm['order_index'] = idx
            p_count = max(1, itm.get('page_count') or 1)
            itm['page_count'] = p_count
            itm['start_page'] = current_page
            itm['end_page'] = current_page + p_count - 1
            current_page += p_count

        return Response(sorted_items, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='reorder-filing-pack')
    def reorder_filing_pack(self, request):
        """
        Saves custom display sequence for all items in the filing pack and recompiles the Master PDF.
        """
        case_id = request.data.get('case_id')
        ordered_items = request.data.get('ordered_items', [])
        if not case_id:
            return Response({"detail": "case_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        from .models_templates import FilledCourtForm
        from django.db import transaction

        try:
            with transaction.atomic():
                from cases.models import Case
                # Phase 5: Transactionality & concurrent-reorder protection
                _ = Case.objects.select_for_update().get(id=case_id)

                for seq, item in enumerate(ordered_items, 1):
                    item_id = item.get('id') if isinstance(item, dict) else item
                    item_type = item.get('type') if isinstance(item, dict) else None
                    if not item_id:
                        continue

                    try:
                        target_seq = int(item.get('sequence', seq) if isinstance(item, dict) else seq)
                    except (ValueError, TypeError):
                        target_seq = seq

                    if item_type == 'court_form':
                        FilledCourtForm.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)
                    elif item_type == 'document':
                        UserDocument.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)
                    else:
                        c_cnt = FilledCourtForm.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)
                        if not c_cnt:
                            UserDocument.objects.filter(id=item_id, case_id=case_id).update(custom_sequence=target_seq)

                # Capture old manifest before recompilation
                old_master = UserDocument.objects.filter(
                    case_id=case_id,
                    is_deleted=False,
                    document_title__icontains="Master Case Filing Pack"
                ).order_by('-updated_at').first()
                
                old_manifest = []
                if old_master and old_master.verification_notes:
                    try:
                        import json
                        parsed = json.loads(old_master.verification_notes)
                        if isinstance(parsed, list):
                            old_manifest = parsed
                        elif isinstance(parsed, dict):
                            old_manifest = parsed.get('manifest_json', parsed.get('manifest', []))
                    except Exception:
                        old_manifest = []

                # Trigger immediate recompilation with updated order
                from .services.pdf_merger import generate_merged_case_filing_pdf
                master_doc = generate_merged_case_filing_pdf(case_id, user=request.user)

                new_manifest = []
                if master_doc and master_doc.verification_notes:
                    try:
                        import json
                        parsed = json.loads(master_doc.verification_notes)
                        if isinstance(parsed, list):
                            new_manifest = parsed
                        elif isinstance(parsed, dict):
                            new_manifest = parsed.get('manifest_json', parsed.get('manifest', []))
                    except Exception:
                        new_manifest = []

                # Phase 3: Single source of truth for the offset mapping
                page_mapping = {}
                if old_manifest and new_manifest:
                    for doc in old_manifest:
                        start = doc.get('start_page', 1)
                        end = doc.get('end_page', 1)
                        doc_id = str(doc.get('id', ''))
                        doc_title = doc.get('title', '').strip().lower()
                        new_doc = next((nd for nd in new_manifest if (nd.get('id') and str(nd.get('id')) == doc_id) or (nd.get('title') and nd.get('title').strip().lower() == doc_title)), None)
                        
                        for op in range(start, end + 1):
                            if new_doc:
                                offset = op - start
                                safe_offset = min(offset, max(0, new_doc.get('page_count', 1) - 1))
                                page_mapping[str(op)] = new_doc.get('start_page', 1) + safe_offset
                            else:
                                page_mapping[str(op)] = None

                    try:
                        from .models_versions import CaseDraftVersion
                        
                        def apply_mapping(field):
                            if isinstance(field, int):
                                new_p = page_mapping.get(str(field))
                                return new_p if new_p is not None else field
                            return field

                        doc_ident = f"doc-master-{case_id}"
                        # Phase 4: Migrate all snapshots
                        all_versions = CaseDraftVersion.objects.filter(case_id=case_id, document_identifier=doc_ident).all()
                        for ver in all_versions:
                            snap = ver.snapshot_data or {}
                            changed = False

                            for a in snap.get('anchors', []):
                                op = a.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    a['pageNumber'] = np
                                    changed = True

                            for exc in snap.get('excerpts', []):
                                op = exc.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    exc['pageNumber'] = np
                                    changed = True

                            for n in snap.get('nodes', []):
                                op = n.get('sourcePageNumber')
                                if op is not None:
                                    np = apply_mapping(op)
                                    if np != op:
                                        n['sourcePageNumber'] = np
                                        changed = True

                            for hl in snap.get('freeformHighlights', []):
                                op = hl.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    hl['pageNumber'] = np
                                    changed = True

                            for st in snap.get('inkStrokes', []):
                                op = st.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    st['pageNumber'] = np
                                    changed = True

                            for tb in snap.get('sourceTextboxes', []):
                                op = tb.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    tb['pageNumber'] = np
                                    changed = True

                            for bm in snap.get('sourceBookmarks', []):
                                op = bm.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    bm['pageNumber'] = np
                                    changed = True

                            for pe in snap.get('pageEdits', []):
                                op = pe.get('pageNumber')
                                np = apply_mapping(op)
                                if np != op:
                                    pe['pageNumber'] = np
                                    changed = True

                            v_state_by_doc = snap.get('viewerStateByDocument', {})
                            for doc_key, v_state in v_state_by_doc.items():
                                if isinstance(v_state, dict):
                                    old_rotations = v_state.get('pageRotations', {})
                                    new_rotations = {}
                                    for p_str, rot in old_rotations.items():
                                        try:
                                            p_int = int(p_str)
                                            np = apply_mapping(p_int)
                                            new_rotations[str(np)] = rot
                                            if np != p_int:
                                                changed = True
                                        except ValueError:
                                            new_rotations[p_str] = rot
                                    v_state['pageRotations'] = new_rotations

                                    active_p = v_state.get('activePage')
                                    np = apply_mapping(active_p)
                                    if np != active_p:
                                        v_state['activePage'] = np
                                        changed = True

                            if changed:
                                ver.snapshot_data = snap
                                ver.save(update_fields=['snapshot_data'])
                    except Exception as snap_err:
                        print(f"Non-fatal error remapping snapshot versions: {snap_err}")

                from .serializers import UserDocumentSerializer
                serializer = UserDocumentSerializer(master_doc, context={'request': request})
                return Response({
                    "detail": "Filing pack reordered and recompiled successfully.",
                    "master_document": serializer.data,
                    "old_manifest": old_manifest,
                    "new_manifest": new_manifest,
                    "page_mapping": page_mapping,
                    "updated_at": master_doc.updated_at.isoformat() if master_doc.updated_at else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error recompiling merged PDF after reorder: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                "detail": f"Order saved, but PDF recompilation had an issue: {str(e)}"
            }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='filing-pack-manifest', permission_classes=[permissions.AllowAny])
    def filing_pack_manifest(self, request):
        """
        Returns structured page ranges for every sub-document in the Master Case Filing Pack.
        Used by DocuMind / LiquidText to remap excerpts, ink notes, and highlights when files are rearranged.
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response({"detail": "case_id parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import uuid
            uuid.UUID(str(case_id))
        except (ValueError, TypeError):
            return Response({"manifest": []}, status=status.HTTP_200_OK)

        master_doc = UserDocument.objects.filter(
            case_id=case_id,
            is_deleted=False,
            is_in_all_documents=True,
            document_title__icontains="Master Case Filing Pack"
        ).order_by('-updated_at').first()

        if not master_doc:
            return Response({"manifest": []}, status=status.HTTP_200_OK)

        import json
        manifest = []
        if master_doc.verification_notes:
            try:
                parsed = json.loads(master_doc.verification_notes)
                if isinstance(parsed, list):
                    manifest = parsed
                elif isinstance(parsed, dict):
                    manifest = parsed.get('manifest_json', parsed.get('manifest', []))
            except Exception:
                manifest = []

        master_url = None
        if master_doc.document_file:
            try:
                master_url = request.build_absolute_uri(master_doc.document_file.url)
            except Exception:
                master_url = master_doc.document_file.url

        return Response({
            "case_id": case_id,
            "master_document_id": str(master_doc.id),
            "master_url": master_url,
            "manifest": manifest,
            "updated_at": master_doc.updated_at.isoformat() if master_doc.updated_at else None
        }, status=status.HTTP_200_OK)


