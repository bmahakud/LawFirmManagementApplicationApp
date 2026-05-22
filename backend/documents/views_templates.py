"""
ViewSets for PDF-style court form templates
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
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
        
        serializer = FilledCourtFormSerializer(filled_form)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
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
            'client_signed', 'client_signed_at',
            'advocate_signed', 'advocate_signed_at',
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
