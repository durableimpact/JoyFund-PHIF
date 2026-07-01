from datetime import date, timedelta

from django.db.models import Count, Sum, Q, Value, IntegerField
from django.db.models.functions import TruncDate, TruncMonth, Coalesce
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
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
    UserRoleSummarySerializer,
    CampaignPerformanceSerializer,
    VoucherAnalyticsSerializer,
    HospitalNetworkSerializer,
    ComprehensiveAnalyticsSerializer,
    AdminUserDetailSerializer,
)
from accounts.utils import IsSystemAdmin
from beneficiaries.models import Beneficiary, HealthIssue
from campaigns.models import Campaign, Donation
from hospitals.models import Hospital, MedicalClaim, MedicalClaimProof
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
    """Parse period query params: period=day|week|month|year or start_date/end_date.

    Uses rolling windows:
      day   = last 7 days
      week  = last 7 days
      month = last 30 days
      year  = last 365 days
    """
    period = request.query_params.get("period", "month")
    today = date.today()

    if period == "day":
        start = today - timedelta(days=6)
        end = today
    elif period == "week":
        start = today - timedelta(days=6)
        end = today
    elif period == "month":
        start = today - timedelta(days=29)
        end = today
    elif period == "year":
        start = today - timedelta(days=364)
        end = today
    else:
        start = today - timedelta(days=29)
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


def _fill_date_range(data, start, end, value_key="value"):
    """Fill missing dates in a list of {date, value} dicts with zeros."""
    result = []
    current = start
    lookup = {item["date"]: item[value_key] for item in data if item.get("date")}
    while current <= end:
        result.append({"date": current, value_key: lookup.get(current, 0)})
        current += timedelta(days=1)
    return result


def _fill_month_range(data, start, end, value_key="value"):
    """Fill missing months in a list of {date, value} dicts with zeros."""
    from dateutil.relativedelta import relativedelta
    result = []
    current = start.replace(day=1)
    end_first = end.replace(day=1)
    lookup = {}
    for item in data:
        d = item.get("date")
        if d:
            lookup[d.replace(day=1)] = item[value_key]
    while current <= end_first:
        result.append({"date": current, value_key: lookup.get(current, 0)})
        current += relativedelta(months=1)
    return result


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

@method_decorator(cache_page(60), name='dispatch')
class AdminOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Global KPIs with growth indicators comparing current month to previous month.",
        responses={200: OverviewKpiSerializer()},
    )
    def get(self, request):
        start, end = _date_range_from_params(request)
        prev_start, prev_end = _previous_period(start, end)

        escrow = EscrowAccount.get_instance()
        escrow_current = float(escrow.balance or 0)

        prev_escrow_qs = Transaction.objects.filter(
            type="DISBURSEMENT", status="SUCCESSFUL",
            created_at__date__gte=prev_start, created_at__date__lte=prev_end
        ).aggregate(s=Sum("amount"))
        prev_disbursed = float((prev_escrow_qs["s"] or 0))

        donations_agg = Donation.objects.filter(
            status="SUCCESS", created_at__date__lte=end
        ).aggregate(
            current=Sum("net_amount", filter=Q(created_at__date__gte=start)),
            prev=Sum("net_amount", filter=Q(created_at__date__gte=prev_start, created_at__date__lte=prev_end)),
        )
        donations_current = float(donations_agg["current"] or 0)
        donations_prev = float(donations_agg["prev"] or 0)

        ben_agg = Beneficiary.objects.filter(created_at__date__lte=end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
        )
        beneficiaries_current = ben_agg["current"]
        beneficiaries_prev = ben_agg["prev"]

        vouch_agg = Voucher.objects.filter(created_at__date__lte=end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
        )
        vouchers_current = vouch_agg["current"]
        vouchers_prev = vouch_agg["prev"]

        users_agg = User.objects.filter(created_at__date__lte=end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
        )
        users_current = users_agg["current"]
        users_prev = users_agg["prev"]

        hosp_agg = Hospital.objects.filter(created_at__date__lte=end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
        )
        hospitals_current = hosp_agg["current"]
        hospitals_prev = hosp_agg["prev"]

        camp_agg = Campaign.objects.filter(created_at__date__lte=end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
        )
        campaigns_current = camp_agg["current"]
        campaigns_prev = camp_agg["prev"]

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

@method_decorator(cache_page(60), name='dispatch')
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

        disbursed_by_month = (
            Transaction.objects.filter(type="DISBURSEMENT", status="SUCCESSFUL")
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(disbursed=Sum("amount"))
        )
        disbursed_map = {r["month"]: float(r["disbursed"] or 0) for r in disbursed_by_month}

        monthly_trends = []
        for m in monthly:
            monthly_trends.append({
                "month": _as_date(m["month"]),
                "donations_amount": float(m["donations_amount"] or 0),
                "donations_count": m["donations_count"],
                "platform_fees": float(m["platform_fees"] or 0),
                "disbursements": disbursed_map.get(m["month"], 0),
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

@method_decorator(cache_page(60), name='dispatch')
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
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(value=Count("id"))
            .order_by("month")
        )

        donations_over_time = [{"date": _as_date(d["date"]), "value": d["value"]} for d in daily]
        donations_by_month_list = [{"date": _as_date(m["month"]), "value": m["value"]} for m in monthly]

        data = {
            "donations_over_time": _fill_date_range(donations_over_time, start, end),
            "donations_by_month": _fill_month_range(donations_by_month_list, start, end),
        }
        return Response(DonationTrendsSerializer(data).data)


# ---------------------------------------------------------------------------
# 4. User Analytics Dashboard
# ---------------------------------------------------------------------------

@method_decorator(cache_page(60), name='dispatch')
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

        roles = [Role.DONOR, Role.HOSPITAL_ADMIN, Role.RECEPTIONIST, Role.SOCIAL_WORKER, Role.SYSTEM_ADMIN]

        curr_data = User.objects.filter(role__in=roles, created_at__date__lte=end).values("role").annotate(count=Count("id"))
        curr_map = {r["role"]: r["count"] for r in curr_data}

        prev_data = User.objects.filter(role__in=roles, created_at__date__lte=prev_end).values("role").annotate(count=Count("id"))
        prev_map = {r["role"]: r["count"] for r in prev_data}

        total_curr = sum(curr_map.values())
        total_prev = sum(prev_map.values())

        def _role_growth(role_val):
            return _growth(curr_map.get(role_val, 0), prev_map.get(role_val, 0))

        registrations = (
            User.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        registrations_over_time = [{"date": _as_date(r["date"]), "value": r["value"]} for r in registrations]

        data = {
            "total_users": _growth(total_curr, total_prev),
            "donors": _role_growth(Role.DONOR),
            "hospital_admins": _role_growth(Role.HOSPITAL_ADMIN),
            "receptionists": _role_growth(Role.RECEPTIONIST),
            "social_workers": _role_growth(Role.SOCIAL_WORKER),
            "system_admins": _role_growth(Role.SYSTEM_ADMIN),
            "registrations_over_time": _fill_date_range(registrations_over_time, start, end),
        }
        return Response(UserGrowthSerializer(data).data)


# ---------------------------------------------------------------------------
# 5. Beneficiary & Voucher Dashboard
# ---------------------------------------------------------------------------

@method_decorator(cache_page(60), name='dispatch')
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

        ben_agg = Beneficiary.objects.filter(created_at__date__lte=end).aggregate(
            curr=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
        )
        ben_curr, ben_prev = ben_agg["curr"], ben_agg["prev"]

        vouch_agg = Voucher.objects.filter(created_at__date__lte=end).aggregate(
            curr=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
            redeemed_curr=Count("id", filter=Q(status=Voucher.Status.USED, redeemed_at__date__lte=end)),
            redeemed_prev=Count("id", filter=Q(status=Voucher.Status.USED, redeemed_at__date__lte=prev_end)),
        )
        vouch_curr, vouch_prev = vouch_agg["curr"], vouch_agg["prev"]
        redeemed_curr, redeemed_prev = vouch_agg["redeemed_curr"], vouch_agg["redeemed_prev"]

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

        vouchers_over_time_list = [{"date": _as_date(v["date"]), "value": v["value"]} for v in vouchers_over_time]
        beneficiaries_over_time_list = [{"date": _as_date(b["date"]), "value": b["value"]} for b in beneficiaries_over_time]

        data = {
            "total_beneficiaries": _growth(ben_curr, ben_prev),
            "total_vouchers_generated": _growth(vouch_curr, vouch_prev),
            "total_vouchers_redeemed": _growth(redeemed_curr, redeemed_prev),
            "vouchers_over_time": _fill_date_range(vouchers_over_time_list, start, end),
            "beneficiaries_over_time": _fill_date_range(beneficiaries_over_time_list, start, end),
        }
        return Response(BeneficiaryVoucherSerializer(data).data)


# ---------------------------------------------------------------------------
# 6. Organization Dashboard
# ---------------------------------------------------------------------------

@method_decorator(cache_page(60), name='dispatch')
class AdminOrganizationView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Organization overview: hospitals, staff, top hospitals.",
        responses={200: OrganizationDashboardSerializer()},
    )
    def get(self, request):
        start, end = _date_range_from_params(request)
        prev_start, prev_end = _previous_period(start, end)

        hosp_agg = Hospital.objects.filter(created_at__date__lte=end).aggregate(
            curr=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
        )
        hosp_curr, hosp_prev = hosp_agg["curr"], hosp_agg["prev"]

        ha_agg = HospitalAdmin.objects.filter(user__created_at__date__lte=end).aggregate(
            curr=Count("id"),
            prev=Count("id", filter=Q(user__created_at__date__lte=prev_end)),
        )
        ha_curr, ha_prev = ha_agg["curr"], ha_agg["prev"]

        sw_agg = SocialWorker.objects.filter(user__created_at__date__lte=end).aggregate(
            curr=Count("id"),
            prev=Count("id", filter=Q(user__created_at__date__lte=prev_end)),
        )
        sw_curr, sw_prev = sw_agg["curr"], sw_agg["prev"]

        rec_agg = Receptionist.objects.filter(user__created_at__date__lte=end).aggregate(
            curr=Count("id"),
            prev=Count("id", filter=Q(user__created_at__date__lte=prev_end)),
        )
        rec_curr, rec_prev = rec_agg["curr"], rec_agg["prev"]

        by_status = (
            Hospital.objects.values("partnership_status")
            .annotate(count=Count("id"))
            .order_by("partnership_status")
        )
        hospitals_by_status = [{"status": s["partnership_status"], "count": s["count"]} for s in by_status]

        top_hospitals_qs = (
            Hospital.objects.filter(is_active=True)
            .annotate(
                staff_count=Coalesce(Count("admins", filter=Q(admins__is_active=True)), 0)
                           + Coalesce(Count("receptionists"), 0),
                vouchers_redeemed_count=Coalesce(Count("voucher", filter=Q(voucher__status=Voucher.Status.USED)), 0),
            )
            .order_by("-created_at")[:10]
        )
        top_hospitals = [{
            "id": str(h.id),
            "name": h.name,
            "city": h.city,
            "status": h.partnership_status,
            "staff_count": h.staff_count,
            "vouchers_redeemed": h.vouchers_redeemed_count,
        } for h in top_hospitals_qs]

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

@method_decorator(cache_page(60), name='dispatch')
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

        vouch_agg = Voucher.objects.filter(date_filter).aggregate(
            generated=Count("id"),
            redeemed=Count("id", filter=Q(status=Voucher.Status.USED, redeemed_at__date__gte=start, redeemed_at__date__lte=end)),
        )
        vouchers_generated = vouch_agg["generated"]
        vouchers_redeemed = vouch_agg["redeemed"]

        donations_qs = Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
        donations_agg = donations_qs.aggregate(
            count=Count("id"), amount=Sum("net_amount"), fees=Sum("platform_fee_amount")
        )
        donations_count = donations_agg["count"]
        donations_amount = float(donations_agg["amount"] or 0)
        platform_fees = float(donations_agg["fees"] or 0)

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

        user_reg_map = {r["date"]: r["value"] for r in user_registrations}
        donations_daily_map = {d["date"]: float(d["value"] or 0) for d in donations_daily}
        vouchers_map = {v["date"]: v["value"] for v in vouchers_daily}

        donations_count_daily = (
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )
        donations_count_map = {d["date"]: d["value"] for d in donations_count_daily}

        daily_breakdown = []
        current = start
        while current <= end:
            daily_breakdown.append({
                "date": str(current),
                "new_users": user_reg_map.get(current, 0),
                "donations_count": donations_count_map.get(current, 0),
                "donations_amount": donations_daily_map.get(current, 0),
                "vouchers_generated": vouchers_map.get(current, 0),
            })
            current += timedelta(days=1)

        user_registrations_list = [{"date": _as_date(r["date"]), "value": r["value"]} for r in user_registrations]
        donations_daily_list = [{"date": _as_date(d["date"]), "value": float(d["value"] or 0)} for d in donations_daily]
        vouchers_daily_list = [{"date": _as_date(v["date"]), "value": v["value"]} for v in vouchers_daily]

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
            "user_registrations": _fill_date_range(user_registrations_list, start, end),
            "donations": _fill_date_range(donations_daily_list, start, end, value_key="value"),
            "vouchers": _fill_date_range(vouchers_daily_list, start, end),
            "daily_breakdown": daily_breakdown,
        }
        return Response(TrendsReportSerializer(data).data)


# ---------------------------------------------------------------------------
# 8. User Role Summary
# ---------------------------------------------------------------------------

@method_decorator(cache_page(60), name='dispatch')
class AdminUserRoleSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="User count breakdown by role for the users page chart.",
        responses={200: UserRoleSummarySerializer()},
    )
    def get(self, request):
        ROLE_CONFIG = {
            Role.DONOR: {"label": "Donors", "color": "#6B7280"},
            Role.HOSPITAL_ADMIN: {"label": "Hospital Admins", "color": "#3B82F6"},
            Role.SOCIAL_WORKER: {"label": "Social Workers", "color": "#10B981"},
            Role.RECEPTIONIST: {"label": "Receptionists", "color": "#F59E0B"},
            Role.SYSTEM_ADMIN: {"label": "System Admins", "color": "#8B5CF6"},
        }

        role_counts_q = User.objects.values("role").annotate(count=Count("id"))
        role_counts_map = {r["role"]: r["count"] for r in role_counts_q}
        total = sum(role_counts_map.values())

        roles = []
        for role_key, config in ROLE_CONFIG.items():
            count = role_counts_map.get(role_key, 0)
            roles.append({
                "role": role_key,
                "label": config["label"],
                "count": count,
                "color": config["color"],
            })

        data = {
            "total_users": total,
            "roles": roles,
        }
        return Response(UserRoleSummarySerializer(data).data)


# ---------------------------------------------------------------------------
# 9. Comprehensive Analytics Dashboard
# ---------------------------------------------------------------------------

@method_decorator(cache_page(60), name='dispatch')
class AdminComprehensiveAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    period_param = openapi.Parameter("period", openapi.IN_QUERY, type=openapi.TYPE_STRING,
                                      description="day|week|month|year (default: month)")
    start_param = openapi.Parameter("start_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")
    end_param = openapi.Parameter("end_date", openapi.IN_QUERY, type=openapi.TYPE_STRING, format="date")

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Comprehensive analytics dashboard combining all platform metrics.",
        manual_parameters=[period_param, start_param, end_param],
        responses={200: ComprehensiveAnalyticsSerializer()},
    )
    def get(self, request):
        start, end = _date_range_from_params(request)
        prev_start, prev_end = _previous_period(start, end)
        today = date.today()

        # --- Executive Summary (reuse overview logic) ---
        current_start = today.replace(day=1)
        current_end = today
        ov_prev_start, ov_prev_end = _previous_period(current_start, current_end)

        escrow = EscrowAccount.get_instance()
        escrow_current = float(escrow.balance or 0)

        prev_escrow_qs = Transaction.objects.filter(
            type="DISBURSEMENT", status="SUCCESSFUL",
            created_at__date__gte=ov_prev_start, created_at__date__lte=ov_prev_end
        ).aggregate(s=Sum("amount"))
        prev_disbursed = float((prev_escrow_qs["s"] or 0))

        donations_agg = Donation.objects.filter(
            status="SUCCESS", created_at__date__lte=current_end
        ).aggregate(
            current=Sum("net_amount"),
            prev=Sum("net_amount", filter=Q(created_at__date__lte=ov_prev_end)),
        )
        donations_current = float(donations_agg["current"] or 0)
        donations_prev = float(donations_agg["prev"] or 0)

        ben_agg = Beneficiary.objects.filter(created_at__date__lte=current_end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=ov_prev_end)),
        )
        beneficiaries_current = ben_agg["current"]
        beneficiaries_prev = ben_agg["prev"]

        vouch_agg = Voucher.objects.filter(created_at__date__lte=current_end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=ov_prev_end)),
        )
        vouchers_current = vouch_agg["current"]
        vouchers_prev = vouch_agg["prev"]

        users_agg = User.objects.filter(created_at__date__lte=current_end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=ov_prev_end)),
        )
        users_current = users_agg["current"]
        users_prev = users_agg["prev"]

        hosp_agg = Hospital.objects.filter(created_at__date__lte=current_end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=ov_prev_end)),
        )
        hospitals_current = hosp_agg["current"]
        hospitals_prev = hosp_agg["prev"]

        camp_agg = Campaign.objects.filter(created_at__date__lte=current_end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=ov_prev_end)),
        )
        campaigns_current = camp_agg["current"]
        campaigns_prev = camp_agg["prev"]

        executive_summary = {
            "escrow_balance": {"current": escrow_current, "previous": escrow_current + prev_disbursed, "change_percent": None, "direction": "up" if escrow_current > 0 else "flat"},
            "total_donations": _financial_growth(donations_current, donations_prev),
            "total_beneficiaries": _growth(beneficiaries_current, beneficiaries_prev),
            "total_vouchers": _growth(vouchers_current, vouchers_prev),
            "total_users": _growth(users_current, users_prev),
            "total_hospitals": _growth(hospitals_current, hospitals_prev),
            "total_campaigns": _growth(campaigns_current, campaigns_prev),
        }

        # --- User Growth (2 queries instead of 12) ---
        total_curr = User.objects.filter(created_at__date__lte=end).count()
        total_prev_u = User.objects.filter(created_at__date__lte=prev_end).count()

        curr_role_data = User.objects.filter(created_at__date__lte=end).values("role").annotate(count=Count("id"))
        curr_role_map = {r["role"]: r["count"] for r in curr_role_data}

        prev_role_data = User.objects.filter(created_at__date__lte=prev_end).values("role").annotate(count=Count("id"))
        prev_role_map = {r["role"]: r["count"] for r in prev_role_data}

        def _role_growth(role_val):
            return _growth(curr_role_map.get(role_val, 0), prev_role_map.get(role_val, 0))

        registrations = (
            User.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )
        registrations_list = [{"date": _as_date(r["date"]), "value": r["value"]} for r in registrations]

        user_growth = {
            "total_users": _growth(total_curr, total_prev_u),
            "donors": _role_growth(Role.DONOR),
            "hospital_admins": _role_growth(Role.HOSPITAL_ADMIN),
            "receptionists": _role_growth(Role.RECEPTIONIST),
            "social_workers": _role_growth(Role.SOCIAL_WORKER),
            "system_admins": _role_growth(Role.SYSTEM_ADMIN),
            "registrations_over_time": _fill_date_range(registrations_list, start, end),
        }

        # --- Donation Analytics ---
        daily_donations = (
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )
        monthly_donations = (
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(value=Count("id"))
            .order_by("month")
        )
        donation_analytics = {
            "donations_over_time": _fill_date_range(
                [{"date": _as_date(d["date"]), "value": d["value"]} for d in daily_donations], start, end
            ),
            "donations_by_month": _fill_month_range(
                [{"date": _as_date(m["month"]), "value": m["value"]} for m in monthly_donations], start, end
            ),
        }

        # --- Campaign Performance ---
        campaign_status_counts = (
            Campaign.objects.filter(created_at__date__lte=end)
            .values("status")
            .annotate(count=Count("id"))
        )
        status_map = {s["status"]: s["count"] for s in campaign_status_counts}

        campaign_donations_agg = Donation.objects.filter(
            status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end
        ).aggregate(s=Sum("net_amount"), c=Count("id"))
        total_raised = float(campaign_donations_agg["s"] or 0)
        donation_count_period = campaign_donations_agg["c"]
        avg_donation = total_raised / donation_count_period if donation_count_period > 0 else 0

        active = status_map.get(Campaign.CampaignStatus.ACTIVE, 0)
        funded = status_map.get(Campaign.CampaignStatus.FUNDED, 0)
        closed = status_map.get(Campaign.CampaignStatus.CLOSED, 0)
        total_camps = sum(status_map.values())
        completion_rate = ((funded + closed) / total_camps * 100) if total_camps > 0 else 0

        campaigns_over_time_q = (
            Campaign.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )
        campaign_performance = {
            "total_campaigns": total_camps,
            "active_campaigns": active,
            "funded_campaigns": funded,
            "closed_campaigns": closed,
            "total_raised": total_raised,
            "avg_donation": round(avg_donation, 2),
            "completion_rate": round(completion_rate, 1),
            "campaigns_over_time": _fill_date_range(
                [{"date": _as_date(c["date"]), "value": c["value"]} for c in campaigns_over_time_q], start, end
            ),
        }

        # --- Voucher Analytics ---
        vouch_agg = Voucher.objects.filter(created_at__date__lte=end).aggregate(
            current=Count("id"),
            prev=Count("id", filter=Q(created_at__date__lte=prev_end)),
            redeemed_curr=Count("id", filter=Q(status=Voucher.Status.USED, redeemed_at__date__lte=end)),
            redeemed_prev=Count("id", filter=Q(status=Voucher.Status.USED, redeemed_at__date__lte=prev_end)),
        )
        vouch_curr = vouch_agg["current"]
        vouch_prev = vouch_agg["prev"]
        redeemed_curr = vouch_agg["redeemed_curr"]
        redeemed_prev = vouch_agg["redeemed_prev"]
        redemption_rate = (redeemed_curr / vouch_curr * 100) if vouch_curr > 0 else 0

        vouchers_over_time_q = (
            Voucher.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        vouchers_by_hospital = (
            Voucher.objects.filter(created_at__date__gte=start, created_at__date__lte=end, hospital__isnull=False)
            .values("hospital__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        voucher_analytics = {
            "total_generated": _growth(vouch_curr, vouch_prev),
            "total_redeemed": _growth(redeemed_curr, redeemed_prev),
            "redemption_rate": round(redemption_rate, 1),
            "vouchers_over_time": _fill_date_range(
                [{"date": _as_date(v["date"]), "value": v["value"]} for v in vouchers_over_time_q], start, end
            ),
            "by_hospital": [{"hospital": v["hospital__name"], "count": v["count"]} for v in vouchers_by_hospital],
        }

        # --- Financial Overview ---
        fee_account = FeeAccount.get_instance()
        total_donations_all = Donation.objects.filter(status="SUCCESS").aggregate(
            s=Sum("net_amount"), c=Count("id")
        )
        total_disbursed = Transaction.objects.filter(
            type="DISBURSEMENT", status="SUCCESSFUL"
        ).aggregate(s=Sum("amount"))

        monthly_finance = (
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                donations_amount=Sum("net_amount"),
                donations_count=Count("id"),
                platform_fees=Sum("platform_fee_amount"),
            )
            .order_by("month")
        )

        disbursed_agg = (
            Transaction.objects.filter(type="DISBURSEMENT", status="SUCCESSFUL",
                                       created_at__date__gte=start, created_at__date__lte=end)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(discharged_total=Sum("amount"))
        )
        disbursed_map = {m["month"]: float(m["discharged_total"] or 0) for m in disbursed_agg}

        monthly_trends = []
        for m in monthly_finance:
            monthly_trends.append({
                "month": _as_date(m["month"]),
                "donations_amount": float(m["donations_amount"] or 0),
                "donations_count": m["donations_count"],
                "platform_fees": float(m["platform_fees"] or 0),
                "disbursements": disbursed_map.get(m["month"], 0),
            })

        financial_overview = {
            "summary": {
                "escrow_balance": float(escrow.balance or 0),
                "platform_fees_collected": float(fee_account.balance or 0),
                "total_donations_received": float(total_donations_all["s"] or 0),
                "total_disbursements": float(total_disbursed["s"] or 0),
                "total_donations_count": total_donations_all["c"],
            },
            "monthly_trends": monthly_trends,
        }

        # --- Hospital Network ---
        hosp_by_status = (
            Hospital.objects.values("partnership_status")
            .annotate(count=Count("id"))
            .order_by("partnership_status")
        )
        top_hospitals_qs = (
            Hospital.objects.filter(is_active=True)
            .annotate(
                staff_count=Coalesce(Count("admins", filter=Q(admins__is_active=True)), 0)
                           + Coalesce(Count("receptionists"), 0),
                vouchers_redeemed_count=Coalesce(Count("voucher", filter=Q(voucher__status=Voucher.Status.USED)), 0),
            )
            .order_by("-created_at")[:10]
        )
        top_hospitals = [{
            "id": str(h.id),
            "name": h.name,
            "city": h.city,
            "status": h.partnership_status,
            "staff_count": h.staff_count,
            "vouchers_redeemed": h.vouchers_redeemed_count,
        } for h in top_hospitals_qs]

        hospitals_over_time_q = (
            Hospital.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        hospital_network = {
            "total_hospitals": _growth(hospitals_current, hospitals_prev),
            "hospitals_by_status": [{"status": s["partnership_status"], "count": s["count"]} for s in hosp_by_status],
            "top_hospitals": top_hospitals,
            "hospitals_over_time": _fill_date_range(
                [{"date": _as_date(h["date"]), "value": h["value"]} for h in hospitals_over_time_q], start, end
            ),
        }

        # --- Daily Activity (reuse trends report logic) ---
        date_filter = Q(created_at__date__gte=start, created_at__date__lte=end)
        new_users = User.objects.filter(date_filter).count()
        new_beneficiaries = Beneficiary.objects.filter(date_filter).count()

        vouch_daily_agg = Voucher.objects.filter(date_filter).aggregate(
            generated=Count("id"),
            redeemed=Count("id", filter=Q(status=Voucher.Status.USED, redeemed_at__date__gte=start, redeemed_at__date__lte=end)),
        )
        vouchers_gen = vouch_daily_agg["generated"]
        vouchers_redeemed_t = vouch_daily_agg["redeemed"]
        donations_qs = Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
        donations_agg = donations_qs.aggregate(
            count=Count("id"), amount=Sum("net_amount"), fees=Sum("platform_fee_amount")
        )
        donations_count_t = donations_agg["count"]
        donations_amount_t = float(donations_agg["amount"] or 0)
        platform_fees_t = float(donations_agg["fees"] or 0)

        user_reg_q = list(
            User.objects.filter(date_filter)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )
        donations_daily_q = list(
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Sum("net_amount"))
            .order_by("date")
        )
        donations_count_daily_q = list(
            Donation.objects.filter(status="SUCCESS", created_at__date__gte=start, created_at__date__lte=end)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )
        vouchers_daily_q = list(
            Voucher.objects.filter(date_filter)
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(value=Count("id"))
            .order_by("date")
        )

        user_reg_map = {r["date"]: r["value"] for r in user_reg_q}
        donations_daily_map = {d["date"]: float(d["value"] or 0) for d in donations_daily_q}
        donations_count_map = {d["date"]: d["value"] for d in donations_count_daily_q}
        vouchers_map = {v["date"]: v["value"] for v in vouchers_daily_q}

        daily_breakdown = []
        current = start
        while current <= end:
            daily_breakdown.append({
                "date": str(current),
                "new_users": user_reg_map.get(current, 0),
                "donations_count": donations_count_map.get(current, 0),
                "donations_amount": donations_daily_map.get(current, 0),
                "vouchers_generated": vouchers_map.get(current, 0),
            })
            current += timedelta(days=1)

        daily_activity = {
            "period_start": start,
            "period_end": end,
            "summary": {
                "new_users": new_users,
                "new_beneficiaries": new_beneficiaries,
                "vouchers_generated": vouchers_gen,
                "vouchers_redeemed": vouchers_redeemed_t,
                "donations_count": donations_count_t,
                "donations_amount": donations_amount_t,
                "platform_fees": platform_fees_t,
            },
            "user_registrations": _fill_date_range(
                [{"date": _as_date(r["date"]), "value": r["value"]} for r in user_reg_q], start, end
            ),
            "donations": _fill_date_range(
                [{"date": _as_date(d["date"]), "value": float(d["value"] or 0)} for d in donations_daily_q], start, end, value_key="value"
            ),
            "vouchers": _fill_date_range(
                [{"date": _as_date(v["date"]), "value": v["value"]} for v in vouchers_daily_q], start, end
            ),
            "daily_breakdown": daily_breakdown,
        }

        data = {
            "executive_summary": executive_summary,
            "user_growth": user_growth,
            "donation_analytics": donation_analytics,
            "campaign_performance": campaign_performance,
            "voucher_analytics": voucher_analytics,
            "financial_overview": financial_overview,
            "hospital_network": hospital_network,
            "daily_activity": daily_activity,
        }
        return Response(ComprehensiveAnalyticsSerializer(data).data)


# ---------------------------------------------------------------------------
# 10. Admin User Detail (comprehensive single-user view)
# ---------------------------------------------------------------------------

class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    user_param = openapi.Parameter("user_id", openapi.IN_PATH, type=openapi.TYPE_STRING,
                                    description="Profile UUID of the user")

    @swagger_auto_schema(
        tags=_TAG,
        operation_description="Comprehensive user detail: profile, role-specific stats, activity, devices.",
        manual_parameters=[user_param],
        responses={200: AdminUserDetailSerializer()},
    )
    def get(self, request, user_id):
        # Try to find the user by profile ID (each role has its own profile ID)
        user_obj = None
        profile = None
        role = None

        # Try each role profile
        for Model, r in [
            (Donor, Role.DONOR),
            (HospitalAdmin, Role.HOSPITAL_ADMIN),
            (SocialWorker, Role.SOCIAL_WORKER),
            (Receptionist, Role.RECEPTIONIST),
            (SystemAdmin, Role.SYSTEM_ADMIN),
        ]:
            try:
                profile = Model.objects.select_related("user").get(id=user_id)
                user_obj = profile.user
                role = r
                break
            except Model.DoesNotExist:
                continue

        if not user_obj:
            # Try by user ID directly
            try:
                user_obj = User.objects.get(id=user_id)
                role = user_obj.role
                profile = None
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=404)

        # Build common user dict
        user_data = {
            "id": str(user_obj.id),
            "email": user_obj.email,
            "first_name": user_obj.first_name,
            "last_name": user_obj.last_name,
            "phone_number": str(user_obj.phone_number),
            "role": user_obj.role,
            "is_verified": user_obj.is_verified,
            "is_active": user_obj.is_active,
            "is_staff": user_obj.is_staff,
            "profile_picture": user_obj.profile_picture.url if user_obj.profile_picture else None,
            "created_at": user_obj.created_at,
            "updated_at": user_obj.updated_at,
        }

        # Build profile dict
        profile_data = None
        if profile and role == Role.DONOR:
            profile_data = {"id": str(profile.id)}
        elif profile and role == Role.HOSPITAL_ADMIN:
            profile_data = {
                "id": str(profile.id),
                "national_id_number": profile.national_id_number,
                "front_national_id_image": profile.front_national_id_image.url if profile.front_national_id_image else None,
                "back_national_id_image": profile.back_national_id_image.url if profile.back_national_id_image else None,
                "is_active": profile.is_active,
                "hospital_id": str(profile.hospital_id) if profile.hospital_id else None,
                "enrolled_by_id": str(profile.enrolled_by_id) if profile.enrolled_by_id else None,
            }
        elif profile and role == Role.SOCIAL_WORKER:
            profile_data = {
                "id": str(profile.id),
                "national_id_number": profile.national_id_number,
                "front_national_id_image": profile.front_national_id_image.url if profile.front_national_id_image else None,
                "back_national_id_image": profile.back_national_id_image.url if profile.back_national_id_image else None,
                "is_approved": profile.is_approved,
                "organization": profile.organization,
                "region_assigned": profile.region_assigned,
                "enrolled_by_id": str(profile.enrolled_by_id) if profile.enrolled_by_id else None,
            }
        elif profile and role == Role.RECEPTIONIST:
            profile_data = {
                "id": str(profile.id),
                "national_id_number": profile.national_id_number,
                "front_national_id_image": profile.front_national_id_image.url if profile.front_national_id_image else None,
                "back_national_id_image": profile.back_national_id_image.url if profile.back_national_id_image else None,
                "is_active": profile.is_active,
                "hospital_id": str(profile.hospital_id) if profile.hospital_id else None,
                "enrolled_by_id": str(profile.enrolled_by_id) if profile.enrolled_by_id else None,
            }
        elif profile and role == Role.SYSTEM_ADMIN:
            profile_data = {"id": str(profile.id)}

        # Devices
        from accounts.models import UserDevice
        devices_qs = UserDevice.objects.filter(user=user_obj).order_by("-last_active")[:20]
        devices = [{
            "id": d.id,
            "device_name": d.device_name or "",
            "device_type": d.device_type or "",
            "browser": d.browser or "",
            "os": d.os or "",
            "ip_address": d.ip_address or "",
            "last_active": d.last_active,
            "is_trusted": d.is_trusted,
            "is_blocked": d.is_blocked,
            "created_at": d.created_at,
        } for d in devices_qs]

        # --- Role-specific data ---
        donor_stats = None
        campaigns_list = []
        recent_donations_list = []
        hospital_stats = None
        hospital_info = None
        hospital_receptionists = []
        social_worker_stats = None
        beneficiaries_list = []
        health_issues_list = []
        receptionist_stats = None
        submitted_claims_list = []
        system_admin_stats = None

        if role == Role.DONOR and profile:
            donor = profile
            total_raised = float(
                Donation.objects.filter(campaign__donor=donor, status="SUCCESS")
                .aggregate(s=Sum("net_amount"))["s"] or 0
            )
            my_campaigns = Campaign.objects.filter(donor=donor).count()
            contributors = Donation.objects.filter(
                campaign__donor=donor, status="SUCCESS"
            ).values("payment__phone_number").distinct().count()
            lives_impacted = HealthIssue.objects.filter(
                voucher__funding_records__campaign__donor=donor, status="RESOLVED"
            ).distinct().count()

            donor_stats = {
                "total_raised": total_raised,
                "my_campaigns": my_campaigns,
                "contributors": contributors,
                "lives_impacted": lives_impacted,
            }

            camp_qs = Campaign.objects.filter(donor=donor).order_by("-created_at")[:20]
            for c in camp_qs:
                campaigns_list.append({
                    "id": c.id,
                    "title": c.title,
                    "status": c.status,
                    "goal_amount": float(c.goal_amount),
                    "current_amount": float(c.current_amount),
                    "progress_percentage": c.progress_percentage,
                    "created_at": c.created_at,
                })

            don_qs = Donation.objects.filter(campaign__donor=donor).select_related("campaign").order_by("-created_at")[:20]
            for d in don_qs:
                recent_donations_list.append({
                    "id": d.id,
                    "campaign_title": d.campaign.title if d.campaign else "",
                    "amount": float(d.amount),
                    "net_amount": float(d.net_amount),
                    "status": d.status,
                    "donor_name": d.donor_name or "Anonymous",
                    "created_at": d.created_at,
                })

        elif role == Role.HOSPITAL_ADMIN and profile:
            hospital = profile.hospital
            if hospital:
                redeemed = Voucher.objects.filter(hospital=hospital, status=Voucher.Status.USED).count()
                issued = Voucher.objects.filter(hospital=hospital).count()
                total_claims = MedicalClaim.objects.filter(hospital=hospital).count()
                pending_claims = MedicalClaim.objects.filter(hospital=hospital, claim_status="PENDING").count()
                staff_count = (
                    HospitalAdmin.objects.filter(hospital=hospital, is_active=True).count()
                    + Receptionist.objects.filter(hospital=hospital).count()
                )
                hospital_stats = {
                    "redeemed_vouchers": redeemed,
                    "issued_vouchers": issued,
                    "total_claims": total_claims,
                    "pending_claims": pending_claims,
                    "number_of_staff": staff_count,
                }
                hospital_info = {
                    "id": str(hospital.id),
                    "name": hospital.name,
                    "city": hospital.city,
                    "partnership_status": hospital.partnership_status,
                }

                recs = Receptionist.objects.filter(hospital=hospital).select_related("user")[:20]
                for rec in recs:
                    hospital_receptionists.append({
                        "id": str(rec.id),
                        "first_name": rec.user.first_name,
                        "last_name": rec.user.last_name,
                        "email": rec.user.email,
                        "is_active": rec.is_active,
                        "hospital_name": hospital.name,
                    })
            else:
                hospital_stats = {
                    "redeemed_vouchers": 0, "issued_vouchers": 0,
                    "total_claims": 0, "pending_claims": 0, "number_of_staff": 0,
                }

        elif role == Role.SOCIAL_WORKER and profile:
            sw = profile
            enrolled = Beneficiary.objects.filter(enrolled_by=sw).count()
            awaiting_match = HealthIssue.objects.filter(
                social_worker=sw
            ).exclude(status__in=["ASSIGNED", "IN_TREATMENT", "RESOLVED"]).exclude(
                id__in=Voucher.objects.filter(health_issue__isnull=False).values_list("health_issue_id", flat=True)
            ).count()
            voucher_issued = Voucher.objects.filter(beneficiary__enrolled_by=sw).count()
            care_received = HealthIssue.objects.filter(social_worker=sw, status="RESOLVED").count()

            social_worker_stats = {
                "enrolled": enrolled,
                "awaiting_match": awaiting_match,
                "voucher_issued": voucher_issued,
                "care_received": care_received,
            }

            ben_qs = Beneficiary.objects.filter(enrolled_by=sw).order_by("-created_at")[:20]
            for b in ben_qs:
                beneficiaries_list.append({
                    "id": b.id,
                    "full_name": b.full_name,
                    "digital_health_id": b.digital_health_id,
                    "gender": b.gender,
                    "category": b.category,
                    "region": b.region,
                    "city": b.city,
                    "is_verified": b.is_verified,
                    "is_active": b.is_active,
                    "created_at": b.created_at,
                })

            hi_qs = HealthIssue.objects.filter(social_worker=sw).select_related("beneficiary").order_by("-created_at")[:20]
            for hi in hi_qs:
                health_issues_list.append({
                    "id": hi.id,
                    "category": hi.category,
                    "severity": hi.severity,
                    "status": hi.status,
                    "description": hi.description,
                    "beneficiary_name": hi.beneficiary.full_name if hi.beneficiary else "",
                    "created_at": hi.created_at,
                })

        elif role == Role.RECEPTIONIST and profile:
            rec = profile
            redeemed = Voucher.objects.filter(
                medical_claim__submitted_by=rec, status=Voucher.Status.USED
            ).count()
            total_claims = MedicalClaim.objects.filter(submitted_by=rec).count()
            pending_claims = MedicalClaim.objects.filter(submitted_by=rec, claim_status="PENDING").count()
            approved_claims = MedicalClaim.objects.filter(submitted_by=rec, claim_status="APPROVED").count()
            rejected_claims = MedicalClaim.objects.filter(submitted_by=rec, claim_status="REJECTED").count()
            uploaded_proofs = MedicalClaimProof.objects.filter(uploaded_by=rec).count()

            receptionist_stats = {
                "redeemed_vouchers": redeemed,
                "total_medical_claims": total_claims,
                "pending_claims": pending_claims,
                "approved_claims": approved_claims,
                "rejected_claims": rejected_claims,
                "uploaded_proofs": uploaded_proofs,
            }

            claim_qs = MedicalClaim.objects.filter(submitted_by=rec).select_related("voucher", "hospital").order_by("-submitted_at")[:20]
            for mc in claim_qs:
                submitted_claims_list.append({
                    "id": mc.id,
                    "voucher_code": mc.voucher.voucher_code if mc.voucher else "",
                    "total_cost": float(mc.total_cost),
                    "claim_status": mc.claim_status,
                    "service_description": mc.service_description or "",
                    "hospital_name": mc.hospital.name if mc.hospital else "",
                    "submitted_at": mc.submitted_at,
                })

        elif role == Role.SYSTEM_ADMIN:
            sa = profile
            if sa:
                enrolled_admins = HospitalAdmin.objects.filter(enrolled_by=sa).count()
                enrolled_sw = SocialWorker.objects.filter(enrolled_by=sa).count()
                validated_hi = HealthIssue.objects.filter(validated_by=sa).count()
                reviewed_claims = MedicalClaim.objects.filter(reviewed_by=sa).count()
                system_admin_stats = {
                    "enrolled_admins": enrolled_admins,
                    "enrolled_social_workers": enrolled_sw,
                    "validated_health_issues": validated_hi,
                    "reviewed_claims": reviewed_claims,
                }
            else:
                system_admin_stats = {
                    "enrolled_admins": 0, "enrolled_social_workers": 0,
                    "validated_health_issues": 0, "reviewed_claims": 0,
                }

        data = {
            "user": user_data,
            "profile": profile_data,
            "devices": devices,
            "donor_stats": donor_stats,
            "campaigns": campaigns_list,
            "recent_donations": recent_donations_list,
            "hospital_stats": hospital_stats,
            "hospital_info": hospital_info,
            "hospital_receptionists": hospital_receptionists,
            "social_worker_stats": social_worker_stats,
            "beneficiaries": beneficiaries_list,
            "health_issues": health_issues_list,
            "receptionist_stats": receptionist_stats,
            "submitted_claims": submitted_claims_list,
            "system_admin_stats": system_admin_stats,
        }
        return Response(AdminUserDetailSerializer(data).data)
