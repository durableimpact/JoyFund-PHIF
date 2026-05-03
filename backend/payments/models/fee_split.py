from django.db import models
from .transaction import Transaction
from .fee_policy import FeePolicy

class FeeSplit(models.Model):
    """
    Records the exact fee deduction applied to a single DONATION transaction.

    When a donation is received, the active FeePolicy determines how the gross
    amount is split between the EscrowAccount (funds held for beneficiary care)
    and the FeeAccount (platform operating revenue).

        gross_amount = escrow_amount + platform_amount

    Storing both amounts alongside the policy that was active at the time
    creates an immutable audit trail — even if the FeePolicy rates change later.
    """
    id = models.AutoField(primary_key=True)
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='fee_split',
        limit_choices_to={'type': 'DONATION'},
        help_text="The DONATION transaction this split was calculated from.",
    )
    fee_policy = models.ForeignKey(
        FeePolicy,
        on_delete=models.PROTECT,
        related_name='fee_splits',
        help_text="The fee policy that was active when this split was calculated.",
    )
    gross_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Total donation amount before any deduction (XAF).",
    )
    escrow_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Amount routed to the Escrow Account for beneficiary care (XAF).",
    )
    platform_amount = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Amount routed to the Fee Account for platform operations (XAF).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"FeeSplit #{self.id} | Gross: {self.gross_amount} XAF → "
            f"Escrow: {self.escrow_amount} XAF / Platform: {self.platform_amount} XAF "
            f"(Policy: {self.fee_policy.name})"
        )
