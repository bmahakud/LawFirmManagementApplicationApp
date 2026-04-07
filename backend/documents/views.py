from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import UserDocument
from .serializers import UserDocumentSerializer


class UserDocumentViewSet(viewsets.ModelViewSet):
    queryset = UserDocument.objects.all()
    serializer_class = UserDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return UserDocument.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return UserDocument.objects.filter(user__firm=user.firm)
        return UserDocument.objects.filter(user=user)
    
    def get_object(self):
        pk = self.kwargs.get('pk')
        try:
            obj = UserDocument.objects.get(pk=pk)
        except UserDocument.DoesNotExist:
            from django.http import Http404
            raise Http404
        if not self.get_queryset().filter(pk=pk).exists():
            raise PermissionDenied("You do not have permission to access this resource.")
        return obj
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        user = self.request.user
        obj = self.get_object()
        # Only super_admin/admin can update verification status
        if 'verification_status' in self.request.data:
            if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
                raise PermissionDenied("Only admins can verify documents.")
            if obj.user == user:
                raise PermissionDenied("You cannot verify your own document.")
        serializer.save()
