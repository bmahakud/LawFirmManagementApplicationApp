from django.contrib import admin
from .models import Firm


@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    list_display = ['firm_name', 'firm_code', 'city', 'subscription_type', 'is_active', 'created_at']
    list_filter = ['subscription_type', 'is_active', 'created_at']
    search_fields = ['firm_name', 'firm_code', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']
