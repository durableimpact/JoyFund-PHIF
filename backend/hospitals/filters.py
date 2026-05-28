import django_filters

from hospitals.models import MedicalClaim, ClaimStatus
from hospitals.models.hospital import Hospital


class MedicalClaimFilter(django_filters.FilterSet):
    claim_status = django_filters.ChoiceFilter(choices=ClaimStatus)
    hospital = django_filters.ModelChoiceFilter(queryset=Hospital.objects.all())
    min_total_cost = django_filters.NumberFilter(
        field_name="total_cost", lookup_expr="gte"
    )
    max_total_cost = django_filters.NumberFilter(
        field_name="total_cost", lookup_expr="lte"
    )
    submitted_after = django_filters.DateTimeFilter(
        field_name="submitted_at", lookup_expr="gte"
    )
    submitted_before = django_filters.DateTimeFilter(
        field_name="submitted_at", lookup_expr="lte"
    )
    service_completed = django_filters.BooleanFilter(
        field_name="service_completed_at", lookup_expr="isnull", exclude=True
    )

    class Meta:
        model = MedicalClaim
        fields = ["claim_status", "hospital"]
