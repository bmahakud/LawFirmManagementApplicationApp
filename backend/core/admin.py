from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Firm, LoginCredential, OTPVerification,
    Partner, UserDocument, UserInvitation, AuditLog
)


@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    list_display = ['firm_name', 'firm_code', 'city', 'subscription_type', 'is_active', 'created_at']
    list_filter = ['subscription_type', 'is_active', 'created_at']
    search_fields = ['firm_name', 'firm_code', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['get_full_name', 'email', 'phone_number', 'user_type', 'firm', 'is_active', 'created_at']
    list_filter = ['user_type', 'is_active', 'is_phone_verified', 'is_email_verified', 'created_at']
    search_fields = ['email', 'phone_number', 'first_name', 'last_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'last_login_at']
    
    fieldsets = (
        ('Basic Info', {'fields': ('id', 'username', 'email', 'phone_number', 'user_type', 'password')}),
        ('Personal Details', {'fields': ('first_name', 'last_name', 'date_of_birth', 'gender')}),
        ('Address', {'fields': ('address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code')}),
        ('Professional', {'fields': ('firm', 'bar_council_registration', 'bar_council_state')}),
        ('Documents', {'fields': ('aadhar_number', 'pan_number')}),
        ('Verification', {'fields': ('is_phone_verified', 'is_email_verified', 'is_document_verified')}),
        ('Status', {'fields': ('is_active', 'password_set')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at', 'last_login_at'), 'classes': ('collapse',)}),
    )


@admin.register(LoginCredential)
class LoginCredentialAdmin(admin.ModelAdmin):
    list_display = ['user', 'username', 'is_phone_otp_verified', 'is_email_otp_verified', 'created_at']
    list_filter = ['is_phone_otp_verified', 'is_email_otp_verified', 'created_at']
    search_fields = ['user__email', 'username']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'otp_type', 'is_verified', 'attempts', 'created_at', 'expires_at']
    list_filter = ['otp_type', 'is_verified', 'created_at']
    search_fields = ['user__email', 'user__phone_number']
    readonly_fields = ['id', 'created_at']


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'user', 'commission_percentage', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['company_name', 'user__email', 'registration_number']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(UserDocument)
class UserDocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'document_type', 'verification_status', 'uploaded_at', 'verified_at']
    list_filter = ['document_type', 'verification_status', 'uploaded_at']
    search_fields = ['user__email', 'document_number']
    readonly_fields = ['id', 'uploaded_at', 'verified_at']


@admin.register(UserInvitation)
class UserInvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'user_type', 'status', 'invited_by', 'created_at', 'expires_at']
    list_filter = ['user_type', 'status', 'created_at']
    search_fields = ['email', 'phone_number']
    readonly_fields = ['id', 'created_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'created_at', 'ip_address']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'description']
    readonly_fields = ['id', 'created_at']
