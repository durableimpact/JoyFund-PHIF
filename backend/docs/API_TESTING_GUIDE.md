# Password Reset & Change - API Testing Guide

This guide provides examples for testing the password reset and change functionality using curl, Postman, or any HTTP client.

## Base URL
```
http://localhost:8000/api/accounts
```

## Endpoints Overview

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/password/reset/` | ❌ No | Request password reset email |
| POST | `/password/reset-confirm/` | ❌ No | Confirm reset with token |
| POST | `/password/change/` | ✅ Yes | Change password (authenticated) |

---

## 1. Request Password Reset

### Endpoint
```
POST /api/accounts/password/reset/
```

### Request
```bash
curl -X POST http://localhost:8000/api/accounts/password/reset/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "donor@example.com"
  }'
```

### Successful Response (200 OK)
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### Error Response (400 Bad Request)
```json
{
  "email": ["Enter a valid email address."]
}
```

### Notes
- Returns success message whether email exists or not (security feature)
- User receives email with reset link containing token
- Token expires in 24 hours
- Previous unused tokens for this user are invalidated

---

## 2. Confirm Password Reset

### Endpoint
```
POST /api/accounts/password/reset-confirm/
```

### Prerequisites
1. User has requested password reset
2. User has token from email
3. Token has not expired (within 24 hours)
4. Token has not been used

### Request
```bash
curl -X POST http://localhost:8000/api/accounts/password/reset-confirm/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-token-from-email",
    "new_password": "NewSecurePass123!",
    "confirm_password": "NewSecurePass123!"
  }'
```

### Successful Response (200 OK)
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

### Error Responses

**Invalid Token (400 Bad Request)**
```json
{
  "error": "Invalid password reset token. Please request a new password reset."
}
```

**Expired Token (400 Bad Request)**
```json
{
  "error": "This password reset link has expired. Please request a new one."
}
```

**Token Already Used (400 Bad Request)**
```json
{
  "error": "This password reset link has already been used."
}
```

**Passwords Don't Match (400 Bad Request)**
```json
{
  "confirm_password": ["Passwords do not match."]
}
```

**Weak Password (400 Bad Request)**
```json
{
  "new_password": [
    "This password is too common.",
    "This password is entirely numeric."
  ]
}
```

### Notes
- Passwords must match exactly
- Passwords must meet Django's password validators (minimum requirements)
- After successful reset, password cannot be changed until user logs in

---

## 3. Change Password (Authenticated User)

### Endpoint
```
POST /api/accounts/password/change/
```

### Prerequisites
- User is authenticated (must have valid JWT token)
- User knows their current password

### Request Headers
```bash
Authorization: Bearer your-jwt-token
Content-Type: application/json
```

### Request
```bash
curl -X POST http://localhost:8000/api/accounts/password/change/ \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "CurrentPassword123!",
    "new_password": "NewPassword456!",
    "confirm_password": "NewPassword456!"
  }'
```

### Successful Response (200 OK)
```json
{
  "message": "Password has been changed successfully."
}
```

### Error Responses

**Not Authenticated (401 Unauthorized)**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Incorrect Old Password (400 Bad Request)**
```json
{
  "old_password": ["Old password is incorrect."]
}
```

**Passwords Don't Match (400 Bad Request)**
```json
{
  "confirm_password": ["Passwords do not match."]
}
```

**New Password Same as Old (400 Bad Request)**
```json
{
  "new_password": ["New password must be different from the old password."]
}
```

**Weak Password (400 Bad Request)**
```json
{
  "new_password": [
    "This password is too common.",
    "This password is entirely numeric."
  ]
}
```

### Notes
- Old password is required for security (proves user identity)
- New password must be different from old password
- Passwords are automatically hashed with Django's password hasher

---

## Complete Test Flow

### Step 1: Create Test User
```bash
# First, create a user through donor registration or admin
curl -X POST http://localhost:8000/api/accounts/donors/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+237670123456",
    "password": "TestPassword123!",
    "confirm_password": "TestPassword123!"
  }'
```

### Step 2: Request Password Reset
```bash
curl -X POST http://localhost:8000/api/accounts/password/reset/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
# Check email for reset link with token
```

### Step 3: Extract Token from Email
- User receives email with reset link
- Link format: `http://frontend.com/reset-password?token=YOUR_TOKEN_HERE`
- Extract the token value

### Step 4: Confirm Password Reset
```bash
curl -X POST http://localhost:8000/api/accounts/password/reset-confirm/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "new_password": "NewPassword456!",
    "confirm_password": "NewPassword456!"
  }'
```

### Step 5: Login with New Password
```bash
# Use new password to login
curl -X POST http://localhost:8000/auth/convert-token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'grant_type=password&username=testuser@example.com&password=NewPassword456!&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET'
```

### Step 6: Change Password (Already Logged In)
```bash
curl -X POST http://localhost:8000/api/accounts/password/change/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "NewPassword456!",
    "new_password": "AnotherPassword789!",
    "confirm_password": "AnotherPassword789!"
  }'
```

---

## Postman Collection

### Password Reset Request
```json
{
  "method": "POST",
  "url": "{{base_url}}/password/reset/",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "mode": "raw",
    "raw": "{\n  \"email\": \"donor@example.com\"\n}"
  }
}
```

### Password Reset Confirm
```json
{
  "method": "POST",
  "url": "{{base_url}}/password/reset-confirm/",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "mode": "raw",
    "raw": "{\n  \"token\": \"{{reset_token}}\",\n  \"new_password\": \"NewSecurePass123!\",\n  \"confirm_password\": \"NewSecurePass123!\"\n}"
  }
}
```

### Password Change
```json
{
  "method": "POST",
  "url": "{{base_url}}/password/change/",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{jwt_token}}"
  },
  "body": {
    "mode": "raw",
    "raw": "{\n  \"old_password\": \"CurrentPassword123!\",\n  \"new_password\": \"NewPassword456!\",\n  \"confirm_password\": \"NewPassword456!\"\n}"
  }
}
```

---

## Password Requirements

Passwords must meet Django's default validators:

1. **Minimum Length**: 8 characters
2. **Not Entirely Numbers**: Cannot be all digits
3. **Not Common**: Cannot be in list of common passwords
4. **Complexity**: Should include mix of character types (recommended)

### Example Valid Passwords
- ✅ `SecurePass123!`
- ✅ `MyP@ssw0rd`
- ✅ `Complex$Password2024`

### Example Invalid Passwords
- ❌ `password` (too common)
- ❌ `12345678` (all numbers)
- ❌ `short` (too short)
- ❌ `admin123` (too common)

---

## Testing with Python

```python
import requests
import json

BASE_URL = "http://localhost:8000/api/accounts"

# 1. Request password reset
response = requests.post(
    f"{BASE_URL}/password/reset/",
    json={"email": "testuser@example.com"}
)
print("Reset request:", response.status_code, response.json())

# 2. Confirm password reset (with token from email)
response = requests.post(
    f"{BASE_URL}/password/reset-confirm/",
    json={
        "token": "your_token_here",
        "new_password": "NewPassword456!",
        "confirm_password": "NewPassword456!"
    }
)
print("Reset confirm:", response.status_code, response.json())

# 3. Change password (authenticated)
headers = {"Authorization": "Bearer your_jwt_token"}
response = requests.post(
    f"{BASE_URL}/password/change/",
    json={
        "old_password": "NewPassword456!",
        "new_password": "AnotherPassword789!",
        "confirm_password": "AnotherPassword789!"
    },
    headers=headers
)
print("Password change:", response.status_code, response.json())
```

---

## Debugging

### Check if email was sent
- Look at Django logs: `DEBUG=True` in development
- Check email backend configuration in `settings.py`
- Review `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`

### Verify token in database
```bash
# Django shell
python manage.py shell
```

```python
from accounts.models import PasswordResetToken
from accounts.models import User

user = User.objects.get(email="testuser@example.com")
tokens = PasswordResetToken.objects.filter(user=user)
for token in tokens:
    print(f"Token: {token.token[:10]}...")
    print(f"Valid: {token.is_valid}")
    print(f"Expires: {token.expires_at}")
```

### View all recent password resets
```bash
python manage.py shell
```

```python
from accounts.models import PasswordResetToken
from django.utils import timezone

# Recent tokens
recent = PasswordResetToken.objects.all().order_by('-created_at')[:10]
for token in recent:
    print(f"{token.user.email} - Valid: {token.is_valid} - Used: {token.is_used}")
```

---

## Common Issues

### "Email not receiving reset link"
- Check email configuration in settings.py
- Verify SMTP credentials
- Check spam/junk folder
- Look for Django error logs

### "Token always invalid"
- Verify token was copied correctly
- Check token hasn't expired (24 hour limit)
- Ensure token hasn't been used already
- Verify token exists: `PasswordResetToken.objects.filter(token='xxx').exists()`

### "Password validation fails"
- Password too short (min 8 chars)
- Password too common
- Password is all numbers
- Check Django's PASSWORD_VALIDATORS in settings

### "401 Unauthorized on password change"
- JWT token may have expired
- Token was not included in Authorization header
- Token format incorrect (should be `Bearer <token>`)
