from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import CustomUser, LoginCredential, OTPVerification, UserInvitation
from firms.models import Firm
from datetime import timedelta
from django.utils import timezone


class CustomUserModelTest(TestCase):
    """Test CustomUser model"""
    
    def setUp(self):
        self.firm = Firm.objects.create(
            firm_name="Test Firm",
            firm_code="TEST001",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            phone_number="+912225551234",
            email="test@firm.com"
        )
    
    def test_create_user(self):
        """Test creating a user"""
        user = CustomUser.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            phone_number="+919876543210",
            password="TestPass@123",
            user_type="client"
        )
        self.assertEqual(user.email, "testuser@example.com")
        self.assertEqual(user.user_type, "client")
        self.assertTrue(user.check_password("TestPass@123"))
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        user = CustomUser.objects.create_superuser(
            username="admin@example.com",
            email="admin@example.com",
            phone_number="+919876543211",
            password="AdminPass@123",
            user_type="platform_owner"
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
    
    def test_user_with_firm(self):
        """Test user associated with firm"""
        user = CustomUser.objects.create_user(
            username="advocate@example.com",
            email="advocate@example.com",
            phone_number="+919876543212",
            password="AdvocatePass@123",
            user_type="advocate",
            firm=self.firm
        )
        self.assertEqual(user.firm, self.firm)


class UserRegistrationTest(TestCase):
    """Test user registration API"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user-register')
    
    def test_client_registration(self):
        """Test client self-registration"""
        data = {
            "email": "client@example.com",
            "phone_number": "+919876543210",
            "first_name": "John",
            "last_name": "Doe",
            "password": "ClientPass@123",
            "password_confirm": "ClientPass@123",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India"
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['user_type'], 'client')
    
    def test_registration_password_mismatch(self):
        """Test registration with mismatched passwords"""
        data = {
            "email": "client@example.com",
            "phone_number": "+919876543210",
            "password": "ClientPass@123",
            "password_confirm": "DifferentPass@123"
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        CustomUser.objects.create_user(
            username="existing@example.com",
            email="existing@example.com",
            phone_number="+919876543210",
            password="Pass@123"
        )
        data = {
            "email": "existing@example.com",
            "phone_number": "+919876543211",
            "password": "ClientPass@123",
            "password_confirm": "ClientPass@123"
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTest(TestCase):
    """Test login APIs"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            phone_number="+919876543210",
            password="TestPass@123",
            user_type="client"
        )
        self.login_url = reverse('auth-login_username_password')
    
    def test_login_with_username_password(self):
        """Test login with username and password"""
        data = {
            "username": "testuser@example.com",
            "password": "TestPass@123"
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], "testuser@example.com")
    
    def test_login_invalid_password(self):
        """Test login with invalid password"""
        data = {
            "username": "testuser@example.com",
            "password": "WrongPassword@123"
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_nonexistent_user(self):
        """Test login with nonexistent user"""
        data = {
            "username": "nonexistent@example.com",
            "password": "TestPass@123"
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OTPTest(TestCase):
    """Test OTP APIs"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            phone_number="+919876543210",
            password="TestPass@123",
            user_type="client"
        )
        self.request_phone_otp_url = reverse('auth-request_phone_otp')
        self.verify_otp_url = reverse('auth-verify_otp')
    
    def test_request_phone_otp(self):
        """Test requesting phone OTP"""
        data = {"phone_number": "+919876543210"}
        response = self.client.post(self.request_phone_otp_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('otp_id', response.data)
        self.assertEqual(response.data['expires_in_minutes'], 10)
    
    def test_request_otp_nonexistent_user(self):
        """Test requesting OTP for nonexistent user"""
        data = {"phone_number": "+919999999999"}
        response = self.client.post(self.request_phone_otp_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_verify_otp_success(self):
        """Test successful OTP verification"""
        # Create OTP
        otp_code = "123456"
        OTPVerification.objects.create(
            user=self.user,
            otp_type='phone',
            otp_code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        data = {
            "phone_number": "+919876543210",
            "otp_code": otp_code
        }
        response = self.client.post(self.verify_otp_url, data, format='json')
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
        
        data = {
            "phone_number": "+919876543210",
            "otp_code": "999999"
        }
        response = self.client.post(self.verify_otp_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_verify_expired_otp(self):
        """Test OTP verification with expired OTP"""
        OTPVerification.objects.create(
            user=self.user,
            otp_type='phone',
            otp_code="123456",
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        
        data = {
            "phone_number": "+919876543210",
            "otp_code": "123456"
        }
        response = self.client.post(self.verify_otp_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SetPasswordTest(TestCase):
    """Test set password API"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            phone_number="+919876543210",
            password="TempPass@123",
            user_type="client",
            password_set=False
        )
        self.set_password_url = reverse('auth-set_password')
    
    def test_set_password_success(self):
        """Test successful password setting"""
        data = {
            "phone_number": "+919876543210",
            "password": "NewPass@123",
            "password_confirm": "NewPass@123"
        }
        response = self.client.post(self.set_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was set
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass@123"))
    
    def test_set_password_mismatch(self):
        """Test password setting with mismatched passwords"""
        data = {
            "phone_number": "+919876543210",
            "password": "NewPass@123",
            "password_confirm": "DifferentPass@123"
        }
        response = self.client.post(self.set_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ChangePasswordTest(TestCase):
    """Test change password API"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            username="testuser@example.com",
            email="testuser@example.com",
            phone_number="+919876543210",
            password="OldPass@123",
            user_type="client"
        )
        self.change_password_url = reverse('user-change_password')
        
        # Get token
        from rest_framework.authtoken.models import Token
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
    def test_change_password_success(self):
        """Test successful password change"""
        data = {
            "old_password": "OldPass@123",
            "new_password": "NewPass@123",
            "new_password_confirm": "NewPass@123"
        }
        response = self.client.post(self.change_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass@123"))
    
    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password"""
        data = {
            "old_password": "WrongPass@123",
            "new_password": "NewPass@123",
            "new_password_confirm": "NewPass@123"
        }
        response = self.client.post(self.change_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
