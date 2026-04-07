from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = AuditLog.objects.all()
        
        if user.user_type == 'platform_owner':
            pass # Keep all
        elif user.user_type in ['super_admin', 'admin']:
            queryset = queryset.filter(user__firm=user.firm)
        else:
            queryset = queryset.filter(user=user)
            
        # Filtering
        action_filter = self.request.query_params.get('action')
        resource_filter = self.request.query_params.get('resource_type')
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        if resource_filter:
            queryset = queryset.filter(resource_type=resource_filter)
            
        return queryset
    
    def get_object(self):
        pk = self.kwargs.get('pk')
        try:
            obj = AuditLog.objects.get(pk=pk)
        except AuditLog.DoesNotExist:
            from django.http import Http404
            raise Http404
        if not self.get_queryset().filter(pk=pk).exists():
            raise PermissionDenied("You do not have permission to access this resource.")
        return obj
