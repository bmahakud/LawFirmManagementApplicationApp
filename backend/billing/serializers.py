from rest_framework import serializers
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
        # Set hourly_rate from user if not provided
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
            'time_entries_detail', 'expenses_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'firm', 'branch', 'subtotal', 'tax_amount',
            'created_at', 'updated_at'
        ]


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
