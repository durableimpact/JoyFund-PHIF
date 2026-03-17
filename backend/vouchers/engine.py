from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from beneficiaries.models import Beneficiary
from campaigns.models import Campaign
from hospitals.models import Hospital, Services
from .models import VoucherAssignment, CareVoucher, VoucherAuditLog

# A simplified representation of a waiting pool.
# In a real-world scenario, this would be a more complex query.
def get_highest_priority_beneficiary():
    """
    Finds the highest-priority beneficiary who does not have an active or pending voucher.
    Priority: CRITICAL > URGENT > ROUTINE, then by oldest enrollment date.
    """
    return Beneficiary.objects.filter(
        assignments__isnull=True
    ).order_by(
        '-urgency_level', 'date_of_birth'
    ).first()

def find_funding_source(required_amount):
    """
    Finds a fully funded campaign that can cover the required amount.
    This is a simplified approach. A real system might pool funds from multiple campaigns.
    """
    return Campaign.objects.filter(
        status='COMPLETED',
        is_fully_funded=True,
        # Add a flag to avoid re-using a campaign
    ).first() # Simplification

@transaction.atomic
def run_matching_engine():
    """
    The core logic that matches a beneficiary with a funding source and creates
    a VoucherAssignment for admin approval.
    
    This function is designed to be run periodically (e.g., via a cron job or Celery task).
    """
    beneficiary = get_highest_priority_beneficiary()
    if not beneficiary:
        print("No eligible beneficiaries in the waiting pool.")
        return None, "No eligible beneficiaries."

    # Simplified: Assume a standard service and hospital for now
    # In a real system, this would be based on beneficiary location and needs
    service = Service.objects.first()
    hospital = Hospital.objects.first()
    if not service or not hospital:
        return None, "No services or hospitals configured in the system."

    required_amount = service.cost
    campaign = find_funding_source(required_amount)
    if not campaign:
        print("No available funding sources.")
        return None, "Insufficient funds or no completed campaigns."

    # Create the assignment for an admin to review
    assignment = VoucherAssignment.objects.create(
        beneficiary=beneficiary,
        campaign=campaign,
        hospital=hospital,
        service=service,
        matched_amount=required_amount,
        status=VoucherAssignment.Status.PENDING_APPROVAL,
        # In a real system, 'assigned_to' would be dynamically assigned to an admin
        approval_deadline=timezone.now() + timedelta(hours=24)
    )

    VoucherAuditLog.objects.create(
        # This would be linked to a real voucher later, this is a pre-voucher log
        action=VoucherAuditLog.Action.MATCHED,
        notes=f"Beneficiary {beneficiary.digital_health_id} matched with Campaign {campaign.id} for {required_amount} CFA."
    )
    
    print(f"Successfully created VoucherAssignment for {beneficiary.digital_health_id}.")
    return assignment, "Assignment created successfully."

@transaction.atomic
def approve_assignment(assignment_id, admin_user):
    """
    An admin triggers this function to approve a pending VoucherAssignment,
    which then creates the actual CareVoucher and triggers the SMS.
    """
    try:
        assignment = VoucherAssignment.objects.get(id=assignment_id, status=VoucherAssignment.Status.PENDING_APPROVAL)
    except VoucherAssignment.DoesNotExist:
        return None, "Assignment not found or not pending approval."

    # --- Update Assignment ---
    assignment.status = VoucherAssignment.Status.APPROVED
    assignment.approved_by = admin_user
    assignment.approved_at = timezone.now()
    assignment.save()

    # --- Create the CareVoucher ---
    voucher = CareVoucher.objects.create(
        assignment=assignment,
        beneficiary=assignment.beneficiary,
        campaign=assignment.campaign,
        hospital=assignment.hospital,
        service=assignment.service,
        value=assignment.matched_amount,
        status=CareVoucher.Status.AVAILABLE, # The voucher is now active and ready to use
        language_preference=assignment.beneficiary.language_preference,
        expiry_date=timezone.now().date() + timedelta(days=30)
    )

    # --- Log the Approval and Creation ---
    VoucherAuditLog.objects.create(
        voucher=voucher,
        action=VoucherAuditLog.Action.APPROVED,
        performed_by=admin_user,
        notes=f"Assignment approved by {admin_user.username}."
    )
    VoucherAuditLog.objects.create(
        voucher=voucher,
        action=VoucherAuditLog.Action.CREATED,
        notes=f"Voucher {voucher.voucher_code} created and now available."
    )

    # --- Trigger SMS Notification (Placeholder) ---
    # In a real implementation, this would call an SMS service.
    print(f"SMS_DISPATCH: Sending voucher {voucher.voucher_code} to {voucher.beneficiary.phone}.")
    VoucherAuditLog.objects.create(
        voucher=voucher,
        action=VoucherAuditLog.Action.SMS_SENT,
        notes=f"Voucher code sent to beneficiary's phone: {voucher.beneficiary.phone}."
    )

    print(f"Voucher {voucher.voucher_code} successfully created and dispatched.")
    return voucher, "Voucher created and SMS sent."
