from decimal import Decimal
from typing import Optional, List, Tuple, Dict, Any
import logging
import traceback
from django.db import transaction
from django.utils import timezone
from django.db.models import F, Sum, Value, Q, DecimalField, ExpressionWrapper
from django.db.models.functions import Coalesce

from hospitals.models import (
    MedicalClaim,
    VoucherTopUpRequest,
    VoucherTopUpRequestStatus,
)
from vouchers.models import Voucher, VoucherFunding
from campaigns.models import Campaign, CampaignTransaction
from logs.models import ActivityLog, ErrorLog

logger = logging.getLogger(__name__)


def _log_activity(
    action: str,
    description: str,
    level: str = "INFO",
    target_type: Optional[str] = None,
    target_id: Optional[Any] = None,
    target_label: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> None:
    """Persist a structured activity log entry."""
    try:
        ActivityLog.objects.create(
            actor_label="system",
            action=action,
            level=level,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            target_label=target_label or "",
            description=description,
            metadata=metadata or {},
        )
    except Exception as exc:
        logger.error("Failed to write ActivityLog: %s", exc)


def _log_error(
    error_type: str = "ValueError",
    error_message: str = "",
    path: str = "services",
    extra: Optional[Dict] = None,
) -> None:
    """Persist an error log entry."""
    try:
        ErrorLog.objects.create(
            error_type=error_type,
            error_message=error_message,
            stack_trace=traceback.format_exc(),
            path=path,
            extra=extra or {},
        )
    except Exception as exc:
        logger.error("Failed to write ErrorLog: %s", exc)


@transaction.atomic
def approve_top_up_request_and_allocate_funds(
    top_up_request: VoucherTopUpRequest,
    system_admin,
    campaign_allocations: List[Dict[str, Any]],
    review_notes: str = "",
) -> Tuple[bool, str]:
    """
    Admin approves a top-up request and allocates funds from specified campaigns.
    Uses select_for_update() to prevent race conditions on campaign balances.

    Args:
        top_up_request: VoucherTopUpRequest instance
        system_admin: SystemAdmin user instance
        campaign_allocations: List of {campaign_id, amount} dicts
        review_notes: Optional admin notes

    Returns:
        (success: bool, message: str)
    """

    if top_up_request.status != VoucherTopUpRequestStatus.PENDING:
        return False, f"Request status is {top_up_request.status}, not PENDING."

    medical_claim = top_up_request.medical_claim
    voucher = medical_claim.voucher
    requested_amount = top_up_request.requested_amount

    # Validate campaign allocations
    total_to_allocate = Decimal("0.00")
    allocations_to_create = []

    for allocation in campaign_allocations:
        campaign_id = allocation.get("campaign_id")
        amount = Decimal(str(allocation.get("amount", "0")))

        if amount <= 0:
            return False, f"Campaign {campaign_id}: amount must be > 0."

        # Use select_for_update to prevent race conditions
        try:
            campaign = Campaign.objects.select_for_update().get(id=campaign_id)
        except Campaign.DoesNotExist:
            return False, f"Campaign {campaign_id} not found."

        # Check available balance
        available = campaign.available_balance if hasattr(campaign, "available_balance") else 0
        if not hasattr(campaign, "available_balance"):
            campaign = Campaign.objects.annotate(
                available_balance=ExpressionWrapper(
                    Coalesce(
                        Sum("donations__net_amount", filter=Q(donations__status="SUCCESS")),
                        Value(0),
                    )
                    - F("total_disbursed")
                    - F("currently_allocated"),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                )
            ).select_for_update().get(id=campaign_id)
            available = campaign.available_balance

        if available < amount:
            return (
                False,
                f"Campaign '{campaign.title}' insufficient balance. "
                f"Available: {available} XAF, Requested: {amount} XAF.",
            )

        total_to_allocate += amount
        allocations_to_create.append((campaign, amount))

    # Validate total allocation doesn't exceed requested
    if total_to_allocate > requested_amount:
        return (
            False,
            f"Total allocation {total_to_allocate} exceeds requested {requested_amount}.",
        )

    # Create funding records and update campaigns
    for campaign, amount in allocations_to_create:
        voucher_funding = VoucherFunding.objects.create(
            voucher=voucher,
            campaign=campaign,
            committed_amount=amount,
            utilized_amount=Decimal("0.00"),
            refund_amount=Decimal("0.00"),
            status=VoucherFunding.FundingStatus.COMMITTED,
        )

        # Update campaign balance atomically
        campaign.currently_allocated = F("currently_allocated") + amount
        campaign.save(update_fields=["currently_allocated"])

        CampaignTransaction.objects.create(
            campaign=campaign,
            voucher_funding=voucher_funding,
            transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
            amount=amount,
            description=(
                f"Top-up allocation: {amount:.2f} XAF to voucher "
                f"{voucher.voucher_code} (Top-up Request #{top_up_request.id})"
            ),
        )

    # Update top-up request
    top_up_request.status = VoucherTopUpRequestStatus.APPROVED
    top_up_request.reviewed_by = system_admin
    top_up_request.review_notes = review_notes
    top_up_request.reviewed_at = timezone.now()
    top_up_request.save(
        update_fields=["status", "reviewed_by", "review_notes", "reviewed_at"]
    )

    _log_activity(
        action="voucher_top_up.approved",
        description=(
            f"Top-up request #{top_up_request.id} approved. "
            f"Allocated {total_to_allocate:.2f} XAF from {len(allocations_to_create)} campaign(s) "
            f"to voucher {voucher.voucher_code}."
        ),
        level="INFO",
        target_type="VoucherTopUpRequest",
        target_id=top_up_request.id,
        metadata={
            "voucher_code": voucher.voucher_code,
            "total_allocated": str(total_to_allocate),
            "campaigns_count": len(allocations_to_create),
        },
    )

    return True, f"Top-up approved. Allocated {total_to_allocate:.2f} XAF."


@transaction.atomic
def mark_claim_service_complete(
    medical_claim: MedicalClaim, receptionist
) -> Tuple[bool, str]:
    """
    Receptionist marks that all services have been rendered.

    Returns:
        (success: bool, message: str)
    """

    if medical_claim.submitted_by != receptionist:
        return (
            False,
            "Only the receptionist who submitted the claim can mark it complete.",
        )

    if medical_claim.service_completed_at is not None:
        return False, "Service already marked as complete."

    medical_claim.service_completed_at = timezone.now()
    medical_claim.save(update_fields=["service_completed_at"])

    _log_activity(
        action="medical_claim.service_complete",
        description=(
            f"Service marked as complete for claim {medical_claim.id} "
            f"(Voucher: {medical_claim.voucher.voucher_code})"
        ),
        level="INFO",
        target_type="MedicalClaim",
        target_id=medical_claim.id,
        metadata={"voucher_code": medical_claim.voucher.voucher_code},
    )

    return True, "Service marked as complete. Ready for admin final verification."


def send_campaign_contributor_notifications(voucher_id: str) -> None:
    """
    Notify campaign creators whose campaigns contributed to this voucher.
    Can be used as a celery task or called directly.
    """
    try:
        voucher = Voucher.objects.get(id=voucher_id)
        medical_claim = voucher.medical_claim

        # Get all campaigns that funded this voucher
        funding_records = voucher.funding_records.filter(
            status=VoucherFunding.FundingStatus.UTILIZED
        ).select_related("campaign")

        for funding in funding_records:
            campaign = funding.campaign

            message = (
                f"Your campaign '{campaign.title}' helped beneficiary "
                f"{voucher.beneficiary.full_name} receive "
                f"{medical_claim.service_description} at {voucher.hospital.name} "
                f"on {medical_claim.service_completed_at.strftime('%Y-%m-%d')}."
            )

            # Log the notification
            _log_activity(
                action="campaign.contribution_notification",
                description=message,
                level="INFO",
                target_type="Campaign",
                target_id=campaign.id,
                metadata={
                    "voucher_code": voucher.voucher_code,
                    "beneficiary": voucher.beneficiary.full_name,
                },
            )
    except Exception as exc:
        _log_error(
            error_type="NotificationError",
            error_message=f"Failed to send campaign notifications: {str(exc)}",
            extra={"voucher_id": str(voucher_id)},
        )
