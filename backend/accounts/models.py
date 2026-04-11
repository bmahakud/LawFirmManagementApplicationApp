from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.utils import timezone
import uuid


class CustomUser(AbstractUser):
    """Custom User model supporting multiple user types and login methods"""
    
    USER_TYPE_CHOICES = [
        ('platform_owner', 'Platform Owner'),
        ('partner_manager', 'Partner Manager'),
        ('super_admin', 'Super Admin (Firm Owner)'),
        ('admin', 'Admin'),
        ('advocate', 'Advocate'),
        ('paralegal', 'Paralegal'),
        ('client', 'Client'),
    ]
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    # Basic Info
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message='Phone number must be entered in the format: +999999999. Up to 15 digits allowed.'
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, unique=True)
    
    # Personal Details
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    
    # Address
    address_line_1 = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    
    # Professional Details
    firm = models.ForeignKey(
        'firms.Firm',
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    
    # Document/Verification
    aadhar_number = models.CharField(max_length=12, blank=True, unique=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, unique=True, null=True)
    bar_council_registration = models.CharField(max_length=100, blank=True)
    bar_council_state = models.CharField(max_length=100, blank=True)
    
    # Status
    is_phone_verified = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_document_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    # Password setup flag
    password_set = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone_number']),
            models.Index(fields=['email']),
            models.Index(fields=['user_type']),
            models.Index(fields=['firm']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.get_user_type_display()})"


class LoginCredential(models.Model):
    """Stores login credentials for different login methods"""
    
    LOGIN_TYPE_CHOICES = [
        ('username_password', 'Username + Password'),
        ('phone_otp', 'Phone + OTP'),
        ('email_otp', 'Email + OTP'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='login_credential')
    
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    
    phone_otp = models.CharField(max_length=6, blank=True)
    phone_otp_created_at = models.DateTimeField(null=True, blank=True)
    phone_otp_attempts = models.IntegerField(default=0)
    
    email_otp = models.CharField(max_length=6, blank=True)
    email_otp_created_at = models.DateTimeField(null=True, blank=True)
    email_otp_attempts = models.IntegerField(default=0)
    
    is_phone_otp_verified = models.BooleanField(default=False)
    is_email_otp_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['username']),
        ]
    
    def __str__(self):
        return f"Login Credentials - {self.user.get_full_name()}"


class OTPVerification(models.Model):
    """Tracks OTP verification attempts"""
    
    OTP_TYPE_CHOICES = [
        ('phone', 'Phone'),
        ('email', 'Email'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otp_verifications')
    otp_type = models.CharField(max_length=10, choices=OTP_TYPE_CHOICES)
    otp_code = models.CharField(max_length=6)
    
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=5)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP - {self.user.phone_number} ({self.otp_type})"
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        return not self.is_expired() and self.attempts < self.max_attempts


class UserInvitation(models.Model):
    """Track user invitations sent by admins"""
    
    INVITATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    invited_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='invitations_sent'
    )
    invited_user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE,
        related_name='invitations_received',
        null=True,
        blank=True
    )
    
    email = models.EmailField()
    phone_number = models.CharField(max_length=17)
    user_type = models.CharField(max_length=20, choices=CustomUser.USER_TYPE_CHOICES)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='user_invitations')
    
    status = models.CharField(
        max_length=20, 
        choices=INVITATION_STATUS_CHOICES, 
        default='pending'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation to {self.email} - {self.get_status_display()}"


class FirmJoinLink(models.Model):
    """Generic reusable links for joining a firm with a specific role"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='join_links')
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    
    user_type = models.CharField(max_length=20, choices=CustomUser.USER_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    
    # Optional limits
    max_uses = models.IntegerField(default=0, help_text="0 for unlimited")
    usage_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['firm', 'user_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"Join Link: {self.firm.firm_name} - {self.get_user_type_display()}"
    
    def is_valid(self):
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        if self.max_uses > 0 and self.usage_count >= self.max_uses:
            return False
        return True

class UserFirmRole(models.Model):
    """Mapping of users to law firms with specific roles"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='firm_memberships')
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='firm_members')
    branch = models.ForeignKey('firms.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='branch_members')
    user_type = models.CharField(max_length=20, choices=CustomUser.USER_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    
    # Selection flag for the "current" active firm in a session
    is_last_active = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'firm')
        indexes = [
            models.Index(fields=['user', 'firm']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.firm.firm_name} ({self.get_user_type_display()})"

class GlobalConfiguration(models.Model):
    """System-wide configuration settings"""
    
    TRIAL_PERIOD_CHOICES = [
        (0, 'No Trial'),
        (7, '7 Days'),
        (15, '15 Days'),
        (30, '30 Days'),
        (60, '60 Days'),
        (90, '90 Days'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    is_free_trial_enabled = models.BooleanField(
        default=True, 
        help_text="Allow Super Admins to self-register with a free trial"
    )
    trial_period_days = models.IntegerField(
        default=15,
        choices=TRIAL_PERIOD_CHOICES,
        help_text="Number of days for free trial period"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='config_updates'
    )
    
    class Meta:
        verbose_name_plural = "Global Configuration"
    
    def __str__(self):
        return f"Global Configuration (Trial: {self.is_free_trial_enabled}, Period: {self.trial_period_days} days)"

    @classmethod
    def get_settings(cls):
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create(is_free_trial_enabled=True, trial_period_days=15)
        return obj


from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=CustomUser)
def sync_user_firm_role(sender, instance, created, **kwargs):
    """Sync CustomUser.firm/user_type with UserFirmRole for backward compatibility"""
    # Simple check to prevent infinite recursion
    if getattr(instance, '_syncing_role', False):
        return
    
    if instance.firm:
        instance._syncing_role = True
        # Check if mapping already exists
        role, created_role = UserFirmRole.objects.get_or_create(
            user=instance,
            firm=instance.firm,
            defaults={'user_type': instance.user_type, 'is_last_active': True}
        )
        if not created_role:
            # Update role if it changed on the user model directly
            if role.user_type != instance.user_type:
                role.user_type = instance.user_type
                role.save()
            if not role.is_last_active:
                # If this firm is now set on the user model, mark it as last active
                instance.firm_memberships.update(is_last_active=False)
                role.is_last_active = True
                role.save()
        instance._syncing_role = False
