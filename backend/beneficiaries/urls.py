from django.urls import path

from beneficiaries.views import (
    BeneficiaryListView,
    BeneficiaryDetailView,
    BeneficiaryVerifyView,
    HealthIssueListCreateView,
    HealthIssueDetailView,
    HealthIssueStatusActionView,
    HealthIssueVerifyView,
    HealthIssueRejectView,
)
from beneficiaries.views.document import (
    BeneficiaryDocumentListCreateView,
    BeneficiaryDocumentDetailView,
)

app_name = "beneficiaries"

urlpatterns = [
    path("", BeneficiaryListView.as_view(), name="beneficiary-list-create"),
    path(
        "<uuid:id>/",
        BeneficiaryDetailView.as_view(),
        name="beneficiary-detail-update-delete",
    ),
    path(
        "<uuid:id>/verify/",
        BeneficiaryVerifyView.as_view(),
        name="beneficiary-verify",
    ),
    # Health Issues
    path(
        "health-issues/",
        HealthIssueListCreateView.as_view(),
        name="health-issue-list-create",
    ),
    path(
        "health-issues/<int:id>/",
        HealthIssueDetailView.as_view(),
        name="health-issue-detail",
    ),
    path(
        "health-issues/<int:id>/action/",
        HealthIssueStatusActionView.as_view(),
        name="health-issue-status-action",
    ),
    path(
        "health-issues/<int:id>/verify/",
        HealthIssueVerifyView.as_view(),
        name="health-issue-verify",
    ),
    path(
        "health-issues/<int:id>/reject/",
        HealthIssueRejectView.as_view(),
        name="health-issue-reject",
    ),
    # Documents (nested under beneficiary)
    path(
        "<uuid:beneficiary_id>/documents/",
        BeneficiaryDocumentListCreateView.as_view(),
        name="document-list-create",
    ),
    path(
        "<uuid:beneficiary_id>/documents/<int:doc_id>/",
        BeneficiaryDocumentDetailView.as_view(),
        name="document-detail",
    ),
]
