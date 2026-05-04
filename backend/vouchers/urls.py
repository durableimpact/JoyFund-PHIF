from django.urls import path
from vouchers.views.voucher import VoucherCheckView

app_name = "vouchers"

urlpatterns = [
    path("check/", VoucherCheckView.as_view(), name="voucher-check"),
]
