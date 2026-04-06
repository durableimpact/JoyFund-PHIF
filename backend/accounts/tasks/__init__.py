"""
Celery tasks for accounts app.
"""

from .user_tasks import notify_admin_user_created

__all__ = ['notify_admin_user_created']
