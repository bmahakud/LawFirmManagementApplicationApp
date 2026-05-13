from django.db import models
import uuid
from .models import Case


class ServiceAttempt(models.Model):
    """
    Track every attempt to serve summons/notice to defendant.
    CPC requires proper service before proceeding.
    """
    
    SERVICE_TYPE_CHOICES = [
        ('summons', 'Summons'),
        ('notice', 'Notice'),
        ('order', 'Order'),
        ('warrant', 'Warrant'),
    ]
    
    SERVICE_METHOD_CHOICES = [
        ('personal', 'Personal Service'),
        ('registered_post', 'Registered Post'),
        ('courier', 'Courier'),
        ('publication', 'Publication in Newspaper'),
        ('email', 'Email'),
        ('affixture', 'Affixture on Property'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('served', 'Served Successfully'),
        ('unserved', 'Unserved'),
        ('returned', 'Returned Unserved'),
        ('refused', 'Refused by Recipient'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='service_attempts')
    
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES, default='summons')
    service_date = models.DateField(help_text="Date when service was attempted")
    service_method = models.CharField(max_length=30, choices=SERVICE_METHOD_CHOICES)
    
    served_to = models.CharField(max_length=255, blank=True, help_text="Name of person who received")
    served_by = models.CharField(max_length=255, blank=True, help_text="Process server name")
    address = models.TextField(help_text="Address where service was attempted")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    proof_document = models.FileField(
        upload_to='service_proofs/',
        null=True,
        blank=True,
        help_text="Upload proof of service (acknowledgment, postal receipt, etc.)"
    )
    
    remarks = models.TextField(blank=True, help_text="Any notes or observations")
    next_attempt_date = models.DateField(
        null=True,
        blank=True,
        help_text="If failed, when to attempt next"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='service_attempts_created'
    )
    
    class Meta:
        ordering = ['-service_date']
        verbose_name = 'Service Attempt'
        verbose_name_plural = 'Service Attempts'
    
    def __str__(self):
        return f"{self.get_service_type_display()} - {self.case.case_number} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Auto-create activity log
        if is_new:
            from .models import CaseActivity
            CaseActivity.objects.create(
                case=self.case,
                performed_by=self.created_by,
                activity_type='service_attempt_created',
                description=f"{self.get_service_type_display()} service attempted via {self.get_service_method_display()} - Status: {self.get_status_display()}"
            )
        
        # If service is successful, update case stage if still in initial stages
        if self.status == 'served' and self.case.stage in ['case_filing', 'initial_consultation']:
            self.case.stage = 'hearing'
            self.case.save()
