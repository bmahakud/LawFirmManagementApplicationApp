from rest_framework import viewsets, permissions
from .models import Firm
from .serializers import FirmSerializer


class FirmViewSet(viewsets.ModelViewSet):
    queryset = Firm.objects.all()
    serializer_class = FirmSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return Firm.objects.all()
        elif user.user_type == 'super_admin':
            return Firm.objects.filter(id=user.firm_id)
        return Firm.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.user_type not in ['platform_owner', 'partner_manager']:
            raise permissions.PermissionDenied('Only Platform Owner or Partner Manager can create firms')
        serializer.save()
