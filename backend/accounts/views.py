from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from datetime import timedelta

from .models import CustomUser, LoginCredential, OTPVerification, UserInvitation
from .serializers import (
    CustomUserSerializer, LoginCredentialSerializer,
    OTPVerificationSerializer, UserInvitationSerializer,
    UserRegistrationSerializer, UsernamePasswordLoginSerializer,
    PhoneOTPLoginSerializer, EmailOTPLoginSerializer,
    OTPVerifySerializer, SetPasswordSerializer, ChangePasswordSerializer
)
from audit.models import AuditLog


def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def send_otp_sms(phone_number, otp_code):
    """Send OTP via SMS"""
    print(f"SMS to {phone_number}: Your OTP is {otp_code}")
    return True


def send_otp_email(email, otp_code):
    """Send OTP via Email"""
    subject = 'Your OTP for Law Firm Management System'
    message = f'Your OTP is: {otp_code}\n\nThis OTP is valid for 10 minutes.'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
    return True


def log_audit(user, action, description='', ip_address=None, user_agent=None):
    """Create audit log entry"""
    AuditLog.objects.create(
        user=user,
        action=action,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent or ''
    )


class CustomUserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return CustomUser.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return CustomUser.objects.filter(firm=user.firm)
        return CustomUser.objects.filter(id=user.id)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """Client self-registration"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            log_audit(user, 'create_user', 'Client self-registered')
            return Response({
                'user': CustomUserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_user(self, request):
        """Add user with role-based hierarchy"""
        user = request.user
        data = request.data
        user_type_to_add = data.get('user_type')
        
        # ============================================================================
        # ROLE-BASED USER CREATION HIERARCHY
        # ============================================================================
        
        # PLATFORM OWNER can only add PARTNER_MANAGER
        if user.user_type == 'platform_owner':
            if user_type_to_add != 'partner_manager':
                return Response(
                    {'error': 'Platform Owner can only add Partner Manager users'},
                    status=status.HTTP_403_FORBIDDEN
                )
            firm = data.get('firm')
            if not firm:
                return Response(
                    {'error': 'Firm is required for Partner Manager'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # PARTNER_MANAGER can add SUPER_ADMIN (within their firm) and create firms
        elif user.user_type == 'partner_manager':
            if user_type_to_add != 'super_admin':
                return Response(
                    {'error': 'Partner Manager can only add Super Admin users'},
                    status=status.HTTP_403_FORBIDDEN
                )
            firm = data.get('firm')
            if not firm:
                return Response(
                    {'error': 'Firm is required for Super Admin'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # SUPER_ADMIN can add: ADMIN, ADVOCATE, PARALEGAL, CLIENT, SUPER_ADMIN (within their firm)
        elif user.user_type == 'super_admin':
            allowed_types = ['admin', 'advocate', 'paralegal', 'client', 'super_admin']
            if user_type_to_add not in allowed_types:
                return Response(
                    {'error': f'Super Admin can only add: {", ".join(allowed_types)}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            firm = user.firm
            if not firm:
                return Response(
                    {'error': 'Super Admin must be associated with a firm'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # ADMIN can add: ADVOCATE, PARALEGAL, CLIENT (within their firm)
        elif user.user_type == 'admin':
            allowed_types = ['advocate', 'paralegal', 'client']
            if user_type_to_add not in allowed_types:
                return Response(
                    {'error': f'Admin can only add: {", ".join(allowed_types)}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            firm = user.firm
            if not firm:
                return Response(
                    {'error': 'Admin must be associated with a firm'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # ADVOCATE, PARALEGAL, CLIENT cannot add users
        else:
            return Response(
                {'error': f'{user.get_user_type_display()} cannot add users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # ============================================================================
        # CREATE NEW USER
        # ============================================================================
        
        try:
            new_user = CustomUser.objects.create_user(
                username=data.get('email'),
                email=data.get('email'),
                phone_number=data.get('phone_number'),
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                user_type=user_type_to_add,
                firm=firm,
                password_set=False
            )
        except Exception as e:
            return Response(
                {'error': f'Error creating user: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create login credential
        LoginCredential.objects.create(
            user=new_user,
            username=data.get('email')
        )
        
        # Create invitation
        invitation = UserInvitation.objects.create(
            invited_by=user,
            invited_user=new_user,
            email=new_user.email,
            phone_number=new_user.phone_number,
            user_type=new_user.user_type,
            firm=new_user.firm,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Send notification
        send_otp_email(
            new_user.email,
            f'You have been added as {new_user.get_user_type_display()} in {firm.firm_name}. '
            f'Please set your password using your phone number: {new_user.phone_number}'
        )
        
        # Log audit
        log_audit(
            user, 
            'create_user', 
            f'Added {new_user.get_user_type_display()}: {new_user.get_full_name()} to {firm.firm_name}'
        )
        
        return Response({
            'user': CustomUserSerializer(new_user).data,
            'invitation': UserInvitationSerializer(invitation).data,
            'message': f'{new_user.get_user_type_display()} added successfully. Invitation sent to {new_user.email}.'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Change password for logged-in user"""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'error': 'Old password is incorrect'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            log_audit(user, 'change_password', 'User changed password')
            
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuthenticationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def login_username_password(self, request):
        """Login with username/email and password"""
        serializer = UsernamePasswordLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            
            user.last_login_at = timezone.now()
            user.save()
            
            log_audit(user, 'login', 'Login via username/password')
            
            return Response({
                'token': token.key,
                'user': CustomUserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def request_phone_otp(self, request):
        """Request OTP for phone login"""
        serializer = PhoneOTPLoginSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            user = CustomUser.objects.get(phone_number=phone_number)
            
            otp_code = generate_otp()
            
            otp_obj = OTPVerification.objects.create(
                user=user,
                otp_type='phone',
                otp_code=otp_code,
                expires_at=timezone.now() + timedelta(minutes=10)
            )
            
            send_otp_sms(phone_number, otp_code)
            
            log_audit(user, 'otp_sent', f'OTP sent to phone: {phone_number}')
            
            return Response({
                'message': 'OTP sent to your phone',
                'otp_id': str(otp_obj.id),
                'expires_in_minutes': 10
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def request_email_otp(self, request):
        """Request OTP for email login"""
        serializer = EmailOTPLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = CustomUser.objects.get(email=email)
            
            otp_code = generate_otp()
            
            otp_obj = OTPVerification.objects.create(
                user=user,
                otp_type='email',
                otp_code=otp_code,
                expires_at=timezone.now() + timedelta(minutes=10)
            )
            
            send_otp_email(email, otp_code)
            
            log_audit(user, 'otp_sent', f'OTP sent to email: {email}')
            
            return Response({
                'message': 'OTP sent to your email',
                'otp_id': str(otp_obj.id),
                'expires_in_minutes': 10
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        """Verify OTP and login"""
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data.get('phone_number')
            email = serializer.validated_data.get('email')
            otp_code = serializer.validated_data['otp_code']
            
            if phone_number:
                user = CustomUser.objects.get(phone_number=phone_number)
                otp_type = 'phone'
            else:
                user = CustomUser.objects.get(email=email)
                otp_type = 'email'
            
            try:
                otp_obj = OTPVerification.objects.filter(
                    user=user,
                    otp_type=otp_type,
                    is_verified=False
                ).latest('created_at')
                
                if otp_obj.is_expired():
                    return Response(
                        {'error': 'OTP has expired'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if otp_obj.attempts >= otp_obj.max_attempts:
                    return Response(
                        {'error': 'Maximum OTP attempts exceeded'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if otp_obj.otp_code != otp_code:
                    otp_obj.attempts += 1
                    otp_obj.save()
                    return Response(
                        {'error': 'Invalid OTP'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                otp_obj.is_verified = True
                otp_obj.save()
                
                if otp_type == 'phone':
                    user.is_phone_verified = True
                else:
                    user.is_email_verified = True
                user.last_login_at = timezone.now()
                user.save()
                
                token, _ = Token.objects.get_or_create(user=user)
                
                log_audit(user, 'otp_verified', f'OTP verified via {otp_type}')
                
                return Response({
                    'token': token.key,
                    'user': CustomUserSerializer(user).data,
                    'message': 'Login successful'
                })
            
            except OTPVerification.DoesNotExist:
                return Response(
                    {'error': 'No OTP found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def set_password(self, request):
        """Set password for users added by admin"""
        serializer = SetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user.set_password(serializer.validated_data['password'])
            user.password_set = True
            user.save()
            
            LoginCredential.objects.get_or_create(
                user=user,
                defaults={'username': user.email}
            )
            
            log_audit(user, 'change_password', 'User set initial password')
            
            return Response({'message': 'Password set successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        """Logout user"""
        user = request.user
        log_audit(user, 'logout', 'User logged out')
        
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        return Response({'message': 'Logged out successfully'})
