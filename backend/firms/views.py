from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Firm, Branch
from .serializers import FirmSerializer, BranchSerializer


class FirmViewSet(viewsets.ModelViewSet):
    queryset = Firm.objects.all()
    serializer_class = FirmSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return Firm.objects.all()
        elif user.user_type in ['super_admin', 'admin', 'advocate', 'paralegal', 'client']:
            return Firm.objects.filter(id__in=user.firm_memberships.values_list('firm_id', flat=True))
        return Firm.objects.none()
    
    def get_object(self):
        from rest_framework.exceptions import PermissionDenied as DRFPermDenied
        pk = self.kwargs.get('pk')
        try:
            obj = Firm.objects.get(pk=pk)
        except Firm.DoesNotExist:
            from django.http import Http404
            raise Http404
        if not self.get_queryset().filter(pk=pk).exists():
            raise DRFPermDenied("You do not have permission to access this resource.")
        return obj
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.user_type not in ['platform_owner', 'partner_manager']:
            raise PermissionDenied('Only Platform Owner or Partner Manager can create firms')
        serializer.save()
    
    def perform_update(self, serializer):
        user = self.request.user
        if user.user_type not in ['platform_owner', 'partner_manager', 'super_admin']:
            raise PermissionDenied('You do not have permission to update this firm')
        serializer.save()


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return Branch.objects.all()
        
        # User can see branches in firms they belong to
        firm_ids = user.firm_memberships.values_list('firm_id', flat=True)
        return Branch.objects.filter(firm_id__in=firm_ids)
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            raise PermissionDenied('Only Platform Owner or Firm Admins can create branches')
        serializer.save()
