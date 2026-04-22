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
    case_summary = models.TextField(blank=True, null=True, help_text="Summary shared with client")
    billing_type = models.CharField(max_length=20, choices=BILLING_TYPE_CHOICES, default='retainer')
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_fee = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    hearing_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    additional_expenses = models.CharField(max_length=255, null=True, blank=True, default="At actuals")
    payment_terms = models.TextField(blank=True, null=True)
    loe_notes = models.TextField(blank=True, null=True, help_text="Internal notes for Letter of Engagement")

    # Opposing Party Details
    petitioner_name = models.CharField(max_length=255, blank=True, null=True)
    respondent_name = models.CharField(max_length=255, blank=True, null=True)
    opposing_counsel = models.CharField(max_length=255, blank=True, null=True)
    court_name = models.CharField(max_length=255, blank=True, null=True)
    court_no = models.CharField(max_length=50, blank=True, null=True)
    judge_name = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    
    representing = models.CharField(max_length=50, choices=REPRESENTING_CHOICES, blank=True, null=True)
    cnr_number = models.CharField(max_length=50, blank=True, null=True)
    
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
        
        # Track if next_hearing_date changed
        is_new = self.pk is None
        old_hearing_date = None
        
        if not is_new:
            try:
                old_case = Case.objects.get(pk=self.pk)
                old_hearing_date = old_case.next_hearing_date
            except Case.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Auto-create calendar event if hearing date is added or changed
        if self.next_hearing_date and (is_new or old_hearing_date != self.next_hearing_date):
            self._create_or_update_hearing_calendar_event(old_hearing_date)
    
    def _create_or_update_hearing_calendar_event(self, old_hearing_date):
        """Create or update calendar event for hearing date"""
        from calendar_events.models import CalendarEvent
        from django.utils import timezone
        from datetime import timedelta
        
        # Calculate end time (2 hours after start by default)
        end_datetime = self.next_hearing_date + timedelta(hours=2)
        
        # Build event title
        event_title = f"Hearing: {self.case_title or self.case_number}"
        
        # Build location
        location = self.court_name or "Court"
        if self.court_no:
            location += f" - Court No. {self.court_no}"
        
        # Build description
        description = f"Court hearing for case: {self.case_title or self.case_number}\n"
        if self.case_number:
            description += f"Case Number: {self.case_number}\n"
        if self.cnr_number:
            description += f"CNR Number: {self.cnr_number}\n"
        if self.judge_name:
            description += f"Judge: {self.judge_name}\n"
        if self.petitioner_name:
            description += f"Petitioner: {self.petitioner_name}\n"
        if self.respondent_name:
            description += f"Respondent: {self.respondent_name}\n"
        
        # Check if calendar event already exists for this case and old hearing date
        existing_event = None
        if old_hearing_date:
            existing_event = CalendarEvent.objects.filter(
                case=self,
                event_type='hearing',
                start_datetime=old_hearing_date
            ).first()
        
        if existing_event:
            # Update existing event
            existing_event.title = event_title
            existing_event.description = description
            existing_event.start_datetime = self.next_hearing_date
            existing_event.end_datetime = end_datetime
            existing_event.location = location
            existing_event.court_name = self.court_name or ""
            existing_event.save()
            
            # Assign to advocate, paralegal, and client
            assigned_users = []
            if self.assigned_advocate:
                assigned_users.append(self.assigned_advocate)
            if self.assigned_paralegal:
                assigned_users.append(self.assigned_paralegal)
            if self.client and self.client.user_account:
                assigned_users.append(self.client.user_account)
            
            existing_event.assigned_to.set(assigned_users)
        else:
            # Create new calendar event
            calendar_event = CalendarEvent.objects.create(
                title=event_title,
                description=description,
                event_type='hearing',
                priority='high',
                status='scheduled',
                start_datetime=self.next_hearing_date,
                end_datetime=end_datetime,
                location=location,
                court_name=self.court_name or "",
                firm=self.firm,
                case=self,
                client=self.client,
                created_by=None,  # System-generated
                reminder_time=self.next_hearing_date - timedelta(hours=24)  # 24 hours before
            )
            
            # Assign to advocate, paralegal, and client
            assigned_users = []
            if self.assigned_advocate:
                assigned_users.append(self.assigned_advocate)
            if self.assigned_paralegal:
                assigned_users.append(self.assigned_paralegal)
            if self.client and self.client.user_account:
                assigned_users.append(self.client.user_account)
            
            if assigned_users:
                calendar_event.assigned_to.set(assigned_users)


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
    
    def save(self, *args, **kwargs):
        # Track if hearing_date changed
        is_new = self.pk is None
        old_hearing_date = None
        
        if not is_new:
            try:
                old_hearing = Hearing.objects.get(pk=self.pk)
                old_hearing_date = old_hearing.hearing_date
            except Hearing.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Auto-create calendar event if hearing date is added or changed
        if self.hearing_date and (is_new or old_hearing_date != self.hearing_date):
            self._create_or_update_hearing_calendar_event(old_hearing_date)
    
    def _create_or_update_hearing_calendar_event(self, old_hearing_date):
        """Create or update calendar event for this hearing"""
        from calendar_events.models import CalendarEvent
        from datetime import timedelta
        
        # Calculate end time (2 hours after start by default)
        end_datetime = self.hearing_date + timedelta(hours=2)
        
        # Build event title
        event_title = f"Hearing: {self.purpose}"
        if self.case.case_title:
            event_title = f"{self.case.case_title} - {self.purpose}"
        
        # Build location
        location = self.case.court_name or "Court"
        if self.case.court_no:
            location += f" - Court No. {self.case.court_no}"
        
        # Build description
        description = f"Purpose: {self.purpose}\n"
        description += f"Case: {self.case.case_title or self.case.case_number}\n"
        if self.case.case_number:
            description += f"Case Number: {self.case.case_number}\n"
        if self.case.cnr_number:
            description += f"CNR Number: {self.case.cnr_number}\n"
        if self.case.judge_name:
            description += f"Judge: {self.case.judge_name}\n"
        if self.judge_remarks:
            description += f"\nRemarks: {self.judge_remarks}\n"
        
        # Check if calendar event already exists for this hearing
        existing_event = CalendarEvent.objects.filter(
            case=self.case,
            event_type='hearing',
            start_datetime=old_hearing_date if old_hearing_date else self.hearing_date,
            title__icontains=self.purpose[:50]  # Match by purpose
        ).first()
        
        if existing_event:
            # Update existing event
            existing_event.title = event_title
            existing_event.description = description
            existing_event.start_datetime = self.hearing_date
            existing_event.end_datetime = end_datetime
            existing_event.location = location
            existing_event.court_name = self.case.court_name or ""
            existing_event.status = 'scheduled' if self.status == 'scheduled' else 'completed'
            existing_event.save()
            
            # Update assigned users
            assigned_users = []
            if self.case.assigned_advocate:
                assigned_users.append(self.case.assigned_advocate)
            if self.case.assigned_paralegal:
                assigned_users.append(self.case.assigned_paralegal)
            if self.case.client and self.case.client.user_account:
                assigned_users.append(self.case.client.user_account)
            
            existing_event.assigned_to.set(assigned_users)
        else:
            # Create new calendar event
            calendar_event = CalendarEvent.objects.create(
                title=event_title,
                description=description,
                event_type='hearing',
                priority='high',
                status='scheduled' if self.status == 'scheduled' else 'completed',
                start_datetime=self.hearing_date,
                end_datetime=end_datetime,
                location=location,
                court_name=self.case.court_name or "",
                firm=self.case.firm,
                case=self.case,
                client=self.case.client,
                created_by=None,  # System-generated
                reminder_time=self.hearing_date - timedelta(hours=24)  # 24 hours before
            )
            
            # Assign to advocate, paralegal, and client
            assigned_users = []
            if self.case.assigned_advocate:
                assigned_users.append(self.case.assigned_advocate)
            if self.case.assigned_paralegal:
                assigned_users.append(self.case.assigned_paralegal)
            if self.case.client and self.case.client.user_account:
                assigned_users.append(self.case.client.user_account)
            
            if assigned_users:
                calendar_event.assigned_to.set(assigned_users)

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
