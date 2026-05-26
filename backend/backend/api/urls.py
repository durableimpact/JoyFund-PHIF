from django.urls import path, include
from .views import PlatformStatsView

urlpatterns = [
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
]
