import django_filters

from vouchers.models import CareVoucher, VoucherAssignment


class VoucherAssignmentFilter(django_filters.FilterSet):
    matched_after = django_filters.DateTimeFilter(field_name='matched_at', lookup_expr='gte')
    matched_before = django_filters.DateTimeFilter(field_name='matched_at', lookup_expr='lte')

    class Meta:
        model = VoucherAssignment
        fields = {
            'status': ['exact'],
            'beneficiary': ['exact'],
            'hospital': ['exact'],
            'assigned_to': ['exact'],
        }


class CareVoucherFilter(django_filters.FilterSet):
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = CareVoucher
        fields = {
            'status': ['exact'],
            'hospital': ['exact'],
            'beneficiary': ['exact'],
        }
