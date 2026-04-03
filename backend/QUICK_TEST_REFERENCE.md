# Quick Test Reference

## Quick Commands

### Run All Tests
```bash
python manage.py test
```

### Run Tests by App
```bash
python manage.py test accounts          # Authentication & User tests
python manage.py test firms             # Firm management tests
python manage.py test documents         # Document management tests
python manage.py test audit             # Audit log tests
python manage.py test core              # Invitation tests
```

### Run Specific Test Module
```bash
python manage.py test accounts.tests.test_auth_api
python manage.py test accounts.tests.test_user_api
python manage.py test firms.tests.test_api
python manage.py test firms.tests.test_models
python manage.py test documents.tests.test_api
python manage.py test audit.tests.test_api
python manage.py test core.tests.test_api
```

### Run Specific Test Class
```bash
python manage.py test accounts.tests.test_auth_api.UserRegistrationAPITest
python manage.py test firms.tests.test_api.FirmCreateAPITest
python manage.py test documents.tests.test_api.DocumentUploadAPITest
```

### Run Specific Test Method
```bash
python manage.py test accounts.tests.test_auth_api.UserRegistrationAPITest.test_client_registration_success
python manage.py test firms.tests.test_api.FirmCreateAPITest.test_platform_owner_can_create_firm
```

### Run with Verbose Output
```bash
python manage.py test --verbosity=2
```

### Run with Coverage Report
```bash
coverage run --source='.' manage.py test
coverage report
coverage html
open htmlcov/index.html
```

### Run Tests in Parallel
```bash
python manage.py test --parallel
```

### Keep Test Database Between Runs
```bash
python manage.py test --keepdb
```

## Test Organization

```
accounts/tests/
├── __init__.py
├── test_auth_api.py      # 20 tests - Authentication
├── test_user_api.py      # 19 tests - User Management
├── test_models.py        # Existing user model tests
└── test_utils.py         # Test utilities and factories

firms/tests/
├── __init__.py
├── test_api.py           # 15 tests - Firm Management
└── test_models.py        # 5 tests - Firm Model

documents/tests/
├── __init__.py
└── test_api.py           # 11 tests - Document Management

audit/tests/
├── __init__.py
└── test_api.py           # 5 tests - Audit Logging

core/tests/
├── __init__.py
└── test_api.py           # 5 tests - Invitations
```

## Test Statistics

| Module | Tests | Coverage |
|--------|-------|----------|
| Authentication | 20 | Login, OTP, Password |
| User Management | 19 | CRUD, Permissions |
| Firm Management | 15 | CRUD, Permissions |
| Document Management | 11 | Upload, Verify |
| Audit Logging | 5 | List, Filter |
| Invitations | 5 | CRUD, Status |
| **Total** | **75+** | **Comprehensive** |

## Common Test Patterns

### Test Successful Operation
```python
def test_operation_success(self):
    self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
```

### Test Permission Denied
```python
def test_operation_forbidden(self):
    self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.other_token.key}')
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

### Test Unauthenticated Access
```python
def test_operation_unauthenticated(self):
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

## Test Data Setup

Each test module includes a setup mixin that creates:
- Test users (platform owner, super admin, advocate, client)
- Test firm
- Authentication tokens
- Test files (for document tests)

Example:
```python
class FirmAPISetupMixin:
    def setUp(self):
        self.platform_owner = CustomUser.objects.create_user(...)
        self.firm = Firm.objects.create(...)
        self.platform_token = Token.objects.create(user=self.platform_owner)
```

## Debugging Tips

### Print Response Data
```python
print(response.data)
print(response.status_code)
```

### Use Python Debugger
```python
import pdb; pdb.set_trace()
```

### Run Single Test with Debugging
```bash
python manage.py test accounts.tests.test_auth_api.UserRegistrationAPITest.test_client_registration_success --verbosity=2
```

### Check Test Database
```bash
python manage.py test --keepdb --verbosity=2
```

## Permission Levels Tested

| User Type | Can Create Firm | Can List All Users | Can Verify Documents |
|-----------|-----------------|-------------------|----------------------|
| Platform Owner | ✓ | ✓ | ✓ |
| Partner Manager | ✓ | ✗ | ✗ |
| Super Admin | ✗ | Firm Only | ✓ |
| Admin | ✗ | Firm Only | ✓ |
| Advocate | ✗ | Firm Only | ✗ |
| Paralegal | ✗ | Firm Only | ✗ |
| Client | ✗ | Self Only | ✗ |

## Test Utilities

### TestDataFactory
```python
from accounts.tests.test_utils import TestDataFactory

# Create test data
firm = TestDataFactory.create_firm()
user = TestDataFactory.create_user()
user, token = TestDataFactory.create_user_with_token()
platform_owner = TestDataFactory.create_platform_owner()
super_admin = TestDataFactory.create_super_admin(firm)
advocate = TestDataFactory.create_advocate(firm)
client = TestDataFactory.create_client()
test_file = TestDataFactory.create_test_file()
```

### APITestHelper
```python
from accounts.tests.test_utils import APITestHelper

# Use helper methods
header = APITestHelper.get_auth_header(token)
APITestHelper.assert_permission_denied(response)
APITestHelper.assert_unauthorized(response)
APITestHelper.assert_not_found(response)
APITestHelper.assert_bad_request(response)
APITestHelper.assert_success(response)
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: python manage.py test --no-input --verbosity=2

- name: Generate Coverage
  run: |
    coverage run --source='.' manage.py test
    coverage report
```

### GitLab CI Example
```yaml
test:
  script:
    - python manage.py test --no-input --verbosity=2
    - coverage run --source='.' manage.py test
    - coverage report
```

## Performance Optimization

### Use --keepdb Flag
```bash
python manage.py test --keepdb
```
Reuses test database between runs (faster)

### Run Tests in Parallel
```bash
python manage.py test --parallel
```
Runs tests in parallel (requires database support)

### Minimize Database Queries
- Use `select_related()` and `prefetch_related()`
- Avoid N+1 queries
- Use fixtures for large datasets

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Table does not exist" | Run `python manage.py migrate` |
| "Permission denied" | Check user permissions in setUp |
| "Object does not exist" | Ensure test data created in setUp |
| "Tests timeout" | Check for infinite loops, optimize queries |
| "Import errors" | Check `__init__.py` files exist |

## Test Execution Checklist

- [ ] All tests pass locally
- [ ] Coverage is above 80%
- [ ] No warnings or errors
- [ ] Tests run in CI/CD pipeline
- [ ] Database migrations are up to date
- [ ] Test data is properly cleaned up
- [ ] No hardcoded values in tests
- [ ] Descriptive test names
- [ ] Permission checks included
- [ ] Edge cases tested

## Resources

- [Django Testing Docs](https://docs.djangoproject.com/en/stable/topics/testing/)
- [DRF Testing Guide](https://www.django-rest-framework.org/api-guide/testing/)
- [Coverage.py Docs](https://coverage.readthedocs.io/)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Comprehensive testing guide
- [TEST_SUMMARY.md](./TEST_SUMMARY.md) - Detailed test summary
