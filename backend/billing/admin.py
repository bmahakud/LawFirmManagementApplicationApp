from django.contrib import admin
from .models import TimeEntry, Expense, Invoice, Payment, TrustAccount, AdvocateInvoice


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin):
    list_display = ['user', 'case', 'date', 'hours', 'amount', 'status', 'billable']
    list_filter = ['status', 'billable', 'activity_type', 'date']
    search_fields = ['user__email', 'case__case_title', 'description']
    readonly_fields = ['amount', 'created_at', 'updated_at']
    date_hierarchy = 'date'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['expense_type', 'case', 'date', 'amount', 'billable_amount', 'status']
    list_filter = ['status', 'billable', 'expense_type', 'date']
    search_fields = ['case__case_title', 'description']
    readonly_fields = ['billable_amount', 'created_at', 'updated_at']
    date_hierarchy = 'date'


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client', 'invoice_date', 'total_amount', 'paid_amount', 'balance_due', 'status']
    list_filter = ['status', 'invoice_date']
    search_fields = ['invoice_number', 'client__first_name', 'client__last_name', 'case__case_title']
    readonly_fields = ['subtotal', 'tax_amount', 'total_amount', 'balance_due', 'created_at', 'updated_at']
    date_hierarchy = 'invoice_date'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'client', 'payment_date', 'amount', 'payment_method', 'status']
    list_filter = ['status', 'payment_method', 'payment_date']
    search_fields = ['invoice__invoice_number', 'client__first_name', 'transaction_id']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'payment_date'


@admin.register(TrustAccount)
class TrustAccountAdmin(admin.ModelAdmin):
    list_display = ['client', 'transaction_date', 'transaction_type', 'amount', 'balance_after']
    list_filter = ['transaction_type', 'transaction_date']
    search_fields = ['client__first_name', 'client__last_name', 'description']
    readonly_fields = ['created_at']
    date_hierarchy = 'transaction_date'



@admin.register(AdvocateInvoice)
class AdvocateInvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'advocate', 'firm', 'invoice_date', 'total_amount', 'status']
    list_filter = ['status', 'invoice_date']
    search_fields = ['invoice_number', 'advocate__email', 'advocate__first_name', 'advocate__last_name']
    readonly_fields = ['subtotal', 'tax_amount', 'total_amount', 'created_at', 'updated_at']
    date_hierarchy = 'invoice_date'
