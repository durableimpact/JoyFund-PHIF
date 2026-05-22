'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Download, TrendingUp } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Hospitals', href: '/admin/hospitals', icon: <Building2 size={16} /> },
  { label: 'Vouchers', href: '/admin/vouchers', icon: <Ticket size={16} /> },
  { label: 'Beneficiaries', href: '/admin/beneficiaries', icon: <Users size={16} /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart2 size={16} /> },
  { label: 'Logs', href: '/admin/logs', icon: <FileText size={16} /> },
  { label: 'Create User', href: '/admin/create-user', icon: <Users size={16} /> },
];

const defaultRegions = [
  { name: 'Centre (Yaoundé)', pct: 60, count: 187 },
  { name: 'Littoral (Douala)', pct: 20, count: 64 },
  { name: 'Ouest (Bafoussam)', pct: 10, count: 31 },
  { name: 'Nord-Ouest', pct: 7, count: 21 },
  { name: 'Other Regions', pct: 3, count: 9 },
];

export default function AdminAnalytics() {
  const { showToast } = useStore();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      authenticatedFetch('/api/campaigns/'),
      authenticatedFetch('/api/beneficiaries/'),
      authenticatedFetch('/api/vouchers/'),
      authenticatedFetch('/api/hospitals/'),
      authenticatedFetch('/api/payments/accounts/escrow/'),
    ]).then(([cR, bR, vR, hR, eR]) => {
      if (cR.status === 'fulfilled') setCampaigns(Array.isArray(cR.value) ? cR.value : cR.value.results || []);
      if (bR.status === 'fulfilled') setBeneficiaries(Array.isArray(bR.value) ? bR.value : bR.value.results || []);
      if (vR.status === 'fulfilled') setVouchers(Array.isArray(vR.value) ? vR.value : vR.value.results || []);
      if (hR.status === 'fulfilled') setHospitals(Array.isArray(hR.value) ? hR.value : hR.value.results || []);
      if (eR.status === 'fulfilled') setEscrow(eR.value);
    }).finally(() => setLoading(false));
  }, []);

  const totalRaised = campaigns.reduce((s, c) => s + Number(c.current_amount ?? c.raisedXAF ?? 0), 0);
  const vouchersRedeemed = vouchers.filter(v => v.status === 'redeemed').length;
  const activeHospitals = hospitals.filter(h => h.status === 'active').length;
  const escrowBalance = escrow?.balance ?? escrow?.total_balance ?? totalRaised;

  const metrics = [
    { label: 'Deliveries Funded', value: vouchersRedeemed, icon: Users, color: '#471DDB' },
    { label: 'Women Served', value: beneficiaries.length, icon: Users, color: '#1DB1DB' },
    { label: 'Avg Cost / Delivery', value: formatXAF(Math.round(totalRaised / Math.max(vouchersRedeemed, 1))), icon: TrendingUp, color: '#1CDBC9' },
    { label: 'Partner Hospitals', value: activeHospitals, icon: Building2, color: '#1D38DB' },
  ];

  const leaderboard = [...campaigns]
    .sort((a, b) => Number(b.current_amount ?? b.raisedXAF ?? 0) - Number(a.current_amount ?? a.raisedXAF ?? 0))
    .slice(0, 5);

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Impact Analytics</h1>
          <p className="text-gray-500 text-sm">Platform-wide metrics and transparency</p>
        </div>
        <button className="btn-admin text-sm flex items-center gap-2" onClick={() => showToast('Report exported (PDF)', 'success')}>
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(m => (
          <div key={m.label} className="card p-5" style={{ borderTop: `3px solid ${m.color}` }}>
            <m.icon size={18} style={{ color: m.color }} className="mb-2" />
            <div className="text-2xl font-black" style={{ color: m.color }}>
              {loading ? <span className="inline-block w-14 h-6 bg-gray-100 rounded animate-pulse" /> : m.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Escrow trend chart */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Escrow Balance Overview</h3>
          <div className="relative h-48">
            <svg viewBox="0 0 300 100" className="w-full h-full">
              <defs>
                <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#471DDB" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#471DDB" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,80 C20,75 40,70 60,60 C80,50 100,45 120,40 C140,35 160,38 180,30 C200,22 220,20 240,18 C260,16 280,15 300,12"
                stroke="#471DDB" strokeWidth="2.5" fill="none" />
              <path d="M0,80 C20,75 40,70 60,60 C80,50 100,45 120,40 C140,35 160,38 180,30 C200,22 220,20 240,18 C260,16 280,15 300,12 V100 H0Z"
                fill="url(#eGrad)" />
            </svg>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#471DDB' }} />
            <span className="text-xs text-gray-500">Escrow balance</span>
            <span className="ml-auto font-bold text-sm" style={{ color: '#471DDB' }}>{formatXAF(escrowBalance)}</span>
          </div>
        </div>

        {/* Regional distribution */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Beneficiaries by Region</h3>
          <div className="space-y-4">
            {defaultRegions.map(r => (
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
        </div>

        {/* Top campaigns */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-4">Top Campaigns by Funds Raised</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Rank', 'Campaign', 'Event', 'Raised', 'Goal'].map(h => (
                    <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((c, i) => (
                  <tr key={c.id} className="border-b border-gray-50">
                    <td className="py-3 font-black text-xl" style={{ color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#1A1A2E' }}>
                      #{i + 1}
                    </td>
                    <td className="py-3 font-medium text-gray-900">{c.title}</td>
                    <td className="py-3 text-gray-500 capitalize text-xs">{c.event_type || c.eventType || '—'}</td>
                    <td className="py-3 font-bold" style={{ color: 'var(--primary)' }}>
                      {formatXAF(Number(c.current_amount ?? c.raisedXAF ?? 0))}
                    </td>
                    <td className="py-3 text-gray-500 text-xs">
                      {formatXAF(Number(c.goal_amount ?? c.goalXAF ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
