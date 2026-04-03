from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FirmViewSet, CustomUserViewSet, AuthenticationViewSet,
    UserDocumentViewSet, UserInvitationViewSet, AuditLogViewSet
)

router = DefaultRouter()
router.register(r'firms', FirmViewSet, basename='firm')
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'auth', AuthenticationViewSet, basename='auth')
router.register(r'documents', UserDocumentViewSet, basename='document')
router.register(r'invitations', UserInvitationViewSet, basename='invitation')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
]
