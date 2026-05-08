"""
Async authentication helpers for WebSocket consumers.

Provides OAuth2 access token validation and user extraction from tokens
for use in AsyncWebsocketConsumer and middleware.

Supports auth via drf-social-oauth2/django-oauth-toolkit access tokens.
"""

import logging
from datetime import datetime
from django.conf import settings
from django.contrib.auth import get_user_model
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

User = get_user_model()


async def get_user_from_oauth2_token(token: str) -> Optional[User]:
    """
    Extract and validate OAuth2 access token, returning the associated user.
    
    Uses django-oauth-toolkit OAuth2AccessToken model (provided by drf-social-oauth2).
    
    Args:
        token: OAuth2 access token string
        
    Returns:
        User instance if token is valid and not expired, None otherwise
    """
    if not token:
        return None
    
    try:
        from oauth2_provider.models import AccessToken
        
        # Look up token in database
        access_token = await _get_access_token_async(token)
        
        if not access_token:
            logger.debug(f"OAuth2 access token not found or invalid")
            return None
        
        # Check if token is expired
        if access_token.is_expired():
            logger.debug(f"OAuth2 access token has expired")
            return None
        
        # Return associated user
        return access_token.user
            
    except Exception as e:
        logger.error(f"Error validating OAuth2 access token: {str(e)}")
        return None


async def _get_access_token_async(token: str) -> Optional['AccessToken']:
    """
    Fetch OAuth2AccessToken from database asynchronously.
    
    Args:
        token: OAuth2 access token string
        
    Returns:
        AccessToken instance if found, None otherwise
    """
    from asgiref.sync import sync_to_async
    
    @sync_to_async
    def get_token():
        try:
            from oauth2_provider.models import AccessToken
            return AccessToken.objects.select_related('user').get(token=token)
        except AccessToken.DoesNotExist:
            return None
    
    return await get_token()


async def extract_token_from_scope(scope: Dict[str, Any]) -> Optional[str]:
    """
    Extract OAuth2 access token from WebSocket scope.
    
    Tries to get token from:
    1. Query string parameter: ?token=... (OAuth2 convention)
    2. Authorization header: Authorization: Bearer <token> (HTTP standard)
    
    Args:
        scope: ASGI scope dictionary
        
    Returns:
        Token string if found, None otherwise
    """
    # Try query string first: ?token=...
    query_string = scope.get('query_string', b'').decode()
    if 'token=' in query_string:
        # Simple query string parsing
        for param in query_string.split('&'):
            if param.startswith('token='):
                return param.split('=', 1)[1]
    
    # Try Authorization header (standard HTTP Bearer token)
    headers = dict(scope.get('headers', []))
    auth_header = headers.get(b'authorization', b'').decode()
    if auth_header.startswith('Bearer '):
        return auth_header[7:]  # Remove 'Bearer ' prefix
    
    return None


async def is_user_authenticated(scope: Dict[str, Any]) -> bool:
    """
    Check if user is authenticated based on WebSocket scope.
    
    Args:
        scope: ASGI scope dictionary
        
    Returns:
        True if user is authenticated, False otherwise
    """
    user = scope.get('user')
    return user is not None and user.is_authenticated if hasattr(user, 'is_authenticated') else False


def get_user_role(user: User) -> Optional[str]:
    """
    Get user role from user instance.
    
    Args:
        user: User instance
        
    Returns:
        User role string (e.g., 'DONOR', 'HOSPITAL_ADMIN') or None
    """
    if hasattr(user, 'role'):
        return user.role
    return None


def is_admin(user: User) -> bool:
    """
    Check if user is an admin (SYSTEM_ADMIN or HOSPITAL_ADMIN).
    
    Args:
        user: User instance
        
    Returns:
        True if user is admin, False otherwise
    """
    role = get_user_role(user)
    return role in ['SYSTEM_ADMIN', 'HOSPITAL_ADMIN']


def is_hospital_staff(user: User) -> bool:
    """
    Check if user is hospital staff (HOSPITAL_ADMIN or RECEPTIONIST).
    
    Args:
        user: User instance
        
    Returns:
        True if user is hospital staff, False otherwise
    """
    role = get_user_role(user)
    return role in ['HOSPITAL_ADMIN', 'RECEPTIONIST']
