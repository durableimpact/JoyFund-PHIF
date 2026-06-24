"""
Custom DRF exception handler with logging.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from .services import LogService


def custom_exception_handler(exc, context):
    """
    Custom exception handler that logs exceptions and passes them to DRF's default handler.

    Called by DRF automatically for all exceptions raised in views.
    """
    # Call the default exception handler first
    response = exception_handler(exc, context)

    # Get request from context
    request = context.get('request')

    # Get the user if available
    user = None
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        user = request.user

    # Get the view to determine more context
    view = context.get('view')
    view_name = view.__class__.__name__ if view else 'Unknown'

    # Handle unhandled exceptions (response is None)
    if response is None:
        # Log the unhandled exception
        LogService.log_error(exc, request, extra={'view': view_name})
        
        # Also print to console for easier debugging in dev
        import traceback
        print("\n" + "="*80)
        print(f"UNHANDLED EXCEPTION in {view_name}")
        print(f"Path: {request.path if request else 'Unknown'}")
        print(f"Error: {str(exc)}")
        traceback.print_exc()
        print("="*80 + "\n")
        
        # Return a generic 500 response with both 'error' and 'detail'
        # for frontend compatibility (DRF convention uses 'detail')
        error_msg = str(exc) if str(exc) else 'An unexpected error occurred'
        return Response(
            {'error': error_msg, 'detail': error_msg},
            status=500,
        )

    # Handle handled exceptions with status >= 500
    if response.status_code >= 500:
        LogService.error(
            request,
            f'server_error.{response.status_code}',
            user=user,
            description=f'Server error in {view_name}: {str(exc)}',
            metadata={
                'view': view_name,
                'status_code': response.status_code,
                'exception_type': exc.__class__.__name__,
            },
        )

    # Handle 4xx client errors (401, 403, 429)
    elif response.status_code in [401, 403, 429]:
        action_map = {
            401: 'auth.unauthorized',
            403: 'auth.forbidden',
            429: 'api.rate_limit_exceeded',
        }
        action = action_map.get(response.status_code, 'client_error')

        LogService.warning(
            request,
            action,
            user=user,
            description=f'{response.status_code} error in {view_name}',
            metadata={
                'view': view_name,
                'status_code': response.status_code,
                'exception_type': exc.__class__.__name__,
            },
        )

    return response
