'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Plus, Activity, Clock } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { normalizeBeneficiaryResponse, statusColor, statusLabel } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/social-worker/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Enroll Beneficiary', href: '/social-worker/enroll', icon: <Plus size={16} /> },
  { label: 'My Caseload', href: '/social-worker/dashboard', icon: <Users size={16} /> },
];

export default function SocialWorkerDashboard() {
  const { beneficiaries, loadInitialData, currentUser, showToast } = useStore();
  const set_bens = (bens: any[]) => useStore.setState({ beneficiaries: bens });

  useEffect(() => {
    // Load from backend first
    authenticatedFetch('/api/beneficiaries/')
      .then(d => {
        const raw = Array.isArray(d) ? d : d.results || [];
        const normalized = raw.map(normalizeBeneficiaryResponse);
        // Replace store beneficiaries with fresh backend data
        set_bens(normalized);
      })
      .catch(() => {
        loadInitialData?.();
      });
  }, []);

  const stats = [
    { label: 'Enrolled', value: beneficiaries.length, color: 'var(--primary)' },
    { label: 'Awaiting Match', value: beneficiaries.filter(b => b.status === 'awaiting_match').length, color: '#f59e0b' },
    { label: 'Voucher Issued', value: beneficiaries.filter(b => b.status === 'voucher_issued').length, color: 'var(--secondary)' },
    { label: 'Care Received', value: beneficiaries.filter(b => b.status === 'care_received').length, color: 'var(--success)' },
  ];

  return (
    <DashboardShell
      navItems={NAV}
      accentColor="#1D38DB"
      brandLabel="Social Worker"
      brandSub="Beneficiary management"
      headerExtra={
        <Link href="/social-worker/enroll" className="btn-primary text-sm flex items-center gap-2 py-2 px-4">
          <Plus size={14} /> Enroll Beneficiary
        </Link>
      }
    >
      <div className="mb-6">
        <p className="text-sm text-gray-500">Social Worker Portal</p>
        <h1 className="text-2xl font-black text-gray-900">
          Welcome, {(currentUser?.name || 'Social Worker').split(' ')[0]}
        </h1>
        <p className="text-xs text-gray-400 mt-1">Area: Yaoundé & Centre Region</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Caseload */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-gray-900">My Caseload</h2>
        <span className="text-xs text-gray-400">{beneficiaries.length} beneficiaries</span>
      </div>

      {beneficiaries.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-bold text-gray-700 mb-2">No beneficiaries enrolled yet</h3>
          <p className="text-gray-500 text-sm mb-4">Start by enrolling a vulnerable woman into the JoyFund system.</p>
          <Link href="/social-worker/enroll" className="btn-primary inline-flex">
            <Plus size={16} /> Enroll First Beneficiary
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {beneficiaries.map(b => (
            <Link
              key={b.id}
              href={`/social-worker/beneficiary/${b.id}`}
              className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {(b.fullName || '?').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">{b.fullName ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500">{b.healthId ?? 'N/A'} · {b.community ?? 'Unknown'} · Week {b.gestationalWeek ?? '0'}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="text-xs text-gray-400 hidden sm:block">{b.enrolledAt ?? ''}</p>
                <span className={`badge ${statusColor(b.status ?? 'pending')}`}>{statusLabel(b.status ?? 'pending')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
