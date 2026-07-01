import json
import logging

from celery import shared_task
from django.contrib.auth import get_user_model
from pywebpush import WebPushException, webpush

from django.conf import settings

User = get_user_model()

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def execute_push_broadcast_task(self, task_id):
    """
    Send push notifications asynchronously for a PushBroadcastTask.

    Runs in Celery worker. Updates the task's sent/failed counters in the DB
    as it goes so the frontend can poll for live progress.
    """
    from notifications.models import PushBroadcastTask, PushSubscription
    from notifications.webpush import _get_absolute_url

    try:
        task = PushBroadcastTask.objects.get(id=task_id)
    except PushBroadcastTask.DoesNotExist:
        logger.error(f"PushBroadcastTask {task_id} not found")
        return

    task.status = PushBroadcastTask.Status.RUNNING
    task.save(update_fields=["status"])

    try:
        if task.target == "all":
            subs = list(PushSubscription.objects.all())
        elif task.target == "roles":
            users = User.objects.filter(role__in=task.target_value)
            subs = list(PushSubscription.objects.filter(user__in=users))
        elif task.target == "user_ids":
            users = User.objects.filter(id__in=task.target_value)
            subs = list(PushSubscription.objects.filter(user__in=users))
        else:
            # "self" — this is a self-test; Celery task shouldn't handle this,
            # but fall back gracefully
            subs = []

        task.total = len(subs)
        task.save(update_fields=["total"])

        sent = 0
        failed = 0
        errors = []

        for sub in subs:
            try:
                payload = {
                    "title": task.title,
                    "body": task.body,
                    "url": task.url or "",
                }
                if task.image:
                    payload["image"] = _get_absolute_url(task.image)
                if task.actions:
                    payload["actions"] = task.actions

                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key},
                    },
                    data=json.dumps(payload).encode("utf-8"),
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims=settings.VAPID_CLAIMS,
                    ttl=86400,
                )
                sent += 1
            except WebPushException as e:
                failed += 1
                resp = e.response
                if resp:
                    errors.append(f"Sub {sub.id}: HTTP {resp.status_code} {resp.reason}")
                    if resp.status_code == 410:
                        sub.delete()
                else:
                    errors.append(f"Sub {sub.id}: WebPushException (no response)")
            except Exception as e:
                failed += 1
                errors.append(f"Sub {sub.id}: {type(e).__name__}: {str(e)[:200]}")

            # Update DB every 10 subscriptions for live progress
            if (sent + failed) % 10 == 0:
                task.sent = sent
                task.failed = failed
                task.errors = errors
                task.save(update_fields=["sent", "failed", "errors"])

        task.sent = sent
        task.failed = failed
        task.errors = errors
        task.status = PushBroadcastTask.Status.COMPLETED
        task.save(update_fields=["sent", "failed", "errors", "status"])

    except Exception as e:
        task.status = PushBroadcastTask.Status.FAILED
        task.errors = [f"Fatal: {type(e).__name__}: {str(e)[:300]}"]
        task.save(update_fields=["status", "errors"])
