from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from firms.models import Firm


class FirmAPISetupMixin:
    """Mixin to setup common test data for Firm API tests"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create platform owner
        self.platform_owner = CustomUser.objects.create_user(
            username="platform@example.com",
            email="platform@example.com",
            phone_number="+919876543210",
            password="PlatformPass@123",
            user_type="platform_owner"
        )
        self.platform_token = Token.objects.create(user=self.platform_owner)
        
        # Create partner manager
        self.partner_manager = CustomUser.objects.create_user(
            username="partner@example.com",
            email="partner@example.com",
            phone_number="+919876543211",
            password="PartnerPass@123",
            user_type="partner_manager"
        )
        self.partner_token = Token.objects.create(user=self.partner_manager)
        
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
        
        # Create super admin
        self.super_admin = CustomUser.objects.create_user(
            username="superadmin@testlaw.com",
            email="superadmin@testlaw.com",
            phone_number="+919876543212",
            password="SuperAdminPass@123",
            user_type="super_admin",
            firm=self.firm
        )
        self.super_admin_token = Token.objects.create(user=self.super_admin)
        
        # Create client (should not have access)
        self.client_user = CustomUser.objects.create_user(
            username="client@example.com",
            email="client@example.com",
            phone_number="+919876543213",
            password="ClientPass@123",
            user_type="client"
        )
        self.client_token = Token.objects.create(user=self.client_user)
        
        self.firm_list_url = reverse('firm-list')


class FirmCreateAPITest(FirmAPISetupMixin, TestCase):
    """Test Firm creation API"""
    
    def test_platform_owner_can_create_firm(self):
        """Test platform owner can create firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        data = {
            "firm_name": "New Law Firm",
            "firm_code": "NLF001",
            "city": "Delhi",
            "state": "Delhi",
            "country": "India",
            "phone_number": "+911125551234",
            "email": "info@newlaw.com"
        }
        response = self.client.post(self.firm_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['firm_name'], "New Law Firm")
    
    def test_partner_manager_can_create_firm(self):
        """Test partner manager can create firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.partner_token.key}')
        data = {
            "firm_name": "Partner Law Firm",
            "firm_code": "PLF001",
            "city": "Bangalore",
            "state": "Karnataka",
            "country": "India",
            "phone_number": "+918025551234",
            "email": "info@partnerlaw.com"
        }
        response = self.client.post(self.firm_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['firm_name'], "Partner Law Firm")
    
    def test_super_admin_cannot_create_firm(self):
        """Test super admin cannot create firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        data = {
            "firm_name": "Unauthorized Firm",
            "firm_code": "UF001",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "phone_number": "+914425551234",
            "email": "info@unauthorized.com"
        }
        response = self.client.post(self.firm_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_client_cannot_create_firm(self):
        """Test client cannot create firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        data = {
            "firm_name": "Client Firm",
            "firm_code": "CF001",
            "city": "Pune",
            "state": "Maharashtra",
            "country": "India",
            "phone_number": "+912025551234",
            "email": "info@clientfirm.com"
        }
        response = self.client.post(self.firm_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_firm_duplicate_name(self):
        """Test creating firm with duplicate name"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        data = {
            "firm_name": "Test Law Firm",  # Same as existing firm
            "firm_code": "TLF002",
            "city": "Delhi",
            "state": "Delhi",
            "country": "India",
            "phone_number": "+911125551234",
            "email": "info@duplicate.com"
        }
        response = self.client.post(self.firm_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_firm_duplicate_code(self):
        """Test creating firm with duplicate code"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        data = {
            "firm_name": "Another Law Firm",
            "firm_code": "TLF001",  # Same as existing firm
            "city": "Delhi",
            "state": "Delhi",
            "country": "India",
            "phone_number": "+911125551234",
            "email": "info@another.com"
        }
        response = self.client.post(self.firm_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthenticated_cannot_create_firm(self):
        """Test unauthenticated user cannot create firm"""
        data = {
            "firm_name": "Unauthorized Firm",
            "firm_code": "UF001",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "India",
            "phone_number": "+914425551234",
            "email": "info@unauthorized.com"
        }
        response = self.client.post(self.firm_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FirmListAPITest(FirmAPISetupMixin, TestCase):
    """Test Firm list API"""
    
    def test_platform_owner_can_list_all_firms(self):
        """Test platform owner can list all firms"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        response = self.client.get(self.firm_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
    
    def test_super_admin_can_list_own_firm_only(self):
        """Test super admin can only see their own firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        response = self.client.get(self.firm_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Super admin should only see their firm
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.firm.id))
    
    def test_partner_manager_can_list_firms(self):
        """Test partner manager can list firms"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.partner_token.key}')
        response = self.client.get(self.firm_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_unauthenticated_cannot_list_firms(self):
        """Test unauthenticated user cannot list firms"""
        response = self.client.get(self.firm_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FirmDetailAPITest(FirmAPISetupMixin, TestCase):
    """Test Firm detail API"""
    
    def test_get_firm_details(self):
        """Test getting firm details"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        url = reverse('firm-detail', kwargs={'pk': self.firm.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['firm_name'], "Test Law Firm")
    
    def test_super_admin_can_get_own_firm(self):
        """Test super admin can get their own firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('firm-detail', kwargs={'pk': self.firm.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_super_admin_cannot_get_other_firm(self):
        """Test super admin cannot get other firm"""
        # Create another firm
        other_firm = Firm.objects.create(
            firm_name="Other Law Firm",
            firm_code="OLF001",
            city="Delhi",
            state="Delhi",
            country="India",
            phone_number="+911125551234",
            email="info@otherlaw.com"
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('firm-detail', kwargs={'pk': other_firm.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_nonexistent_firm(self):
        """Test getting nonexistent firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        url = reverse('firm-detail', kwargs={'pk': '00000000-0000-0000-0000-000000000000'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FirmUpdateAPITest(FirmAPISetupMixin, TestCase):
    """Test Firm update API"""
    
    def test_platform_owner_can_update_firm(self):
        """Test platform owner can update firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        url = reverse('firm-detail', kwargs={'pk': self.firm.id})
        data = {
            "firm_name": "Updated Law Firm",
            "subscription_type": "professional"
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['firm_name'], "Updated Law Firm")
        self.assertEqual(response.data['subscription_type'], "professional")
    
    def test_super_admin_can_update_own_firm(self):
        """Test super admin can update their own firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('firm-detail', kwargs={'pk': self.firm.id})
        data = {"subscription_type": "basic"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_super_admin_cannot_update_other_firm(self):
        """Test super admin cannot update other firm"""
        other_firm = Firm.objects.create(
            firm_name="Other Law Firm",
            firm_code="OLF001",
            city="Delhi",
            state="Delhi",
            country="India",
            phone_number="+911125551234",
            email="info@otherlaw.com"
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('firm-detail', kwargs={'pk': other_firm.id})
        data = {"subscription_type": "professional"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_client_cannot_update_firm(self):
        """Test client cannot update firm"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        url = reverse('firm-detail', kwargs={'pk': self.firm.id})
        data = {"subscription_type": "professional"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
