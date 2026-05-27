"""
PDF-Style Court Form Templates
Supports A4-sized document templates with pre-written legal content
"""
from django.db import models
import uuid
import json


class CourtFormTemplate(models.Model):
    """
    PDF-style court form templates with A4 layout
    Contains pre-written legal content with fillable fields
    """
    CATEGORY_CHOICES = [
        ('bail_bond', 'Bail Bond'),
        ('vakalatnama', 'Vakalatnama'),
        ('memo_appearance', 'Memorandum of Appearance'),
        ('affidavit', 'Affidavit'),
        ('petition', 'Petition'),
        ('application', 'Application'),
        ('notice', 'Notice'),
        ('undertaking', 'Undertaking'),
        ('surety_bond', 'Surety Bond'),
        ('drafting', 'Drafting Workspace'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="e.g., Form No 45 Bail Bond")
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    
    # PDF-style content structure
    # This stores the complete document structure with sections, paragraphs, and fields
    content_structure = models.JSONField(
        default=dict,
        help_text="""
        JSON structure defining the document layout:
        {
            "page_size": "A4",
            "margins": {"top": 72, "right": 72, "bottom": 72, "left": 72},
            "sections": [
                {
                    "type": "header",
                    "content": "IN THE COURT OF...",
                    "style": {"align": "center", "bold": true, "size": 14}
                },
                {
                    "type": "paragraph",
                    "content": "This is to certify that...",
                    "fields": [
                        {"name": "party_name", "placeholder": "[Party Name]", "position": 25}
                    ]
                },
                {
                    "type": "table",
                    "columns": ["Sr. No.", "Description", "Amount"],
                    "rows": 3,
                    "dynamic": true
                }
            ]
        }
        """
    )
    
    # Default field values (for auto-population from case data)
    default_field_mappings = models.JSONField(
        default=dict,
        help_text="""
        Maps template fields to case/client data:
        {
            "court_name": "case.court_name",
            "party_name": "client.full_name",
            "case_number": "case.case_number"
        }
        """
    )
    
    is_active = models.BooleanField(default=True)
    sequence = models.IntegerField(default=0, help_text="Ordering sequence for templates")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_form_templates'
    )
    
    class Meta:
        ordering = ['sequence', 'category', 'name']
        verbose_name = 'Court Form Template'
        verbose_name_plural = 'Court Form Templates'
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class FilledCourtForm(models.Model):
    """
    Instance of a filled court form for a specific case
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('completed', 'Completed'),
        ('reviewed', 'Reviewed'),
        ('signed', 'Signed'),
        ('filed', 'Filed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        CourtFormTemplate,
        on_delete=models.PROTECT,
        related_name='filled_forms'
    )
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.CASCADE,
        related_name='court_forms'
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='court_forms'
    )
    
    # Filled content (same structure as template but with filled values)
    filled_content = models.JSONField(
        default=dict,
        help_text="Complete document with filled values"
    )
    
    # Field values for easy access
    field_values = models.JSONField(
        default=dict,
        help_text="Key-value pairs of filled fields"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    custom_sequence = models.IntegerField(default=0, help_text="Manual override for document ordering")
    
    # Signatures
    advocate_signed = models.BooleanField(default=False)
    advocate_signature_date = models.DateTimeField(null=True, blank=True)
    advocate_signature_image = models.ImageField(
        upload_to='signatures/advocate/',
        null=True,
        blank=True,
        help_text="Advocate's signature image"
    )
    
    client_signed = models.BooleanField(default=False)
    client_signature_date = models.DateTimeField(null=True, blank=True)
    client_signature_image = models.ImageField(
        upload_to='signatures/client/',
        null=True,
        blank=True,
        help_text="Client's signature image"
    )
    
    # Digital Signatures (USB Token)
    is_digitally_signed = models.BooleanField(default=False)
    digital_signature_details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Metadata about the USB token signature (serial, issuer, etc.)"
    )
    
    # Sharing
    is_shared_with_client = models.BooleanField(default=False)
    shared_at = models.DateTimeField(null=True, blank=True)
    
    # PDF generation
    generated_pdf = models.FileField(
        upload_to='court_forms/generated/',
        null=True,
        blank=True,
        help_text="Generated PDF file"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_court_forms'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Filled Court Form'
        verbose_name_plural = 'Filled Court Forms'
    
    def __str__(self):
        return f"{self.template.name} - {self.case.case_number}"



class DocumentTemplate(models.Model):
    """
    Original document template system (file-based)
    For backward compatibility with existing templates
    """
    CATEGORY_CHOICES = [
        ('ecourts', 'E-Courts Forms'),
        ('petition', 'Petitions'),
        ('application', 'Applications'),
        ('affidavit', 'Affidavits'),
        ('notice', 'Notices'),
        ('agreement', 'Agreements'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, help_text="Template name (e.g., Vakalatnama Form)")
    description = models.TextField(blank=True, help_text="Description of the template")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='ecourts')
    template_file = models.FileField(upload_to='templates/', help_text="Original template file (PDF/DOCX)")
    file_size_kb = models.IntegerField(default=0, help_text="File size in KB")
    template_fields = models.JSONField(
        default=dict,
        blank=True,
        help_text="JSON defining fillable fields in the template"
    )
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(
        default=True,
        help_text="If true, all advocates can use this template"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_templates'
    )
    
    class Meta:
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class FilledTemplate(models.Model):
    """
    Original filled template system (file-based)
    For backward compatibility
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('completed', 'Completed'),
        ('shared', 'Shared with Client'),
        ('signed', 'Signed'),
        ('filed', 'Filed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        DocumentTemplate,
        on_delete=models.CASCADE,
        related_name='filled_instances'
    )
    case = models.ForeignKey(
        'cases.Case',
        on_delete=models.CASCADE,
        related_name='filled_templates',
        null=True,
        blank=True
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='filled_templates'
    )
    firm = models.ForeignKey(
        'firms.Firm',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='filled_templates'
    )
    filled_data = models.JSONField(
        default=dict,
        help_text="Key-value pairs of filled fields"
    )
    generated_file = models.FileField(
        upload_to='filled_templates/',
        null=True,
        blank=True,
        help_text="Generated document file"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_shared_with_client = models.BooleanField(default=False)
    shared_at = models.DateTimeField(null=True, blank=True)
    
    # Signatures
    client_signed = models.BooleanField(default=False)
    client_signed_at = models.DateTimeField(null=True, blank=True)
    client_signature_image = models.ImageField(
        upload_to='signatures/client/',
        null=True,
        blank=True,
        help_text="Client's signature image"
    )
    
    advocate_signed = models.BooleanField(default=False)
    advocate_signed_at = models.DateTimeField(null=True, blank=True)
    advocate_signature_image = models.ImageField(
        upload_to='signatures/advocate/',
        null=True,
        blank=True,
        help_text="Advocate's signature image"
    )
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'accounts.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_filled_templates'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['case', 'status']),
            models.Index(fields=['client', 'status']),
        ]
    
    def __str__(self):
        return f"{self.template.name} - {self.case.case_number}"
