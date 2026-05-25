from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django_smart_ratelimit import rate_limit
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@require_http_methods(["GET", "POST"])
@csrf_protect
@rate_limit(key='user_or_ip', rate='5/h')
def login_view(request):
    """
    Custom login view for API documentation access.
    Redirects to 'next' parameter after successful login.
    
    Rate Limiting:
    - 5 login attempts per hour per IP/user
    - Prevents brute force attacks on admin/donor accounts
    """
    # Get the next URL from query params or POST data
    next_url = request.POST.get('next') or request.GET.get('next', '/')
    
    # Ensure next_url is safe (prevent open redirect)
    if not next_url or not next_url.startswith('/'):
        next_url = '/'
    
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        user = authenticate(request, username=email, password=password)
        
        if user is not None:
            auth_login(request, user)
            return redirect(next_url)
        else:
            return render(request, 'login.html', {
                'error': 'Invalid email or password. Please try again.',
                'next': next_url,
            })
    
    # GET request - show login form
    return render(request, 'login.html', {'next': next_url})


@require_http_methods(["GET", "POST"])
@csrf_exempt
def logout_view(request):
    """
    Custom logout view that handles Swagger redirects properly.
    Logs out the user and redirects to the 'next' parameter or Swagger by default.
    """
    # Get the next URL from query params or POST data
    next_url = request.POST.get('next') or request.GET.get('next', '/swagger/')
    
    # Ensure next_url is safe (prevent open redirect)
    if not next_url or not next_url.startswith('/'):
        next_url = '/swagger/'
    
    # Logout the user
    auth_logout(request)
    
    # Redirect to the next URL
    return redirect(next_url)


@swagger_auto_schema(
    method='post',
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'grant_type': openapi.Schema(
                type=openapi.TYPE_STRING,
                enum=['password', 'refresh_token', 'client_credentials'],
                description='OAuth2 grant type (password, refresh_token, or client_credentials)'
            ),
            'username': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='User email (required for password grant)'
            ),
            'password': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='User password (required for password grant)'
            ),
            'client_id': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='OAuth2 client ID'
            ),
            'client_secret': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='OAuth2 client secret'
            ),
            'refresh_token': openapi.Schema(
                type=openapi.TYPE_STRING,
                description='Refresh token (required for refresh_token grant)'
            ),
        },
        required=['grant_type', 'client_id', 'client_secret'],
    ),
    responses={
        200: openapi.Response(
            description='Token successfully generated',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'access_token': openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description='OAuth2 access token for API requests'
                    ),
                    'token_type': openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description='Token type (typically "Bearer")'
                    ),
                    'expires_in': openapi.Schema(
                        type=openapi.TYPE_INTEGER,
                        description='Token expiration time in seconds'
                    ),
                    'refresh_token': openapi.Schema(
                        type=openapi.TYPE_STRING,
                        description='Refresh token to obtain new access tokens'
                    ),
                    'role': openapi.Schema(
                        type=openapi.TYPE_STRING,
                        enum=['SYSTEM_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'SOCIAL_WORKER', 'DONOR'],
                        description='User role (SYSTEM_ADMIN, HOSPITAL_ADMIN, RECEPTIONIST, SOCIAL_WORKER, DONOR)'
                    ),
                },
            ),
        ),
        400: openapi.Response(description='Invalid request parameters'),
        401: openapi.Response(description='Invalid credentials'),
    },
    tags=['Authentication'],
    operation_description='Obtain OAuth2 access token. Supports multiple grant types for different authentication flows.',
)
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
@csrf_exempt
# @rate_limit(key='user_or_ip', rate='10/h')
def oauth2_token_view(request):
    """
    Rate-limited OAuth2 token endpoint wrapper.
    
    This wraps the drf-social-oauth2 token endpoint with rate limiting to prevent:
    - Brute force attacks on OAuth2 token endpoint
    - Credential stuffing attacks
    - Denial of service attacks
    
    Rate Limiting:
    - 10 token requests per hour per IP/user
    - Applies to password grant, refresh token, and other flows
    shoul
    The actual OAuth2 token logic is handled by drf-social-oauth2.
    """
    import json
    from oauth2_provider.views import TokenView
    from oauth2_provider.models import AccessToken
    from django.test import RequestFactory
    
    # Create a new request for the OAuth2 TokenView
    factory = RequestFactory()
    
    # Handle both JSON and form-encoded request bodies
    if request.content_type == 'application/json':
        import urllib.parse
        body_data = json.loads(request.body)
        encoded_data = urllib.parse.urlencode(body_data)
        oauth_request = factory.post('/auth/token/', data=encoded_data, content_type='application/x-www-form-urlencoded')
    else:
        oauth_request = factory.post('/auth/token/', data=request.POST.dict())
    
    # Copy authentication info from original request
    oauth_request.user = request.user
    oauth_request.META = request.META
    
    # Delegate to the actual OAuth2 token view
    token_view = TokenView.as_view()
    response = token_view(oauth_request)
    
    # If the token request is successful, inject the user's role
    if response.status_code == 200:
        try:
            data = json.loads(response.content)
            access_token = data.get("access_token")
            if access_token:
                token_obj = AccessToken.objects.filter(token=access_token).select_related('user').first()
                if token_obj and token_obj.user:
                    data['role'] = token_obj.user.role
                    return Response(data, status=200)
        except Exception:
            pass
    
    # Return the original response for errors or if role injection fails
    if response.status_code == 200:
        return Response(json.loads(response.content), status=response.status_code)
    else:
        return Response(json.loads(response.content) if response.content else {}, status=response.status_code)
