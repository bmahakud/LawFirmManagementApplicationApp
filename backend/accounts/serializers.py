from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, LoginCredential, OTPVerification, UserInvitation, GlobalConfiguration, UserFirmRole, FirmJoinLink
from firms.models import Firm
import random
import string



class UserFirmRoleSerializer(serializers.ModelSerializer):
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    branch_name = serializers.CharField(source='branch.branch_name', read_only=True)
    
    class Meta:
        model = UserFirmRole
        fields = ['id', 'firm', 'firm_name', 'branch', 'branch_name', 'user_type', 'is_active', 'is_last_active']
        read_only_fields = ['id', 'is_last_active']


class UserBriefSerializer(serializers.ModelSerializer):
    """Concise user info for nested display"""
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'user_type', 'profile_image']
        read_only_fields = fields


class CustomUserSerializer(serializers.ModelSerializer):
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    available_firms = UserFirmRoleSerializer(source='firm_memberships', many=True, read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'phone_number', 'first_name', 'last_name',
            'user_type', 'date_of_birth', 'gender', 'address_line_1', 'address_line_2',
            'city', 'state', 'country', 'postal_code', 'firm', 'firm_name',
            'available_firms',
            'aadhar_number', 'pan_number', 'bar_council_registration', 'bar_council_state',
            'is_phone_verified', 'is_email_verified', 'is_document_verified',
            'is_active', 'created_at', 'updated_at', 'password_set', 'profile_image'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_phone_verified', 
                           'is_email_verified', 'is_document_verified', 'user_type', 'firm']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class UserRegistrationSerializer(serializers.ModelSerializer):
    """For client and super_admin self-registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    # Firm details for Super Admin signup
    firm_name = serializers.CharField(required=False)
    firm_address = serializers.CharField(required=False)
    firm_logo = serializers.ImageField(required=False)
    branch_id = serializers.UUIDField(required=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'phone_number', 'first_name', 'last_name', 'password',
            'password_confirm', 'date_of_birth', 'gender', 'address_line_1',
            'address_line_2', 'city', 'state', 'country', 'postal_code',
            'firm_name', 'firm_address', 'firm_logo', 'branch_id', 'profile_image'
        ]
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        
        # Check uniqueness
        email = data.get('email')
        phone_number = data.get('phone_number')
        
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})
        if CustomUser.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError({'phone_number': 'A user with this phone number already exists.'})

        # Check if firm signup is attempted
        firm_name = data.get('firm_name')
        if firm_name:
            if Firm.objects.filter(firm_name=firm_name).exists():
                raise serializers.ValidationError({'firm_name': 'A firm with this name already exists.'})
                
            settings = GlobalConfiguration.get_settings()
            if not settings.is_free_trial_enabled:
                raise serializers.ValidationError({
                    'firm_name': 'Self-registration for firms is currently disabled. Please contact the platform owner.'
                })
        
        # Check branch if provided
        branch_id = data.get('branch_id')
        if branch_id:
            from firms.models import Branch
            if not Branch.objects.filter(id=branch_id).exists():
                raise serializers.ValidationError({'branch_id': 'Invalid branch ID.'})
        
        return data
    
    def create(self, validated_data):
        firm_name = validated_data.pop('firm_name', None)
        firm_address = validated_data.pop('firm_address', '')
        firm_logo = validated_data.pop('firm_logo', None)
        branch_id = validated_data.pop('branch_id', None)
        
        user_type = 'client'
        firm = None
        
        if firm_name:
            user_type = 'super_admin'
            
            # Get trial settings
            settings = GlobalConfiguration.get_settings()
            trial_days = settings.trial_period_days
            
            # Create the Firm with trial period
            from datetime import timedelta
            from django.utils import timezone
            
            firm_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            
            trial_end_date = None
            subscription_end_date = None
            
            if trial_days > 0:
                trial_end_date = timezone.now() + timedelta(days=trial_days)
                subscription_end_date = trial_end_date
            
            firm = Firm.objects.create(
                firm_name=firm_name,
                firm_code=firm_code,
                city=validated_data.get('city', ''),
                state=validated_data.get('state', ''),
                country=validated_data.get('country', 'India'),
                address=firm_address,
                postal_code=validated_data.get('postal_code', ''),
                phone_number=validated_data['phone_number'],
                email=validated_data['email'],
                logo=firm_logo,
                subscription_type='trial',
                trial_end_date=trial_end_date,
                subscription_end_date=subscription_end_date
            )
        
        user = CustomUser.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            phone_number=validated_data['phone_number'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type=user_type,
            firm=firm,
            password=validated_data['password'],
            password_set=True,
            **{k: v for k, v in validated_data.items() 
               if k not in ['email', 'phone_number', 'first_name', 'last_name', 'password']}
        )
        
        # Create login credential
        LoginCredential.objects.create(
            user=user,
            username=validated_data['email']
        )
        
        # Create UserFirmRole mapping if firm was created
        if firm:
            branch = None
            if branch_id:
                from firms.models import Branch
                branch = Branch.objects.filter(id=branch_id, firm=firm).first()
                
            UserFirmRole.objects.update_or_create(
                user=user,
                firm=firm,
                defaults={
                    'branch': branch,
                    'user_type': user_type,
                    'is_last_active': True
                }
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
        
        try:
            user = CustomUser.objects.get(username=username)
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


class GlobalConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for global configuration settings"""
    
    class Meta:
        model = GlobalConfiguration
        fields = ['id', 'is_free_trial_enabled', 'trial_period_days', 'updated_at', 'updated_by']
        read_only_fields = ['id', 'updated_at', 'updated_by']


class FirmJoinLinkSerializer(serializers.ModelSerializer):
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    user_type_display = serializers.CharField(source='get_user_type_display', read_only=True)
    
    class Meta:
        model = FirmJoinLink
        fields = [
            'id', 'firm', 'firm_name', 'user_type', 'user_type_display', 
            'is_active', 'max_uses', 'usage_count', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'firm', 'firm_name', 'usage_count', 'created_at']


class PublicJoinSerializer(serializers.Serializer):
    """Data required for a user to join via a generic link"""
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    password = serializers.CharField(min_length=8, write_only=True)
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone_number(self, value):
        if CustomUser.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value
