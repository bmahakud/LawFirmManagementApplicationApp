from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser, OTPVerification
from datetime import timedelta
from django.utils import timezone


class AuthenticationAPISetupMixin:
    """Mixin to setup common test data for Authentication API tests"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create test user
        self.user = CustomUser.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            phone_number="+919876543210",
            password="TestPass@123",
            user_type="client"
        )
        
        # Create another user for testing
        self.other_user = CustomUser.objects.create_user(
            username="otheruser@example.com",
            email="otheruser@example.com",
            phone_number="+919876543211",
            password="OtherPass@123",
            user_type="client"
        )


class UserRegistrationAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test user registration API"""
    
    def test_client_registration_success(self):
        """Test successful client registration"""
        url = reverse('user-register')
        data = {
            "email": "newclient@example.com",
            "phone_number": "+919876543212",
            "first_name": "John",
            "last_name": "Doe",
            "password": "ClientPass@123",
            "password_confirm": "ClientPass@123",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['user_type'], 'client')
    
    def test_registration_password_mismatch(self):
        """Test registration with mismatched passwords"""
        url = reverse('user-register')
        data = {
            "email": "newclient@example.com",
            "phone_number": "+919876543212",
            "password": "ClientPass@123",
            "password_confirm": "DifferentPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        url = reverse('user-register')
        data = {
            "email": "testuser@example.com",  # Already exists
            "phone_number": "+919876543212",
            "password": "ClientPass@123",
            "password_confirm": "ClientPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_registration_duplicate_phone(self):
        """Test registration with duplicate phone"""
        url = reverse('user-register')
        data = {
            "email": "newclient@example.com",
            "phone_number": "+919876543210",  # Already exists
            "password": "ClientPass@123",
            "password_confirm": "ClientPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_registration_weak_password(self):
        """Test registration with weak password"""
        url = reverse('user-register')
        data = {
            "email": "newclient@example.com",
            "phone_number": "+919876543212",
            "password": "weak",
            "password_confirm": "weak"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test login API"""
    
    def test_login_with_username_password_success(self):
        """Test successful login with username and password"""
        url = reverse('auth-login_username_password')
        data = {
            "username": "testuser@example.com",
            "password": "TestPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], "testuser@example.com")
    
    def test_login_invalid_password(self):
        """Test login with invalid password"""
        url = reverse('auth-login_username_password')
        data = {
            "username": "testuser@example.com",
            "password": "WrongPassword@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_nonexistent_user(self):
        """Test login with nonexistent user"""
        url = reverse('auth-login_username_password')
        data = {
            "username": "nonexistent@example.com",
            "password": "TestPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_missing_credentials(self):
        """Test login with missing credentials"""
        url = reverse('auth-login_username_password')
        data = {"username": "testuser@example.com"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PhoneOTPAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test phone OTP API"""
    
    def test_request_phone_otp_success(self):
        """Test successful phone OTP request"""
        url = reverse('auth-request_phone_otp')
        data = {"phone_number": "+919876543210"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('otp_id', response.data)
        self.assertEqual(response.data['expires_in_minutes'], 10)
    
    def test_request_otp_nonexistent_user(self):
        """Test requesting OTP for nonexistent user"""
        url = reverse('auth-request_phone_otp')
        data = {"phone_number": "+919999999999"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_request_otp_invalid_phone_format(self):
        """Test requesting OTP with invalid phone format"""
        url = reverse('auth-request_phone_otp')
        data = {"phone_number": "9876543210"}  # Missing country code
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailOTPAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test email OTP API"""
    
    def test_request_email_otp_success(self):
        """Test successful email OTP request"""
        url = reverse('auth-request_email_otp')
        data = {"email": "testuser@example.com"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('otp_id', response.data)
    
    def test_request_email_otp_nonexistent_user(self):
        """Test requesting email OTP for nonexistent user"""
        url = reverse('auth-request_email_otp')
        data = {"email": "nonexistent@example.com"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OTPVerificationAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test OTP verification API"""
    
    def test_verify_phone_otp_success(self):
        """Test successful phone OTP verification"""
        otp_code = "123456"
        OTPVerification.objects.create(
            user=self.user,
            otp_type='phone',
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        url = reverse('auth-verify_otp')
        data = {
            "phone_number": "+919876543210",
            "otp_code": otp_code
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
    
    def test_verify_email_otp_success(self):
        """Test successful email OTP verification"""
        otp_code = "123456"
        OTPVerification.objects.create(
            user=self.user,
            otp_type='email',
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        url = reverse('auth-verify_otp')
        data = {
            "email": "testuser@example.com",
            "otp_code": otp_code
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
    
    def test_verify_otp_invalid_code(self):
        """Test OTP verification with invalid code"""
        OTPVerification.objects.create(
            user=self.user,
            otp_type='phone',
            otp_code="123456",
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        url = reverse('auth-verify_otp')
        data = {
            "phone_number": "+919876543210",
            "otp_code": "999999"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_verify_expired_otp(self):
        """Test OTP verification with expired OTP"""
        OTPVerification.objects.create(
            user=self.user,
            otp_type='phone',
            otp_code="123456",
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        
        url = reverse('auth-verify_otp')
        data = {
            "phone_number": "+919876543210",
            "otp_code": "123456"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SetPasswordAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test set password API"""
    
    def setUp(self):
        super().setUp()
        # Create user with password_set=False
        self.new_user = CustomUser.objects.create_user(
            username="newuser@example.com",
            email="newuser@example.com",
            phone_number="+919876543212",
            password="TempPass@123",
            user_type="advocate",
            password_set=False
        )
    
    def test_set_password_success(self):
        """Test successful password setting"""
        url = reverse('auth-set_password')
        data = {
            "phone_number": "+919876543212",
            "password": "NewPass@123",
            "password_confirm": "NewPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was set
        self.new_user.refresh_from_db()
        self.assertTrue(self.new_user.check_password("NewPass@123"))
    
    def test_set_password_mismatch(self):
        """Test password setting with mismatched passwords"""
        url = reverse('auth-set_password')
        data = {
            "phone_number": "+919876543212",
            "password": "NewPass@123",
            "password_confirm": "DifferentPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_set_password_weak_password(self):
        """Test password setting with weak password"""
        url = reverse('auth-set_password')
        data = {
            "phone_number": "+919876543212",
            "password": "weak",
            "password_confirm": "weak"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ChangePasswordAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test change password API"""
    
    def setUp(self):
        super().setUp()
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
    def test_change_password_success(self):
        """Test successful password change"""
        url = reverse('user-change_password')
        data = {
            "old_password": "TestPass@123",
            "new_password": "NewPass@123",
            "new_password_confirm": "NewPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass@123"))
    
    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password"""
        url = reverse('user-change_password')
        data = {
            "old_password": "WrongPass@123",
            "new_password": "NewPass@123",
            "new_password_confirm": "NewPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_change_password_mismatch(self):
        """Test password change with mismatched new passwords"""
        url = reverse('user-change_password')
        data = {
            "old_password": "TestPass@123",
            "new_password": "NewPass@123",
            "new_password_confirm": "DifferentPass@123"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutAPITest(AuthenticationAPISetupMixin, TestCase):
    """Test logout API"""
    
    def setUp(self):
        super().setUp()
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
    def test_logout_success(self):
        """Test successful logout"""
        url = reverse('auth-logout')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Token should be deleted
        self.assertFalse(Token.objects.filter(key=self.token.key).exists())
    
    def test_logout_unauthenticated(self):
        """Test logout without authentication"""
        self.client.credentials()  # Remove credentials
        url = reverse('auth-logout')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
