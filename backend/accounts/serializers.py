from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, LoginCredential, OTPVerification, UserInvitation, GlobalConfiguration, UserFirmRole, FirmJoinLink, AdvocateParalegalAssignment
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


class AdvocateParalegalAssignmentSerializer(serializers.ModelSerializer):
    advocate_name = serializers.CharField(source='advocate.get_full_name', read_only=True)
    paralegal_name = serializers.CharField(source='paralegal.get_full_name', read_only=True)
    paralegal_email = serializers.CharField(source='paralegal.email', read_only=True)
    paralegal_phone = serializers.CharField(source='paralegal.phone_number', read_only=True)
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    
    class Meta:
        model = AdvocateParalegalAssignment
        fields = [
            'id', 'advocate', 'advocate_name', 'paralegal', 'paralegal_name', 
            'paralegal_email', 'paralegal_phone', 'firm', 'firm_name', 
            'assigned_by', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'assigned_by', 'created_at']


class UserBriefSerializer(serializers.ModelSerializer):
    """Concise user info for nested display"""
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'user_type', 'profile_image']
        read_only_fields = fields


class CustomUserSerializer(serializers.ModelSerializer):
    firm_name = serializers.CharField(source='firm.firm_name', read_only=True)
    available_firms = UserFirmRoleSerializer(source='firm_memberships', many=True, read_only=True)
    uploaded_documents = serializers.SerializerMethodField()
    username = serializers.CharField(required=False)
    
    def get_uploaded_documents(self, obj):
        """Get documents uploaded by this user"""
        from documents.models import UserDocument
        from documents.serializers import UserDocumentListSerializer
        
        documents = UserDocument.objects.filter(
            uploaded_by=obj,
            is_deleted=False
        ).order_by('-uploaded_at')[:10]  # Limit to 10 most recent
        
        return UserDocumentListSerializer(documents, many=True, context=self.context).data
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'phone_number', 'first_name', 'last_name',
            'user_type', 'date_of_birth', 'gender', 'address_line_1', 'address_line_2',
            'city', 'state', 'country', 'postal_code', 'firm', 'firm_name',
            'available_firms', 'uploaded_documents',
            'aadhar_number', 'pan_number', 'bar_council_registration', 'bar_council_state',
            'hourly_rate', 'consultation_fee', 'case_fee', 'fee_currency',
            'is_phone_verified', 'is_email_verified', 'is_document_verified',
            'is_active', 'created_at', 'updated_at', 'password_set', 'profile_image'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_phone_verified', 
                           'is_email_verified', 'is_document_verified', 'user_type', 'firm', 'uploaded_documents']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        # Auto-generate username from email or phone if not provided
        email = data.get('email')
        phone_number = data.get('phone_number')
        request = self.context.get('request')
        current_user = request.user if request else None
        
        if not data.get('username'):
            data['username'] = email or phone_number or ''
            
        username = data.get('username')
        
        # Check if user already exists
        existing_user = None
        if email:
            existing_user = CustomUser.objects.filter(email=email).first()
        elif username:
            existing_user = CustomUser.objects.filter(username=username).first()
            
        if existing_user:
            # If the user is a client, we allow "re-adding" them if they aren't in THIS firm yet
            if existing_user.user_type == 'client' and current_user and current_user.firm:
                from .models import UserFirmRole
                if UserFirmRole.objects.filter(user=existing_user, firm=current_user.firm).exists():
                    raise serializers.ValidationError({'email': 'This client is already registered in your firm.'})
                # Otherwise, allow validation to pass so perform_create can link them
            else:
                raise serializers.ValidationError({'email': 'A user with this email already exists.'})
                
        if phone_number and not existing_user and CustomUser.objects.filter(phone_number=phone_number).exists():
             raise serializers.ValidationError({'phone_number': 'A user with this phone number already exists.'})
            
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """For client and super_admin self-registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    # Firm details for Super Admin signup
    firm_name = serializers.CharField(required=False)
    firm_address = serializers.CharField(required=False)
    firm_logo = serializers.ImageField(required=False)
    branch_id = serializers.UUIDField(required=False)
    
    # Optional explicit user_type (advocate, client, or super_admin)
    user_type = serializers.ChoiceField(
        choices=['client', 'advocate', 'super_admin'],
        required=False,
        write_only=True
    )
    
    # Accept bar_council_id as alias for bar_council_registration (for backward compatibility)
    bar_council_id = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'phone_number', 'first_name', 'last_name', 'password',
            'password_confirm', 'date_of_birth', 'gender', 'address_line_1',
            'address_line_2', 'city', 'state', 'country', 'postal_code',
            'firm_name', 'firm_address', 'firm_logo', 'branch_id', 'profile_image',
            'bar_council_registration', 'bar_council_state', 'bar_council_id',
            'hourly_rate', 'consultation_fee', 'case_fee', 'user_type'
        ]
    
    def validate(self, data):
        # Handle bar_council_id alias (backward compatibility)
        if 'bar_council_id' in data and data.get('bar_council_id'):
            bar_council_value = data.pop('bar_council_id', '').strip()
            if bar_council_value:  # Only set if not empty
                data['bar_council_registration'] = bar_council_value
        
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        
        # Check uniqueness
        email = data.get('email')
        phone_number = data.get('phone_number')
        
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})
        if CustomUser.objects.filter(phone_number=phone_number).exists():
            raise serializers.ValidationError({'phone_number': 'A user with this phone number already exists.'})

        # Verify phone number is verified via OTP
        from django.core.cache import cache
        from django.conf import settings
        
        # Skip phone verification in TEST MODE
        if not getattr(settings, 'OTP_TEST_MODE', False):
            cache_key = f'phone_otp_{phone_number}'
            otp_data = cache.get(cache_key)
            
            if not otp_data or not otp_data.get('verified'):
                raise serializers.ValidationError({
                    'phone_number': 'Phone number must be verified before registration. Please verify your phone number first.'
                })
        else:
            # In TEST MODE, still check cache but don't fail if not found
            cache_key = f'phone_otp_{phone_number}'
            otp_data = cache.get(cache_key)
            print(f"[TEST MODE] Phone verification check for {phone_number}: {otp_data}")

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
        explicit_user_type = validated_data.pop('user_type', None)
        
        # Determine user type
        user_type = 'client'  # Default
        firm = None
        
        # Debug logging
        bar_council = validated_data.get('bar_council_registration', '').strip()
        print(f"[REGISTRATION DEBUG] explicit_user_type: {explicit_user_type}, firm_name: {firm_name}, bar_council: '{bar_council}'")
        
        # Priority 1: Explicit user_type from frontend
        if explicit_user_type:
            user_type = explicit_user_type
        # Priority 2: Firm name provided = super_admin
        elif firm_name:
            user_type = 'super_admin'
        # Priority 3: Bar council registration provided = advocate
        elif bar_council:
            user_type = 'advocate'
        
        print(f"[REGISTRATION DEBUG] Determined user_type: {user_type}")
        
        # Create firm if super_admin
        if user_type == 'super_admin' and firm_name:
            
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
            is_phone_verified=True,  # Mark as verified since OTP was checked
            **{k: v for k, v in validated_data.items() 
               if k not in ['email', 'phone_number', 'first_name', 'last_name', 'password']}
        )
        
        # Clear the OTP cache after successful registration
        from django.core.cache import cache
        cache_key = f'phone_otp_{validated_data["phone_number"]}'
        cache.delete(cache_key)
        
        # Create login credential
        LoginCredential.objects.create(
            user=user,
            username=validated_data['email']
        )
        
        # Create Client record for self-registered clients
        if user_type == 'client':
            from clients.models import Client
            Client.objects.create(
                firm=firm,  # Will be None for solo clients
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                phone_number=user.phone_number,
                address=f"{validated_data.get('address_line_1', '')} {validated_data.get('address_line_2', '')}".strip(),
                user_account=user
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


class GlobalConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for global configuration settings"""
    
    class Meta:
        model = GlobalConfiguration
        fields = ['id', 'is_free_trial_enabled', 'trial_period_days', 'updated_at', 'updated_by']
        read_only_fields = ['id', 'updated_at', 'updated_by']


class FirmJoinLinkSerializer(serializers.ModelSerializer):
    firm_name = serializers.SerializerMethodField()
    user_type_display = serializers.CharField(source='get_user_type_display', read_only=True)

    def get_firm_name(self, obj):
        return obj.firm.firm_name if obj.firm else None
    
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
