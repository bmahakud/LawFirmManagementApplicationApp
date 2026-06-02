"""
Serializers for PDF-style court form templates
"""
from rest_framework import serializers
from .models_templates import CourtFormTemplate, FilledCourtForm


class CourtFormTemplateSerializer(serializers.ModelSerializer):
    """Serializer for court form templates"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CourtFormTemplate
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'content_structure', 'default_field_mappings', 'sequence',
            'is_active', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FilledCourtFormSerializer(serializers.ModelSerializer):
    """Serializer for filled court forms"""
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_category = serializers.CharField(source='template.category', read_only=True)
    template_sequence = serializers.IntegerField(source='template.sequence', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = FilledCourtForm
        fields = [
            'id', 'template', 'template_name', 'template_category',
            'case', 'case_number', 'client', 'client_name',
            'filled_content', 'field_values', 'status', 'status_display',
            'custom_sequence',
            'advocate_signed', 'advocate_signature_date', 'advocate_signature_image',
            'client_signed', 'client_signature_date', 'client_signature_image',
            'is_digitally_signed', 'digital_signature_details',
            'is_shared_with_client', 'shared_at', 'template_sequence',
            'generated_pdf', 'created_at', 'updated_at',
            'created_by', 'created_by_name'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'generated_pdf',
            'template_name', 'template_category', 'case_number', 
            'client_name', 'status_display', 'created_by_name'
        ]
        extra_kwargs = {
            'template': {'required': False},
            'case': {'required': False},
            'client': {'required': False},
            'filled_content': {'required': False},
        }


class FilledCourtFormCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating filled court forms"""
    
    class Meta:
        model = FilledCourtForm
        fields = [
            'template', 'case', 'client',
            'filled_content', 'field_values', 'status',
            'is_digitally_signed', 'digital_signature_details'
        ]
    
    def create(self, validated_data):
        # Auto-populate from case/client data if template has mappings
        template = validated_data['template']
        case = validated_data['case']
        client = validated_data['client']
        
        # Apply default field mappings
        if template.default_field_mappings:
            field_values = validated_data.get('field_values', {})
            for field_name, mapping_path in template.default_field_mappings.items():
                if field_name not in field_values:
                    # Extract value from case/client using mapping path
                    value = self._extract_value(case, client, mapping_path)
                    if value:
                        field_values[field_name] = value
            validated_data['field_values'] = field_values
        
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
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
