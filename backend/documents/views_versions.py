from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from cases.models import Case
from .models_versions import CaseDraftVersion
from .serializers_versions import (
    CaseDraftVersionSerializer,
    CaseDraftVersionListSerializer,
    _sanitize_null_bytes
)


import base64
import logging
import uuid
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Q

logger = logging.getLogger(__name__)


def _save_base64_to_cdn(data_url, case_id, request=None):
    """
    Decodes a base64 image data URL (data:image/png;base64,...) and saves it to
    Django's default_storage (DigitalOcean Spaces CDN via MediaStorage).
    Returns the absolute public CDN URL.
    """
    try:
        if not data_url or not isinstance(data_url, str) or not data_url.startswith('data:image/'):
            return data_url

        header, encoded = data_url.split(',', 1)
        ext = 'png'
        if 'image/jpeg' in header or 'image/jpg' in header:
            ext = 'jpg'
        elif 'image/webp' in header:
            ext = 'webp'

        image_bytes = base64.b64decode(encoded)
        filename = f"draft_versions/excerpts/{case_id}/{uuid.uuid4().hex[:12]}.{ext}"
        saved_path = default_storage.save(filename, ContentFile(image_bytes))
        cdn_url = default_storage.url(saved_path)

        if request and cdn_url.startswith('/'):
            cdn_url = request.build_absolute_uri(cdn_url)

        return cdn_url
    except Exception as e:
        logger.exception("Failed to upload base64 image to CDN: %s", e)
        return data_url


def _offload_base64_images_to_cdn(snapshot_data, case_id, request=None):
    """
    Recursively scans snapshot_data for base64 image strings (in nodes, anchors, excerpts)
    and uploads them to the CDN, replacing base64 payloads with lightweight CDN URLs.
    """
    if not isinstance(snapshot_data, dict):
        return snapshot_data

    # 1. Process nodes
    nodes = snapshot_data.get('nodes')
    if isinstance(nodes, list):
        for node in nodes:
            if isinstance(node, dict) and isinstance(node.get('imageUrl'), str):
                if node['imageUrl'].startswith('data:image/'):
                    node['imageUrl'] = _save_base64_to_cdn(node['imageUrl'], case_id, request)

    # 2. Process anchors
    anchors = snapshot_data.get('anchors')
    if isinstance(anchors, list):
        for anchor in anchors:
            if isinstance(anchor, dict) and isinstance(anchor.get('imageUrl'), str):
                if anchor['imageUrl'].startswith('data:image/'):
                    anchor['imageUrl'] = _save_base64_to_cdn(anchor['imageUrl'], case_id, request)

    # 3. Process excerpts
    excerpts = snapshot_data.get('excerpts')
    if isinstance(excerpts, list):
        for excerpt in excerpts:
            if isinstance(excerpt, dict) and isinstance(excerpt.get('imageUrl'), str):
                if excerpt['imageUrl'].startswith('data:image/'):
                    excerpt['imageUrl'] = _save_base64_to_cdn(excerpt['imageUrl'], case_id, request)

    return snapshot_data


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
        document_identifier = _sanitize_null_bytes(self.request.data.get('document_identifier') or self.request.data.get('document_id') or '')
        
        # Offload any inline base64 images in snapshot_data to DigitalOcean Spaces CDN
        snapshot_data = _sanitize_null_bytes(serializer.validated_data.get('snapshot_data', {}))
        if snapshot_data:
            snapshot_data = _offload_base64_images_to_cdn(snapshot_data, str(case.id), self.request)
            snapshot_data = _sanitize_null_bytes(snapshot_data)
            
            # Align anchors and nodes with current master filing pack manifest to prevent stale page offsets
            if document_identifier.startswith('doc-master-') or not document_identifier:
                try:
                    from .models import UserDocument
                    import json, re
                    master_doc = UserDocument.objects.filter(
                        case=case,
                        document_title__startswith='Master Case Filing Pack',
                        is_deleted=False
                    ).first()
                    if master_doc and master_doc.verification_notes:
                        parsed_notes = json.loads(master_doc.verification_notes) if isinstance(master_doc.verification_notes, str) else master_doc.verification_notes
                        manifest = parsed_notes.get('manifest') or parsed_notes.get('manifest_json') or []
                        if manifest:
                            anchors = snapshot_data.get('anchors', [])
                            nodes = snapshot_data.get('nodes', [])
                            for nd in manifest:
                                nd_id = str(nd.get('id', '') or '').strip()
                                nd_title = (nd.get('title') or '').strip().lower()
                                nd_start = int(nd.get('start_page', 1) or 1)
                                nd_max = int(nd.get('end_page', nd_start) or nd_start)
                                for a in anchors:
                                    if ('pan' in nd_title and a.get('imageUrl') and '120262c7871a' in a.get('imageUrl')) or \
                                       (nd_id and str(a.get('documentId', '')).endswith(nd_id)):
                                        tp = min(nd_max, nd_start + int(a.get('pageOffset', 0) or 0))
                                        a['pageNumber'] = tp
                                        if a.get('textQuote'):
                                            a['textQuote'] = re.sub(r'\[Picture Excerpt - Page -?\d+\]', f'[Picture Excerpt - Page {tp}]', a['textQuote'])
                                for n in nodes:
                                    if ('pan' in nd_title and n.get('imageUrl') and '120262c7871a' in n.get('imageUrl')) or \
                                       (nd_id and str(n.get('documentId', '')).endswith(nd_id)):
                                        tp = min(nd_max, nd_start + int(n.get('pageOffset', 0) or 0))
                                        n['sourcePageNumber'] = tp
                                        if n.get('text'):
                                            n['text'] = re.sub(r'\[Picture Excerpt - Page -?\d+\]', f'[Picture Excerpt - Page {tp}]', n['text'])
                                        if n.get('title'):
                                            n['title'] = re.sub(r'\bPAGE \d+\b', f'PAGE {tp}', n['title'])
                except Exception:
                    pass

            serializer.validated_data['snapshot_data'] = snapshot_data

        if 'summary' in serializer.validated_data:
            serializer.validated_data['summary'] = _sanitize_null_bytes(serializer.validated_data['summary'])
        if 'version_name' in serializer.validated_data:
            serializer.validated_data['version_name'] = _sanitize_null_bytes(serializer.validated_data['version_name'])

        # Calculate next version number for this specific document in this case
        versions_query = CaseDraftVersion.objects.filter(case=case)
        if document_identifier:
            versions_query = versions_query.filter(document_identifier=document_identifier)
        last_version = versions_query.order_by('-version_number').first()
        next_version_num = (last_version.version_number + 1) if last_version else 1
        
        serializer.save(
            case=case,
            document_identifier=document_identifier,
            created_by=self.request.user if self.request.user and self.request.user.is_authenticated else None,
            version_number=next_version_num,
            snapshot_data=snapshot_data
        )

    @action(detail=False, methods=['post'], url_path='upload-excerpt-image', permission_classes=[AllowAny])
    def upload_excerpt_image(self, request):
        """
        Directly uploads an excerpt image to DigitalOcean Spaces CDN / default_storage.
        Accepts either:
          - multipart/form-data with 'image' file
          - JSON with 'data_url' (data:image/...) and optional 'case_id'
        Returns: { 'image_url': 'https://...' }
        """
        case_id = request.data.get('case_id') or request.data.get('case') or 'common'
        uploaded_file = request.FILES.get('image')
        data_url = request.data.get('data_url')

        if uploaded_file:
            ext = uploaded_file.name.split('.')[-1].lower() if '.' in uploaded_file.name else 'png'
            filename = f"draft_versions/excerpts/{case_id}/{uuid.uuid4().hex[:12]}.{ext}"
            saved_path = default_storage.save(filename, uploaded_file)
            cdn_url = default_storage.url(saved_path)
            if cdn_url.startswith('/'):
                cdn_url = request.build_absolute_uri(cdn_url)
            return Response({'image_url': cdn_url}, status=status.HTTP_201_CREATED)

        if data_url and isinstance(data_url, str) and data_url.startswith('data:image/'):
            cdn_url = _save_base64_to_cdn(data_url, str(case_id), request)
            return Response({'image_url': cdn_url}, status=status.HTTP_201_CREATED)

        return Response({'error': 'No image file or data_url provided'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='name-version')
    def name_version(self, request, pk=None):
        """Allow advocate to name or rename a key version milestone"""
        version = self.get_object()
        version_name = _sanitize_null_bytes(request.data.get('version_name', '').strip())
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
            snapshot_data=_sanitize_null_bytes(version.snapshot_data),
            pdf_file=version.pdf_file,
            is_named=True
        )

        serializer = CaseDraftVersionSerializer(restored_entry, context={'request': request})
        return Response({
            'message': f'Successfully restored to version {version.version_number}',
            'restored_version': serializer.data,
            'snapshot_data': version.snapshot_data
        }, status=status.HTTP_200_OK)
