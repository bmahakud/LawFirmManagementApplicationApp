from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Case, CaseActivity, Hearing, CaseDraft
from .serializers import (
    CaseSerializer, CaseActivitySerializer, 
    HearingSerializer, CaseDraftSerializer
)
from audit.models import AuditLog

from firms.permissions import IsSubscriptionActive

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionActive]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'case_title', 'case_number', 'petitioner_name', 
        'respondent_name', 'court_name', 'cnr_number'
    ]
    ordering_fields = ['created_at', 'next_hearing_date', 'priority']

    def get_queryset(self):
        user = self.request.user
        queryset = Case.objects.all()
        
        if user.user_type != 'platform_owner':
            # Firm-specific filtering
            queryset = queryset.filter(firm=user.firm)
        
        # Filter by status if provided (e.g. ?status=running)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        # Helper for Active cases (?is_active=true)
        # Filters out closed, disposed, and judgment cases
        is_active = self.request.query_params.get('is_active')
        if is_active and is_active.lower() == 'true':
            active_statuses = ['running', 'created', 'filed', 'evidence', 'hearing']
            queryset = queryset.filter(status__in=active_statuses)
            
        # Filter by category if provided (e.g. ?category=pre_litigation)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        from rest_framework.exceptions import PermissionDenied, ValidationError
        
        # 1. Permission Check
        allowed_roles = ['advocate', 'admin', 'super_admin', 'platform_owner']
        if user.user_type not in allowed_roles:
            raise PermissionDenied("You do not have permission to create cases.")
            
        # 2. Extract assignment data
        advocate = serializer.validated_data.get('assigned_advocate')
        branch = serializer.validated_data.get('branch')
        
        # 3. Validation: Advocate must belong to the same firm
        if advocate and advocate.firm != user.firm:
            raise ValidationError({"assigned_advocate": "Assigned advocate must belong to the same law firm."})
            
        # 4. Branch Logic
        if user.user_type == 'admin':
            # Admins are locked to their specific branch
            from accounts.models import UserFirmRole
            admin_role = UserFirmRole.objects.filter(user=user, firm=user.firm).first()
            if admin_role and admin_role.branch:
                branch = admin_role.branch
            elif not branch:
                 # Fallback to user's direct branch link if available
                 pass

        # 5. Save Case
        case = serializer.save(firm=user.firm, branch=branch)
        
        # 6. Log activity
        CaseActivity.objects.create(
            case=case,
            performed_by=user,
            activity_type='case_created',
            description=f"Case created by {user.get_full_name()} ({user.get_user_type_display()})"
        )

    def perform_update(self, serializer):
        old_status = self.get_object().status
        case = serializer.save()
        new_status = case.status
        
        if old_status != new_status:
            CaseActivity.objects.create(
                case=case,
                performed_by=self.request.user,
                activity_type='status_change',
                description=f"Status changed from {old_status} to {new_status}",
                previous_status=old_status,
                new_status=new_status
            )

class HearingViewSet(viewsets.ModelViewSet):
    queryset = Hearing.objects.all()
    serializer_class = HearingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Hearing.objects.filter(case__firm=self.request.user.firm)

class CaseDraftViewSet(viewsets.ModelViewSet):
    queryset = CaseDraft.objects.all()
    serializer_class = CaseDraftSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CaseDraft.objects.filter(case__firm=self.request.user.firm)
