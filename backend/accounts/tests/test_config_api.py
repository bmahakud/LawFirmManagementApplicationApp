from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser, GlobalConfiguration

class GlobalConfigAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Platform Owner
        self.owner = CustomUser.objects.create_user(
            username="owner@platform.com", email="owner@platform.com", 
            password="password", phone_number="+914444444444",
            user_type="platform_owner"
        )
        self.owner_token = Token.objects.create(user=self.owner)
        
        # Regular Admin
        self.admin = CustomUser.objects.create_user(
            username="admin@firm.com", email="admin@firm.com", 
            password="password", phone_number="+915555555555",
            user_type="super_admin"
        )
        self.admin_token = Token.objects.create(user=self.admin)
        
        self.config_url = reverse('globalconfig-settings')
        self.update_url = reverse('globalconfig-update_settings')

    def test_owner_can_get_settings(self):
        """Test platform owner can access settings API"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        response = self.client.get(self.config_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('trial_period_days', response.data)

    def test_admin_cannot_get_settings(self):
        """Test regular admin is forbidden from settings API"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token.key}')
        response = self.client.get(self.config_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_update_settings(self):
        """Test platform owner can update settings"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        data = {"trial_period_days": 30}
        response = self.client.patch(self.update_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        config = GlobalConfiguration.get_settings()
        self.assertEqual(config.trial_period_days, 30)
