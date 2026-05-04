import django_filters
from django_filters import rest_framework as filters
from beneficiaries.models.health_issue import (
    HealthIssue,
    HealthIssueCategoryChoices,
    HealthIssueSeverityLevel,
    HealthIssueStatus,
)


class HealthIssueFilter(filters.FilterSet):
    """
    FilterSet for HealthIssue model.
    """

    beneficiary = django_filters.UUIDFilter(
        field_name="beneficiary__id", lookup_expr="exact"
    )
    social_worker = django_filters.UUIDFilter(
        field_name="social_worker__id", lookup_expr="exact"
    )
    category = django_filters.ChoiceFilter(
        field_name="category", choices=HealthIssueCategoryChoices.choices
    )
    severity = django_filters.ChoiceFilter(
        field_name="severity", choices=HealthIssueSeverityLevel.choices
    )
    status = django_filters.ChoiceFilter(
        field_name="status", choices=HealthIssueStatus.choices
    )

    # Date filters
    created_at = django_filters.DateFilter(field_name="created_at", lookup_expr="exact")
    created_at_gte = django_filters.DateFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_at_lte = django_filters.DateFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = HealthIssue
        fields = [
            "beneficiary",
            "social_worker",
            "category",
            "severity",
            "status",
            "created_at",
        ]
