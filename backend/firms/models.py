from django.db import models
import uuid


class Firm(models.Model):
    """Law Firm model - created by Platform Owner"""
    
    SUBSCRIPTION_CHOICES = [
        ('trial', 'Trial'),
        ('basic', 'Basic'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    ]
    
    # Subscription-based branch limits
    BRANCH_LIMITS = {
        'trial': 1,
        'basic': 3,
        'professional': 10,
        'enterprise': 999,  # Unlimited
    }
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm_name = models.CharField(max_length=255, unique=True)
    firm_code = models.CharField(max_length=50, unique=True)
    
    # Location Info
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    address = models.TextField(blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    logo = models.ImageField(upload_to='firm_logos/', null=True, blank=True)
    practice_areas = models.JSONField(default=list, blank=True) # Criminal, Civil, etc.
    
    # Contact Info
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    website = models.URLField(blank=True)
    
    # Subscription
    subscription_type = models.CharField(
        max_length=20, 
        choices=SUBSCRIPTION_CHOICES, 
        default='trial'
    )
    trial_end_date = models.DateTimeField(null=True, blank=True)
    subscription_start_date = models.DateTimeField(auto_now_add=True)
    subscription_end_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    partner = models.ForeignKey(
        'partners.Partner',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='onboarded_firms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.firm_name

    @property
    def is_suspended(self):
        """Checks if the firm should be restricted regardless of is_active flag"""
        from django.utils import timezone
        
        # 1. Manual check
        if not self.is_active:
            return True
            
        # 2. Expiry check (no subscription or expired date)
        if not self.subscription_end_date:
            return True
            
        if self.subscription_end_date < timezone.now():
            return True
            
        return False
    
    def save(self, *args, **kwargs):
        from django.utils import timezone
        from datetime import timedelta
        import random
        import string

        # Ensure firm_code exists
        if not self.firm_code:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            while Firm.objects.filter(firm_code=code).exists():
                code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            self.firm_code = code

        is_new = self._state.adding

        # Check GlobalConfiguration for trial days (default 30 days / 1 month)
        trial_days = 30
        try:
            from accounts.models import GlobalConfiguration
            cfg = GlobalConfiguration.get_settings()
            if cfg and cfg.trial_period_days:
                trial_days = cfg.trial_period_days
        except Exception:
            trial_days = 30

        # Auto-provision 1-month free subscription when creating a new law firm
        if is_new and not self.subscription_end_date:
            now = timezone.now()
            self.subscription_type = 'trial'
            self.trial_end_date = now + timedelta(days=trial_days)
            self.subscription_end_date = self.trial_end_date

        super().save(*args, **kwargs)

        # Ensure FirmSubscription record is linked
        try:
            from subscriptions.models import SubscriptionPlan, FirmSubscription
            
            if not FirmSubscription.objects.filter(firm=self).exists():
                trial_plan = (
                    SubscriptionPlan.objects.filter(name__iexact='Trial', is_active=True).first()
                    or SubscriptionPlan.objects.filter(price=0, is_active=True).first()
                    or SubscriptionPlan.objects.filter(plan_type='basic', is_active=True).first()
                    or SubscriptionPlan.objects.filter(is_active=True).first()
                )
                if not trial_plan:
                    trial_plan = SubscriptionPlan.objects.create(
                        name="1-Month Free Trial",
                        plan_type="basic",
                        description="Default 1-month free trial plan",
                        price=0.00,
                        billing_cycle="monthly",
                        max_advocates=10,
                        max_paralegals=10,
                        max_admins=5,
                        max_users=30,
                        max_clients=500,
                        max_cases=500,
                        max_storage_gb=50,
                        max_branches=3,
                        enable_billing=True,
                        enable_calendar=True,
                        enable_documents=True,
                        enable_reports=True,
                        enable_api_access=False,
                        is_active=True
                    )

                FirmSubscription.objects.create(
                    firm=self,
                    plan=trial_plan,
                    status='trialing',
                    start_date=self.subscription_start_date or timezone.now(),
                    end_date=self.subscription_end_date or (timezone.now() + timedelta(days=trial_days)),
                    is_trial=True,
                    auto_renew=False
                )
        except Exception:
            pass
    
    def get_branch_limit(self):
        """Get the maximum number of branches allowed for current subscription"""
        return self.BRANCH_LIMITS.get(self.subscription_type, 1)
    
    def get_current_branch_count(self):
        """Get the current number of active branches"""
        return self.branches.filter(is_active=True).count()
    
    def can_create_branch(self):
        """Check if firm can create more branches based on subscription"""
        return self.get_current_branch_count() < self.get_branch_limit()
    
    def get_remaining_branches(self):
        """Get the number of branches that can still be created"""
        limit = self.get_branch_limit()
        current = self.get_current_branch_count()
        remaining = limit - current
        return max(0, remaining)

class Branch(models.Model):
    """Branch within a law firm"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey(Firm, on_delete=models.CASCADE, related_name='branches')
    branch_name = models.CharField(max_length=255)
    branch_code = models.CharField(max_length=50, blank=True)
    
    # Location Info
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    address = models.TextField(blank=True)
    
    # Contact Info
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('firm', 'branch_name')
        ordering = ['branch_name']
        
    def __str__(self):
        return f"{self.firm.firm_name} - {self.branch_name}"
