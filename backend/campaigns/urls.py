from django.urls import path
from rest_framework_nested import routers
from rest_framework.routers import SimpleRouter

from campaigns.views import (
    CampaignViewSet,
    DonationViewSet,
    NestedDonationViewSet,
    DonationCreateViewSet,
    CampaignAvailableBalanceListView,
)

app_name = "campaigns"

# ============================================================================
# DONATIONS - System-wide across all campaigns
# GET /api/campaigns/donations/ - List all donations
# GET /api/campaigns/donations/{id}/ - Get specific donation
# GET /api/campaigns/donations/my-donations/ - Get authenticated donor's donations
# ============================================================================
# IMPORTANT: Register donations FIRST so specific routes match before generic ones
donations_router = SimpleRouter()
donations_router.register(r"donations", DonationViewSet, basename="donation")

# ============================================================================
# CAMPAIGN DONATIONS - Nested under specific campaigns
# GET /api/campaigns/{campaign_id}/donations/ - Donations for campaign
# GET /api/campaigns/{campaign_id}/donations/{id}/ - Specific donation
# POST /api/campaigns/{campaign_id}/donate/ - Create donation
# ============================================================================
campaigns_router = SimpleRouter()
campaigns_router.register(r"", CampaignViewSet, basename="campaign")

nested_donations = routers.NestedSimpleRouter(
    campaigns_router,
    r"",
    lookup="campaign"
)
nested_donations.register(
    r"donations",
    NestedDonationViewSet,
    basename="campaign-donations"
)
nested_donations.register(
    r"donate",
    DonationCreateViewSet,
    basename="campaign-donate"
)

urlpatterns = (
    # Register specific routes FIRST, generic routes LAST
    donations_router.urls
    + nested_donations.urls
    + campaigns_router.urls
    + [
        # Admin only list of campaigns with balances
        path(
            "available-balances/",
            CampaignAvailableBalanceListView.as_view(),
            name="campaign-available-balances",
        ),
    ]
)
