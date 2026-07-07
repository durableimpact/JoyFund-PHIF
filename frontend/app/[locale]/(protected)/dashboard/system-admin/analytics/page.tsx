"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from '@/locales/client';
import {
  Calendar,
  Download,
  TrendingUp,
  Users,
  Ticket,
  Building2,
  Activity,
  Wallet,
  Target,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  DollarSign,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { formatXAF } from "@/lib/utils";
import {
  getAdminComprehensiveAnalytics,
  getAdminUserRoleSummary,
} from "@/actions/accounts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

function GrowthBadge({
  indicator,
  isCurrency,
}: {
  indicator?: GrowthIndicator | FinancialGrowthIndicator;
  isCurrency?: boolean;
}) {
  const t = useI18n();
  if (!indicator) return null;
  const { change_percent, direction } = indicator;
  if (change_percent === null || change_percent === undefined) {
    return (
      <span className="text-xs text-gray-400 flex items-center gap-0.5">
        <Minus size={12} /> {t('systemAdmin.analytics.new')}
      </span>
    );
  }
  const color =
    direction === "up"
      ? "text-emerald-600"
      : direction === "down"
        ? "text-red-500"
        : "text-gray-400";
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : Minus;
  return (
    <span className={`text-xs font-semibold flex items-center gap-0.5 ${color}`}>
      <Icon size={12} />
      {isCurrency
        ? `${change_percent > 0 ? "+" : ""}${change_percent.toFixed(1)}%`
        : `${change_percent > 0 ? "+" : ""}${change_percent.toFixed(1)}%`}
    </span>
  );
}

export default function AdminAnalytics() {
  const t = useI18n();
  const { data: session } = useSession();
  const token =
    (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [period, setPeriod] = useState("month");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["aa-comprehensive", token, period],
    queryFn: async () =>
      await getAdminComprehensiveAnalytics(token, { period } as any),
    enabled: !!token,
  });

  const { data: roleSummary } = useQuery({
    queryKey: ["aa-role-summary", token],
    queryFn: async () => await getAdminUserRoleSummary(token),
    enabled: !!token,
  });

  const periodLabel =
    period === "day"
      ? t('systemAdmin.analytics.last7Days')
      : period === "week"
        ? t('systemAdmin.analytics.last7Days')
        : period === "year"
          ? t('systemAdmin.analytics.last365Days')
          : t('systemAdmin.analytics.last30Days');

  const exec = analytics?.executive_summary;
  const userGrowth = analytics?.user_growth;
  const donationAnalytics = analytics?.donation_analytics;
  const campaignPerf = analytics?.campaign_performance;
  const voucherAnalytics = analytics?.voucher_analytics;
  const financial = analytics?.financial_overview;
  const hospitalNetwork = analytics?.hospital_network;
  const dailyActivity = analytics?.daily_activity;

  const execKpis = [
    {
      label: t('systemAdmin.analytics.totalUsers'),
      value: exec?.total_users?.current ?? 0,
      icon: Users,
      color: "#471DDB",
      growth: exec?.total_users,
    },
    {
      label: t('systemAdmin.analytics.totalDonations'),
      value: formatXAF(exec?.total_donations?.current ?? 0),
      icon: TrendingUp,
      color: "#1DB1DB",
      growth: exec?.total_donations,
    },
    {
      label: t('systemAdmin.analytics.totalCampaigns'),
      value: exec?.total_campaigns?.current ?? 0,
      icon: Target,
      color: "#1CDBC9",
      growth: exec?.total_campaigns,
    },
    {
      label: t('systemAdmin.analytics.totalVouchers'),
      value: exec?.total_vouchers?.current ?? 0,
      icon: Ticket,
      color: "#f59e0b",
      growth: exec?.total_vouchers,
    },
    {
      label: t('systemAdmin.analytics.beneficiaries'),
      value: exec?.total_beneficiaries?.current ?? 0,
      icon: Heart,
      color: "#ef4444",
      growth: exec?.total_beneficiaries,
    },
    {
      label: t('systemAdmin.analytics.escrowBalance'),
      value: formatXAF(exec?.escrow_balance?.current ?? 0),
      icon: Wallet,
      color: "#8b5cf6",
      growth: undefined,
    },
  ];

  const donationChartData = (donationAnalytics?.donations_over_time ?? []).map((d) => ({
    date: d.date,
    amount: d.value,
  }));

  const userChartData = (userGrowth?.registrations_over_time ?? []).map(
    (r) => ({
      date: r.date,
      users: r.value,
    }),
  );

  const dailyData = (dailyActivity?.daily_breakdown ?? []).slice(-14);

  const campaignPieData = [
    { name: "Active", value: campaignPerf?.active_campaigns ?? 0, color: "#471DDB" },
    { name: "Funded", value: campaignPerf?.funded_campaigns ?? 0, color: "#1CDBC9" },
    { name: "Closed", value: campaignPerf?.closed_campaigns ?? 0, color: "#6b7280" },
  ].filter((d) => d.value > 0);

  const voucherChartData = (voucherAnalytics?.vouchers_over_time ?? []).map(
    (v) => ({
      date: v.date,
      vouchers: v.value,
    }),
  );

  const financialMonthly = (financial?.monthly_trends ?? []).map((m) => ({
    month: m.month,
    donations: m.donations_amount,
    disbursements: m.disbursements,
    fees: m.platform_fees,
  }));

  const hospitalChartData = (hospitalNetwork?.hospitals_over_time ?? []).map(
    (h) => ({
      date: h.date,
      hospitals: h.value,
    }),
  );

  const rolePieData = (roleSummary?.roles ?? [])
    .filter((r) => r.count > 0)
    .map((r) => ({
      name: r.label,
      value: r.count,
      color: r.color,
    }));

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {t('systemAdmin.analytics.title')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('systemAdmin.analytics.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Calendar size={14} className="text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="day">{t('systemAdmin.analytics.daily')}</option>
              <option value="week">{t('systemAdmin.analytics.weekly')}</option>
              <option value="month">{t('systemAdmin.analytics.monthly')}</option>
              <option value="year">{t('systemAdmin.analytics.yearly')}</option>
            </select>
          </div>
          <button
            className="btn-admin text-sm flex items-center gap-2"
            style={{ background: "#471DDB" }}
            onClick={() => alert(t('systemAdmin.analytics.exportComingSoon'))}
          >
            <Download size={16} /> {t('systemAdmin.analytics.export')}
          </button>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {execKpis.map((k) => (
          <div
            key={k.label}
            className="card p-4"
            style={{ borderTop: `3px solid ${k.color}` }}
          >
            <div className="flex items-start justify-between mb-1">
              <k.icon size={16} style={{ color: k.color }} />
              <GrowthBadge indicator={k.growth} />
            </div>
            <div
              className="text-xl font-black mt-1"
              style={{ color: k.color }}
            >
              {isLoading ? (
                <span className="inline-block w-12 h-5 bg-gray-100 rounded animate-pulse" />
              ) : (
                k.value
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: User Growth + Donation Trends */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* User Registrations */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">
              {t('systemAdmin.analytics.userRegistrations')} ({periodLabel})
            </h3>
            <GrowthBadge indicator={userGrowth?.total_users} />
          </div>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <ChartContainer
              config={{
                users: { label: t('systemAdmin.analytics.newUsers'), color: "#471DDB" },
              }}
              className="h-64 w-full aspect-auto"
            >
              <AreaChart
                data={userChartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="var(--color-users)"
                  fill="var(--color-users)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
          {/* Role breakdown mini cards */}
          {userGrowth && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: t('systemAdmin.analytics.donors'), data: userGrowth.donors, color: "#471DDB" },
                { label: t('systemAdmin.analytics.hospAdmins'), data: userGrowth.hospital_admins, color: "#1DB1DB" },
                { label: t('systemAdmin.analytics.socialWorkers'), data: userGrowth.social_workers, color: "#1CDBC9" },
              ].map((r) => (
                <div
                  key={r.label}
                  className="text-center p-2 rounded-lg bg-gray-50"
                >
                  <div className="text-xs text-gray-500">{r.label}</div>
                  <div className="text-sm font-bold" style={{ color: r.color }}>
                    {r.data?.current ?? 0}
                  </div>
                  <GrowthBadge indicator={r.data} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donation Trends */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">
              {t('systemAdmin.analytics.donationTrends')} ({periodLabel})
            </h3>
            <div className="text-right">
              <div className="text-xs text-gray-500">{t('systemAdmin.analytics.periodTotal')}</div>
              <div className="text-sm font-bold text-[#471DDB]">
                {dailyActivity?.summary?.donations_count ?? 0} {t('systemAdmin.analytics.donationsLower')}
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <ChartContainer
              config={{
                amount: { label: t('systemAdmin.analytics.donations'), color: "#471DDB" },
              }}
              className="h-64 w-full aspect-auto"
            >
              <BarChart
                data={donationChartData}
                margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => Number(value)} />
                  }
                />
                <Bar
                  dataKey="amount"
                  fill="var(--color-amount)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
          {/* Donation summary stats */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              {
                label: t('systemAdmin.analytics.amountRaised'),
                value: formatXAF(dailyActivity?.summary?.donations_amount ?? 0),
                color: "#471DDB",
              },
              {
                label: t('systemAdmin.analytics.platformFees'),
                value: formatXAF(dailyActivity?.summary?.platform_fees ?? 0),
                color: "#f59e0b",
              },
              {
                label: t('systemAdmin.analytics.avgDonation'),
                value: formatXAF(campaignPerf?.avg_donation ?? 0),
                color: "#1DB1DB",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="text-center p-2 rounded-lg bg-gray-50"
              >
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className="text-sm font-bold" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Daily Activity + Campaign Performance */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Activity */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">
            {t('systemAdmin.analytics.dailyActivity')}
          </h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : dailyData.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-16">
                {t('systemAdmin.analytics.noRecentActivity')}
              </p>
          ) : (
            <ChartContainer
              config={{
                users: { label: t('systemAdmin.analytics.users'), color: "#471DDB" },
                donations_count: { label: t('systemAdmin.analytics.donations'), color: "#1DB1DB" },
                vouchers_generated: { label: t('systemAdmin.analytics.vouchers'), color: "#1CDBC9" },
              }}
              className="h-64 w-full aspect-auto"
            >
              <LineChart
                data={dailyData}
                margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="new_users"
                  stroke="var(--color-users)"
                  strokeWidth={2}
                  dot={false}
                  name="users"
                />
                <Line
                  type="monotone"
                  dataKey="donations_count"
                  stroke="var(--color-donations_count)"
                  strokeWidth={2}
                  dot={false}
                  name="donations_count"
                />
                <Line
                  type="monotone"
                  dataKey="vouchers_generated"
                  stroke="var(--color-vouchers_generated)"
                  strokeWidth={2}
                  dot={false}
                  name="vouchers_generated"
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        {/* Campaign Performance */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('systemAdmin.analytics.campaignPerformance')}</h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-4">
              {/* Campaign stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: t('systemAdmin.analytics.totalCampaigns'),
                    value: campaignPerf?.total_campaigns ?? 0,
                    color: "#471DDB",
                  },
                  {
                    label: t('systemAdmin.analytics.active'),
                    value: campaignPerf?.active_campaigns ?? 0,
                    color: "#1DB1DB",
                  },
                  {
                    label: t('systemAdmin.analytics.funded'),
                    value: campaignPerf?.funded_campaigns ?? 0,
                    color: "#1CDBC9",
                  },
                  {
                    label: t('systemAdmin.analytics.completionRate'),
                    value: `${campaignPerf?.completion_rate ?? 0}%`,
                    color: "#f59e0b",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-3 rounded-xl bg-gray-50 text-center"
                  >
                    <div className="text-xs text-gray-500">{s.label}</div>
                    <div
                      className="text-lg font-black mt-1"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
              {/* Campaign pie chart */}
              {campaignPieData.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="w-32 h-32 flex-shrink-0">
                    <ChartContainer
                      config={{
                        Active: { label: t('systemAdmin.analytics.active'), color: "#471DDB" },
                        Funded: { label: t('systemAdmin.analytics.funded'), color: "#1CDBC9" },
                        Closed: { label: t('systemAdmin.analytics.closed'), color: "#6b7280" },
                      }}
                      className="h-full aspect-auto"
                    >
                      <PieChart>
                        <Pie
                          data={campaignPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {campaignPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {campaignPieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-xs text-gray-600">{d.name}</span>
                        <span className="text-xs font-bold ml-auto">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Fundraising progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{t('systemAdmin.analytics.totalRaisedPeriod')}</span>
                  <span className="font-bold text-[#471DDB]">
                    {formatXAF(campaignPerf?.total_raised ?? 0)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, campaignPerf?.completion_rate ?? 0)}%`,
                      background: "#471DDB",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Financial Overview + Voucher Analytics */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Overview */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('systemAdmin.analytics.financialOverview')}</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: t('systemAdmin.analytics.escrowBalance'),
                    value: financial?.summary?.escrow_balance ?? 0,
                    color: "#471DDB",
                    icon: Wallet,
                  },
                  {
                    label: t('systemAdmin.analytics.totalDonations'),
                    value: financial?.summary?.total_donations_received ?? 0,
                    color: "#1DB1DB",
                    icon: TrendingUp,
                  },
                  {
                    label: t('systemAdmin.analytics.disbursements'),
                    value: financial?.summary?.total_disbursements ?? 0,
                    color: "#1CDBC9",
                    icon: DollarSign,
                  },
                  {
                    label: t('systemAdmin.analytics.platformFeesCollect'),
                    value: financial?.summary?.platform_fees_collected ?? 0,
                    color: "#f59e0b",
                    icon: Percent,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-3 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon size={14} style={{ color: s.color }} />
                      <span className="text-xs text-gray-500">{s.label}</span>
                    </div>
                    <div
                      className="text-sm font-bold"
                      style={{ color: s.color }}
                    >
                      {formatXAF(s.value)}
                    </div>
                  </div>
                ))}
              </div>
              {/* Monthly financial trends */}
              {financialMonthly.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                    {t('systemAdmin.analytics.monthlyTrends')}
                  </h4>
                  <ChartContainer
                    config={{
                      donations: { label: t('systemAdmin.analytics.donations'), color: "#471DDB" },
                      disbursements: {
                        label: t('systemAdmin.analytics.disbursements'),
                        color: "#1CDBC9",
                      },
                      fees: { label: t('systemAdmin.analytics.fees'), color: "#f59e0b" },
                    }}
                    className="h-40 w-full aspect-auto"
                  >
                    <BarChart
                      data={financialMonthly}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="donations"
                        fill="var(--color-donations)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="disbursements"
                        fill="var(--color-disbursements)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="fees"
                        fill="var(--color-fees)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Voucher Analytics */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('systemAdmin.analytics.voucherAnalytics')}</h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-4">
              {/* Voucher KPIs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: t('systemAdmin.analytics.generated'),
                    current: voucherAnalytics?.total_generated?.current ?? 0,
                    growth: voucherAnalytics?.total_generated,
                    color: "#471DDB",
                  },
                  {
                    label: t('systemAdmin.analytics.redeemed'),
                    current: voucherAnalytics?.total_redeemed?.current ?? 0,
                    growth: voucherAnalytics?.total_redeemed,
                    color: "#1CDBC9",
                  },
                  {
                    label: t('systemAdmin.analytics.redemptionRate'),
                    current: `${voucherAnalytics?.redemption_rate ?? 0}%`,
                    growth: undefined,
                    color: "#f59e0b",
                  },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="text-center p-3 rounded-xl bg-gray-50"
                  >
                    <div className="text-xs text-gray-500">{v.label}</div>
                    <div
                      className="text-lg font-black mt-1"
                      style={{ color: v.color }}
                    >
                      {v.current}
                    </div>
                    <GrowthBadge indicator={v.growth} />
                  </div>
                ))}
              </div>
              {/* Voucher over time chart */}
              {voucherChartData.length > 0 && (
                <ChartContainer
                  config={{
                    vouchers: { label: t('systemAdmin.analytics.vouchers'), color: "#1CDBC9" },
                  }}
                  className="h-40 w-full aspect-auto"
                >
                  <AreaChart
                    data={voucherChartData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="vouchers"
                      stroke="var(--color-vouchers)"
                      fill="var(--color-vouchers)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
              {/* Top hospitals by vouchers */}
              {voucherAnalytics?.by_hospital &&
                voucherAnalytics.by_hospital.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                      {t('systemAdmin.analytics.topHospitalsByVouchers')}
                    </h4>
                    <div className="space-y-1.5">
                      {voucherAnalytics.by_hospital.slice(0, 4).map((h) => (
                        <div
                          key={h.hospital}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600 truncate">
                            {h.hospital}
                          </span>
                          <span className="font-bold text-gray-900 ml-2">
                            {h.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: User Role Distribution + Hospital Network */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* User Role Distribution */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">
            {t('systemAdmin.analytics.userRoleDistribution')}
          </h3>
          {rolePieData.length > 0 ? (
            <div className="flex items-center gap-8">
              <div className="w-56 h-56 flex-shrink-0">
                <ChartContainer
                  config={
                    Object.fromEntries(
                      rolePieData.map((d) => [
                        d.name,
                        { label: d.name, color: d.color },
                      ]),
                    )
                  }
                  className="h-full aspect-auto"
                >
                  <PieChart>
                    <Pie
                      data={rolePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {rolePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex-1 space-y-2">
                {rolePieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-sm text-gray-600 flex-1">
                      {d.name}
                    </span>
                    <span className="text-sm font-bold">{d.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{t('systemAdmin.analytics.totalUsers')}</span>
                    <span className="text-sm font-black text-[#471DDB]">
                      {roleSummary?.total_users ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
              <p className="text-gray-400 text-sm text-center py-8">
                {t('systemAdmin.analytics.noRoleData')}
              </p>
          )}
        </div>

        {/* Hospital Network */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('systemAdmin.analytics.hospitalNetwork')}</h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-4">
              {/* Hospital KPIs */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black text-[#471DDB]">
                    {hospitalNetwork?.total_hospitals?.current ?? 0}
                  </div>
                  <div className="text-xs text-gray-500">{t('systemAdmin.analytics.totalHospitals')}</div>
                  <GrowthBadge
                    indicator={hospitalNetwork?.total_hospitals}
                  />
                </div>
                <div className="flex-1">
                  {hospitalNetwork?.hospitals_by_status?.map((s) => (
                    <div key={s.status} className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 w-20">
                        {s.status}
                      </span>
                      <div className="flex-1 progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, ((hospitalNetwork?.total_hospitals?.current ?? 1) > 0 ? (s.count / (hospitalNetwork?.total_hospitals?.current ?? 1)) * 100 : 0))}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Hospital growth chart */}
              {hospitalChartData.length > 0 && (
                <ChartContainer
                  config={{
                    hospitals: { label: t('systemAdmin.analytics.hospitals'), color: "#1D38DB" },
                  }}
                  className="h-32 w-full aspect-auto"
                >
                  <BarChart
                    data={hospitalChartData}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="hospitals"
                      fill="var(--color-hospitals)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
              {/* Top hospitals */}
              {hospitalNetwork?.top_hospitals &&
                hospitalNetwork.top_hospitals.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                      {t('systemAdmin.analytics.topHospitals')}
                    </h4>
                    <div className="space-y-1.5">
                      {hospitalNetwork.top_hospitals.slice(0, 4).map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="text-gray-900 font-medium">
                              {h.name}
                            </span>
                            <span className="text-gray-400 text-xs ml-1">
                              {h.city}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#471DDB]">
                            {h.vouchers_redeemed} {t('systemAdmin.analytics.vouchersLabel')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
