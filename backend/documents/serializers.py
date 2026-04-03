from rest_framework import serializers
from .models import UserDocument


class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = [
            'id', 'user', 'document_type', 'document_number', 'document_file',
            'verification_status', 'verified_by', 'verification_notes',
            'uploaded_at', 'verified_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'verified_at', 'verified_by']
