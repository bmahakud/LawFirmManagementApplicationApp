from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomUserViewSet, AuthenticationViewSet, UserInvitationViewSet, GlobalConfigurationViewSet

router = DefaultRouter()
router.register(r'users', CustomUserViewSet, basename='user')
router.register(r'auth', AuthenticationViewSet, basename='auth')
router.register(r'invitations', UserInvitationViewSet, basename='userinvitation')
router.register(r'config', GlobalConfigurationViewSet, basename='globalconfig')

urlpatterns = [
    path('', include(router.urls)),
]
