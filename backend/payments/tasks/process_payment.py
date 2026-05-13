from decimal import Decimal
import logging
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from campaigns.models import Donation, Payment
from payments.models import Transaction, HospitalAccount
import json

logger = logging.getLogger(__name__)


@shared_task
def process_payment_task(webhook_data: dict):
    """
    Process payment webhook data asynchronously for Donations.
    """
    try:
        logger.info(
            f"Starting process_payment_task for ref: {webhook_data.get('external_reference')}"
        )

        # Extract key information from webhook
        campay_reference = webhook_data.get("reference")
        external_reference = webhook_data.get("external_reference")

        status = webhook_data.get("status")
        operator = webhook_data.get("operator", "").upper()

        amount = Decimal(str(webhook_data.get("amount", "0")))
        app_amount = Decimal(str(webhook_data.get("app_amount", "0")))

        if not external_reference:
            logger.error("Missing external_reference in webhook data")
            return {
                "status": "error",
                "message": "Missing external_reference in webhook data",
            }

        with transaction.atomic():
            try:
                # Use select_for_update to prevent race conditions if multiple webhooks arrive
                donation = (
                    Donation.objects.select_related("payment")
                    .select_for_update()
                    .get(id=external_reference)
                )
            except (Donation.DoesNotExist, ValueError):
                logger.error(
                    f"Donation not found for external_reference: {external_reference}"
                )
                return {
                    "status": "error",
                    "message": f"Donation not found: {external_reference}",
                }

            payment = donation.payment

            # Prevent duplicate successful processing
            if payment.payment_status == "SUCCESS":
                logger.warning(f"Payment already processed: {payment.payment_id}")

                return {"status": "success", "message": "Payment already processed"}

            # STORE RAW WEBHOOK
            payment.payment_reference = campay_reference

            # REFERENCES
            payment.payment_reference = campay_reference

            # Map operator to payment method if applicable
            if operator in ["MTN", "ORANGE"]:
                payment.payment_method = operator

            # MONEY VALUES
            payment.amount = amount
            payment.app_amount = app_amount

            # AGGREGATOR FEE
            payment.aggregator_fee = amount - app_amount

            if status == "SUCCESSFUL":
                payment.payment_status = "SUCCESS"
                donation.status = "SUCCESS"
                logger.info(f"Payment SUCCESS for donation {donation.id}")
            else:
                payment.payment_status = "FAILED"
                donation.status = "FAILED"
                logger.warning(f"Payment {status} for donation {donation.id}")

            # SAVE PAYMENT FIRST
            payment.save()

            # SAVE DONATION
            # Donation.save() will calculate:
            # - platform_fee_amount
            # - net_amount
            donation.save()

            logger.info(f"Donation {donation.id} processed successfully")

            return {
                "status": "success",
                "donation_id": str(donation.id),
                "payment_status": payment.payment_status,
                "gross_amount": str(payment.amount),
                "received_amount": str(payment.app_amount),
                "aggregator_fee": str(payment.aggregator_fee),
            }

    except Exception as e:
        logger.exception(f"Error processing payment: {str(e)}")
        return {"status": "error", "message": str(e)}


@shared_task
def process_disbursement_task(webhook_data: dict):
    """
    Process payment webhook data asynchronously for Disbursements.
    """
    try:
        logger.info(
            f"Starting process_disbursement_task for ref: {webhook_data.get('external_reference')}"
        )

        campay_reference = webhook_data.get("reference")
        external_reference = webhook_data.get("external_reference")
        status = webhook_data.get("status")

        if not external_reference:
            logger.error("Missing external_reference in webhook data")
            return {
                "status": "error",
                "message": "Missing external_reference in webhook data",
            }

        with transaction.atomic():
            tx = (
                Transaction.objects.filter(id=external_reference)
                .select_for_update()
                .first()
            )
            if not tx or tx.type != "DISBURSEMENT":
                logger.error(
                    f"Disbursement Transaction not found for: {external_reference}"
                )
                return {
                    "status": "error",
                    "message": "Disbursement Transaction not found",
                }

            tx.gateway_transaction_id = campay_reference
            if status == "SUCCESSFUL":
                tx.status = "SUCCESSFUL"
                tx.save()
                return {
                    "status": "success",
                    "message": "Disbursement processed successfully",
                    "transaction_id": str(tx.id),
                }
            else:
                # If failed, we need to refund the HospitalAccount
                tx.status = "FAILED"
                tx.save()
                if tx.source and isinstance(tx.source, HospitalAccount):
                    # Return funds to the hospital
                    tx.source.balance += tx.amount
                    tx.source.save()
                return {
                    "status": "failed",
                    "message": "Disbursement failed and funds refunded",
                    "transaction_id": str(tx.id),
                }

    except Exception as e:
        logger.exception(f"Error processing disbursement callback: {str(e)}")
        return {"status": "error", "message": str(e)}


@shared_task
def check_pending_donations():
    """
    Check for donations that have been in PENDING state for more than 30 minutes and mark them as FAILED.
    """
    try:
        # Calculate the cutoff time (30 minutes ago)
        cutoff_time = timezone.now() - timezone.timedelta(minutes=30)

        # Find pending donations older than cutoff time
        pending_donations = Donation.objects.filter(
            status="PENDING", created_at__lt=cutoff_time
        )
        count = pending_donations.count()

        if count > 0:
            logger.info(
                f"Found {count} pending donations older than 30 minutes. Marking as FAILED."
            )
            pending_donations.update(status="FAILED")

        return {
            "status": "success",
            "message": f"Marked {count} pending donations as FAILED",
            "count": count,
        }

    except Exception as e:
        logger.exception(f"Error checking pending donations: {str(e)}")
        return {
            "status": "error",
            "message": f"Error checking pending donations: {str(e)}",
        }
