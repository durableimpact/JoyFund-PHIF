# Token Refresh Issue - Root Cause Analysis & Fix

## The Problem You're Experiencing

1. **Access token expires after 1 hour** ✅ Working correctly
2. **After 1 hour, frontend tries to refresh token** ✅ Sending refresh_token to backend
3. **Backend returns 401** ❌ **PROBLEM: Not returning new access token**
4. **User is forced to log in again** ❌ **Not acceptable**

## Root Cause Analysis

### What SHOULD Happen (OAuth2 Standard):
```
Frontend (has expired access_token + valid refresh_token)
  ↓
POST /auth/token/ with grant_type=refresh_token
  ↓
Backend validates refresh_token is valid and not expired
  ↓
Backend generates NEW access_token (1 hour validity)
  ↓
Backend generates NEW refresh_token (30 days validity)
  ↓
Returns: { access_token, refresh_token, expires_in }
  ↓
Frontend updates session with new tokens
  ↓
User continues seamlessly ✅
```

### What's ACTUALLY Happening:
```
Frontend sends refresh_token to /auth/token/
  ↓
oauth2_provider tries to handle it
  ↓
❌ **Returns 401 - Invalid refresh token OR**
❌ **Refresh token not being generated at login**
  ↓
Frontend can't get new access_token
  ↓
User gets logged out
```

## Why It's Failing

Looking at your `backend/views.py` line 185-186:
```python
token_view = TokenView.as_view()
response = token_view(django_request)
```

You're delegating to `oauth2_provider.views.TokenView`, which should handle refresh tokens. **The issue is likely:**

1. **Refresh token isn't being generated on login**, OR
2. **Refresh token IS generated but marked as expired**, OR
3. **The refresh endpoint isn't configured properly**

## Quick Diagnostic

Run this in your Django shell to check:

```bash
python manage.py shell

from oauth2_provider.models import AccessToken, RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()

# Check access tokens for this user
access_tokens = AccessToken.objects.filter(user=user)
print(f"Access tokens for {user.email}: {access_tokens.count()}")
for at in access_tokens:
    print(f"  - Token: {at.token[:20]}... Expires: {at.expires}")

# Check refresh tokens for this user
refresh_tokens = RefreshToken.objects.filter(user=user)
print(f"Refresh tokens for {user.email}: {refresh_tokens.count()}")
for rt in refresh_tokens:
    print(f"  - Token: {rt.token[:20]}... Expires: {rt.expires}")
```

**If refresh_tokens count is 0:** That's your problem - they're not being generated!

## The Fix

### Step 1: Verify OAuth2 App Configuration

Check if you have an OAuth2 app created:

```bash
python manage.py shell

from oauth2_provider.models import Application

apps = Application.objects.all()
print(f"OAuth2 Applications: {apps.count()}")
for app in apps:
    print(f"  - Name: {app.name}")
    print(f"    Client ID: {app.client_id}")
    print(f"    Authorization Grant Type: {app.authorization_grant_type}")
```

**If this returns 0:** You need to create an app. Run:

```bash
python manage.py create_oauth_app
```

This command should already exist in `accounts/management/commands/create_oauth_app.py`

### Step 2: Ensure Refresh Tokens Are Generated

**File:** `backend/backend/views.py`

Add explicit refresh token generation to the `oauth2_token_view` function:

```python
# After successful token generation (around line 193)
if response.status_code == 200:
    try:
        response_data = json.loads(response.content.decode('utf-8'))
        access_token = response_data.get("access_token")
        
        if access_token:
            from oauth2_provider.models import AccessToken, RefreshToken
            
            token_obj = AccessToken.objects.filter(
                token=access_token
            ).select_related('user').first()
            
            if token_obj and token_obj.user:
                # Ensure refresh token exists
                refresh_token_obj = RefreshToken.objects.filter(
                    access_token=token_obj
                ).first()
                
                if not refresh_token_obj:
                    # Generate refresh token if it doesn't exist
                    from datetime import timedelta
                    from django.utils import timezone
                    
                    refresh_token_obj = RefreshToken.objects.create(
                        user=token_obj.user,
                        access_token=token_obj,
                        expires=timezone.now() + timedelta(days=30),
                        application=token_obj.application,
                    )
                    logger.info(f"Created refresh token for {token_obj.user.email}")
```

Actually, let me provide a proper, complete fixed version of the views.py file...

## Better Solution: Custom Refresh Token Handler

The core issue is that `oauth2_provider.views.TokenView` might not be creating refresh tokens properly. Create a custom handler:

**File:** `backend/accounts/views/auth_token.py` (create this new file)

```python
import json
import logging
from datetime import timedelta
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from oauth2_provider.models import AccessToken, RefreshToken, Application
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def refresh_token_handler(request):
    """
    Handle token refresh with guaranteed refresh token generation.
    
    Handles grant_type=refresh_token requests and ensures:
    1. Refresh token is valid and not expired
    2. New access token is generated
    3. New refresh token is generated
    """
    try:
        data = json.loads(request.body)
        grant_type = data.get('grant_type')
        refresh_token_str = data.get('refresh_token')
        client_id = data.get('client_id')
        client_secret = data.get('client_secret')
        
        # Validate input
        if grant_type != 'refresh_token':
            return JsonResponse(
                {'error': 'invalid_grant', 'error_description': 'Only refresh_token grant type supported here'},
                status=400
            )
        
        if not refresh_token_str:
            return JsonResponse(
                {'error': 'invalid_request', 'error_description': 'refresh_token is required'},
                status=400
            )
        
        # Find the refresh token
        try:
            refresh_token = RefreshToken.objects.select_related(
                'user', 'access_token', 'application'
            ).get(token=refresh_token_str)
        except RefreshToken.DoesNotExist:
            logger.warning(f"Invalid refresh token attempt")
            return JsonResponse(
                {'error': 'invalid_grant', 'error_description': 'Refresh token is invalid or expired'},
                status=401
            )
        
        # Check if refresh token is expired
        if refresh_token.is_expired():
            logger.warning(f"Expired refresh token for user {refresh_token.user.email}")
            refresh_token.delete()
            return JsonResponse(
                {'error': 'invalid_grant', 'error_description': 'Refresh token has expired'},
                status=401
            )
        
        # Validate client credentials
        app = refresh_token.application
        if app.client_id != client_id or app.client_secret != client_secret:
            logger.warning(f"Invalid OAuth2 credentials for user {refresh_token.user.email}")
            return JsonResponse(
                {'error': 'invalid_client', 'error_description': 'Client authentication failed'},
                status=401
            )
        
        # Generate new access token
        new_access_token = AccessToken.objects.create(
            user=refresh_token.user,
            token=AccessToken.generate_token(),
            application=app,
            expires=timezone.now() + timedelta(
                seconds=3600  # 1 hour - from settings
            ),
            scope='read write openid',
        )
        
        # Generate new refresh token (or reuse old one)
        new_refresh_token = RefreshToken.objects.create(
            user=refresh_token.user,
            token=RefreshToken.generate_token(),
            access_token=new_access_token,
            application=app,
            expires=timezone.now() + timedelta(days=30),
        )
        
        logger.info(f"Token refreshed for user {refresh_token.user.email}")
        
        return JsonResponse({
            'access_token': new_access_token.token,
            'token_type': 'Bearer',
            'expires_in': 3600,
            'refresh_token': new_refresh_token.token,
            'scope': 'read write openid',
        })
    
    except json.JSONDecodeError:
        return JsonResponse(
            {'error': 'invalid_request', 'error_description': 'Invalid JSON'},
            status=400
        )
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return JsonResponse(
            {'error': 'server_error', 'error_description': 'Internal server error'},
            status=500
        )
```

Then update your URLs to use this handler for refresh requests:

**File:** `backend/backend/urls.py`

```python
from accounts.views.auth_token import refresh_token_handler

urlpatterns = [
    # ... other paths ...
    path("auth/token/", oauth2_token_view, name="oauth2_token"),
    path("auth/refresh/", refresh_token_handler, name="auth_refresh"),  # NEW
    path("auth/", include("drf_social_oauth2.urls", namespace="drf")),
]
```

Then update frontend to use the dedicated refresh endpoint:

**File:** `frontend/app/api/auth/refresh/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: "refresh_token is required" },
        { status: 400 }
      )
    }

    console.log("[refresh-route] Attempting to refresh token")

    // Use dedicated refresh endpoint instead of token endpoint
    const response = await fetchFromAPI<AuthResponse>("/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.DJANGO_OAUTH_CLIENT_ID || "",
        client_secret: process.env.DJANGO_OAUTH_CLIENT_SECRET || "",
      }),
    })

    console.log("[refresh-route] Token refreshed successfully")
    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[refresh-route] Refresh failed:", errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    )
  }
}
```

## Testing the Fix

### 1. Create an OAuth2 app (if not exists):
```bash
python manage.py create_oauth_app
```

### 2. Test refresh token flow:
```bash
# Get initial token
curl -X POST http://localhost:8000/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "username": "user@example.com",
    "password": "password123",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'

# Response should include refresh_token:
{
  "access_token": "...",
  "refresh_token": "...",  # ← This must be present
  "expires_in": 3600,
  "token_type": "Bearer"
}

# Wait a few seconds, then use refresh token
curl -X POST http://localhost:8000/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "YOUR_REFRESH_TOKEN",
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET"
  }'

# Should return new access_token + new refresh_token
```

### 3. Check database:
```bash
python manage.py shell

from oauth2_provider.models import RefreshToken
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()

tokens = RefreshToken.objects.filter(user=user)
print(f"Refresh tokens: {tokens.count()}")
for t in tokens:
    print(f"  Expires: {t.expires}, Is expired: {t.is_expired()}")
```

## Summary of Changes

1. **Create** `backend/accounts/views/auth_token.py` - Dedicated refresh token handler
2. **Update** `backend/backend/urls.py` - Route to new refresh endpoint
3. **Update** `frontend/app/api/auth/refresh/route.ts` - Use dedicated refresh endpoint
4. **Ensure** OAuth2 app is created with proper credentials

## Why This Works

- ✅ Explicitly creates new refresh tokens on each refresh
- ✅ Validates refresh token is not expired
- ✅ Handles client authentication properly
- ✅ Returns both access_token AND refresh_token
- ✅ Frontend can continuously refresh without logging out
- ✅ Implements OAuth2 standard correctly
- ✅ Refresh tokens last 30 days as configured
- ✅ Access tokens last 1 hour as configured

## Verification Checklist

- [ ] OAuth2 app exists: `python manage.py create_oauth_app`
- [ ] New auth_token.py file created
- [ ] urls.py updated with new refresh endpoint
- [ ] frontend refresh/route.ts updated
- [ ] Test initial login returns refresh_token
- [ ] Test refresh endpoint with valid refresh_token
- [ ] Verify new access_token is returned
- [ ] Verify new refresh_token is returned
- [ ] Frontend session updates automatically
- [ ] User stays logged in for 30+ days (with continuous usage)
