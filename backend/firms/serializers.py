from rest_framework import serializers
from .models import Firm, Branch
from django.utils import timezone


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = [
            'id', 'firm', 'branch_name', 'branch_code', 
            'city', 'state', 'address', 'phone_number', 'email',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FirmSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    branch_limit = serializers.SerializerMethodField()
    current_branch_count = serializers.SerializerMethodField()
    can_create_branch = serializers.SerializerMethodField()
    remaining_branches = serializers.SerializerMethodField()
    partner_name = serializers.CharField(source='partner.company_name', read_only=True)
    is_suspended = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = Firm
        fields = [
            'id', 'firm_name', 'firm_code', 'city', 'state', 'country',
            'address', 'postal_code', 'registration_number', 'logo', 'practice_areas',
            'phone_number', 'email', 'website',
            'subscription_type', 'trial_end_date', 
            'subscription_start_date', 'subscription_end_date',
            'is_active', 'partner', 'partner_name', 
            'branches', 'branch_limit', 'current_branch_count',
            'can_create_branch', 'remaining_branches',
            'is_suspended', 'subscription_status', 'days_until_expiry',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'firm_code']
    
    def get_branch_limit(self, obj):
        return obj.get_branch_limit()
    
    def get_current_branch_count(self, obj):
        return obj.get_current_branch_count()
    
    def get_can_create_branch(self, obj):
        return obj.can_create_branch()
    
    def get_remaining_branches(self, obj):
        return obj.get_remaining_branches()
    
    def get_is_suspended(self, obj):
        return obj.is_suspended
    
    def get_subscription_status(self, obj):
        """Get human-readable subscription status"""
        if not obj.is_active:
            return {
                'status': 'suspended',
                'message': f"Firm '{obj.firm_name}' has been suspended",
                'can_access': False
            }
        
        if not obj.subscription_end_date:
            return {
                'status': 'expired',
                'message': f"Firm '{obj.firm_name}' does not have an active subscription",
                'can_access': False
            }
        
        if obj.subscription_end_date < timezone.now():
            days_expired = max(1, (timezone.now() - obj.subscription_end_date).days)
            return {
                'status': 'expired',
                'message': f"1-month free trial expired {days_expired} day{'s' if days_expired != 1 else ''} ago (on {obj.subscription_end_date.strftime('%B %d, %Y')}). Please refill subscription.",
                'expired_date': obj.subscription_end_date.strftime('%B %d, %Y'),
                'days_expired': days_expired,
                'can_access': False
            }
        
        return {
            'status': 'active',
            'message': 'Subscription is active',
            'expired_date': obj.subscription_end_date.strftime('%B %d, %Y'),
            'can_access': True
        }
    
    def get_days_until_expiry(self, obj):
        """Get days until subscription expires (negative if expired)"""
        if not obj.subscription_end_date:
            return 0
        
        from django.utils import timezone
        delta = obj.subscription_end_date - timezone.now()
        return delta.days
