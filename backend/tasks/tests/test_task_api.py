from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from accounts.models import CustomUser
from firms.models import Firm
from tasks.models import Task

class TaskAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.firm = Firm.objects.create(firm_name="Test Firm", firm_code="TF102")
        
        self.user = CustomUser.objects.create_user(
            username="user@test.com", email="user@test.com", 
            password="password", phone_number="+913333333333",
            user_type="advocate", firm=self.firm
        )
        self.token = Token.objects.create(user=self.user)
        self.task_list_url = reverse('task-list')

    def test_create_task(self):
        """Test creating a task"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        data = {
            "title": "Finish Draft",
            "description": "Complete the legal draft for Case A",
            "priority": "high",
            "due_date": "2024-12-31T23:59:59Z",
            "assigned_to": self.user.id
        }
        response = self.client.post(self.task_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)

    def test_get_my_tasks(self):
        """Test retrieving tasks assigned to me"""
        Task.objects.create(
            title="Task 1", 
            firm=self.firm, 
            assigned_to=self.user,
            created_by=self.user
        )
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        response = self.client.get(self.task_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming queryset filters by firm/user
        self.assertGreaterEqual(len(response.data['results']), 1)
