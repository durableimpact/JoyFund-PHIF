import uuid
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from django.dispatch import receiver
from django.db.models.signals import post_save

from campaigns.models import Donation
from .models import (
    EscrowAccount,
    FeeAccount,
    FeePolicy,
    FeeSplit,
    PaymentGateway,
    Transaction,
)


def create_default_fee_policy(sender, **kwargs):
    """Seed the default FeePolicy after migrations. Connected via AppConfig.ready()."""
    FeePolicy.objects.get_or_create(
        name="JoyFund Fund Split",
        defaults={
            'platform_fee_percentage': Decimal('5.00'),
            'escrow_fee_percentage': Decimal('95.00'),
        }
    )


def create_campay_gateway(sender, **kwargs):
    """Seed the CamPay PaymentGateway after migrations. Connected via AppConfig.ready()."""
    PaymentGateway.objects.get_or_create(
        name="CAMPAY",
        defaults={
            'description': 'CamPay mobile money gateway (MTN & Orange)',
            'is_active': True,
        }
    )


@receiver(post_save, sender=Donation)
def create_transactions_on_successful_donation(sender, instance: Donation, **kwargs):
    """
    When a Donation transitions to SUCCESS:
      1. Record an inbound DONATION transaction (gross amount -> EscrowAccount).
      2. Record a FeeSplit using the active FeePolicy.
      3. Record an outbound PLATFORM_FEE transaction (EscrowAccount -> FeeAccount).
      4. Update both account balances.
      5. Update Campaign.current_amount with the escrow portion.
    """
    if instance.status != 'SUCCESS':
        return

    # Guard: skip if already processed to prevent duplicate transactions on re-save
    if Transaction.objects.filter(donation=instance, type='DONATION').exists():
        return

    policy = FeePolicy.objects.filter(is_active=True).first()
    if not policy:
        return

    gross = instance.amount
    escrow_amount = (policy.escrow_fee_percentage / Decimal('100')) * gross
    platform_amount = (policy.platform_fee_percentage / Decimal('100')) * gross

    payment = instance.payment
    escrow = EscrowAccount.get_instance()
    fee_account = FeeAccount.get_instance()

    # Resolve the PaymentGateway by the payment method name (MTN / ORANGE)
    provider = PaymentGateway.objects.filter(
        name__iexact="CAMPAY", is_active=True
    ).first()

    with transaction.atomic():
        # 1. Inbound DONATION transaction — full gross amount enters the Escrow
        donation_tx = Transaction.objects.create(
            donation=instance,
            type='DONATION',
            direction=Transaction.Direction.IN,
            amount=gross,
            gateway=provider,
            gateway_transaction_id=payment.payment_reference or str(uuid.uuid4()),
            status='SUCCESSFUL',
            destination=escrow,
        )

        # 2. Audit trail: record the fee split applied to this donation
        FeeSplit.objects.create(
            transaction=donation_tx,
            fee_policy=policy,
            gross_amount=gross,
            escrow_amount=escrow_amount,
            platform_amount=platform_amount,
        )

        # 3. Outbound PLATFORM_FEE transaction — platform cut leaves Escrow -> FeeAccount
        Transaction.objects.create(
            donation=instance,
            type='PLATFORM_FEE',
            direction=Transaction.Direction.OUT,
            amount=platform_amount,
            gateway=provider,
            gateway_transaction_id=str(uuid.uuid4()),
            status='SUCCESSFUL',
            source=escrow,
            destination=fee_account,
        )

        # 4. Update account balances atomically
        EscrowAccount.objects.filter(pk=escrow.pk).update(
            balance=F('balance') + escrow_amount
        )
        FeeAccount.objects.filter(pk=fee_account.pk).update(
            balance=F('balance') + platform_amount
        )

        # 5. Reflect the escrow portion on the campaign's fundraising progress
        instance.campaign.__class__.objects.filter(pk=instance.campaign_id).update(
            current_amount=F('current_amount') + escrow_amount
        )
