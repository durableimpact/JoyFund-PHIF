import uuid
from django.db import models

class EscrowLedgerEntry(models.Model):
    """
    Tracks a discrete tranche of campaign funds that have been moved into the
    escrow pool and flagged as ready for beneficiary assignment.

    Lifecycle
    ---------
    PENDING  →  READY  →  ASSIGNED
                       ↘  RETURNED   (when a voucher expires and funds go back)

    This model is the financial spine of Stage 3 of the voucher process:
    the matching engine queries for READY entries when looking for funds to
    pair with a high-priority waiting-pool beneficiary.
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending (Campaign milestone not yet reached)'
        READY = 'READY', 'Ready for Assignment'
        ASSIGNED = 'ASSIGNED', 'Assigned to Beneficiary'
        RETURNED = 'RETURNED', 'Returned to Escrow Pool'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    campaign = models.ForeignKey(
        'campaigns.Campaign',
        on_delete=models.CASCADE,
        related_name='escrow_entries',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )

    # Link to the VoucherAssignment that consumed this entry (set when ASSIGNED)
    assignment = models.ForeignKey(
        'vouchers.VoucherAssignment',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='escrow_entries',
    )

    # Human-readable note about which campaign milestone triggered the release
    triggered_by_milestone = models.CharField(
        max_length=255, blank=True,
        help_text='Description of the campaign milestone that released these funds',
    )
    notes = models.TextField(blank=True)

    # Timestamps for each status transition
    ready_at = models.DateTimeField(null=True, blank=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Escrow Ledger Entry'
        verbose_name_plural = 'Escrow Ledger Entries'

    def __str__(self):
        return (
            f"{self.amount} XAF from '{self.campaign.title}'"
            f" — {self.get_status_display()}"
        )
