'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, Users, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/hospital-admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Medical Claims', href: '/hospital-admin/claims', icon: <FileText size={16} /> },
  { label: 'Top-Up Requests', href: '/hospital-admin/top-up', icon: <TrendingUp size={16} /> },
  { label: 'Staff', href: '/hospital-admin/staff', icon: <Users size={16} /> },
  { label: 'Transactions', href: '/hospital-admin/transactions', icon: <TrendingUp size={16} /> },
];

export default function HospitalAdminDashboard() {
  const { currentUser, showToast } = useStore();
  const [hospital, setHospital] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      authenticatedFetch('/api/hospitals/'),
      authenticatedFetch('/api/hospitals/medical-claims/'),  // list own hospital's claims
      authenticatedFetch('/api/hospitals/voucher-top-up-requests/'),
      authenticatedFetch('/api/accounts/receptionists/'),
    ]).then(([hRes, cRes, tRes, sRes]) => {
      if (hRes.status === 'fulfilled') {
        const arr = Array.isArray(hRes.value) ? hRes.value : hRes.value.results || [];
        if (arr.length > 0) setHospital(arr[0]);
      }
      if (cRes.status === 'fulfilled') setClaims(Array.isArray(cRes.value) ? cRes.value : cRes.value.results || []);
      if (tRes.status === 'fulfilled') setTopUpRequests(Array.isArray(tRes.value) ? tRes.value : tRes.value.results || []);
      if (sRes.status === 'fulfilled') setStaff(Array.isArray(sRes.value) ? sRes.value : sRes.value.results || []);
    }).catch(() => showToast('Failed to load some dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Medical Claims', value: claims.length, color: 'var(--secondary)', sub: 'Total submitted' },
    { label: 'Pending Claims', value: claims.filter(c => c.status === 'pending').length, color: '#f59e0b', sub: 'Awaiting review' },
    { label: 'Top-Up Requests', value: topUpRequests.length, color: '#471DDB', sub: 'Balance requests' },
    { label: 'Active Staff', value: staff.length, color: 'var(--success)', sub: 'Receptionists & nurses' },
  ];

  const hospitalName = hospital?.name || currentUser?.name || 'My Hospital';

  return (
    <DashboardShell
      navItems={NAV}
      accentColor="#1D75DB"
      brandLabel="Hospital Admin"
      brandSub={hospitalName}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Hospital Dashboard</h1>
        {hospital && (
          <p className="text-gray-500 text-sm">{hospital.region} · {hospital.city} · {hospital.accreditation_number || ''}</p>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="card p-5" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="text-2xl font-black mb-1" style={{ color: k.color }}>
              {loading ? <span className="inline-block w-10 h-6 bg-gray-100 rounded animate-pulse" /> : k.value}
            </div>
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Claims */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Medical Claims</h3>
            <Link href="/hospital-admin/claims" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--secondary)' }}>
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : claims.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No claims submitted yet</p>
          ) : claims.slice(0, 5).map(c => (
            <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-semibold text-sm text-gray-900">Claim #{c.id?.toString().slice(-6)}</p>
                <p className="text-xs text-gray-400">{c.created_at ? formatDate(c.created_at) : '—'}</p>
              </div>
              <span className={`badge ${statusColor(c.status || 'pending')}`}>{statusLabel(c.status || 'pending')}</span>
            </div>
          ))}
        </div>

        {/* Top-up Requests */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Voucher Top-Up Requests</h3>
            <Link href="/hospital-admin/top-up" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--secondary)' }}>
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : topUpRequests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-2">No top-up requests yet</p>
              <Link href="/hospital-admin/top-up" className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>
                Create Request
              </Link>
            </div>
          ) : topUpRequests.slice(0, 5).map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-semibold text-sm text-gray-900">{formatXAF(Number(r.amount ?? r.amountXAF ?? 0))}</p>
                <p className="text-xs text-gray-400">{r.created_at ? formatDate(r.created_at) : '—'}</p>
              </div>
              <span className={`badge ${statusColor(r.status || 'pending')}`}>{statusLabel(r.status || 'pending')}</span>
            </div>
          ))}
        </div>

        {/* Staff */}
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Staff Overview</h3>
            <Link href="/hospital-admin/staff" className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>Manage</Link>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : staff.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No staff members registered</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(s.first_name || s.name || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-gray-400">Receptionist</p>
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
