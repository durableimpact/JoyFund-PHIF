from django.core.cache import cache
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics
from rest_framework.response import Response

from accounts.utils.permissions import IsSystemAdmin

from ..models import Account, EscrowAccount, FeeAccount
from ..serializers.account import AccountSerializer, EscrowAccountSerializer, FeeAccountSerializer

CACHE_TIMEOUT = 60

class AccountListView(generics.ListAPIView):
    """
    List all financial accounts in the system (all concrete types).
    Accessible by System Admins only.
    """
    queryset = Account.objects.order_by('created_at')
    serializer_class = AccountSerializer
    permission_classes = [IsSystemAdmin]
    search_fields = ['name']
    ordering_fields = ['name', 'balance', 'created_at']
    ordering = ['created_at']

    @swagger_auto_schema(
        tags=['Payments — Accounts'],
        operation_summary="List all Accounts",
        operation_description=(
            "Returns all financial accounts with their current balance.\n\n"
            "**Filters:** `search` (name), `ordering` (name, balance, created_at)"
        ),
    )
    def get(self, request, *args, **kwargs):
        cache_key = 'account_list'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached['data'], status=cached['status'])
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, {'data': response.data, 'status': response.status_code}, CACHE_TIMEOUT)
        return response


class EscrowAccountDetailView(generics.RetrieveAPIView):
    """
    Retrieve the singleton Escrow Account.
    Accessible by System Admins only.
    """
    serializer_class = EscrowAccountSerializer
    permission_classes = [IsSystemAdmin]

    def get_object(self):
        return EscrowAccount.get_instance()

    @swagger_auto_schema(
        tags=['Payments — Accounts'],
        operation_summary="Get Escrow Account",
        operation_description="Returns the singleton Escrow Account that holds funds awaiting disbursement.",
    )
    def get(self, request, *args, **kwargs):
        cache_key = 'escrow_account_detail'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached['data'], status=cached['status'])
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, {'data': response.data, 'status': response.status_code}, CACHE_TIMEOUT)
        return response


class FeeAccountDetailView(generics.RetrieveAPIView):
    """
    Retrieve the singleton Fee Account.
    Accessible by System Admins only.
    """
    serializer_class = FeeAccountSerializer
    permission_classes = [IsSystemAdmin]

    def get_object(self):
        return FeeAccount.get_instance()

    @swagger_auto_schema(
        tags=['Payments — Accounts'],
        operation_summary="Get Fee Account",
        operation_description="Returns the singleton Fee Account that accumulates platform fee revenue.",
    )
    def get(self, request, *args, **kwargs):
        cache_key = 'fee_account_detail'
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached['data'], status=cached['status'])
        
        response = super().get(request, *args, **kwargs)
        cache.set(cache_key, {'data': response.data, 'status': response.status_code}, CACHE_TIMEOUT)
        return response
