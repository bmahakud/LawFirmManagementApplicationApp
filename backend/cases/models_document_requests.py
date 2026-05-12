from django.db import models
import uuid


class CaseDocumentRequest(models.Model):
    """
    Document requests created by advocates for clients to upload specific documents for a case.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('uploaded', 'Uploaded'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.CASCADE,
        related_name='document_requests'
    )
    
    # Document details
    document_type = models.CharField(
        max_length=50,
        help_text="Type of document requested (e.g., aadhar, pan, fir, etc.)"
    )
    document_title = models.CharField(
        max_length=255,
        help_text="Title/name of the requested document"
    )
    description = models.TextField(
        blank=True,
        help_text="Description of what document is needed and why"
    )
    
    # Request details
    requested_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.CASCADE,
        related_name='document_requests_created',
        help_text="Advocate who requested this document"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text="Deadline for document submission"
    )
    
    # Uploaded document reference
    uploaded_document = models.ForeignKey(
        'documents.UserDocument',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fulfills_request',
        help_text="Document uploaded by client to fulfill this request"
    )
    uploaded_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    advocate_notes = models.TextField(
        blank=True,
        help_text="Internal notes from advocate"
    )
    client_notes = models.TextField(
        blank=True,
        help_text="Notes from client when uploading"
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Reason if document is rejected"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['case', 'status']),
            models.Index(fields=['status', 'due_date']),
        ]
    
    def __str__(self):
        return f"{self.document_title} - {self.case.case_title} ({self.get_status_display()})"
