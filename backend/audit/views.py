from rest_framework import viewsets, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return AuditLog.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return AuditLog.objects.filter(user__firm=user.firm)
        return AuditLog.objects.filter(user=user)
