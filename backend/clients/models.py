from django.db import models
import uuid

class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='clients', null=True, blank=True)
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    profile_image = models.ImageField(upload_to='client_profiles/', null=True, blank=True)
    
    # Advocate assignment (required when admin adds a client)
    assigned_advocate = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_clients',
        limit_choices_to={'user_type': 'advocate'}
    )
    
    # Brief summary of the client's legal issue
    brief_summary = models.TextField(blank=True, help_text="Brief summary of the client's legal matter")
    
    # Link to the user account (if client has registered/signed up)
    # Changed from OneToOneField to ForeignKey to allow representation by multiple firms
    user_account = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_profiles'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user_account', 'firm')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class Lead(models.Model):
    """
    Legal CRM Lead / Prospective Legal Matter.
    Generated upon prospective client intake or inquiry.
    Can progress through assessment stages and be finalized & converted into a Case File.
    """
    STATUS_CHOICES = [
        ('new', 'New Lead'),
        ('contacted', 'Contacted / Follow-up'),
        ('consultation', 'Consultation Scheduled'),
        ('assessment', 'Case Assessment'),
        ('proposal', 'Proposal / Retainer Sent'),
        ('converted', 'Finalized / Retained'),
        ('lost', 'Lost / Dropped'),
    ]

    SOURCE_CHOICES = [
        ('walk_in', 'Walk-In'),
        ('referral', 'Referral'),
        ('website', 'Website / Digital'),
        ('phone', 'Phone Call'),
        ('court', 'Court Complex'),
        ('other', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    CATEGORY_CHOICES = [
        ('court_case', 'Court Case'),
        ('pre_litigation', 'Pre-Litigation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='leads', null=True, blank=True)
    client = models.ForeignKey('clients.Client', on_delete=models.SET_NULL, related_name='leads', null=True, blank=True)

    # Direct prospect contact details (used when the client does not yet exist in Client table)
    prospect_name = models.CharField(max_length=200, blank=True, help_text="Prospect client full name if not yet registered as a formal client")
    prospect_phone = models.CharField(max_length=20, blank=True, help_text="Prospect phone number")
    prospect_email = models.EmailField(blank=True, help_text="Prospect email address")

    assigned_advocate = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_leads',
        limit_choices_to={'user_type': 'advocate'}
    )

    # Lead / Intake Details
    title = models.CharField(max_length=255, help_text="Legal matter or inquiry title")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='court_case')
    case_type = models.CharField(max_length=100, blank=True, help_text="e.g. Civil Suit, Writ, Criminal, Arbitration")
    opposing_party = models.CharField(max_length=255, blank=True)
    brief_summary = models.TextField(blank=True, help_text="Summary of facts, grievance, or legal matter")
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='walk_in')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')

    # CRM Stage & Financials
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new')
    estimated_fee = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    consultation_date = models.DateTimeField(null=True, blank=True)
    intake_notes = models.TextField(blank=True, help_text="Internal notes on assessment, next steps, fee quotes")
    loss_reason = models.CharField(max_length=255, blank=True, help_text="Reason if lost/dropped")

    # Finalization / Conversion to Case File
    converted_case = models.OneToOneField(
        'cases.Case',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='originating_lead'
    )
    converted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        client_name = self.client.get_full_name() if self.client else (self.prospect_name or 'Unregistered Prospect')
        return f"Lead: {self.title} ({client_name})"

