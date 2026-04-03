from django.contrib import admin
from .models import Partner


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'user', 'commission_percentage', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['company_name', 'user__email', 'registration_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
