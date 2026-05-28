from django.urls import path
from rest_framework_nested import routers

from hospitals.views import (
    HospitalViewSet,
    ServiceViewSet,
    MedicalClaimCreateView,
    MedicalClaimDetailView,
    MedicalClaimListView,
    MedicalClaimProofListCreateView,
    MedicalClaimProofDetailView,
    MedicalClaimProofVerifyView,
    MedicalClaimProofRejectView,
    MedicalClaimProofFlagView,
    VoucherTopUpRequestCreateView,
    VoucherTopUpRequestListView,
    VoucherTopUpRequestDetailView,
    VoucherApproveView,
    VoucherTopUpRequestApproveView,
    VoucherTopUpRequestRejectView,
    VoucherConfirmPinView,
    MedicalClaimMarkCompleteView,
    MedicalClaimApproveView,
    MedicalClaimRejectView,
    MedicalClaimFinalVerifyView,
    HospitalDashboardView,
    HospitalRedeemedDailyView,
)

app_name = "hospitals"

router = routers.SimpleRouter()
router.register(r"", HospitalViewSet, basename="hospital")

services_router = routers.NestedSimpleRouter(router, r"", lookup="hospital")
services_router.register(r"services", ServiceViewSet, basename="hospital-services")

urlpatterns = (
    router.urls
    + services_router.urls
    + [
        path(
            "medical-claims/",
            MedicalClaimCreateView.as_view(),
            name="medical-claim-create",
        ),
        path(
            "medical-claims/list/",
            MedicalClaimListView.as_view(),
            name="medical-claim-list",
        ),
        path(
            "medical-claims/<int:pk>/",
            MedicalClaimDetailView.as_view(),
            name="medical-claim-detail",
        ),
        path(
            "medical-claims/<int:medical_claim_id>/proofs/",
            MedicalClaimProofListCreateView.as_view(),
            name="medical-claim-proofs",
        ),
        path(
            "medical-claims/<int:medical_claim_id>/proofs/<int:pk>/",
            MedicalClaimProofDetailView.as_view(),
            name="medical-claim-proof-detail",
        ),
        path(
            "medical-claims/<int:medical_claim_id>/proofs/<int:pk>/verify/",
            MedicalClaimProofVerifyView.as_view(),
            name="medical-claim-proof-verify",
        ),
        path(
            "medical-claims/<int:medical_claim_id>/proofs/<int:pk>/reject/",
            MedicalClaimProofRejectView.as_view(),
            name="medical-claim-proof-reject",
        ),
        path(
            "medical-claims/<int:medical_claim_id>/proofs/<int:pk>/flag/",
            MedicalClaimProofFlagView.as_view(),
            name="medical-claim-proof-flag",
        ),
        # Voucher top-up workflow
        path(
            "voucher-top-up-requests/",
            VoucherTopUpRequestListView.as_view(),
            name="voucher-top-up-list",
        ),
        path(
            "voucher-top-up-requests/create/",
            VoucherTopUpRequestCreateView.as_view(),
            name="voucher-top-up-create",
        ),
        path(
            "voucher-top-up-requests/<uuid:top_up_request_id>/",
            VoucherTopUpRequestDetailView.as_view(),
            name="voucher-top-up-detail",
        ),
        path(
            "voucher-top-up-requests/<uuid:top_up_request_id>/approve/",
            VoucherTopUpRequestApproveView.as_view(),
            name="voucher-top-up-approve",
        ),
        path(
            "voucher-top-up-requests/<uuid:top_up_request_id>/reject/",
            VoucherTopUpRequestRejectView.as_view(),
            name="voucher-top-up-reject",
        ),
        # Voucher approval workflow
        path(
            "vouchers/<uuid:voucher_id>/approve/",
            VoucherApproveView.as_view(),
            name="voucher-approve",
        ),
        # Voucher PIN confirmation workflow
        path(
            "vouchers/<uuid:voucher_id>/confirm-pin/",
            VoucherConfirmPinView.as_view(),
            name="voucher-confirm-pin",
        ),
        # Claim approval/rejection workflow
        path(
            "medical-claims/<int:medical_claim_id>/approve/",
            MedicalClaimApproveView.as_view(),
            name="medical-claim-approve",
        ),
        path(
            "medical-claims/<int:medical_claim_id>/reject/",
            MedicalClaimRejectView.as_view(),
            name="medical-claim-reject",
        ),
        # Claim completion workflow
        path(
            "medical-claims/<int:medical_claim_id>/mark-complete/",
            MedicalClaimMarkCompleteView.as_view(),
            name="medical-claim-mark-complete",
        ),
        path(
            "medical-claims/<int:medical_claim_id>/final-verify/",
            MedicalClaimFinalVerifyView.as_view(),
            name="medical-claim-final-verify",
        ),
        # Hospital dashboards
        path(
            "<uuid:hospital_id>/dashboard/",
            HospitalDashboardView.as_view(),
            name="hospital-dashboard",
        ),
        path(
            "<uuid:hospital_id>/dashboard/redeemed-daily/",
            HospitalRedeemedDailyView.as_view(),
            name="hospital-redeemed-daily",
        ),
    ]
)
