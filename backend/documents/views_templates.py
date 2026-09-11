"""
ViewSets for PDF-style court form templates
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import models
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone

from .models_templates import CourtFormTemplate, FilledCourtForm, CaseSignature
from .serializers_templates import (
    CourtFormTemplateSerializer,
    FilledCourtFormSerializer,
    FilledCourtFormCreateSerializer,
    CaseSignatureSerializer
)
from cases.models import Case
from clients.models import Client
import logging

logger = logging.getLogger(__name__)


class CourtFormTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing court form templates
    """
    queryset = CourtFormTemplate.objects.filter(is_active=True)
    serializer_class = CourtFormTemplateSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Return ALL templates — never truncate by page size
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(description__icontains=search)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a template"""
        template = self.get_object()
        
        new_template = CourtFormTemplate.objects.create(
            name=f"{template.name} (Copy)",
            description=template.description,
            category=template.category,
            content_structure=template.content_structure,
            default_field_mappings=template.default_field_mappings,
            created_by=request.user
        )
        
        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FilledCourtFormViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing filled court forms
    """
    queryset = FilledCourtForm.objects.all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['pdf', 'docx_html', 'download_master_pdf', 'preview_filing_pack']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    
    def get_serializer_class(self):
        if self.action == 'create':
            return FilledCourtFormCreateSerializer
        return FilledCourtFormSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on user role (user_type in CustomUser model)
        user_type = getattr(user, 'user_type', None)
        
        if user_type == 'client':
            # Clients see ONLY forms that have been shared with them
            queryset = queryset.filter(
                client__user_account=user,
                is_shared_with_client=True
            )
        elif user_type == 'advocate':
            # Advocates see forms from their cases
            queryset = queryset.filter(case__assigned_advocate=user)
        elif user_type == 'paralegal':
            # Paralegals see forms from their cases
            queryset = queryset.filter(case__assigned_paralegal=user)
        elif user_type in ['admin', 'super_admin', 'platform_owner']:
            # Admins see all forms in their firm
            if hasattr(user, 'firm') and user.firm:
                queryset = queryset.filter(case__firm=user.firm)
        
        # Filter by case
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('template', 'case', 'client', 'created_by')
    
    def update(self, request, *args, **kwargs):
        """Custom update to handle partial updates properly"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Allow updating only field_values and status
        data = {}
        if 'field_values' in request.data:
            data['field_values'] = request.data['field_values']
            placed_sigs = request.data['field_values'].get('placed_signatures') if isinstance(request.data['field_values'], dict) else None
            if isinstance(placed_sigs, list):
                has_adv = any(ps.get('type') == 'advocate' and ps.get('image_url') for ps in placed_sigs if isinstance(ps, dict))
                if has_adv and not instance.advocate_signed:
                    instance.advocate_signed = True
                    instance.advocate_signature_date = timezone.now()
                    instance.save(update_fields=['advocate_signed', 'advocate_signature_date'])
        if 'status' in request.data:
            data['status'] = request.data['status']
        
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.case_id:
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(instance.case_id), self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.case_id:
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(instance.case_id), self.request.user)

    def perform_destroy(self, instance):
        case_id = instance.case_id
        instance.delete()
        if case_id:
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(case_id), self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_from_template(self, request):
        """
        Create a new filled form from a template
        Auto-populates fields from case/client data
        """
        template_id = request.data.get('template_id')
        case_id = request.data.get('case_id')
        
        if not template_id or not case_id:
            return Response(
                {'error': 'template_id and case_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        template = get_object_or_404(CourtFormTemplate, id=template_id)
        case = get_object_or_404(Case, id=case_id)
        
        # Initialize filled content from template structure
        filled_content = template.content_structure.copy()
        
        # Auto-populate field values from case/client data
        field_values = {}
        if template.default_field_mappings:
            for field_name, mapping_path in template.default_field_mappings.items():
                value = self._extract_value(case, case.client, mapping_path)
                if value:
                    field_values[field_name] = value
        
        # Create filled form
        filled_form = FilledCourtForm.objects.create(
            template=template,
            case=case,
            client=case.client,
            filled_content=filled_content,
            field_values=field_values,
            status='draft',
            created_by=request.user
        )
        
        # Auto-populate INDEX data if it's an index template
        if "INDEX" in template.name.upper():
            self._populate_index_data(filled_form)
        
        if filled_form.case_id:
            from .services.pdf_merger import trigger_auto_recompile_master_pack
            trigger_auto_recompile_master_pack(str(filled_form.case_id), request.user)
        
        serializer = FilledCourtFormSerializer(filled_form)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def refresh_index(self, request, pk=None):
        """Refresh index table data from current case forms"""
        filled_form = self.get_object()
        if "INDEX" not in filled_form.template.name.upper():
            return Response(
                {'error': 'This is not an index form'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        self._populate_index_data(filled_form)
        serializer = self.get_serializer(filled_form)
        return Response(serializer.data)

    def _populate_index_data(self, filled_form):
        """Helper to populate index table with other forms and auto-calculate page ranges"""
        case = filled_form.case
        # Get all drafting workspace forms for this case
        # Use custom_sequence if set (>0), otherwise fallback to template sequence
        other_forms = FilledCourtForm.objects.filter(
            case=case,
            template__category='drafting'
        ).exclude(id=filled_form.id).select_related('template').annotate(
            effective_sequence=models.Case(
                models.When(custom_sequence__gt=0, then=models.F('custom_sequence')),
                default=models.F('template__sequence'),
                output_field=models.IntegerField()
            )
        ).order_by('effective_sequence', '-updated_at')
        
        field_values = filled_form.field_values or {}
        
        # Clear existing table fields
        for k in list(field_values.keys()):
            if k.startswith(('sl_no_', 'desc_', 'page_')):
                del field_values[k]
        
        current_page = 2  # Index is page 1, so the next document starts at page 2
        
        for i, form in enumerate(other_forms):
            idx = i + 1
            field_values[f"sl_no_{i}"] = f"{idx:02d}."
            
            name = form.template.name.upper()
            desc = name
            
            # Special formatting for certain types
            if "SYNOPSIS" in name:
                desc = "APPENDIX-I\nSYNOPSIS"
            elif "LIST OF DATES" in name:
                desc = "APPENDIX-II\nLIST OF DATES & EVENTS"
            elif "PETITION" in name:
                desc = name.split('(')[0].strip()
            elif "VAKALATNAMA" in name:
                desc = "VAKALATNAMA"
            
            # Direct page mapping based on sequence
            field_values[f"desc_{i}"] = desc
            field_values[f"page_{i}"] = str(current_page)
            
            # Simple assumption: 1 document = 1 page for now in the filing pack preview
            current_page += 1
            
        filled_form.field_values = field_values
        filled_form.save()

    @action(detail=True, methods=['post'])
    def update_priority(self, request, pk=None):
        """Update document priority and refresh associated index"""
        filled_form = self.get_object()
        priority = request.data.get('priority')
        
        if priority is not None:
            filled_form.custom_sequence = int(priority)
            filled_form.save()
            
            # Find associated index form for this case and refresh it
            index_form = FilledCourtForm.objects.filter(
                case=filled_form.case,
                template__name__icontains='INDEX'
            ).first()
            
            if index_form:
                self._populate_index_data(index_form)
            
            return Response({'status': 'priority updated'})
        
        return Response({'error': 'priority required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def download_master_pdf(self, request):
        """Download a merged PDF of all documents in a case's filing pack"""
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response({'error': 'case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        from cases.models import Case
        case = get_object_or_404(Case, id=case_id)
        
        try:
            from .utils_pdf import PDFService
            pdf_bytes = PDFService.merge_case_forms(case)
            
            if not pdf_bytes:
                return Response({'error': 'Could not generate PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Case_{case.case_number}_Filing_Pack.pdf"'
            return response
        except Exception as e:
            logger.error(f"Error in download_master_pdf for case {case_id}: {e}", exc_info=True)
            return Response({'error': f'Failed to generate PDF: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def preview_filing_pack(self, request):
        """
        Returns the sorted form order and index data for the filing pack preview.
        This uses the SAME sorting and page counting logic as download_master_pdf,
        so the preview will always match the downloaded PDF.
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response({'error': 'case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from cases.models import Case
        case = get_object_or_404(Case, id=case_id)
        
        try:
            from .utils_pdf import PDFService
            preview_data = PDFService.get_preview_data(case)
            
            if not preview_data:
                return Response({'error': 'No documents found'}, status=status.HTTP_404_NOT_FOUND)
            
            return Response(preview_data)
        except Exception as e:
            logger.error(f"Error in preview_filing_pack for case {case_id}: {e}", exc_info=True)
            return Response({'error': f'Failed to generate preview: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
    @action(detail=True, methods=['post'])
    def share_with_client(self, request, pk=None):
        """Share form with client"""
        filled_form = self.get_object()
        filled_form.is_shared_with_client = True
        filled_form.shared_at = timezone.now()
        filled_form.save()
        
        serializer = self.get_serializer(filled_form)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """Sign the form (advocate or client) with optional signature image"""
        filled_form = self.get_object()
        user = request.user
        user_type = getattr(user, 'user_type', None)
        
        # Get signature image if provided
        signature_file = request.FILES.get('signature')
        
        if user_type in ['advocate', 'admin', 'super_admin', 'platform_owner']:
            filled_form.advocate_signed = True
            filled_form.advocate_signature_date = timezone.now()
            if signature_file:
                filled_form.advocate_signature_image = signature_file
        elif user_type == 'client':
            filled_form.client_signed = True
            filled_form.client_signature_date = timezone.now()
            if signature_file:
                filled_form.client_signature_image = signature_file
        else:
            return Response(
                {'error': 'You do not have permission to sign this form'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        filled_form.save()
        serializer = self.get_serializer(filled_form)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def docx_html(self, request, pk=None):
        """
        Returns the official court form HTML with interactive editable inputs.
        """
        try:
            from django.shortcuts import get_object_or_404
            from django.http import HttpResponse
            from django.views.decorators.clickjacking import xframe_options_exempt
            from .services.court_form_html_engine import render_form_html

            filled_form = get_object_or_404(FilledCourtForm, id=pk)
            template = filled_form.template
            tpl_name = template.name if template else ''
            field_values = filled_form.field_values or {}

            rendered_html = render_form_html(tpl_name, field_values=field_values, is_edit_mode=True, form_obj=filled_form)
            if not rendered_html:
                cs = getattr(filled_form, 'filled_content', None) or (getattr(template, 'content_structure', None) if template else None)
                if cs and isinstance(cs, dict) and cs.get('sections'):
                    from .services.court_form_html_engine import render_structured_form_html
                    rendered_html = render_structured_form_html(cs, field_values=field_values, is_edit_mode=True, form_obj=filled_form)

            if not rendered_html:
                return Response({'error': f'Template HTML not found for {tpl_name}'}, status=status.HTTP_404_NOT_FOUND)

            response = HttpResponse(rendered_html, content_type='text/html; charset=utf-8')
            response['X-Frame-Options'] = 'ALLOWALL'
            response.xframe_options_exempt = True
            return response
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def pdf(self, request, pk=None):
        """Returns the rendered A4 PDF for this filled court form"""
        from django.shortcuts import get_object_or_404
        filled_form = get_object_or_404(FilledCourtForm, id=pk)
        from .services.pdf_merger import generate_court_form_pdf
        from django.http import HttpResponse
        pdf_bytes = generate_court_form_pdf(filled_form)
        if not pdf_bytes:
            return Response({'error': 'Could not generate form PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"{filled_form.template.name if filled_form.template else 'Form'}.pdf".replace(' ', '_')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['X-Frame-Options'] = 'ALLOWALL'
        response.xframe_options_exempt = True
        return response

    @action(detail=True, methods=['post'])
    def generate_pdf(self, request, pk=None):
        """Generate and save PDF from filled form"""
        filled_form = self.get_object()
        from .services.pdf_merger import generate_court_form_pdf
        from django.core.files.base import ContentFile
        pdf_bytes = generate_court_form_pdf(filled_form)
        if pdf_bytes:
            filename = f"form_{filled_form.id}.pdf"
            filled_form.generated_pdf.save(filename, ContentFile(pdf_bytes), save=True)
            if filled_form.case_id:
                from .services.pdf_merger import trigger_auto_recompile_master_pack
                trigger_auto_recompile_master_pack(str(filled_form.case_id), request.user)
            return Response({
                'message': 'PDF generated successfully',
                'pdf_url': filled_form.generated_pdf.url if filled_form.generated_pdf else None,
                'form_id': str(filled_form.id)
            })
        return Response({'error': 'Could not generate form PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _extract_value(self, case, client, mapping_path):
        """Extract value from case or client using dot notation"""
        try:
            parts = mapping_path.split('.')
            if parts[0] == 'case':
                obj = case
            elif parts[0] == 'client':
                obj = client
            else:
                return None
            
            for part in parts[1:]:
                obj = getattr(obj, part, None)
                if obj is None:
                    return None
            
            if hasattr(obj, 'strftime'):
                return obj.strftime('%d/%m/%Y')
            
            return str(obj) if obj else None
        except:
            return None



# Original template system ViewSets (for backward compatibility)
from .models_templates import DocumentTemplate, FilledTemplate
from rest_framework import serializers


class DocumentTemplateSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'template_file', 'file_size_kb', 'template_fields',
            'is_active', 'is_public', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'file_size_kb']


class FilledTemplateSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_category = serializers.CharField(source='template.category', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = FilledTemplate
        fields = [
            'id', 'template', 'template_name', 'template_category',
            'case', 'case_number', 'client', 'client_name', 'firm',
            'filled_data', 'generated_file', 'status', 'status_display',
            'is_shared_with_client', 'shared_at',
            'client_signed', 'client_signed_at', 'client_signature_image',
            'advocate_signed', 'advocate_signed_at', 'advocate_signature_image',
            'notes', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for original document templates"""
    queryset = DocumentTemplate.objects.filter(is_active=True)
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class FilledTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for filled templates"""
    queryset = FilledTemplate.objects.all()
    serializer_class = FilledTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        user_type = getattr(user, 'user_type', None)
        
        # Filter based on user role
        if user_type == 'client':
            queryset = queryset.filter(client__user_account=user)
        elif user_type == 'advocate':
            queryset = queryset.filter(case__assigned_advocate=user)
        elif user_type in ['admin', 'super_admin']:
            if hasattr(user, 'firm') and user.firm:
                queryset = queryset.filter(firm=user.firm)
        
        # Filter by case
        case_id = self.request.query_params.get('case')
        if case_id:
            queryset = queryset.filter(case_id=case_id)
        
        return queryset.select_related('template', 'case', 'client')
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share template with client"""
        filled = self.get_object()
        filled.is_shared_with_client = True
        filled.shared_at = timezone.now()
        filled.save()
        return Response(self.get_serializer(filled).data)

    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """Sign the form (advocate or client) with optional signature image"""
        filled_form = self.get_object()
        user = request.user
        user_type = getattr(user, 'user_type', None)
        
        # Get signature image if provided
        signature_file = request.FILES.get('signature')
        
        if user_type in ['advocate', 'admin', 'super_admin', 'platform_owner']:
            filled_form.advocate_signed = True
            filled_form.advocate_signed_at = timezone.now()
            if signature_file:
                filled_form.advocate_signature_image = signature_file
        elif user_type == 'client':
            filled_form.client_signed = True
            filled_form.client_signed_at = timezone.now()
            if signature_file:
                filled_form.client_signature_image = signature_file
        else:
            return Response(
                {'error': 'You do not have permission to sign this form'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        filled_form.save()
        serializer = self.get_serializer(filled_form)
        return Response(serializer.data)


class CaseSignatureViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing case-specific saved signatures.
    Each signature belongs strictly to a case (case_id).
    Supports uploading files or base64 data URLs, renaming, and deleting.
    """
    queryset = CaseSignature.objects.all()
    serializer_class = CaseSignatureSerializer
    pagination_class = None

    def get_permissions(self):
        if not self.request.user.is_authenticated:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        qp = getattr(self.request, 'query_params', None)
        if qp is None:
            qp = getattr(self.request, 'GET', {})
        case_id = qp.get('case') or qp.get('case_id')

        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            if case_id:
                return queryset.filter(case_id=case_id).select_related('case', 'created_by')
            return queryset.select_related('case', 'created_by')

        if case_id:
            return queryset.filter(case_id=case_id).select_related('case', 'created_by')
        # Strictly isolate signatures by case - never list signatures without case filter
        return queryset.none()

    def create(self, request, *args, **kwargs):
        import base64
        from django.core.files.base import ContentFile
        import uuid

        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)

        # Allow case_id or case
        case_id = data.get('case') or data.get('case_id')
        if not case_id:
            return Response({'error': 'case or case_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from cases.models import Case
        try:
            case_obj = Case.objects.get(id=case_id)
        except (Case.DoesNotExist, ValueError, Exception):
            return Response({'error': f'Case with id {case_id} not found'}, status=status.HTTP_404_NOT_FOUND)
        data['case'] = case_obj.id

        # Convert base64 data URL if provided in image, data_url, or image_data
        raw_image = data.get('image') or data.get('data_url') or data.get('image_data')
        if isinstance(raw_image, str) and raw_image.startswith('data:image'):
            try:
                format_part, imgstr = raw_image.split(';base64,')
                ext = format_part.split('/')[-1].lower()
                if ext == 'jpeg':
                    ext = 'jpg'
                elif ext.startswith('svg'):
                    ext = 'svg'
                elif not ext or ext not in ['png', 'jpg', 'webp']:
                    ext = 'png'
                file_name = f"sig_{uuid.uuid4().hex[:10]}.{ext}"
                decoded_file = ContentFile(base64.b64decode(imgstr), name=file_name)
                data['image'] = decoded_file
            except Exception as e:
                logger.error(f"Failed to decode base64 signature image: {e}")
                return Response({'error': f'Invalid base64 image: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(
            created_by=request.user if request.user.is_authenticated else None
        )
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

