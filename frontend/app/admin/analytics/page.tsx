'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Download, TrendingUp } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',    icon: <LayoutDashboard size={16} /> },
  { label: 'Hospitals',    href: '/admin/hospitals',    icon: <Building2 size={16} /> },
  { label: 'Vouchers',     href: '/admin/vouchers',     icon: <Ticket size={16} /> },
  { label: 'Beneficiaries',href: '/admin/beneficiaries',icon: <Users size={16} /> },
  { label: 'Analytics',    href: '/admin/analytics',    icon: <BarChart2 size={16} /> },
  { label: 'Logs',         href: '/admin/logs',         icon: <FileText size={16} /> },
  { label: 'Create User',  href: '/admin/create-user',  icon: <Users size={16} /> },
];

export default function AdminAnalytics() {
  const { showToast } = useStore();
  const [campaigns, setCampaigns]       = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [vouchers, setVouchers]         = useState<any[]>([]);
  const [hospitals, setHospitals]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.allSettled([
      authenticatedFetch('/api/campaigns/'),
      authenticatedFetch('/api/beneficiaries/'),
      authenticatedFetch('/api/vouchers/'),
      authenticatedFetch('/api/hospitals/'),
    ]).then(([cR, bR, vR, hR]) => {
      if (cR.status === 'fulfilled') setCampaigns(Array.isArray(cR.value) ? cR.value : cR.value.results || []);
      if (bR.status === 'fulfilled') setBeneficiaries(Array.isArray(bR.value) ? bR.value : bR.value.results || []);
      if (vR.status === 'fulfilled') setVouchers(Array.isArray(vR.value) ? vR.value : vR.value.results || []);
      if (hR.status === 'fulfilled') setHospitals(Array.isArray(hR.value) ? hR.value : hR.value.results || []);
    }).finally(() => setLoading(false));
  }, []);

  // Use correct backend field names
  const totalRaised = campaigns.reduce((s, c) => s + Number(c.current_amount ?? c.total_net_raised ?? 0), 0);
  const totalGoal   = campaigns.reduce((s, c) => s + Number(c.goal_amount ?? 0), 0);
  const vouchersUsed = vouchers.filter(v => v.status === 'USED').length;
  const activeHospitals = hospitals.filter(h => h.is_active !== false).length;

  const metrics = [
    { label: 'Total Raised',      value: formatXAF(totalRaised),  color: '#471DDB' },
    { label: 'Women Enrolled',    value: beneficiaries.length,     color: '#1DB1DB' },
    { label: 'Vouchers Redeemed', value: vouchersUsed,             color: '#1CDBC9' },
    { label: 'Partner Hospitals', value: activeHospitals,          color: '#1D38DB' },
  ];

  const leaderboard = [...campaigns]
    .sort((a, b) => Number(b.current_amount ?? b.total_net_raised ?? 0) - Number(a.current_amount ?? a.total_net_raised ?? 0))
    .slice(0, 8);

  // Regional breakdown from beneficiaries
  const regionCount: Record<string, number> = {};
  beneficiaries.forEach(b => {
    const r = b.region || b.city || 'Unknown';
    regionCount[r] = (regionCount[r] || 0) + 1;
  });
  const regions = Object.entries(regionCount)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / Math.max(beneficiaries.length, 1)) * 100) }));

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Impact Analytics</h1>
          <p className="text-gray-500 text-sm">Platform-wide metrics and fund transparency</p>
        </div>
        <button className="btn-admin text-sm flex items-center gap-2"
          onClick={() => showToast('Export feature coming soon', 'info')}>
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="card p-5" style={{ borderTop: `3px solid ${m.color}` }}>
            <div className="text-2xl font-black" style={{ color: m.color }}>
              {loading ? <span className="inline-block w-14 h-6 bg-gray-100 rounded animate-pulse" /> : m.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fund flow chart */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Fund Flow Overview</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Donated',   value: totalRaised,                 color: '#471DDB' },
              { label: 'Goal Target',     value: totalGoal,                   color: '#1DB1DB' },
              { label: 'Vouchers Issued', value: vouchers.length * 60000,     color: '#1CDBC9' },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-bold" style={{ color: row.color }}>{formatXAF(row.value)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, totalGoal > 0 ? Math.round(row.value / totalGoal * 100) : 0)}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Overall progress</span>
            <span className="font-bold" style={{ color: '#471DDB' }}>
              {totalGoal > 0 ? Math.round(totalRaised / totalGoal * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Regional breakdown */}
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

        {/* Campaigns leaderboard */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-4">Top Campaigns by Funds Raised</h3>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_,i)=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : leaderboard.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No campaigns found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['#','Campaign','Event Type','Raised','Goal','Contributors'].map(h=>(
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((c, i) => {
                    const raised = Number(c.current_amount ?? c.total_net_raised ?? 0);
                    const goal   = Number(c.goal_amount ?? 0);
                    const pct    = goal > 0 ? Math.min(Math.round(raised / goal * 100), 100) : 0;
                    return (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="py-3 font-black text-sm" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#94a3b8' }}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}
                        </td>
                        <td className="py-3 font-medium text-gray-900 max-w-[180px] truncate">{c.title}</td>
                        <td className="py-3 text-gray-500 capitalize text-xs">{c.event_type || '—'}</td>
                        <td className="py-3 font-bold" style={{ color: 'var(--primary)' }}>{formatXAF(raised)}</td>
                        <td className="py-3 text-gray-500 text-xs">
                          {formatXAF(goal)}
                          <span className="ml-1 text-emerald-600">({pct}%)</span>
                        </td>
                        <td className="py-3 text-gray-600">{c.contributors_count ?? c.contributors ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
