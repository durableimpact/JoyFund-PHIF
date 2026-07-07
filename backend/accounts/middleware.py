from datetime import timedelta

from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

SKIP_PATHS = ("/admin/", "/static/", "/media/", "/health/", "/ws/")

_UPDATE_INTERVAL = timedelta(minutes=5)


def _get_client_ip(request):
    """Get the real client IP, handling reverse proxies (nginx, NPM, Docker)."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    x_real_ip = request.META.get("HTTP_X_REAL_IP")
    if x_real_ip:
        return x_real_ip.strip()
    return request.META.get("REMOTE_ADDR", "")


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
        ip = _get_client_ip(request)

        if not user_agent:
            return

        from accounts.models import UserDevice
        from accounts.utils.user_agent import parse_user_agent, is_unknown_device

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
                if not is_unknown_device(info):
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
