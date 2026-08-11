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


class ForgotPasswordAPITests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="forgot_test@example.com",
            email="forgot_test@example.com",
            phone_number="9876543210",
            password="OldPassword123!",
            user_type="client"
        )
        self.lookup_url = reverse('auth-forgot_password_lookup')
        self.request_otp_url = reverse('auth-forgot_password_request_otp')
        self.verify_otp_url = reverse('auth-forgot_password_verify_otp')
        self.reset_url = reverse('auth-forgot_password_reset')
        self.login_url = reverse('auth-login_username_password')

    def test_full_forgot_password_flow(self):
        # 1. Lookup
        res_lookup = self.client.post(self.lookup_url, {"identifier": "forgot_test@example.com"})
        self.assertEqual(res_lookup.status_code, status.HTTP_200_OK)
        self.assertTrue(res_lookup.data['found'])

        # 2. Request OTP
        res_otp = self.client.post(self.request_otp_url, {"identifier": "forgot_test@example.com", "channel": "email"})
        self.assertEqual(res_otp.status_code, status.HTTP_200_OK)

        # 3. Verify OTP (Test code 999999)
        res_verify = self.client.post(self.verify_otp_url, {
            "identifier": "forgot_test@example.com",
            "channel": "email",
            "otp_code": "999999"
        })
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.assertIn('reset_token', res_verify.data)
        reset_token = res_verify.data['reset_token']

        # 4. Reset Password
        res_reset = self.client.post(self.reset_url, {
            "identifier": "forgot_test@example.com",
            "reset_token": reset_token,
            "new_password": "NewSecretPassword123!",
            "new_password_confirm": "NewSecretPassword123!"
        })
        self.assertEqual(res_reset.status_code, status.HTTP_200_OK)

        # 5. Login with new password
        res_login = self.client.post(self.login_url, {
            "username": "forgot_test@example.com",
            "password": "NewSecretPassword123!"
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('token', res_login.data)

