import django_filters
from django.db.models import F

from campaigns.models import Campaign, Donation


class CampaignFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Campaign.CampaignStatus)
    event_type = django_filters.ChoiceFilter(choices=Campaign.EventType)
    donor_id = django_filters.UUIDFilter(field_name="donor_id")
    is_public = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()
    min_goal_amount = django_filters.NumberFilter(
        field_name="goal_amount", lookup_expr="gte"
    )
    max_goal_amount = django_filters.NumberFilter(
        field_name="goal_amount", lookup_expr="lte"
    )
    min_progress_percentage = django_filters.NumberFilter(
        method="filter_min_progress_percentage"
    )
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )
    end_after = django_filters.DateTimeFilter(field_name="end_date", lookup_expr="gte")
    end_before = django_filters.DateTimeFilter(field_name="end_date", lookup_expr="lte")

    class Meta:
        model = Campaign
        fields = ["status", "event_type", "is_public", "is_active"]

    def filter_min_progress_percentage(self, queryset, name, value):
        if value is not None:
            return queryset.filter(
                current_amount__gte=F("goal_amount") * value / 100
            )
        return queryset


class DonationFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Donation.STATUS_CHOICES)
    is_anonymous = django_filters.BooleanFilter()
    donor_name = django_filters.CharFilter(lookup_expr="icontains")
    min_amount = django_filters.NumberFilter(field_name="amount", lookup_expr="gte")
    max_amount = django_filters.NumberFilter(field_name="amount", lookup_expr="lte")
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = Donation
        fields = ["status", "is_anonymous"]
