"""
Views for Document Templates
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from .models_templates import DocumentTemplate, FilledTemplate
from .serializers_templates import (
    DocumentTemplateSerializer,
    FilledTemplateSerializer,
    FilledTemplateListSerializer
)


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing document templates
    
    Endpoints:
    - GET /api/documents/templates/ - List all templates
    - GET /api/documents/templates/{id}/ - Get template details
    - POST /api/documents/templates/ - Create template (Platform Owner/Super Admin)
    - PUT/PATCH /api/documents/templates/{id}/ - Update template
    - DELETE /api/documents/templates/{id}/ - Delete template
    """
    serializer_class = DocumentTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination to show all templates
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['name', 'category', 'created_at']
    ordering = ['category', 'name']
    
    def get_queryset(self):
        user = self.request.user
        
        # Platform Owner sees all templates
        if user.user_type == 'platform_owner':
            return DocumentTemplate.objects.all()
        
        # Others see only active and public templates
        queryset = DocumentTemplate.objects.filter(is_active=True, is_public=True)
        
        # Filter by category if provided
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='for-case')
    def templates_for_case(self, request):
        """
        Get available templates for a specific case
        
        GET /api/documents/templates/for-case/?case_id=uuid
        Returns templates suitable for the case type
        """
        case_id = request.query_params.get('case_id')
        
        if case_id:
            # Optionally filter templates based on case type
            # For now, return all active templates
            from cases.models import Case
            try:
                case = Case.objects.get(id=case_id)
                # You can add logic here to filter templates by case type
                # For example: if case.case_type == 'criminal', show criminal forms
            except Case.DoesNotExist:
                return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        
        templates = self.get_queryset()
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class FilledTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing filled templates
    
    Endpoints:
    - GET /api/documents/filled-templates/ - List filled templates
    - GET /api/documents/filled-templates/{id}/ - Get filled template details
    - POST /api/documents/filled-templates/ - Create filled template
    - PUT/PATCH /api/documents/filled-templates/{id}/ - Update filled template
    - DELETE /api/documents/filled-templates/{id}/ - Delete filled template
    - POST /api/documents/filled-templates/{id}/share/ - Share with client
    - POST /api/documents/filled-templates/{id}/sign/ - Sign template
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['template__name', 'client__first_name', 'client__last_name', 'case__case_number']
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FilledTemplateListSerializer
        return FilledTemplateSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type == 'platform_owner':
            return FilledTemplate.objects.all()
        
        elif user.user_type in ['super_admin', 'admin', 'advocate', 'paralegal']:
            # Firm members see their firm's filled templates
            return FilledTemplate.objects.filter(firm=user.firm)
        
        elif user.user_type == 'client':
            # Clients see only templates shared with them
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return FilledTemplate.objects.filter(
                    client=client_profile,
                    is_shared_with_client=True
                )
        
        return FilledTemplate.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            created_by=user,
            firm=user.firm if user.firm else None
        )
    
    @action(detail=False, methods=['post'], url_path='upload-filled')
    def upload_filled(self, request):
        """
        Upload a pre-filled form document
        
        POST /api/documents/filled-templates/upload-filled/
        Body: FormData with file, case_id, client_id, template_id (optional)
        """
        file = request.FILES.get('file')
        case_id = request.data.get('case_id')
        client_id = request.data.get('client_id')
        template_id = request.data.get('template_id')
        notes = request.data.get('notes', '')
        
        if not file:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not case_id:
            return Response({'error': 'case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not client_id:
            return Response({'error': 'client_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create a generic "Uploaded Form" template if no template specified
        if template_id:
            try:
                template = DocumentTemplate.objects.get(id=template_id)
            except DocumentTemplate.DoesNotExist:
                return Response({'error': 'Template not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Create/get a generic template for uploaded forms
            template, _ = DocumentTemplate.objects.get_or_create(
                name='Uploaded Form',
                category='other',
                defaults={
                    'description': 'Generic template for uploaded forms',
                    'is_public': True,
                    'created_by': request.user
                }
            )
        
        # Create filled template with uploaded file
        filled_template = FilledTemplate.objects.create(
            template=template,
            case_id=case_id,
            client_id=client_id,
            firm=request.user.firm,
            generated_file=file,
            status='completed',
            notes=notes,
            created_by=request.user
        )
        
        serializer = FilledTemplateSerializer(filled_template)
        return Response({
            'message': 'Form uploaded successfully',
            'filled_template': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """
        Share filled template with client
        
        POST /api/documents/filled-templates/{id}/share/
        """
        filled_template = self.get_object()
        
        # Only advocate, admin, or super_admin can share
        if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
            return Response(
                {'error': 'Only advocates and admins can share templates'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        filled_template.share_with_client()
        
        serializer = self.get_serializer(filled_template)
        return Response({
            'message': f'Template "{filled_template.template.name}" shared with {filled_template.client.get_full_name()}',
            'filled_template': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """
        Sign the filled template
        
        POST /api/documents/filled-templates/{id}/sign/
        {
            "signature_type": "client" or "advocate"
        }
        """
        filled_template = self.get_object()
        signature_type = request.data.get('signature_type')
        
        if signature_type == 'client':
            # Client signing
            if request.user.user_type != 'client':
                return Response(
                    {'error': 'Only clients can sign as client'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            filled_template.mark_client_signed()
            message = 'Template signed by client successfully'
        
        elif signature_type == 'advocate':
            # Advocate signing
            if request.user.user_type not in ['advocate', 'admin', 'super_admin']:
                return Response(
                    {'error': 'Only advocates can sign as advocate'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            filled_template.mark_advocate_signed()
            message = 'Template signed by advocate successfully'
        
        else:
            return Response(
                {'error': 'signature_type must be "client" or "advocate"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(filled_template)
        return Response({
            'message': message,
            'filled_template': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def my_templates(self, request):
        """
        Get templates for the current user
        
        GET /api/documents/filled-templates/my_templates/
        - Advocates see templates they created
        - Clients see templates shared with them
        """
        user = request.user
        
        if user.user_type == 'client':
            client_profile = getattr(user, 'client_profile', None)
            if not client_profile:
                return Response({'error': 'Client profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
            templates = FilledTemplate.objects.filter(
                client=client_profile,
                is_shared_with_client=True
            )
        
        elif user.user_type in ['advocate', 'admin', 'super_admin']:
            templates = FilledTemplate.objects.filter(created_by=user)
        
        else:
            templates = FilledTemplate.objects.none()
        
        # Filter by status if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            templates = templates.filter(status=status_filter)
        
        # Filter by case if provided
        case_id = request.query_params.get('case_id')
        if case_id:
            templates = templates.filter(case_id=case_id)
        
        serializer = FilledTemplateListSerializer(templates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_case(self, request):
        """
        Get all filled templates for a specific case
        
        GET /api/documents/filled-templates/by_case/?case_id=uuid
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response({'error': 'case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        templates = self.get_queryset().filter(case_id=case_id)
        serializer = FilledTemplateListSerializer(templates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='case-stats')
    def case_stats(self, request):
        """
        Get form statistics for a case
        
        GET /api/documents/filled-templates/case-stats/?case_id=uuid
        Returns: {all: 4, pending: 0, completed: 3, draft: 1}
        """
        case_id = request.query_params.get('case_id')
        if not case_id:
            return Response({'error': 'case_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        templates = self.get_queryset().filter(case_id=case_id)
        
        stats = {
            'all': templates.count(),
            'draft': templates.filter(status='draft').count(),
            'completed': templates.filter(status='completed').count(),
            'shared': templates.filter(status='shared').count(),
            'signed': templates.filter(status='signed').count(),
            'filed': templates.filter(status='filed').count(),
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download the generated form file
        
        GET /api/documents/filled-templates/{id}/download/
        """
        from django.http import FileResponse
        
        filled_template = self.get_object()
        
        if not filled_template.generated_file:
            return Response(
                {'error': 'No generated file available for this form'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return FileResponse(
            filled_template.generated_file.open('rb'),
            as_attachment=True,
            filename=f"{filled_template.template.name}_{filled_template.id}.pdf"
        )
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """
        Preview the form (returns URL or data)
        
        GET /api/documents/filled-templates/{id}/preview/
        """
        filled_template = self.get_object()
        
        if filled_template.generated_file:
            file_url = request.build_absolute_uri(filled_template.generated_file.url)
        else:
            file_url = None
        
        return Response({
            'id': filled_template.id,
            'template_name': filled_template.template.name,
            'filled_data': filled_template.filled_data,
            'file_url': file_url,
            'status': filled_template.status,
            'created_at': filled_template.created_at,
        })
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Get form history/audit trail
        
        GET /api/documents/filled-templates/{id}/history/
        """
        filled_template = self.get_object()
        
        history = [
            {
                'action': 'Created',
                'timestamp': filled_template.created_at,
                'user': filled_template.created_by.get_full_name() if filled_template.created_by else None,
            }
        ]
        
        if filled_template.shared_at:
            history.append({
                'action': 'Shared with client',
                'timestamp': filled_template.shared_at,
                'user': filled_template.created_by.get_full_name() if filled_template.created_by else None,
            })
        
        if filled_template.client_signed_at:
            history.append({
                'action': 'Signed by client',
                'timestamp': filled_template.client_signed_at,
                'user': filled_template.client.get_full_name(),
            })
        
        if filled_template.advocate_signed_at:
            history.append({
                'action': 'Signed by advocate',
                'timestamp': filled_template.advocate_signed_at,
                'user': filled_template.created_by.get_full_name() if filled_template.created_by else None,
            })
        
        history.append({
            'action': 'Last updated',
            'timestamp': filled_template.updated_at,
            'user': None,
        })
        
        return Response({'history': history})
