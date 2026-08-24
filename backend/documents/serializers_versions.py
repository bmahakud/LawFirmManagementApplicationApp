from rest_framework import serializers
from .models_versions import CaseDraftVersion


class CaseDraftVersionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = CaseDraftVersion
        fields = [
            'id',
            'case',
            'document',
            'document_identifier',
            'version_number',
            'version_name',
            'created_by',
            'created_by_name',
            'page_count',
            'annotation_count',
            'summary',
            'snapshot_data',
            'pdf_file',
            'pdf_url',
            'is_named',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'created_by_name', 'pdf_url']

    def get_pdf_url(self, obj):
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None


class CaseDraftVersionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for timeline list without heavy JSON snapshot_data"""
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = CaseDraftVersion
        fields = [
            'id',
            'case',
            'document',
            'document_identifier',
            'version_number',
            'version_name',
            'created_by_name',
            'page_count',
            'annotation_count',
            'summary',
            'is_named',
            'created_at'
        ]
