from rest_framework import serializers
from .models import Firm, Branch
from accounts.serializers import UserBriefSerializer


class BranchSerializer(serializers.ModelSerializer):
    admin_details = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            'id', 'firm', 'branch_name', 'branch_code', 'city', 'state',
            'address', 'phone_number', 'email', 'is_active', 'admin_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_admin_details(self, obj):
        from accounts.models import CustomUser
        admin = CustomUser.objects.filter(
            firm_memberships__branch=obj, 
            firm_memberships__user_type='admin'
        ).first()
        if admin:
            return UserBriefSerializer(admin).data
        return None


class FirmSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    super_admin_details = serializers.SerializerMethodField()
    branch_limit = serializers.SerializerMethodField()
    current_branch_count = serializers.SerializerMethodField()
    remaining_branches = serializers.SerializerMethodField()
    can_create_branch = serializers.SerializerMethodField()
    is_suspended = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = Firm
        fields = [
            'id', 'firm_name', 'firm_code', 'city', 'state', 'country',
            'address', 'postal_code', 'registration_number', 'logo', 'practice_areas',
            'phone_number', 'email', 'website', 'subscription_type', 'subscription_end_date',
            'trial_end_date', 'is_active', 'is_suspended', 'subscription_status', 'days_until_expiry',
            'branches', 'super_admin_details', 'branch_limit', 'current_branch_count',
            'remaining_branches', 'can_create_branch', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'branch_limit', 
                           'current_branch_count', 'remaining_branches', 'can_create_branch',
                           'is_suspended', 'subscription_status', 'days_until_expiry']

    def get_super_admin_details(self, obj):
        from accounts.models import CustomUser
        super_admin = CustomUser.objects.filter(
            firm=obj, 
            user_type='super_admin'
        ).first()
        if super_admin:
            return UserBriefSerializer(super_admin).data
        return None
    
    def get_is_suspended(self, obj):
        """Check if firm is suspended (expired or manually deactivated)"""
        return obj.is_suspended
    
    def get_subscription_status(self, obj):
        """Get human-readable subscription status"""
        from django.utils import timezone
        
        if not obj.is_active:
            return 'suspended'
        
        if obj.subscription_end_date:
            if obj.subscription_end_date < timezone.now():
                return 'expired'
            else:
                days_left = (obj.subscription_end_date - timezone.now()).days
                if days_left <= 7:
                    return 'expiring_soon'
                return 'active'
        
        return 'active'
    
    def get_days_until_expiry(self, obj):
        """Get days until subscription expires (negative if expired)"""
        from django.utils import timezone
        
        if obj.subscription_end_date:
            days = (obj.subscription_end_date - timezone.now()).days
            return days
        
        return None
    
    def get_branch_limit(self, obj):
        return obj.get_branch_limit()
    
    def get_current_branch_count(self, obj):
        return obj.get_current_branch_count()
    
    def get_remaining_branches(self, obj):
        return obj.get_remaining_branches()
    
    def get_can_create_branch(self, obj):
        return obj.can_create_branch()
