from django.urls import path, include
from .views import PlatformStatsView, health_check

from accounts.views import UnifiedUserViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"users", UnifiedUserViewSet, basename="user")

urlpatterns = [
    # Health check
    path("health/", health_check, name="health-check"),
    # Platform statistics
    path("platform-stats/", PlatformStatsView.as_view(), name="platform-stats"),
    
    # App-specific endpoints
    path("accounts/", include("accounts.urls")),
    path("beneficiaries/", include("beneficiaries.urls")),
    path("campaigns/", include("campaigns.urls")),
    path("hospitals/", include("hospitals.urls")),
    path("payments/", include("payments.urls")),
    path("vouchers/", include("vouchers.urls")),
    path("notifications/", include("notifications.urls")),
    path("logs/", include("logs.urls")),
    path("support/", include("support.urls")),
    path("newsletter/", include("newsletter.urls")),
] + router.urls
