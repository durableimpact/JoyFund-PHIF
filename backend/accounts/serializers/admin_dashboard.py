from rest_framework import serializers


# ---------------------------------------------------------------------------
# Trend entry — reused across multiple dashboards
# ---------------------------------------------------------------------------

class TrendEntrySerializer(serializers.Serializer):
    date = serializers.DateField()
    value = serializers.IntegerField()


class FinancialTrendEntrySerializer(serializers.Serializer):
    date = serializers.DateField()
    value = serializers.FloatField()


# ---------------------------------------------------------------------------
# Growth indicator — current value + comparison to previous period
# ---------------------------------------------------------------------------

class GrowthIndicatorSerializer(serializers.Serializer):
    current = serializers.IntegerField()
    previous = serializers.IntegerField(default=0)
    change_percent = serializers.FloatField(allow_null=True)
    direction = serializers.ChoiceField(
        choices=["up", "down", "flat"],
        help_text="up = improving, down = declining, flat = no change",
    )


class FinancialGrowthIndicatorSerializer(serializers.Serializer):
    current = serializers.FloatField()
    previous = serializers.FloatField(default=0)
    change_percent = serializers.FloatField(allow_null=True)
    direction = serializers.ChoiceField(
        choices=["up", "down", "flat"],
    )


# ---------------------------------------------------------------------------
# Overview Dashboard
# ---------------------------------------------------------------------------

class OverviewKpiSerializer(serializers.Serializer):
    escrow_balance = GrowthIndicatorSerializer()
    total_donations = FinancialGrowthIndicatorSerializer()
    total_beneficiaries = GrowthIndicatorSerializer()
    total_vouchers = GrowthIndicatorSerializer()
    total_users = GrowthIndicatorSerializer()
    total_hospitals = GrowthIndicatorSerializer()


# ---------------------------------------------------------------------------
# Financial Dashboard
# ---------------------------------------------------------------------------

class FinancialSummarySerializer(serializers.Serializer):
    escrow_balance = serializers.FloatField()
    platform_fees_collected = serializers.FloatField()
    total_donations_received = serializers.FloatField()
    total_disbursements = serializers.FloatField()
    total_donations_count = serializers.IntegerField()


class FinancialMonthlySerializer(serializers.Serializer):
    month = serializers.DateField()
    donations_amount = serializers.FloatField()
    donations_count = serializers.IntegerField()
    platform_fees = serializers.FloatField()
    disbursements = serializers.FloatField()


class FinancialDashboardSerializer(serializers.Serializer):
    summary = FinancialSummarySerializer()
    monthly_trends = FinancialMonthlySerializer(many=True)


# ---------------------------------------------------------------------------
# Donation Trends Dashboard
# ---------------------------------------------------------------------------

class DonationTrendsSerializer(serializers.Serializer):
    donations_over_time = TrendEntrySerializer(many=True)
    donations_by_month = TrendEntrySerializer(many=True)


# ---------------------------------------------------------------------------
# User Analytics Dashboard
# ---------------------------------------------------------------------------

class UserGrowthSerializer(serializers.Serializer):
    total_users = GrowthIndicatorSerializer()
    donors = GrowthIndicatorSerializer()
    hospital_admins = GrowthIndicatorSerializer()
    receptionists = GrowthIndicatorSerializer()
    social_workers = GrowthIndicatorSerializer()
    system_admins = GrowthIndicatorSerializer()
    registrations_over_time = TrendEntrySerializer(many=True)


# ---------------------------------------------------------------------------
# Beneficiary & Voucher Dashboard
# ---------------------------------------------------------------------------

class BeneficiaryVoucherSerializer(serializers.Serializer):
    total_beneficiaries = GrowthIndicatorSerializer()
    total_vouchers_generated = GrowthIndicatorSerializer()
    total_vouchers_redeemed = GrowthIndicatorSerializer()
    vouchers_over_time = TrendEntrySerializer(many=True)
    beneficiaries_over_time = TrendEntrySerializer(many=True)


# ---------------------------------------------------------------------------
# Organization Dashboard
# ---------------------------------------------------------------------------

class HospitalSummarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    city = serializers.CharField()
    status = serializers.CharField()
    staff_count = serializers.IntegerField()
    vouchers_redeemed = serializers.IntegerField()


class OrganizationDashboardSerializer(serializers.Serializer):
    total_hospitals = GrowthIndicatorSerializer()
    total_hospital_admins = GrowthIndicatorSerializer()
    total_social_workers = GrowthIndicatorSerializer()
    total_receptionists = GrowthIndicatorSerializer()
    hospitals_by_status = serializers.ListField(
        child=serializers.DictField(),
        help_text="[{'status': 'ACTIVE', 'count': 12}, ...]"
    )
    top_hospitals = HospitalSummarySerializer(many=True)


# ---------------------------------------------------------------------------
# Trends & Reports Dashboard
# ---------------------------------------------------------------------------

class PeriodSummarySerializer(serializers.Serializer):
    new_users = serializers.IntegerField()
    new_beneficiaries = serializers.IntegerField()
    vouchers_generated = serializers.IntegerField()
    vouchers_redeemed = serializers.IntegerField()
    donations_count = serializers.IntegerField()
    donations_amount = serializers.FloatField()
    platform_fees = serializers.FloatField()


class TrendsReportSerializer(serializers.Serializer):
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    summary = PeriodSummarySerializer()
    user_registrations = TrendEntrySerializer(many=True)
    donations = FinancialTrendEntrySerializer(many=True)
    vouchers = TrendEntrySerializer(many=True)
    daily_breakdown = serializers.ListField(
        child=serializers.DictField(),
    )
