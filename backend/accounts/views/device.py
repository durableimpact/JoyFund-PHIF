import logging

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from oauth2_provider.models import AccessToken
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserDevice
from accounts.serializers.device import DeviceSerializer
from accounts.tasks.send_mail import send_async_email

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_devices(request):
    devices = UserDevice.objects.filter(user=request.user)
    serializer = DeviceSerializer(devices, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_device(request, device_id):
    device = UserDevice.objects.filter(id=device_id, user=request.user).first()
    if not device:
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

    # Prevent removing your own current session's device
    auth = getattr(request, "auth", None)
    if auth and device.access_token_id == auth.id:
        return Response(
            {"error": "Cannot remove your current device session."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not auth and device.ip_address == request.META.get("REMOTE_ADDR", ""):
        return Response(
            {"error": "Cannot remove your current device session."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    _revoke_tokens_for_device(device)

    device.delete()
    logger.info(
        "Device %s removed for user %s. Tokens revoked.",
        device_id, request.user.id,
    )
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_device(request, device_id):
    device = UserDevice.objects.filter(id=device_id, user=request.user).first()
    if not device:
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

    # Prevent blocking your own current session's device
    auth = getattr(request, "auth", None)
    if auth and device.access_token_id == auth.id:
        return Response(
            {"error": "Cannot block your current device session."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not auth and device.ip_address == request.META.get("REMOTE_ADDR", ""):
        return Response(
            {"error": "Cannot block your current device session."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    device.is_blocked = True
    device.is_trusted = False
    device.save(update_fields=["is_blocked", "is_trusted"])

    _revoke_tokens_for_device(device)

    _send_block_notification(device, request)

    logger.info(
        "Device %s blocked for user %s.",
        device_id, request.user.id,
    )
    return Response(DeviceSerializer(device, context={"request": request}).data)


def _send_block_notification(device, request):
    subject = "Security Alert: A device was blocked on your JoyFund account"
    context = {
        "user_name": request.user.first_name or request.user.email,
        "device_name": device.device_name or "Unknown device",
        "device_type": device.device_type or "Unknown",
        "browser": device.browser or "Unknown",
        "os": device.os or "Unknown",
        "ip_address": device.ip_address or "Unknown",
        "blocked_at": timezone.now().strftime("%B %d, %Y at %H:%M UTC"),
        "app_url": settings.FRONTEND_URL,
    }
    html_message = render_to_string("emails/device_blocked.html", context)
    send_async_email.delay(
        subject=subject,
        recipient_email=request.user.email,
        html_message=html_message,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def unblock_device(request, device_id):
    device = UserDevice.objects.filter(id=device_id, user=request.user).first()
    if not device:
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)
    device.is_blocked = False
    device.save(update_fields=["is_blocked"])
    return Response(DeviceSerializer(device, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def trust_device(request, device_id):
    device = UserDevice.objects.filter(id=device_id, user=request.user).first()
    if not device:
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)
    device.is_trusted = True
    device.save(update_fields=["is_trusted"])
    return Response(DeviceSerializer(device, context={"request": request}).data)


def _revoke_tokens_for_device(device: UserDevice) -> None:
    if device.access_token:
        device.access_token.revoke()
        logger.info(
            "Revoked access token %s for device %s (user %s)",
            device.access_token_id, device.id, device.user.id,
        )
        return

    if not device.ip_address:
        return

    now = timezone.now()
    tokens = AccessToken.objects.filter(
        user=device.user,
        expires__gt=now,
    ).select_related("refresh_token")

    revoked_count = 0
    for token in tokens:
        token.revoke()
        revoked_count += 1

    if revoked_count:
        logger.info(
            "Revoked %d access tokens for user %s (fallback, no device token ref)",
            revoked_count, device.user.id,
        )
