from rest_framework import viewsets, permissions
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
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
