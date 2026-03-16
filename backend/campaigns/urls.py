from django.urls import path

from campaigns.views import (
    CampaignCreateView,
    CampaignDeleteView,
    CampaignListView,
    CampaignRetrieveView,
    CampaignUpdateView,
    DonationCreateView,
    DonationListView,
    DonationRetrieveView,
)

app_name = 'campaigns'

urlpatterns = [
    path('', CampaignListView.as_view(), name='campaign-list'),
    path('create/', CampaignCreateView.as_view(), name='campaign-create'),
    path('<uuid:id>/', CampaignRetrieveView.as_view(), name='campaign-retrieve'),
    path('<uuid:id>/update/', CampaignUpdateView.as_view(), name='campaign-update'),
    path('<uuid:id>/delete/', CampaignDeleteView.as_view(), name='campaign-delete'),
    path('<uuid:campaign_id>/donations/', DonationListView.as_view(), name='donation-list'),
    path('<uuid:campaign_id>/donations/create/', DonationCreateView.as_view(), name='donation-create'),
    path('<uuid:campaign_id>/donations/<int:id>/', DonationRetrieveView.as_view(), name='donation-retrieve'),
]
