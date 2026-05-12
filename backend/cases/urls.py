from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, HearingViewSet, CaseDraftViewSet
from .views_document_requests import CaseDocumentRequestViewSet

router = DefaultRouter()
router.register(r'cases', CaseViewSet, basename='case')
router.register(r'hearings', HearingViewSet, basename='hearing')
router.register(r'drafts', CaseDraftViewSet, basename='casedraft')
router.register(r'document-requests', CaseDocumentRequestViewSet, basename='case-document-request')

urlpatterns = [
    path('', include(router.urls)),
]
