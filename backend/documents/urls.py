from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserDocumentViewSet

router = DefaultRouter()
router.register(r'documents', UserDocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]
