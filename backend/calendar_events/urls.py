from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CalendarEventViewSet

router = DefaultRouter()
router.register(r'events', CalendarEventViewSet, basename='calendarevent')

urlpatterns = [
    path('', include(router.urls)),
]
