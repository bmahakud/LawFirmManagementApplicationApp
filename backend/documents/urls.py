from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserDocumentViewSet
from .views_templates import DocumentTemplateViewSet, FilledTemplateViewSet

router = DefaultRouter()
router.register(r'', UserDocumentViewSet, basename='document')
router.register(r'templates', DocumentTemplateViewSet, basename='template')
router.register(r'filled-templates', FilledTemplateViewSet, basename='filled-template')

urlpatterns = [
    path('', include(router.urls)),
]
