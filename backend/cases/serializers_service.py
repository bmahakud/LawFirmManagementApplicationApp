from rest_framework import serializers
from .models_service import ServiceAttempt


class ServiceAttemptSerializer(serializers.ModelSerializer):
    """Serializer for ServiceAttempt model"""
    
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Display labels for choice fields
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    service_method_display = serializers.CharField(source='get_service_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ServiceAttempt
        fields = [
            'id', 'case', 'case_title', 'case_number',
            'service_type', 'service_type_display',
            'service_date', 'service_method', 'service_method_display',
            'served_to', 'served_by', 'address',
            'status', 'status_display',
            'proof_document', 'remarks', 'next_attempt_date',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
    
    def validate(self, data):
        """Custom validation"""
        
        # If status is 'served', served_to should be provided
        if data.get('status') == 'served' and not data.get('served_to'):
            raise serializers.ValidationError({
                'served_to': 'This field is required when status is "served".'
            })
        
        # If status is unserved/returned, next_attempt_date should be provided
        if data.get('status') in ['unserved', 'returned'] and not data.get('next_attempt_date'):
            raise serializers.ValidationError({
                'next_attempt_date': 'Please specify next attempt date for unserved/returned service.'
            })
        
        # Service date should not be in future
        from django.utils import timezone
        if data.get('service_date') and data['service_date'] > timezone.now().date():
            raise serializers.ValidationError({
                'service_date': 'Service date cannot be in the future.'
            })
        
        return data


class ServiceAttemptListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing service attempts"""
    
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    service_method_display = serializers.CharField(source='get_service_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ServiceAttempt
        fields = [
            'id', 'case', 'case_number',
            'service_type', 'service_type_display',
            'service_date', 'service_method', 'service_method_display',
            'status', 'status_display',
            'served_to', 'next_attempt_date'
        ]
