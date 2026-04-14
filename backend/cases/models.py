from django.db import models
import uuid

class Case(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('on_hold', 'On Hold'),
        ('closed', 'Closed'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        # Backward compatibility / legacy
        ('pre_litigation', 'Pre-Litigation'),
        ('running', 'Running'),
        ('disposed', 'Disposed off'),
        ('created', 'Created'),
        ('filed', 'Filed'),
        ('evidence', 'Evidence'),
        ('hearing', 'Hearing in Progress'),
        ('judgment', 'Judgment Received'),
    ]
    
    BILLING_TYPE_CHOICES = [
        ('hourly', 'Hourly'),
        ('flat_fee', 'Flat Fee'),
        ('retainer', 'Retainer'),
        ('contingency', 'Contingency'),
    ]

    CATEGORY_CHOICES = [
        ('court_case', 'Court Case'),
        ('pre_litigation', 'Pre-Litigation'),
    ]

    REPRESENTING_CHOICES = [
        ('petitioner', 'Petitioner / Complainant'),
        ('respondent', 'Respondent / Accused'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    STAGE_CHOICES = [
        ('initial_consultation', 'Initial Consultation and Case Assessment'),
        ('document_collection', 'Document Collection'),
        ('case_research', 'Case Research and Analysis'),
        ('notice_drafting', 'Notice / Legal Drafting'),
        ('negotiation', 'Negotiation / Mediation'),
        ('case_filing', 'Case Filing'),
        ('hearing', 'Hearing'),
        ('evidence', 'Evidence and Arguments'),
        ('judgment', 'Judgment / Order'),
        ('appeal', 'Appeal'),
        ('execution', 'Execution / Compliance'),
        ('closed', 'Case Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='cases')
    branch = models.ForeignKey('firms.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='cases')
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='cases')
    
    assigned_advocate = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='cases_as_advocate'
    )
    assigned_paralegal = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='cases_as_paralegal'
    )
    
    case_title = models.CharField(max_length=255, blank=True)
    case_number = models.CharField(max_length=100, blank=True) # Manual entry might not have it yet
    case_type = models.CharField(max_length=100) # e.g., C.C., Sessions Case, etc.
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='court_case')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default='initial_consultation')
    
    # Financials & LOE
    case_summary = models.TextField(blank=True, help_text="Summary shared with client")
    billing_type = models.CharField(max_length=20, choices=BILLING_TYPE_CHOICES, default='retainer')
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_fee = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    hearing_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    additional_expenses = models.CharField(max_length=255, default="At actuals")
    payment_terms = models.TextField(blank=True)
    loe_notes = models.TextField(blank=True, help_text="Internal notes for Letter of Engagement")

    # Opposing Party Details
    petitioner_name = models.CharField(max_length=255, blank=True)
    respondent_name = models.CharField(max_length=255, blank=True)
    opposing_counsel = models.CharField(max_length=255, blank=True)
    court_name = models.CharField(max_length=255, blank=True)
    court_no = models.CharField(max_length=50, blank=True)
    judge_name = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    
    representing = models.CharField(max_length=50, choices=REPRESENTING_CHOICES, blank=True)
    cnr_number = models.CharField(max_length=50, blank=True)
    
    filing_date = models.DateField(null=True, blank=True)
    next_hearing_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.case_title or self.case_number} ({self.case_number})"

    def save(self, *args, **kwargs):
        if not self.case_title and self.case_number:
            self.case_title = f"Case {self.case_number}"
        super().save(*args, **kwargs)


class CaseActivity(models.Model):
    """Tracks the lifecycle/timeline of a case"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='activities')
    performed_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True)
    
    activity_type = models.CharField(max_length=100) # e.g., status_change, hearing_update, document_added
    description = models.TextField()
    previous_status = models.CharField(max_length=20, blank=True, null=True)
    new_status = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class Hearing(models.Model):
    """Tracks specific court dates and results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='hearings')
    
    hearing_date = models.DateTimeField()
    purpose = models.CharField(max_length=255)
    judge_remarks = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, 
        choices=[('scheduled', 'Scheduled'), ('completed', 'Completed'), ('adjourned', 'Adjourned')],
        default='scheduled'
    )
    order_passed = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CaseDraft(models.Model):
    """Tracking drafts and petitions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='drafts')
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    draft_type = models.CharField(max_length=100) # Petition, Agreement, Affidavit, etc.
    status = models.CharField(
        max_length=20,
        choices=[('draft', 'Draft'), ('under_review', 'Under Review'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='draft'
    )
    version = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
