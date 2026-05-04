import django_filters
from django_filters import rest_framework as filters
from beneficiaries.models import (
    Beneficiary,
    Gender,
    BeneficiaryCategory,
    UrgencyLevel,
    GeographicRemoteness,
)


class BeneficiaryFilter(filters.FilterSet):
    """
    FilterSet for Beneficiary model.
    Provides filtering capabilities for the BeneficiaryListView.
    """

    # Exact match filters
    id = django_filters.UUIDFilter(field_name="id", lookup_expr="exact")
    gender = django_filters.ChoiceFilter(
        field_name="gender", choices=Gender.choices, lookup_expr="exact"
    )
    category = django_filters.ChoiceFilter(
        field_name="category", choices=BeneficiaryCategory.choices, lookup_expr="exact"
    )
    urgency_level = django_filters.ChoiceFilter(
        field_name="urgency_level", choices=UrgencyLevel.choices, lookup_expr="exact"
    )
    geographic_remoteness = django_filters.ChoiceFilter(
        field_name="geographic_remoteness",
        choices=GeographicRemoteness.choices,
        lookup_expr="exact",
    )
    enrolled_by_id = django_filters.UUIDFilter(
        field_name="enrolled_by_id", lookup_expr="exact"
    )
    is_active = django_filters.BooleanFilter(
        field_name="is_active", lookup_expr="exact"
    )
    income_verified = django_filters.BooleanFilter(
        field_name="income_verified", lookup_expr="exact"
    )

    # Search filters (case-insensitive contains)
    full_name = django_filters.CharFilter(
        field_name="full_name", lookup_expr="icontains"
    )
    phone = django_filters.CharFilter(field_name="phone", lookup_expr="icontains")
    email = django_filters.CharFilter(field_name="email", lookup_expr="icontains")
    national_id_number = django_filters.CharFilter(
        field_name="national_id_number", lookup_expr="icontains"
    )
    region = django_filters.CharFilter(field_name="region", lookup_expr="icontains")
    city = django_filters.CharFilter(field_name="city", lookup_expr="icontains")

    # Null check for email
    email_isnull = django_filters.BooleanFilter(
        field_name="email", lookup_expr="isnull"
    )

    # Date filters
    date_of_birth = django_filters.DateFilter(
        field_name="date_of_birth", lookup_expr="exact"
    )
    date_of_birth_gte = django_filters.DateFilter(
        field_name="date_of_birth", lookup_expr="gte"
    )
    date_of_birth_lte = django_filters.DateFilter(
        field_name="date_of_birth", lookup_expr="lte"
    )

    expected_delivery_date = django_filters.DateFilter(
        field_name="expected_delivery_date", lookup_expr="exact"
    )
    expected_delivery_date_gte = django_filters.DateFilter(
        field_name="expected_delivery_date", lookup_expr="gte"
    )
    expected_delivery_date_lte = django_filters.DateFilter(
        field_name="expected_delivery_date", lookup_expr="lte"
    )

    # DateTime filters (using DateFilter for date lookup on datetime fields)
    created_at = django_filters.DateFilter(field_name="created_at", lookup_expr="date")
    created_at_gte = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_at_lte = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    updated_at = django_filters.DateFilter(field_name="updated_at", lookup_expr="date")
    updated_at_gte = django_filters.DateTimeFilter(
        field_name="updated_at", lookup_expr="gte"
    )
    updated_at_lte = django_filters.DateTimeFilter(
        field_name="updated_at", lookup_expr="lte"
    )

    class Meta:
        model = Beneficiary
        fields = []
