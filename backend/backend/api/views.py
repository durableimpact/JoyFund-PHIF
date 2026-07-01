from django.db import connection
from django.db.models import Sum
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from beneficiaries.models import Beneficiary
from campaigns.models import Campaign, Donation
from core.cache import cache_response

from .serializers import PlatformStatsSerializer


class PlatformStatsView(APIView):
    """
    Platform-wide statistics endpoint.
    Returns aggregated data about lives supported, active campaigns, and total funds raised.
    """

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        tags=["Platform"],
        operation_summary="Get Platform Statistics",
        operation_description="Retrieve high-level platform statistics including lives supported, active campaigns, and total funds raised.",
        responses={
            200: openapi.Response(
                description="Platform statistics",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "lives_supported": openapi.Schema(
                            type=openapi.TYPE_INTEGER,
                            description="Total number of beneficiaries with resolved health issues",
                        ),
                        "active_campaigns": openapi.Schema(
                            type=openapi.TYPE_INTEGER,
                            description="Number of active campaigns",
                        ),
                        "total_raised": openapi.Schema(
                            type=openapi.TYPE_STRING,
                            format="decimal",
                            description="Total funds raised in XAF",
                        ),
                    },
                ),
            )
        },
    )
    @cache_response(group="platform_stats", timeout=10 * 60)
    def get(self, request):
        """
        Get platform statistics.

        Returns:
        - lives_supported: Count of beneficiaries with resolved health issues (actual impact)
        - active_campaigns: Count of campaigns with status='ACTIVE'
        - total_raised: Sum of all successful donations
        """
        try:
            # Count beneficiaries with resolved health issues (lives actually supported)
            lives_supported = (
                Beneficiary.objects.filter(health_issues__status="RESOLVED")
                .distinct()
                .count()
            )

            # Count active campaigns that have at least one successful donation
            active_campaigns = Campaign.objects.filter(
                status=Campaign.CampaignStatus.ACTIVE,
                is_public=True,
                current_amount__gt=0,
                donation__status="SUCCESS"  # Filter for campaigns with successful donations
            ).distinct().count()

            # Calculate total raised from successful donations
            total_raised_data = Donation.objects.filter(status="SUCCESS").aggregate(
                total=Sum("net_amount")
            )
            total_raised = total_raised_data["total"] or 0

            # Prepare response data
            data = {
                "lives_supported": lives_supported,
                "active_campaigns": active_campaigns,
                "total_raised": total_raised,
            }

            # Validate with serializer
            serializer = PlatformStatsSerializer(data)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve platform statistics: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    # Check DB connection
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503
    return Response(
        {
            "status": "ok" if db_ok else "degraded",
            "db": db_ok,
        },
        status=status_code,
    )
