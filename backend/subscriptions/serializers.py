from rest_framework import serializers
from .models import SubscriptionPlan, FirmSubscription, PlatformInvoice


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class FirmSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FirmSubscription
        fields = [
            'id', 'firm', 'firm_name', 'plan', 'plan_name', 
            'status', 'start_date', 'end_date', 'is_trial', 
            'auto_renew', 'is_valid', 'external_subscription_id'
        ]
        read_only_fields = ['id', 'start_date', 'firm']


class PlatformInvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice list"""
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    plan_name = serializers.CharField(source='subscription_plan.name', read_only=True)
    
    class Meta:
        model = PlatformInvoice
        fields = [
            'id', 'invoice_number', 'invoice_date', 'due_date',
            'firm', 'firm_name', 'subscription_plan', 'plan_name',
            'total_amount', 'paid_amount', 'balance_due', 'status',
            'period_start', 'period_end'
        ]
        read_only_fields = ['id', 'tax_amount', 'total_amount', 'balance_due']


class PlatformInvoiceSerializer(serializers.ModelSerializer):
    """Detailed serializer for invoice details"""
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    firm_email = serializers.EmailField(source='firm.email', read_only=True)
    plan_name = serializers.CharField(source='subscription_plan.name', read_only=True)
    plan_type = serializers.CharField(source='subscription_plan.plan_type', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = PlatformInvoice
        fields = [
            'id', 'firm', 'firm_name', 'firm_email',
            'subscription_plan', 'plan_name', 'plan_type',
            'invoice_number', 'invoice_date', 'due_date',
            'period_start', 'period_end',
            'plan_amount', 'tax_percentage', 'tax_amount',
            'total_amount', 'paid_amount', 'balance_due',
            'status', 'payment_date', 'payment_method', 
            'transaction_id', 'payment_notes',
            'notes', 'internal_notes', 'sent_date',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tax_amount', 'total_amount', 'balance_due',
            'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validate invoice data"""
        # Validate period dates
        if 'period_start' in data and 'period_end' in data:
            if data['period_start'] > data['period_end']:
                raise serializers.ValidationError({
                    'period_end': 'Period end date must be after period start date'
                })
        
        # Validate due date
        if 'invoice_date' in data and 'due_date' in data:
            if data['due_date'] < data['invoice_date']:
                raise serializers.ValidationError({
                    'due_date': 'Due date must be after invoice date'
                })
        
        # Validate amounts
        if 'plan_amount' in data and data['plan_amount'] <= 0:
            raise serializers.ValidationError({
                'plan_amount': 'Plan amount must be greater than zero'
            })
        
        if 'tax_percentage' in data and data['tax_percentage'] < 0:
            raise serializers.ValidationError({
                'tax_percentage': 'Tax percentage cannot be negative'
            })
        
        if 'paid_amount' in data and data['paid_amount'] < 0:
            raise serializers.ValidationError({
                'paid_amount': 'Paid amount cannot be negative'
            })
        
        return data


class PlatformInvoicePaymentSerializer(serializers.Serializer):
    """Serializer for marking invoice as paid"""
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    payment_method = serializers.ChoiceField(
        choices=PlatformInvoice.PAYMENT_METHOD_CHOICES,
        required=True
    )
    transaction_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    payment_date = serializers.DateField(required=False)
    payment_notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_amount(self, value):
        """Validate payment amount"""
        if value <= 0:
            raise serializers.ValidationError('Payment amount must be greater than zero')
        return value
