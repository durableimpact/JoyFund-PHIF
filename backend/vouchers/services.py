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
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
import logging

from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D

from decimal import Decimal
from django.db.models import Sum, F, Value, DecimalField, ExpressionWrapper, Q
from django.db.models.functions import Coalesce
from django.db.models import QuerySet

from typing import List


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


@transaction.atomic
def allocate_funds_to_voucher(
    campaign: Campaign, voucher_funding: VoucherFunding, committed_amount: float
):
    """
    Called when voucher is created from an approved health issue. Allocates funds from the campaign to the voucher.
    """

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
        .prefetch_related("claim_items")
        .first()
    )

    if not medical_claim:
        raise ValidationError("No medical claims found for this voucher")

    if medical_claim.total_cost <= 0:
        raise ValueError("Total cost must be greater than zero.")

    fundings = (
        voucher.funding_records.filter(status=VoucherFunding.FundingStatus.COMMITTED)
        .select_related("campaign")
        .order_by("committed_at")
    )

    if not fundings.exists():
        raise ValidationError("No committed funds available")

    # check if medical claim has been approved before proceeding to settlement
    if medical_claim.claim_status != ClaimStatus.APPROVED:
        raise ValidationError("Medical claim must be approved before settlement")

    claim_items: QuerySet[MedicalClaim] = medical_claim.claim_items.all()

    services_list = [item.name for item in claim_items]

    # Check if all medical claim proof are verified before proceeding to settlement

    proofs: QuerySet[MedicalClaimProof] = medical_claim.proofs.all()

    if not proofs.exists():
        raise ValidationError(
            "At least one proof document must be uploaded for this claim"
        )

    # Check if some proofs are not verified
    if proofs.exclude(verification_status=VerificationStatus.VERIFIED).exists():
        raise ValidationError("All proof documents must be verified before settlement")

    medical_claim_cost = sum(item.amount for item in claim_items)

    # Check if there is only one voucher funding to know if we have to make refund becuase if it is more than one voucher it means we added funds to the voucher to complete what the medical claim was asking

    if len(fundings) == 1 and medical_claim_cost < fundings[0].committed_amount:
        # Now we proceed to the refund to the campaign so the funds can be allocated to other beneficiaries health issue
        funding: VoucherFunding = fundings[0]

        funding.utilized_amount = medical_claim_cost
        funding.refund_amount = funding.committed_amount - funding.utilized_amount
        funding.utilized_at = timezone.now()
        funding.status = VoucherFunding.FundingStatus.UTILIZED
        funding.save(
            update_fields=["utilized_amount", "refund_amount", "utilized_at", "status"]
        )

        campaign: Campaign = funding.campaign
        campaign.currently_allocated -= funding.committed_amount
        campaign.total_disbursed += medical_claim_cost
        campaign.save(update_fields=["currently_allocated", "total_disbursed"])

        # Check if a refund has been made if yes create a campaign traction with type `SURPLUS_REFUND`

        if funding.refund_amount > 0:
            # it means we have a refund the we create a campaign transaction

            amount_text = f"{funding.refund_amount:.2f}"
            committed_text = f"{funding.committed_amount:.2f}"

            description = (
                f"Refunded {amount_text} XAF "
                f"from {committed_text} XAF committed "
                f"(Voucher: {voucher.voucher_code})"
            )

            CampaignTransaction.objects.create(
                campaign=campaign,
                amount=funding.refund_amount,
                description=description,
                transaction_type=CampaignTransaction.TransactionType.SURPLUS_REFUND,
            )

        # Now we create a campaign transaction that represent the amount we are sending to the hosiptal for the total cost from the medical claim
        amount_text = f"{medical_claim_cost:.2f}"
        CampaignTransaction.objects.create(
            campaign=campaign,
            amount=medical_claim_cost,
            description=f"Funds settled: {amount_text} XAF to {voucher.hospital.name} for voucher {voucher.voucher_code}. Services: {', '.join(services_list)}",
            transaction_type=CampaignTransaction.TransactionType.HOSPITAL_SETTLED,
        )

    else:

        for funding in fundings:
            campaign = funding.campaign
            if medical_claim_cost <= 0:
                break

            funding.utilized_amount = min(funding.committed_amount, medical_claim_cost)
            funding.status = VoucherFunding.FundingStatus.UTILIZED
            funding.refund_amount = funding.committed_amount - funding.utilized_amount
            funding.utilized_at = timezone.now()
            funding.save(
                update_fields=[
                    "utilized_amount",
                    "status",
                    "refund_amount",
                    "utilized_at",
                ]
            )
            medical_claim_cost -= funding.utilized_amount

            campaign.currently_allocated -= funding.committed_amount
            campaign.total_disbursed += funding.utilized_amount
            campaign.save(update_fields=["currently_allocated", "total_disbursed"])

            CampaignTransaction.objects.create(
                campaign=campaign,
                voucher_funding=funding,
                transaction_type=CampaignTransaction.TransactionType.HOSPITAL_SETTLED,
                amount=funding.utilized_amount,
                description=f"Funds settled: {funding.utilized_amount:.2f} XAF for voucher {voucher.voucher_code} at {voucher.hospital.name}. Services provided: {', '.join(services_list)}",
            )


@transaction.atomic
def create_voucher_from_approved_health_issue(health_issue: HealthIssue) -> Voucher:
    """
    Create a Voucher and associated VoucherFunding when a HealthIssue is approved.

    Steps:
    1. Create Voucher with status 'ACTIVE' linked to the HealthIssue
    2. Create VoucherFunding record to log the source of funds (e.g. Campaign or Hospital)
    3. Ensure atomicity so that both records are created successfully or rolled back together
    """

    if health_issue.status != HealthIssueStatus.VALIDATED:
        raise ValueError("HealthIssue must be in VALIDATED status to create a voucher.")

    # get category of the health issue for the voucher
    category = health_issue.category

    # based on category we are going to assing some amount that would be allocated initially to the voucher funding

    base_amount = 50000  # default amount for other categories

    if category == HealthIssueCategoryChoices.MATERNAL:
        base_amount = 250000
    elif category == HealthIssueCategoryChoices.ELDERLY:
        base_amount = 150000
    elif category == HealthIssueCategoryChoices.EMERGENCY:
        base_amount = 300000
    elif category == HealthIssueCategoryChoices.CHRONIC:
        base_amount = 100000

    # search for active campaigns that match the health issue category
    campaigns = get_campaign_with_available_balance(Decimal(str(base_amount)))

    # prioritize newer campaigns

    if not campaigns.exists():
        raise ValueError(
            "No active campaigns with sufficient balance to fund this voucher."
        )

    # Now search the hospital that is closest to the beneficiary location that can provide the needed services for the health issue and create the voucher with the hospital and campaign we found
    beneficiary = health_issue.beneficiary

    # health issue category
    health_issue_category = health_issue.category

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
        raise ValueError(
            "No nearby hospitals found that can provide the needed services for this health issue."
        )

    if campaigns.count() >= 1:

        # if campaigns exist we take the first one and allocate funds to the voucher funding
        campaign = campaigns.first()

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

        CampaignTransaction.objects.create(
            campaign=campaign,
            voucher_funding=voucher_funding,
            transaction_type=CampaignTransaction.TransactionType.VOUCHER_ALLOCATED,
            amount=base_amount,
            description=f"Allocated {base_amount:.2f} XAF to voucher {voucher.voucher_code} for health issue #{health_issue.id}",
        )

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
            raise ValueError(
                "No active campaigns with sufficient balance to fund this voucher."
            )

        remaining = min_needed
        allocations = []
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
            allocations_count = len(allocations)
            logging.warning(
                f"Partial allocation for HealthIssue {health_issue.id}: allocated {allocated_total:.2f} XAF from {allocations_count} campaigns; shortfall {remaining:.2f} XAF. Proceeding with voucher creation."
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

    return voucher


def add_more_fund_to_voucher_after_medical_claim_request_more(voucher: Voucher):
    """
    This function is called when a medical claim is made for a voucher and the doctor realize that the amount that was allocated to the voucher is not suficient to cover all the cost of the medical claim so what we do is to add more fund to the voucher funding and if there is no campaign with available fund we create a campaign transaction with type `FUNDING_SHORTFALL` to keep track of those case and also to be able to report on them later and see how many time we have this case and how much we are loosing because of that.
    """
    with transaction.atomic():
        threshold = Decimal("10000")

        campaigns = get_campaign_with_available_balance(threshold=threshold)

        if not campaigns:
            # we create a campaign transaction with type `FUNDING_SHORTFALL` to keep track of those case and also to be able to report on them later and see how many time we have this case and how much we are loosing because of that.

            raise ValueError(
                "No active campaigns with sufficient balance to fund the additional amount needed for this voucher."
            )

        # Get the medical claim to know how much money is required to cover the medical claim and also to get the services that are provided for the description of the campaign transaction that we are going to create later
        medical_claim = voucher.medical_claim

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

        amount_needded = medical_claim.total_cost - total_committed

        remaining = amount_needded
        allocations = []
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
            allocations_count = len(allocations)
            logging.warning(
                f"Partial allocation for additional funding on Voucher {voucher.id}: allocated {allocated_total:.2f} XAF from {allocations_count} campaigns; shortfall {remaining:.2f} XAF. Proceeding with adding funds."
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
                description=f"Allocated additional {committed_amount:.2f} XAF to voucher {voucher.voucher_code} after medical claim request for health issue #{voucher.health_issue.id}",
            )
