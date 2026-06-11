'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Building2,
  CheckCircle,
  FileText,
  Ticket,
  TrendingUp,
  Users
} from 'lucide-react';

















import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatXAF } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  getAdminOverview,
  getAdminOrganization,
  getAdminBeneficiaryVoucher,
  getAdminFinancial,
  getAdminDonationTrends,
  getAdminUserAnalytics,
} from '@/actions/accounts';
export default function AdminDashboard() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const { data: overview, isLoading: oLoading } = useQuery({
    queryKey: ['admin-overview', token],
    queryFn: async () => await getAdminOverview(token),
    enabled: !!token,
  });
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['admin-organization', token],
    queryFn: async () => await getAdminOrganization(token),
    enabled: !!token,
  });
  const { data: bv, isLoading: bvLoading } = useQuery({
    queryKey: ['admin-beneficiary-voucher', token],
    queryFn: async () => await getAdminBeneficiaryVoucher(token),
    enabled: !!token,
  });
  const { data: financial, isLoading: finLoading } = useQuery({
    queryKey: ['admin-financial', token],
    queryFn: async () => await getAdminFinancial(token),
    enabled: !!token,
  });
  const { data: trends, isLoading: trLoading } = useQuery({
    queryKey: ['admin-donation-trends', token],
    queryFn: async () => await getAdminDonationTrends(token),
    enabled: !!token,
  });
  const { data: userGrowth, isLoading: ugLoading } = useQuery({
    queryKey: ['admin-user-analytics', token],
    queryFn: async () => await getAdminUserAnalytics(token),
    enabled: !!token,
  });
  const loading = oLoading || orgLoading || bvLoading || finLoading || trLoading || ugLoading;
  const kpis = [
    { label: 'Total Donations',    value: formatXAF(overview?.total_donations?.current ?? 0), icon: TrendingUp,  color: '#471DDB', sub: 'All time' },
    { label: 'Total Campaigns',    value: overview?.total_campaigns?.current ?? 0,            icon: Activity,    color: '#1DB1DB', sub: 'All campaigns' },
    { label: 'Total Beneficiaries',value: overview?.total_beneficiaries?.current ?? 0,        icon: CheckCircle, color: '#1CDBC9', sub: 'Enrolled' },
    { label: 'Hospitals',          value: overview?.total_hospitals?.current ?? 0,            icon: Building2,   color: '#f59e0b', sub: 'Partner hospitals' },
  ];
  return (<>

    
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Overview</h1>
          <p className="text-gray-500 text-sm">Welcome, {currentUser?.first_name || 'Admin'}</p>
        </div>
        <Link href="/dashboard/system-admin/users/create" className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Users size={15} /> Create User
        </Link>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="card p-5" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="flex items-start justify-between mb-2">
              <k.icon size={18} style={{ color: k.color }} />
              <span className="text-xs text-gray-400">{k.sub}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: k.color }}>
              {loading ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" /> : k.value}
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
              { label: 'Hospitals',    href: '/dashboard/system-admin/hospitals',    icon: <Building2 size={20} />, color: '#1D38DB' },
              { label: 'Vouchers',     href: '/dashboard/system-admin/vouchers',     icon: <Ticket size={20} />,   color: '#471DDB' },
              { label: 'Beneficiaries',href: '/dashboard/system-admin/beneficiaries',icon: <Users size={20} />,    color: '#1DB1DB' },
              { label: 'Logs',         href: '/dashboard/system-admin/logs',         icon: <FileText size={20} />, color: '#1CDBC9' },
            ].map(n => (
              <Link key={n.label} href={n.href} className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: n.color }}>{n.icon}</div>
                <div className="font-bold text-sm text-gray-900">{n.label}</div>
              </Link>
            ))}
          </div>
          {/* Donation Trends Chart */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Donation Trends (Monthly)</h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : !trends?.donations_by_month?.length ? (
              <p className="text-gray-400 text-sm text-center py-12">No donation data yet</p>
            ) : (
              <ChartContainer
                config={{
                  amount: { label: 'Donations', color: '#471DDB' },
                }}
                className="h-64"
              >
                <BarChart data={trends.donations_by_month.map(d => ({ month: d.date, amount: d.value }))} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatXAF(Number(value))} />} />
                  <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
          {/* User Registrations Chart */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">User Registrations</h3>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : !userGrowth?.registrations_over_time?.length ? (
              <p className="text-gray-400 text-sm text-center py-12">No registration data yet</p>
            ) : (
              <ChartContainer
                config={{
                  users: { label: 'New Users', color: '#1DB1DB' },
                }}
                className="h-64"
              >
                <LineChart data={userGrowth.registrations_over_time.map(r => ({ date: r.date, users: r.value }))} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={false} />
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
                ['Total Campaigns',    overview?.total_campaigns?.current ?? 0],
                ['Total Donations',    overview?.total_donations?.current ?? 0],
                ['Total Beneficiaries',overview?.total_beneficiaries?.current ?? 0],
                ['Total Vouchers',     overview?.total_vouchers?.current ?? 0],
                ['Partner Hospitals',  overview?.total_hospitals?.current ?? 0],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold text-gray-900">{loading ? '…' : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Voucher & Beneficiary metrics */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Voucher & Beneficiary</h3>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <div className="space-y-3">
                {[
                  ['Total Beneficiaries',  bv?.total_beneficiaries?.current ?? 0],
                  ['Vouchers Generated',   bv?.total_vouchers_generated?.current ?? 0],
                  ['Vouchers Redeemed',    bv?.total_vouchers_redeemed?.current ?? 0],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Top hospitals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Top Hospitals</h3>
              <Link href="/dashboard/system-admin/hospitals" className="text-xs font-semibold" style={{ color: '#471DDB' }}>Manage</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : org?.top_hospitals?.slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{h.name}</p>
                  <p className="text-xs text-gray-400">{h.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  
  </>
);
}