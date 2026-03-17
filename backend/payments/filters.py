import django_filters

from .models import FeePolicy, PaymentGateway, Transaction, FeeSplit, WebhookEvent


class FeePolicyFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = FeePolicy
        fields = ['is_active']


class PaymentGatewayFilter(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = PaymentGateway
        fields = ['is_active']


class TransactionFilter(django_filters.FilterSet):
    type = django_filters.ChoiceFilter(choices=Transaction.TRANSACTION_TYPES)
    direction = django_filters.ChoiceFilter(choices=Transaction.Direction.choices)
    status = django_filters.ChoiceFilter(choices=Transaction.TRANSACTION_STATUS)
    currency = django_filters.CharFilter(lookup_expr='iexact')
    provider = django_filters.ModelChoiceFilter(queryset=PaymentGateway.objects.all())
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Transaction
        fields = ['type', 'direction', 'status', 'currency', 'provider']


class FeeSplitFilter(django_filters.FilterSet):
    fee_policy = django_filters.ModelChoiceFilter(queryset=FeePolicy.objects.all())
    min_gross = django_filters.NumberFilter(field_name='gross_amount', lookup_expr='gte')
    max_gross = django_filters.NumberFilter(field_name='gross_amount', lookup_expr='lte')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = FeeSplit
        fields = ['fee_policy']


class WebhookEventFilter(django_filters.FilterSet):
    gateway = django_filters.ModelChoiceFilter(queryset=PaymentGateway.objects.all())
    event_type = django_filters.CharFilter(lookup_expr='icontains')
    received_after = django_filters.DateTimeFilter(field_name='received_at', lookup_expr='gte')
    received_before = django_filters.DateTimeFilter(field_name='received_at', lookup_expr='lte')

    class Meta:
        model = WebhookEvent
        fields = ['gateway', 'event_type']
