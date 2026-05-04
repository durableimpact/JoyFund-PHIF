from django.urls import path, include

urlpatterns = [
    path("accounts/", include("accounts.urls")),
    path("beneficiaries/", include("beneficiaries.urls")),
    path("campaigns/", include("campaigns.urls")),
    path("hospitals/", include("hospitals.urls")),
    path("payments/", include("payments.urls")),
    path("notifications/", include("notifications.urls")),
    path("logs/", include("logs.urls")),
]
