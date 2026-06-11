from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from notifications.models import PushSubscription
from notifications.serializers import (
    PushSubscriptionRegisterSerializer,
    PushSubscriptionSerializer,
)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def register_push_subscription(request):
    serializer = PushSubscriptionRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data

    sub, created = PushSubscription.objects.get_or_create(
        user=request.user,
        endpoint=data["endpoint"],
        defaults={
            "p256dh_key": data["p256dh_key"],
            "auth_key": data["auth_key"],
            "user_agent": data.get("user_agent", ""),
        },
    )

    if not created:
        sub.p256dh_key = data["p256dh_key"]
        sub.auth_key = data["auth_key"]
        sub.user_agent = data.get("user_agent", "")
        sub.save()

    return Response(
        PushSubscriptionSerializer(sub).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def unregister_push_subscription(request):
    endpoint = request.data.get("endpoint")
    if not endpoint:
        return Response(
            {"error": "endpoint is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    deleted, _ = PushSubscription.objects.filter(
        user=request.user, endpoint=endpoint
    ).delete()

    return Response(
        {"deleted": deleted > 0},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def list_push_subscriptions(request):
    subs = PushSubscription.objects.filter(user=request.user)
    serializer = PushSubscriptionSerializer(subs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
