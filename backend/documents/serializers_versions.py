from rest_framework import serializers
from .models_versions import CaseDraftVersion


def _sanitize_null_bytes(data):
    """
    Recursively strips null bytes (\u0000 or \x00) from strings, dicts, and lists.
    PostgreSQL cannot store \u0000 in text or JSON/JSONB fields.
    """
    if isinstance(data, str):
        return data.replace('\x00', '').replace('\u0000', '')
    elif isinstance(data, dict):
        return {
            _sanitize_null_bytes(k): _sanitize_null_bytes(v)
            for k, v in data.items()
        }
    elif isinstance(data, list):
        return [_sanitize_null_bytes(item) for item in data]
    return data


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

    def to_internal_value(self, data):
        cleaned_data = _sanitize_null_bytes(data)
        return super().to_internal_value(cleaned_data)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        return _sanitize_null_bytes(attrs)

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
