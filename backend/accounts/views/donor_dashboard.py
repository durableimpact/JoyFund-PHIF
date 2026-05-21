from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from campaigns.models import Donation, Campaign
from beneficiaries.models import HealthIssue
from accounts.models import Donor
from accounts.serializers import DonorDashboardSerializer
from accounts.utils import IsOwnerOrSystemAdmin


class DonorDashboardView(APIView):
    """
    GET /api/accounts/donors/{id}/dashboard/
    Retrieves aggregated dashboard statistics for a donor.
    """
    permission_classes = [IsAuthenticated, IsOwnerOrSystemAdmin]

    def get_object(self, donor_id):
        return get_object_or_404(Donor, id=donor_id)

    def check_object_permissions(self, request, obj):
        for permission in self.get_permissions():
            if hasattr(permission, 'has_object_permission'):
                if not permission.has_object_permission(request, self, obj):
                    self.permission_denied(
                        request,
                        message=getattr(permission, 'message', None),
                    )

    @swagger_auto_schema(
        operation_description="Get donor dashboard metrics",
        operation_summary="Donor Dashboard",
        tags=["Dashboard"],
        responses={200: DonorDashboardSerializer()},
    )
    def get(self, request, id):
        donor = self.get_object(id)
        self.check_object_permissions(request, donor)

        total_raised_agg = Donation.objects.filter(
            campaign__donor=donor,
            status='SUCCESS'
        ).aggregate(total=Sum('net_amount'))
        total_raised = total_raised_agg['total'] or 0

        my_campaigns = Campaign.objects.filter(donor=donor).count()

        contributors = Donation.objects.filter(
            campaign__donor=donor,
            status='SUCCESS'
        ).values('payment__phone_number').distinct().count()

        lives_impacted = HealthIssue.objects.filter(
            voucher__funding_records__campaign__donor=donor,
            status='RESOLVED'
        ).distinct().count()

        return Response({
            "total_raised": float(total_raised),
            "my_campaigns": my_campaigns,
            "contributors": contributors,
            "lives_impacted": lives_impacted,
        })
