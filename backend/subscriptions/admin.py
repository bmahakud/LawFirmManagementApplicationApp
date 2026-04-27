from django.contrib import admin
from .models import SubscriptionPlan, FirmSubscription, PlatformInvoice


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'price', 'billing_cycle', 'is_active']
    list_filter = ['plan_type', 'billing_cycle', 'is_active']
    search_fields = ['name', 'description']


@admin.register(FirmSubscription)
class FirmSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['firm', 'plan', 'status', 'start_date', 'end_date', 'is_trial']
    list_filter = ['status', 'is_trial', 'auto_renew']
    search_fields = ['firm__firm_name', 'plan__name']
    date_hierarchy = 'start_date'


@admin.register(PlatformInvoice)
class PlatformInvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'firm', 'subscription_plan', 'invoice_date', 
        'total_amount', 'paid_amount', 'balance_due', 'status'
    ]
    list_filter = ['status', 'invoice_date', 'subscription_plan']
    search_fields = ['invoice_number', 'firm__firm_name']
    readonly_fields = ['tax_amount', 'total_amount', 'balance_due', 'created_at', 'updated_at']
    date_hierarchy = 'invoice_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('firm', 'subscription_plan', 'invoice_number', 'invoice_date', 'due_date')
        }),
        ('Billing Period', {
            'fields': ('period_start', 'period_end')
        }),
        ('Amounts', {
            'fields': ('plan_amount', 'tax_percentage', 'tax_amount', 'total_amount', 'paid_amount', 'balance_due')
        }),
        ('Payment Details', {
            'fields': ('status', 'payment_date', 'payment_method', 'transaction_id', 'payment_notes')
        }),
        ('Notes', {
            'fields': ('notes', 'internal_notes')
        }),
        ('Tracking', {
            'fields': ('sent_date', 'created_by', 'created_at', 'updated_at')
        }),
    )
