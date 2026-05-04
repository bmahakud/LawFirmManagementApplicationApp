from rest_framework import serializers
from django.contrib.auth import authenticate
from accounts.models import CustomUser, LoginCredential, OTPVerification, UserInvitation
from firms.models import Firm
from partners.models import Partner
from documents.models import UserDocument
from audit.models import AuditLog


class FirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firm
        fields = [
            'id', 'firm_name', 'firm_code', 'city', 'state', 'country',
            'address', 'postal_code', 'phone_number', 'email', 'website',
            'subscription_type', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'firm_code', 'created_at', 'updated_at']


class CustomUserSerializer(serializers.ModelSerializer):
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'phone_number', 'first_name', 'last_name',
            'user_type', 'date_of_birth', 'gender', 'address_line_1', 'address_line_2',
            'city', 'state', 'country', 'postal_code', 'firm', 'firm_name',
            'aadhar_number', 'pan_number', 'bar_council_registration', 'bar_council_state',
            'is_phone_verified', 'is_email_verified', 'is_document_verified',
            'is_active', 'created_at', 'updated_at', 'password_set'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_phone_verified', 
                           'is_email_verified', 'is_document_verified']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class UserRegistrationSerializer(serializers.ModelSerializer):
    """For client self-registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'phone_number', 'first_name', 'last_name', 'password',
            'password_confirm', 'date_of_birth', 'gender', 'address_line_1',
            'address_line_2', 'city', 'state', 'country', 'postal_code'
        ]
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return data
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            phone_number=validated_data['phone_number'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type='client',
            password=validated_data['password'],
            **{k: v for k, v in validated_data.items() 
               if k not in ['email', 'phone_number', 'first_name', 'last_name', 'password']}
        )
        
        # Create login credential
        LoginCredential.objects.create(
            user=user,
            username=validated_data['email']
        )
        
        return user


class LoginCredentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginCredential
        fields = ['id', 'user', 'username', 'is_phone_otp_verified', 'is_email_otp_verified']
        read_only_fields = ['id', 'user']


class OTPVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPVerification
        fields = ['id', 'user', 'otp_type', 'is_verified', 'created_at', 'expires_at']
        read_only_fields = ['id', 'user', 'created_at', 'expires_at']


class PartnerSerializer(serializers.ModelSerializer):
    user_details = CustomUserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Partner
        fields = [
            'id', 'user', 'user_details', 'company_name', 'registration_number',
            'commission_percentage', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = [
            'id', 'user', 'document_type', 'document_number', 'document_file',
            'verification_status', 'verified_by', 'verification_notes',
            'uploaded_at', 'verified_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'verified_at', 'verified_by']


class UserInvitationSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.CharField(source='invited_by.get_full_name', read_only=True)
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    
    class Meta:
        model = UserInvitation
        fields = [
            'id', 'invited_by', 'invited_by_name', 'email', 'phone_number',
            'user_type', 'firm', 'firm_name', 'status', 'created_at',
            'expires_at', 'accepted_at'
        ]
        read_only_fields = ['id', 'invited_by', 'created_at', 'expires_at', 'accepted_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'description',
            'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ============================================================================
# LOGIN SERIALIZERS
# ============================================================================

class UsernamePasswordLoginSerializer(serializers.Serializer):
    """Login with username/email and password"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        # Try to find user by username, email, or phone number
        user = None
        try:
            user = CustomUser.objects.get(username=username)
        except CustomUser.DoesNotExist:
            try:
                user = CustomUser.objects.get(email=username)
            except CustomUser.DoesNotExist:
                try:
                    user = CustomUser.objects.get(phone_number=username)
                except CustomUser.DoesNotExist:
                    raise serializers.ValidationError('Invalid username or password')
        
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid username or password')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is inactive')
        
        data['user'] = user
        return data


class PhoneOTPLoginSerializer(serializers.Serializer):
    """Request OTP for phone login"""
    phone_number = serializers.CharField()
    
    def validate_phone_number(self, value):
        try:
            user = CustomUser.objects.get(phone_number=value)
            if not user.is_active:
                raise serializers.ValidationError('User account is inactive')
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Phone number not found')
        return value


class EmailOTPLoginSerializer(serializers.Serializer):
    """Request OTP for email login"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            user = CustomUser.objects.get(email=value)
            if not user.is_active:
                raise serializers.ValidationError('User account is inactive')
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Email not found')
        return value


class OTPVerifySerializer(serializers.Serializer):
    """Verify OTP code"""
    phone_number = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    otp_code = serializers.CharField(max_length=6)
    
    def validate(self, data):
        phone_number = data.get('phone_number')
        email = data.get('email')
        
        if not phone_number and not email:
            raise serializers.ValidationError('Either phone_number or email is required')
        
        return data


class SetPasswordSerializer(serializers.Serializer):
    """Set password for users added by admin"""
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        
        try:
            user = CustomUser.objects.get(phone_number=data['phone_number'])
            if user.password_set:
                raise serializers.ValidationError('Password already set for this user')
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('User not found')
        
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Change password for logged-in users"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    def validate(self, data):
        if data['new_password'] != data.pop('new_password_confirm'):
            raise serializers.ValidationError({'new_password': 'Passwords do not match'})
        return data


# ============================================================================
# SHARED FIELDS
# ============================================================================

class ClientField(serializers.Field):
    """
    A reusable field that accepts either:
    - A Client profile UUID  (clients.Client.id)
    - A User account UUID    (accounts.CustomUser.id)
    
    Always resolves and stores the Client profile ID.
    Use this everywhere a 'client' FK to clients.Client is needed.
    """

    def to_representation(self, value):
        return str(value.id) if value else None

    def to_internal_value(self, data):
        from clients.models import Client
        from accounts.models import CustomUser

        # Try direct client profile ID first
        try:
            return Client.objects.get(id=data)
        except (Client.DoesNotExist, Exception):
            pass

        # Try user account ID
        try:
            user = CustomUser.objects.get(id=data)
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return client_profile
            raise serializers.ValidationError(
                f'No client profile found for user {data}. Ask admin to create a client profile first.'
            )
        except CustomUser.DoesNotExist:
            pass

        raise serializers.ValidationError(
            f'Invalid client ID "{data}" — not a valid client profile or user account.'
        )
