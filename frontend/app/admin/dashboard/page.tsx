'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, TrendingUp, Clock, CheckCircle, Activity } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, normalizeBeneficiaryResponse } from '@/lib/utils';
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

export default function AdminDashboard() {
  const { currentUser, showToast } = useStore();
  const [beneficiaries, setBens] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [vouchers, setVouchers]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.allSettled([
      authenticatedFetch('/api/beneficiaries/'),
      authenticatedFetch('/api/campaigns/'),
      authenticatedFetch('/api/hospitals/'),
      authenticatedFetch('/api/vouchers/'),
    ]).then(([bRes, cRes, hRes, vRes]) => {
      if (bRes.status === 'fulfilled') setBens((Array.isArray(bRes.value) ? bRes.value : bRes.value.results || []).map(normalizeBeneficiaryResponse));
      if (cRes.status === 'fulfilled') setCampaigns(Array.isArray(cRes.value) ? cRes.value : cRes.value.results || []);
      if (hRes.status === 'fulfilled') setHospitals(Array.isArray(hRes.value) ? hRes.value : hRes.value.results || []);
      if (vRes.status === 'fulfilled') setVouchers(Array.isArray(vRes.value) ? vRes.value : vRes.value.results || []);
    }).catch(() => showToast('Failed to load some dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Correct field names from backend
  const totalRaised = campaigns.reduce((s, c) => s + Number(c.current_amount ?? c.total_net_raised ?? 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const pendingBens = beneficiaries.filter(b => b.status === 'awaiting_match' || b.status === 'AWAITING_MATCH').length;
  const vouchersUsed = vouchers.filter(v => v.status === 'USED').length;

  const kpis = [
    { label: 'Total Raised',       value: formatXAF(totalRaised), icon: TrendingUp,  color: '#471DDB', sub: 'Across all campaigns' },
    { label: 'Active Campaigns',   value: activeCampaigns,        icon: Activity,    color: '#1DB1DB', sub: `${campaigns.length} total` },
    { label: 'Pending Matches',    value: pendingBens,            icon: Clock,       color: '#f59e0b', sub: 'Awaiting voucher' },
    { label: 'Vouchers Redeemed',  value: vouchersUsed,           icon: CheckCircle, color: '#1CDBC9', sub: `${vouchers.length} total issued` },
  ];

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Overview</h1>
          <p className="text-gray-500 text-sm">Welcome, {currentUser?.name?.split(' ')[0] || 'Admin'}</p>
        </div>
        <Link href="/admin/create-user" className="btn-admin text-sm flex items-center gap-2">
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
              { label: 'Hospitals',    href: '/admin/hospitals',    icon: <Building2 size={20} />, color: '#1D38DB' },
              { label: 'Vouchers',     href: '/admin/vouchers',     icon: <Ticket size={20} />,   color: '#471DDB' },
              { label: 'Analytics',   href: '/admin/analytics',    icon: <BarChart2 size={20} />, color: '#1DB1DB' },
              { label: 'Logs',         href: '/admin/logs',         icon: <FileText size={20} />, color: '#1CDBC9' },
            ].map(n => (
              <Link key={n.label} href={n.href} className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: n.color }}>{n.icon}</div>
                <div className="font-bold text-sm text-gray-900">{n.label}</div>
              </Link>
            ))}
          </div>

          {/* Pending beneficiaries */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Pending Match Queue</h3>
              <Link href="/admin/beneficiaries" className="text-xs font-semibold" style={{ color: '#471DDB' }}>View All</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : beneficiaries.filter(b => ['awaiting_match','AWAITING_MATCH'].includes(b.status)).length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No beneficiaries awaiting match</div>
            ) : beneficiaries.filter(b => ['awaiting_match','AWAITING_MATCH'].includes(b.status)).slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2 last:mb-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'var(--secondary)' }}>
                  {(b.fullName || '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{b.fullName}</p>
                  <p className="text-xs text-gray-400">{b.healthId} · {b.community}</p>
                </div>
                <span className={`badge text-xs ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
              </div>
            ))}
          </div>

          {/* Recent campaigns */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Campaigns</h3>
              <Link href="/explore" className="text-xs font-semibold" style={{ color: '#471DDB' }}>Explore</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : campaigns.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{c.title}</p>
                <span className="font-bold text-xs flex-shrink-0" style={{ color: 'var(--primary)' }}>
                  {formatXAF(Number(c.current_amount ?? c.total_net_raised ?? 0))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {/* Summary stats */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Platform Summary</h3>
            <div className="space-y-3">
              {[
                ['Total Campaigns',    campaigns.length],
                ['Active Campaigns',   activeCampaigns],
                ['Total Beneficiaries',beneficiaries.length],
                ['Total Vouchers',     vouchers.length],
                ['Partner Hospitals',  hospitals.length],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold text-gray-900">{loading ? '…' : value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Partner hospitals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Partner Hospitals</h3>
              <Link href="/admin/hospitals" className="text-xs font-semibold" style={{ color: '#471DDB' }}>Manage</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : hospitals.slice(0, 4).map(h => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{h.name}</p>
                  <p className="text-xs text-gray-400">{h.city}, {h.region}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
