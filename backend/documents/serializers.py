from rest_framework import serializers
from .models import UserDocument


class UserDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    deleted_by_name = serializers.CharField(source='deleted_by.get_full_name', read_only=True)
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserDocument
        fields = [
            'id', 'uploaded_by', 'uploaded_by_name', 'firm', 'client', 'client_name',
            'case', 'case_title', 'document_type', 'document_type_display',
            'document_category', 'document_title', 'document_number', 'document_file',
            'file_url', 'description', 'verification_status', 'verified_by', 
            'verified_by_name', 'verification_notes', 'verified_at',
            'is_deleted', 'deleted_at', 'deleted_by', 'deleted_by_name',
            'version', 'parent_document', 'uploaded_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'uploaded_by_name', 'firm', 'uploaded_at', 
            'updated_at', 'verified_at', 'verified_by', 'verified_by_name',
            'is_deleted', 'deleted_at', 'deleted_by', 'deleted_by_name',
            'file_url', 'document_type_display', 'client_name', 'case_title'
        ]
    
    def get_file_url(self, obj):
        if obj.document_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document_file.url)
            return obj.document_file.url
        return None


class UserDocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing documents"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserDocument
        fields = [
            'id', 'document_title', 'document_type', 'document_type_display',
            'document_category', 'uploaded_by_name', 'client_name', 'case_title',
            'verification_status', 'uploaded_at', 'is_deleted', 'version', 'file_url'
        ]
    
    def get_file_url(self, obj):
        if obj.document_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document_file.url)
            return obj.document_file.url
        return None
