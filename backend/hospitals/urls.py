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
    ]
)
