from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FirmViewSet, BranchViewSet

router = DefaultRouter()
router.register(r'firms', FirmViewSet, basename='firm')
router.register(r'branches', BranchViewSet, basename='branch')

urlpatterns = [
    path('', include(router.urls)),
]
