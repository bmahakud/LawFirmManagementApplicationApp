from django.contrib import admin
from .models import UserDocument


@admin.register(UserDocument)
class UserDocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'document_type', 'verification_status', 'uploaded_at', 'verified_at']
    list_filter = ['document_type', 'verification_status', 'uploaded_at']
    search_fields = ['user__email', 'document_number']
    readonly_fields = ['id', 'uploaded_at', 'verified_at']
