# Quick Reference Guide

## Start Development Server

```bash
source venv/bin/activate
python manage.py runserver
```

## Access Points

- **Admin Panel**: http://localhost:8000/admin/
- **API Base**: http://localhost:8000/api/
- **API Docs**: See API_DOCUMENTATION.md

## Common Commands

### Database
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Django Shell
```bash
python manage.py shell

# Create a firm
from core.models import Firm
firm = Firm.objects.create(
    firm_name="Test Firm",
    firm_code="TEST001",
    city="Mumbai",
    state="Maharashtra",
    country="India",
    phone_number="+919876543210",
    email="test@firm.com"
)

# Create a user
from core.models import CustomUser
user = CustomUser.objects.create_user(
    username="test@example.com",
    email="test@example.com",
    phone_number="+919876543211",
    user_type="client",
    password="TestPass@123"
)
```

## API Quick Calls

### Register Client
```bash
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@example.com",
    "phone_number": "+919876543210",
    "first_name": "John",
    "last_name": "Doe",
    "password": "Pass@123",
    "password_confirm": "Pass@123"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login_username_password/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "client@example.com",
    "password": "Pass@123"
  }'
```

### Request Phone OTP
```bash
curl -X POST http://localhost:8000/api/auth/request_phone_otp/ \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+919876543210"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:8000/api/auth/verify_otp/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210",
    "otp_code": "123456"
  }'
```

### Create Firm
```bash
curl -X POST http://localhost:8000/api/firms/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firm_name": "ABC Law Firm",
    "firm_code": "ABC001",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "phone_number": "+912225551234",
    "email": "info@abclaw.com"
  }'
```

### Add User
```bash
curl -X POST http://localhost:8000/api/users/add_user/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "advocate@example.com",
    "phone_number": "+919876543211",
    "first_name": "Jane",
    "last_name": "Smith",
    "user_type": "advocate",
    "firm": "FIRM_UUID"
  }'
```

### Set Password
```bash
curl -X POST http://localhost:8000/api/auth/set_password/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543211",
    "password": "NewPass@123",
    "password_confirm": "NewPass@123"
  }'
```

### List Users
```bash
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### Upload Document
```bash
curl -X POST http://localhost:8000/api/documents/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "document_type=aadhar" \
  -F "document_number=123456789012" \
  -F "document_file=@/path/to/file.pdf"
```

## User Types

| Type | Can Create Firm | Can Add Users | Can Use System |
|------|---|---|---|
| platform_owner | ✓ | ✓ | ✓ |
| partner_manager | ✓ | ✗ | ✗ |
| super_admin | ✗ | ✓ | ✓ |
| admin | ✗ | ✓ | ✓ |
| advocate | ✗ | ✗ | ✓ |
| paralegal | ✗ | ✗ | ✓ |
| client | ✗ | ✗ | ✓ |

## Document Types

- aadhar
- pan
- passport
- driving_license
- bar_certificate
- degree
- other

## Subscription Types

- trial
- basic
- professional
- enterprise

## Verification Status

- pending
- verified
- rejected

## OTP Details

- **Valid for**: 10 minutes
- **Max attempts**: 5
- **Length**: 6 digits
- **Sent via**: SMS (phone) or Email

## File Locations

- **Models**: `core/models.py`
- **Serializers**: `core/serializers.py`
- **Views**: `core/views.py`
- **URLs**: `core/urls.py`
- **Admin**: `core/admin.py`
- **Settings**: `myproject/settings.py`
- **Main URLs**: `myproject/urls.py`

## Environment Variables

```
DEBUG=True/False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@lawfirm.com
```

## Troubleshooting

### Port 8000 in use
```bash
python manage.py runserver 8001
```

### Clear migrations
```bash
python manage.py migrate core zero
python manage.py migrate
```

### Reset database
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

### Check system
```bash
python manage.py check
```

### View logs
```bash
# Check console output for email logs
# Check database for audit logs
```

## Useful Django Commands

```bash
# Create app
python manage.py startapp app_name

# Create superuser
python manage.py createsuperuser

# Change password
python manage.py changepassword username

# Shell
python manage.py shell

# Database shell
python manage.py dbshell

# Collect static files
python manage.py collectstatic

# Run tests
python manage.py test

# Check for issues
python manage.py check

# Show migrations
python manage.py showmigrations

# Squash migrations
python manage.py squashmigrations core 0001 0005
```

## API Response Codes

- **200**: OK
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Server Error

## Default Pagination

- **Page size**: 20 items
- **Query**: `?page=1`

## Filtering Examples

```bash
# By user type
GET /api/users/?user_type=advocate

# By subscription
GET /api/firms/?subscription_type=professional

# By status
GET /api/documents/?verification_status=pending
```

## Sorting Examples

```bash
# Ascending
GET /api/users/?ordering=created_at

# Descending
GET /api/users/?ordering=-created_at
```

## Token Authentication

```bash
# Get token from login response
# Use in header: Authorization: Token <token>

# Example
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

## Important Notes

- All phone numbers must be in international format: +country_code
- Passwords must be at least 8 characters
- OTP is valid for 10 minutes
- Maximum 5 OTP verification attempts
- All timestamps are in UTC
- UUIDs are used as primary keys
- Token authentication is required for most endpoints
- Firm-level isolation is enforced for non-platform-owner users

## Next Steps

1. Read `SETUP_GUIDE.md` for detailed setup
2. Read `API_DOCUMENTATION.md` for complete API reference
3. Check `USAGE_EXAMPLES.md` for practical examples
4. Review `PROJECT_SUMMARY.md` for project overview
5. Start the development server and test the API
