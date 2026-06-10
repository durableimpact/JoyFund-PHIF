from django.core.cache import cache
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from rest_framework import viewsets, mixins

from accounts.utils.permissions import IsSystemAdmin
from ..filters import TransactionFilter, FeeSplitFilter
from ..models import Transaction, FeeSplit
from ..serializers.transaction import TransactionSerializer, FeeSplitSerializer

CACHE_TIMEOUT = 60  # 5 minutes


@method_decorator(name='list', decorator=swagger_auto_schema(
    tags=['Payments — Transactions'],
    operation_summary="List Transactions",
    operation_description=(
        "**Filters:** `type`, `direction`, `status`, `currency`, `gateway`, "
        "`min_amount`, `max_amount`, `created_after`, `created_before`\n\n"
        "**Search:** `gateway_transaction_id`\n\n"
        "**Ordering:** `amount`, `status`, `created_at`"
    ),
))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(
    tags=['Payments — Transactions'], operation_summary="Get Transaction",
))
class TransactionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Read-only access to all financial transactions.
    Accessible by System Admins only.

    Transactions are created by the system and cannot be created, updated,
    or deleted via the API.
    """
    queryset = Transaction.objects.select_related(
        'donation', 'provider', 'source', 'destination',
        'fee_split', 'fee_split__fee_policy',
    ).order_by('-created_at')
    serializer_class = TransactionSerializer
    permission_classes = [IsSystemAdmin]
    filterset_class = TransactionFilter
    search_fields = ['gateway_transaction_id']
    ordering_fields = ['amount', 'status', 'created_at']
    ordering = ['-created_at']

    @staticmethod
    def _get_list_cache_key():
        return 'transaction_list'

    @staticmethod
    def _get_detail_cache_key(transaction_id):
        return f'transaction_detail_{transaction_id}'

    def list(self, request, *args, **kwargs):
        cache_key = self._get_list_cache_key()
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response

    def retrieve(self, request, *args, **kwargs):
        transaction_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(transaction_id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response


@method_decorator(name='list', decorator=swagger_auto_schema(
    tags=['Payments — Fee Splits'],
    operation_summary="List Fee Splits",
    operation_description=(
        "**Filters:** `fee_policy`, `min_gross`, `max_gross`, `created_after`, `created_before`\n\n"
        "**Ordering:** `gross_amount`, `escrow_amount`, `platform_amount`, `created_at`"
    ),
))
@method_decorator(name='retrieve', decorator=swagger_auto_schema(
    tags=['Payments — Fee Splits'], operation_summary="Get Fee Split",
))
class FeeSplitViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Read-only access to fee split records.
    Accessible by System Admins only.
    """
    queryset = FeeSplit.objects.select_related('transaction', 'fee_policy').order_by('-created_at')
    serializer_class = FeeSplitSerializer
    permission_classes = [IsSystemAdmin]
    filterset_class = FeeSplitFilter
    ordering_fields = ['gross_amount', 'escrow_amount', 'platform_amount', 'created_at']
    ordering = ['-created_at']

    @staticmethod
    def _get_list_cache_key():
        return 'fee_split_list'

    @staticmethod
    def _get_detail_cache_key(fee_split_id):
        return f'fee_split_detail_{fee_split_id}'

    def list(self, request, *args, **kwargs):
        cache_key = self._get_list_cache_key()
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response

    def retrieve(self, request, *args, **kwargs):
        fee_split_id = kwargs.get('pk')
        cache_key = self._get_detail_cache_key(fee_split_id)
        cached_response = cache.get(cache_key)
        if cached_response is not None:
            return cached_response
        
        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response, CACHE_TIMEOUT)
        return response
