from django.urls import path
from .views import admin as admin_views
from .views import hospital as hospital_views

app_name = 'vouchers'

urlpatterns = [
    # --- Admin Endpoints ---
    path(
        'assignments/',
        admin_views.VoucherAssignmentListView.as_view(),
        name='assignment-list'
    ),
    path(
        'assignments/<uuid:assignment_id>/approve/',
        admin_views.ApproveVoucherAssignmentView.as_view(),
        name='assignment-approve'
    ),
    path(
        'assignments/<uuid:assignment_id>/flag/',
        admin_views.FlagVoucherAssignmentView.as_view(),
        name='assignment-flag'
    ),
    path(
        '',
        admin_views.CareVoucherListView.as_view(),
        name='voucher-list'
    ),
    path(
        '<uuid:id>/',
        admin_views.CareVoucherDetailView.as_view(),
        name='voucher-detail'
    ),

    # --- Hospital Endpoints ---
    path(
        'check-in/',
        hospital_views.VoucherCheckInView.as_view(),
        name='voucher-check-in'
    ),
    path(
        'redeem/',
        hospital_views.VoucherRedeemView.as_view(),
        name='voucher-redeem'
    ),
]
