# Password Reset & Change Implementation

This document provides comprehensive details about the password reset and password change functionality in the JoyFund PHIF backend.

## Overview

The system provides three main password-related endpoints:

1. **Password Reset Request** - Unauthenticated users can request a password reset by providing their email
2. **Password Reset Confirm** - Complete the password reset using a token received via email
3. **Password Change** - Authenticated users can change their password with their old password

## Implementation Details

### Models

#### PasswordResetToken
**Location:** `accounts/models/password_reset.py`

Stores password reset tokens with the following properties:
- `id` - UUID primary key
- `user` - ForeignKey to User model
- `token` - Unique 64-character secure token (generated with `secrets.token_urlsafe()`)
- `created_at` - Timestamp of token creation
- `expires_at` - Automatic expiration (24 hours from creation)
- `is_used` - Boolean flag to prevent token reuse

**Key Features:**
- Automatic expiration after 24 hours
- Tokens can only be used once
- Efficient querying with database indexes
- Validates `is_valid` property to check if token is still usable

### Serializers

**Location:** `accounts/serializers/password.py`

#### PasswordResetRequestSerializer
- Validates email format
- Does NOT validate email existence (security: prevent email enumeration)

#### PasswordResetConfirmSerializer
- Validates token (min length: 32 characters)
- Validates new password (min length: 8 characters)
- Validates that new password and confirm password match
- Uses Django's password validators for strength requirements

#### PasswordChangeSerializer
- Validates old password against user's current password
- Validates new password (min length: 8 characters)
- Validates that new password and confirm password match
- Ensures new password is different from old password

### Views

**Location:** `accounts/views/password.py`

#### PasswordResetRequestView
**Endpoint:** `POST /api/accounts/password/reset/`

**Permission:** AllowAny (unauthenticated)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Features:**
- Returns same message whether email exists or not (security)
- Invalidates all previous unused tokens for the user
- Generates a secure token
- Sends password reset email with HTML and plain text versions
- Includes 24-hour expiration warning in email

#### PasswordResetConfirmView
**Endpoint:** `POST /api/accounts/password/reset-confirm/`

**Permission:** AllowAny (unauthenticated)

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePassword123!",
  "confirm_password": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**
- `400 Bad Request` - Token already used, expired, or passwords don't match
- `400 Bad Request` - Invalid password (doesn't meet Django's validator requirements)

**Features:**
- Validates token is not expired
- Validates token hasn't been used before
- Updates user's password
- Marks token as used (prevents reuse)
- All password validations are applied

#### PasswordChangeView
**Endpoint:** `POST /api/accounts/password/change/`

**Permission:** IsAuthenticated (requires valid JWT token)

**Request Body:**
```json
{
  "old_password": "CurrentPassword123!",
  "new_password": "NewPassword456!",
  "confirm_password": "NewPassword456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been changed successfully."
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `400 Bad Request` - Old password is incorrect
- `400 Bad Request` - Passwords don't match
- `400 Bad Request` - New password is same as old password
- `400 Bad Request` - Password doesn't meet security requirements

### Utility Functions

**Location:** `accounts/utils/password_reset.py`

#### generate_reset_token()
Generates a secure random token using `secrets.token_urlsafe()`.
- Output: 64-character URL-safe string

#### send_password_reset_email(user, request)
Sends a password reset email with reset link.

**Parameters:**
- `user` - User instance
- `request` - Django request object

**Returns:**
```python
{
    'success': bool,
    'message': str
}
```

**Email Format:**
- Personalized with user's first name
- Includes clickable reset link
- HTML and plain text versions
- Binary token in URL: `/reset-password?token=<TOKEN>`
- 24-hour expiration notice

#### validate_reset_token(token_string)
Validates a password reset token.

**Returns:**
```python
(is_valid, token_obj, error_message)
```

- `is_valid` - Boolean
- `token_obj` - PasswordResetToken instance or None
- `error_message` - Human-readable error message

**Validation Checks:**
- Token exists in database
- Token has not been used
- Token has not expired

#### cleanup_expired_tokens()
Remove expired tokens from database (call periodically via Celery or management command).

**Returns:** Number of deleted tokens

## Security Features

### Email Enumeration Prevention
- Password reset endpoint returns the same message whether email exists or not
- Prevents attackers from discovering registered email addresses

### Token Security
- Uses cryptographically secure random token generation (`secrets.token_urlsafe()`)
- Tokens are unique and stored in database
- Tokens expire after 24 hours
- Tokens can only be used once
- Automatically invalidates previous tokens for same user

### Password Security
- Leverages Django's built-in password validators
- Validates password strength (complexity requirements)
- Prevents reuse of old password during password change
- Requires old password for password change (proves user identity)
- Passwords hashed with PBKDF2 (configurable in Django settings)

### Rate Limiting
Consider adding rate limiting to password reset endpoint to prevent brute force attacks:
```python
# In settings.py, configure DRF throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/hour',  # 5 requests per hour for password reset
    }
}
```

### Email Configuration
Set these environment variables or in `settings.py`:
```python
# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'your-smtp-host.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@example.com'
EMAIL_HOST_PASSWORD = 'your-email-password'
DEFAULT_FROM_EMAIL = 'noreply@joyfund.org'

# Frontend URL for reset links
FRONTEND_URL = 'https://app.joyfund.org'  # Used in password reset email
```

## Database Migration

A migration was created to add the `PasswordResetToken` model:
```bash
python manage.py makemigrations accounts
python manage.py migrate accounts
```

**Migration File:** `accounts/migrations/0004_passwordresettoken.py`

## API Flow Diagrams

### Password Reset Flow
```
User (Frontend)
    ↓
[POST /api/accounts/password/reset/]
    ↓ email: "user@example.com"
    ↓
API validates email format
    ↓
API looks up user by email
    ↓ User found
    ↓
API generates secure token
    ↓
API saves token with 24hr expiration
    ↓
API sends email with reset link
    ← Response (200 OK)
    ↓
User receives email
    ↓
User clicks reset link with token
    ↓ Token in URL: ?token=xyz123
    ↓
Frontend extracts token
    ↓
[POST /api/accounts/password/reset-confirm/]
    ↓ token, new_password, confirm_password
    ↓
API validates token (exists, not used, not expired)
    ↓ Token valid
    ↓
API updates user password
    ↓
API marks token as used
    ← Response (200 OK)
    ↓
User can now login with new password
```

### Password Change Flow
```
Authenticated User (Frontend)
    ↓
[POST /api/accounts/password/change/]
    ↓ old_password, new_password, confirm_password
    ↓ (Request includes JWT token)
    ↓
API checks authentication
    ↓ Authenticated
    ↓
API validates old_password against user's current
    ↓ Correct
    ↓
API validates new passwords match
    ↓
API validates password strength
    ↓
API updates user password
    ← Response (200 OK)
    ↓
User can login with new password
```

## Frontend Integration

### Example Request (Password Reset)
```javascript
// Step 1: Request reset link
const response = await fetch('/api/accounts/password/reset/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// Step 2: User receives email and clicks link with token
// Extract token from URL: /reset-password?token=xyz123

// Step 3: Confirm password reset
const resetResponse = await fetch('/api/accounts/password/reset-confirm/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: tokenFromURL,
    new_password: 'NewPassword123!',
    confirm_password: 'NewPassword123!'
  })
});
```

### Example Request (Password Change)
```javascript
const changeResponse = await fetch('/api/accounts/password/change/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <JWT_TOKEN>'
  },
  body: JSON.stringify({
    old_password: 'CurrentPassword123!',
    new_password: 'NewPassword456!',
    confirm_password: 'NewPassword456!'
  })
});
```

## Testing

Test cases should cover:
1. ✅ Password reset with valid email - sends email
2. ✅ Password reset with invalid email - doesn't crash
3. ✅ Token validation - accepts valid tokens
4. ✅ Expired token - rejects after 24 hours
5. ✅ Used token - prevents reuse
6. ✅ Password confirm - validates matching
7. ✅ Password strength - rejects weak passwords
8. ✅ Password change - validates old password
9. ✅ Password change - requires authentication
10. ✅ Rate limiting - prevents abuse (if configured)

## Troubleshooting

### Emails not sending
- Check `DEFAULT_FROM_EMAIL` is configured
- Verify SMTP settings (host, port, credentials)
- Check Django logs for email errors
- Test with Django's test email backend: `python manage.py shell` → `send_test_email()`

### Token not validating
- Verify migration was applied: `python manage.py showmigrations accounts`
- Check token hasn't expired (24 hour limit)
- Verify token in database: `PasswordResetToken.objects.filter(token='xxx')`

### Password validation fails
- Ensure password meets Django's PASSWORD_VALIDATORS requirements
- Common issues: too short, too common, no numbers/letters combination
- Check manage password validation rules in `settings.py`

## Maintenance Tasks

### Clean up expired tokens (recommended weekly)
```bash
# Via management command (create if not exists)
python manage.py cleanup_password_reset_tokens

# Or via Celery periodic task
from accounts.utils.password_reset import cleanup_expired_tokens
cleanup_expired_tokens.apply_async(eta=...)
```

## Future Enhancements

1. **SMS Option** - Send reset token via SMS for phone numbers
2. **OTP Code** - Use 6-digit OTP instead of long token
3. **Multi-step Verification** - Require email + SMS confirmation
4. **Login History** - Track password changes and login attempts
5. **Forced Password Change** - Admin can force users to change password on next login
6. **Password Expiration** - Require password change every N days
7. **Compromise Detection** - Monitor for compromised passwords
8. **Two-Factor Authentication** - Add 2FA during password reset
