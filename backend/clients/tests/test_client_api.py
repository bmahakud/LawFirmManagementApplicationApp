from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from firms.models import Firm
from clients.models import Client

class ClientAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.firm = Firm.objects.create(firm_name="Test Firm", firm_code="TF001")
        
        # Super Admin
        self.admin = CustomUser.objects.create_user(
            username="admin@test.com", email="admin@test.com", 
            password="password", phone_number="+911111111111",
            user_type="super_admin", firm=self.firm
        )
        self.admin_token = Token.objects.create(user=self.admin)
        
        # Advocate
        self.advocate = CustomUser.objects.create_user(
            username="adv@test.com", email="adv@test.com", 
            password="password", phone_number="+912222222222",
            user_type="advocate", firm=self.firm
        )
        
        self.client_list_url = reverse('client-list')

    def test_admin_create_client_success(self):
        """Test admin can create a client and auto-assign an advocate"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        data = {
            "name": "Jane Doe",
            "email": "jane@example.com",
            "phone_number": "+919998887776",
            "assigned_advocate": self.advocate.id,
            "brief_summary": "Divorce case"
        }
        response = self.client.post(self.client_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Client.objects.count(), 1)
        
        client = Client.objects.first()
        self.assertEqual(client.assigned_advocate, self.advocate)

    def test_list_clients(self):
        """Test listing clients for a firm"""
        Client.objects.create(name="Client 1", firm=self.firm, email="c1@test.com")
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get(self.client_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
