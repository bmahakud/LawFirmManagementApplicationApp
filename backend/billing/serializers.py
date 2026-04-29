from rest_framework import serializers
from decimal import Decimal
from .models import TimeEntry, Expense, Invoice, Payment, TrustAccount, AdvocateInvoice
from accounts.serializers import UserBriefSerializer


class TimeEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    
    class Meta:
        model = TimeEntry
        fields = [
            'id', 'firm', 'case', 'case_title', 'user', 'user_name',
            'date', 'activity_type', 'description', 'hours', 'hourly_rate',
            'amount', 'billable', 'status', 'invoice', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'firm', 'amount', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        if 'hourly_rate' not in validated_data:
            user = validated_data['user']
            validated_data['hourly_rate'] = user.hourly_rate or 0
        return super().create(validated_data)


class ExpenseSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    
    class Meta:
        model = Expense
        fields = [
            'id', 'firm', 'case', 'case_title', 'submitted_by', 'submitted_by_name',
            'date', 'expense_type', 'description', 'amount', 'billable',
            'markup_percentage', 'billable_amount', 'status', 'invoice',
            'receipt', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'firm', 'billable_amount', 'created_at', 'updated_at']


# --- Inline serializers for nested invoice creation ---

class InvoiceTimeEntryInlineSerializer(serializers.Serializer):
    """Inline time entry for creating alongside an invoice"""
    date = serializers.DateField(required=False, default=None)
    activity_type = serializers.ChoiceField(
        choices=[c[0] for c in TimeEntry.ACTIVITY_TYPE_CHOICES],
        default='other'
    )
    description = serializers.CharField()
    hours = serializers.DecimalField(max_digits=5, decimal_places=2)
    hourly_rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    billable = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class InvoiceExpenseInlineSerializer(serializers.Serializer):
    """Inline expense for creating alongside an invoice"""
    date = serializers.DateField(required=False, default=None)
    expense_type = serializers.ChoiceField(
        choices=[c[0] for c in Expense.EXPENSE_TYPE_CHOICES],
        default='other'
    )
    description = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    billable = serializers.BooleanField(default=True)
    markup_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice list"""
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    client_user_account_id = serializers.UUIDField(source='client.user_account.id', read_only=True, default=None)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    branch_name = serializers.CharField(source='branch.branch_name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'invoice_date', 'due_date',
            'client', 'client_name', 'client_user_account_id',
            'case', 'case_title',
            'branch', 'branch_name',
            'total_amount', 'paid_amount', 'balance_due', 'status'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    client_user_account_id = serializers.UUIDField(source='client.user_account.id', read_only=True, default=None)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    branch_name = serializers.CharField(source='branch.branch_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    time_entries_detail = TimeEntrySerializer(source='time_entries', many=True, read_only=True)
    expenses_detail = ExpenseSerializer(source='expenses', many=True, read_only=True)

    # Write-only nested inputs for inline creation
    time_entries = InvoiceTimeEntryInlineSerializer(many=True, write_only=True, required=False)
    expenses = InvoiceExpenseInlineSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            'id', 'firm', 'branch', 'branch_name', 'case', 'case_title',
            'client', 'client_name', 'client_user_account_id',
            'invoice_number', 'invoice_date', 'due_date',
            'subtotal', 'tax_percentage', 'tax_amount', 'discount_amount',
            'total_amount', 'paid_amount', 'balance_due', 'status',
            'notes', 'internal_notes', 'terms_and_conditions',
            'pdf_file', 'sent_date', 'viewed_date',
            'created_by', 'created_by_name',
            'time_entries', 'expenses',
            'time_entries_detail', 'expenses_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'firm', 'branch', 'tax_amount', 'total_amount', 'balance_due',
            'created_at', 'updated_at'
        ]

    def _calculate_amounts(self, validated_data, instance=None):
        subtotal = validated_data.get('subtotal', getattr(instance, 'subtotal', Decimal('0')) or Decimal('0'))
        tax_percentage = validated_data.get('tax_percentage', getattr(instance, 'tax_percentage', Decimal('0')) or Decimal('0'))
        discount_amount = validated_data.get('discount_amount', getattr(instance, 'discount_amount', Decimal('0')) or Decimal('0'))
        paid_amount = validated_data.get('paid_amount', getattr(instance, 'paid_amount', Decimal('0')) or Decimal('0'))

        tax_amount = subtotal * (tax_percentage / 100)
        total_amount = subtotal + tax_amount - discount_amount
        balance_due = total_amount - paid_amount

        validated_data['tax_amount'] = tax_amount
        validated_data['total_amount'] = total_amount
        validated_data['balance_due'] = balance_due
        return validated_data

    def create(self, validated_data):
        from django.utils import timezone as tz
        time_entries_data = validated_data.pop('time_entries', [])
        expenses_data = validated_data.pop('expenses', [])

        # If no subtotal provided, calculate from inline items
        if 'subtotal' not in validated_data or not validated_data.get('subtotal'):
            time_total = sum(
                (item['hours'] * item['hourly_rate'])
                for item in time_entries_data if item.get('billable', True)
            ) or Decimal('0')
            expense_total = sum(
                (item['amount'] * (Decimal('1') + Decimal(str(item.get('markup_percentage', 0))) / Decimal('100')))
                for item in expenses_data if item.get('billable', True)
            ) or Decimal('0')
            validated_data['subtotal'] = time_total + expense_total

        validated_data = self._calculate_amounts(validated_data)
        invoice = super().create(validated_data)

        today = tz.now().date()
        firm = invoice.firm
        user = self.context['request'].user

        # Create linked time entries
        for entry in time_entries_data:
            hours = entry['hours']
            rate = entry['hourly_rate']
            TimeEntry.objects.create(
                invoice=invoice,
                firm=firm,
                user=user,
                case=invoice.case,
                date=entry.get('date') or today,
                activity_type=entry.get('activity_type', 'other'),
                description=entry['description'],
                hours=hours,
                hourly_rate=rate,
                amount=hours * rate,
                billable=entry.get('billable', True),
                notes=entry.get('notes', ''),
                status='invoiced',
            )

        # Create linked expenses
        for exp in expenses_data:
            amount = exp['amount']
            markup = Decimal(str(exp.get('markup_percentage', 0)))
            billable_amount = amount * (Decimal('1') + markup / Decimal('100'))
            Expense.objects.create(
                invoice=invoice,
                firm=firm,
                submitted_by=user,
                case=invoice.case,
                date=exp.get('date') or today,
                expense_type=exp.get('expense_type', 'other'),
                description=exp['description'],
                amount=amount,
                markup_percentage=markup,
                billable_amount=billable_amount,
                billable=exp.get('billable', True),
                notes=exp.get('notes', ''),
                status='invoiced',
            )

        return invoice

    def update(self, instance, validated_data):
        # Remove nested fields on update — use separate endpoints for line items
        validated_data.pop('time_entries', None)
        validated_data.pop('expenses', None)
        validated_data = self._calculate_amounts(validated_data, instance=instance)
        return super().update(instance, validated_data)


class PaymentSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'firm', 'invoice', 'invoice_number', 'client', 'client_name',
            'payment_date', 'amount', 'payment_method',
            'transaction_id', 'cheque_number', 'bank_name',
            'status', 'notes', 'receipt',
            'recorded_by', 'recorded_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'firm', 'created_at', 'updated_at']


class TrustAccountSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    
    class Meta:
        model = TrustAccount
        fields = [
            'id', 'firm', 'client', 'client_name', 'case', 'case_title',
            'transaction_date', 'transaction_type', 'amount', 'balance_after',
            'description', 'reference_invoice',
            'recorded_by', 'recorded_by_name',
            'created_at'
        ]
        read_only_fields = ['id', 'firm', 'balance_after', 'created_at']



class AdvocateInvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for advocate invoice list"""
    advocate_name = serializers.CharField(source='advocate.get_full_name', read_only=True)
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    
    class Meta:
        model = AdvocateInvoice
        fields = [
            'id', 'invoice_number', 'invoice_date',
            'advocate', 'advocate_name', 'firm', 'firm_name',
            'period_start', 'period_end',
            'total_amount', 'status'
        ]


class AdvocateInvoiceSerializer(serializers.ModelSerializer):
    """Detailed serializer for advocate invoice"""
    advocate_name = serializers.CharField(source='advocate.get_full_name', read_only=True)
    advocate_email = serializers.EmailField(source='advocate.email', read_only=True)
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    time_entries_detail = TimeEntrySerializer(source='time_entries', many=True, read_only=True)
    
    class Meta:
        model = AdvocateInvoice
        fields = [
            'id', 'firm', 'firm_name', 'advocate', 'advocate_name', 'advocate_email',
            'invoice_number', 'invoice_date',
            'period_start', 'period_end',
            'subtotal', 'tax_percentage', 'tax_amount', 'total_amount',
            'status', 'approved_by', 'approved_by_name', 'approved_date',
            'rejection_reason', 'paid_date', 'payment_method', 'payment_reference',
            'notes', 'time_entries_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'firm', 'advocate', 'subtotal', 'tax_amount', 'total_amount',
            'approved_by', 'approved_date', 'paid_date',
            'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validate advocate invoice data"""
        if 'period_start' in data and 'period_end' in data:
            if data['period_start'] > data['period_end']:
                raise serializers.ValidationError({
                    'period_end': 'Period end date must be after period start date'
                })
        
        if 'tax_percentage' in data and data['tax_percentage'] < 0:
            raise serializers.ValidationError({
                'tax_percentage': 'Tax percentage cannot be negative'
            })
        
        return data


class AdvocateInvoiceApprovalSerializer(serializers.Serializer):
    """Serializer for approving/rejecting advocate invoice"""
    action = serializers.ChoiceField(choices=['approve', 'reject'], required=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['action'] == 'reject' and not data.get('reason'):
            raise serializers.ValidationError({
                'reason': 'Reason is required when rejecting an invoice'
            })
        return data


class AdvocateInvoicePaymentSerializer(serializers.Serializer):
    """Serializer for marking advocate invoice as paid"""
    payment_method = serializers.CharField(max_length=50, required=True)
    payment_reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
