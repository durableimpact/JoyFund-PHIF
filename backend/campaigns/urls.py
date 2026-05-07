from django.urls import path
from rest_framework_nested import routers

from campaigns.views import (
    CampaignViewSet,
    DonationViewSet,
    CampaignAvailableBalanceListView,
)

app_name = "campaigns"

router = routers.SimpleRouter()
router.register(r"", CampaignViewSet, basename="campaign")

# Register DonationViewSet at top level for custom actions like my-donations
donations_router = routers.SimpleRouter()
donations_router.register(r"donations", DonationViewSet, basename="donation")

urlpatterns = (
    router.urls
    + donations_router.urls
    + [
        # Admin only list of campaigns with balances
        path(
            "available-balances/",
            CampaignAvailableBalanceListView.as_view(),
            name="campaign-available-balances",
        ),
        # POST only — create a donation / initiate CamPay payment
        path(
            "<uuid:campaign_pk>/donate/",
            DonationViewSet.as_view({"post": "create"}),
            name="campaign-donate",
        ),
    ]
)
