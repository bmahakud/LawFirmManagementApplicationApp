from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserDocumentViewSet
from .views_templates import (
    DocumentTemplateViewSet, 
    FilledTemplateViewSet,
    CourtFormTemplateViewSet,
    FilledCourtFormViewSet
)

router = DefaultRouter()
# Register specific routes BEFORE generic routes to avoid conflicts
router.register(r'templates', DocumentTemplateViewSet, basename='template')
router.register(r'filled-templates', FilledTemplateViewSet, basename='filled-template')
router.register(r'court-form-templates', CourtFormTemplateViewSet, basename='court-form-template')
router.register(r'filled-court-forms', FilledCourtFormViewSet, basename='filled-court-form')
router.register(r'', UserDocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]
