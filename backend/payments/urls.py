from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.account import AccountListView, EscrowAccountDetailView, FeeAccountDetailView
from .views.campay import CampayBalanceView, CampayDisburseView, CampayTransactionStatusView
from .views.fee_policy import FeePolicyViewSet
from .views.gateway import PaymentGatewayViewSet
from .views.transaction import TransactionViewSet, FeeSplitViewSet
from .views.webhook import WebhookEventViewSet, PaymentWebhookView
from .views.disbursement import DisbursementViewSet

app_name = 'payments'

router = DefaultRouter()
router.register('fee-policies', FeePolicyViewSet, basename='fee-policy')
router.register('gateways', PaymentGatewayViewSet, basename='gateway')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('fee-splits', FeeSplitViewSet, basename='fee-split')
router.register('webhooks', WebhookEventViewSet, basename='webhook')
router.register('disbursements', DisbursementViewSet, basename='disbursement')

urlpatterns = [
    # Account endpoints
    path('accounts/', AccountListView.as_view(), name='account-list'),
    path('accounts/escrow/', EscrowAccountDetailView.as_view(), name='escrow-account'),
    path('accounts/fee/', FeeAccountDetailView.as_view(), name='fee-account'),

    # Webhook endpoint
    path('webhook/', PaymentWebhookView.as_view(), name='payment-webhook'),

    # Campay API endpoints (system-admin only)
    path('campay/balance/', CampayBalanceView.as_view(), name='campay-balance'),
    path('campay/disburse/', CampayDisburseView.as_view(), name='campay-disburse'),
    path('campay/transaction-status/', CampayTransactionStatusView.as_view(), name='campay-transaction-status'),

    # Router-registered ViewSets
    path('', include(router.urls)),
]
