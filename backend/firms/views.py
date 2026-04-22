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
    - Super Admins (Firm-specific Stats with all branches)
    - Admins (Branch-specific Stats if assigned to a branch)
    - Advocates (Their assigned clients and cases)
    - Paralegals (Their assigned cases)
    - Clients (Their own cases and documents)
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        role = user.user_type
        
        # Get firm_id from query params to support multi-firm users
        firm_id = request.query_params.get('firm_id')
        
        # Determine which firm to show stats for
        if firm_id:
            # User wants to see specific firm stats
            try:
                from accounts.models import UserFirmRole
                # Check if user has access to this firm
                membership = UserFirmRole.objects.filter(
                    user=user,
                    firm_id=firm_id,
                    is_active=True
                ).first()
                
                if not membership and role != 'platform_owner':
                    return Response({
                        'error': 'You do not have access to this firm'
                    }, status=403)
                
                firm = Firm.objects.get(id=firm_id)
                branch = membership.branch if membership else None
            except Firm.DoesNotExist:
                return Response({'error': 'Firm not found'}, status=404)
        else:
            # Use user's primary firm
            firm = user.firm
            # Get user's branch assignment if any
            from accounts.models import UserFirmRole
            membership = UserFirmRole.objects.filter(
                user=user,
                firm=firm,
                is_active=True
            ).first()
            branch = membership.branch if membership else None

        stats = {
            'role': role,
            'role_display': user.get_user_type_display(),
            'user_name': user.get_full_name(),
            'user_id': str(user.id),
        }

        if role == 'platform_owner':
            stats.update(self.get_platform_owner_stats())
        elif role == 'partner_manager':
            stats.update(self.get_partner_manager_stats(user))
        elif role == 'super_admin':
            stats.update(self.get_super_admin_stats(user, firm))
        elif role == 'admin':
            stats.update(self.get_admin_stats(user, firm, branch))
        elif role == 'advocate':
            stats.update(self.get_advocate_stats(user, firm))
        elif role == 'paralegal':
            stats.update(self.get_paralegal_stats(user, firm))
        elif role == 'client':
            stats.update(self.get_client_stats(user))
        else:
            stats.update(self.get_generic_user_stats(user, firm))

        return Response(stats)

    def get_platform_owner_stats(self):
        """Platform owner sees global statistics"""
        total_cases = Case.objects.count() if Case else 0
        # Count client users instead of Client records
        total_clients = CustomUser.objects.filter(user_type='client').count()
        
        return {
            'cards': {
                'total_firms': Firm.objects.count(),
                'active_firms': Firm.objects.filter(is_active=True).count(),
                'suspended_firms': Firm.objects.filter(is_active=False).count(),
                'total_users': CustomUser.objects.count(),
                'active_users': CustomUser.objects.filter(is_active=True).count(),
                'total_cases': total_cases,
                'total_clients': total_clients,
                'total_documents': UserDocument.objects.count(),
                'case_statistics': {
                    'total': total_cases,
                    'open': Case.objects.filter(status='open').count() if Case else 0,
                    'in_progress': Case.objects.filter(status='in_progress').count() if Case else 0,
                    'closed': Case.objects.filter(status='closed').count() if Case else 0,
                    'won': Case.objects.filter(status='won').count() if Case else 0,
                    'lost': Case.objects.filter(status='lost').count() if Case else 0,
                }
            },
            'recent_audits': list(AuditLog.objects.all()[:10].values(
                'action', 'description', 'created_at', 'user__email'
            ))
        }

    def get_partner_manager_stats(self, user):
        """Partner manager sees stats for firms they onboarded"""
        partner_profile = getattr(user, 'partner_profile', None)
        if partner_profile:
            firms_qs = Firm.objects.filter(partner=partner_profile)
        else:
            firms_qs = Firm.objects.none()
        
        total_cases = Case.objects.filter(firm__in=firms_qs).count() if Case else 0
        # Count client users instead of Client records
        total_clients = CustomUser.objects.filter(firm__in=firms_qs, user_type='client').count()
            
        return {
            'cards': {
                'total_firms_onboarded': firms_qs.count(),
                'active_firms': firms_qs.filter(is_active=True).count(),
                'suspended_firms': firms_qs.filter(is_active=False).count(),
                'total_cases': total_cases,
                'total_clients': total_clients,
                'total_users': CustomUser.objects.filter(firm__in=firms_qs).count(),
            },
            'firms': list(firms_qs.values(
                'id', 'firm_name', 'firm_code', 'city', 'state', 
                'subscription_type', 'is_active', 'created_at'
            )),
            'recent_activity': list(AuditLog.objects.filter(
                user__firm__in=firms_qs
            )[:10].values('action', 'description', 'created_at', 'user__email'))
        }

    def get_super_admin_stats(self, user, firm):
        """Super admin sees all stats for their entire firm (all branches)"""
        if not firm:
            return {'error': 'User not associated with a firm'}
        
        # Get all branches in the firm
        branches = Branch.objects.filter(firm=firm, is_active=True)
        
        # Case statistics
        total_cases = Case.objects.filter(firm=firm).count() if Case else 0
        open_cases = Case.objects.filter(firm=firm, status='open').count() if Case else 0
        in_progress_cases = Case.objects.filter(firm=firm, status='in_progress').count() if Case else 0
        closed_cases = Case.objects.filter(firm=firm, status='closed').count() if Case else 0
        
        # Client statistics
        # Count client users instead of Client records
        total_clients = CustomUser.objects.filter(firm=firm, user_type='client', is_active=True).count()
        
        # Document statistics
        total_documents = UserDocument.objects.filter(firm=firm, is_deleted=False).count()
        pending_verification = UserDocument.objects.filter(
            firm=firm, 
            verification_status='pending',
            is_deleted=False
        ).count()
        
        # Team statistics
        total_team = CustomUser.objects.filter(firm=firm, is_active=True).count()
        advocates = CustomUser.objects.filter(firm=firm, user_type='advocate', is_active=True).count()
        admins = CustomUser.objects.filter(firm=firm, user_type='admin', is_active=True).count()
        paralegals = CustomUser.objects.filter(firm=firm, user_type='paralegal', is_active=True).count()
        
        # Task statistics
        pending_tasks = Task.objects.filter(firm=firm, status='pending').count() if Task else 0
        overdue_tasks = Task.objects.filter(
            firm=firm, 
            status='pending',
            due_date__lt=timezone.now()
        ).count() if Task else 0
            
        return {
            'cards': {
                'total_cases': total_cases,
                'open_cases': open_cases,
                'in_progress_cases': in_progress_cases,
                'closed_cases': closed_cases,
                'total_clients': total_clients,
                'total_documents': total_documents,
                'pending_verification': pending_verification,
                'total_team': total_team,
                'advocates': advocates,
                'admins': admins,
                'paralegals': paralegals,
                'pending_tasks': pending_tasks,
                'overdue_tasks': overdue_tasks,
                'case_statistics': {
                    'total': total_cases,
                    'open': open_cases,
                    'in_progress': in_progress_cases,
                    'on_hold': Case.objects.filter(firm=firm, status='on_hold').count() if Case else 0,
                    'closed': closed_cases,
                    'won': Case.objects.filter(firm=firm, status='won').count() if Case else 0,
                    'lost': Case.objects.filter(firm=firm, status='lost').count() if Case else 0,
                }
            },
            'firm_info': {
                'id': str(firm.id),
                'name': firm.firm_name,
                'code': firm.firm_code,
                'city': firm.city,
                'state': firm.state,
                'subscription': firm.subscription_type,
                'is_suspended': firm.is_suspended,
                'subscription_end_date': firm.subscription_end_date,
                'practice_areas': firm.practice_areas,
                'total_branches': branches.count(),
            },
            'branches': list(branches.values(
                'id', 'branch_name', 'branch_code', 'city', 'state', 
                'phone_number', 'email', 'is_active'
            )),
            'recent_activity': list(AuditLog.objects.filter(
                user__firm=firm
            )[:10].values('action', 'description', 'created_at', 'user__email'))
        }
    
    def get_admin_stats(self, user, firm, branch):
        """Admin sees stats for their specific branch or entire firm if not assigned to branch"""
        if not firm:
            return {'error': 'User not associated with a firm'}
        
        # If admin is assigned to a specific branch, show only that branch's stats
        if branch:
            # Filter by branch
            cases_qs = Case.objects.filter(firm=firm, branch=branch) if Case else Case.objects.none()
            clients_qs = Client.objects.filter(firm=firm) if Client else Client.objects.none()
            # Note: Clients might not have branch field, so we filter by assigned advocate's branch
            team_qs = CustomUser.objects.filter(firm=firm, is_active=True)
            
            # Get team members in this branch
            from accounts.models import UserFirmRole
            branch_user_ids = UserFirmRole.objects.filter(
                firm=firm,
                branch=branch,
                is_active=True
            ).values_list('user_id', flat=True)
            
            team_qs = team_qs.filter(id__in=branch_user_ids)
            
            # Count client users in this branch
            total_clients_in_branch = team_qs.filter(user_type='client').count()
            
            branch_info = {
                'id': str(branch.id),
                'name': branch.branch_name,
                'code': branch.branch_code,
                'city': branch.city,
                'state': branch.state,
                'phone_number': branch.phone_number,
                'email': branch.email,
            }
        else:
            # Admin not assigned to specific branch, show entire firm stats
            cases_qs = Case.objects.filter(firm=firm) if Case else Case.objects.none()
            clients_qs = Client.objects.filter(firm=firm) if Client else Client.objects.none()
            team_qs = CustomUser.objects.filter(firm=firm, is_active=True)
            branch_info = None
        
        total_cases = cases_qs.count()
        # Count client users instead of Client records for consistency with user management
        total_clients = team_qs.filter(user_type='client').count()
        total_team = team_qs.count()
        
        # Get document count
        if branch:
            # Documents for this branch (uploaded by branch members)
            from accounts.models import UserFirmRole
            branch_user_ids = UserFirmRole.objects.filter(
                firm=firm,
                branch=branch,
                is_active=True
            ).values_list('user_id', flat=True)
            total_documents = UserDocument.objects.filter(
                uploaded_by__id__in=branch_user_ids,
                is_deleted=False
            ).count()
        else:
            total_documents = UserDocument.objects.filter(firm=firm, is_deleted=False).count()
        
        # Get task counts
        if branch:
            pending_tasks = Task.objects.filter(
                firm=firm,
                assigned_to__id__in=branch_user_ids,
                status='pending'
            ).count() if Task else 0
            upcoming_tasks = Task.objects.filter(
                firm=firm,
                assigned_to__id__in=branch_user_ids,
                status='pending',
                due_date__gte=timezone.now(),
                due_date__lte=timezone.now() + timezone.timedelta(days=7)
            ).count() if Task else 0
        else:
            pending_tasks = Task.objects.filter(
                firm=firm,
                status='pending'
            ).count() if Task else 0
            upcoming_tasks = Task.objects.filter(
                firm=firm,
                status='pending',
                due_date__gte=timezone.now(),
                due_date__lte=timezone.now() + timezone.timedelta(days=7)
            ).count() if Task else 0
        
        return {
            'cards': {
                'total_cases': {
                    'total': total_cases,
                    'running': cases_qs.filter(status__in=['open', 'in_progress']).count(),
                    'disposed': cases_qs.filter(status='disposed').count(),
                    'closed': cases_qs.filter(status='closed').count(),
                },
                'total_clients': total_clients,
                'total_documents': total_documents,
                'team_members': total_team,
                'todos': {
                    'pending': pending_tasks,
                    'upcoming': upcoming_tasks,
                },
            },
            'firm_info': {
                'id': str(firm.id),
                'name': firm.firm_name,
                'code': firm.firm_code,
                'subscription': firm.subscription_type,
                'practice_areas': firm.practice_areas or [],
            },
            'branch_info': branch_info,
            'recent_activity': list(AuditLog.objects.filter(
                user__firm=firm
            )[:10].values('action', 'description', 'created_at', 'user__email'))
        }
    
    def get_advocate_stats(self, user, firm):
        """Advocate sees stats for their assigned clients and cases"""
        if not firm:
            return {'error': 'User not associated with a firm'}
        
        # Cases assigned to this advocate
        my_cases = Case.objects.filter(assigned_advocate=user) if Case else Case.objects.none()
        
        # Clients assigned to this advocate
        my_clients = Client.objects.filter(assigned_advocate=user) if Client else Client.objects.none()
        
        # Documents for my clients
        my_documents = UserDocument.objects.filter(
            Q(client__assigned_advocate=user) | Q(case__assigned_advocate=user),
            is_deleted=False
        )
        
        # My tasks
        my_tasks = Task.objects.filter(assigned_to=user) if Task else Task.objects.none()
        
        return {
            'cards': {
                'my_cases': my_cases.count(),
                'open_cases': my_cases.filter(status='open').count(),
                'in_progress_cases': my_cases.filter(status='in_progress').count(),
                'my_clients': my_clients.count(),
                'my_documents': my_documents.count(),
                'pending_tasks': my_tasks.filter(status='pending').count(),
                'overdue_tasks': my_tasks.filter(
                    status='pending',
                    due_date__lt=timezone.now()
                ).count(),
                'upcoming_hearings': my_cases.filter(
                    next_hearing_date__gte=timezone.now(),
                    next_hearing_date__lte=timezone.now() + timezone.timedelta(days=7)
                ).count(),
            },
            'firm_info': {
                'id': str(firm.id),
                'name': firm.firm_name,
            },
            'recent_cases': list(my_cases.order_by('-updated_at')[:5].values(
                'id', 'case_title', 'case_number', 'status', 'next_hearing_date', 'updated_at'
            )),
            'recent_clients': list(my_clients.order_by('-created_at')[:5].values(
                'id', 'first_name', 'last_name', 'email', 'phone_number', 'created_at'
            ))
        }
    
    def get_paralegal_stats(self, user, firm):
        """Paralegal sees stats for their assigned cases"""
        if not firm:
            return {'error': 'User not associated with a firm'}
        
        # Cases assigned to this paralegal
        my_cases = Case.objects.filter(assigned_paralegal=user) if Case else Case.objects.none()
        
        # My tasks
        my_tasks = Task.objects.filter(assigned_to=user) if Task else Task.objects.none()
        
        # Documents I uploaded
        my_documents = UserDocument.objects.filter(
            uploaded_by=user,
            is_deleted=False
        )
        
        return {
            'cards': {
                'my_cases': my_cases.count(),
                'open_cases': my_cases.filter(status='open').count(),
                'in_progress_cases': my_cases.filter(status='in_progress').count(),
                'my_documents': my_documents.count(),
                'pending_tasks': my_tasks.filter(status='pending').count(),
                'overdue_tasks': my_tasks.filter(
                    status='pending',
                    due_date__lt=timezone.now()
                ).count(),
            },
            'firm_info': {
                'id': str(firm.id),
                'name': firm.firm_name,
            },
            'recent_cases': list(my_cases.order_by('-updated_at')[:5].values(
                'id', 'case_title', 'case_number', 'status', 'updated_at'
            ))
        }
    
    def get_client_stats(self, user):
        """Client sees stats for their own cases and documents"""
        # Get client profile
        client_profile = getattr(user, 'client_profile', None)
        
        if not client_profile:
            return {
                'cards': {
                    'my_cases': 0,
                    'my_documents': 0,
                },
                'message': 'No client profile found'
            }
        
        # My cases
        my_cases = Case.objects.filter(client=client_profile) if Case else Case.objects.none()
        
        # My documents
        my_documents = UserDocument.objects.filter(
            client=client_profile,
            is_deleted=False
        )
        
        return {
            'cards': {
                'my_cases': my_cases.count(),
                'open_cases': my_cases.filter(status='open').count(),
                'in_progress_cases': my_cases.filter(status='in_progress').count(),
                'closed_cases': my_cases.filter(status='closed').count(),
                'my_documents': my_documents.count(),
                'upcoming_hearings': my_cases.filter(
                    next_hearing_date__gte=timezone.now()
                ).count(),
            },
            'client_info': {
                'id': str(client_profile.id),
                'name': client_profile.get_full_name(),
                'email': client_profile.email,
                'phone': client_profile.phone_number,
                'assigned_advocate': client_profile.assigned_advocate.get_full_name() if client_profile.assigned_advocate else None,
            },
            'recent_cases': list(my_cases.order_by('-updated_at')[:5].values(
                'id', 'case_title', 'case_number', 'status', 'next_hearing_date', 'updated_at'
            ))
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
        
        # Get the firm for this branch
        firm_id = self.request.data.get('firm')
        if not firm_id:
            raise PermissionDenied('Firm is required')
        
        try:
            firm = Firm.objects.get(id=firm_id)
        except Firm.DoesNotExist:
            raise PermissionDenied('Firm not found')
        
        # Check subscription-based branch limit
        if not firm.can_create_branch():
            current_count = firm.get_current_branch_count()
            limit = firm.get_branch_limit()
            from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
            raise DRFPermissionDenied({
                'error': f'Branch limit reached. Your {firm.subscription_type} plan allows {limit} branch(es). You currently have {current_count} active branch(es).',
                'current_branches': current_count,
                'branch_limit': limit,
                'subscription_type': firm.subscription_type,
                'upgrade_message': 'Please upgrade your subscription to create more branches.'
            })
        
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
