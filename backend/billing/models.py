from django.db import models
import uuid
from decimal import Decimal
from django.utils import timezone


class TimeEntry(models.Model):
    """Track billable hours for advocates/paralegals"""
    
    ACTIVITY_TYPE_CHOICES = [
        ('consultation', 'Client Consultation'),
        ('research', 'Legal Research'),
        ('drafting', 'Document Drafting'),
        ('court_appearance', 'Court Appearance'),
        ('meeting', 'Meeting'),
        ('phone_call', 'Phone Call'),
        ('email', 'Email Communication'),
        ('review', 'Document Review'),
        ('travel', 'Travel Time'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('invoiced', 'Invoiced'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='time_entries')
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, related_name='time_entries', null=True, blank=True)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='time_entries')
    
    date = models.DateField()
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES)
    description = models.TextField()
    hours = models.DecimalField(max_digits=5, decimal_places=2, help_text="Hours worked")
    
    # Billing details
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, help_text="Rate at time of entry")
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="hours * hourly_rate")
    billable = models.BooleanField(default=True, help_text="Is this time billable to client?")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='time_entries')
    advocate_invoice = models.ForeignKey('AdvocateInvoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='time_entries')
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name_plural = 'Time Entries'
        indexes = [
            models.Index(fields=['firm', 'case', 'date']),
            models.Index(fields=['user', 'status']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-calculate amount
        if self.hours and self.hourly_rate:
            self.amount = self.hours * self.hourly_rate
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.hours}h on {self.date}"


class Expense(models.Model):
    """Track case-related expenses"""
    
    EXPENSE_TYPE_CHOICES = [
        ('court_fee', 'Court Fee'),
        ('filing_fee', 'Filing Fee'),
        ('travel', 'Travel'),
        ('accommodation', 'Accommodation'),
        ('photocopying', 'Photocopying'),
        ('courier', 'Courier/Postage'),
        ('expert_witness', 'Expert Witness Fee'),
        ('investigation', 'Investigation'),
        ('translation', 'Translation'),
        ('notary', 'Notary Fee'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('invoiced', 'Invoiced'),
        ('reimbursed', 'Reimbursed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='expenses')
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    submitted_by = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='submitted_expenses')
    
    date = models.DateField()
    expense_type = models.CharField(max_length=50, choices=EXPENSE_TYPE_CHOICES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    billable = models.BooleanField(default=True, help_text="Is this expense billable to client?")
    markup_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Markup % to add to expense"
    )
    billable_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Amount to bill to client (with markup)"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    
    # Receipt/proof
    receipt = models.FileField(upload_to='expense_receipts/', null=True, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['firm', 'case', 'date']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-calculate billable amount with markup
        if self.amount:
            markup = self.amount * (self.markup_percentage / 100)
            self.billable_amount = self.amount + markup
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.expense_type} - {self.amount} on {self.date}"


class Invoice(models.Model):
    """Client invoices"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('viewed', 'Viewed by Client'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='invoices')
    branch = models.ForeignKey('firms.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='invoices')
    
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    
    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Additional details
    notes = models.TextField(blank=True, help_text="Notes visible to client")
    internal_notes = models.TextField(blank=True, help_text="Internal notes not visible to client")
    terms_and_conditions = models.TextField(blank=True)
    
    # PDF generation
    pdf_file = models.FileField(upload_to='invoices/', null=True, blank=True)
    
    # Tracking
    sent_date = models.DateTimeField(null=True, blank=True)
    viewed_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, related_name='created_invoices')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['firm', 'status']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['invoice_number']),
        ]
    
    def calculate_totals(self):
        """Calculate invoice totals from time entries and expenses"""
        # Sum time entries
        time_total = self.time_entries.filter(billable=True).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')
        
        # Sum expenses
        expense_total = self.expenses.filter(billable=True).aggregate(
            total=models.Sum('billable_amount')
        )['total'] or Decimal('0')
        
        self.subtotal = time_total + expense_total
        self.tax_amount = self.subtotal * (self.tax_percentage / 100)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        self.balance_due = self.total_amount - self.paid_amount
        
        # Update status based on payment
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partially_paid'
        elif self.due_date < timezone.now().date() and self.status not in ['paid', 'cancelled']:
            self.status = 'overdue'
        
        self.save()
    
    def save(self, *args, **kwargs):
        # Auto-assign branch from case if not provided
        if not self.branch and self.case and self.case.branch:
            self.branch = self.case.branch
        # If still no branch and created_by has branch, use that
        elif not self.branch and hasattr(self, '_created_by_user') and hasattr(self._created_by_user, 'branch'):
            self.branch = self._created_by_user.branch
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.client.get_full_name()}"


class Payment(models.Model):
    """Track payments received from clients"""
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('bank_transfer', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('card', 'Credit/Debit Card'),
        ('online', 'Online Payment'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='payments')
    invoice = models.ForeignKey('Invoice', on_delete=models.CASCADE, related_name='payments')
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='payments')
    
    payment_date = models.DateField(default=timezone.now)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    # Payment details
    transaction_id = models.CharField(max_length=100, blank=True)
    cheque_number = models.CharField(max_length=50, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='completed')
    
    notes = models.TextField(blank=True)
    receipt = models.FileField(upload_to='payment_receipts/', null=True, blank=True)
    
    recorded_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, related_name='recorded_payments')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['firm', 'payment_date']),
            models.Index(fields=['invoice', 'status']),
        ]
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update invoice paid amount
        if self.status == 'completed':
            self.invoice.paid_amount = self.invoice.payments.filter(
                status='completed'
            ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0')
            self.invoice.calculate_totals()
    
    def __str__(self):
        return f"Payment {self.amount} for {self.invoice.invoice_number}"


class TrustAccount(models.Model):
    """Track client retainer/trust account balances"""
    
    TRANSACTION_TYPE_CHOICES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('refund', 'Refund'),
        ('adjustment', 'Adjustment'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='trust_accounts')
    client = models.ForeignKey('clients.Client', on_delete=models.CASCADE, related_name='trust_transactions')
    case = models.ForeignKey('cases.Case', on_delete=models.CASCADE, null=True, blank=True, related_name='trust_transactions')
    
    transaction_date = models.DateField(default=timezone.now)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    
    description = models.TextField()
    reference_invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True)
    
    recorded_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['firm', 'client']),
            models.Index(fields=['transaction_date']),
        ]
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} for {self.client.get_full_name()}"



class AdvocateInvoice(models.Model):
    """
    Invoices from Advocates to Firm for their services.
    Advocates bill the firm for their work (time entries).
    """
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey('firms.Firm', on_delete=models.CASCADE, related_name='advocate_invoices')
    advocate = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='advocate_invoices')
    
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField(default=timezone.now)
    
    # Billing period
    period_start = models.DateField(help_text="Start date of billing period")
    period_end = models.DateField(help_text="End date of billing period")
    
    # Amounts
    subtotal = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0,
        help_text="Total from time entries"
    )
    tax_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Tax percentage if applicable"
    )
    tax_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=0
    )
    total_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        help_text="Total amount to be paid"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Approval
    approved_by = models.ForeignKey(
        'accounts.CustomUser', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_advocate_invoices'
    )
    approved_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Payment
    paid_date = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['firm', 'advocate', 'status']),
            models.Index(fields=['invoice_number']),
            models.Index(fields=['invoice_date']),
        ]
    
    def calculate_totals(self):
        """Calculate invoice totals from linked time entries"""
        # Sum time entries linked to this invoice
        time_total = self.time_entries.filter(billable=True).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')
        
        self.subtotal = time_total
        self.tax_amount = self.subtotal * (self.tax_percentage / 100)
        self.total_amount = self.subtotal + self.tax_amount
        self.save()
    
    def save(self, *args, **kwargs):
        # Auto-calculate amounts if not already set
        if not self.total_amount or self.total_amount == 0:
            if self.subtotal and self.tax_percentage is not None:
                self.tax_amount = self.subtotal * (self.tax_percentage / 100)
                self.total_amount = self.subtotal + self.tax_amount
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Advocate Invoice {self.invoice_number} - {self.advocate.get_full_name()}"
    
    def approve(self, approved_by_user):
        """Approve the invoice"""
        self.status = 'approved'
        self.approved_by = approved_by_user
        self.approved_date = timezone.now()
        self.save()
    
    def reject(self, rejected_by_user, reason):
        """Reject the invoice"""
        self.status = 'rejected'
        self.approved_by = rejected_by_user
        self.approved_date = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def mark_as_paid(self, payment_method, payment_reference=''):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_date = timezone.now()
        self.payment_method = payment_method
        self.payment_reference = payment_reference
        self.save()
