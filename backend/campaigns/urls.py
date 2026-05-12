from django.urls import path
from rest_framework_nested import routers

from campaigns.views import (
    CampaignViewSet,
    DonationViewSet,
    NestedDonationViewSet,
    DonationCreateViewSet,
    CampaignAvailableBalanceListView,
)

app_name = "campaigns"

# Main router for campaigns
router = routers.SimpleRouter()
router.register(r"", CampaignViewSet, basename="campaign")

# Top-level donations router (GET /api/donations/)
donations_router = routers.SimpleRouter()
donations_router.register(r"donations", DonationViewSet, basename="donation")

# Nested routers for campaign donations
campaigns_router = routers.NestedSimpleRouter(router, '', lookup='campaign')
campaigns_router.register(
    r'donations',
    NestedDonationViewSet,
    basename='campaign-donations'
)

# Nested router for campaign donation creation
campaigns_create_router = routers.NestedSimpleRouter(router, '', lookup='campaign')
campaigns_create_router.register(
    r'donate',
    DonationCreateViewSet,
    basename='campaign-donate'
)

urlpatterns = (
    router.urls
    + donations_router.urls
    + campaigns_router.urls
    + campaigns_create_router.urls
    + [
        # Admin only list of campaigns with balances
        path(
            "available-balances/",
            CampaignAvailableBalanceListView.as_view(),
            name="campaign-available-balances",
        ),
    ]
)
