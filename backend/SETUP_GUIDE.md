# Law Firm Management System - Setup Guide

## Prerequisites

- Python 3.8+
- pip (Python package manager)
- Virtual environment (venv)

## Installation Steps

### 1. Activate Virtual Environment

```bash
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Create .env File

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

Update `.env` with your configuration:
```
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@lawfirm.com
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Superuser (Platform Owner)

```bash
python manage.py createsuperuser
```

This creates the initial Platform Owner account.

### 6. Run Development Server

```bash
python manage.py runserver
```

The server will be available at `http://localhost:8000`

## Admin Panel Access

- URL: `http://localhost:8000/admin/`
- Username: (superuser username)
- Password: (superuser password)

## API Access

- Base URL: `http://localhost:8000/api/`
- Authentication: Token-based (Authorization: Token <token>)

## First Time Setup Workflow

### Step 1: Create a Firm (as Platform Owner)

```bash
curl -X POST http://localhost:8000/api/firms/ \
  -H "Authorization: Token <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firm_name": "My Law Firm",
    "firm_code": "MLF001",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "phone_number": "+12125551234",
    "email": "info@mylaw.com"
  }'
```

### Step 2: Add Super Admin (as Platform Owner)

```bash
curl -X POST http://localhost:8000/api/users/add_user/ \
  -H "Authorization: Token <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mylaw.com",
    "phone_number": "+919876543210",
    "first_name": "John",
    "last_name": "Admin",
    "user_type": "super_admin",
    "firm": "<firm-uuid>"
  }'
```

### Step 3: Super Admin Sets Password

```bash
curl -X POST http://localhost:8000/api/auth/set_password/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+919876543210",
    "password": "securepass123",
    "password_confirm": "securepass123"
  }'
```

### Step 4: Super Admin Logs In

```bash
curl -X POST http://localhost:8000/api/auth/login_username_password/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@mylaw.com",
    "password": "securepass123"
  }'
```

## Database Configuration

### SQLite (Default - Development)

Already configured in `.env`:
```
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

### PostgreSQL (Production)

Update `.env`:
```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=django_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Then run migrations:
```bash
python manage.py migrate
```

## Email Configuration

### Gmail (Development)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Console Backend (Development - Default)

Emails are printed to console:
```
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### SMTP Backend (Production)

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
```

## SMS Configuration

To enable SMS OTP, integrate with a provider like Twilio:

1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token
3. Update `core/views.py` `send_otp_sms()` function with Twilio integration

Example:
```python
from twilio.rest import Client

def send_otp_sms(phone_number, otp_code):
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    client = Client(account_sid, auth_token)
    
    message = client.messages.create(
        body=f'Your OTP is: {otp_code}',
        from_=os.getenv('TWILIO_PHONE_NUMBER'),
        to=phone_number
    )
    return True
```

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login_username_password/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@mylaw.com", "password": "securepass123"}'

# Get token from response
# Use token in subsequent requests
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Token <token>"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables:
   - `base_url`: http://localhost:8000
   - `token`: (obtained from login)
3. Use `{{base_url}}/api/...` in requests
4. Add header: `Authorization: Token {{token}}`

### Using Python

```python
import requests

# Login
response = requests.post(
    'http://localhost:8000/api/auth/login_username_password/',
    json={
        'username': 'admin@mylaw.com',
        'password': 'securepass123'
    }
)

token = response.json()['token']

# Get users
headers = {'Authorization': f'Token {token}'}
response = requests.get(
    'http://localhost:8000/api/users/',
    headers=headers
)

print(response.json())
```

## Troubleshooting

### Migration Errors

If you encounter migration errors:

```bash
# Reset migrations (development only)
python manage.py migrate core zero
python manage.py migrate

# Or delete db.sqlite3 and start fresh
rm db.sqlite3
python manage.py migrate
```

### Port Already in Use

If port 8000 is already in use:

```bash
python manage.py runserver 8001
```

### Module Not Found

Ensure virtual environment is activated:

```bash
source venv/bin/activate
```

### Permission Denied

Make sure you have the correct user type and permissions for the action.

## Production Deployment

### Security Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Generate a strong `SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure proper email backend
- [ ] Enable HTTPS
- [ ] Set up proper logging
- [ ] Configure CORS if needed
- [ ] Set up rate limiting
- [ ] Enable CSRF protection

### Using Gunicorn

```bash
gunicorn myproject.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "myproject.wsgi:application", "--bind", "0.0.0.0:8000"]
```

Build and run:
```bash
docker build -t lawfirm .
docker run -p 8000:8000 lawfirm
```

## Support

For issues or questions, refer to:
- API Documentation: `API_DOCUMENTATION.md`
- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
