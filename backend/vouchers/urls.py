from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import views from their respective modules
from .views.admin import (
    VoucherAssignmentListView,
    ApproveVoucherAssignmentView,
    FlagVoucherAssignmentView,
    CareVoucherListView,
    CareVoucherDetailView,
)
from .views.hospital import (
    VoucherCheckInView,
    VoucherRedeemView,
)
from .views.reporting import (
    HospitalVoucherViewSet,
    VoucherReportViewSet,
)

app_name = 'vouchers'

# Router for hospital admin reporting views
router = DefaultRouter()
router.register(r'hospital/vouchers', HospitalVoucherViewSet, basename='hospital-vouchers')
router.register(r'hospital/reports', VoucherReportViewSet, basename='hospital-reports')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # --- Admin Endpoints ---
    path(
        'assignments/',
        VoucherAssignmentListView.as_view(),
        name='assignment-list'
    ),
    path(
        'assignments/<uuid:assignment_id>/approve/',
        ApproveVoucherAssignmentView.as_view(),
        name='assignment-approve'
    ),
    path(
        'assignments/<uuid:assignment_id>/flag/',
        FlagVoucherAssignmentView.as_view(),
        name='assignment-flag'
    ),
    path(
        'admin/vouchers/',
        CareVoucherListView.as_view(),
        name='voucher-list'
    ),
    path(
        'admin/vouchers/<uuid:id>/',
        CareVoucherDetailView.as_view(),
        name='voucher-detail'
    ),

    # --- Hospital Endpoints ---
    path(
        'check-in/',
        VoucherCheckInView.as_view(),
        name='voucher-check-in'
    ),
    path(
        'redeem/',
        VoucherRedeemView.as_view(),
        name='voucher-redeem'
    ),
]
