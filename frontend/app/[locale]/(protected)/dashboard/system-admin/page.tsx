"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeftRight,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Globe,
  Percent,
  Receipt,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatXAF } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  getAdminOverview,
  getAdminOrganization,
  getAdminBeneficiaryVoucher,
  getAdminFinancial,
  getAdminDonationTrends,
  getAdminUserAnalytics,
} from "@/actions/accounts";
export default function AdminDashboard() {
  const { data: session } = useSession();
  const token =
    (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const [period, setPeriod] = useState("month");
  const periodLabel = period === "day" ? "Last 7 days" : period === "week" ? "Last 7 days" : period === "year" ? "Last 365 days" : "Last 30 days";
  const { data: overview, isLoading: oLoading } = useQuery({
    queryKey: ["admin-overview", token, period],
    queryFn: async () => await getAdminOverview(token, { period }),
    enabled: !!token,
  });
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["admin-organization", token],
    queryFn: async () => await getAdminOrganization(token),
    enabled: !!token,
  });
  const { data: bv, isLoading: bvLoading } = useQuery({
    queryKey: ["admin-beneficiary-voucher", token, period],
    queryFn: async () =>
      await getAdminBeneficiaryVoucher(token, { period } as any),
    enabled: !!token,
  });
  const { data: financial, isLoading: finLoading } = useQuery({
    queryKey: ["admin-financial", token],
    queryFn: async () => await getAdminFinancial(token),
    enabled: !!token,
  });
  const { data: trends, isLoading: trLoading } = useQuery({
    queryKey: ["admin-donation-trends", token, period],
    queryFn: async () => await getAdminDonationTrends(token, { period } as any),
    enabled: !!token,
  });
  const { data: userGrowth, isLoading: ugLoading } = useQuery({
    queryKey: ["admin-user-analytics", token, period],
    queryFn: async () => await getAdminUserAnalytics(token, { period } as any),
    enabled: !!token,
  });
  const loading =
    oLoading || orgLoading || bvLoading || finLoading || trLoading || ugLoading;
  const kpis = [
    {
      label: "Total Donations",
      value: formatXAF(overview?.total_donations?.current ?? 0),
      icon: TrendingUp,
      color: "#471DDB",
      sub: periodLabel,
    },
    {
      label: "Total Campaigns",
      value: overview?.total_campaigns?.current ?? 0,
      icon: Activity,
      color: "#1DB1DB",
      sub: periodLabel,
    },
    {
      label: "Total Beneficiaries",
      value: overview?.total_beneficiaries?.current ?? 0,
      icon: CheckCircle,
      color: "#1CDBC9",
      sub: periodLabel,
    },
    {
      label: "Hospitals",
      value: overview?.total_hospitals?.current ?? 0,
      icon: Building2,
      color: "#f59e0b",
      sub: periodLabel,
    },
  ];
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Overview</h1>
          <p className="text-gray-500 text-sm">
            Welcome, {currentUser?.first_name || "Admin"}
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
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <Link
            href="/dashboard/system-admin/users/create"
            className="btn-admin text-sm flex items-center gap-2"
            style={{ background: "#471DDB" }}
          >
            <Users size={15} /> Create User
          </Link>
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="card p-5"
            style={{ borderTop: `3px solid ${k.color}` }}
          >
            <div className="flex items-start justify-between mb-2">
              <k.icon size={18} style={{ color: k.color }} />
              <span className="text-xs text-gray-400">{k.sub}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: k.color }}>
              {loading ? (
                <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" />
              ) : (
                k.value
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Quick nav */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Accounts",
                href: "/dashboard/system-admin/accounts",
                icon: <Wallet size={20} />,
                color: "#471DDB",
              },
              {
                label: "Transactions",
                href: "/dashboard/system-admin/transactions",
                icon: <ArrowLeftRight size={20} />,
                color: "#1DB1DB",
              },
              {
                label: "Fee Splits",
                href: "/dashboard/system-admin/fee-splits",
                icon: <Percent size={20} />,
                color: "#1CDBC9",
              },
              {
                label: "Fee Policies",
                href: "/dashboard/system-admin/fee-policies",
                icon: <Receipt size={20} />,
                color: "#f59e0b",
              },
              {
                label: "Gateways",
                href: "/dashboard/system-admin/gateways",
                icon: <Globe size={20} />,
                color: "#1D38DB",
              },
              {
                label: "Hospitals",
                href: "/dashboard/system-admin/hospitals",
                icon: <Building2 size={20} />,
                color: "#1D38DB",
              },
              {
                label: "Vouchers",
                href: "/dashboard/system-admin/vouchers",
                icon: <Ticket size={20} />,
                color: "#471DDB",
              },
              {
                label: "Beneficiaries",
                href: "/dashboard/system-admin/beneficiaries",
                icon: <Users size={20} />,
                color: "#1DB1DB",
              },
              {
                label: "Logs",
                href: "/dashboard/system-admin/logs",
                icon: <FileText size={20} />,
                color: "#1CDBC9",
              },
            ].map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                  style={{ background: n.color }}
                >
                  {n.icon}
                </div>
                <div className="font-bold text-sm text-gray-900">{n.label}</div>
              </Link>
            ))}
          </div>
          {/* Donation Trends Chart */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              Donation Trends ({period === "day" ? "Last 7 Days" : period === "week" ? "Last 7 Days" : period === "year" ? "Last 365 Days" : "Last 30 Days"})
            </h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <ChartContainer
                config={{
                  amount: { label: "Donations", color: "#471DDB" },
                }}
                className="h-64 w-full aspect-auto"
              >
                <BarChart
                  data={(trends?.donations_over_time ?? []).map((d) => ({
                    date: d.date,
                    amount: d.value,
                  }))}
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
                      <ChartTooltipContent
                        formatter={(value) => Number(value)}
                      />
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
          </div>
          {/* User Registrations Chart */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              User Registrations ({period === "day" ? "Last 7 Days" : period === "week" ? "Last 7 Days" : period === "year" ? "Last 365 Days" : "Last 30 Days"})
            </h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
              <ChartContainer
                config={{
                  users: { label: "New Users", color: "#1DB1DB" },
                }}
                className="h-64 w-full aspect-auto"
              >
                <LineChart
                  data={(userGrowth?.registrations_over_time ?? []).map((r) => ({
                    date: r.date,
                    users: r.value,
                  }))}
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
                    dataKey="users"
                    stroke="var(--color-users)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>
        <div className="space-y-5">
          {/* Platform Summary */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Platform Summary</h3>
            <div className="space-y-3">
              {[
                ["Total Campaigns", overview?.total_campaigns?.current ?? 0],
                ["Total Donations", overview?.total_donations?.current ?? 0],
                [
                  "Total Beneficiaries",
                  overview?.total_beneficiaries?.current ?? 0,
                ],
                ["Total Vouchers", overview?.total_vouchers?.current ?? 0],
                ["Partner Hospitals", overview?.total_hospitals?.current ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold text-gray-900">
                    {loading ? "…" : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Voucher & Beneficiary metrics */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">
              Voucher & Beneficiary
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  [
                    "Total Beneficiaries",
                    bv?.total_beneficiaries?.current ?? 0,
                  ],
                  [
                    "Vouchers Generated",
                    bv?.total_vouchers_generated?.current ?? 0,
                  ],
                  [
                    "Vouchers Redeemed",
                    bv?.total_vouchers_redeemed?.current ?? 0,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold text-gray-900">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Top hospitals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Top Hospitals</h3>
              <Link
                href="/dashboard/system-admin/hospitals"
                className="text-xs font-semibold"
                style={{ color: "#471DDB" }}
              >
                Manage
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              org?.top_hospitals?.slice(0, 4).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {h.name}
                    </p>
                    <p className="text-xs text-gray-400">{h.city}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
