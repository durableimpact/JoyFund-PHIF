"""
Celery tasks for user account events.

Handles:
- Notifying admin dashboard when a donor account is created
"""

import logging
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

channel_layer = get_channel_layer()


@shared_task(bind=True, max_retries=3)
def notify_admin_user_created(self, user_id: int, user_data: dict):
    """
    Notify admin dashboard when a new donor or patient account is created.
    
    Broadcasts to admin_dashboard group and creates Notification DB record.
    
    Args:
        user_id: ID of newly created user
        user_data: Dictionary with user details (email, full_name, role, etc.)
    """
    try:
        from django.contrib.auth import get_user_model
        from notifications.models import Notification
        from accounts.utils.permissions import is_system_admin
        
        User = get_user_model()
        
        # Verify user exists
        try:
            user = User.objects.get(id=user_id)
            logger.info(f"User {user_id} verified, creating notification for {user_data.get('role', 'User')} account")
        except User.DoesNotExist:
            logger.error(f"User {user_id} not found for notification")
            return
        
        # Create notification record in database
        notification = Notification.objects.create(
            user=user,
            title=f"New {user_data.get('role', 'User')} Account Created",
            message=f"{user_data.get('full_name', 'A user')} ({user_data.get('email')}) has created an account.",
            notification_type='SYSTEM',
            description=f"User role: {user_data.get('role', 'Unknown')}",
        )
        
        logger.info(f"Created notification record: {notification.id}")
        
        # Broadcast to admin_dashboard group via WebSocket
        message_data = {
            'type': 'notification_event',
            'event': 'user_created',
            'timestamp': notification.created_at.isoformat(),
            'data': {
                'id': user.id,
                'title': notification.title,
                'message': notification.message,
                'notification_id': notification.id,
                'object': {
                    'user_id': user.id,
                    'email': user.email,
                    'full_name': user_data.get('full_name', ''),
                    'role': user_data.get('role', ''),
                    'created_at': user.date_joined.isoformat() if user.date_joined else None,
                }
            }
        }
        
        # Send to admin dashboard group
        async def broadcast():
            await channel_layer.group_send('admin_dashboard', message_data)
        
        async_to_sync(broadcast)()
        logger.info(f"Broadcasted user_created event to admin_dashboard: {user.id}")
        
    except Exception as exc:
        logger.error(f"Error in notify_admin_user_created: {str(exc)}", exc_info=True)
        # Retry up to 3 times with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
