from django.db import models
import uuid


class Partner(models.Model):
    """Sales Partner / Referral Partner - can sell but not use the system"""
    
    PARTNER_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        'accounts.CustomUser', 
        on_delete=models.CASCADE, 
        related_name='partner_profile',
        limit_choices_to={'user_type': 'partner_manager'}
    )
    
    # Partner Details
    company_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, blank=True)
    
    # Commission/Referral
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(
        max_length=20, 
        choices=PARTNER_STATUS_CHOICES, 
        default='active'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.company_name} - {self.user.get_full_name()}"
