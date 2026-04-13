"""
Django signals for the vouchers app.

Handles events like:
- Voucher assignment creation (pending admin approval)
- Care voucher creation/approval
- Care voucher redemption
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from vouchers.models import CareVoucher, VoucherAssignment

logger = logging.getLogger(__name__)


@receiver(post_save, sender=VoucherAssignment)
def notify_on_voucher_assignment_created(sender, instance: VoucherAssignment, created, **kwargs):
    """
    Send WebSocket notification to system admins when a VoucherAssignment is created.
    
    This alerts admins that a beneficiary has been matched with funds and needs
    approval within 24 hours (or it will auto-approve).
    
    Args:
        sender: The model class (VoucherAssignment)
        instance: The VoucherAssignment instance
        created: True if this is a new instance
        **kwargs: Additional signal arguments
    """
    from .tasks import notify_voucher_assignment_pending
    
    try:
        # Notify admins when assignment is first created (status=PENDING_APPROVAL)
        if created and instance.status == 'PENDING_APPROVAL':
            notify_voucher_assignment_pending.delay(
                assignment_id=instance.id,
                beneficiary_name=instance.beneficiary.full_name if instance.beneficiary else 'Unknown',
                matched_amount=str(instance.matched_amount),
                campaign_name=instance.campaign.name if instance.campaign else 'Unknown',
                hospital_name=instance.hospital.name if instance.hospital else 'Unknown',
                approval_deadline=instance.approval_deadline.isoformat() if instance.approval_deadline else None,
            )
            logger.info(f"Queued voucher_assignment_pending notification for assignment: {instance.id}")
    
    except Exception as e:
        logger.error(f"Error in notify_on_voucher_assignment_created: {str(e)}", exc_info=True)


@receiver(post_save, sender=CareVoucher)
def notify_on_voucher_status_change(sender, instance: CareVoucher, created, **kwargs):
    """
    Send WebSocket notifications and create DB notification records when:
    1. Voucher status changes to AVAILABLE (issued/approved)
    2. Voucher status changes to REDEEMED
    
    Args:
        sender: The model class (CareVoucher)
        instance: The CareVoucher instance
        created: True if this is a new instance
        **kwargs: Additional signal arguments
    """
    from .tasks import notify_voucher_created, notify_voucher_redeemed
    
    try:
        # Notify when voucher is available (issued)
        if instance.status == 'AVAILABLE':
            if not created:  # Only notify on status change, not on creation
                hospital_id = instance.hospital_id
                if hospital_id:
                    notify_voucher_created.delay(
                        voucher_id=instance.id,
                        hospital_id=hospital_id,
                        voucher_data={
                            'code': instance.voucher_code,
                            'beneficiary_name': instance.beneficiary.full_name if instance.beneficiary else '',
                            'urgency_level': getattr(instance.beneficiary, 'urgency_level', 'normal') if instance.beneficiary else '',
                        }
                    )
                    logger.info(f"Queued voucher_created notification for voucher: {instance.id}")
        
        # Notify when voucher is redeemed
        elif instance.status == 'REDEEMED':
            if not created:  # Only notify on status change
                campaign_id = instance.campaign_id
                if campaign_id:
                    notify_voucher_redeemed.delay(
                        voucher_id=instance.id,
                        campaign_id=campaign_id,
                        voucher_data={
                            'code': instance.voucher_code,
                            'beneficiary_name': instance.beneficiary.full_name if instance.beneficiary else '',
                            'hospital_name': instance.hospital.name if instance.hospital else '',
                        }
                    )
                    logger.info(f"Queued voucher_redeemed notification for voucher: {instance.id}")
    
    except Exception as e:
        logger.error(f"Error in notify_on_voucher_status_change: {str(e)}", exc_info=True)
