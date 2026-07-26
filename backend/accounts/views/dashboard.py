from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from django.db.models import Sum
from campaigns.models import Donation, Campaign
from beneficiaries.models import HealthIssue, Beneficiary
from accounts.serializers.dashboard import DonorDashboardSerializer, MatchedBeneficiarySerializer, DonationContributionSerializer, DonationContributionSerializer
from core.cache import cache_response


class DonorDashboardView(APIView):
    """
    GET /api/donor/dashboard/
    Retrieves aggregated dashboard statistics for a donor.
    """
    permission_classes = [IsAuthenticated]

    @cache_response(group="donor_dashboard", timeout=60)
    @swagger_auto_schema(
        operation_description="Get donor dashboard metrics",
        operation_summary="Donor Dashboard",
        tags=["Dashboard"],
        responses={200: DonorDashboardSerializer()},
    )
    def get(self, request, *args, **kwargs):
        if not hasattr(request.user, 'donor'):
            return Response({"error": "User is not a donor"}, status=403)

        donor = request.user.donor

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

        recent_donations = Donation.objects.filter(
            campaign__donor=donor,
            status='SUCCESS'
        ).select_related('campaign', 'donor', 'payment').order_by('-created_at')[:10]
        recent_contributions_data = DonationContributionSerializer(recent_donations, many=True).data

        matched_beneficiaries = Beneficiary.objects.filter(
            voucher__funding_records__campaign__donor=donor,
            voucher__status__in=['ACTIVE', 'USED']
        ).distinct()[:10]
        matched_beneficiaries_data = MatchedBeneficiarySerializer(matched_beneficiaries, many=True).data

        data = {
            "total_raised": total_raised,
            "my_campaigns": my_campaigns,
            "contributors": contributors,
            "lives_impacted": lives_impacted,
            "recent_contributions": recent_contributions_data,
            "matched_beneficiaries": matched_beneficiaries_data,
        }

        return Response(data)
