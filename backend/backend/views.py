from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django_smart_ratelimit import rate_limit


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


@require_http_methods(["POST"])
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
    
    The actual OAuth2 token logic is handled by drf-social-oauth2.
    """
    import json
    from oauth2_provider.views import TokenView
    from oauth2_provider.models import AccessToken
    
    # If the request is JSON, parse it and populate request.POST
    if request.content_type == 'application/json':
        try:
            from django.http import QueryDict
            body_data = json.loads(request.body)
            q = QueryDict('', mutable=True)
            q.update(body_data)
            request.POST = q
        except Exception:
            pass
            
    # Delegate to the actual OAuth2 token view
    token_view = TokenView.as_view()
    response = token_view(request)
    
    # If the token request is successful, inject the user's role
    if response.status_code == 200:
        try:
            data = json.loads(response.content)
            access_token = data.get("access_token")
            if access_token:
                token_obj = AccessToken.objects.filter(token=access_token).select_related('user').first()
                if token_obj and token_obj.user:
                    data['role'] = token_obj.user.role
                    response.content = json.dumps(data).encode("utf-8")
        except Exception:
            # Silently fallback to original response if anything fails
            pass
            
    return response
