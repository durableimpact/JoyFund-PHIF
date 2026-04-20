"""
Django filters for ANC tracking views.
"""
import django_filters
from django.utils import timezone
from datetime import timedelta

from .models import ANCEnrollment, ANCVisit, MissedAppointmentAlert


class ANCEnrollmentFilter(django_filters.FilterSet):
    """Filter for ANC enrollments."""
    
    status = django_filters.ChoiceFilter(
        choices=ANCEnrollment.Status.choices,
        field_name='status'
    )
    high_risk = django_filters.BooleanFilter(field_name='high_risk')
    enrollment_date_from = django_filters.DateFilter(
        field_name='enrollment_date',
        lookup_expr='gte'
    )
    enrollment_date_to = django_filters.DateFilter(
        field_name='enrollment_date',
        lookup_expr='lte'
    )
    expected_delivery_from = django_filters.DateFilter(
        field_name='expected_delivery_date',
        lookup_expr='gte'
    )
    expected_delivery_to = django_filters.DateFilter(
        field_name='expected_delivery_date',
        lookup_expr='lte'
    )
    
    class Meta:
        model = ANCEnrollment
        fields = ['status', 'high_risk', 'social_worker']


class ANCVisitFilter(django_filters.FilterSet):
    """Filter for ANC visits."""
    
    status = django_filters.ChoiceFilter(
        choices=ANCVisit.Status.choices,
        field_name='status'
    )
    visit_number = django_filters.ChoiceFilter(
        choices=ANCVisit.VisitNumber.choices,
        field_name='visit_number'
    )
    is_overdue = django_filters.BooleanFilter(
        method='filter_is_overdue'
    )
    scheduled_date_from = django_filters.DateFilter(
        field_name='scheduled_date',
        lookup_expr='gte'
    )
    scheduled_date_to = django_filters.DateFilter(
        field_name='scheduled_date',
        lookup_expr='lte'
    )
    
    def filter_is_overdue(self, queryset, name, value):
        """Filter overdue visits."""
        today = timezone.now().date()
        if value:
            return queryset.filter(
                scheduled_date__lt=today,
                status__in=[ANCVisit.Status.SCHEDULED, ANCVisit.Status.RESCHEDULED]
            )
        else:
            return queryset.exclude(
                scheduled_date__lt=today,
                status__in=[ANCVisit.Status.SCHEDULED, ANCVisit.Status.RESCHEDULED]
            )
    
    class Meta:
        model = ANCVisit
        fields = ['status', 'visit_number', 'enrollment']


class MissedAppointmentAlertFilter(django_filters.FilterSet):
    """Filter for missed appointment alerts."""
    
    status = django_filters.ChoiceFilter(
        choices=MissedAppointmentAlert.AlertStatus.choices,
        field_name='status'
    )
    missed_date_from = django_filters.DateFilter(
        field_name='missed_date',
        lookup_expr='gte'
    )
    missed_date_to = django_filters.DateFilter(
        field_name='missed_date',
        lookup_expr='lte'
    )
    overdue_days = django_filters.NumberFilter(
        method='filter_days_overdue'
    )
    
    def filter_days_overdue(self, queryset, name, value):
        """Filter alerts by how many days overdue."""
        cutoff_date = timezone.now().date() - timedelta(days=int(value))
        return queryset.filter(missed_date__lte=cutoff_date)
    
    class Meta:
        model = MissedAppointmentAlert
        fields = ['status', 'enrollment']
