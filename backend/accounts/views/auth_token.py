"""
OAuth2 Token Handler - Ensures proper refresh token generation and handling.

This module handles:
1. Token refresh requests (grant_type=refresh_token)
2. Validation of refresh tokens
3. Generation of new access tokens (1 hour validity)
4. Generation of new refresh tokens (30 days validity)
"""

import json
import logging
from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from oauth2_provider.models import AccessToken, RefreshToken

logger = logging.getLogger(__name__)

# Access token expiration in seconds (from settings)
ACCESS_TOKEN_EXPIRE_SECONDS = 3600  # 1 hour


@csrf_exempt
@require_http_methods(["POST"])
def refresh_token_handler(request):
    """
    Handle OAuth2 refresh token requests.

    Accepts POST requests with:
    - grant_type: "refresh_token" (required)
    - refresh_token: The refresh token string (required)
    - client_id: OAuth2 client ID (required)
    - client_secret: OAuth2 client secret (required)

    Returns:
    - access_token: New access token (1 hour validity)
    - refresh_token: New refresh token (30 days validity)
    - expires_in: Expiration time in seconds (3600)
    - token_type: Always "Bearer"
    - scope: "read write openid"

    HTTP Status Codes:
    - 200: Success
    - 400: Invalid request parameters
    - 401: Invalid or expired refresh token / Invalid client credentials
    - 500: Server error
    """
    try:
        # Parse JSON request
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "invalid_request", "error_description": "Invalid JSON"},
                status=400,
            )

        # Extract parameters
        grant_type = data.get("grant_type")
        refresh_token_str = data.get("refresh_token")
        client_id = data.get("client_id")
        client_secret = data.get("client_secret")

        # Validate grant type
        if grant_type != "refresh_token":
            return JsonResponse(
                {
                    "error": "unsupported_grant_type",
                    "error_description": "Only refresh_token grant type is supported",
                },
                status=400,
            )

        # Validate required parameters
        if not refresh_token_str:
            return JsonResponse(
                {
                    "error": "invalid_request",
                    "error_description": "refresh_token is required",
                },
                status=400,
            )

        if not client_id or not client_secret:
            return JsonResponse(
                {
                    "error": "invalid_client",
                    "error_description": "client_id and client_secret are required",
                },
                status=401,
            )

        # Find the refresh token in database
        try:
            refresh_token = RefreshToken.objects.select_related(
                "user", "access_token", "application"
            ).get(token=refresh_token_str)
        except RefreshToken.DoesNotExist:
            logger.warning(f"Refresh token not found: {refresh_token_str[:20]}...")
            return JsonResponse(
                {
                    "error": "invalid_grant",
                    "error_description": "Invalid refresh token",
                },
                status=401,
            )

        # Check if refresh token is expired
        if refresh_token.is_expired():
            logger.warning(f"Expired refresh token for user {refresh_token.user.email}")
            refresh_token.delete()
            return JsonResponse(
                {
                    "error": "invalid_grant",
                    "error_description": "Refresh token has expired",
                },
                status=401,
            )

        # Validate OAuth2 application credentials
        app = refresh_token.application
        if app.client_id != client_id or app.client_secret != client_secret:
            logger.warning(
                f"Invalid OAuth2 credentials for user {refresh_token.user.email}"
            )
            return JsonResponse(
                {
                    "error": "invalid_client",
                    "error_description": "Client authentication failed",
                },
                status=401,
            )

        # Generate new access token
        new_access_token = AccessToken.objects.create(
            user=refresh_token.user,
            token=AccessToken.generate_token(),
            application=app,
            expires=timezone.now() + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS),
            scope="read write openid",
        )

        # Generate new refresh token
        new_refresh_token = RefreshToken.objects.create(
            user=refresh_token.user,
            token=RefreshToken.generate_token(),
            access_token=new_access_token,
            application=app,
            expires=timezone.now() + timedelta(days=30),  # 30 days
        )

        logger.info(f"Token refreshed successfully for user {refresh_token.user.email}")

        return JsonResponse(
            {
                "access_token": new_access_token.token,
                "token_type": "Bearer",
                "expires_in": ACCESS_TOKEN_EXPIRE_SECONDS,
                "refresh_token": new_refresh_token.token,
                "scope": "read write openid",
            }
        )

    except Exception as e:
        logger.error(f"Unexpected error in token refresh: {str(e)}", exc_info=True)
        return JsonResponse(
            {
                "error": "server_error",
                "error_description": "Internal server error during token refresh",
            },
            status=500,
        )
