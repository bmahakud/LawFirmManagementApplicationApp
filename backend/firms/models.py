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
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm_name = models.CharField(max_length=255, unique=True)
    firm_code = models.CharField(max_length=50, unique=True)
    
    # Location Info
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    address = models.TextField(blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.firm_name

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
