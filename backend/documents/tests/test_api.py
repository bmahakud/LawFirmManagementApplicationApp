from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.core.files.uploadedfile import SimpleUploadedFile
from accounts.models import CustomUser
from firms.models import Firm
from documents.models import UserDocument


class DocumentAPISetupMixin:
    """Mixin to setup common test data for Document API tests"""
    
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
        
        self.document_list_url = reverse('document-list')
    
    def create_test_file(self, filename="test.pdf"):
        """Helper to create test file"""
        return SimpleUploadedFile(
            filename,
            b"file_content",
            content_type="application/pdf"
        )


class DocumentUploadAPITest(DocumentAPISetupMixin, TestCase):
    """Test Document upload API"""
    
    def test_user_can_upload_document(self):
        """Test user can upload their own document"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        
        data = {
            "document_type": "aadhar",
            "document_number": "123456789012",
            "document_file": self.create_test_file()
        }
        
        response = self.client.post(self.document_list_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['document_type'], "aadhar")
        self.assertEqual(response.data['verification_status'], "pending")
    
    def test_upload_document_without_file(self):
        """Test uploading document without file"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        
        data = {
            "document_type": "aadhar",
            "document_number": "123456789012"
            # Missing document_file
        }
        
        response = self.client.post(self.document_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_upload_document_without_type(self):
        """Test uploading document without type"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        
        data = {
            "document_number": "123456789012",
            "document_file": self.create_test_file()
        }
        
        response = self.client.post(self.document_list_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_unauthenticated_cannot_upload_document(self):
        """Test unauthenticated user cannot upload document"""
        data = {
            "document_type": "aadhar",
            "document_number": "123456789012",
            "document_file": self.create_test_file()
        }
        
        response = self.client.post(self.document_list_url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DocumentListAPITest(DocumentAPISetupMixin, TestCase):
    """Test Document list API"""
    
    def test_platform_owner_can_list_all_documents(self):
        """Test platform owner can list all documents"""
        # Create a document first
        UserDocument.objects.create(
            user=self.advocate,
            document_type="pan",
            document_number="ABCDE1234F",
            document_file=self.create_test_file()
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.platform_token.key}')
        response = self.client.get(self.document_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)
    
    def test_super_admin_can_list_firm_documents(self):
        """Test super admin can list documents from their firm only"""
        # Create document for advocate in same firm
        UserDocument.objects.create(
            user=self.advocate,
            document_type="pan",
            document_number="ABCDE1234F",
            document_file=self.create_test_file()
        )
        
        # Create document for client (different firm)
        UserDocument.objects.create(
            user=self.client_user,
            document_type="aadhar",
            document_number="987654321098",
            document_file=self.create_test_file()
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        response = self.client.get(self.document_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see documents from their firm
        self.assertEqual(response.data['count'], 1)
    
    def test_user_can_only_see_own_documents(self):
        """Test user can only see their own documents"""
        # Create document for advocate
        UserDocument.objects.create(
            user=self.advocate,
            document_type="pan",
            document_number="ABCDE1234F",
            document_file=self.create_test_file()
        )
        
        # Client should not see advocate's document
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        response = self.client.get(self.document_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
    
    def test_unauthenticated_cannot_list_documents(self):
        """Test unauthenticated user cannot list documents"""
        response = self.client.get(self.document_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DocumentDetailAPITest(DocumentAPISetupMixin, TestCase):
    """Test Document detail API"""
    
    def test_get_document_details(self):
        """Test getting document details"""
        document = UserDocument.objects.create(
            user=self.advocate,
            document_type="pan",
            document_number="ABCDE1234F",
            document_file=self.create_test_file()
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('document-detail', kwargs={'pk': document.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['document_type'], "pan")
    
    def test_user_cannot_get_other_user_document(self):
        """Test user cannot get other user's document"""
        document = UserDocument.objects.create(
            user=self.advocate,
            document_type="pan",
            document_number="ABCDE1234F",
            document_file=self.create_test_file()
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.client_token.key}')
        url = reverse('document-detail', kwargs={'pk': document.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_nonexistent_document(self):
        """Test getting nonexistent document"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('document-detail', kwargs={'pk': '00000000-0000-0000-0000-000000000000'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DocumentVerificationAPITest(DocumentAPISetupMixin, TestCase):
    """Test Document verification API"""
    
    def test_super_admin_can_verify_document(self):
        """Test super admin can verify documents"""
        document = UserDocument.objects.create(
            user=self.advocate,
            document_type="aadhar",
            document_number="123456789012",
            document_file=self.create_test_file()
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('document-detail', kwargs={'pk': document.id})
        
        data = {
            "verification_status": "verified",
            "verification_notes": "Document verified successfully"
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['verification_status'], "verified")
    
    def test_super_admin_can_reject_document(self):
        """Test super admin can reject documents"""
        document = UserDocument.objects.create(
            user=self.advocate,
            document_type="aadhar",
            document_number="123456789012",
            document_file=self.create_test_file()
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
        url = reverse('document-detail', kwargs={'pk': document.id})
        
        data = {
            "verification_status": "rejected",
            "verification_notes": "Document quality is poor"
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['verification_status'], "rejected")
    
    def test_user_cannot_verify_own_document(self):
        """Test user cannot verify their own document"""
        document = UserDocument.objects.create(
            user=self.advocate,
            document_type="aadhar",
            document_number="123456789012",
            document_file=self.create_test_file()
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.advocate_token.key}')
        url = reverse('document-detail', kwargs={'pk': document.id})
        
        data = {
            "verification_status": "verified",
            "verification_notes": "Self verified"
        }
        
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
