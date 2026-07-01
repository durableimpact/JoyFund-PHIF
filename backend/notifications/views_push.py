from django.conf import settings
from django.contrib.auth import get_user_model

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from notifications.models import PushBroadcastTask, PushSubscription
from notifications.serializers import (
    PushSubscriptionRegisterSerializer,
    PushSubscriptionSerializer,
    TestPushSerializer,
)

User = get_user_model()

_TAG = ["Push Notifications"]


@swagger_auto_schema(
    method="post",
    tags=_TAG,
    operation_description="""
        Register a push subscription for web push notifications.

        Works for both authenticated and anonymous users. If the user is
        authenticated, the subscription is linked to their account so targeted
        notifications can be sent. Anonymous subscriptions still receive global
        broadcasts (e.g. new campaigns, resolved health issues).
    """,
    request_body=PushSubscriptionRegisterSerializer,
    responses={
        201: PushSubscriptionSerializer(),
        200: PushSubscriptionSerializer(),
        400: "Bad request — invalid or missing fields",
    },
)
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_push_subscription(request):
    serializer = PushSubscriptionRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    user = request.user if request.user.is_authenticated else None

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=data["endpoint"],
        defaults={
            "p256dh_key": data["p256dh_key"],
            "auth_key": data["auth_key"],
            "user_agent": data.get("user_agent", ""),
            "user": user,
        },
    )

    if user and data.get("user_agent"):
        PushSubscription.objects.filter(
            user=user,
            user_agent=data["user_agent"],
        ).exclude(pk=sub.pk).delete()

    return Response(
        PushSubscriptionSerializer(sub).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


unregister_request = openapi.Schema(
    type=openapi.TYPE_OBJECT,
    required=["endpoint"],
    properties={
        "endpoint": openapi.Schema(
            type=openapi.TYPE_STRING,
            description="The push subscription endpoint URL to unregister",
        ),
    },
)


@swagger_auto_schema(
    method="post",
    tags=_TAG,
    operation_description="""
        Unregister a push subscription by endpoint.

        If the user is authenticated, only their own subscriptions are removed.
        Anonymous users can also unregister by providing the endpoint.
    """,
    request_body=unregister_request,
    responses={
        200: openapi.Response(
            description="Unregister result",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "deleted": openapi.Schema(
                        type=openapi.TYPE_BOOLEAN,
                        description="Whether a subscription was removed",
                    ),
                },
            ),
        ),
        400: "Bad request — endpoint is required",
    },
)
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def unregister_push_subscription(request):
    endpoint = request.data.get("endpoint")
    if not endpoint:
        return Response(
            {"error": "endpoint is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    filters = {"endpoint": endpoint}
    if request.user.is_authenticated:
        filters["user"] = request.user

    deleted, _ = PushSubscription.objects.filter(**filters).delete()

    return Response(
        {"deleted": deleted > 0},
        status=status.HTTP_200_OK,
    )


@swagger_auto_schema(
    method="get",
    tags=_TAG,
    operation_description="List all push subscriptions for the authenticated user.",
    responses={
        200: PushSubscriptionSerializer(many=True),
    },
)
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def list_push_subscriptions(request):
    subs = PushSubscription.objects.filter(user=request.user)
    serializer = PushSubscriptionSerializer(subs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method="post",
    tags=_TAG,
    operation_description="""
        Send a test web push notification (async).

        - If `broadcast` is true, sends to all subscribed users via Celery task.
        - If `roles` is provided, sends to all users with those roles via Celery task.
        - If `user_ids` is provided, sends to those specific users via Celery task.
        - If neither is set, sends to the requesting user synchronously (self-test).

        Returns 202 with a task_id for async targets. Poll GET /push/task/{task_id}/ for status.
    """,
    request_body=TestPushSerializer,
    responses={
        202: openapi.Response(
            description="Task dispatched",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "task_id": openapi.Schema(type=openapi.TYPE_STRING, format="uuid"),
                    "status": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
        ),
        200: openapi.Response(
            description="Self-test result (synchronous)",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "sent": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "failed": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "total_subscriptions": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "vapid_configured": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                },
            ),
        ),
        400: "Bad request",
    },
)
@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def test_send_push(request):
    serializer = TestPushSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    title = data["title"]
    body = data["body"]
    url = data.get("url", "")
    image = data.get("image") or ""
    actions = data.get("actions") or []
    broadcast = data.get("broadcast", False)
    user_ids = data.get("user_ids", [])
    roles = data.get("roles", [])

    # Determine target
    if broadcast:
        target = "all"
        target_value = []
    elif roles:
        target = "roles"
        target_value = list(roles)
    elif user_ids:
        target = "user_ids"
        target_value = list(user_ids)
    else:
        target = "self"
        target_value = []

    # Self-test: send synchronously (fast, small number of subscriptions)
    if target == "self":
        from notifications.webpush import send_push_notification_to_user

        sent = 0
        failed = 0
        subs = list(request.user.push_subscriptions.all())
        if not subs:
            subs = list(PushSubscription.objects.filter(user__isnull=True))

        for sub in subs:
            try:
                from notifications.webpush import _get_absolute_url
                from pywebpush import WebPushException, webpush
                import json

                payload = {
                    "title": title,
                    "body": body,
                    "url": url or "",
                }
                if image:
                    payload["image"] = _get_absolute_url(image)
                if actions:
                    payload["actions"] = actions

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
                if resp and resp.status_code == 410:
                    sub.delete()
            except Exception:
                failed += 1

        return Response({
            "sent": sent,
            "failed": failed,
            "total_subscriptions": PushSubscription.objects.count(),
            "vapid_configured": bool(settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY),
        })

    # Async targets: create task + dispatch to Celery
    task = PushBroadcastTask.objects.create(
        target=target,
        target_value=target_value,
        title=title,
        body=body,
        url=url,
        image=image,
        actions=actions,
    )

    from notifications.tasks import execute_push_broadcast_task
    execute_push_broadcast_task.delay(str(task.id))

    return Response(
        {"task_id": str(task.id), "status": task.status},
        status=status.HTTP_202_ACCEPTED,
    )


@swagger_auto_schema(
    method="get",
    tags=_TAG,
    operation_description="Poll the status of a push broadcast task.",
    responses={
        200: openapi.Response(
            description="Task status",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "task_id": openapi.Schema(type=openapi.TYPE_STRING, format="uuid"),
                    "status": openapi.Schema(type=openapi.TYPE_STRING),
                    "total": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "sent": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "failed": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "errors": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING)),
                    "title": openapi.Schema(type=openapi.TYPE_STRING),
                    "body": openapi.Schema(type=openapi.TYPE_STRING),
                    "url": openapi.Schema(type=openapi.TYPE_STRING),
                    "image": openapi.Schema(type=openapi.TYPE_STRING),
                    "actions": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_OBJECT)),
                },
            ),
        ),
        404: "Task not found",
    },
)
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def push_task_status(request, task_id):
    try:
        task = PushBroadcastTask.objects.get(id=task_id)
    except PushBroadcastTask.DoesNotExist:
        return Response(
            {"error": "Task not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response({
        "task_id": str(task.id),
        "status": task.status,
        "total": task.total,
        "sent": task.sent,
        "failed": task.failed,
        "errors": task.errors,
        "title": task.title,
        "body": task.body,
        "url": task.url,
        "image": task.image,
        "actions": task.actions,
    })
