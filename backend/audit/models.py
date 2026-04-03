from django.db import models
import uuid


class AuditLog(models.Model):
    """Track user actions for compliance"""
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create_user', 'Create User'),
        ('update_user', 'Update User'),
        ('delete_user', 'Delete User'),
        ('verify_document', 'Verify Document'),
        ('change_password', 'Change Password'),
        ('otp_sent', 'OTP Sent'),
        ('otp_verified', 'OTP Verified'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_action_display()}"
