from datetime import timedelta

from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

SKIP_PATHS = ("/admin/", "/static/", "/media/", "/health/", "/ws/")

_UPDATE_INTERVAL = timedelta(minutes=5)


class DeviceTrackingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        path = request.path_info
        if path.startswith(SKIP_PATHS):
            return

        if not hasattr(request, "user") or not request.user.is_authenticated:
            return

        user_agent = (
            request.META.get("HTTP_X_DEVICE_USER_AGENT", "")
            or request.META.get("HTTP_USER_AGENT", "")
        )
        ip = request.META.get("REMOTE_ADDR", "")

        if not user_agent:
            return

        from accounts.models import UserDevice
        from accounts.utils.user_agent import parse_user_agent

        try:
            device = UserDevice.objects.filter(
                user=request.user,
                user_agent=user_agent,
                ip_address=ip,
            ).first()

            now = timezone.now()

            if device:
                if device.last_active and (now - device.last_active) < _UPDATE_INTERVAL:
                    return
                updates = {"last_active": now}
                auth = getattr(request, "auth", None)
                if auth:
                    updates["access_token"] = auth
                UserDevice.objects.filter(id=device.id).update(**updates)
            else:
                info = parse_user_agent(user_agent)
                device_kwargs = {
                    "user": request.user,
                    "device_name": info["device_name"],
                    "device_type": info["device_type"],
                    "browser": info["browser"],
                    "os": info["os"],
                    "ip_address": ip,
                    "user_agent": user_agent,
                }
                auth = getattr(request, "auth", None)
                if auth:
                    device_kwargs["access_token"] = auth
                UserDevice.objects.create(**device_kwargs)
        except Exception:
            pass
