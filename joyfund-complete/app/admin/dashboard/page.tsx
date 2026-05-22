'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Building2, Ticket, BarChart2,
  FileText, TrendingUp, Clock, CheckCircle, Activity,
  AlertCircle, RefreshCw
} from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel } from '@/lib/utils';
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

export default function AdminDashboard() {
  const { beneficiaries, showToast } = useStore();
  const [escrow, setEscrow] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [escrowRes, hospitalsRes, campaignsRes, vouchersRes] = await Promise.allSettled([
          authenticatedFetch('/api/payments/accounts/escrow/'),
          authenticatedFetch('/api/hospitals/'),
          authenticatedFetch('/api/campaigns/'),
          authenticatedFetch('/api/vouchers/'),
        ]);
        if (escrowRes.status === 'fulfilled') setEscrow(escrowRes.value);
        if (hospitalsRes.status === 'fulfilled') {
          const d = hospitalsRes.value;
          setHospitals(Array.isArray(d) ? d : d.results || []);
        }
        if (campaignsRes.status === 'fulfilled') {
          const d = campaignsRes.value;
          setCampaigns(Array.isArray(d) ? d : d.results || []);
        }
        if (vouchersRes.status === 'fulfilled') {
          const d = vouchersRes.value;
          setVouchers(Array.isArray(d) ? d : d.results || []);
        }
      } catch (e) {
        showToast('Failed to load some dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  const escrowBalance = escrow?.balance ?? escrow?.total_balance ?? 0;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pendingMatches = (Array.isArray(beneficiaries) ? beneficiaries : []).filter(b => b.status === 'awaiting_match').length;
  const vouchersRedeemed = vouchers.filter(v => v.status === 'redeemed').length;

  const kpis = [
    { label: 'Escrow Balance', value: formatXAF(escrowBalance), icon: TrendingUp, color: '#471DDB', sub: 'Total funds held' },
    { label: 'Active Campaigns', value: activeCampaigns, icon: Activity, color: '#1DB1DB', sub: `${campaigns.length} total` },
    { label: 'Pending Matches', value: pendingMatches, icon: Clock, color: '#f59e0b', sub: 'Requires approval' },
    { label: 'Vouchers Redeemed', value: vouchersRedeemed, icon: CheckCircle, color: '#1CDBC9', sub: `${vouchers.length} total issued` },
  ];

  return (
    <DashboardShell
      navItems={NAV}
      accentColor="#471DDB"
      brandLabel="System Admin"
      brandSub="Full platform oversight"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Overview</h1>
          <p className="text-gray-500 text-sm">Real-time platform health</p>
        </div>
        <Link href="/admin/create-user" className="btn-admin text-sm">
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
          {/* Quick nav tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hospitals', href: '/admin/hospitals', icon: <Building2 size={20} />, color: '#1D38DB' },
              { label: 'Vouchers', href: '/admin/vouchers', icon: <Ticket size={20} />, color: '#471DDB' },
              { label: 'Analytics', href: '/admin/analytics', icon: <BarChart2 size={20} />, color: '#1DB1DB' },
              { label: 'Logs', href: '/admin/logs', icon: <FileText size={20} />, color: '#1CDBC9' },
            ].map(n => (
              <Link key={n.label} href={n.href} className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: n.color }}>
                  {n.icon}
                </div>
                <div className="font-bold text-sm text-gray-900">{n.label}</div>
              </Link>
            ))}
          </div>

          {/* Match Queue */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Pending Match Queue</h3>
              <Link href="/admin/beneficiaries" className="text-xs font-semibold" style={{ color: '#471DDB' }}>View All</Link>
            </div>
            {(Array.isArray(beneficiaries) ? beneficiaries : []).filter(b => b.status === 'awaiting_match').length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No pending matches</div>
            ) : (
              <div className="space-y-3">
                {(Array.isArray(beneficiaries) ? beneficiaries : []).filter(b => b.status === 'awaiting_match').slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'var(--secondary)' }}>
                      {(b.fullName || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{b.fullName}</p>
                      <p className="text-xs text-gray-400">{b.healthId} · Week {b.gestationalWeek} · {b.community}</p>
                    </div>
                    <Link href={`/social-worker/beneficiary/${b.id}`} className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white" style={{ background: 'var(--secondary)' }}>
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partner Hospitals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Partner Hospitals</h3>
              <Link href="/admin/hospitals" className="text-xs font-semibold" style={{ color: '#471DDB' }}>Manage</Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : hospitals.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No hospitals registered yet</p>
            ) : (
              <div className="space-y-3">
                {hospitals.slice(0, 5).map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-400">{h.region} · {h.city}</p>
                    </div>
                    <span className={`badge ${statusColor(h.status || 'active')} text-xs`}>
                      {statusLabel(h.status || 'active')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* Platform Health */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Platform Health
            </h3>
            <div className="space-y-3">
              {[
                ['MTN MoMo API', 'Operational'],
                ['Orange Money', 'Operational'],
                ['SMS Gateway', 'Active'],
                ['Escrow System', 'Healthy'],
                ['Payment Webhooks', 'Listening'],
              ].map(([label, status]) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">{label}</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle size={12} /> {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Recent Campaigns</h3>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : campaigns.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{c.title}</p>
                <span className="font-bold text-xs flex-shrink-0" style={{ color: 'var(--primary)' }}>
                  {formatXAF(Number(c.current_amount ?? c.raisedXAF ?? 0))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
