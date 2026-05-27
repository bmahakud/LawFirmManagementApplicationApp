"""
ViewSets for PDF-style court form templates
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone

from .models_templates import CourtFormTemplate, FilledCourtForm
from .serializers_templates import (
    CourtFormTemplateSerializer,
    FilledCourtFormSerializer,
    FilledCourtFormCreateSerializer
)
from cases.models import Case
from clients.models import Client


class CourtFormTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing court form templates
    """
    queryset = CourtFormTemplate.objects.filter(is_active=True)
    serializer_class = CourtFormTemplateSerializer
    permission_classes = [IsAuthenticated]
    
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
        ).order_by('effective_sequence', 'template__name')
        
        field_values = filled_form.field_values or {}
        
        # Clear existing table fields
        for k in list(field_values.keys()):
            if k.startswith(('sl_no_', 'desc_', 'page_')):
                del field_values[k]
        
        current_page = 1
        has_petition_started = False
        
        for i, form in enumerate(other_forms):
            idx = i + 1
            field_values[f"sl_no_{i}"] = f"{idx:02d}."
            
            name = form.template.name.upper()
            page_val = ""
            desc = name
            
            if "SYNOPSIS" in name:
                desc = "APPENDIX-I\nSYNOPSIS"
                page_val = "A"
            elif "LIST OF DATES" in name:
                desc = "APPENDIX-II\nLIST OF DATES & EVENTS"
                page_val = "B"
            elif "PETITION" in name:
                desc = name.split('(')[0].strip()
                # Petition always starts at page 1 as per image 1
                page_val = "1 to 7" # Default range, can be manual edit later
                current_page = 8
                has_petition_started = True
            elif "VAKALATNAMA" in name:
                desc = "VAKALATNAMA"
                page_val = "" # Vakalatnama is usually at the end without a page number listed
            elif "LIST OF DOCUMENTS" in name:
                desc = "LIST OF DOCUMENTS"
                # If petition hasn't started yet, these shouldn't show numbers or show A, B?
                # Usually List of Docs follows the Petition
                if has_petition_started:
                    page_val = str(current_page)
                    current_page += 1
                else:
                    page_val = ""
            else:
                # Other documents (like Annexures)
                if has_petition_started:
                    # Annexures typically have ranges like 8-13, 14-15
                    # For now we use incremental numbering as a proxy
                    next_page = current_page + 2 # Assume average 2-3 pages for annexures
                    page_val = f"{current_page}-{next_page}"
                    current_page = next_page + 1
                else:
                    page_val = ""

            field_values[f"desc_{i}"] = desc
            field_values[f"page_{i}"] = page_val
            
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
        
        from .utils_pdf import PDFService
        pdf_bytes = PDFService.merge_case_forms(case)
        
        if not pdf_bytes:
            return Response({'error': 'Could not generate PDF'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Case_{case.case_number}_Filing_Pack.pdf"'
        return response
    
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
    
    @action(detail=True, methods=['post'])
    def generate_pdf(self, request, pk=None):
        """Generate PDF from filled form"""
        filled_form = self.get_object()
        
        # TODO: Implement PDF generation using ReportLab or WeasyPrint
        # For now, return success message
        
        return Response({
            'message': 'PDF generation will be implemented',
            'form_id': str(filled_form.id)
        })
    
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
