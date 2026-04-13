"""
WebSocket authentication middleware for Django Channels.

Provides OAuth2 access token validation and user extraction from query params
and headers, populating scope['user'] for consumer access.

Supports drf-social-oauth2/django-oauth-toolkit access tokens.
"""

import logging
from typing import Callable, Any

from .auth import get_user_from_oauth2_token, extract_token_from_scope

logger = logging.getLogger(__name__)


class JwtAuthMiddleware:
    """
    Middleware to authenticate WebSocket connections via JWT tokens.
    
    Extracted from query params (?token=...), Authorization header,
    or provided by upstream middleware (e.g., AuthMiddlewareStack for cookies).
    
    Populates scope['user'] for downstream consumers.
    """
    
    def __init__(self, inner: Callable) -> None:
        """
        Initialize middleware.
        
        Args:
            inner: Inner ASGI application
        """
        self.inner = inner
    
    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> Any:
        """
        ASGI interface.
        
        Args:
            scope: ASGI scope dictionary
            receive: ASGI receive callable
            send: ASGI send callable
        """
        # Only process WebSocket connections
        if scope['type'] != 'websocket':
            await self.inner(scope, receive, send)
            return
        
        # Extract OAuth2 access token from scope
        token = await extract_token_from_scope(scope)
        
        if token:
            # Validate token and get user
            user = await get_user_from_oauth2_token(token)
            if user:
                scope['user'] = user
                logger.debug(f"Authenticated user {user.id} via OAuth2 access token")
            else:
                logger.debug("OAuth2 access token invalid or expired")
        
        # Continue to inner application (URLRouter, consumers, etc.)
        await self.inner(scope, receive, send)


def jwt_auth_middleware_stack(inner: Callable) -> JwtAuthMiddleware:
    """
    Create a JWT authentication middleware stack.
    
    Usage in routing.py:
        from channels.routing import ProtocolTypeRouter, URLRouter
        from channels.auth import AuthMiddlewareStack
        from .middleware import jwt_auth_middleware_stack
        
        application = ProtocolTypeRouter({
            "websocket": jwt_auth_middleware_stack(
                URLRouter(websocket_urlpatterns)
            ),
        })
    
    Args:
        inner: Inner ASGI application
        
    Returns:
        JwtAuthMiddleware instance
    """
    return JwtAuthMiddleware(inner)
