from django.db import models
import uuid


class UserDocument(models.Model):
    """Store user documents for verification"""
    
    DOCUMENT_TYPE_CHOICES = [
        ('aadhar', 'Aadhar Card'),
        ('pan', 'PAN Card'),
        ('passport', 'Passport'),
        ('driving_license', 'Driving License'),
        ('bar_certificate', 'Bar Council Certificate'),
        ('degree', 'Educational Degree'),
        ('other', 'Other'),
    ]
    
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='documents')
    
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    document_number = models.CharField(max_length=100, blank=True)
    document_file = models.FileField(upload_to='documents/%Y/%m/%d/')
    
    # Verification
    verification_status = models.CharField(
        max_length=20, 
        choices=VERIFICATION_STATUS_CHOICES, 
        default='pending'
    )
    verified_by = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verified_documents'
    )
    verification_notes = models.TextField(blank=True)
    
    # Timestamps
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_document_type_display()}"
