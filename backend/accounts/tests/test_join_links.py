from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser, FirmJoinLink
from firms.models import Firm

class JoinLinkAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.firm = Firm.objects.create(firm_name="Law Firm X", firm_code="LFX")
        
        self.admin = CustomUser.objects.create_user(
            username="admin@lfx.com", email="admin@lfx.com", 
            password="password", phone_number="+916666666666",
            user_type="super_admin", firm=self.firm
        )
        self.token = Token.objects.create(user=self.admin)
        
        # Public join link
        self.link = FirmJoinLink.objects.create(
            firm=self.firm, 
            user_type='client',
            is_active=True,
            created_by=self.admin
        )

    def test_admin_create_join_link(self):
        """Test admin creating a generic join link"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        url = reverse('firmjoinlink-list')
        data = {
            "firm": self.firm.id,
            "user_type": "advocate",
            "is_active": True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_public_join_via_link(self):
        """Test a new user joining a firm using a public link"""
        url = reverse('firmjoinlink-join', kwargs={'pk': self.link.id})
        data = {
            "email": "newuser@gmail.com",
            "password": "Password@123",
            "first_name": "New",
            "last_name": "User",
            "phone_number": "+917777777777"
        }
        # No credentials needed for public join
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        
        # Verify user created and assigned to firm
        user = CustomUser.objects.get(email="newuser@gmail.com")
        self.assertEqual(user.firm, self.firm)
        self.assertEqual(user.user_type, 'client')
