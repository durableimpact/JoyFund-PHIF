"""
Celery tasks for the accounts app.

Handles async operations like user notifications.
"""

from celery import shared_task
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(bind=True, max_retries=3)
def notify_admin_user_created(
    self,
    user_id: int,
    user_data: dict = None
):
    """
    Notify admins when a new donor user is created.
    
    Broadcasts to admin_dashboard group via WebSocket and creates
    database notification records for offline admins.
    
    Args:
        user_id: ID of the newly created user
        user_data: Optional dict with user details for rendering
    """
    try:
        user = User.objects.get(id=user_id)
        channel_layer = get_channel_layer()
        
        # Prepare message
        message_data = {
            'type': 'notification_event',
            'data': {
                'id': str(user.id),
                'title': 'New User Registration',
                'message': f'New {user.get_role_display()} account created: {user.full_name} ({user.email})',
                'notification_type': 'USER_CREATED',
                'object': {
                    'user_id': str(user.id),
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role,
                    'created_at': user.created_at.isoformat() if hasattr(user, 'created_at') else None,
                }
            }
        }
        
        # Broadcast to admin_dashboard group
        async def broadcast():
            await channel_layer.group_send('admin_dashboard', message_data)
        
        async_to_sync(broadcast)()
        
        # Create database notification records for offline admins
        admins = User.objects.filter(role='SYSTEM_ADMIN')
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title=message_data['data']['title'],
                message=message_data['data']['message'],
                notification_type='USER_CREATED',
            )
        
        logger.info(f"Notified admins about new user {user.id}")
        
    except User.DoesNotExist:
        logger.warning(f"User {user_id} not found for notification")
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
