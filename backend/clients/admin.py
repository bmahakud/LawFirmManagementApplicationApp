from django.contrib import admin
from .models import Client, Lead


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'email', 'phone_number', 'firm', 'assigned_advocate', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'phone_number')
    list_filter = ('firm', 'created_at')


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('title', 'get_display_client', 'category', 'status', 'priority', 'assigned_advocate', 'estimated_fee', 'created_at')
    list_filter = ('status', 'category', 'priority', 'source', 'firm')
    search_fields = ('title', 'prospect_name', 'prospect_phone', 'client__first_name', 'client__last_name', 'opposing_party')

    def get_display_client(self, obj):
        return obj.client.get_full_name() if obj.client else f"{obj.prospect_name} (Prospect)"
    get_display_client.short_description = 'Client / Prospect'

