from django.urls import path
from rest_framework_nested import routers

from hospitals.views import (
    HospitalViewSet,
    ServiceViewSet,
    MedicalClaimCreateView,
    MedicalClaimDetailView,
    MedicalClaimProofListCreateView,
    MedicalClaimProofDetailView,
    MedicalClaimProofVerifyView,
    MedicalClaimProofRejectView,
    MedicalClaimProofFlagView,
    VoucherTopUpRequestCreateView,
    VoucherTopUpRequestListView,
    VoucherTopUpRequestDetailView,
    VoucherTopUpRequestApproveView,
    MedicalClaimMarkCompleteView,
    MedicalClaimFinalVerifyView,
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
            "medical-claims/<uuid:pk>/",
            MedicalClaimDetailView.as_view(),
            name="medical-claim-detail",
        ),
        path(
            "medical-claims/<uuid:medical_claim_id>/proofs/",
            MedicalClaimProofListCreateView.as_view(),
            name="medical-claim-proofs",
        ),
        path(
            "medical-claims/<uuid:medical_claim_id>/proofs/<uuid:pk>/",
            MedicalClaimProofDetailView.as_view(),
            name="medical-claim-proof-detail",
        ),
        path(
            "medical-claims/<uuid:medical_claim_id>/proofs/<uuid:pk>/verify/",
            MedicalClaimProofVerifyView.as_view(),
            name="medical-claim-proof-verify",
        ),
        path(
            "medical-claims/<uuid:medical_claim_id>/proofs/<uuid:pk>/reject/",
            MedicalClaimProofRejectView.as_view(),
            name="medical-claim-proof-reject",
        ),
        path(
            "medical-claims/<uuid:medical_claim_id>/proofs/<uuid:pk>/flag/",
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
        # Claim completion workflow
        path(
            "medical-claims/<uuid:medical_claim_id>/mark-complete/",
            MedicalClaimMarkCompleteView.as_view(),
            name="medical-claim-mark-complete",
        ),
        path(
            "medical-claims/<uuid:medical_claim_id>/final-verify/",
            MedicalClaimFinalVerifyView.as_view(),
            name="medical-claim-final-verify",
        ),
    ]
)
