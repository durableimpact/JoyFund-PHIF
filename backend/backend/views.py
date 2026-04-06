from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, csrf_exempt


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
