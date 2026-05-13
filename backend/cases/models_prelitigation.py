"""
Pre-Litigation Models: Document Checklist, Case Research, Legal Notice Management
"""
from django.db import models
import uuid
from .models import Case


class DocumentChecklist(models.Model):
    """
    Document checklist for different case types.
    Defines what documents are needed for each case type.
    """
    CASE_TYPE_CHOICES = [
        ('civil', 'Civil Case'),
        ('criminal', 'Criminal Case'),
        ('family', 'Family Law'),
        ('property', 'Property Dispute'),
        ('consumer', 'Consumer Case'),
        ('labour', 'Labour Dispute'),
        ('corporate', 'Corporate/Commercial'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_type = models.CharField(max_length=50, choices=CASE_TYPE_CHOICES)
    document_name = models.CharField(max_length=255, help_text="Name of required document")
    description = models.TextField(blank=True, help_text="What this document is for")
    is_mandatory = models.BooleanField(default=True, help_text="Is this document required?")
    display_order = models.IntegerField(default=0, help_text="Order to display in checklist")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['case_type', 'display_order', 'document_name']
        verbose_name = 'Document Checklist Template'
        verbose_name_plural = 'Document Checklist Templates'
    
    def __str__(self):
        return f"{self.get_case_type_display()} - {self.document_name}"


class CaseDocumentChecklistItem(models.Model):
    """
    Tracks document collection status for a specific case.
    Links to DocumentChecklist template.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('requested', 'Requested from Client'),
        ('received', 'Received'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected - Need Reupload'),
        ('not_applicable', 'Not Applicable'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='document_checklist_items')
    checklist_template = models.ForeignKey(
        DocumentChecklist, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Link to template if created from template"
    )
    
    document_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_mandatory = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Document reference
    uploaded_document = models.ForeignKey(
        'documents.UserDocument',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checklist_items'
    )
    
    # Tracking
    requested_date = models.DateField(null=True, blank=True)
    received_date = models.DateField(null=True, blank=True)
    verified_date = models.DateField(null=True, blank=True)
    verified_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='checklist_documents_verified'
    )
    
    notes = models.TextField(blank=True, help_text="Verification notes or rejection reason")
    reminder_sent = models.BooleanField(default=False)
    last_reminder_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['case', 'is_mandatory', 'document_name']
        verbose_name = 'Case Document Checklist Item'
        verbose_name_plural = 'Case Document Checklist Items'
    
    def __str__(self):
        return f"{self.case.case_number} - {self.document_name} ({self.status})"


class CaseResearch(models.Model):
    """
    Store case research notes, legal precedents, and strategy.
    """
    RESEARCH_TYPE_CHOICES = [
        ('legal_research', 'Legal Research'),
        ('case_law', 'Case Law / Precedent'),
        ('statute', 'Statute / Act Reference'),
        ('strategy', 'Case Strategy'),
        ('facts_analysis', 'Facts Analysis'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='research_notes')
    
    research_type = models.CharField(max_length=50, choices=RESEARCH_TYPE_CHOICES, default='legal_research')
    title = models.CharField(max_length=255)
    content = models.TextField(help_text="Research notes, analysis, strategy")
    
    # For case law references
    case_citation = models.CharField(max_length=500, blank=True, help_text="e.g., AIR 2020 SC 1234")
    court_name = models.CharField(max_length=255, blank=True)
    judgment_date = models.DateField(null=True, blank=True)
    
    # For statute references
    act_name = models.CharField(max_length=255, blank=True, help_text="e.g., Indian Penal Code, 1860")
    section_number = models.CharField(max_length=100, blank=True, help_text="e.g., Section 420")
    
    # Attachments
    reference_document = models.FileField(
        upload_to='case_research/',
        null=True,
        blank=True,
        help_text="Upload judgment copy, article, etc."
    )
    
    # Metadata
    is_favorable = models.BooleanField(
        default=True, 
        help_text="Is this precedent favorable to our case?"
    )
    relevance_score = models.IntegerField(
        default=5,
        help_text="How relevant is this? (1-10)"
    )
    
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='research_notes_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Case Research Note'
        verbose_name_plural = 'Case Research Notes'
    
    def __str__(self):
        return f"{self.case.case_number} - {self.title}"


class LegalNotice(models.Model):
    """
    Track legal notices sent before filing case.
    """
    NOTICE_TYPE_CHOICES = [
        ('legal_notice', 'Legal Notice'),
        ('demand_notice', 'Demand Notice'),
        ('termination_notice', 'Termination Notice'),
        ('eviction_notice', 'Eviction Notice'),
        ('cease_desist', 'Cease and Desist'),
        ('other', 'Other'),
    ]
    
    DELIVERY_METHOD_CHOICES = [
        ('registered_post', 'Registered Post'),
        ('speed_post', 'Speed Post'),
        ('courier', 'Courier'),
        ('email', 'Email'),
        ('hand_delivery', 'Hand Delivery'),
        ('publication', 'Publication in Newspaper'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('ready_to_send', 'Ready to Send'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('response_received', 'Response Received'),
        ('no_response', 'No Response'),
        ('deadline_expired', 'Deadline Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='legal_notices')
    
    notice_type = models.CharField(max_length=50, choices=NOTICE_TYPE_CHOICES, default='legal_notice')
    subject = models.CharField(max_length=500)
    
    # Recipients
    recipient_name = models.CharField(max_length=255)
    recipient_address = models.TextField()
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    
    # Notice content
    notice_content = models.TextField(help_text="Full notice text")
    notice_document = models.FileField(
        upload_to='legal_notices/',
        null=True,
        blank=True,
        help_text="Upload final notice PDF"
    )
    
    # Sending details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    delivery_method = models.CharField(max_length=30, choices=DELIVERY_METHOD_CHOICES, blank=True)
    sent_date = models.DateField(null=True, blank=True)
    delivered_date = models.DateField(null=True, blank=True)
    
    # Tracking numbers
    tracking_number = models.CharField(max_length=100, blank=True, help_text="Post/courier tracking number")
    proof_of_delivery = models.FileField(
        upload_to='notice_proofs/',
        null=True,
        blank=True,
        help_text="Upload delivery receipt/acknowledgment"
    )
    
    # Response tracking
    response_deadline = models.DateField(
        null=True,
        blank=True,
        help_text="Deadline for response (usually 15-30 days)"
    )
    response_received_date = models.DateField(null=True, blank=True)
    response_document = models.FileField(
        upload_to='notice_responses/',
        null=True,
        blank=True,
        help_text="Upload response from other party"
    )
    response_summary = models.TextField(blank=True, help_text="Summary of their response")
    
    # Next actions
    next_action = models.TextField(blank=True, help_text="What to do next based on response")
    
    # Metadata
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='legal_notices_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-sent_date', '-created_at']
        verbose_name = 'Legal Notice'
        verbose_name_plural = 'Legal Notices'
    
    def __str__(self):
        return f"{self.case.case_number} - {self.get_notice_type_display()} to {self.recipient_name}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Auto-create activity log
        if is_new:
            from .models import CaseActivity
            CaseActivity.objects.create(
                case=self.case,
                performed_by=self.created_by,
                activity_type='legal_notice_created',
                description=f"{self.get_notice_type_display()} created for {self.recipient_name}"
            )
        
        # Update case stage if notice is sent
        if self.status == 'sent' and self.case.stage == 'notice_drafting':
            self.case.stage = 'negotiation'
            self.case.save()
