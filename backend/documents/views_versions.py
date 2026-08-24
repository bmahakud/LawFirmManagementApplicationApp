from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from cases.models import Case
from .models_versions import CaseDraftVersion
from .serializers_versions import CaseDraftVersionSerializer, CaseDraftVersionListSerializer


from django.db.models import Q

class CaseDraftVersionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Google Docs-style Case Draft Version Control.
    Allows listing timeline milestones, creating named/autosaved snapshots,
    and restoring past versions with per-document isolation.
    """
    queryset = CaseDraftVersion.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return CaseDraftVersionListSerializer
        return CaseDraftVersionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        case_id = self.request.query_params.get('case_id')
        document_identifier = (
            self.request.query_params.get('document_identifier') or
            self.request.query_params.get('document_id')
        )

        if case_id:
            queryset = queryset.filter(case_id=case_id)

        if document_identifier:
            # Strict per-document filtering: only return versions that were
            # saved for this exact document_identifier.
            # Legacy versions with blank document_identifier are NOT included
            # so each document has its own clean, isolated timeline.
            is_uuid = len(document_identifier) == 36 and document_identifier.replace('-', '').isalnum()
            if is_uuid:
                queryset = queryset.filter(
                    Q(document_identifier=document_identifier) |
                    Q(document_id=document_identifier)
                )
            else:
                queryset = queryset.filter(document_identifier=document_identifier)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        case_id = self.request.data.get('case') or self.request.query_params.get('case_id')
        case = get_object_or_404(Case, id=case_id)
        document_identifier = self.request.data.get('document_identifier') or self.request.data.get('document_id') or ''
        
        # Calculate next version number for this specific document in this case
        versions_query = CaseDraftVersion.objects.filter(case=case)
        if document_identifier:
            versions_query = versions_query.filter(document_identifier=document_identifier)
        last_version = versions_query.order_by('-version_number').first()
        next_version_num = (last_version.version_number + 1) if last_version else 1
        
        serializer.save(
            case=case,
            document_identifier=document_identifier,
            created_by=self.request.user,
            version_number=next_version_num
        )

    @action(detail=True, methods=['post'], url_path='name-version')
    def name_version(self, request, pk=None):
        """Allow advocate to name or rename a key version milestone"""
        version = self.get_object()
        version_name = request.data.get('version_name', '').strip()
        if not version_name:
            return Response({'error': 'version_name is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        version.version_name = version_name
        version.is_named = True
        version.save()
        serializer = self.get_serializer(version)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore_version(self, request, pk=None):
        """
        Restore this version as the new active draft baseline
        and create a restore history entry.
        """
        version = self.get_object()
        case = version.case
        
        # Create a new version marking the restoration for this specific document
        versions_query = CaseDraftVersion.objects.filter(case=case)
        if version.document_identifier:
            versions_query = versions_query.filter(document_identifier=version.document_identifier)
        last_version = versions_query.order_by('-version_number').first()
        restore_version_num = (last_version.version_number + 1) if last_version else 1

        # Clean title: strip recursive 'Restored to...' prefixes
        import re
        raw_name = version.version_name
        clean_name = re.sub(r'^(Restored (to|from) v\d+\s*(\([^)]*\))?\s*[:\-–]?\s*)+', '', raw_name, flags=re.IGNORECASE).strip(' ()')
        if not clean_name:
            clean_name = f"Version {version.version_number}"

        restored_entry = CaseDraftVersion.objects.create(
            case=case,
            document=version.document,
            document_identifier=version.document_identifier,
            version_number=restore_version_num,
            version_name=f"Restored from v{version.version_number} ({clean_name})",
            created_by=request.user,
            page_count=version.page_count,
            annotation_count=version.annotation_count,
            summary=f"Reverted workspace state back to version {version.version_number}",
            snapshot_data=version.snapshot_data,
            pdf_file=version.pdf_file,
            is_named=True
        )

        serializer = CaseDraftVersionSerializer(restored_entry, context={'request': request})
        return Response({
            'message': f'Successfully restored to version {version.version_number}',
            'restored_version': serializer.data,
            'snapshot_data': version.snapshot_data
        }, status=status.HTTP_200_OK)
