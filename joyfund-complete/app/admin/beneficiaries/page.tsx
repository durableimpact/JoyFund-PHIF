'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { normalizeBeneficiaryResponse, statusColor, statusLabel } from '@/lib/utils';
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

export default function AdminBeneficiaries() {
  const { showToast } = useStore();
  const [bens, setBens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    authenticatedFetch('/api/beneficiaries/')
      .then(d => setBens((Array.isArray(d) ? d : d.results || []).map(normalizeBeneficiaryResponse)))
      .catch(() => showToast('Failed to load beneficiaries', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filtered = bens.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchSearch = (b.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.healthId || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.community || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statuses = ['all', 'awaiting_match', 'voucher_issued', 'care_received', 'pending', 'suspended'];

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">All Beneficiaries</h1>
        <p className="text-gray-500 text-sm">{bens.length} enrolled in the system</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by name, health ID, community..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : statusLabel(s)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Beneficiary', 'Health ID', 'Community', 'Age / Week', 'Enrolled', 'Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No beneficiaries found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(b.fullName || '?').charAt(0)}
                      </div>
                      <Link href={`/social-worker/beneficiary/${b.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {b.fullName}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600">{b.healthId || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">{b.community || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">Age {b.age} · Wk {b.gestationalWeek}</td>
                  <td className="p-4 text-gray-400 text-xs">{b.enrolledAt || '—'}</td>
                  <td className="p-4">
                    <span className={`badge ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
