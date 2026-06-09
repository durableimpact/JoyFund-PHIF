"""
LogService - Utility for logging activities, requests, and errors.
"""

import traceback
import uuid
import json
import logging
from typing import Optional, Any, Dict
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from .models import ActivityLog, ErrorLog
import botocore.exceptions

User = get_user_model()
logger = logging.getLogger(__name__)


class LogService:
    """
    Centralized logging service for the application.
    Handles user actions, system events, and error logging.
    """

    # Sentinel values for request context
    NO_REQUEST = None

    @staticmethod
    def _extract_request_meta(request: Optional[HttpRequest]) -> Dict[str, Any]:
        """
        Safely extract metadata from a request object.
        Returns empty defaults if request is None.
        """
        if request is None:
            return {
                'ip_address': None,
                'user_agent': '',
                'request_id': '',
            }

        # Get request_id (set by middleware)
        request_id = getattr(request, 'request_id', '')

        # Extract client IP
        ip_address = LogService._get_client_ip(request)

        # Extract user agent
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        return {
            'ip_address': ip_address,
            'user_agent': user_agent,
            'request_id': request_id,
        }

    @staticmethod
    def _get_client_ip(request: HttpRequest) -> Optional[str]:
        """
        Get the client's IP address from the request.
        Handles proxies and load balancers.
        """
        # Check for IP from a proxy
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
            return ip

        # Fall back to REMOTE_ADDR
        return request.META.get('REMOTE_ADDR')

    @staticmethod
    def _get_actor_label(user: Optional[User]) -> str:
        """
        Get a human-readable label for the actor (user).
        Primary identifier is email. Falls back to user ID.
        """
        if user is None:
            return 'anonymous'
        
        # Use email as primary identifier
        if hasattr(user, 'email') and user.email:
            return user.email
        
        # Fallback to user ID if no email
        return f'user_{user.pk}'

    @staticmethod
    def _log(
        level: str,
        request: Optional[HttpRequest],
        action: str,
        *,
        user: Optional[User] = None,
        description: str = '',
        target: Optional[Any] = None,
        metadata: Optional[Dict] = None,
    ) -> ActivityLog:
        """
        Internal method to log an activity.

        Args:
            level: Log level (INFO, WARNING, ERROR, CRITICAL)
            request: HTTP request object (can be None for system actions)
            action: Short action code (e.g., 'user.login')
            user: User object (optional)
            description: Human-readable description of the action
            target: Model instance affected by this action (optional)
            metadata: Extra structured data (optional)

        Returns:
            Created ActivityLog instance
        """
        if metadata is None:
            metadata = {}

        # Extract request metadata
        request_meta = LogService._extract_request_meta(request)

        # Determine actor label
        if user:
            actor_label = LogService._get_actor_label(user)
        else:
            actor_label = request_meta['ip_address'] or 'anonymous'

        # Extract target info
        target_type = None
        target_id = None
        target_label = None
        if target:
            target_type = target.__class__.__name__
            target_id = str(target.pk)
            target_label = str(target)

        try:
            log_entry = ActivityLog.objects.create(
                user=user,
                actor_label=actor_label,
                action=action,
                level=level,
                target_type=target_type,
                target_id=target_id,
                target_label=target_label,
                description=description,
                metadata=metadata,
                ip_address=request_meta['ip_address'],
                user_agent=request_meta['user_agent'],
                request_id=request_meta['request_id'],
            )
            return log_entry
        except Exception as e:
            # Log to console if there's an error creating the log entry
            logger.error(f"Failed to create activity log: {str(e)}")
            raise

    @staticmethod
    def info(
        request: Optional[HttpRequest],
        action: str,
        *,
        user: Optional[User] = None,
        description: str = '',
        target: Optional[Any] = None,
        metadata: Optional[Dict] = None,
    ) -> ActivityLog:
        """Log an INFO level activity."""
        return LogService._log(
            'INFO',
            request,
            action,
            user=user,
            description=description,
            target=target,
            metadata=metadata,
        )

    @staticmethod
    def warning(
        request: Optional[HttpRequest],
        action: str,
        *,
        user: Optional[User] = None,
        description: str = '',
        target: Optional[Any] = None,
        metadata: Optional[Dict] = None,
    ) -> ActivityLog:
        """Log a WARNING level activity."""
        return LogService._log(
            'WARNING',
            request,
            action,
            user=user,
            description=description,
            target=target,
            metadata=metadata,
        )

    @staticmethod
    def error(
        request: Optional[HttpRequest],
        action: str,
        *,
        user: Optional[User] = None,
        description: str = '',
        target: Optional[Any] = None,
        metadata: Optional[Dict] = None,
    ) -> ActivityLog:
        """Log an ERROR level activity."""
        return LogService._log(
            'ERROR',
            request,
            action,
            user=user,
            description=description,
            target=target,
            metadata=metadata,
        )

    @staticmethod
    def critical(
        request: Optional[HttpRequest],
        action: str,
        *,
        user: Optional[User] = None,
        description: str = '',
        target: Optional[Any] = None,
        metadata: Optional[Dict] = None,
    ) -> ActivityLog:
        """Log a CRITICAL level activity."""
        return LogService._log(
            'CRITICAL',
            request,
            action,
            user=user,
            description=description,
            target=target,
            metadata=metadata,
        )

    @staticmethod
    def system(
        action: str,
        *,
        description: str = '',
        target: Optional[Any] = None,
        metadata: Optional[Dict] = None,
    ) -> ActivityLog:
        """
        Log a system-level action (background tasks, cron jobs, etc.).
        No request object needed.
        """
        return LogService._log(
            'INFO',
            None,
            action,
            user=None,
            description=description,
            target=target,
            metadata=metadata,
        )

    @staticmethod
    def log_error(
        exc: Exception,
        request: Optional[HttpRequest] = None,
        extra: Optional[Dict] = None,
    ) -> ErrorLog:
        """
        Log an exception to ErrorLog with full traceback.

        Args:
            exc: The exception object
            request: HTTP request object (optional)
            extra: Extra context data (optional)

        Returns:
            Created ErrorLog instance
        """
        if extra is None:
            extra = {}

        # Extract request metadata
        request_meta = LogService._extract_request_meta(request)

        # Get the user from the request
        user = None
        path = ''
        if request:
            user = getattr(request, 'user', None)
            if user and not user.is_authenticated:
                user = None
            path = request.path

        # Get error details
        error_type = exc.__class__.__name__
        error_message = str(exc)
        stack_trace = traceback.format_exc()

        # Specific handling for B2/S3 errors
        if isinstance(exc, botocore.exceptions.ClientError):
            extra['b2_error_code'] = exc.response.get('Error', {}).get('Code')
            extra['b2_error_message'] = exc.response.get('Error', {}).get('Message')
            extra['b2_response_metadata'] = exc.response.get('ResponseMetadata')
            error_message = f"Backblaze B2 Error: {extra['b2_error_code']} - {extra['b2_error_message']}"
            logger.error(f"Backblaze B2 Storage Error: {error_message}", extra=extra)
        elif isinstance(exc, botocore.exceptions.EndpointConnectionError):
            error_message = f"Backblaze B2 Connection Error: {str(exc)}"
            logger.error(error_message)

        try:
            error_log = ErrorLog.objects.create(
                request_id=request_meta['request_id'],
                user=user,
                error_type=error_type,
                error_message=error_message,
                stack_trace=stack_trace,
                path=path,
                extra=extra,
            )
            return error_log
        except Exception as e:
            # Log to console if there's an error creating the error log
            logger.error(f"Failed to create error log: {str(e)}")
            raise
