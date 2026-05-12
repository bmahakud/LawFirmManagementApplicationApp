from rest_framework import serializers
from .models_document_requests import CaseDocumentRequest
from documents.serializers import UserDocumentListSerializer


class CaseDocumentRequestSerializer(serializers.ModelSerializer):
    """Serializer for case document requests"""
    
    requested_by_name = serializers.SerializerMethodField()
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    uploaded_document_details = UserDocumentListSerializer(
        source='uploaded_document',
        read_only=True
    )
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = CaseDocumentRequest
        fields = [
            'id',
            'case',
            'case_title',
            'case_number',
            'document_type',
            'document_title',
            'description',
            'requested_by',
            'requested_by_name',
            'status',
            'priority',
            'due_date',
            'is_overdue',
            'uploaded_document',
            'uploaded_document_details',
            'uploaded_at',
            'advocate_notes',
            'client_notes',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'requested_by',
            'uploaded_at',
            'created_at',
            'updated_at',
        ]
    
    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name()
        return None
    
    def get_is_overdue(self, obj):
        if obj.due_date and obj.status == 'pending':
            from django.utils import timezone
            return obj.due_date < timezone.now().date()
        return False


class CaseDocumentRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating document requests"""
    
    class Meta:
        model = CaseDocumentRequest
        fields = [
            'case',
            'document_type',
            'document_title',
            'description',
            'priority',
            'due_date',
            'advocate_notes',
        ]
    
    def validate_case(self, value):
        """Ensure the advocate has access to this case"""
        user = self.context['request'].user
        
        # Check if user is the assigned advocate or has access to the case
        if user.user_type == 'advocate':
            if value.assigned_advocate != user and value.solo_advocate != user:
                raise serializers.ValidationError(
                    "You can only create document requests for cases assigned to you."
                )
        elif user.user_type in ['admin', 'super_admin']:
            if value.firm != user.firm:
                raise serializers.ValidationError(
                    "You can only create document requests for cases in your firm."
                )
        elif user.user_type != 'platform_owner':
            raise serializers.ValidationError(
                "You do not have permission to create document requests."
            )
        
        return value
