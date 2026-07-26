from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from beneficiaries.models import Beneficiary, HealthIssue
from vouchers.models.Voucher import Voucher
from accounts.serializers.dashboard import SocialWorkerDashboardSerializer
from core.cache import cache_response


class SocialWorkerDashboardView(APIView):
    """
    GET /api/social-worker/dashboard/
    Retrieves aggregated dashboard statistics for a social worker.
    """
    permission_classes = [IsAuthenticated]

    @cache_response(group="social_worker_dashboard", timeout=60)
    @swagger_auto_schema(
        operation_description="Get social worker dashboard metrics",
        operation_summary="Social Worker Dashboard",
        tags=["Dashboard"],
        responses={200: SocialWorkerDashboardSerializer()},
    )
    def get(self, request, *args, **kwargs):
        if not hasattr(request.user, 'social_worker'):
            return Response({"error": "User is not a social worker"}, status=403)

        social_worker = request.user.social_worker

        enrolled = Beneficiary.objects.filter(enrolled_by=social_worker).count()

        reported_health_issue_ids = HealthIssue.objects.filter(
            social_worker=social_worker
        ).values_list('id', flat=True)

        awaiting_match = HealthIssue.objects.filter(
            social_worker=social_worker,
        ).exclude(
            status__in=['ASSIGNED', 'IN_TREATMENT', 'RESOLVED'],
        ).exclude(
            id__in=Voucher.objects.filter(
                health_issue__isnull=False
            ).values_list('health_issue_id', flat=True),
        ).count()

        voucher_issued = Voucher.objects.filter(
            beneficiary__enrolled_by=social_worker,
        ).count()

        care_received = HealthIssue.objects.filter(
            social_worker=social_worker,
            status='RESOLVED',
        ).count()

        return Response(SocialWorkerDashboardSerializer({
            "enrolled": enrolled,
            "awaiting_match": awaiting_match,
            "voucher_issued": voucher_issued,
            "care_received": care_received,
        }).data)
