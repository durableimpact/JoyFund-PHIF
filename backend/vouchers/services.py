from vouchers.models import Voucher, VoucherFunding
from campaigns.models import Campaign, CampaignTransaction
from hospitals.models import (
    Hospital,
    MedicalClaim,
    ClaimItem,
    ClaimStatus,
    MedicalClaimProof,
    VerificationStatus,
    PartnershipStatus,
)
from beneficiaries.models import (
    HealthIssue,
    HealthIssueStatus,
    HealthIssueCategoryChoices,
)
from logs.models import ActivityLog, ErrorLog

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
import logging
import traceback

from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D

from decimal import Decimal
from django.db.models import Sum, F, Value, DecimalField, ExpressionWrapper, Q, QuerySet
from django.db.models.functions import Coalesce
from typing import Optional, Literal, Any, Dict

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Internal logging helpers
# ---------------------------------------------------------------------------


def _log_activity(
    action: str,
    description: str,
    level: Literal["INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO",
    target_type: Optional[str] = None,
    target_id: Optional[Any] = None,
    target_label: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> None:
    """Persist a structured activity log entry to the database."""
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
        # Never let logging break the caller — fall back to file logger
        logger.error("Failed to write ActivityLog: %s", exc)


def _log_error(
    error_type: Literal["ValueError", "DatabaseError"] = "ValueError",
    error_message: str = "",
    path: str = "services",
    extra: Optional[Dict] = None,
) -> None:
    """Persist an error log entry with the current stack trace."""
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


# ---------------------------------------------------------------------------
# Campaign balance helper
# ---------------------------------------------------------------------------


def get_campaign_with_available_balance(
    threshold: Decimal = Decimal("0"),
) -> QuerySet[Campaign]:
    """
    Retrieve campaigns that have an available balance greater than the specified threshold.
    Returns a queryset ordered by newest first.
    """
    return (
        Campaign.objects.annotate(
            available_balance=ExpressionWrapper(
                Coalesce(
                    Sum("donations__net_amount", filter=Q(donations__status="SUCCESS")),
                    Value(0),
                )
                - F("total_disbursed")
                - F("currently_allocated"),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )
        .filter(available_balance__gt=threshold, is_active=True)
        .order_by("-created_at")
    )


# ---------------------------------------------------------------------------
# Voucher settlement
# ---------------------------------------------------------------------------


@transaction.atomic
def allocate_funds_to_voucher(
    campaign: Campaign, voucher_funding: VoucherFunding, committed_amount: float
) -> tuple[bool, str]:
    """
    Called when voucher is created from an approved health issue.
    Allocates funds from the campaign to the voucher.
    """

    try:
        if committed_amount <= 0:
            raise ValueError("Committed amount must be greater than zero.")

        if committed_amount > campaign.available_balance:
            raise ValueError("Committed amount exceeds campaign's available balance.")

        campaign.currently_allocated += committed_amount
        campaign.save(update_fields=["currently_allocated"])

        CampaignTransaction.objects.create(
            campaign=campaign,
            voucher_funding=voucher_funding,
            transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
            amount=committed_amount,
            description=f"Allocated {committed_amount:.2f} XAF to voucher {voucher_funding.voucher.voucher_code} for health issue #{voucher_funding.voucher.health_issue.id}",
        )
        _log_activity(
            action="Voucher Funding Allocation",
            description=f"Successfully allocated {committed_amount:.2f} XAF from campaign {campaign.name} to voucher {voucher_funding.voucher.voucher_code} for health issue #{voucher_funding.voucher.health_issue.id}",
            level="INFO",
            target_type="voucher",
            target_id=voucher_funding.voucher.id,
            target_label=voucher_funding.voucher.voucher_code,
            metadata={
                "campaign": campaign.id,
                "voucher_funding": voucher_funding.id,
                "committed_amount": committed_amount,
            },
        )
        return True, "Funds allocated successfully"
    except Exception as e:
        _log_error(
            error_type="Voucher Funding Allocation Failed",
            error_message=str(e),
            path="vouchers.services.allocate_funds_to_voucher",
            extra={
                "campaign": campaign.id,
                "voucher_funding": voucher_funding.id,
                "committed_amount": committed_amount,
            },
        )
        return False, str(e)


@transaction.atomic
def settle_voucher_with_campaign_updates(voucher: Voucher):
    """
    Called when a voucher is settled by a hospital.

    - Deducts from campaign.currently_allocated
    - Adds to campaign.total_disbursed
    - Updates voucher status and actual amount used
    """

    medical_claim = (
        MedicalClaim.objects.filter(voucher=voucher)
        .prefetch_related("claim_items", "proofs")
        .first()
    )

    if not medical_claim:
        msg = f"No medical claim found for voucher {voucher.voucher_code}."
        _log_activity(
            action="voucher.settlement.failed",
            description=msg,
            level="ERROR",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={"voucher_code": voucher.voucher_code},
        )
        _log_error(
            error_type="MissingMedicalClaim",
            error_message=msg,
            extra={"voucher_id": str(voucher.id)},
        )
        return False, msg

    # Claim must be approved
    if medical_claim.claim_status != ClaimStatus.APPROVED:
        msg = (
            f"Voucher {voucher.voucher_code} settlement blocked: "
            f"claim status is '{medical_claim.claim_status}', expected 'APPROVED'."
        )
        _log_activity(
            action="voucher.settlement.failed",
            description=msg,
            level="WARNING",
            target_type="MedicalClaim",
            target_id=medical_claim.id,
            metadata={
                "voucher_code": voucher.voucher_code,
                "claim_status": medical_claim.claim_status,
            },
        )
        return False, msg

    if medical_claim.total_cost <= 0:
        msg = (
            f"Voucher {voucher.voucher_code} settlement blocked: "
            f"claim total cost is '{medical_claim.total_cost}', expected > 0."
        )
        _log_activity(
            action="voucher.settlement.failed",
            description=msg,
            level="WARNING",
            target_type="MedicalClaim",
            target_id=medical_claim.id,
            metadata={
                "voucher_code": voucher.voucher_code,
                "claim_total_cost": medical_claim.total_cost,
            },
        )
        return False, msg

    fundings = (
        voucher.funding_records.filter(status=VoucherFunding.FundingStatus.COMMITTED)
        .select_related("campaign")
        .order_by("committed_at")
    )

    if not fundings.exists():
        msg = f"Voucher {voucher.voucher_code} has no committed funding records to settle."
        _log_activity(
            action="voucher.settlement.failed",
            description=msg,
            level="ERROR",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={"voucher_code": voucher.voucher_code},
        )
        return False, msg

    # check if medical claim has been approved before proceeding to settlement
    if medical_claim.claim_status != ClaimStatus.APPROVED:
        msg = (
            f"Voucher {voucher.voucher_code} settlement blocked: "
            f"claim status is '{medical_claim.claim_status}', expected 'APPROVED'."
        )
        _log_activity(
            action="voucher.settlement.failed",
            description=msg,
            level="WARNING",
            target_type="MedicalClaim",
            target_id=medical_claim.id,
            metadata={
                "voucher_code": voucher.voucher_code,
                "claim_status": medical_claim.claim_status,
            },
        )
        return False, msg

    claim_items: QuerySet[MedicalClaim] = medical_claim.claim_items.all()

    services_list = [item.name for item in claim_items]

    fundings_list = list(fundings)

    # Check if all medical claim proof are verified before proceeding to settlement

    proofs: QuerySet[MedicalClaimProof] = medical_claim.proofs.all()

    if not proofs.exists():
        msg = (
            f"Voucher {voucher.voucher_code} settlement blocked: "
            "no proof documents uploaded for this claim."
        )
        _log_activity(
            action="voucher.settlement.failed",
            description=msg,
            level="WARNING",
            target_type="MedicalClaim",
            target_id=medical_claim.id,
            metadata={"voucher_code": voucher.voucher_code},
        )
        return False, msg

    # Check if some proofs are not verified
    unverified = proofs.exclude(verification_status=VerificationStatus.VERIFIED)
    if unverified.exists():
        msg = (
            f"Voucher {voucher.voucher_code} settlement blocked: "
            f"{unverified.count()} proof document(s) are not yet verified."
        )
        _log_activity(
            action="voucher.settlement.failed",
            description=msg,
            level="WARNING",
            target_type="MedicalClaim",
            target_id=medical_claim.id,
            metadata={
                "voucher_code": voucher.voucher_code,
                "unverified_count": unverified.count(),
            },
        )
        return False, msg

    medical_claim_cost = sum(item.amount for item in claim_items)

    # Check if there is only one voucher funding to know if we have to make refund becuase if it is more than one voucher it means we added funds to the voucher to complete what the medical claim was asking

    if len(fundings) == 1 and medical_claim_cost <= fundings[0].committed_amount:
        # Now we proceed to the refund to the campaign so the funds can be allocated to other beneficiaries health issue
        funding: VoucherFunding = fundings[0]
        campaign: Campaign = funding.campaign

        refund_amount: Decimal = max(
            Decimal("0.00"),
            funding.committed_amount - medical_claim_cost,
        )
        actual_utilized: Decimal = min(funding.committed_amount, medical_claim_cost)

        funding.utilized_amount = actual_utilized
        funding.refund_amount = refund_amount
        funding.utilized_at = timezone.now()
        funding.status = VoucherFunding.FundingStatus.UTILIZED
        funding.save(
            update_fields=["utilized_amount", "refund_amount", "utilized_at", "status"]
        )

        # Release the full committed amount from currently_allocated,
        # then record only what was actually disbursed
        campaign.currently_allocated -= funding.committed_amount
        campaign.total_disbursed += medical_claim_cost
        campaign.save(update_fields=["currently_allocated", "total_disbursed"])

        # Log the hospital settlement transaction
        CampaignTransaction.objects.create(
            campaign=campaign,
            voucher_funding=funding,
            transaction_type=CampaignTransaction.TransactionType.HOSPITAL_SETTLED,
            amount=actual_utilized,
            description=(
                f"Funds settled: {actual_utilized:.2f} XAF to {voucher.hospital.name} "
                f"for voucher {voucher.voucher_code}. "
                f"Services: {', '.join(services_list)}"
            ),
        )

        # Check if a refund has been made if yes create a campaign traction with type `SURPLUS_REFUND`
        if funding.refund_amount > 0:
            # it means we have a refund the we create a campaign transaction

            CampaignTransaction.objects.create(
                campaign=campaign,
                voucher_funding=funding,
                transaction_type=CampaignTransaction.TransactionType.SURPLUS_REFUND,
                amount=refund_amount,
                description=(
                    f"Refunded {refund_amount:.2f} XAF "
                    f"from {funding.committed_amount:.2f} XAF committed "
                    f"(Voucher: {voucher.voucher_code})"
                ),
            )
            _log_activity(
                action="voucher.settlement.surplus_refund",
                description=(
                    f"Surplus of {refund_amount:.2f} XAF refunded to campaign "
                    f"'{campaign.title}' from voucher {voucher.voucher_code}."
                ),
                level="INFO",
                target_type="VoucherFunding",
                target_id=funding.id,
                metadata={
                    "voucher_code": voucher.voucher_code,
                    "refund_amount": str(refund_amount),
                    "campaign_id": str(campaign.id),
                },
            )

    else:
        remaining_cost = medical_claim_cost
        for funding in fundings:
            campaign: Campaign = funding.campaign

            if remaining_cost <= 0:
                # This funding record is fully surplus — cancel it
                funding.status = VoucherFunding.FundingStatus.CANCELLED
                funding.cancelled_at = timezone.now()
                funding.save(update_fields=["status", "cancelled_at"])

                # Release its allocation from the campaign
                campaign.currently_allocated -= funding.committed_amount
                campaign.save(update_fields=["currently_allocated"])

                _log_activity(
                    action="voucher.settlement.funding_cancelled",
                    description=(
                        f"Funding record {funding.id} cancelled for voucher "
                        f"{voucher.voucher_code} — cost already covered."
                    ),
                    level="INFO",
                    target_type="VoucherFunding",
                    target_id=funding.id,
                    metadata={
                        "voucher_code": voucher.voucher_code,
                        "committed_amount": str(funding.committed_amount),
                    },
                )
                continue

            utilize_amount: Decimal = min(funding.committed_amount, remaining_cost)
            remaining_cost -= utilize_amount
            funding.utilized_amount = utilize_amount
            funding.refund_amount = Decimal("0.0")
            funding.status = VoucherFunding.FundingStatus.UTILIZED
            funding.utilized_at = timezone.now()
            funding.save(
                update_fields=[
                    "utilized_amount",
                    "status",
                    "refund_amount",
                    "utilized_at",
                ]
            )

            campaign.currently_allocated -= funding.committed_amount
            campaign.total_disbursed += utilize_amount
            campaign.save(update_fields=["currently_allocated", "total_disbursed"])

            CampaignTransaction.objects.create(
                campaign=campaign,
                voucher_funding=funding,
                transaction_type=CampaignTransaction.TransactionType.HOSPITAL_SETTLED,
                amount=funding.utilized_amount,
                description=f"Funds settled: {funding.utilized_amount:.2f} XAF for voucher {voucher.voucher_code} at {voucher.hospital.name}. Services provided: {', '.join(services_list)}",
            )

    _log_activity(
        action="voucher.settlement.success",
        description=(
            f"Voucher {voucher.voucher_code} successfully settled. "
            f"Total cost: {medical_claim_cost:.2f} XAF to {voucher.hospital.name}."
        ),
        level="INFO",
        target_type="Voucher",
        target_id=voucher.id,
        target_label=voucher.voucher_code,
        metadata={
            "voucher_code": voucher.voucher_code,
            "medical_claim_cost": str(medical_claim_cost),
            "hospital": voucher.hospital.name,
            "funding_records_count": len(fundings_list),
        },
    )
    return True, f"Voucher {voucher.voucher_code} settled successfully."


@transaction.atomic
def create_voucher_from_approved_health_issue(
    health_issue: HealthIssue, hospital: Hospital, amount: Decimal, campaign: Campaign
) -> tuple[Optional[Voucher], str]:
    """
    Manual voucher creation by System Admin.
    Validates health issue status and unique constraint (one voucher per health issue).
    Allocates the specified amount from the selected campaign.
    """

    # 1. Validation
    if health_issue.status != HealthIssueStatus.VALIDATED:
        return None, f"Health Issue #{health_issue.id} is not VALIDATED."

    if Voucher.objects.filter(health_issue=health_issue).exists():
        return None, f"A voucher already exists for Health Issue #{health_issue.id}."

    if amount <= 0:
        return None, "Allocation amount must be greater than zero."

    # 2. Check Campaign Balance
    # We use a threshold of 0 here because we are explicitly checking the balance
    available = (
        campaign.available_balance if hasattr(campaign, "available_balance") else 0
    )
    # If campaign object wasn't annotated with available_balance, we fallback or re-calculate
    if not hasattr(campaign, "available_balance"):
        # Quick re-annotation for this specific campaign
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
        ).get(id=campaign.id)
        available = campaign.available_balance

    if amount > available:
        return (
            None,
            f"Insufficient funds in campaign '{campaign.title}'. Available: {available} XAF.",
        )

    # 3. Create Voucher
    voucher = Voucher.objects.create(
        beneficiary=health_issue.beneficiary,
        health_issue=health_issue,
        hospital=hospital,
        status=Voucher.Status.ACTIVE,
    )

    # 4. Create Funding Record
    voucher_funding = VoucherFunding.objects.create(
        voucher=voucher,
        campaign=campaign,
        committed_amount=amount,
        utilized_amount=Decimal("0.00"),
        refund_amount=Decimal("0.00"),
        status=VoucherFunding.FundingStatus.COMMITTED,
    )

    # 5. Update Campaign
    campaign.currently_allocated = F("currently_allocated") + amount
    campaign.save(update_fields=["currently_allocated"])

    # 6. Log Transaction
    CampaignTransaction.objects.create(
        campaign=campaign,
        voucher_funding=voucher_funding,
        transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
        amount=amount,
        description=f"Admin allocated {amount:.2f} XAF to voucher {voucher.voucher_code} for health issue #{health_issue.id}",
    )

    _log_activity(
        action="voucher.creation.manual",
        description=(
            f"Admin created voucher {voucher.voucher_code} for health issue #{health_issue.id}. "
            f"Allocated {amount:.2f} XAF from campaign '{campaign.title}'."
        ),
        level="INFO",
        target_type="Voucher",
        target_id=voucher.id,
        target_label=voucher.voucher_code,
        metadata={
            "health_issue_id": health_issue.id,
            "campaign_id": str(campaign.id),
            "amount": str(amount),
            "hospital": hospital.name,
        },
    )

    return voucher, "Voucher created successfully."


# ---------------------------------------------------------------------------
# Add more funds after a medical claim requests more
# ---------------------------------------------------------------------------


@transaction.atomic
def add_more_fund_to_voucher_after_medical_claim_request_more(
    voucher: Voucher,
) -> tuple[bool, str]:
    """
    This function is called when a medical claim is made for a voucher and the doctor realize that the amount that was allocated to the voucher is not suficient to cover all the cost of the medical claim so what we do is to add more fund to the voucher funding and if there is no campaign with available fund we create a campaign transaction with type `FUNDING_SHORTFALL` to keep track of those case and also to be able to report on them later and see how many time we have this case and how much we are loosing because of that.
    """

    # Get the medical claim to know how much money is required to cover the medical claim and also to get the services that are provided for the description of the campaign transaction that we are going to create later
    medical_claim: Optional[MedicalClaim] = (
        MedicalClaim.objects.filter(voucher=voucher)
        .prefetch_related("claim_items")
        .first()
    )

    if not medical_claim:
        msg = f"No medical claim found for voucher {voucher.voucher_code}. Cannot add funds."
        _log_activity(
            action="voucher.top_up.failed",
            description=msg,
            level="ERROR",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={"voucher_code": voucher.voucher_code},
        )
        return False, msg

    # Get toal commited amount to a voucher
    total_committed = voucher.funding_records.aggregate(
        total_committed=Coalesce(
            Sum(
                "committed_amount",
                filter=Q(status=VoucherFunding.FundingStatus.COMMITTED),
            ),
            Value(Decimal("0.00")),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
    )["total_committed"]

    # Get difference between the total commited and the medical claim cost to know how much we need to add to the voucher funding

    amount_needded: Decimal = Decimal(str(medical_claim.total_cost)) - total_committed

    if amount_needded <= 0:
        msg = (
            f"Voucher {voucher.voucher_code} already has sufficient committed funds "
            f"({total_committed:.2f} XAF) to cover the medical claim "
            f"({medical_claim.total_cost:.2f} XAF). No top-up needed."
        )
        _log_activity(
            action="voucher.top_up.skipped",
            description=msg,
            level="INFO",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={
                "voucher_code": voucher.voucher_code,
                "total_committed": str(total_committed),
                "claim_total": str(medical_claim.total_cost),
            },
        )
        return True, msg

    campaigns = get_campaign_with_available_balance(threshold=Decimal("10000"))

    if not campaigns.exists():
        msg = (
            f"No active campaigns with sufficient balance to top up voucher "
            f"{voucher.voucher_code}. Shortfall: {amount_needded:.2f} XAF."
        )
        _log_activity(
            action="voucher.top_up.shortfall",
            description=msg,
            level="ERROR",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={
                "voucher_code": voucher.voucher_code,
                "shortfall": str(amount_needded),
            },
        )
        _log_error(
            error_type="FundingShortfall",
            error_message=msg,
            extra={
                "voucher_id": str(voucher.id),
                "additional_amount": str(amount_needded),
            },
        )
        # Record shortfall for reporting
        CampaignTransaction.objects.create(
            campaign=None,
            voucher_funding=None,
            transaction_type=CampaignTransaction.TransactionType.FUNDING_SHORTFALL,
            amount=amount_needded,
            description=(
                f"Funding shortfall of {amount_needded:.2f} XAF for voucher "
                f"{voucher.voucher_code}. No campaigns with available balance."
            ),
        )
        return False, msg

    remaining = amount_needded
    allocations: list[tuple[Campaign, Decimal]] = []
    for campaign in campaigns:
        if remaining <= 0:
            break

        available = campaign.available_balance
        to_allocate = min(available, remaining)

        if to_allocate > 0:
            allocations.append((campaign, to_allocate))
            remaining -= to_allocate

    if remaining > 0:
        # Log the partial allocation and proceed to add funds with whatever
        # funds were collected. This preserves previous behaviour while avoiding a hard failure when only partial funding is available.
        allocated_total = sum(a[1] for a in allocations)
        _log_activity(
            action="voucher.top_up.partial",
            description=(
                f"Partial top-up for voucher {voucher.voucher_code}: "
                f"collected {allocated_total:.2f} XAF from {len(allocations)} campaign(s), "
                f"shortfall {remaining:.2f} XAF. Proceeding with available funds."
            ),
            level="WARNING",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={
                "allocated": str(allocated_total),
                "shortfall": str(remaining),
                "campaigns_count": len(allocations),
            },
        )

    for campaign, amount in allocations:
        committed_amount = Decimal(amount).quantize(Decimal("0.01"))
        voucher_funding = VoucherFunding.objects.create(
            voucher=voucher,
            campaign=campaign,
            committed_amount=committed_amount,
            utilized_amount=Decimal("0.00"),
            refund_amount=Decimal("0.00"),
        )
        # Ensure currently_allocated is Decimal and update
        campaign.currently_allocated = (
            Decimal(campaign.currently_allocated or 0) + committed_amount
        )
        campaign.save(update_fields=["currently_allocated"])

        CampaignTransaction.objects.create(
            campaign=campaign,
            voucher_funding=voucher_funding,
            transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
            amount=amount,
            description=(
                f"Top-up: {amount:.2f} XAF added to voucher {voucher.voucher_code} "
                f"after medical claim exceeded initial allocation "
                f"(HealthIssue #{voucher.health_issue.id})"
            ),
        )

    _log_activity(
        action="voucher.top_up.success",
        description=(
            f"Voucher {voucher.voucher_code} topped up successfully. "
            f"Added {sum(a[1] for a in allocations):.2f} XAF from "
            f"{len(allocations)} campaign(s)."
        ),
        level="INFO",
        target_type="Voucher",
        target_id=voucher.id,
        target_label=voucher.voucher_code,
        metadata={
            "voucher_code": voucher.voucher_code,
            "total_added": str(sum(a[1] for a in allocations)),
            "health_issue_id": voucher.health_issue.id,
        },
    )
    return True, f"Voucher {voucher.voucher_code} topped up successfully."


@transaction.atomic
def create_voucher_from_multiple_campaigns(
    health_issue: HealthIssue,
    hospital: Hospital,
    total_amount: Decimal,
    campaign_allocations: list,
) -> tuple[Optional[Voucher], str]:
    """
    Create a voucher funded by multiple campaigns.
    Each allocation specifies either a fixed amount or percentage to contribute.

    Args:
        health_issue: The validated health issue
        hospital: The hospital where services will be provided
        total_amount: Total amount to allocate across campaigns
        campaign_allocations: List of dicts with campaign_id and either amount or percentage

    Returns:
        Tuple of (Voucher object or None, message string)
    """

    # 1. Validation - Health Issue status
    if health_issue.status != HealthIssueStatus.VALIDATED:
        return None, f"Health Issue #{health_issue.id} is not VALIDATED."

    # 2. Validation - Uniqueness constraint
    if Voucher.objects.filter(health_issue=health_issue).exists():
        return None, f"A voucher already exists for Health Issue #{health_issue.id}."

    # 3. Validation - Total amount
    if total_amount <= 0:
        return None, "Total amount must be greater than zero."

    # 4. Process allocations and calculate actual amounts
    allocations_to_create = []
    total_allocated = Decimal("0.00")

    for allocation in campaign_allocations:
        campaign_id = allocation.get("campaign_id")
        if hasattr(campaign_id, "id"):
            campaign_id = campaign_id.id

        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            return None, f"Campaign {campaign_id} does not exist."

        # Calculate actual amount based on fixed or percentage
        if allocation.get("amount") is not None:
            amount = Decimal(str(allocation["amount"]))
        else:
            percentage = Decimal(str(allocation["percentage"]))
            amount = (total_amount * percentage / Decimal("100")).quantize(
                Decimal("0.01")
            )

        # Validate campaign balance
        available = (
            campaign.available_balance if hasattr(campaign, "available_balance") else 0
        )
        if not hasattr(campaign, "available_balance"):
            # Re-annotate if needed
            campaign = Campaign.objects.annotate(
                available_balance=ExpressionWrapper(
                    Coalesce(
                        Sum(
                            "donations__net_amount",
                            filter=Q(donations__status="SUCCESS"),
                        ),
                        Value(0),
                    )
                    - F("total_disbursed")
                    - F("currently_allocated"),
                    output_field=DecimalField(max_digits=12, decimal_places=2),
                )
            ).get(id=campaign_id)
            available = campaign.available_balance

        if available < amount:
            return (
                None,
                f"Campaign '{campaign.title}' has insufficient balance. Available: {available} XAF, Needed: {amount}.",
            )

        allocations_to_create.append((campaign, amount))
        total_allocated += amount

    # 5. Validate total allocation
    if total_allocated > total_amount:
        return (
            None,
            f"Total allocation {total_allocated} exceeds required amount {total_amount}.",
        )

    # 6. Create Voucher
    voucher = Voucher.objects.create(
        beneficiary=health_issue.beneficiary,
        health_issue=health_issue,
        hospital=hospital,
        status=Voucher.Status.ACTIVE,
    )

    # 7. Create Funding Records and update campaigns
    for campaign, amount in allocations_to_create:
        voucher_funding = VoucherFunding.objects.create(
            voucher=voucher,
            campaign=campaign,
            committed_amount=amount,
            utilized_amount=Decimal("0.00"),
            refund_amount=Decimal("0.00"),
            status=VoucherFunding.FundingStatus.COMMITTED,
        )

        campaign.currently_allocated = F("currently_allocated") + amount
        campaign.save(update_fields=["currently_allocated"])

        CampaignTransaction.objects.create(
            campaign=campaign,
            voucher_funding=voucher_funding,
            transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
            amount=amount,
            description=f"Allocated {amount:.2f} XAF to voucher {voucher.voucher_code} for health issue #{health_issue.id}",
        )

    # 8. Log Activity
    _log_activity(
        action="voucher.creation.multiple_campaigns",
        description=(
            f"Admin created voucher {voucher.voucher_code} for health issue #{health_issue.id}. "
            f"Allocated {total_allocated:.2f} XAF from {len(allocations_to_create)} campaign(s)."
        ),
        level="INFO",
        target_type="Voucher",
        target_id=voucher.id,
        target_label=voucher.voucher_code,
        metadata={
            "health_issue_id": health_issue.id,
            "hospital": hospital.name,
            "campaigns_count": len(allocations_to_create),
            "total_allocated": str(total_allocated),
        },
    )

    return voucher, "Voucher created successfully from multiple campaigns."
