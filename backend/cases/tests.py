from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import CustomUser
from firms.models import Firm, Branch
from clients.models import Client
from cases.models import Case

class CaseManagementTests(APITestCase):
    def setUp(self):
        # 1. Setup Firm and Branch
        self.firm = Firm.objects.create(firm_name="Test Law Firm", firm_code="TLF001")
        self.branch_a = Branch.objects.create(firm=self.firm, branch_name="Branch A")
        self.branch_b = Branch.objects.create(firm=self.firm, branch_name="Branch B")
        
        # 2. Setup Workers
        self.super_admin = CustomUser.objects.create_user(
            username="superadmin", email="super@test.com", password="password123",
            user_type="super_admin", firm=self.firm, phone_number="+910000000001"
        )
        self.branch_admin = CustomUser.objects.create_user(
            username="admin_a", email="admin_a@test.com", password="password123",
            user_type="admin", firm=self.firm, phone_number="+910000000002"
        )
        # Link admin to branch A via UserFirmRole
        from accounts.models import UserFirmRole
        UserFirmRole.objects.update_or_create(
            user=self.branch_admin, firm=self.firm,
            defaults={'branch': self.branch_a, 'user_type': 'admin'}
        )
        self.branch_admin.refresh_from_db()
        
        self.advocate = CustomUser.objects.create_user(
            username="advocate1", email="adv1@test.com", password="password123",
            user_type="advocate", firm=self.firm, phone_number="+910000000003"
        )
        
        # 3. Setup Client
        self.client_record = Client.objects.create(
            firm=self.firm, first_name="John", last_name="Doe", email="john@client.com"
        )
        
        self.case_url = reverse('case-list')

    def test_super_admin_can_create_case_in_any_branch(self):
        self.client.force_authenticate(user=self.super_admin)
        data = {
            "case_title": "Super Admin Case",
            "case_type": "Civil",
            "category": "court_case",
            "client": str(self.client_record.id),
            "branch": str(self.branch_b.id),
            "assigned_advocate": str(self.advocate.id)
        }
        response = self.client.post(self.case_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Case.objects.get(id=response.data['id']).branch, self.branch_b)

    def test_admin_is_pinned_to_their_branch(self):
        self.client.force_authenticate(user=self.branch_admin)
        data = {
            "case_title": "Admin Pinned Case",
            "case_type": "Criminal",
            "category": "pre_litigation",
            "client": str(self.client_record.id),
            "assigned_advocate": str(self.advocate.id),
            "branch": str(self.branch_b.id) # Attempting to use Branch B
        }
        response = self.client.post(self.case_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify it was forced to Branch A (the admin's branch)
        self.assertEqual(Case.objects.get(id=response.data['id']).branch, self.branch_a)

    def test_advocate_assignment_validation(self):
        # Create an advocate from a DIFFERENT firm
        other_firm = Firm.objects.create(firm_name="Other Firm", firm_code="OTH001")
        wrong_advocate = CustomUser.objects.create_user(
            username="wrong_adv", email="wrong@test.com", password="password123",
            user_type="advocate", firm=other_firm, phone_number="+919999999999"
        )
        
        self.client.force_authenticate(user=self.super_admin)
        data = {
            "case_title": "Validation Case",
            "case_type": "Civil",
            "category": "court_case",
            "client": str(self.client_record.id),
            "assigned_advocate": str(wrong_advocate.id)
        }
        response = self.client.post(self.case_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("assigned_advocate", response.data)

    def test_pre_litigation_filtering(self):
        # Create one pre-litigation and one court case
        Case.objects.create(
            firm=self.firm, client=self.client_record, case_title="Pre Case", 
            category="pre_litigation", case_type="Civil"
        )
        Case.objects.create(
            firm=self.firm, client=self.client_record, case_title="Court Case", 
            category="court_case", case_type="Civil"
        )
        
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(self.case_url, {'category': 'pre_litigation'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return 1 case
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['case_title'], "Pre Case")

    def test_subscription_suspension_blocks_access(self):
        # Suspend the firm
        self.firm.is_active = False
        self.firm.save()
        
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(self.case_url)
        # Should be forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("subscription", response.data['detail'].lower())
