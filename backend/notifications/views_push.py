import json

from django.conf import settings
from django.contrib.auth import get_user_model

from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from notifications.models import PushSubscription
from notifications.serializers import (
    PushSubscriptionRegisterSerializer,
    PushSubscriptionSerializer,
    TestPushSerializer,
)
from pywebpush import WebPushException, webpush

from notifications.webpush import (
    send_push_notification,
    send_push_notification_to_user,
    send_push_notification_to_all_users,
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

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=data["endpoint"],
        defaults={
            "p256dh_key": data["p256dh_key"],
            "auth_key": data["auth_key"],
            "user_agent": data.get("user_agent", ""),
            "user": request.user if request.user.is_authenticated else None,
        },
    )

    if request.user.is_authenticated and data.get("user_agent"):
        PushSubscription.objects.filter(
            user=request.user,
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
        Send a test web push notification.

        - If `broadcast` is true, sends to all subscribed users.
        - If `user_ids` is provided, sends to those specific users.
        - If neither is set, sends to the requesting user (including anonymous subscriptions if none are linked).

        Useful for testing push notifications via Swagger without creating a Notification in the database.
    """,
    request_body=TestPushSerializer,
    responses={
        200: openapi.Response(
            description="Send result",
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
    broadcast = data.get("broadcast", False)
    user_ids = data.get("user_ids", [])

    sent = 0
    failed = 0
    subs = []

    if broadcast:
        subs = list(PushSubscription.objects.all())
    elif user_ids:
        users = User.objects.filter(id__in=user_ids)
        for user in users:
            try:
                sent += send_push_notification_to_user(user, title=title, body=body, url=url, tag="test")
            except Exception:
                failed += 1
        return Response({
            "sent": sent,
            "failed": failed,
            "total_subscriptions": PushSubscription.objects.count(),
            "vapid_configured": bool(settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY),
        })
    else:
        subs = list(request.user.push_subscriptions.all())
        if not subs:
            subs = list(PushSubscription.objects.filter(user__isnull=True))

    errors = []

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh_key, "auth": sub.auth_key},
                },
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "url": url or "",
                }).encode("utf-8"),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims=settings.VAPID_CLAIMS,
            )
            sent += 1
        except WebPushException as e:
            failed += 1
            resp = e.response
            if resp:
                errors.append(f"Sub {sub.id}: HTTP {resp.status_code} {resp.reason} — {resp.text[:200]}")
                if resp.status_code == 410:
                    sub.delete()
            else:
                errors.append(f"Sub {sub.id}: WebPushException (no response)")
        except Exception as e:
            failed += 1
            import traceback
            errors.append(f"Sub {sub.id}: {type(e).__name__}: {traceback.format_exc()[:300]}")

    return Response({
        "sent": sent,
        "failed": failed,
        "errors": errors,
        "total_subscriptions": PushSubscription.objects.count(),
        "vapid_configured": bool(settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY),
    })
