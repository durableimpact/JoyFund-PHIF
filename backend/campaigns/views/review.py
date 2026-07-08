import logging

from accounts.models import Role, SocialWorker
from core.cache import cache_response, invalidate_group
from django.db import transaction
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from campaigns.models import Campaign
from campaigns.serializers import CampaignStaffSerializer
from logs.services import LogService

logger = logging.getLogger(__name__)
_TAG = ["Campaign Reviews"]


class IsSocialWorker(BasePermission):
    message = "Only social workers or system admins can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.SOCIAL_WORKER, Role.SYSTEM_ADMIN)
        )


class CampaignReviewViewSet(viewsets.GenericViewSet):
    """
    Endpoints for social workers to review beneficiary claims on campaigns.
    All actions require SOCIAL_WORKER or SYSTEM_ADMIN role.
    """
    queryset = Campaign.objects.select_related("donor__user", "assigned_social_worker__user").all()
    serializer_class = CampaignStaffSerializer
    permission_classes = [IsAuthenticated, IsSocialWorker]

    @action(
        detail=False,
        methods=["get"],
        url_path="pending-verification",
    )
    @swagger_auto_schema(
        tags=_TAG,
        manual_parameters=[
            openapi.Parameter(
                "mine",
                openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description="Filter to only campaigns assigned to me",
            ),
            openapi.Parameter(
                "unassigned",
                openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description="Filter to only unassigned campaigns",
            ),
        ],
        operation_description="List campaigns with PENDING beneficiary verification status.",
    )
    @cache_response(group="campaign_reviews", timeout=2 * 60)
    def pending_verification(self, request, *args, **kwargs):
        try:
            qs = self.get_queryset().filter(
                supports_specific_person=True,
                verification_status=Campaign.VerificationStatus.PENDING,
            )

            mine = request.query_params.get("mine")
            unassigned = request.query_params.get("unassigned")

            if mine == "true":
                try:
                    social_worker = request.user.socialworker
                    qs = qs.filter(assigned_social_worker=social_worker)
                except Exception:
                    qs = qs.none()
            elif unassigned == "true":
                qs = qs.filter(assigned_social_worker__isnull=True)

            qs = qs.order_by("-created_at")
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error listing pending verifications: {e}")
            LogService.log_error(e, request=request, extra={"action": "pending_verification"})
            return Response(
                {"detail": "An error occurred while fetching pending verifications."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=True,
        methods=["post"],
        url_path="assign-reviewer",
    )
    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Assign reviewer for this campaign's beneficiary claim. Social workers self-assign; system admins can assign to a specific social worker via social_worker_id.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "social_worker_id": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="UUID of the social worker to assign (system admin only). Omit to self-assign.",
                ),
            },
        ),
    )
    def assign_reviewer(self, request, pk=None):
        try:
            campaign = self.get_object()

            if campaign.verification_status != Campaign.VerificationStatus.PENDING:
                return Response(
                    {"detail": "This campaign is not pending verification."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            social_worker_id = request.data.get("social_worker_id")

            if social_worker_id:
                # System admin assigning to a specific social worker
                if request.user.role != Role.SYSTEM_ADMIN:
                    return Response(
                        {"detail": "Only system admins can assign to a specific social worker."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                try:
                    social_worker = SocialWorker.objects.get(id=social_worker_id)
                except SocialWorker.DoesNotExist:
                    return Response(
                        {"detail": "Social worker not found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )
            else:
                # Self-assign (social worker only)
                try:
                    social_worker = request.user.socialworker
                except Exception:
                    return Response(
                        {"detail": "Requesting user does not have a SocialWorker profile."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            campaign.assigned_social_worker = social_worker
            campaign.save(update_fields=["assigned_social_worker"])

            campaign.events.create(
                status=campaign.verification_status or '',
                notes=f"Review assigned to {social_worker.user.get_full_name() or social_worker.user.email}",
                changed_by=request.user,
            )

            LogService.info(
                request,
                "campaign.review.assigned",
                user=request.user,
                target=campaign,
                description=f"Review assigned to {social_worker.user.email}",
            )

            invalidate_group("campaign_reviews")
            invalidate_group("campaigns")

            serializer = self.get_serializer(campaign)
            return Response(serializer.data)
        except Campaign.DoesNotExist:
            return Response(
                {"detail": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error assigning reviewer: {e}")
            LogService.log_error(e, request=request, extra={"action": "assign_reviewer", "campaign_id": pk})
            return Response(
                {"detail": "An error occurred while assigning the reviewer."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=True,
        methods=["post"],
        url_path="verify-beneficiary",
    )
    @swagger_auto_schema(
        tags=_TAG,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["linked_beneficiary_id"],
            properties={
                "linked_beneficiary_id": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    format=openapi.FORMAT_UUID,
                    description="UUID of the existing Beneficiary record to link",
                ),
            },
        ),
        operation_description="Verify this campaign's beneficiary claim by linking to an existing Beneficiary record.",
    )
    def verify_beneficiary(self, request, pk=None):
        try:
            campaign = self.get_object()

            if campaign.verification_status != Campaign.VerificationStatus.PENDING:
                return Response(
                    {"detail": "This campaign is not pending verification."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            linked_beneficiary_id = request.data.get("linked_beneficiary_id")
            if not linked_beneficiary_id:
                return Response(
                    {"detail": "linked_beneficiary_id is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            from beneficiaries.models import Beneficiary
            try:
                beneficiary = Beneficiary.objects.get(id=linked_beneficiary_id)
            except Beneficiary.DoesNotExist:
                return Response(
                    {"detail": "Beneficiary not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            with transaction.atomic():
                campaign.linked_beneficiary = beneficiary
                campaign.verification_status = Campaign.VerificationStatus.VERIFIED
                campaign.save(update_fields=["linked_beneficiary", "verification_status"])

                campaign.events.create(
                    status=Campaign.VerificationStatus.VERIFIED,
                    notes=f"Beneficiary verified and linked to {beneficiary.full_name} ({beneficiary.digital_health_id})",
                    changed_by=request.user,
                )

            LogService.info(
                request,
                "campaign.beneficiary_verified",
                user=request.user,
                target=campaign,
                description=f"Beneficiary {beneficiary.full_name} linked to campaign '{campaign.title}'",
                metadata={"beneficiary_id": str(beneficiary.id), "beneficiary_name": beneficiary.full_name},
            )

            # Notify the donor about verification outcome
            from campaigns.tasks import notify_donor_verification_outcome
            notify_donor_verification_outcome.apply_async(
                args=[str(campaign.id), "VERIFIED"],
                countdown=5,
            )

            invalidate_group("campaign_reviews")
            invalidate_group("campaigns")

            serializer = self.get_serializer(campaign)
            return Response(serializer.data)
        except Campaign.DoesNotExist:
            return Response(
                {"detail": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error verifying beneficiary: {e}")
            LogService.log_error(e, request=request, extra={"action": "verify_beneficiary", "campaign_id": pk})
            return Response(
                {"detail": "An error occurred while verifying the beneficiary."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=True,
        methods=["post"],
        url_path="reject-verification",
    )
    @swagger_auto_schema(
        tags=_TAG,
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "reason": openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description="Reason for rejecting the verification",
                ),
            },
        ),
        operation_description="Mark this campaign's beneficiary claim as not verified.",
    )
    def reject_verification(self, request, pk=None):
        try:
            campaign = self.get_object()

            if campaign.verification_status != Campaign.VerificationStatus.PENDING:
                return Response(
                    {"detail": "This campaign is not pending verification."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            reason = request.data.get("reason", "")

            with transaction.atomic():
                campaign.verification_status = Campaign.VerificationStatus.NOT_VERIFIED
                campaign.save(update_fields=["verification_status"])

                campaign.events.create(
                    status=Campaign.VerificationStatus.NOT_VERIFIED,
                    notes=f"Verification rejected{': ' + reason if reason else ''}",
                    changed_by=request.user,
                )

            LogService.info(
                request,
                "campaign.beneficiary_rejected",
                user=request.user,
                target=campaign,
                description=f"Beneficiary claim rejected for campaign '{campaign.title}'",
                metadata={"reason": reason},
            )

            # Notify the donor about verification outcome
            from campaigns.tasks import notify_donor_verification_outcome
            notify_donor_verification_outcome.apply_async(
                args=[str(campaign.id), "NOT_VERIFIED"],
                countdown=5,
            )

            invalidate_group("campaign_reviews")
            invalidate_group("campaigns")

            serializer = self.get_serializer(campaign)
            return Response(serializer.data)
        except Campaign.DoesNotExist:
            return Response(
                {"detail": "Campaign not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            logger.error(f"Error rejecting verification: {e}")
            LogService.log_error(e, request=request, extra={"action": "reject_verification", "campaign_id": pk})
            return Response(
                {"detail": "An error occurred while rejecting the verification."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
