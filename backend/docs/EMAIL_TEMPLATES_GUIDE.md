# Email Templates - Password Reset

## Template Files Location

The password reset email templates are stored in:
```
accounts/templates/emails/
├── password_reset_email.html    # HTML version
└── password_reset_email.txt     # Plain text version
```

## Template Variables

Both templates support the following context variables:

| Variable | Type | Description |
|----------|------|-------------|
| `first_name` | String | User's first name |
| `reset_link` | URL | Complete password reset link with token |
| `support_url` | URL | Support contact URL |

## How It Works

### 1. Token Generation
- A secure token is generated using `secrets.token_urlsafe(48)`
- Token is stored in database with 24-hour expiration
- Previous unused tokens for the user are invalidated

### 2. Email Rendering
The `send_password_reset_email()` function in `accounts/utils/password_reset.py`:
```python
# 1. Creates context with user data
email_context = {
    'first_name': user.first_name,
    'reset_link': reset_link,
    'support_url': support_url,
}

# 2. Renders both HTML and plain text versions
html_message = render_to_string('emails/password_reset_email.html', email_context)
plain_message = render_to_string('emails/password_reset_email.txt', email_context)

# 3. Sends email with both versions
send_mail(
    subject='Password Reset Request - JoyFund PHIF',
    message=plain_message,
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=[user.email],
    html_message=html_message,
)
```

### 3. Email Clients
- Email clients that support HTML will display the formatted HTML version
- Email clients that only support plain text will show the `.txt` version
- Both versions contain the same information and reset link

## Customization

### Modifying Email Templates

To customize the email appearance:

1. **HTML Template**: Edit `password_reset_email.html`
   - Update styling in the `<style>` section
   - Add or modify content in the `<body>` section
   - Keep template variables like `{{ reset_link }}` unchanged

2. **Plain Text Template**: Edit `password_reset_email.txt`
   - Plain ASCII text - no HTML formatting
   - Keep template variables like `{{ reset_link }}` unchanged

### Adding New Templates

To support other email types (e.g., email verification, password change notification):

1. Create new template files in `accounts/templates/emails/`
2. Use the same context variable syntax: `{{ variable_name }}`
3. Create a utility function similar to `send_password_reset_email()`

Example:
```python
def send_welcome_email(user):
    email_context = {
        'first_name': user.first_name,
        'verification_link': verification_link,
    }
    html_message = render_to_string('emails/welcome_email.html', email_context)
    plain_message = render_to_string('emails/welcome_email.txt', email_context)
    # ... send email
```

## Settings Required

Add these settings to `settings.py` or environment variables:

```python
# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'your-smtp-host.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@example.com'
EMAIL_HOST_PASSWORD = 'your-email-password'
DEFAULT_FROM_EMAIL = 'noreply@joyfund.org'

# Frontend URLs for email links
FRONTEND_URL = 'https://app.joyfund.org'  # Used in password reset links
SUPPORT_URL = 'https://support.joyfund.org'  # Support contact link

# For development (optional)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Prints to console
```

## Testing Email Templates

### In Development (Console Backend)
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```
Emails will print to console instead of being sent.

### Via Django Shell
```bash
python manage.py shell
```

```python
from accounts.models import User
from accounts.utils.password_reset import send_password_reset_email

user = User.objects.get(email='test@example.com')
result = send_password_reset_email(user, None)
print(result)
```

### Viewing Rendered Template
```python
from django.template.loader import render_to_string

context = {
    'first_name': 'John',
    'reset_link': 'http://localhost:3000/reset-password?token=abc123',
    'support_url': 'https://support.joyfund.org'
}

html = render_to_string('emails/password_reset_email.html', context)
print(html)
```

## Email Preview

### HTML Version Features
- Professional styling with blue color scheme
- Responsive design for mobile and desktop
- Clear call-to-action button
- Security warnings and best practices
- Footer with company information
- Proper spacing and typography

### Plain Text Version Features
- Simple, readable ASCII format
- Same information as HTML version
- Works on all email clients
- No formatting dependencies

## Troubleshooting

### Templates Not Found
**Error**: `TemplateDoesNotExist: emails/password_reset_email.html`

**Solution**: Ensure `TEMPLATES` is configured in `settings.py`:
```python
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,  # Must be True to find app templates
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

### Emails Not Sending
- Check `DEFAULT_FROM_EMAIL` is configured
- Verify SMTP settings and credentials
- Check if `EMAIL_BACKEND` is set to console for development
- Review Django logs for errors

### Variables Not Rendering
- Ensure variable names match exactly: `{{ variable_name }}`
- Variables must be passed in `email_context` dictionary
- Check spelling and capitalization

## Related Files

- **Model**: `accounts/models/password_reset.py` - PasswordResetToken model
- **Utility**: `accounts/utils/password_reset.py` - Email sending logic
- **View**: `accounts/views/password.py` - API endpoints
- **Serializer**: `accounts/serializers/password.py` - Input validation
- **URLs**: `accounts/urls.py` - Route configuration
