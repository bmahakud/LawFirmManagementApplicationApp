"""
Serializers for Pre-Litigation features
"""
from rest_framework import serializers
from .models_prelitigation import (
    DocumentChecklist,
    CaseDocumentChecklistItem,
    CaseResearch,
    LegalNotice
)


class DocumentChecklistSerializer(serializers.ModelSerializer):
    """Serializer for document checklist templates"""
    case_type_display = serializers.CharField(source='get_case_type_display', read_only=True)
    
    class Meta:
        model = DocumentChecklist
        fields = [
            'id', 'case_type', 'case_type_display', 'document_name',
            'description', 'is_mandatory', 'display_order',
            'created_at', 'updated_at'
        ]


class CaseDocumentChecklistItemSerializer(serializers.ModelSerializer):
    """Serializer for case-specific document checklist items"""
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    uploaded_document_name = serializers.CharField(source='uploaded_document.file_name', read_only=True)
    
    class Meta:
        model = CaseDocumentChecklistItem
        fields = [
            'id', 'case', 'case_number', 'checklist_template',
            'document_name', 'description', 'is_mandatory',
            'status', 'status_display',
            'uploaded_document', 'uploaded_document_name',
            'requested_date', 'received_date', 'verified_date',
            'verified_by', 'verified_by_name',
            'notes', 'reminder_sent', 'last_reminder_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Custom validation"""
        status = data.get('status')
        
        # If status is verified, verified_by should be set
        if status == 'verified' and not data.get('verified_by'):
            raise serializers.ValidationError({
                'verified_by': 'This field is required when status is "verified".'
            })
        
        # If status is rejected, notes should explain why
        if status == 'rejected' and not data.get('notes'):
            raise serializers.ValidationError({
                'notes': 'Please provide reason for rejection.'
            })
        
        return data


class CaseDocumentChecklistItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing checklist items"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = CaseDocumentChecklistItem
        fields = [
            'id', 'document_name', 'is_mandatory',
            'status', 'status_display', 'received_date'
        ]


class CaseResearchSerializer(serializers.ModelSerializer):
    """Serializer for case research notes"""
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    research_type_display = serializers.CharField(source='get_research_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CaseResearch
        fields = [
            'id', 'case', 'case_number',
            'research_type', 'research_type_display',
            'title', 'content',
            'case_citation', 'court_name', 'judgment_date',
            'act_name', 'section_number',
            'reference_document',
            'is_favorable', 'relevance_score',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class CaseResearchListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing research notes"""
    research_type_display = serializers.CharField(source='get_research_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CaseResearch
        fields = [
            'id', 'research_type', 'research_type_display',
            'title', 'is_favorable', 'relevance_score',
            'created_by_name', 'created_at'
        ]


class LegalNoticeSerializer(serializers.ModelSerializer):
    """Serializer for legal notices"""
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    # Calculate days until deadline
    days_until_deadline = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = LegalNotice
        fields = [
            'id', 'case', 'case_number',
            'notice_type', 'notice_type_display',
            'subject', 'recipient_name', 'recipient_address',
            'recipient_email', 'recipient_phone',
            'notice_content', 'notice_document',
            'status', 'status_display',
            'delivery_method', 'delivery_method_display',
            'sent_date', 'delivered_date',
            'tracking_number', 'proof_of_delivery',
            'response_deadline', 'days_until_deadline', 'is_overdue',
            'response_received_date', 'response_document', 'response_summary',
            'next_action',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_days_until_deadline(self, obj):
        """Calculate days until response deadline"""
        if not obj.response_deadline:
            return None
        
        from django.utils import timezone
        today = timezone.now().date()
        delta = obj.response_deadline - today
        return delta.days
    
    def get_is_overdue(self, obj):
        """Check if response deadline has passed"""
        if not obj.response_deadline:
            return False
        
        from django.utils import timezone
        today = timezone.now().date()
        return obj.response_deadline < today and obj.status not in ['response_received', 'deadline_expired']
    
    def validate(self, data):
        """Custom validation"""
        status = data.get('status')
        
        # If status is sent, sent_date and delivery_method required
        if status == 'sent':
            if not data.get('sent_date'):
                raise serializers.ValidationError({
                    'sent_date': 'This field is required when status is "sent".'
                })
            if not data.get('delivery_method'):
                raise serializers.ValidationError({
                    'delivery_method': 'This field is required when status is "sent".'
                })
        
        # If status is response_received, response_received_date required
        if status == 'response_received' and not data.get('response_received_date'):
            raise serializers.ValidationError({
                'response_received_date': 'This field is required when response is received.'
            })
        
        return data


class LegalNoticeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing legal notices"""
    case_number = serializers.CharField(source='case.case_number', read_only=True)
    notice_type_display = serializers.CharField(source='get_notice_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = LegalNotice
        fields = [
            'id', 'case', 'case_number',
            'notice_type', 'notice_type_display',
            'subject', 'recipient_name',
            'status', 'status_display',
            'sent_date', 'response_deadline'
        ]
