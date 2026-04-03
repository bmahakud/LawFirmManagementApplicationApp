from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from firms.models import Firm


class UserAPISetupMixin:
    """Mixin to setup common test data for User API tests"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create firm
        self.firm = Firm.objects.create(
            firm_name="Test Law Firm",
            firm_code="TLF001",
            city="Mumbai",
            state="Maharashtra",
            country="India",
            phone_number="+912225551234",
            email="info@testlaw.com"
        )
        
        # Create platform owner
        self.platform_owner = CustomUser.objects.create_user(
            username="platform@example.com",
            email="platform@example.com",
            phone_number="+919876543210",
            password="PlatformPass@123",
            user_type="platform_owner"
        )
        self.platform_token = Token.objects.create(user=self.platform_owner)
        
        # Create super admin
        self.super_admin = CustomUser.objects.create_user(
            username="superadmin@testlaw.com",
            email="superadmin@testlaw.com",
            phone_number="+919876543211",
            password="SuperAdminPass@123",
            user_type="super_admin",
            firm=self.firm
        )
        self.super_admin_token = Token.objects.create(user=self.super_admin)
        
        # Create advocate
        self.advocate = CustomUser.objects.create_user(
            username="advocate@testlaw.com",
            email="advocate@testlaw.com",
            phone_number="+919876543212",
            password="AdvocatePass@123",
            user_type="advocate",
            firm=self.firm
        )
        self.advocate_token = Token.objects.create(user=self.advocate)
        
        # Create client
        self.client_user = CustomUser.objects.create_user(
            username="client@example.com",
            email="client@example.com",
            phone_number="+919876543213",
            password="ClientPass@123",
            user_type="client"
        )
        self.client_token = Token.objects.create(user=self.client_user)
        
        self.user_list_url = reverse('user-list')


class UserListAPITest(UserAPISetupMixin, TestCase):
    """Test User list API"""
    
    def test_platform_owner_can_list_all_users(self):
        """Test platform owner can list all users"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 4)
    
    def test_super_admin_can_list_firm_users(self):
        """Test super admin can list users from their firm only"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see users from their firm
        self.assertEqual(response.data['count'], 2)  # super_admin and advocate
    
    def test_advocate_can_list_firm_users(self):
        """Test advocate can list users from their firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see users from their firm
        self.assertEqual(response.data['count'], 2)  # super_admin and advocate
    
    def test_client_can_only_see_self(self):
        """Test client can only see their own profile"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
    
    def test_unauthenticated_cannot_list_users(self):
        """Test unauthenticated user cannot list users"""
        response = self.client.get(self.user_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDetailAPITest(UserAPISetupMixin, TestCase):
    """Test User detail API"""
    
    def test_get_user_details(self):
        """Test getting user details"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.advocate.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], "advocate@testlaw.com")
    
    def test_user_can_get_own_profile(self):
        """Test user can get their own profile"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.client_user.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_cannot_get_other_user_profile(self):
        """Test user cannot get other user's profile"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.advocate.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_super_admin_can_get_firm_user_profile(self):
        """Test super admin can get firm user's profile"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.advocate.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_nonexistent_user(self):
        """Test getting nonexistent user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('user-detail', kwargs={'pk': '00000000-0000-0000-0000-000000000000'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UserUpdateAPITest(UserAPISetupMixin, TestCase):
    """Test User update API"""
    
    def test_user_can_update_own_profile(self):
        """Test user can update their own profile"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.advocate.id})
        
        data = {
            "first_name": "Updated",
            "last_name": "Name"
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], "Updated")
    
    def test_user_cannot_update_other_user_profile(self):
        """Test user cannot update other user's profile"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.advocate.id})
        
        data = {"first_name": "Hacked"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_super_admin_can_update_firm_user(self):
        """Test super admin can update firm user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.advocate.id})
        
        data = {"first_name": "Updated"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_cannot_change_user_type(self):
        """Test user cannot change their user type"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('user-detail', kwargs={'pk': self.advocate.id})
        
        data = {"user_type": "super_admin"}
        response = self.client.patch(url, data, format='json')
        # Should either fail or ignore the change
        self.advocate.refresh_from_db()
        self.assertEqual(self.advocate.user_type, "advocate")


class UserAddAPITest(UserAPISetupMixin, TestCase):
    """Test User add API"""
    
    def test_super_admin_can_add_advocate(self):
        """Test super admin can add advocate"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        
        data = {
            "email": "newadvocate@example.com",
            "phone_number": "+919876543214",
            "first_name": "New",
            "last_name": "Advocate",
            "user_type": "advocate",
            "firm": str(self.firm.id)
        }
        
        url = reverse('user-add_user')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['user_type'], "advocate")
    
    def test_super_admin_can_add_paralegal(self):
        """Test super admin can add paralegal"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        
        data = {
            "email": "newparalegal@example.com",
            "phone_number": "+919876543214",
            "first_name": "New",
            "last_name": "Paralegal",
            "user_type": "paralegal",
            "firm": str(self.firm.id)
        }
        
        url = reverse('user-add_user')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_platform_owner_can_add_super_admin(self):
        """Test platform owner can add super admin"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        
        data = {
            "email": "newsuperadmin@example.com",
            "phone_number": "+919876543214",
            "first_name": "New",
            "last_name": "SuperAdmin",
            "user_type": "super_admin",
            "firm": str(self.firm.id)
        }
        
        url = reverse('user-add_user')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_advocate_cannot_add_user(self):
        """Test advocate cannot add user"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        
        data = {
            "email": "newuser@example.com",
            "phone_number": "+919876543214",
            "user_type": "advocate"
        }
        
        url = reverse('user-add_user')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_add_user_duplicate_email(self):
        """Test adding user with duplicate email"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        
        data = {
            "email": "advocate@testlaw.com",  # Already exists
            "phone_number": "+919876543214",
            "user_type": "advocate"
        }
        
        url = reverse('user-add_user')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
