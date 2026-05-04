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
from django.db.models import Sum, F, Value, DecimalField, ExpressionWrapper, Q,QuerySet
from django.db.models.functions import Coalesce
from typing import Optional,Literal,Any,Dict

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
)-> tuple[bool, str]:
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
        .prefetch_related("claim_items","proofs")
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
            campaign:Campaign = funding.campaign

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

            utilize_amount:Decimal = min(funding.committed_amount, remaining_cost)
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
def create_voucher_from_approved_health_issue(health_issue: HealthIssue) -> Optional[Voucher]:
    """
    Create a Voucher and associated VoucherFunding when a HealthIssue is approved.

    Steps:
    1. Create Voucher with status 'ACTIVE' linked to the HealthIssue
    2. Create VoucherFunding record to log the source of funds (e.g. Campaign or Hospital)
    3. Ensure atomicity so that both records are created successfully or rolled back together
    """

    if health_issue.status != HealthIssueStatus.VALIDATED:
        msg = (
            f"HealthIssue #{health_issue.id} is not in VALIDATED status "
            f"(current: '{health_issue.status}'). Cannot create voucher."
        )
        _log_activity(
            action="voucher.creation.failed",
            description=msg,
            level="WARNING",
            target_type="HealthIssue",
            target_id=health_issue.id,
            metadata={"health_issue_status": health_issue.status},
        )
        return None

    # get category of the health issue for the voucher
    category = health_issue.category

    # based on category we are going to assing some amount that would be allocated initially to the voucher funding

    base_amount_map = {
        HealthIssueCategoryChoices.MATERNAL: 250_000,
        HealthIssueCategoryChoices.ELDERLY: 150_000,
        HealthIssueCategoryChoices.EMERGENCY: 300_000,
        HealthIssueCategoryChoices.CHRONIC: 100_000,
    }
    base_amount = Decimal(str(base_amount_map.get(category, 50_000)))

    # search for active campaigns that match the health issue category
    campaigns = get_campaign_with_available_balance(base_amount)

    # prioritize newer campaigns

    if not campaigns.exists():
        msg = (
            f"No active campaigns with sufficient balance to fund this voucher "
            f"for HealthIssue #{health_issue.id}."
        )
        _log_activity(
            action="voucher.creation.failed",
            description=msg,
            level="ERROR",
            target_type="HealthIssue",
            target_id=health_issue.id,
            metadata={"health_issue_status": health_issue.status},
        )
        return None

    # Now search the hospital that is closest to the beneficiary location that can provide the needed services for the health issue and create the voucher with the hospital and campaign we found
    beneficiary = health_issue.beneficiary
    
    if not beneficiary.lat or not beneficiary.lng:
        msg = f"Beneficiary {beneficiary.digital_health_id} has no GPS coordinates. Cannot find nearby hospital."
        _log_activity(
            action="voucher.creation.failed",
            description=msg,
            level="ERROR",
            target_type="HealthIssue",
            target_id=health_issue.id,
            metadata={"beneficiary_id": str(beneficiary.id)},
        )
        return None

    # health issue category
    # health_issue_category = health_issue.category

    beneficiary_location = Point(
        float(beneficiary.lng), float(beneficiary.lat), srid=4326
    )

    # Get the hospitals that are within 20km radius from the beneficiary location and that are active and have an active partnership with us and that have gps coordinates and order them by distance to the beneficiary and take the first 5
    hospitals = (
        Hospital.objects.filter(
            gps_coordinates__isnull=False,
            is_active=True,
            partnership_status=PartnershipStatus.ACTIVE,
            gps_coordinates__distance_lte=(beneficiary_location, D(km=20)),
        )
        .annotate(distance=Distance("gps_coordinates", beneficiary_location))
        .order_by("distance")
    )

    # check if there are hospitals that match the criteria
    if not hospitals.exists():
        msg = (
            f"No active partner hospital found within 20 km of beneficiary "
            f"{beneficiary.digital_health_id} for HealthIssue #{health_issue.id}."
        )
        _log_activity(
            action="voucher.creation.failed",
            description=msg,
            level="ERROR",
            target_type="HealthIssue",
            target_id=health_issue.id,
            metadata={
                "beneficiary_id": str(beneficiary.id),
                "lat": str(beneficiary.lat),
                "lng": str(beneficiary.lng),
            },
        )
        return None

    if campaigns.count() >= 1:

        # if campaigns exist we take the first one and allocate funds to the voucher funding
        campaign:Campaign = campaigns.first()

        # select first hospital in the list that can provide the needed services for the health issue
        hospital = hospitals.first()

        # create the voucher with the first hospital in the list that can provide the needed services for the health issue
        voucher = Voucher.objects.create(
            beneficiary=beneficiary,
            health_issue=health_issue,
            hospital=hospital,
            status=Voucher.Status.ACTIVE,
        )

        # create the voucher funding with the campaign we found and the voucher we just created and the committed amount based on the health issue category
        voucher_funding = VoucherFunding.objects.create(
            voucher=voucher,
            campaign=campaign,
            committed_amount=base_amount,
            utilized_amount=0,
            refund_amount=0,
        )

        campaign.currently_allocated = (
            Decimal(campaign.currently_allocated or 0) + base_amount
        )
        campaign.save(update_fields=["currently_allocated"])

        CampaignTransaction.objects.create(
            campaign=campaign,
            voucher_funding=voucher_funding,
            transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
            amount=base_amount,
            description=f"Allocated {base_amount:.2f} XAF to voucher {voucher.voucher_code} for health issue #{health_issue.id}",
        )

        _log_activity(
            action="voucher.creation.success",
            description=(
                f"Voucher {voucher.voucher_code} created for HealthIssue #{health_issue.id}. "
                f"Fully funded ({base_amount:.2f} XAF) from campaign '{campaign.title}'."
            ),
            level="INFO",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={
                "health_issue_id": health_issue.id,
                "campaign_id": str(campaign.id),
                "amount": str(base_amount),
                "hospital": hospital.name,
            },
        )
        return voucher

    else:

        """
        if no campaing with those funds exits we are going to search for campaigns with funds,
        even if they are not enough as soon as they are funds what we are going to do is to look
        at campaings with funds even if it is to collect a percentage of it an assign to a voucher.

        For the percentage :
        80% for EMERGENCY and CHRONIC
        70% for MATERNAL
        50% for ELDERLY
        40% for other

        this percentage would be collected from the different campaigns until we reach to like a min 50% of
        the base amount and then we are going to create the voucher with the hospital and the campaign
        we found if that amount is not suficient while the patient is in the hospital and the
        receptionist add a medical claim from that we would get how much it is require to complete
        if what was allocated to the voucher was insufficient to what the doctor would do concerning the health issue.

        """

        coverage_map = {
            HealthIssueCategoryChoices.EMERGENCY: Decimal("0.8"),
            HealthIssueCategoryChoices.CHRONIC: Decimal("0.8"),
            HealthIssueCategoryChoices.MATERNAL: Decimal("0.7"),
            HealthIssueCategoryChoices.ELDERLY: Decimal("0.5"),
        }
        coverage = coverage_map.get(category, Decimal("0.4"))
        min_needed = (Decimal(str(base_amount)) * coverage).quantize(Decimal("0.01"))

        threshold = Decimal("10000")

        campaigns = get_campaign_with_available_balance(threshold=threshold)

        if not campaigns:
            msg = (
                f"No active campaigns with sufficient balance to partially fund "
                f"HealthIssue #{health_issue.id}. Required minimum: {min_needed:.2f} XAF."
            )
            _log_activity(
                action="voucher.creation.failed",
                description=msg,
                level="ERROR",
                target_type="HealthIssue",
                target_id=health_issue.id,
                metadata={
                    "category": category,
                    "base_amount": str(base_amount),
                    "min_needed": str(min_needed),
                },
            )
            _log_error(
                error_type="InsufficientCampaignFunds",
                error_message=msg,
                extra={"health_issue_id": health_issue.id},
            )
            return None

        remaining = min_needed
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
            # Log the partial allocation and proceed to create the voucher with whatever
            # funds were collected. This preserves previous behaviour of creating the
            # voucher while avoiding a hard failure when only partial funding is available.
            allocated_total = sum(a[1] for a in allocations)
            shortfall = remaining
            _log_activity(
            action="voucher.creation.partial_funding",
            description=(
                f"Partial allocation for HealthIssue #{health_issue.id}: "
                f"collected {allocated_total:.2f} XAF from {len(allocations)} campaign(s), "
                f"shortfall {shortfall:.2f} XAF. Proceeding with voucher creation."
            ),
            level="WARNING",
            target_type="HealthIssue",
            target_id=health_issue.id,
            metadata={
                "allocated_total": str(allocated_total),
                "shortfall": str(shortfall),
                "campaigns_count": len(allocations),
            },
        )

        # Create voucher and create voucher funding for each campaign allocation
        hospital = hospitals.first()

        voucher = Voucher.objects.create(
            beneficiary=beneficiary,
            health_issue=health_issue,
            hospital=hospital,
            status=Voucher.Status.ACTIVE,
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
                amount=committed_amount,
                description=f"Allocated {committed_amount:.2f} XAF to voucher {voucher.voucher_code} for health issue #{health_issue.id}",
            )

        _log_activity(
            action="voucher.creation.success",
            description=(
                f"Voucher {voucher.voucher_code} created for HealthIssue #{health_issue.id} "
                f"via {len(allocations)} campaign(s)."
            ),
            level="INFO",
            target_type="Voucher",
            target_id=voucher.id,
            target_label=voucher.voucher_code,
            metadata={
                "health_issue_id": health_issue.id,
                "campaigns_count": len(allocations),
                "hospital": hospital.name,
            },
        )
        return voucher



# ---------------------------------------------------------------------------
# Add more funds after a medical claim requests more
# ---------------------------------------------------------------------------

@transaction.atomic
def add_more_fund_to_voucher_after_medical_claim_request_more(voucher: Voucher)-> tuple[bool, str]:
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

    amount_needded :Decimal= Decimal(str(medical_claim.total_cost)) - total_committed

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
