import django_filters
from support.models import SupportTicket


class SupportTicketFilter(django_filters.FilterSet):
    created_at_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_at_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = SupportTicket
        fields = ["status", "category", "priority", "assigned_to", "created_by"]
