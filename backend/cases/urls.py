from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, HearingViewSet, CaseDraftViewSet
from .views_document_requests import CaseDocumentRequestViewSet
from .views_service import ServiceAttemptViewSet
from .views_prelitigation import (
    DocumentChecklistViewSet,
    CaseDocumentChecklistItemViewSet,
    CaseResearchViewSet,
    LegalNoticeViewSet
)

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'hearings', HearingViewSet, basename='hearing')
router.register(r'drafts', CaseDraftViewSet, basename='casedraft')
router.register(r'document-requests', CaseDocumentRequestViewSet, basename='case-document-request')
router.register(r'service-attempts', ServiceAttemptViewSet, basename='service-attempt')

# Pre-litigation features
router.register(r'document-checklists', DocumentChecklistViewSet, basename='document-checklist')
router.register(r'case-document-checklist', CaseDocumentChecklistItemViewSet, basename='case-document-checklist')
router.register(r'case-research', CaseResearchViewSet, basename='case-research')
router.register(r'legal-notices', LegalNoticeViewSet, basename='legal-notice')

urlpatterns = [
    path('', include(router.urls)),
]
