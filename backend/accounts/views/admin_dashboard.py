from datetime import date, timedelta

from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate, TruncMonth
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User, Role, HospitalAdmin, Receptionist, SocialWorker, SystemAdmin, Donor
from accounts.serializers.admin_dashboard import (
    GrowthIndicatorSerializer,
    FinancialGrowthIndicatorSerializer,
    OverviewKpiSerializer,
    FinancialSummarySerializer,
    FinancialMonthlySerializer,
    FinancialDashboardSerializer,
    DonationTrendsSerializer,
    TrendEntrySerializer,
    FinancialTrendEntrySerializer,
    UserGrowthSerializer,
    BeneficiaryVoucherSerializer,
    OrganizationDashboardSerializer,
    HospitalSummarySerializer,
    TrendsReportSerializer,
)
from accounts.utils import IsSystemAdmin
from beneficiaries.models import Beneficiary
from campaigns.models import Campaign, Donation
from hospitals.models import Hospital
from payments.models.account import EscrowAccount, FeeAccount
from payments.models.transaction import Transaction
from vouchers.models.Voucher import Voucher

_TAG = ["Admin Dashboard"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _as_date(val):
    """TruncDate/TruncMonth return timezone-aware datetimes — coerce to date for serializers."""
    if hasattr(val, "date"):
        return val.date()
    return val


def _date_range_from_params(request):
    """Parse period query params: period=day|week|month|year or start_date/end_date."""
    period = request.query_params.get("period", "month")
    today = date.today()

    if period == "day":
        start = today
        end = today
    elif period == "week":
        start = today - timedelta(days=today.weekday())
        end = today
    elif period == "month":
        start = today.replace(day=1)
        end = today
    elif period == "year":
        start = today.replace(month=1, day=1)
        end = today
    else:
        start = today.replace(day=1)
        end = today

    custom_start = request.query_params.get("start_date")
    custom_end = request.query_params.get("end_date")
    if custom_start:
        from django.utils.dateparse import parse_date
        parsed = parse_date(custom_start)
        if parsed:
            start = parsed
    if custom_end:
        from django.utils.dateparse import parse_date
        parsed = parse_date(custom_end)
        if parsed:
            end = parsed

    return start, end


def _previous_period(start, end):
    """Return the same-length previous period."""
    delta = end - start
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - delta
    return prev_start, prev_end


def _growth(current_val, previous_val):
    """Build a GrowthIndicator dict with change percent and direction."""
    current = int(current_val or 0)
    previous = int(previous_val or 0)

    if previous == 0:
        if current == 0:
            return {"current": current, "previous": previous, "change_percent": None, "direction": "flat"}
        return {"current": current, "previous": previous, "change_percent": None, "direction": "up"}

    change = round(((current - previous) / previous) * 100, 1)
    if change > 0:
        direction = "up"
    elif change < 0:
        direction = "down"
    else:
        direction = "flat"
    return {"current": current, "previous": previous, "change_percent": change, "direction": direction}


def _financial_growth(current_val, previous_val):
    """Build a FinancialGrowthIndicator dict."""
    current = float(current_val or 0)
    previous = float(previous_val or 0)

    if previous == 0:
        if current == 0:
            return {"current": current, "previous": previous, "change_percent": None, "direction": "flat"}
        return {"current": current, "previous": previous, "change_percent": None, "direction": "up"}

    change = round(((current - previous) / previous) * 100, 1)
    if change > 0:
        direction = "up"
    elif change < 0:
        direction = "down"
    else:
        direction = "flat"
    return {"current": current, "previous": previous, "change_percent": change, "direction": direction}


# ---------------------------------------------------------------------------
# 1. Overview Dashboard
# ---------------------------------------------------------------------------

class AdminOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Global KPIs with growth indicators comparing current month to previous month.",
        responses={200: OverviewKpiSerializer()},
    )
    def get(self, request):
        today = date.today()
        current_start = today.replace(day=1)
        current_end = today
        prev_start, prev_end = _previous_period(current_start, current_end)

        escrow = EscrowAccount.get_instance()
        escrow_current = float(escrow.balance or 0)

        prev_escrow_qs = Transaction.objects.filter(
            type="DISBURSEMENT", status="SUCCESSFUL",
            created_at__date__gte=prev_start, created_at__date__lte=prev_end
        ).aggregate(s=Sum("amount"))
        prev_disbursed = float((prev_escrow_qs["s"] or 0))

        donations_current = float(
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=current_start, created_at__date__lte=current_end)
            .aggregate(s=Sum("net_amount"))["s"] or 0
        )
        donations_prev = float(
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=prev_start, created_at__date__lte=prev_end)
            .aggregate(s=Sum("net_amount"))["s"] or 0
        )

        beneficiaries_current = Beneficiary.objects.filter(created_at__date__lte=current_end).count()
        beneficiaries_prev = Beneficiary.objects.filter(created_at__date__lte=prev_end).count()

        vouchers_current = Voucher.objects.filter(created_at__date__lte=current_end).count()
        vouchers_prev = Voucher.objects.filter(created_at__date__lte=prev_end).count()

        users_current = User.objects.filter(created_at__date__lte=current_end).count()
        users_prev = User.objects.filter(created_at__date__lte=prev_end).count()

        hospitals_current = Hospital.objects.filter(created_at__date__lte=current_end).count()
        hospitals_prev = Hospital.objects.filter(created_at__date__lte=prev_end).count()

        campaigns_current = Campaign.objects.filter(created_at__date__lte=current_end).count()
        campaigns_prev = Campaign.objects.filter(created_at__date__lte=prev_end).count()

        data = {
            "escrow_balance": {"current": escrow_current, "previous": escrow_current + prev_disbursed, "change_percent": None, "direction": "up" if escrow_current > 0 else "flat"},
            "total_donations": _financial_growth(donations_current, donations_prev),
            "total_beneficiaries": _growth(beneficiaries_current, beneficiaries_prev),
            "total_vouchers": _growth(vouchers_current, vouchers_prev),
            "total_users": _growth(users_current, users_prev),
            "total_hospitals": _growth(hospitals_current, hospitals_prev),
            "total_campaigns": _growth(campaigns_current, campaigns_prev),
        }
        return Response(OverviewKpiSerializer(data).data)


# ---------------------------------------------------------------------------
# 2. Financial Dashboard
# ---------------------------------------------------------------------------

class AdminFinancialView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Financial summary and monthly trends.",
        responses={200: FinancialDashboardSerializer()},
    )
    def get(self, request):
        escrow = EscrowAccount.get_instance()
        fee_account = FeeAccount.get_instance()

        total_donations = Donation.objects.filter(status="SUCCESS").aggregate(
            s=Sum("net_amount"), c=Count("id")
        )
        total_disbursed = Transaction.objects.filter(
            type="DISBURSEMENT", status="SUCCESSFUL"
        ).aggregate(s=Sum("amount"))

        monthly = (
            Donation.objects.filter(status="SUCCESS")
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                donations_amount=Sum("net_amount"),
                donations_count=Count("id"),
                platform_fees=Sum("platform_fee_amount"),
            )
            .order_by("month")
        )

        monthly_trends = []
        for m in monthly:
            disbursed = Transaction.objects.filter(
                type="DISBURSEMENT", status="SUCCESSFUL",
                created_at__year=m["month"].year,
                created_at__month=m["month"].month,
            ).aggregate(s=Sum("amount"))["s"] or 0
            monthly_trends.append({
                "month": _as_date(m["month"]),
                "donations_amount": float(m["donations_amount"] or 0),
                "donations_count": m["donations_count"],
                "platform_fees": float(m["platform_fees"] or 0),
                "disbursements": float(disbursed),
            })

        data = {
            "summary": {
                "escrow_balance": float(escrow.balance or 0),
                "platform_fees_collected": float(fee_account.balance or 0),
                "total_donations_received": float(total_donations["s"] or 0),
                "total_disbursements": float(total_disbursed["s"] or 0),
                "total_donations_count": total_donations["c"],
            },
            "monthly_trends": monthly_trends,
        }
        return Response(FinancialDashboardSerializer(data).data)


# ---------------------------------------------------------------------------
# 3. Donation Trends
# ---------------------------------------------------------------------------

class AdminDonationTrendsView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    period_param = openapi.Parameter("period", openapi.IN_QUERY, type=openapi.TYPE_STRING,
                                      description="day|week|month|year (default: month)")
    start_param = openapi.Parameter("start_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")
    end_param = openapi.Parameter("end_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Donation counts over time for line charts.",
        manual_parameters=[period_param, start_param, end_param],
        responses={200: DonationTrendsSerializer()},
    )
    def get(self, request):
        start, end = _date_range_from_params(request)

        daily = (
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        monthly = (
            Donation.objects.filter(status="SUCCESS")
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(value=Count("id"))
            .order_by("month")
        )

        data = {
            "donations_over_time": [{"date": _as_date(d["date"]), "value": d["value"]} for d in daily],
            "donations_by_month": [{"date": _as_date(m["month"]), "value": m["value"]} for m in monthly],
        }
        return Response(DonationTrendsSerializer(data).data)


# ---------------------------------------------------------------------------
# 4. User Analytics Dashboard
# ---------------------------------------------------------------------------

class AdminUserAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    period_param = openapi.Parameter("period", openapi.IN_QUERY, type=openapi.TYPE_STRING,
                                      description="day|week|month|year (default: month)")
    start_param = openapi.Parameter("start_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")
    end_param = openapi.Parameter("end_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="User growth trends and registrations over time.",
        manual_parameters=[period_param, start_param, end_param],
        responses={200: UserGrowthSerializer()},
    )
    def get(self, request):
        start, end = _date_range_from_params(request)
        prev_start, prev_end = _previous_period(start, end)

        def _role_growth(role_val):
            curr = User.objects.filter(role=role_val, created_at__date__lte=end).count()
            prev = User.objects.filter(role=role_val, created_at__date__lte=prev_end).count()
            return _growth(curr, prev)

        total_curr = User.objects.filter(created_at__date__lte=end).count()
        total_prev = User.objects.filter(created_at__date__lte=prev_end).count()

        registrations = (
            User.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        data = {
            "total_users": _growth(total_curr, total_prev),
            "donors": _role_growth(Role.DONOR),
            "hospital_admins": _role_growth(Role.HOSPITAL_ADMIN),
            "receptionists": _role_growth(Role.RECEPTIONIST),
            "social_workers": _role_growth(Role.SOCIAL_WORKER),
            "system_admins": _role_growth(Role.SYSTEM_ADMIN),
            "registrations_over_time": [{"date": _as_date(r["date"]), "value": r["value"]} for r in registrations],
        }
        return Response(UserGrowthSerializer(data).data)


# ---------------------------------------------------------------------------
# 5. Beneficiary & Voucher Dashboard
# ---------------------------------------------------------------------------

class AdminBeneficiaryVoucherView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    period_param = openapi.Parameter("period", openapi.IN_QUERY, type=openapi.TYPE_STRING,
                                      description="day|week|month|year (default: month)")
    start_param = openapi.Parameter("start_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")
    end_param = openapi.Parameter("end_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Beneficiary and voucher statistics with growth indicators.",
        manual_parameters=[period_param, start_param, end_param],
        responses={200: BeneficiaryVoucherSerializer()},
    )
    def get(self, request):
        start, end = _date_range_from_params(request)
        prev_start, prev_end = _previous_period(start, end)

        ben_curr = Beneficiary.objects.filter(created_at__date__lte=end).count()
        ben_prev = Beneficiary.objects.filter(created_at__date__lte=prev_end).count()

        vouch_curr = Voucher.objects.filter(created_at__date__lte=end).count()
        vouch_prev = Voucher.objects.filter(created_at__date__lte=prev_end).count()

        redeemed_curr = Voucher.objects.filter(status=Voucher.Status.USED, redeemed_at__date__lte=end).count()
        redeemed_prev = Voucher.objects.filter(status=Voucher.Status.USED, redeemed_at__date__lte=prev_end).count()

        vouchers_over_time = (
            Voucher.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        beneficiaries_over_time = (
            Beneficiary.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        data = {
            "total_beneficiaries": _growth(ben_curr, ben_prev),
            "total_vouchers_generated": _growth(vouch_curr, vouch_prev),
            "total_vouchers_redeemed": _growth(redeemed_curr, redeemed_prev),
            "vouchers_over_time": [{"date": _as_date(v["date"]), "value": v["value"]} for v in vouchers_over_time],
            "beneficiaries_over_time": [{"date": _as_date(b["date"]), "value": b["value"]} for b in beneficiaries_over_time],
        }
        return Response(BeneficiaryVoucherSerializer(data).data)


# ---------------------------------------------------------------------------
# 6. Organization Dashboard
# ---------------------------------------------------------------------------

class AdminOrganizationView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Organization overview: hospitals, staff, top hospitals.",
        responses={200: OrganizationDashboardSerializer()},
    )
    def get(self, request):
        today = date.today()
        current_start = today.replace(day=1)
        current_end = today
        prev_start, prev_end = _previous_period(current_start, current_end)

        hosp_curr = Hospital.objects.filter(created_at__date__lte=current_end).count()
        hosp_prev = Hospital.objects.filter(created_at__date__lte=prev_end).count()

        ha_curr = HospitalAdmin.objects.filter(user__created_at__date__lte=current_end).count()
        ha_prev = HospitalAdmin.objects.filter(user__created_at__date__lte=prev_end).count()

        sw_curr = SocialWorker.objects.filter(user__created_at__date__lte=current_end).count()
        sw_prev = SocialWorker.objects.filter(user__created_at__date__lte=prev_end).count()

        rec_curr = Receptionist.objects.filter(user__created_at__date__lte=current_end).count()
        rec_prev = Receptionist.objects.filter(user__created_at__date__lte=prev_end).count()

        by_status = (
            Hospital.objects.values("partnership_status")
            .annotate(count=Count("id"))
            .order_by("partnership_status")
        )
        hospitals_by_status = [{"status": s["partnership_status"], "count": s["count"]} for s in by_status]

        top_hospitals = []
        for h in Hospital.objects.filter(is_active=True).order_by("-created_at")[:10]:
            top_hospitals.append({
                "id": str(h.id),
                "name": h.name,
                "city": h.city,
                "status": h.partnership_status,
                "staff_count": HospitalAdmin.objects.filter(hospital=h, is_active=True).count()
                                + Receptionist.objects.filter(hospital=h).count(),
                "vouchers_redeemed": Voucher.objects.filter(hospital=h, status=Voucher.Status.USED).count(),
            })

        data = {
            "total_hospitals": _growth(hosp_curr, hosp_prev),
            "total_hospital_admins": _growth(ha_curr, ha_prev),
            "total_social_workers": _growth(sw_curr, sw_prev),
            "total_receptionists": _growth(rec_curr, rec_prev),
            "hospitals_by_status": hospitals_by_status,
            "top_hospitals": top_hospitals,
        }
        return Response(OrganizationDashboardSerializer(data).data)


# ---------------------------------------------------------------------------
# 7. Trends & Reports Dashboard
# ---------------------------------------------------------------------------

class AdminTrendsReportView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    period_param = openapi.Parameter("period", openapi.IN_QUERY, type=openapi.TYPE_STRING,
                                      description="day|week|month|year (default: month)")
    start_param = openapi.Parameter("start_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")
    end_param = openapi.Parameter("end_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Comprehensive trends and report data for the selected period.",
        manual_parameters=[period_param, start_param, end_param],
        responses={200: TrendsReportSerializer()},
    )
    def get(self, request):
        start, end = _date_range_from_params(request)

        date_filter = Q(created_at__date__gte=start, created_at__date__lte=end)

        new_users = User.objects.filter(date_filter).count()
        new_beneficiaries = Beneficiary.objects.filter(date_filter).count()
        vouchers_generated = Voucher.objects.filter(date_filter).count()
        vouchers_redeemed = Voucher.objects.filter(
            status=Voucher.Status.USED, redeemed_at__date__gte=start, redeemed_at__date__lte=end
        ).count()

        donations_qs = Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
        donations_count = donations_qs.count()
        donations_amount = float(donations_qs.aggregate(s=Sum("net_amount"))["s"] or 0)
        platform_fees = float(donations_qs.aggregate(s=Sum("platform_fee_amount"))["s"] or 0)

        user_registrations = (
            User.objects.filter(date_filter)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        donations_daily = (
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Sum("net_amount"))
            .order_by("date")
        )

        vouchers_daily = (
            Voucher.objects.filter(date_filter)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        daily_breakdown = []
        current = start
        while current <= end:
            ur = next((r for r in user_registrations if r["date"] == current), None)
            dr = next((d for d in donations_daily if d["date"] == current), None)
            vr = next((v for v in vouchers_daily if v["date"] == current), None)
            daily_breakdown.append({
                "date": str(current),
                "new_users": ur["value"] if ur else 0,
                "donations_count": Donation.objects.filter(
                    status="SUCCESS", created_at__date=current
                ).count(),
                "donations_amount": float(
                    Donation.objects.filter(status="SUCCESS", created_at__date=current)
                    .aggregate(s=Sum("net_amount"))["s"] or 0
                ),
                "vouchers_generated": vr["value"] if vr else 0,
            })
            current += timedelta(days=1)

        data = {
            "period_start": start,
            "period_end": end,
            "summary": {
                "new_users": new_users,
                "new_beneficiaries": new_beneficiaries,
                "vouchers_generated": vouchers_generated,
                "vouchers_redeemed": vouchers_redeemed,
                "donations_count": donations_count,
                "donations_amount": donations_amount,
                "platform_fees": platform_fees,
            },
            "user_registrations": [{"date": _as_date(r["date"]), "value": r["value"]} for r in user_registrations],
            "donations": [{"date": _as_date(d["date"]), "value": float(d["value"] or 0)} for d in donations_daily],
            "vouchers": [{"date": _as_date(v["date"]), "value": v["value"]} for v in vouchers_daily],
            "daily_breakdown": daily_breakdown,
        }
        return Response(TrendsReportSerializer(data).data)
