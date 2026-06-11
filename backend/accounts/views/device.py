import logging

from django.utils import timezone
from oauth2_provider.models import AccessToken, RefreshToken
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import UserDevice
from accounts.serializers.device import DeviceSerializer

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
    device.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_device(request, device_id):
    device = UserDevice.objects.filter(id=device_id, user=request.user).first()
    if not device:
        return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)

    device.is_blocked = True
    device.is_trusted = False
    device.save(update_fields=["is_blocked", "is_trusted"])

    # Revoke all active tokens from this device's IP
    _revoke_tokens_for_device(device)

    logger.info(
        "Device %s blocked for user %s. Tokens revoked.",
        device_id, request.user.id,
    )
    return Response(DeviceSerializer(device, context={"request": request}).data)


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
            "Revoked %d access tokens for user %s on device %s",
            revoked_count, device.user.id, device.id,
        )
