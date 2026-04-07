from django.contrib import admin
from .models import Firm, Branch


@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    list_display = ['firm_name', 'firm_code', 'city', 'subscription_type', 'is_active', 'created_at']
    list_filter = ['subscription_type', 'is_active', 'created_at']
    search_fields = ['firm_name', 'firm_code', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ['branch_name', 'firm', 'city', 'is_active', 'created_at']
    list_filter = ['firm', 'is_active', 'created_at']
    search_fields = ['branch_name', 'firm__firm_name', 'city']
    readonly_fields = ['id', 'created_at', 'updated_at']
