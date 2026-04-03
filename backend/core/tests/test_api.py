from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser, UserInvitation
from firms.models import Firm


class InvitationAPISetupMixin:
    """Mixin to setup common test data for Invitation API tests"""
    
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
        
        self.invitation_list_url = reverse('userinvitation-list')


class InvitationListAPITest(InvitationAPISetupMixin, TestCase):
    """Test Invitation list API"""
    
    def test_platform_owner_can_list_all_invitations(self):
        """Test platform owner can list all invitations"""
        # Create invitation
        UserInvitation.objects.create(
            invited_by=self.platform_owner,
            email="newinvite@example.com",
            phone_number="+919876543214",
            user_type="advocate",
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        response = self.client.get(self.invitation_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
    
    def test_super_admin_can_list_firm_invitations(self):
        """Test super admin can list invitations from their firm only"""
        # Create invitation for their firm
        UserInvitation.objects.create(
            invited_by=self.super_admin,
            email="newinvite@example.com",
            phone_number="+919876543214",
            user_type="advocate",
            firm=self.firm
        )
        
        # Create another firm and invitation
        other_firm = Firm.objects.create(
            firm_name="Other Law Firm",
            firm_code="OLF001",
            city="Delhi",
            state="Delhi",
            country="India",
            phone_number="+911125551234",
            email="info@otherlaw.com"
        )
        
        other_super_admin = CustomUser.objects.create_user(
            username="othersuperadmin@otherlaw.com",
            email="othersuperadmin@otherlaw.com",
            phone_number="+919876543215",
            password="OtherSuperAdminPass@123",
            user_type="super_admin",
            firm=other_firm
        )
        
        UserInvitation.objects.create(
            invited_by=other_super_admin,
            email="otherinvite@example.com",
            phone_number="+919876543216",
            user_type="advocate",
            firm=other_firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        response = self.client.get(self.invitation_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see invitations from their firm
        self.assertEqual(response.data['count'], 1)
    
    def test_unauthenticated_cannot_list_invitations(self):
        """Test unauthenticated user cannot list invitations"""
        response = self.client.get(self.invitation_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class InvitationDetailAPITest(InvitationAPISetupMixin, TestCase):
    """Test Invitation detail API"""
    
    def test_get_invitation_details(self):
        """Test getting invitation details"""
        invitation = UserInvitation.objects.create(
            invited_by=self.super_admin,
            email="newinvite@example.com",
            phone_number="+919876543214",
            user_type="advocate",
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('userinvitation-detail', kwargs={'pk': invitation.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], "newinvite@example.com")
    
    def test_super_admin_cannot_get_other_firm_invitation(self):
        """Test super admin cannot get invitation from other firm"""
        other_firm = Firm.objects.create(
            firm_name="Other Law Firm",
            firm_code="OLF001",
            city="Delhi",
            state="Delhi",
            country="India",
            phone_number="+911125551234",
            email="info@otherlaw.com"
        )
        
        other_super_admin = CustomUser.objects.create_user(
            username="othersuperadmin@otherlaw.com",
            email="othersuperadmin@otherlaw.com",
            phone_number="+919876543215",
            password="OtherSuperAdminPass@123",
            user_type="super_admin",
            firm=other_firm
        )
        
        invitation = UserInvitation.objects.create(
            invited_by=other_super_admin,
            email="otherinvite@example.com",
            phone_number="+919876543216",
            user_type="advocate",
            firm=other_firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('userinvitation-detail', kwargs={'pk': invitation.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_nonexistent_invitation(self):
        """Test getting nonexistent invitation"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('userinvitation-detail', kwargs={'pk': '00000000-0000-0000-0000-000000000000'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class InvitationStatusAPITest(InvitationAPISetupMixin, TestCase):
    """Test Invitation status update API"""
    
    def test_update_invitation_status_to_accepted(self):
        """Test updating invitation status to accepted"""
        invitation = UserInvitation.objects.create(
            invited_by=self.super_admin,
            email="newinvite@example.com",
            phone_number="+919876543214",
            user_type="advocate",
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        url = reverse('userinvitation-detail', kwargs={'pk': invitation.id})
        
        data = {"status": "accepted"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], "accepted")
    
    def test_update_invitation_status_to_rejected(self):
        """Test updating invitation status to rejected"""
        invitation = UserInvitation.objects.create(
            invited_by=self.super_admin,
            email="newinvite@example.com",
            phone_number="+919876543214",
            user_type="advocate",
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        url = reverse('userinvitation-detail', kwargs={'pk': invitation.id})
        
        data = {"status": "rejected"}
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], "rejected")
