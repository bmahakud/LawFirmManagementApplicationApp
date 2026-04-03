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
