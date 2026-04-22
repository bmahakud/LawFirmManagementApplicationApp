from rest_framework import serializers
from .models import TimeEntry, Expense, Invoice, Payment, TrustAccount
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
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'invoice_date', 'due_date',
            'client', 'client_name', 'case', 'case_title',
            'total_amount', 'paid_amount', 'balance_due', 'status'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    case_title = serializers.CharField(source='case.case_title', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    time_entries_detail = TimeEntrySerializer(source='time_entries', many=True, read_only=True)
    expenses_detail = ExpenseSerializer(source='expenses', many=True, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'firm', 'case', 'case_title', 'client', 'client_name',
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
            'id', 'firm', 'subtotal', 'tax_amount', 'total_amount',
            'balance_due', 'created_at', 'updated_at'
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
