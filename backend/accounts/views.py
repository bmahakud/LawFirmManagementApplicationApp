from rest_framework import viewsets, status, permissions, serializers, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import random
import string
from datetime import timedelta
import requests
from django.db.models import F, Q
from django_filters.rest_framework import DjangoFilterBackend


from .models import CustomUser, LoginCredential, OTPVerification, UserInvitation, UserFirmRole, GlobalConfiguration, FirmJoinLink
from firms.models import Firm, Branch
from audit.models import AuditLog
from .serializers import (
    CustomUserSerializer, LoginCredentialSerializer,
    OTPVerificationSerializer, UserInvitationSerializer,
    UserRegistrationSerializer, UsernamePasswordLoginSerializer,
    PhoneOTPLoginSerializer, EmailOTPLoginSerializer,
    OTPVerifySerializer, SetPasswordSerializer, ChangePasswordSerializer,
    UserFirmRoleSerializer, GlobalConfigurationSerializer,
    FirmJoinLinkSerializer, PublicJoinSerializer
)


def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def send_otp_sms(phone_number, otp_code):
    """Send OTP via MSG91"""
    if getattr(settings, 'OTP_TEST_MODE', False):
        print(f"OTP_TEST_MODE: Skip sending SMS to {phone_number}. OTP is {otp_code}")
        return True

    url = "https://control.msg91.com/api/v5/otp"
    
    # Clean phone number for MSG91 (expects digits only, including country code)
    mobile = phone_number.replace('+', '').replace(' ', '').replace('-', '')
    if len(mobile) == 10:
        mobile = f"91{mobile}" # Default to India if only 10 digits
        
    payload = {
        "template_id": settings.MSG91_TEMPLATE_ID,
        "mobile": mobile,
        "authkey": settings.MSG91_AUTHKEY,
        "otp": otp_code,
        "otp_length": len(otp_code)
    }
    
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        res_data = response.json()
        if res_data.get('type') == 'success':
            return True
        print(f"MSG91 Error for {mobile}: {res_data.get('message')}")
        return False
    except Exception as e:
        print(f"Failed to send MSG91 SMS to {mobile}: {str(e)}")
        return False


def send_notification_email(email, subject, message):
    """Send generic notification email with error handling"""
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send email to {email}: {str(e)}")
        return False


def send_otp_email(email, otp_code):
    """Send OTP via Email"""
    subject = 'Your OTP for AntLegal Management System'
    message = f'Your OTP is: {otp_code}\n\nThis OTP is valid for 10 minutes.'
    return send_notification_email(email, subject, message)


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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number']
    filterset_fields = ['user_type', 'is_active', 'firm']
    ordering_fields = ['created_at', 'id']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'platform_owner':
            return CustomUser.objects.all()
        elif user.user_type in ['super_admin', 'admin', 'advocate', 'paralegal']:
            return CustomUser.objects.filter(firm=user.firm)
        return CustomUser.objects.filter(id=user.id)
    
    def get_object(self):
        """Return 403 instead of 404 when object exists but user lacks permission"""
        from rest_framework.exceptions import PermissionDenied as DRFPermDenied
        pk = self.kwargs.get('pk')
        try:
            obj = CustomUser.objects.get(pk=pk)
        except CustomUser.DoesNotExist:
            from django.http import Http404
            raise Http404
        if not self.get_queryset().filter(pk=pk).exists():
            raise DRFPermDenied("You do not have permission to access this resource.")
        return obj

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_name='register')
    def register(self, request):
        """Client self-registration"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            password = request.data.get('password')
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            reg_type = "Super Admin (Firm Owner)" if user.user_type == 'super_admin' else "Client"
            
            # Send Welcome Email
            subject = f"Welcome to AntLegal - Account Created"
            message = (
                f"Hello {user.first_name or user.username},\n\n"
                f"Your account has been successfully created as {reg_type}.\n\n"
                f"Your login details:\n"
                f"Username: {user.email}\n"
                f"Password: {password}\n\n"
                f"You can now login at our portal and start using the system.\n\n"
                f"Regards,\nAntLegal Team"
            )
            send_notification_email(user.email, subject, message)
            
            log_audit(user, 'create_user', f'{reg_type} self-registered')
            return Response({
                'user': CustomUserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_name='add_user')
    def add_user(self, request):
        """Add user with role-based hierarchy"""
        user = request.user
        data = request.data
        user_type_to_add = data.get('user_type')
        
        # ============================================================================
        # ROLE-BASED USER CREATION HIERARCHY
        # ============================================================================
        
        # PLATFORM OWNER can add PARTNER_MANAGER or SUPER_ADMIN
        if user.user_type == 'platform_owner':
            allowed_types = ['partner_manager', 'super_admin']
            if user_type_to_add not in allowed_types:
                return Response(
                    {'error': f'Platform Owner can only add: {", ".join(allowed_types)}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            firm = data.get('firm')
            if user_type_to_add == 'super_admin' and not firm:
                return Response(
                    {'error': 'Firm is required for Super Admin'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # If partner_manager, firm can be optional or handled if firm creation happened
            if user_type_to_add == 'partner_manager' and not firm:
                # Assuming firm is linked to partner manager in some cases
                pass
        
        # PARTNER_MANAGER can add SUPER_ADMIN (within their firm) and create firms
        elif user.user_type == 'partner_manager':
            if user_type_to_add != 'super_admin':
                return Response(
                    {'error': 'Partner Manager can only add Super Admin users'},
                    status=status.HTTP_403_FORBIDDEN
                )
            firm = data.get('firm')
            if not firm:
                # Check if firm_name is provided to create on the fly
                firm_name = data.get('firm_name')
                if firm_name:
                    firm_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
                    firm = Firm.objects.create(
                        firm_name=firm_name,
                        firm_code=firm_code,
                        # other fields...
                        city=data.get('city', ''),
                        state=data.get('state', ''),
                        country=data.get('country', 'India'),
                        phone_number=data.get('phone_number', ''),
                        email=data.get('email', '')
                    )
                else:
                    return Response(
                        {'error': 'Firm or firm_name is required for Super Admin'},
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
        # NEW RESTRICTIONS (Super Admin & Branch Admin)
        # ============================================================================
        email = data.get('email')
        existing_user = CustomUser.objects.filter(Q(email=email) | Q(username=email)).first()
        
        # 1. Super Admin Restriction: Can't be part of multiple firms
        if user_type_to_add == 'super_admin':
            if existing_user and existing_user.firm_memberships.exists():
                return Response(
                    {'error': 'A Super Admin (Firm Owner) cannot be added to another firm.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # 2. Prevent adding an existing Super Admin to any other firm
        if existing_user and existing_user.user_type == 'super_admin' and existing_user.firm != firm:
            return Response(
                {'error': 'This user is a Super Admin of another firm and cannot join a different firm.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Branch Admin Restriction: Can't be in different branches
        if user_type_to_add == 'admin' and data.get('branch_id'):
            if existing_user:
                # Check if already assigned to any branch
                already_in_branch = UserFirmRole.objects.filter(
                    user=existing_user, 
                    branch__isnull=False
                ).exists()
                if already_in_branch:
                    return Response(
                        {'error': 'An Admin cannot be assigned to more than one branch.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        # ============================================================================
        # CREATE OR LINK USER
        # ============================================================================
        
        # Resolve firm to Firm object if it's a string/UUID
        if firm and not isinstance(firm, Firm):
            try:
                firm = Firm.objects.get(pk=firm)
            except Firm.DoesNotExist:
                return Response(
                    {'error': 'Invalid firm ID'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        email = data.get('email')
        phone_number = data.get('phone_number')
        
        # Check if user already exists - reject duplicate
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {'error': 'A user with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate a temporary password if not provided
        temp_password = data.get('password') or ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        try:
            new_user = CustomUser.objects.create_user(
                username=email,
                email=email,
                phone_number=phone_number,
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                user_type=user_type_to_add,
                firm=firm,
                password=temp_password,
                password_set=True if data.get('password') else False
            )
            
            # Create login credential
            LoginCredential.objects.create(
                user=new_user,
                username=email
            )
        except Exception as e:
            return Response(
                {'error': f'Error creating user: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create UserFirmRole mapping (or update if exists)
        branch_id = data.get('branch_id')
        branch = None
        if branch_id:
            branch = Branch.objects.filter(id=branch_id, firm=firm).first()

        membership, created = UserFirmRole.objects.get_or_create(
            user=new_user,
            firm=firm,
            defaults={'user_type': user_type_to_add, 'branch': branch}
        )
        
        if not created:
            if membership.user_type != user_type_to_add or membership.branch != branch:
                membership.user_type = user_type_to_add
                membership.branch = branch
                membership.save()
        
        # Set as active if it's their only firm or first one added
        if new_user.firm_memberships.count() == 1:
            membership.is_last_active = True
            membership.save()
            new_user.firm = firm
            new_user.user_type = user_type_to_add
            new_user.save()

        # ============================================================================
        # AUTO-CREATE CLIENT RECORD (when admin adds a client)
        # ============================================================================
        if user_type_to_add == 'client':
            from clients.models import Client as ClientRecord
            assigned_advocate_id = data.get('assigned_advocate_id')
            advocate_obj = None
            if assigned_advocate_id:
                advocate_obj = CustomUser.objects.filter(id=assigned_advocate_id, user_type='advocate').first()
            
            ClientRecord.objects.create(
                firm=firm,
                first_name=new_user.first_name,
                last_name=new_user.last_name,
                email=new_user.email,
                phone_number=new_user.phone_number or '',
                brief_summary=data.get('brief_summary', ''),
                assigned_advocate=advocate_obj,
                user_account=new_user
            )

        # Create invitation (only if new or new to this firm)
        invitation = UserInvitation.objects.create(
            invited_by=user,
            invited_user=new_user,
            email=new_user.email,
            phone_number=new_user.phone_number,
            user_type=user_type_to_add,
            firm=firm,
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Send notification
        join_link = f"https://antlegal.anthemgt.com/join?token={invitation.id}"
        firm_name = firm.firm_name if firm else "AntLegal Platform"
        subject = f"Invite to join {firm_name} - AntLegal"
        message = (
            f"Hello {new_user.first_name or new_user.username},\n\n"
            f"You have been invited to join {firm_name} as a {membership.get_user_type_display()} on AntLegal.\n\n"
            f"Please click the link below to set up your account and get started:\n"
            f"{join_link}\n\n"
            f"This link will expire in 7 days.\n\n"
            f"Regards,\nAntLegal Team"
        )
        send_notification_email(new_user.email, subject, message)
        
        # Log audit
        log_audit(
            user, 
            'create_user', 
            f"Added {membership.get_user_type_display()}: {new_user.get_full_name()} to {firm_name}"
        )
        
        return Response({
            'user': CustomUserSerializer(new_user).data,
            'invitation': UserInvitationSerializer(invitation).data,
            'membership': UserFirmRoleSerializer(membership).data,
            'message': f'User added to {firm.firm_name} successfully.'
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_name='switch_firm')
    def switch_firm(self, request):
        """Switch active firm and branch context"""
        firm_id = request.data.get('firm_id')
        branch_id = request.data.get('branch_id')
        
        if not firm_id:
            return Response({'error': 'firm_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            membership = UserFirmRole.objects.get(user=request.user, firm_id=firm_id, is_active=True)
            
            # Deactivate all other last_active flags
            request.user.firm_memberships.update(is_last_active=False)
            
            # Activate this one
            membership.is_last_active = True
            
            # Update branch if provided
            if branch_id:

                try:
                    branch = Branch.objects.get(id=branch_id, firm_id=firm_id)
                    membership.branch = branch
                except Branch.DoesNotExist:
                    return Response({'error': 'Branch not found in this firm'}, status=status.HTTP_400_BAD_REQUEST)
            
            membership.save()
            
            # Sync to CustomUser for backward compatibility
            request.user.firm = membership.firm
            request.user.user_type = membership.user_type
            request.user.save()
            
            branch_info = f" (Branch: {membership.branch.branch_name})" if membership.branch else ""
            log_audit(request.user, 'switch_firm', f'Switched active firm to {membership.firm.firm_name}{branch_info}')
            
            return Response({
                'message': f'Switched to {membership.firm.firm_name}{branch_info}',
                'user': CustomUserSerializer(request.user).data
            })
            
        except UserFirmRole.DoesNotExist:
            return Response({'error': 'You are not an active member of this firm'}, status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_name='change_password')
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
    
    @action(detail=False, methods=['post'], url_name='login_username_password')
    def login_username_password(self, request):
        """Login with username/email and password"""
        try:
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
        except Exception as e:
            return Response(
                {'error': f'Login failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'], url_name='send_otp')
    def send_otp(self, request):
        """Request OTP for phone login (Aliased to send-otp)"""
        serializer = PhoneOTPLoginSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            try:
                user = CustomUser.objects.get(phone_number=phone_number)
            except CustomUser.DoesNotExist:
                return Response({'error': 'User not found with this phone number'}, status=status.HTTP_404_NOT_FOUND)
            
            if getattr(settings, 'OTP_TEST_MODE', False):
                otp_code = settings.OTP_TEST_CODE
            else:
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
                'success': True,
                'message': 'OTP sent to your phone',
                'data': {
                    'otp_id': str(otp_obj.id),
                    'expires_in_minutes': 10
                }
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_name='request_email_otp')
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
                'success': True,
                'message': 'OTP sent to your email',
                'data': {
                    'otp_id': str(otp_obj.id),
                    'expires_in_minutes': 10
                }
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_name='verify_otp')
    def verify_otp(self, request):
        """Verify OTP and login"""
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data.get('phone_number')
            email = serializer.validated_data.get('email')
            otp_code = serializer.validated_data['otp_code']
            
            if phone_number:
                try:
                    user = CustomUser.objects.get(phone_number=phone_number)
                except CustomUser.DoesNotExist:
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
                otp_type = 'phone'
            else:
                try:
                    user = CustomUser.objects.get(email=email)
                except CustomUser.DoesNotExist:
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
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
                    'success': True,
                    'message': 'Login successful',
                    'data': {
                        'access': token.key,
                        'user': CustomUserSerializer(user).data
                    }
                })
            
            except OTPVerification.DoesNotExist:
                return Response(
                    {'error': 'No OTP found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_name='set_password')
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
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_name='logout')
    def logout(self, request):
        """Logout user"""
        user = request.user
        log_audit(user, 'logout', 'User logged out')
        
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        return Response({'message': 'Logged out successfully'})

class UserInvitationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user invitations"""
    queryset = UserInvitation.objects.all()
    serializer_class = UserInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Public actions should have access to the specific invitation
        if self.action in ['details', 'accept']:
            return UserInvitation.objects.all()
            
        if not user.is_authenticated:
            return UserInvitation.objects.none()
            
        if user.user_type == 'platform_owner':
            return UserInvitation.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return UserInvitation.objects.filter(firm=user.firm)
        return UserInvitation.objects.filter(invited_user=user)
    
    def get_object(self):
        from rest_framework.exceptions import PermissionDenied as DRFPermDenied
        pk = self.kwargs.get('pk')
        try:
            obj = UserInvitation.objects.get(pk=pk)
        except UserInvitation.DoesNotExist:
            from django.http import Http404
            raise Http404
            
        # Permission check: AllowAny for specific public actions, otherwise keep restrictions
        if self.action in ['details', 'accept']:
            return obj
            
        if not self.get_queryset().filter(pk=pk).exists():
            raise DRFPermDenied("You do not have permission to access this resource.")
        return obj

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def details(self, request, pk=None):
        """Public endpoint to get invitation context (Firm name, Role)"""
        invitation = self.get_object()
        if invitation.status != 'pending':
            return Response({'error': f'This invitation is {invitation.status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        if invitation.expires_at and invitation.expires_at < timezone.now():
            invitation.status = 'expired'
            invitation.save()
            return Response({'error': 'This invitation has expired'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            'firm_name': invitation.firm.firm_name,
            'user_type': invitation.user_type,
            'user_type_display': invitation.get_user_type_display(),
            'email': invitation.email,
            'first_name': invitation.invited_user.first_name if invitation.invited_user else ""
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def accept(self, request, pk=None):
        """Public endpoint to finalize registration and accept invitation"""
        invitation = self.get_object()
        if invitation.status != 'pending':
            return Response({'error': 'Invitation is no longer pending'}, status=status.HTTP_400_BAD_REQUEST)
            
        data = request.data
        password = data.get('password')
        
        if not password or len(password) < 8:
            return Response({'error': 'Valid password is required (min 8 chars)'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = invitation.invited_user
        if not user:
            # If invitation was generic/email-only, create user now
            # (Note: Current add_user logic creates a stub user, so we usually have one)
            return Response({'error': 'User record not found. Please contact admin.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Update user details
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.set_password(password)
        user.password_set = True
        user.is_active = True
        user.save()
        
        # Mark invitation as accepted
        invitation.status = 'accepted'
        invitation.accepted_at = timezone.now()
        invitation.save()
        
        # Generate token for immediate login
        token, _ = Token.objects.get_or_create(user=user)
        
        log_audit(user, 'accept_invitation', f'Accepted invitation to {invitation.firm.firm_name}')
        
        return Response({
            'message': 'Account activated successfully',
            'token': token.key,
            'user': CustomUserSerializer(user).data
        })


class GlobalConfigurationViewSet(viewsets.ViewSet):
    """ViewSet for managing global configuration settings"""
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='settings')
    def settings(self, request):
        """Get current global settings (Restricted to Platform Owner)"""
        if request.user.user_type != 'platform_owner':
            return Response(
                {'error': 'Only Platform Owner can view global settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            config = GlobalConfiguration.get_settings()
            return Response({
                'is_free_trial_enabled': config.is_free_trial_enabled,
                'trial_period_days': config.trial_period_days
            })
        except Exception as e:
            return Response({
                'is_free_trial_enabled': True,
                'trial_period_days': 15,
                'note': 'Using fallback defaults'
            }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['patch'], url_name='update_settings')
    def update_settings(self, request):
        """Update global settings (Platform Owner only)"""
        try:
            if request.user.user_type != 'platform_owner':
                return Response(
                    {'error': 'Only Platform Owner can update global settings'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            config = GlobalConfiguration.get_settings()
            serializer = GlobalConfigurationSerializer(config, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save(updated_by=request.user)
                log_audit(
                    request.user,
                    'update_config',
                    f'Updated global configuration: Trial Enabled={config.is_free_trial_enabled}, Trial Days={config.trial_period_days}'
                )
                return Response(serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Failed to update settings: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FirmJoinLinkViewSet(viewsets.ModelViewSet):
    """ViewSet for managing generic firm join links"""
    queryset = FirmJoinLink.objects.all()
    serializer_class = FirmJoinLinkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Public actions should have access to all links (validity is checked in the action)
        if self.action in ['details', 'join']:
            return FirmJoinLink.objects.all()
            
        if not user.is_authenticated:
            return FirmJoinLink.objects.none()
            
        if user.user_type == 'platform_owner':
            return FirmJoinLink.objects.all()
        elif user.user_type in ['super_admin', 'admin']:
            return FirmJoinLink.objects.filter(firm=user.firm)
        return FirmJoinLink.objects.none()

    def get_object(self):
        from rest_framework.exceptions import PermissionDenied as DRFPermDenied
        pk = self.kwargs.get('pk')
        try:
            obj = FirmJoinLink.objects.get(pk=pk)
        except FirmJoinLink.DoesNotExist:
            from django.http import Http404
            raise Http404
            
        # Public actions allow access to the object
        if self.action in ['details', 'join']:
            return obj
            
        if not self.get_queryset().filter(pk=pk).exists():
            raise DRFPermDenied("You do not have permission to access this resource.")
        return obj

    def perform_create(self, serializer):
        user = self.request.user
        if user.user_type not in ['platform_owner', 'super_admin', 'admin']:
            raise permissions.PermissionDenied("Only admins can create join links")
        
        firm = user.firm
        # If Platform Owner, they can specify any firm
        if user.user_type == 'platform_owner' and 'firm' in self.request.data:
            firm_id = self.request.data.get('firm')
            try:
                firm = Firm.objects.get(pk=firm_id)
            except Firm.DoesNotExist:
                raise serializers.ValidationError({'firm': 'Invalid firm ID'})
        
        if not firm:
            raise serializers.ValidationError({'firm': 'Firm is required'})
            
        serializer.save(created_by=user, firm=firm)
        log_audit(user, 'create_join_link', f"Created {serializer.validated_data.get('user_type')} join link for {firm.firm_name}")

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def details(self, request, pk=None):
        """Public endpoint to get join link details (firm name, role)"""
        link = self.get_object()
        if not link.is_valid():
            return Response({
                'error': 'This link is invalid, expired, or has reached maximum uses',
                'is_valid': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'firm_name': link.firm.firm_name,
            'user_type': link.user_type,
            'user_type_display': link.get_user_type_display(),
            'expires_at': link.expires_at,
            'max_uses': link.max_uses,
            'usage_count': link.usage_count,
            'is_valid': True
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def join(self, request, pk=None):
        """Public endpoint for a user to join a firm via generic link"""
        link = self.get_object()
        if not link.is_valid():
            return Response({'error': 'This link is no longer valid'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PublicJoinSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # 1. Create the CustomUser
            user = CustomUser.objects.create_user(
                username=data['email'],
                email=data['email'],
                phone_number=data['phone_number'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                password=data['password'],
                user_type=link.user_type,
                firm=link.firm,
                password_set=True
            )
            
            # 2. Create Login Credentials
            LoginCredential.objects.create(
                user=user,
                username=data['email']
            )
            
            # 3. Create User-Firm mapping (Membership)
            # Using get_or_create because post_save signal on CustomUser might have already created it
            membership, _ = UserFirmRole.objects.get_or_create(
                user=user,
                firm=link.firm,
                defaults={
                    'user_type': link.user_type,
                    'is_last_active': True
                }
            )
            
            # 4. Increment usage count on the link atomically
            link.usage_count = F('usage_count') + 1
            link.save()
            
            # 5. Generate Auth Token
            token, _ = Token.objects.get_or_create(user=user)
            
            log_audit(user, 'join_via_link', f"Joined {link.firm.firm_name} via generic link as {link.get_user_type_display()}")
            
            return Response({
                'message': f"Welcome! You have successfully joined {link.firm.firm_name}",
                'token': token.key,
                'user': CustomUserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
