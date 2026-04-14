from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import CustomUser, FirmJoinLink
from firms.models import Firm

class AccountJoinLinkTests(APITestCase):
    def setUp(self):
        self.firm = Firm.objects.create(firm_name="Join Test Firm", firm_code="JOINTEST")
        self.super_admin = CustomUser.objects.create_user(
            username="super", email="super@jointest.com", password="password123",
            user_type="super_admin", firm=self.firm, phone_number="+914444444444"
        )
        self.join_link_url = reverse('firmjoinlink-list')

    def test_create_join_link(self):
        self.client.force_authenticate(user=self.super_admin)
        data = {
            "firm": str(self.firm.id),
            "user_type": "advocate",
            "max_uses": 5
        }
        response = self.client.post(self.join_link_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FirmJoinLink.objects.count(), 1)

    def test_use_join_link_public(self):
        # Create a link
        link = FirmJoinLink.objects.create(
            firm=self.firm, user_type='advocate', created_by=self.super_admin
        )
        use_url = reverse('firmjoinlink-join', kwargs={'pk': link.id})
        
        # Public data for registration
        data = {
            "email": "new_adv@test.com",
            "phone_number": "+919988776655",
            "first_name": "New",
            "last_name": "Advocate",
            "password": "strongpassword123"
        }
        
        # POST to public link (No auth required)
        response = self.client.post(use_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user created and linked to firm
        new_user = CustomUser.objects.get(email="new_adv@test.com")
        self.assertEqual(new_user.firm, self.firm)
        self.assertEqual(new_user.user_type, 'advocate')
