"""
Test suite for Service Tracking feature (Phase 1 of Case Lifecycle)
"""
import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from firms.models import Firm
from clients.models import Client
from cases.models import Case
from cases.models_service import ServiceAttempt

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def firm():
    return Firm.objects.create(
        firm_name="Test Law Firm",
        firm_code="TEST001",
        email="firm@test.com",
        phone_number="1234567890",
        city="Delhi",
        state="Delhi"
    )


@pytest.fixture
def advocate(firm):
    user = User.objects.create_user(
        username="advocate_test",
        email="advocate@test.com",
        password="testpass123",
        first_name="Test",
        last_name="Advocate",
        user_type="advocate",
        phone_number="+911234567890",
        firm=firm
    )
    return user


@pytest.fixture
def client_user(firm):
    user = User.objects.create_user(
        username="client_test",
        email="client@test.com",
        password="testpass123",
        first_name="Test",
        last_name="Client",
        user_type="client",
        phone_number="+919876543210"
    )
    client = Client.objects.create(
        user_account=user,
        firm=firm,
        first_name="Test",
        last_name="Client",
        email="client@test.com",
        phone_number="9876543210"
    )
    return user


@pytest.fixture
def case(firm, advocate, client_user):
    client = client_user.client_profile
    return Case.objects.create(
        firm=firm,
        client=client,
        assigned_advocate=advocate,
        case_title="Test Case",
        case_number="CC/123/2024",
        case_type="Civil",
        status="filed",
        stage="case_filing",
        petitioner_name="John Doe",
        respondent_name="Jane Smith",
        court_name="District Court",
        district="Delhi",
        state="Delhi"
    )


@pytest.mark.django_db
class TestServiceAttemptModel:
    """Test ServiceAttempt model"""
    
    def test_create_service_attempt(self, case, advocate):
        """Test creating a service attempt"""
        service = ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='registered_post',
            address="123 Test Street, Delhi",
            status='pending',
            created_by=advocate
        )
        
        assert service.id is not None
        assert service.case == case
        assert service.status == 'pending'
        assert str(service) == f"Summons - {case.case_number} - Pending"
    
    def test_service_attempt_auto_creates_activity(self, case, advocate):
        """Test that creating service attempt auto-creates case activity"""
        service = ServiceAttempt.objects.create(
            case=case,
            service_type='notice',
            service_date=timezone.now().date(),
            service_method='personal',
            address="456 Test Avenue",
            status='pending',
            created_by=advocate
        )
        
        # Check that activity was created
        activities = case.activities.filter(activity_type='service_attempt_created')
        assert activities.exists()
        latest_activity = activities.first()
        assert 'Notice' in latest_activity.description
        assert 'Personal Service' in latest_activity.description
    
    def test_successful_service_updates_case_stage(self, case, advocate):
        """Test that successful service updates case stage"""
        service = ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='personal',
            served_to="Jane Smith",
            address="789 Test Road",
            status='served',
            created_by=advocate
        )
        
        case.refresh_from_db()
        assert case.stage == 'hearing'


@pytest.mark.django_db
class TestServiceAttemptAPI:
    """Test Service Attempt API endpoints"""
    
    def test_create_service_attempt(self, api_client, advocate, case):
        """Test POST /api/cases/service-attempts/"""
        api_client.force_authenticate(user=advocate)
        
        data = {
            'case': str(case.id),
            'service_type': 'summons',
            'service_date': timezone.now().date().isoformat(),
            'service_method': 'registered_post',
            'address': '123 Test Street, Delhi',
            'status': 'pending',
            'remarks': 'First attempt'
        }
        
        response = api_client.post('/api/cases/service-attempts/', data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['service_type'] == 'summons'
        assert response.data['status'] == 'pending'
        assert ServiceAttempt.objects.filter(case=case).count() == 1
    
    def test_list_service_attempts(self, api_client, advocate, case):
        """Test GET /api/cases/service-attempts/"""
        api_client.force_authenticate(user=advocate)
        
        # Create multiple service attempts
        ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='personal',
            address="Address 1",
            status='pending',
            created_by=advocate
        )
        ServiceAttempt.objects.create(
            case=case,
            service_type='notice',
            service_date=timezone.now().date() - timedelta(days=1),
            service_method='registered_post',
            address="Address 2",
            status='served',
            served_to="John Doe",
            created_by=advocate
        )
        
        response = api_client.get('/api/cases/service-attempts/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
    
    def test_get_service_attempts_by_case(self, api_client, advocate, case):
        """Test GET /api/cases/service-attempts/by-case/?case_id=<uuid>"""
        api_client.force_authenticate(user=advocate)
        
        # Create service attempts
        ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='personal',
            address="Address 1",
            status='pending',
            created_by=advocate
        )
        
        response = api_client.get(f'/api/cases/service-attempts/by-case/?case_id={case.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['case_number'] == case.case_number
        assert response.data['total_attempts'] == 1
        assert len(response.data['service_attempts']) == 1
    
    def test_get_pending_service_attempts(self, api_client, advocate, case):
        """Test GET /api/cases/service-attempts/pending/"""
        api_client.force_authenticate(user=advocate)
        
        # Create pending attempt
        ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='personal',
            address="Address 1",
            status='pending',
            created_by=advocate
        )
        
        # Create served attempt (should not appear in pending)
        ServiceAttempt.objects.create(
            case=case,
            service_type='notice',
            service_date=timezone.now().date(),
            service_method='personal',
            address="Address 2",
            status='served',
            served_to="John Doe",
            created_by=advocate
        )
        
        response = api_client.get('/api/cases/service-attempts/pending/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['pending_attempts'][0]['status'] == 'pending'
    
    def test_update_service_attempt(self, api_client, advocate, case):
        """Test PATCH /api/cases/service-attempts/{id}/"""
        api_client.force_authenticate(user=advocate)
        
        service = ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='personal',
            address="Address 1",
            status='pending',
            created_by=advocate
        )
        
        update_data = {
            'status': 'served',
            'served_to': 'Jane Smith',
            'remarks': 'Successfully served'
        }
        
        response = api_client.patch(
            f'/api/cases/service-attempts/{service.id}/',
            update_data,
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'served'
        assert response.data['served_to'] == 'Jane Smith'
    
    def test_get_service_statistics(self, api_client, advocate, case):
        """Test GET /api/cases/service-attempts/statistics/"""
        api_client.force_authenticate(user=advocate)
        
        # Create various service attempts
        ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='personal',
            address="Address 1",
            status='served',
            served_to="Person 1",
            created_by=advocate
        )
        ServiceAttempt.objects.create(
            case=case,
            service_type='notice',
            service_date=timezone.now().date(),
            service_method='registered_post',
            address="Address 2",
            status='pending',
            created_by=advocate
        )
        ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='courier',
            address="Address 3",
            status='unserved',
            next_attempt_date=timezone.now().date() + timedelta(days=7),
            created_by=advocate
        )
        
        response = api_client.get('/api/cases/service-attempts/statistics/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_attempts'] == 3
        assert response.data['served'] == 1
        assert response.data['pending'] == 1
        assert response.data['unserved'] == 1
        assert response.data['success_rate'] == 33.33
    
    def test_validation_served_requires_served_to(self, api_client, advocate, case):
        """Test that status='served' requires served_to field"""
        api_client.force_authenticate(user=advocate)
        
        data = {
            'case': str(case.id),
            'service_type': 'summons',
            'service_date': timezone.now().date().isoformat(),
            'service_method': 'personal',
            'address': '123 Test Street',
            'status': 'served',
            # Missing 'served_to'
        }
        
        response = api_client.post('/api/cases/service-attempts/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'served_to' in response.data
    
    def test_validation_unserved_requires_next_attempt_date(self, api_client, advocate, case):
        """Test that status='unserved' requires next_attempt_date"""
        api_client.force_authenticate(user=advocate)
        
        data = {
            'case': str(case.id),
            'service_type': 'summons',
            'service_date': timezone.now().date().isoformat(),
            'service_method': 'registered_post',
            'address': '123 Test Street',
            'status': 'unserved',
            # Missing 'next_attempt_date'
        }
        
        response = api_client.post('/api/cases/service-attempts/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'next_attempt_date' in response.data


@pytest.mark.django_db
class TestServiceAttemptPermissions:
    """Test permissions for service attempts"""
    
    def test_client_can_view_their_case_service_attempts(self, api_client, client_user, case):
        """Test that clients can view service attempts for their cases"""
        api_client.force_authenticate(user=client_user)
        
        ServiceAttempt.objects.create(
            case=case,
            service_type='summons',
            service_date=timezone.now().date(),
            service_method='personal',
            address="Address 1",
            status='pending',
            created_by=case.assigned_advocate
        )
        
        response = api_client.get(f'/api/cases/service-attempts/by-case/?case_id={case.id}')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_attempts'] == 1
    
    def test_unauthenticated_cannot_access(self, api_client, case):
        """Test that unauthenticated users cannot access service attempts"""
        response = api_client.get('/api/cases/service-attempts/')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
