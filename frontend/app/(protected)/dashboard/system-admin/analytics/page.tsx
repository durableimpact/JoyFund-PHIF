'use client';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, Users, Ticket, Building2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatXAF } from '@/lib/utils';
import {
  getAdminOverview,
  getAdminFinancial,
  getAdminDonationTrends,
  getAdminBeneficiaryVoucher,
  getAdminTrendsReport,
} from '@/actions/accounts';
import { listBeneficiaries } from '@/actions/beneficiaries';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function AdminAnalytics() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: overview, isLoading: oLoading } = useQuery({
    queryKey: ['aa-overview', token],
    queryFn: async () => await getAdminOverview(token),
    enabled: !!token,
  });
  const { data: financial, isLoading: fLoading } = useQuery({
    queryKey: ['aa-financial', token],
    queryFn: async () => await getAdminFinancial(token),
    enabled: !!token,
  });
  const { data: trends, isLoading: tLoading } = useQuery({
    queryKey: ['aa-trends', token],
    queryFn: async () => await getAdminDonationTrends(token),
    enabled: !!token,
  });
  const { data: bv, isLoading: bLoading } = useQuery({
    queryKey: ['aa-bv', token],
    queryFn: async () => await getAdminBeneficiaryVoucher(token),
    enabled: !!token,
  });
  const { data: report, isLoading: rLoading } = useQuery({
    queryKey: ['aa-report', token],
    queryFn: async () => await getAdminTrendsReport(token),
    enabled: !!token,
  });
  const { data: beneficiariesData } = useQuery({
    queryKey: ['aa-beneficiaries', token],
    queryFn: async () => {
      const res = await listBeneficiaries(token, { page_size: '1000' });
      return res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token,
  });

  const loading = oLoading || fLoading || tLoading || bLoading || rLoading;
  const beneficiaries: Beneficiary[] = beneficiariesData?.results || [];

  const totalRaised = financial?.summary?.total_donations_received ?? 0;
  const totalBeneficiaries = bv?.total_beneficiaries?.current ?? 0;
  const vouchersRedeemed = bv?.total_vouchers_redeemed?.current ?? 0;
  const partnerHospitals = overview?.total_hospitals?.current ?? 0;

  const metrics = [
    { label: 'Total Raised',      value: formatXAF(totalRaised),      icon: TrendingUp,  color: '#471DDB' },
    { label: 'Women Enrolled',    value: totalBeneficiaries,           icon: Users,       color: '#1DB1DB' },
    { label: 'Vouchers Redeemed', value: vouchersRedeemed,             icon: Ticket,      color: '#1CDBC9' },
    { label: 'Partner Hospitals', value: partnerHospitals,             icon: Building2,   color: '#1D38DB' },
  ];

  const regionCount: Record<string, number> = {};
  beneficiaries.forEach(b => {
    const r = b.region || b.city || 'Unknown';
    regionCount[r] = (regionCount[r] || 0) + 1;
  });
  const regions = Object.entries(regionCount)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(beneficiaries.length, 1)) * 100) }));

  const donationChartData = trends?.donations_by_month?.map(d => ({
    month: d.date,
    amount: d.value,
  })) ?? [];

  const dailyData = report?.daily_breakdown?.slice(-14) ?? [];

  return (<>

    
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Impact Analytics</h1>
          <p className="text-gray-500 text-sm">Platform-wide metrics and fund transparency</p>
        </div>
        <button className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}
          onClick={() => alert('Export feature coming soon')}>
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="card p-5" style={{ borderTop: `3px solid ${m.color}` }}>
            <div className="flex items-start justify-between mb-2">
              <m.icon size={18} style={{ color: m.color }} />
            </div>
            <div className="text-2xl font-black" style={{ color: m.color }}>
              {loading ? <span className="inline-block w-14 h-6 bg-gray-100 rounded animate-pulse" /> : m.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Donation Trends Chart */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Donation Trends (Monthly)</h3>
          {loading ? (
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ) : donationChartData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No donation data yet</p>
          ) : (
            <ChartContainer
              config={{
                amount: { label: 'Donations', color: '#471DDB' },
              }}
              className="h-64"
            >
              <BarChart data={donationChartData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatXAF(Number(value))} />} />
                <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        {/* Daily Activity Chart */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Daily Activity (Last 14 Days)</h3>
          {loading ? (
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ) : dailyData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">No recent activity</p>
          ) : (
            <ChartContainer
              config={{
                users:     { label: 'Users',     color: '#471DDB' },
                donations: { label: 'Donations',  color: '#1DB1DB' },
                vouchers:  { label: 'Vouchers',   color: '#1CDBC9' },
              }}
              className="h-64"
            >
              <LineChart data={dailyData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="users"     stroke="var(--color-users)"     strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="donations"  stroke="var(--color-donations)"  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="vouchers"  stroke="var(--color-vouchers)"  strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        {/* Fund Flow */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Fund Flow Overview</h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Total Donations Received', value: financial?.summary?.total_donations_received ?? 0, color: '#471DDB' },
                { label: 'Escrow Balance',           value: financial?.summary?.escrow_balance ?? 0,          color: '#1DB1DB' },
                { label: 'Total Disbursements',       value: financial?.summary?.total_disbursements ?? 0,     color: '#1CDBC9' },
                { label: 'Platform Fees Collected',   value: financial?.summary?.platform_fees_collected ?? 0, color: '#f59e0b' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-bold" style={{ color: row.color }}>{formatXAF(row.value)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, totalRaised > 0 ? Math.round(row.value / totalRaised * 100) : 0)}%`, background: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Beneficiaries by Region */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Beneficiaries by Region</h3>
          {regions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No regional data available</p>
          ) : (
            <div className="space-y-4">
              {regions.map(r => (
                <div key={r.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{r.name}</span>
                    <span className="font-semibold text-gray-900">{r.count} · {r.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  
  </>
);
}
