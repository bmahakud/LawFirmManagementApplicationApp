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

from .models import (
    CustomUser, Firm, LoginCredential, OTPVerification,
    Partner, UserDocument, UserInvitation, AuditLog
)
from .serializers import (
    CustomUserSerializer, FirmSerializer, LoginCredentialSerializer,
    OTPVerificationSerializer, PartnerSerializer, UserDocumentSerializer,
    UserInvitationSerializer, AuditLogSerializer, UserRegistrationSerializer,
    UsernamePasswordLoginSerializer, PhoneOTPLoginSerializer,
    EmailOTPLoginSerializer, OTPVerifySerializer, SetPasswordSerializer,
    ChangePasswordSerializer
)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def send_otp_sms(phone_number, otp_code):
    """Send OTP via SMS (integrate with SMS provider like Twilio)"""
    # TODO: Integrate with SMS provider
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
        user_agent=user_agent
    )


# ============================================================================
# FIRM VIEWSET
# ============================================================================

class FirmViewSet(viewsets.ModelViewSet):
    queryset = Firm.objects.all()
    serializer_class = FirmSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return Firm.objects.all()
        elif user.user_type == 'super_admin':
            return Firm.objects.filter(id=user.firm_id)
        return Firm.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.user_type not in ['platform_owner', 'partner_manager']:
            raise permissions.PermissionDenied('Only Platform Owner or Partner Manager can create firms')
        serializer.save()


# ============================================================================
# CUSTOM USER VIEWSET
# ============================================================================

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
        """Add user by admin/super_admin"""
        user = request.user
        if user.user_type not in ['super_admin', 'admin', 'platform_owner']:
            return Response(
                {'error': 'Only admins can add users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data
        
        # Create user
        new_user = CustomUser.objects.create_user(
            username=data.get('email'),
            email=data.get('email'),
            phone_number=data.get('phone_number'),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            user_type=data.get('user_type'),
            firm=user.firm if user.user_type != 'platform_owner' else data.get('firm'),
            password_set=False
        )
        
        # Create login credential
        LoginCredential.objects.create(
            user=new_user,
            username=data.get('email')
        )
        
        # Send invitation
        invitation = UserInvitation.objects.create(
            invited_by=user,
            invited_user=new_user,
            email=new_user.email,
            phone_number=new_user.phone_number,
            user_type=new_user.user_type,
            firm=new_user.firm,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Send notification (email/SMS)
        send_otp_email(
            new_user.email,
            f'You have been added as {new_user.get_user_type_display()} in the Law Firm Management System. '
            f'Please set your password using your phone number: {new_user.phone_number}'
        )
        
        log_audit(user, 'create_user', f'Added {new_user.get_user_type_display()}: {new_user.get_full_name()}')
        
        return Response({
            'user': CustomUserSerializer(new_user).data,
            'invitation': UserInvitationSerializer(invitation).data,
            'message': 'User added successfully. Invitation sent to user.'
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


# ============================================================================
# AUTHENTICATION VIEWSET
# ============================================================================

class AuthenticationViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def login_username_password(self, request):
        """Login with username/email and password"""
        serializer = UsernamePasswordLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            
            # Update last login
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
            
            # Generate OTP
            otp_code = generate_otp()
            
            # Create OTP verification record
            otp_obj = OTPVerification.objects.create(
                user=user,
                otp_type='phone',
                otp_code=otp_code,
                expires_at=timezone.now() + timedelta(minutes=10)
            )
            
            # Send OTP via SMS
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
            
            # Generate OTP
            otp_code = generate_otp()
            
            # Create OTP verification record
            otp_obj = OTPVerification.objects.create(
                user=user,
                otp_type='email',
                otp_code=otp_code,
                expires_at=timezone.now() + timedelta(minutes=10)
            )
            
            # Send OTP via Email
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
            
            # Get user
            if phone_number:
                user = CustomUser.objects.get(phone_number=phone_number)
                otp_type = 'phone'
            else:
                user = CustomUser.objects.get(email=email)
                otp_type = 'email'
            
            # Verify OTP
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
                
                # OTP verified
                otp_obj.is_verified = True
                otp_obj.save()
                
                # Update user verification status
                if otp_type == 'phone':
                    user.is_phone_verified = True
                else:
                    user.is_email_verified = True
                user.last_login_at = timezone.now()
                user.save()
                
                # Create token
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
            
            # Create login credential if not exists
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
        
        # Delete token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        return Response({'message': 'Logged out successfully'})


# ============================================================================
# USER DOCUMENT VIEWSET
# ============================================================================

class UserDocumentViewSet(viewsets.ModelViewSet):
    queryset = UserDocument.objects.all()
    serializer_class = UserDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return UserDocument.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return UserDocument.objects.filter(user__firm=user.firm)
        return UserDocument.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ============================================================================
# USER INVITATION VIEWSET
# ============================================================================

class UserInvitationViewSet(viewsets.ModelViewSet):
    queryset = UserInvitation.objects.all()
    serializer_class = UserInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return UserInvitation.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return UserInvitation.objects.filter(firm=user.firm)
        return UserInvitation.objects.filter(invited_user=user)


# ============================================================================
# AUDIT LOG VIEWSET
# ============================================================================

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return AuditLog.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return AuditLog.objects.filter(user__firm=user.firm)
        return AuditLog.objects.filter(user=user)
