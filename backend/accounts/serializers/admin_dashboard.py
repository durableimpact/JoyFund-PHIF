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
    total_campaigns = GrowthIndicatorSerializer()


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


# ---------------------------------------------------------------------------
# User Role Summary (for users page chart)
# ---------------------------------------------------------------------------

class UserRoleCountSerializer(serializers.Serializer):
    role = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()
    color = serializers.CharField()


class UserRoleSummarySerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    roles = UserRoleCountSerializer(many=True)


# ---------------------------------------------------------------------------
# Comprehensive Analytics Dashboard
# ---------------------------------------------------------------------------

class CampaignPerformanceSerializer(serializers.Serializer):
    total_campaigns = serializers.IntegerField()
    active_campaigns = serializers.IntegerField()
    funded_campaigns = serializers.IntegerField()
    closed_campaigns = serializers.IntegerField()
    total_raised = serializers.FloatField()
    avg_donation = serializers.FloatField()
    completion_rate = serializers.FloatField()
    campaigns_over_time = TrendEntrySerializer(many=True)


class VoucherAnalyticsSerializer(serializers.Serializer):
    total_generated = GrowthIndicatorSerializer()
    total_redeemed = GrowthIndicatorSerializer()
    redemption_rate = serializers.FloatField()
    vouchers_over_time = TrendEntrySerializer(many=True)
    by_hospital = serializers.ListField(child=serializers.DictField())


class HospitalNetworkSerializer(serializers.Serializer):
    total_hospitals = GrowthIndicatorSerializer()
    hospitals_by_status = serializers.ListField(child=serializers.DictField())
    top_hospitals = HospitalSummarySerializer(many=True)
    hospitals_over_time = TrendEntrySerializer(many=True)


class ComprehensiveAnalyticsSerializer(serializers.Serializer):
    executive_summary = OverviewKpiSerializer()
    user_growth = UserGrowthSerializer()
    donation_analytics = DonationTrendsSerializer()
    campaign_performance = CampaignPerformanceSerializer()
    voucher_analytics = VoucherAnalyticsSerializer()
    financial_overview = FinancialDashboardSerializer()
    hospital_network = HospitalNetworkSerializer()
    daily_activity = TrendsReportSerializer()


# ---------------------------------------------------------------------------
# Admin User Detail (comprehensive single-user view)
# ---------------------------------------------------------------------------

class AdminUserDeviceSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    device_name = serializers.CharField(allow_blank=True)
    device_type = serializers.CharField(allow_blank=True)
    browser = serializers.CharField(allow_blank=True)
    os = serializers.CharField(allow_blank=True)
    ip_address = serializers.CharField(allow_blank=True)
    last_active = serializers.DateTimeField(allow_null=True)
    is_trusted = serializers.BooleanField()
    is_blocked = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class AdminUserCampaignSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    title = serializers.CharField()
    status = serializers.CharField()
    goal_amount = serializers.FloatField()
    current_amount = serializers.FloatField()
    progress_percentage = serializers.FloatField()
    created_at = serializers.DateTimeField()


class AdminUserDonationSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    campaign_title = serializers.CharField()
    amount = serializers.FloatField()
    net_amount = serializers.FloatField()
    status = serializers.CharField()
    donor_name = serializers.CharField()
    created_at = serializers.DateTimeField()


class AdminUserBeneficiarySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    full_name = serializers.CharField()
    digital_health_id = serializers.CharField()
    gender = serializers.CharField()
    category = serializers.CharField()
    region = serializers.CharField()
    city = serializers.CharField()
    is_verified = serializers.BooleanField()
    is_active = serializers.BooleanField()
    created_at = serializers.DateTimeField()


class AdminUserHealthIssueSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    category = serializers.CharField()
    severity = serializers.CharField()
    status = serializers.CharField()
    description = serializers.CharField()
    beneficiary_name = serializers.CharField()
    created_at = serializers.DateField()


class AdminUserClaimSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    voucher_code = serializers.CharField()
    total_cost = serializers.FloatField()
    claim_status = serializers.CharField()
    service_description = serializers.CharField(allow_blank=True)
    hospital_name = serializers.CharField(allow_blank=True)
    submitted_at = serializers.DateTimeField()


class AdminUserReceptionistSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()
    is_active = serializers.BooleanField()
    hospital_name = serializers.CharField(allow_blank=True)


class AdminUserDetailSerializer(serializers.Serializer):
    # Common
    user = serializers.DictField()
    profile = serializers.DictField(allow_null=True)
    devices = AdminUserDeviceSerializer(many=True)

    # Donor
    donor_stats = serializers.DictField(allow_null=True)
    campaigns = AdminUserCampaignSerializer(many=True)
    recent_donations = AdminUserDonationSerializer(many=True)

    # Hospital Admin
    hospital_stats = serializers.DictField(allow_null=True)
    hospital_info = serializers.DictField(allow_null=True)
    hospital_receptionists = AdminUserReceptionistSerializer(many=True)

    # Social Worker
    social_worker_stats = serializers.DictField(allow_null=True)
    beneficiaries = AdminUserBeneficiarySerializer(many=True)
    health_issues = AdminUserHealthIssueSerializer(many=True)

    # Receptionist
    receptionist_stats = serializers.DictField(allow_null=True)
    submitted_claims = AdminUserClaimSerializer(many=True)

    # System Admin
    system_admin_stats = serializers.DictField(allow_null=True)
