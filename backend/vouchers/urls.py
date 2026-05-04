from django.urls import path
from vouchers.views.voucher import (
    VoucherCheckView,
    VoucherCreateView,
    VoucherCreateMultipleCampaignsView,
)

app_name = "vouchers"

urlpatterns = [
    path("check/", VoucherCheckView.as_view(), name="voucher-check"),
    path("create/", VoucherCreateView.as_view(), name="voucher-create"),
    path(
        "create-from-campaigns/",
        VoucherCreateMultipleCampaignsView.as_view(),
        name="voucher-create-multiple",
    ),
]
