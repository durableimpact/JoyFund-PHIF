from django.urls import path
from rest_framework_nested import routers

from campaigns.views import CampaignViewSet, DonationViewSet

app_name = 'campaigns'

router = routers.SimpleRouter()
router.register(r'', CampaignViewSet, basename='campaign')

donations_router = routers.NestedSimpleRouter(router, r'', lookup='campaign')
donations_router.register(r'donations', DonationViewSet, basename='campaign-donations')

urlpatterns = router.urls + donations_router.urls + [
    # POST only — create a donation / initiate CamPay payment
    path('<uuid:campaign_pk>/donate/', DonationViewSet.as_view({'post': 'create'}), name='campaign-donate'),
]
