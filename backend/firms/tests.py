from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import CustomUser
from firms.models import Firm, Branch

class FirmManagementTests(APITestCase):
    def setUp(self):
        self.platform_owner = CustomUser.objects.create_user(
            username="owner", email="owner@test.com", password="password123",
            user_type="platform_owner", phone_number="+911111111111"
        )
        self.firm = Firm.objects.create(
            firm_name="Alpha Legal", firm_code="ALPHA", 
            email="info@alpha.com", phone_number="1234567890"
        )
        self.super_admin = CustomUser.objects.create_user(
            username="firm_owner", email="admin@alpha.com", password="password123",
            user_type="super_admin", firm=self.firm, phone_number="+912222222222"
        )
        
        self.firm_url = reverse('firm-detail', kwargs={'pk': self.firm.id})
        self.branch_url = reverse('branch-list')

    def test_firm_details_show_super_admin(self):
        self.client.force_authenticate(user=self.platform_owner)
        response = self.client.get(self.firm_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if super_admin_details is present
        self.assertIn("super_admin_details", response.data)
        self.assertEqual(response.data['super_admin_details']['email'], "admin@alpha.com")

    def test_super_admin_can_update_firm(self):
        self.client.force_authenticate(user=self.super_admin)
        data = {"firm_name": "Alpha Legal Updated"}
        response = self.client.patch(self.firm_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Firm.objects.get(id=self.firm.id).firm_name, "Alpha Legal Updated")

    def test_branch_admin_details_lookup(self):
        branch = Branch.objects.create(firm=self.firm, branch_name="Main Branch")
        branch_admin = CustomUser.objects.create_user(
            username="b_admin", email="b@admin.com", password="password123",
            user_type="admin", firm=self.firm, phone_number="+913333333333"
        )
        from accounts.models import UserFirmRole
        UserFirmRole.objects.update_or_create(
            user=branch_admin, firm=self.firm,
            defaults={'branch': branch, 'user_type': 'admin'}
        )
        branch_admin.refresh_from_db()
        
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(reverse('branch-detail', kwargs={'pk': branch.id}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("admin_details", response.data)
        self.assertEqual(response.data['admin_details']['email'], "b@admin.com")

    def test_manual_suspension_blocks_other_api(self):
        # 1. Verify access works initially
        self.client.force_authenticate(user=self.super_admin)
        self.assertEqual(self.client.get(reverse('firm-list')).status_code, status.HTTP_200_OK)
        
        # 2. Suspend Firm
        self.firm.is_active = False
        self.firm.save()
        self.super_admin.refresh_from_db()
        
        # 3. Verify access is blocked for any restricted API (e.g. branch creation)
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.post(self.branch_url, {"branch_name": "New", "firm": self.firm.id, "city": "X", "state": "Y"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
