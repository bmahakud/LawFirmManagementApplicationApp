from django.db import models
import uuid
from decimal import Decimal
from django.utils import timezone

class SubscriptionPlan(models.Model):
    PLAN_TYPE_CHOICES = [
        ('basic', 'Basic'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
        ('custom', 'Custom'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPE_CHOICES, default='basic')
    
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default='monthly')
    
    # Limits (Increased for better user experience)
    max_advocates = models.IntegerField(default=10, help_text="Maximum number of advocates allowed")
    max_paralegals = models.IntegerField(default=10, help_text="Maximum number of paralegals allowed")
    max_admins = models.IntegerField(default=5, help_text="Maximum number of admins allowed")
    max_users = models.IntegerField(default=30, help_text="Maximum total team members")
    max_clients = models.IntegerField(default=500, help_text="Maximum number of clients")
    max_cases = models.IntegerField(default=500, help_text="Maximum number of active cases allowed")
    max_storage_gb = models.IntegerField(default=50, help_text="Storage limit in GB")
    max_branches = models.IntegerField(default=5, help_text="Maximum number of branches")
    
    # Feature Flags
    enable_billing = models.BooleanField(default=True, help_text="Enable billing & invoicing module")
    enable_calendar = models.BooleanField(default=True, help_text="Enable calendar events")
    enable_documents = models.BooleanField(default=True, help_text="Enable document management")
    enable_reports = models.BooleanField(default=False, help_text="Enable advanced reports & analytics")
    enable_api_access = models.BooleanField(default=False, help_text="Enable API access")
    
    # Features (JSON for flexibility)
    features = models.JSONField(default=dict, help_text="Map of enabled features e.g. {'analytics': true}")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_billing_cycle_display()})"

class FirmSubscription(models.Model):
    STATUS_CHOICES = [
        ('trialing', 'Free Trial'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.OneToOneField('firms.Firm', on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trialing')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    
    is_trial = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=True)
    
    # External Payment tracking
    external_subscription_id = models.CharField(max_length=255, blank=True, null=True) # e.g. Stripe ID
    external_customer_id = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.firm.firm_name} - {self.plan.name} ({self.get_status_display()})"

    @property
    def is_valid(self):
        from django.utils import timezone
        return self.status in ['active', 'trialing'] and self.end_date > timezone.now()


class PlatformInvoice(models.Model):
    """
    Invoices from Platform Owner to Firms for subscription fees.
    This is separate from client invoices (billing.Invoice).
    """
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('card', 'Credit/Debit Card'),
        ('cheque', 'Cheque'),
        ('online', 'Online Payment'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='platform_invoices')
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='platform_invoices')
    
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    
    # Billing period
    period_start = models.DateField(help_text="Start date of billing period")
    period_end = models.DateField(help_text="End date of billing period")
    
    # Amounts
    plan_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Subscription plan amount"
    )
    tax_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=18,
        help_text="Tax percentage (e.g., GST 18%)"
    )
    tax_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0
    )
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Total amount including tax"
    )
    
    paid_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0
    )
    balance_due = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Remaining balance to be paid"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Payment tracking
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    payment_notes = models.TextField(blank=True)
    
    # Additional info
    notes = models.TextField(blank=True, help_text="Notes visible to firm")
    internal_notes = models.TextField(blank=True, help_text="Internal notes not visible to firm")
    
    # Tracking
    sent_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_platform_invoices'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['firm', 'status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['invoice_date']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-calculate amounts
        if self.plan_amount and self.tax_percentage:
            self.tax_amount = self.plan_amount * (self.tax_percentage / 100)
            self.total_amount = self.plan_amount + self.tax_amount
            self.balance_due = self.total_amount - self.paid_amount
        
        # Auto-update status based on payment and due date
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.due_date < timezone.now().date() and self.status not in ['paid', 'cancelled']:
            self.status = 'overdue'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Platform Invoice {self.invoice_number} - {self.firm.firm_name}"
    
    def mark_as_paid(self, amount, payment_method, transaction_id='', payment_date=None):
        """Mark invoice as paid"""
        self.paid_amount = amount
        self.payment_method = payment_method
        self.transaction_id = transaction_id
        self.payment_date = payment_date or timezone.now().date()
        self.save()  # Will auto-update status to 'paid'
