from django.utils import timezone
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Q
from .models import Firm, Branch
from .serializers import FirmSerializer, BranchSerializer
from accounts.models import CustomUser
from partners.models import Partner
from documents.models import UserDocument
from audit.models import AuditLog

# Import models from newly created apps
try:
    from cases.models import Case
    from clients.models import Client
    from tasks.models import Task
except ImportError:
    Case = None
    Client = None
    Task = None


class DashboardViewSet(viewsets.ViewSet):
    """
    Role-based dashboard analytics for:
    - Platform Owners (Global Stats)
    - Partner Managers (Onboarded Firm Stats)
    - Super Admins (Firm-specific Stats)
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        role = user.user_type
        firm = user.firm

        stats = {
            'role': role,
            'role_display': user.get_user_type_display(),
            'user_name': user.get_full_name(),
        }

        if role == 'platform_owner':
            stats.update(self.get_platform_owner_stats())
        elif role == 'partner_manager':
            stats.update(self.get_partner_manager_stats(user))
        elif role in ['super_admin', 'admin']:
            stats.update(self.get_firm_admin_stats(user, firm))
        else:
            stats.update(self.get_generic_user_stats(user, firm))

        return Response(stats)

    def get_platform_owner_stats(self):
        return {
            'cards': {
                'total_firms': Firm.objects.count(),
                'active_users': CustomUser.objects.filter(is_active=True).count(),
                'case_statistics': {
                    'total': Case.objects.count() if Case else 0,
                    'running': Case.objects.filter(status='running').count() if Case else 0,
                    'disposed': Case.objects.filter(status='disposed').count() if Case else 0,
                    'closed': Case.objects.filter(status='closed').count() if Case else 0,
                }
            },
            'recent_audits': AuditLog.objects.all()[:10].values('action', 'description', 'created_at')
        }

    def get_partner_manager_stats(self, user):
        # Filter firms onboarded by this partner
        partner_profile = getattr(user, 'partner_profile', None)
        if partner_profile:
            firms_qs = Firm.objects.filter(partner=partner_profile)
        else:
            # Fallback if no specific partner profile but user is partner_manager type
            # (In a real system, we'd ensure the profile exists)
            firms_qs = Firm.objects.none()
            
        return {
            'cards': {
                'total_firms_onboarded': firms_qs.count(),
                'active_firms': firms_qs.filter(is_active=True).count(),
                'pending_firms': firms_qs.filter(is_active=False).count(),
                'recent_activity': AuditLog.objects.filter(
                    user__firm__in=firms_qs
                )[:10].values('action', 'description', 'created_at')
            }
        }

    def get_firm_admin_stats(self, user, firm):
        if not firm:
            return {'error': 'User not associated with a firm'}
            
        return {
            'cards': {
                'total_cases': {
                    'total': Case.objects.filter(firm=firm).count() if Case else 0,
                    'running': Case.objects.filter(firm=firm, status='running').count() if Case else 0,
                    'disposed': Case.objects.filter(firm=firm, status='disposed').count() if Case else 0,
                    'closed': Case.objects.filter(firm=firm, status='closed').count() if Case else 0,
                },
                'total_clients': Client.objects.filter(firm=firm).count() if Client else 0,
                'total_documents': UserDocument.objects.filter(user__firm=firm).count(),
                'team_members': CustomUser.objects.filter(firm=firm).count(),
                'todos': {
                    'pending': Task.objects.filter(firm=firm, status='pending').count() if Task else 0,
                    'upcoming': Task.objects.filter(firm=firm, due_date__gt=timezone.now()).count() if Task else 0,
                }
            },
            'firm_info': {
                'name': firm.firm_name,
                'code': firm.firm_code,
                'subscription': firm.subscription_type,
                'is_suspended': firm.is_suspended,
                'subscription_end_date': firm.subscription_end_date,
                'practice_areas': firm.practice_areas
            }
        }

    def get_generic_user_stats(self, user, firm):
        if not firm:
            return {}
        return {
            'cards': {
                'assigned_cases': Case.objects.filter(firm=firm).count() if Case else 0,
                'my_tasks': Task.objects.filter(assigned_to=user, status='pending').count() if Task else 0,
                'firm_documents': UserDocument.objects.filter(user__firm=firm).count(),
            }
        }


from .permissions import IsSubscriptionActive

class FirmViewSet(viewsets.ModelViewSet):
    queryset = Firm.objects.all()
    serializer_class = FirmSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['firm_name', 'firm_code', 'city', 'state', 'email']
    ordering_fields = ['created_at', 'firm_name']
    
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
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def suspend(self, request, pk=None):
        """Suspend a firm (Platform Owner only)"""
        if request.user.user_type != 'platform_owner':
            raise PermissionDenied('Only Platform Owner can suspend firms')
        
        firm = self.get_object()
        firm.is_active = False
        firm.save()
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action='suspend_firm',
            description=f'Suspended firm: {firm.firm_name}'
        )
        
        return Response({
            'message': f'Firm "{firm.firm_name}" has been suspended',
            'firm': FirmSerializer(firm).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unsuspend(self, request, pk=None):
        """Unsuspend/Activate a firm (Platform Owner only)"""
        if request.user.user_type != 'platform_owner':
            raise PermissionDenied('Only Platform Owner can unsuspend firms')
        
        firm = self.get_object()
        firm.is_active = True
        firm.save()
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action='unsuspend_firm',
            description=f'Unsuspended firm: {firm.firm_name}'
        )
        
        return Response({
            'message': f'Firm "{firm.firm_name}" has been activated',
            'firm': FirmSerializer(firm).data
        })


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['branch_name', 'city', 'state', 'phone_number']
    ordering_fields = ['created_at', 'branch_name']
    
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
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_admin(self, request, pk=None):
        """Assign an admin to a branch"""
        user = request.user
        if user.user_type not in ['platform_owner', 'super_admin']:
            raise PermissionDenied('Only Platform Owner or Super Admin can assign branch admins')
        
        branch = self.get_object()
        admin_id = request.data.get('admin_id')
        
        if not admin_id:
            return Response({'error': 'admin_id is required'}, status=400)
        
        from accounts.models import CustomUser, UserFirmRole
        
        try:
            admin_user = CustomUser.objects.get(id=admin_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Admin user not found'}, status=404)
        
        # Check if user is an admin
        if admin_user.user_type != 'admin':
            return Response({'error': 'User must be an admin'}, status=400)
        
        # Check if admin belongs to the same firm
        if admin_user.firm != branch.firm:
            return Response({'error': 'Admin must belong to the same firm'}, status=400)
        
        # Check if admin is already assigned to another branch
        existing_branch_assignment = UserFirmRole.objects.filter(
            user=admin_user,
            firm=branch.firm,
            branch__isnull=False
        ).exclude(branch=branch).first()
        
        if existing_branch_assignment:
            return Response({
                'error': f'Admin is already assigned to branch: {existing_branch_assignment.branch.branch_name}'
            }, status=400)
        
        # Assign admin to branch
        membership, created = UserFirmRole.objects.get_or_create(
            user=admin_user,
            firm=branch.firm,
            defaults={'user_type': 'admin', 'branch': branch}
        )
        
        if not created:
            membership.branch = branch
            membership.user_type = 'admin'
            membership.save()
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action='assign_branch_admin',
            description=f'Assigned {admin_user.get_full_name()} as admin to branch: {branch.branch_name}'
        )
        
        return Response({
            'message': f'{admin_user.get_full_name()} assigned to {branch.branch_name}',
            'branch': BranchSerializer(branch).data,
            'admin': {
                'id': admin_user.id,
                'name': admin_user.get_full_name(),
                'email': admin_user.email
            }
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unassign_admin(self, request, pk=None):
        """Unassign an admin from a branch"""
        user = request.user
        if user.user_type not in ['platform_owner', 'super_admin']:
            raise PermissionDenied('Only Platform Owner or Super Admin can unassign branch admins')
        
        branch = self.get_object()
        admin_id = request.data.get('admin_id')
        
        if not admin_id:
            return Response({'error': 'admin_id is required'}, status=400)
        
        from accounts.models import CustomUser, UserFirmRole
        
        try:
            admin_user = CustomUser.objects.get(id=admin_id)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Admin user not found'}, status=404)
        
        # Find and update the membership
        membership = UserFirmRole.objects.filter(
            user=admin_user,
            firm=branch.firm,
            branch=branch
        ).first()
        
        if not membership:
            return Response({'error': 'Admin is not assigned to this branch'}, status=400)
        
        membership.branch = None
        membership.save()
        
        from audit.models import AuditLog
        AuditLog.objects.create(
            user=request.user,
            action='unassign_branch_admin',
            description=f'Unassigned {admin_user.get_full_name()} from branch: {branch.branch_name}'
        )
        
        return Response({
            'message': f'{admin_user.get_full_name()} unassigned from {branch.branch_name}',
            'branch': BranchSerializer(branch).data
        })
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def admins(self, request, pk=None):
        """Get all admins assigned to a branch"""
        branch = self.get_object()
        
        from accounts.models import UserFirmRole
        from accounts.serializers import CustomUserSerializer
        
        admin_memberships = UserFirmRole.objects.filter(
            branch=branch,
            user_type='admin',
            is_active=True
        ).select_related('user')
        
        admins = [membership.user for membership in admin_memberships]
        
        return Response({
            'branch': BranchSerializer(branch).data,
            'admins': CustomUserSerializer(admins, many=True).data,
            'count': len(admins)
        })
