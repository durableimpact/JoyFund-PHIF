'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, Users, TrendingUp, ArrowUpRight, Building2, ClipboardCheck } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard',       href: '/hospital-admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Medical Claims',  href: '/hospital-admin/claims',    icon: <FileText size={16} /> },
  { label: 'Top-Up Requests', href: '/hospital-admin/top-up',    icon: <TrendingUp size={16} /> },
  { label: 'Staff',           href: '/hospital-admin/staff',     icon: <Users size={16} /> },
  { label: 'Transactions',    href: '/hospital-admin/transactions', icon: <TrendingUp size={16} /> },
];

export default function HospitalAdminDashboard() {
  const { currentUser, showToast } = useStore();
  const [profile, setProfile]     = useState<any>(null);
  const [claims, setClaims]       = useState<any[]>([]);
  const [topUps, setTopUps]       = useState<any[]>([]);
  const [staff, setStaff]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.allSettled([
      authenticatedFetch('/api/accounts/hospital-admin/info/'),
      authenticatedFetch('/api/hospitals/medical-claims/'),
      authenticatedFetch('/api/hospitals/voucher-top-up-requests/'),
      authenticatedFetch('/api/accounts/receptionists/'),
    ]).then(([pRes, cRes, tRes, sRes]) => {
      if (pRes.status === 'fulfilled') setProfile(pRes.value);
      if (cRes.status === 'fulfilled') setClaims(Array.isArray(cRes.value) ? cRes.value : cRes.value.results || []);
      if (tRes.status === 'fulfilled') setTopUps(Array.isArray(tRes.value) ? tRes.value : tRes.value.results || []);
      if (sRes.status === 'fulfilled') setStaff(Array.isArray(sRes.value) ? sRes.value : sRes.value.results || []);
    }).catch(() => showToast('Failed to load some data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const hospital = profile?.hospital_profile || profile?.hospital || null;
  const hospitalName = hospital?.name || currentUser?.name || 'My Hospital';

  const kpis = [
    { label: 'Total Claims',   value: claims.length,                                            color: 'var(--secondary)' },
    { label: 'Pending Claims', value: claims.filter(c => (c.claim_status || c.status) === 'PENDING').length, color: '#f59e0b' },
    { label: 'Top-Up Requests',value: topUps.length,                                            color: '#471DDB' },
    { label: 'Active Staff',   value: staff.length,                                             color: 'var(--success)' },
  ];

  return (
    <DashboardShell navItems={NAV} accentColor="#1D75DB" brandLabel="Hospital Admin" brandSub={hospitalName}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Hospital Dashboard</h1>
        {hospital && (
          <p className="text-gray-500 text-sm">
            {hospital.region && `${hospital.region} · `}
            {hospital.city && `${hospital.city} · `}
            {hospital.accreditation_number || ''}
          </p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="card p-5" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="text-2xl font-black mb-1" style={{ color: k.color }}>
              {loading ? <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-pulse" /> : k.value}
            </div>
            <div className="text-xs text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Claims */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Claims</h3>
            <Link href="/hospital-admin/claims" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--secondary)' }}>
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : claims.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-2">No claims submitted yet</p>
              <Link href="/hospital-admin/claims" className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>Submit First Claim</Link>
            </div>
          ) : claims.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-semibold text-sm text-gray-900">#{c.id?.toString().slice(-6)}</p>
                <p className="text-xs text-gray-400">{c.submitted_at ? formatDate(c.submitted_at) : c.created_at ? formatDate(c.created_at) : '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>{formatXAF(Number(c.total_cost ?? 0))}</p>
                <span className={`badge text-xs ${statusColor(c.claim_status || c.status || 'PENDING')}`}>
                  {statusLabel(c.claim_status || c.status || 'PENDING')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Top-Up Requests */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Top-Up Requests</h3>
            <Link href="/hospital-admin/top-up" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--secondary)' }}>
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : topUps.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-2">No top-up requests yet</p>
              <Link href="/hospital-admin/top-up" className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>Request Top-Up</Link>
            </div>
          ) : topUps.slice(0, 4).map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-semibold text-sm text-gray-900">{formatXAF(Number(r.amount ?? 0))}</p>
                <p className="text-xs text-gray-400 truncate max-w-[140px]">{r.reason || '—'}</p>
              </div>
              <span className={`badge text-xs ${statusColor(r.status || 'PENDING')}`}>{statusLabel(r.status || 'PENDING')}</span>
            </div>
          ))}
        </div>

        {/* Hospital Info */}
        {hospital && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 size={16} style={{ color: '#1D75DB' }} /> Hospital Info
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['Name', hospital.name],
                ['Accreditation', hospital.accreditation_number],
                ['Region', hospital.region],
                ['City', hospital.city],
                ['Phone', hospital.phone_number],
                ['Email', hospital.email],
              ].filter(([,v]) => v).map(([k,v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-right truncate max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff overview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Staff</h3>
            <Link href="/hospital-admin/staff" className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>Manage</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : staff.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No staff registered</p>
          ) : (
            <div className="space-y-2">
              {staff.slice(0, 4).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(s.first_name || s.user?.first_name || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-gray-900">
                      {s.first_name || s.user?.first_name} {s.last_name || s.user?.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{s.email || s.user?.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
