from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from firms.models import Firm
from audit.models import AuditLog


class AuditLogAPISetupMixin:
    """Mixin to setup common test data for Audit Log API tests"""
    
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
        
        self.audit_log_list_url = reverse('auditlog-list')


class AuditLogListAPITest(AuditLogAPISetupMixin, TestCase):
    """Test Audit Log list API"""
    
    def test_platform_owner_can_list_all_audit_logs(self):
        """Test platform owner can list all audit logs"""
        # Create audit logs
        AuditLog.objects.create(
            user=self.advocate,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        response = self.client.get(self.audit_log_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
    
    def test_super_admin_can_list_firm_audit_logs(self):
        """Test super admin can list audit logs from their firm only"""
        # Create audit log for advocate in same firm
        AuditLog.objects.create(
            user=self.advocate,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        # Create audit log for client (different firm)
        AuditLog.objects.create(
            user=self.client_user,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.client_user.id),
            firm=None
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        response = self.client.get(self.audit_log_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see audit logs from their firm
        self.assertEqual(response.data['count'], 1)
    
    def test_advocate_can_list_own_audit_logs(self):
        """Test advocate can only see their own audit logs"""
        # Create audit log for advocate
        AuditLog.objects.create(
            user=self.advocate,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        # Create audit log for super admin
        AuditLog.objects.create(
            user=self.super_admin,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.super_admin.id),
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        response = self.client.get(self.audit_log_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see their own audit logs
        self.assertEqual(response.data['count'], 1)
    
    def test_unauthenticated_cannot_list_audit_logs(self):
        """Test unauthenticated user cannot list audit logs"""
        response = self.client.get(self.audit_log_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuditLogDetailAPITest(AuditLogAPISetupMixin, TestCase):
    """Test Audit Log detail API"""
    
    def test_get_audit_log_details(self):
        """Test getting audit log details"""
        audit_log = AuditLog.objects.create(
            user=self.advocate,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('auditlog-detail', kwargs={'pk': audit_log.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['action'], "LOGIN")
    
    def test_user_cannot_get_other_user_audit_log(self):
        """Test user cannot get other user's audit log"""
        audit_log = AuditLog.objects.create(
            user=self.advocate,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        url = reverse('auditlog-detail', kwargs={'pk': audit_log.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_nonexistent_audit_log(self):
        """Test getting nonexistent audit log"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('auditlog-detail', kwargs={'pk': '00000000-0000-0000-0000-000000000000'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AuditLogFilterAPITest(AuditLogAPISetupMixin, TestCase):
    """Test Audit Log filtering API"""
    
    def test_filter_audit_logs_by_action(self):
        """Test filtering audit logs by action"""
        AuditLog.objects.create(
            user=self.advocate,
            action="LOGIN",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        AuditLog.objects.create(
            user=self.advocate,
            action="LOGOUT",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        response = self.client.get(self.audit_log_list_url, {'action': 'LOGIN'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
    
    def test_filter_audit_logs_by_resource_type(self):
        """Test filtering audit logs by resource type"""
        AuditLog.objects.create(
            user=self.advocate,
            action="CREATE",
            resource_type="user",
            resource_id=str(self.advocate.id),
            firm=self.firm
        )
        
        AuditLog.objects.create(
            user=self.advocate,
            action="UPDATE",
            resource_type="firm",
            resource_id=str(self.firm.id),
            firm=self.firm
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        response = self.client.get(self.audit_log_list_url, {'resource_type': 'user'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
