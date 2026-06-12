from django.conf import settings
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.tasks.send_mail import send_async_email


@require_http_methods(["GET", "POST"])
@csrf_protect
def login_view(request):
    """
    Custom login view for API documentation access.
    Redirects to 'next' parameter after successful login.
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
def oauth2_token_view(request):
    """
    OAuth2 token endpoint wrapper.
    
    This wraps the drf-social-oauth2 token endpoint.
    The actual OAuth2 token logic is handled by drf-social-oauth2.
    """
    import json
    from oauth2_provider.views import TokenView
    from oauth2_provider.models import AccessToken
    from django.http import QueryDict
    from accounts.models import UserDevice
    from accounts.utils.user_agent import parse_user_agent
    
    try:
        # Get the underlying Django request from the DRF Request object
        django_request = request._request
        
        # Handle JSON content type by converting to form data
        if request.content_type == 'application/json':
            try:
                body_data = json.loads(request.body)
            except json.JSONDecodeError:
                return Response(
                    {'error': 'Invalid JSON in request body'},
                    status=400
                )
            
            # Convert JSON data to QueryDict (form data format)
            # Create a mutable QueryDict and update it with the JSON data
            query_dict = QueryDict(mutable=True)
            for key, value in body_data.items():
                query_dict[key] = value
            
            # Set the POST data on the underlying Django request
            django_request.POST = query_dict
            
            # Update content type to form-encoded since OAuth2 expects form data
            django_request.META['CONTENT_TYPE'] = 'application/x-www-form-urlencoded'
        
        # Delegate to the actual OAuth2 token view
        token_view = TokenView.as_view()
        response = token_view(django_request)
        
        # Log the response for debugging
        print(f"OAuth2 Response Status: {response.status_code}")
        print(f"OAuth2 Response Content: {response.content}")
        
        # If the token request is successful, inject the user's role and record device
        if response.status_code == 200:
            try:
                response_data = json.loads(response.content.decode('utf-8'))
                access_token = response_data.get("access_token")
                
                if access_token:
                    token_obj = AccessToken.objects.filter(
                        token=access_token
                    ).select_related('user').first()
                    
                    if token_obj and token_obj.user:
                        response_data['role'] = token_obj.user.role
                        
                        # Record device only on initial password login, not refresh
                        if django_request.POST.get('grant_type') == 'password':
                            # Use browser's UA forwarded from frontend, fall back to server UA
                            user_agent_str = (
                                django_request.META.get('HTTP_X_DEVICE_USER_AGENT', '')
                                or django_request.META.get('HTTP_USER_AGENT', '')
                            )
                            ip = django_request.META.get('REMOTE_ADDR', '')
                            device_info = parse_user_agent(user_agent_str)
                            
                            device, created = UserDevice.objects.update_or_create(
                                user=token_obj.user,
                                user_agent=user_agent_str,
                                ip_address=ip,
                                defaults={
                                    'device_name': device_info['device_name'],
                                    'device_type': device_info['device_type'],
                                    'browser': device_info['browser'],
                                    'os': device_info['os'],
                                    'access_token': token_obj,
                                },
                            )

                            if created and UserDevice.objects.filter(
                                user=token_obj.user,
                            ).exclude(id=device.id).exists():
                                _send_new_device_notification(
                                    token_obj.user,
                                    device_info,
                                    ip,
                                    user_agent_str,
                                )
                        
                        return Response(response_data, status=200)
                
                return Response(response_data, status=200)
            except (json.JSONDecodeError, Exception) as e:
                # If role injection fails, return original response
                return response
        
        # Handle error responses
        try:
            error_data = json.loads(response.content.decode('utf-8'))
            return Response(error_data, status=response.status_code)
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid response from token server'},
                status=response.status_code
            )
    
    except Exception as e:
        import traceback
        # Log the full error for debugging
        print(f"OAuth2 Token Error: {str(e)}")
        print(traceback.format_exc())
        
        return Response(
            {'error': 'Internal server error during token generation'},
            status=500
        )


def _send_new_device_notification(user, device_info, ip, user_agent_str):
    subject = "New device signed in to your JoyFund account"
    context = {
        "user_name": user.first_name or user.email,
        "device_name": device_info["device_name"] or "Unknown device",
        "device_type": device_info["device_type"] or "Unknown",
        "browser": device_info["browser"] or "Unknown",
        "os": device_info["os"] or "Unknown",
        "ip_address": ip or "Unknown",
        "user_agent": user_agent_str or "Unknown",
        "signed_in_at": timezone.now().strftime("%B %d, %Y at %H:%M UTC"),
        "app_url": settings.FRONTEND_URL,
    }
    html_message = render_to_string("emails/new_device_login.html", context)
    send_async_email.delay(
        subject=subject,
        recipient_email=user.email,
        html_message=html_message,
    )
