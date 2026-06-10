"""
Logging middleware for tracking HTTP requests and responses.
"""

import uuid
import time
import json
import logging
from typing import Callable, Any
from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.urls import resolve, Resolver404
from .models import RequestLog

logger = logging.getLogger(__name__)

# Paths to skip logging
SKIP_PATHS = [
    '/admin/',
    '/static/',
    '/media/',
    '/health/',
    '/health/live/',
    '/health/ready/',
    '/favicon.ico',
    '/_next/',  # Next.js dev server
    '/__webpack_hmr',  # Webpack hot reload
]

# Sensitive keys to redact
SENSITIVE_KEYS = {
    'password',
    'token',
    'secret',
    'authorization',
    'card_number',
    'cvv',
    'api_key',
    'api_secret',
    'refresh_token',
    'access_token',
}


class LoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all HTTP requests and responses.

    Adds a unique request_id to each request and logs the request/response
    to the RequestLog model. Sanitizes sensitive data.
    """

    def process_request(self, request: HttpRequest) -> None:
        """
        Process the incoming request.
        Generate a request_id and store the start time.
        """
        # Generate unique request ID
        request.request_id = str(uuid.uuid4())

        # Store start time for duration calculation
        request._start_time = time.time()

        # Check if we should skip logging for this path
        request._skip_logging = self._should_skip_path(request.path)

    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """
        Process the response and log the request/response.
        """
        # Add request_id to response headers for debugging
        response['X-Request-ID'] = request.request_id

        # Skip logging if path is in skip list
        if getattr(request, '_skip_logging', False):
            return response

        try:
            # Calculate response time
            start_time = getattr(request, '_start_time', None)
            if start_time:
                response_time_ms = int((time.time() - start_time) * 1000)
            else:
                response_time_ms = 0

            # Extract request metadata
            user = request.user if hasattr(request, 'user') else None
            if user and not user.is_authenticated:
                user = None

            # Get client IP
            ip_address = self._get_client_ip(request)

            # Resolve view name and action
            view_name = ''
            action = ''
            try:
                match = resolve(request.path_info)
                view_name = match.view_name
                action = self._get_action_description(request, match)
            except Resolver404:
                view_name = 'not_found'
                action = f'Accessed unknown path: {request.path}'

            # Get request body (only for non-GET/HEAD requests)
            request_body = ''
            if request.method not in ['GET', 'HEAD']:
                request_body = self._get_sanitized_request_body(request)

            # Parse query parameters
            query_params = dict(request.GET.items()) if request.GET else {}

            # Get referrer
            referrer = request.META.get('HTTP_REFERER', '')

            # Get user agent
            user_agent = request.META.get('HTTP_USER_AGENT', '')

            # Create RequestLog entry
            RequestLog.objects.create(
                request_id=request.request_id,
                user=user,
                method=request.method,
                path=request.path,
                view_name=view_name,
                action=action,
                query_params=query_params,
                request_body=request_body,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                ip_address=ip_address,
                user_agent=user_agent,
                referrer=referrer,
            )
        except Exception as e:
            # Never let logging errors break the actual request
            logger.exception(f"Error logging request: {str(e)}")

        return response

    @staticmethod
    def _should_skip_path(path: str) -> bool:
        """Check if the path should be skipped from logging."""
        for skip_path in SKIP_PATHS:
            if path.startswith(skip_path):
                return True
        return False

    @staticmethod
    def _get_action_description(request: HttpRequest, match: Any) -> str:
        """
        Generate a human-readable action description.
        """
        view_name = match.view_name
        method = request.method
        
        # DRF ViewSet actions mapping
        action_map = {
            'list': 'Viewed List',
            'retrieve': 'Viewed Details',
            'create': 'Created',
            'update': 'Updated',
            'partial_update': 'Updated (Partial)',
            'destroy': 'Deleted',
        }

        # Try to get DRF action
        drf_action = getattr(match.func, 'actions', {}).get(method.lower())
        if not drf_action:
            # Fallback if it's an @action decorated method
            drf_action = getattr(match.func, 'cls', None)
            if drf_action and hasattr(request, 'method'):
                # This is more complex for standard APIViews, but view_name usually suffices
                pass
        
        # Determine resource name from view name (e.g., 'campaign-list' -> 'Campaign')
        resource = view_name.split(':')[-1].replace('-list', '').replace('-detail', '').replace('_', ' ').title()
        
        action_desc = action_map.get(drf_action, method)
        
        if drf_action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return f"{action_desc} {resource}"
        
        # Handle custom actions (like 'stats', 'verify', etc.)
        if drf_action:
            return f"Performed {drf_action.replace('_', ' ')} on {resource}"

        return f"{method} {request.path}"

    @staticmethod
    def _get_client_ip(request: HttpRequest) -> str:
        """
        Get the client's IP address.
        Handles proxies and X-Forwarded-For headers.
        """
        # Check for IP from a proxy
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
            return ip

        # Fall back to REMOTE_ADDR
        return request.META.get('REMOTE_ADDR', '')

    @staticmethod
    def _get_sanitized_request_body(request: HttpRequest) -> str:
        """
        Get request body with sensitive data redacted.
        Safely handles multipart/form-data and binary content.
        """
        try:
            # Check content type
            content_type = request.META.get('CONTENT_TYPE', '')
            
            # Skip logging binary content types
            if 'multipart/form-data' in content_type:
                # For multipart/form-data, just log field names, not values
                return '[multipart/form-data - binary file data not logged]'
            
            if any(binary_type in content_type for binary_type in ['image/', 'video/', 'audio/', 'application/octet-stream']):
                return '[binary file data not logged]'
            
            # Try to get raw body
            if hasattr(request, '_body'):
                body = request._body
            else:
                body = request.body

            # Handle empty body
            if not body:
                return ''

            # Decode if bytes, replace NUL and other invalid characters
            if isinstance(body, bytes):
                # Replace NUL bytes and other problematic characters with placeholder
                body_bytes = body.replace(b'\x00', b'[NUL]')
                body_str = body_bytes.decode('utf-8', errors='replace')
            else:
                body_str = body

            # Limit body size to prevent huge logs
            max_size = 5000
            if len(body_str) > max_size:
                body_str = body_str[:max_size] + f'... (truncated, total size: {len(body_str)} bytes)'

            # Try to parse as JSON and redact sensitive fields
            try:
                body_json = json.loads(body_str)
                sanitized = LoggingMiddleware._redact_dict(body_json)
                return json.dumps(sanitized)
            except (json.JSONDecodeError, ValueError):
                # If not JSON, return the body as is (safe since we truncated it and replaced NULs)
                return body_str

        except Exception as e:
            logger.debug(f"Error reading request body: {str(e)}")
            return '[unable to read body]'

    @staticmethod
    def _redact_dict(data: Any) -> Any:
        """
        Redact sensitive fields in a dictionary or list.
        Recursively processes nested structures.
        """
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if key.lower() in SENSITIVE_KEYS:
                    result[key] = '[REDACTED]'
                else:
                    result[key] = LoggingMiddleware._redact_dict(value)
            return result
        elif isinstance(data, list):
            return [LoggingMiddleware._redact_dict(item) for item in data]
        else:
            return data
