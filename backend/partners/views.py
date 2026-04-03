from rest_framework import viewsets, permissions
from .models import Partner
from .serializers import PartnerSerializer


class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all()
    serializer_class = PartnerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return Partner.objects.all()
        return Partner.objects.filter(user=user)
