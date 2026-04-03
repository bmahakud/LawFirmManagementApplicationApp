# Law Firm Management System - API Documentation

## Overview

This is a comprehensive Django REST API for a Law Firm Management System supporting multiple user types, authentication methods, and firm management.

## User Types

1. **Platform Owner** - System administrator, creates firms and manages partners
2. **Partner Manager** - Sales partner, can create firms but cannot use the system
3. **Super Admin (Firm Owner)** - Firm owner, manages firm and can add other users
4. **Admin** - Firm administrator, manages users and operations
5. **Advocate** - Lawyer, can be part of multiple firms
6. **Paralegal** - Support staff, can be part of multiple firms
7. **Client** - End user, self-registers in the system

## Authentication Methods

### 1. Username + Password Login
```
POST /api/auth/login_username_password/
{
    "username": "user@example.com",
    "password": "password123"
}
```

### 2. Phone + OTP Login
```
Step 1: Request OTP
POST /api/auth/request_phone_otp/
{
    "phone_number": "+919876543210"
}

Step 2: Verify OTP
POST /api/auth/verify_otp/
{
    "phone_number": "+919876543210",
    "otp_code": "123456"
}
```

### 3. Email + OTP Login
```
Step 1: Request OTP
POST /api/auth/request_email_otp/
{
    "email": "user@example.com"
}

Step 2: Verify OTP
POST /api/auth/verify_otp/
{
    "email": "user@example.com",
    "otp_code": "123456"
}
```

## API Endpoints

### Authentication Endpoints

#### Register as Client
```
POST /api/users/register/
{
    "email": "client@example.com",
    "phone_number": "+919876543210",
    "first_name": "John",
    "last_name": "Doe",
    "password": "securepass123",
    "password_confirm": "securepass123",
    "date_of_birth": "1990-01-15",
    "gender": "M",
    "address_line_1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001"
}
```

#### Set Password (for users added by admin)
```
POST /api/auth/set_password/
{
    "phone_number": "+919876543210",
    "password": "newpassword123",
    "password_confirm": "newpassword123"
}
```

#### Change Password
```
POST /api/users/change_password/
Headers: Authorization: Token <token>
{
    "old_password": "oldpass123",
    "new_password": "newpass123",
    "new_password_confirm": "newpass123"
}
```

#### Logout
```
POST /api/auth/logout/
Headers: Authorization: Token <token>
```

### Firm Management

#### Create Firm (Platform Owner / Partner Manager)
```
POST /api/firms/
Headers: Authorization: Token <token>
{
    "firm_name": "ABC Law Firm",
    "firm_code": "ABC001",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "address": "123 Legal Street",
    "postal_code": "10001",
    "phone_number": "+12125551234",
    "email": "info@abclaw.com",
    "website": "https://abclaw.com",
    "subscription_type": "trial"
}
```

#### List Firms
```
GET /api/firms/
Headers: Authorization: Token <token>
```

#### Get Firm Details
```
GET /api/firms/{id}/
Headers: Authorization: Token <token>
```

#### Update Firm
```
PATCH /api/firms/{id}/
Headers: Authorization: Token <token>
{
    "firm_name": "Updated Firm Name",
    "subscription_type": "professional"
}
```

### User Management

#### Add User (Admin/Super Admin/Platform Owner)
```
POST /api/users/add_user/
Headers: Authorization: Token <token>
{
    "email": "advocate@example.com",
    "phone_number": "+919876543210",
    "first_name": "Jane",
    "last_name": "Smith",
    "user_type": "advocate",
    "firm": "firm-uuid"
}
```

Response includes:
- User details
- Invitation details
- Message confirming user addition

#### List Users
```
GET /api/users/
Headers: Authorization: Token <token>
```

#### Get User Details
```
GET /api/users/{id}/
Headers: Authorization: Token <token>
```

#### Update User
```
PATCH /api/users/{id}/
Headers: Authorization: Token <token>
{
    "first_name": "Updated Name",
    "date_of_birth": "1990-01-15",
    "aadhar_number": "123456789012",
    "pan_number": "ABCDE1234F"
}
```

### Document Management

#### Upload Document
```
POST /api/documents/
Headers: Authorization: Token <token>
Content-Type: multipart/form-data
{
    "document_type": "aadhar",
    "document_number": "123456789012",
    "document_file": <file>
}
```

#### List Documents
```
GET /api/documents/
Headers: Authorization: Token <token>
```

#### Get Document Details
```
GET /api/documents/{id}/
Headers: Authorization: Token <token>
```

### User Invitations

#### List Invitations
```
GET /api/invitations/
Headers: Authorization: Token <token>
```

#### Get Invitation Details
```
GET /api/invitations/{id}/
Headers: Authorization: Token <token>
```

### Audit Logs

#### List Audit Logs
```
GET /api/audit-logs/
Headers: Authorization: Token <token>
```

#### Get Audit Log Details
```
GET /api/audit-logs/{id}/
Headers: Authorization: Token <token>
```

## User Model Fields

### Basic Information
- `id` - UUID (auto-generated)
- `username` - Unique username
- `email` - Email address (unique)
- `phone_number` - Phone number (unique, validated)
- `first_name` - First name
- `last_name` - Last name
- `user_type` - Type of user (platform_owner, partner_manager, super_admin, admin, advocate, paralegal, client)

### Personal Details
- `date_of_birth` - Date of birth
- `gender` - Gender (M/F/O)

### Address
- `address_line_1` - Address line 1
- `address_line_2` - Address line 2
- `city` - City
- `state` - State
- `country` - Country
- `postal_code` - Postal code

### Professional Details
- `firm` - Associated firm (ForeignKey)
- `bar_council_registration` - Bar council registration number (for advocates)
- `bar_council_state` - Bar council state (for advocates)

### Documents
- `aadhar_number` - Aadhar number (unique)
- `pan_number` - PAN number (unique)

### Verification Status
- `is_phone_verified` - Phone verification status
- `is_email_verified` - Email verification status
- `is_document_verified` - Document verification status
- `is_active` - Account active status
- `password_set` - Password setup flag

### Timestamps
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_login_at` - Last login timestamp

## Firm Model Fields

- `id` - UUID (auto-generated)
- `firm_name` - Firm name (unique)
- `firm_code` - Firm code (unique)
- `city` - City
- `state` - State
- `country` - Country (default: India)
- `address` - Full address
- `postal_code` - Postal code
- `phone_number` - Contact phone
- `email` - Contact email
- `website` - Website URL
- `subscription_type` - Subscription type (trial, basic, professional, enterprise)
- `trial_end_date` - Trial period end date
- `subscription_start_date` - Subscription start date
- `subscription_end_date` - Subscription end date
- `is_active` - Firm active status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Document Types

- `aadhar` - Aadhar Card
- `pan` - PAN Card
- `passport` - Passport
- `driving_license` - Driving License
- `bar_certificate` - Bar Council Certificate
- `degree` - Educational Degree
- `other` - Other documents

## Verification Status

- `pending` - Awaiting verification
- `verified` - Document verified
- `rejected` - Document rejected

## Subscription Types

- `trial` - Trial period
- `basic` - Basic subscription
- `professional` - Professional subscription
- `enterprise` - Enterprise subscription

## Error Responses

### 400 Bad Request
```json
{
    "error": "Invalid input",
    "details": {
        "field_name": ["Error message"]
    }
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "error": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

## Success Responses

### 200 OK
```json
{
    "id": "uuid",
    "field1": "value1",
    "field2": "value2"
}
```

### 201 Created
```json
{
    "id": "uuid",
    "field1": "value1",
    "field2": "value2",
    "message": "Resource created successfully"
}
```

## Workflow Examples

### 1. Platform Owner Creates Firm and Adds Super Admin

```
1. Platform Owner logs in
   POST /api/auth/login_username_password/

2. Platform Owner creates firm
   POST /api/firms/

3. Platform Owner adds Super Admin
   POST /api/users/add_user/
   - user_type: "super_admin"
   - firm: <firm_id>

4. Super Admin receives invitation and sets password
   POST /api/auth/set_password/

5. Super Admin logs in
   POST /api/auth/login_username_password/
```

### 2. Super Admin Adds Advocate

```
1. Super Admin logs in
   POST /api/auth/login_username_password/

2. Super Admin adds Advocate
   POST /api/users/add_user/
   - user_type: "advocate"
   - firm: <firm_id>

3. Advocate receives invitation and sets password
   POST /api/auth/set_password/

4. Advocate uploads documents
   POST /api/documents/

5. Advocate logs in
   POST /api/auth/login_username_password/
```

### 3. Client Self-Registration

```
1. Client registers
   POST /api/users/register/

2. Client logs in with username/password
   POST /api/auth/login_username_password/

OR

2. Client requests OTP
   POST /api/auth/request_phone_otp/

3. Client verifies OTP
   POST /api/auth/verify_otp/
```

## Permissions

### Platform Owner
- Can view all firms
- Can create firms
- Can view all users
- Can add users of any type
- Can view all audit logs

### Partner Manager
- Can create firms
- Can view own firm
- Cannot use the system for legal operations

### Super Admin
- Can view own firm
- Can add Admin, Advocate, Paralegal, Client
- Can manage firm settings
- Can view firm audit logs

### Admin
- Can add Advocate, Paralegal, Client
- Can manage users within firm
- Can view firm audit logs

### Advocate
- Can view own profile
- Can upload documents
- Can view own audit logs

### Paralegal
- Can view own profile
- Can upload documents
- Can view own audit logs

### Client
- Can view own profile
- Can upload documents
- Can view own audit logs

## Rate Limiting

Currently not implemented. Can be added using `django-ratelimit` or similar packages.

## Pagination

Default page size: 20 items
```
GET /api/users/?page=1
```

## Filtering

Filters can be applied to list endpoints:
```
GET /api/users/?user_type=advocate
GET /api/firms/?subscription_type=professional
```

## Sorting

Sorting by creation date (default):
```
GET /api/users/?ordering=-created_at
```

## Notes

- All timestamps are in UTC
- Phone numbers must be in international format (+country_code)
- OTP is valid for 10 minutes
- Maximum 5 OTP verification attempts
- Passwords must be at least 8 characters
- All API responses include appropriate HTTP status codes
- Token authentication is required for most endpoints
