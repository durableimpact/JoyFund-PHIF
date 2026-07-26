from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.db.models import Count
from django.db.models.functions import TruncDate
from vouchers.models.Voucher import Voucher
from accounts.models import HospitalAdmin, Receptionist, Role
from hospitals.models import Hospital
from rest_framework import serializers
from core.cache import cache_response


class HospitalDashboardSerializer(serializers.Serializer):
    processed_vouchers = serializers.IntegerField()
    issued_vouchers = serializers.IntegerField()
    number_of_staff = serializers.IntegerField()


class RedeemedDailyEntrySerializer(serializers.Serializer):
    date = serializers.DateField()
    redeemed = serializers.IntegerField()


class HospitalRedeemedDailySerializer(serializers.Serializer):
    daily_breakdown = RedeemedDailyEntrySerializer(many=True)


class HospitalDashboardView(APIView):
    """
    GET /api/hospitals/{hospital_id}/dashboard/
    Retrieves aggregated dashboard statistics for a hospital.
    """
    permission_classes = [IsAuthenticated]

    @cache_response(group="hospital_dashboard", timeout=60)
    @swagger_auto_schema(
        operation_description="Get hospital dashboard metrics",
        operation_summary="Hospital Dashboard",
        tags=["Dashboard"],
        responses={200: HospitalDashboardSerializer()},
    )
    def get(self, request, hospital_id):
        if request.user.role not in (Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN):
            return Response({"error": "Only system admins and hospital admins can access this"}, status=403)

        hospital = get_object_or_404(Hospital, id=hospital_id)

        if request.user.role == Role.HOSPITAL_ADMIN:
            if not hasattr(request.user, 'hospitaladmin') or request.user.hospitaladmin.hospital_id != hospital.id:
                return Response({"error": "You can only view your own hospital's dashboard"}, status=403)

        processed_vouchers = Voucher.objects.filter(
            hospital=hospital,
            status='USED',
        ).count()

        issued_vouchers = Voucher.objects.filter(
            hospital=hospital,
        ).count()

        admin_count = HospitalAdmin.objects.filter(
            hospital=hospital,
            is_active=True,
        ).count()

        receptionist_count = Receptionist.objects.filter(
            hospital=hospital,
        ).count()

        return Response(HospitalDashboardSerializer({
            "processed_vouchers": processed_vouchers,
            "issued_vouchers": issued_vouchers,
            "number_of_staff": admin_count + receptionist_count,
        }).data)


class HospitalRedeemedDailyView(APIView):
    """
    GET /api/hospitals/{hospital_id}/dashboard/redeemed-daily/
    Returns number of vouchers redeemed per day, filterable by date range.
    """
    permission_classes = [IsAuthenticated]

    start_date_param = openapi.Parameter(
        'start_date',
        openapi.IN_QUERY,
        description="Start date (YYYY-MM-DD)",
        type=openapi.TYPE_STRING,
        format='date',
    )
    end_date_param = openapi.Parameter(
        'end_date',
        openapi.IN_QUERY,
        description="End date (YYYY-MM-DD)",
        type=openapi.TYPE_STRING,
        format='date',
    )

    @cache_response(group="hospital_dashboard", timeout=60)
    @swagger_auto_schema(
        operation_description="Get vouchers redeemed per day for a hospital",
        operation_summary="Hospital Redeemed Daily",
        tags=["Dashboard"],
        manual_parameters=[start_date_param, end_date_param],
        responses={200: HospitalRedeemedDailySerializer()},
    )
    def get(self, request, hospital_id):
        if request.user.role not in (Role.SYSTEM_ADMIN, Role.HOSPITAL_ADMIN):
            return Response({"error": "Only system admins and hospital admins can access this"}, status=403)

        hospital = get_object_or_404(Hospital, id=hospital_id)

        if request.user.role == Role.HOSPITAL_ADMIN:
            if not hasattr(request.user, 'hospitaladmin') or request.user.hospitaladmin.hospital_id != hospital.id:
                return Response({"error": "You can only view your own hospital's dashboard"}, status=403)

        queryset = Voucher.objects.filter(
            hospital=hospital,
            status='USED',
            redeemed_at__isnull=False,
        )

        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date:
            parsed_start = parse_date(start_date)
            if parsed_start:
                queryset = queryset.filter(redeemed_at__date__gte=parsed_start)

        if end_date:
            parsed_end = parse_date(end_date)
            if parsed_end:
                queryset = queryset.filter(redeemed_at__date__lte=parsed_end)

        daily_counts = (
            queryset
            .annotate(date=TruncDate('redeemed_at'))
            .values('date')
            .annotate(redeemed=Count('id'))
            .order_by('date')
        )

        return Response(HospitalRedeemedDailySerializer({
            "daily_breakdown": list(daily_counts),
        }).data)
