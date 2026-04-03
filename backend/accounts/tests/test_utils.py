"""
Utility functions and helpers for testing
"""
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from firms.models import Firm
from django.core.files.uploadedfile import SimpleUploadedFile


class TestDataFactory:
    """Factory for creating test data"""
    
    @staticmethod
    def create_firm(
        firm_name="Test Law Firm",
        firm_code="TLF001",
        city="Mumbai",
        state="Maharashtra",
        country="India",
        phone_number="+912225551234",
        email="info@testlaw.com"
    ):
        """Create a test firm"""
        return Firm.objects.create(
            firm_name=firm_name,
            firm_code=firm_code,
            city=city,
            state=state,
            country=country,
            phone_number=phone_number,
            email=email
        )
    
    @staticmethod
    def create_user(
        username="testuser@example.com",
        email="testuser@example.com",
        phone_number="+919876543210",
        password="TestPass@123",
        user_type="client",
        firm=None,
        first_name="Test",
        last_name="User"
    ):
        """Create a test user"""
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            phone_number=phone_number,
            password=password,
            user_type=user_type,
            firm=firm,
            first_name=first_name,
            last_name=last_name
        )
        return user
    
    @staticmethod
    def create_user_with_token(
        username="testuser@example.com",
        email="testuser@example.com",
        phone_number="+919876543210",
        password="TestPass@123",
        user_type="client",
        firm=None
    ):
        """Create a test user with authentication token"""
        user = TestDataFactory.create_user(
            username=username,
            email=email,
            phone_number=phone_number,
            password=password,
            user_type=user_type,
            firm=firm
        )
        token = Token.objects.create(user=user)
        return user, token
    
    @staticmethod
    def create_platform_owner():
        """Create a platform owner user"""
        return TestDataFactory.create_user(
            username="platform@example.com",
            email="platform@example.com",
            phone_number="+919876543210",
            user_type="platform_owner"
        )
    
    @staticmethod
    def create_super_admin(firm):
        """Create a super admin user"""
        return TestDataFactory.create_user(
            username="superadmin@example.com",
            email="superadmin@example.com",
            phone_number="+919876543211",
            user_type="super_admin",
            firm=firm
        )
    
    @staticmethod
    def create_advocate(firm):
        """Create an advocate user"""
        return TestDataFactory.create_user(
            username="advocate@example.com",
            email="advocate@example.com",
            phone_number="+919876543212",
            user_type="advocate",
            firm=firm
        )
    
    @staticmethod
    def create_paralegal(firm):
        """Create a paralegal user"""
        return TestDataFactory.create_user(
            username="paralegal@example.com",
            email="paralegal@example.com",
            phone_number="+919876543213",
            user_type="paralegal",
            firm=firm
        )
    
    @staticmethod
    def create_client():
        """Create a client user"""
        return TestDataFactory.create_user(
            username="client@example.com",
            email="client@example.com",
            phone_number="+919876543214",
            user_type="client"
        )
    
    @staticmethod
    def create_test_file(filename="test.pdf", content=b"file_content"):
        """Create a test file"""
        return SimpleUploadedFile(
            filename,
            content,
            content_type="application/pdf"
        )


class APITestHelper:
    """Helper methods for API testing"""
    
    @staticmethod
    def get_auth_header(token):
        """Get authorization header for token"""
        return f'Token {token.key}'
    
    @staticmethod
    def assert_permission_denied(response):
        """Assert that response is permission denied"""
        from rest_framework import status
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    @staticmethod
    def assert_unauthorized(response):
        """Assert that response is unauthorized"""
        from rest_framework import status
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    @staticmethod
    def assert_not_found(response):
        """Assert that response is not found"""
        from rest_framework import status
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    @staticmethod
    def assert_bad_request(response):
        """Assert that response is bad request"""
        from rest_framework import status
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    @staticmethod
    def assert_success(response):
        """Assert that response is successful"""
        from rest_framework import status
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_204_NO_CONTENT
        ]


class TestDataCleaner:
    """Helper for cleaning up test data"""
    
    @staticmethod
    def cleanup_all():
        """Clean up all test data"""
        CustomUser.objects.all().delete()
        Firm.objects.all().delete()
        Token.objects.all().delete()
