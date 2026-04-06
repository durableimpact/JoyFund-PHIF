from celery import shared_task
from .engine import run_matching_engine
import logging
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from datetime import datetime

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


@shared_task(name="vouchers.run_matching_engine_task")
def run_matching_engine_task():
    """
    A Celery task wrapper for the matching engine logic.
    """
    print("--- Running Matching Engine Task ---")
    assignment, message = run_matching_engine()
    print(f"--- Matching Engine Task Finished: {message} ---")
    return message


@shared_task(bind=True, max_retries=3)
def notify_voucher_assignment_pending(
    self,
    assignment_id: int,
    beneficiary_name: str,
    matched_amount: str,
    campaign_name: str,
    hospital_name: str,
    approval_deadline: str,
):
    """
    Notify system admins when a voucher assignment is created and pending approval.
    
    This alerts admins that a beneficiary has been matched with escrow funds and 
    requires approval within 24 hours. If no action is taken, the system will 
    auto-approve after the deadline.
    
    Broadcasts to:
    1. 'admin_dashboard' - System admins and hospital admins
    
    Creates Notification DB records for offline admins.
    
    Args:
        assignment_id: ID of the VoucherAssignment
        beneficiary_name: Name of the beneficiary
        matched_amount: Amount matched (as string)
        campaign_name: Name of the campaign funding this
        hospital_name: Name of the hospital providing service
        approval_deadline: ISO8601 timestamp of approval deadline
    """
    try:
        from django.contrib.auth import get_user_model
        from vouchers.models import VoucherAssignment
        from notifications.models import Notification
        
        User = get_user_model()
        
        # Verify assignment exists
        try:
            assignment = VoucherAssignment.objects.get(id=assignment_id)
        except VoucherAssignment.DoesNotExist:
            logger.error(f"VoucherAssignment {assignment_id} not found")
            return
        
        # Prepare message data
        message_data = {
            'type': 'notification_event',
            'event': 'voucher_assignment_pending',
            'timestamp': datetime.now().isoformat(),
            'data': {
                'id': assignment.id,
                'title': 'Voucher Assignment Requires Approval',
                'message': f'Voucher for {beneficiary_name} ({matched_amount}) awaits your approval by {approval_deadline}',
                'object': {
                    'assignment_id': assignment.id,
                    'beneficiary_name': beneficiary_name,
                    'matched_amount': matched_amount,
                    'campaign_name': campaign_name,
                    'hospital_name': hospital_name,
                    'approval_deadline': approval_deadline,
                    'status': assignment.status,
                }
            }
        }
        
        # Broadcast events
        async def broadcast():
            # Broadcast to admin dashboard
            await channel_layer.group_send('admin_dashboard', message_data)
            logger.debug("Sent to 'admin_dashboard' group")
        
        async_to_sync(broadcast)()
        
        # Create database notification records for system and hospital admins
        try:
            # Notify system admins
            admin_users = User.objects.filter(role='SYSTEM_ADMIN')
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title=message_data['data']['title'],
                    message=message_data['data']['message'],
                    notification_type='ALERT',
                    description=f"Assignment ID: {assignment.id}, Beneficiary: {beneficiary_name}, Deadline: {approval_deadline}",
                )
            
            logger.info(f"Created notification DB records for voucher assignment {assignment_id}")
        except Exception as e:
            logger.warning(f"Failed to create notification records: {str(e)}")
        
        logger.info(f"Broadcasted voucher_assignment_pending event: {assignment_id}")
        
    except Exception as exc:
        logger.error(f"Error in notify_voucher_assignment_pending: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def notify_voucher_created(self, voucher_id: int, hospital_id: int, voucher_data: dict):
    """
    Notify hospital staff when a new care voucher is created.
    
    Broadcasts to:
    1. 'hospital_{hospital_id}_staff' - Hospital staff group
    2. 'admin_dashboard' - System admins and hospital admins
    
    Creates Notification DB records for offline users.
    
    Args:
        voucher_id: ID of the created voucher
        hospital_id: ID of the hospital
        voucher_data: Dict with voucher details (code, beneficiary_name, campaign_name, etc.)
    """
    try:
        from django.contrib.auth import get_user_model
        from vouchers.models import CareVoucher
        from notifications.models import Notification
        from accounts.models import HospitalAdmin, Receptionist
        
        User = get_user_model()
        
        # Verify voucher exists
        try:
            voucher = CareVoucher.objects.select_related('voucher_assignment__campaign').get(id=voucher_id)
        except CareVoucher.DoesNotExist:
            logger.error(f"Voucher {voucher_id} not found")
            return
        
        campaign_name = voucher.voucher_assignment.campaign.name if hasattr(voucher, 'voucher_assignment') else ''
        
        # Prepare message data
        message_data = {
            'type': 'notification_event',
            'event': 'voucher_created',
            'timestamp': datetime.now().isoformat(),
            'data': {
                'id': voucher.id,
                'title': f'New Care Voucher Created',
                'message': f'Voucher {voucher_data.get("code", "")} for {voucher_data.get("beneficiary_name", "")} has been issued',
                'object': {
                    'voucher_id': voucher.id,
                    'voucher_code': voucher_data.get('code', ''),
                    'beneficiary_name': voucher_data.get('beneficiary_name', ''),
                    'campaign_id': voucher.voucher_assignment.campaign_id if hasattr(voucher, 'voucher_assignment') else None,
                    'campaign_name': campaign_name,
                    'hospital_id': hospital_id,
                    'urgency_level': voucher_data.get('urgency_level', ''),
                }
            }
        }
        
        # Broadcast events
        async def broadcast():
            # 1. Broadcast to hospital staff
            hospital_group = f'hospital_{hospital_id}_staff'
            await channel_layer.group_send(hospital_group, message_data)
            logger.debug(f"Sent to '{hospital_group}' group")
            
            # 2. Broadcast to admin dashboard
            await channel_layer.group_send('admin_dashboard', message_data)
            logger.debug("Sent to 'admin_dashboard' group")
        
        async_to_sync(broadcast)()
        
        # Create database notification records
        try:
            # Notify hospital staff
            hospital_staff_users = User.objects.filter(
                role__in=['HOSPITAL_ADMIN', 'RECEPTIONIST']
            ).filter(
                hospitaladmin__hospital_id=hospital_id
            ) | User.objects.filter(
                role='RECEPTIONIST',
                receptionist__hospital_id=hospital_id
            )
            
            for staff_user in hospital_staff_users.distinct():
                Notification.objects.create(
                    user=staff_user,
                    title=message_data['data']['title'],
                    message=message_data['data']['message'],
                    notification_type='ALERT',
                    description=f"Voucher code: {voucher_data.get('code')}, Beneficiary: {voucher_data.get('beneficiary_name')}",
                )
            
            # Notify system admins
            admin_users = User.objects.filter(role='SYSTEM_ADMIN')
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title=message_data['data']['title'],
                    message=message_data['data']['message'],
                    notification_type='ALERT',
                )
            
            logger.info(f"Created notification DB records for voucher {voucher_id}")
        except Exception as e:
            logger.warning(f"Failed to create notification records: {str(e)}")
        
        logger.info(f"Broadcasted voucher_created event: {voucher_id}")
        
    except Exception as exc:
        logger.error(f"Error in notify_voucher_created: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task(bind=True, max_retries=3)
def notify_voucher_redeemed(self, voucher_id: int, campaign_id: int, voucher_data: dict):
    """
    Notify donors when their contribution is used (care voucher redeemed).
    
    Broadcasts to:
    1. All donors who contributed to the campaign
    2. 'admin_dashboard' - System admins and hospital admins
    
    Creates Notification DB records for offline users.
    
    Args:
        voucher_id: ID of the redeemed voucher
        campaign_id: ID of the campaign
        voucher_data: Dict with voucher details (code, beneficiary_name, hospital_name, etc.)
    """
    try:
        from django.contrib.auth import get_user_model
        from vouchers.models import CareVoucher
        from campaigns.models import Campaign, Donation
        from notifications.models import Notification
        
        User = get_user_model()
        
        # Verify campaign exists
        try:
            campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            logger.error(f"Campaign {campaign_id} not found")
            return
        
        # Get all donors who contributed to this campaign
        donor_ids = Donation.objects.filter(
            campaign_id=campaign_id
        ).values_list('donor_id', flat=True).distinct()
        
        donors = User.objects.filter(id__in=donor_ids)
        
        # Prepare message data
        message_data = {
            'type': 'notification_event',
            'event': 'voucher_redeemed',
            'timestamp': datetime.now().isoformat(),
            'data': {
                'id': voucher_id,
                'title': f'Your Contribution Was Used',
                'message': f'A care voucher for {voucher_data.get("beneficiary_name", "")} has been redeemed at {voucher_data.get("hospital_name", "")}',
                'object': {
                    'voucher_id': voucher_id,
                    'voucher_code': voucher_data.get('code', ''),
                    'beneficiary_name': voucher_data.get('beneficiary_name', ''),
                    'hospital_name': voucher_data.get('hospital_name', ''),
                    'campaign_id': campaign_id,
                    'campaign_name': campaign.name,
                }
            }
        }
        
        # Broadcast events
        async def broadcast():
            # 1. Send to each donor
            for donor in donors:
                donor_channel = f'user_{donor.id}'
                await channel_layer.group_send(donor_channel, message_data)
            logger.debug(f"Sent voucher_redeemed to {len(donors)} donors")
            
            # 2. Broadcast to admin dashboard
            await channel_layer.group_send('admin_dashboard', message_data)
            logger.debug("Sent to 'admin_dashboard' group")
        
        async_to_sync(broadcast)()
        
        # Create database notification records
        try:
            for donor in donors:
                Notification.objects.create(
                    user=donor,
                    title=message_data['data']['title'],
                    message=message_data['data']['message'],
                    notification_type='CAMPAIGN_UPDATE',
                    description=f"Voucher for {voucher_data.get('beneficiary_name')} redeemed at {voucher_data.get('hospital_name')}",
                )
            
            # Notify system admins
            admin_users = User.objects.filter(role='SYSTEM_ADMIN')
            for admin in admin_users:
                Notification.objects.create(
                    user=admin,
                    title=f'Care Voucher Redeemed',
                    message=message_data['data']['message'],
                    notification_type='ALERT',
                )
            
            logger.info(f"Created notification DB records for voucher redemption {voucher_id}")
        except Exception as e:
            logger.warning(f"Failed to create notification records: {str(e)}")
        
        logger.info(f"Broadcasted voucher_redeemed event: {voucher_id}")
        
    except Exception as exc:
        logger.error(f"Error in notify_voucher_redeemed: {str(exc)}", exc_info=True)
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
