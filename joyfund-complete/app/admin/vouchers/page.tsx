'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Search, Plus, X } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
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

export default function AdminVouchers() {
  const { showToast } = useStore();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, cRes] = await Promise.allSettled([
        authenticatedFetch('/api/vouchers/'),
        authenticatedFetch('/api/campaigns/'),
      ]);
      if (vRes.status === 'fulfilled') {
        const d = vRes.value;
        setVouchers(Array.isArray(d) ? d : d.results || []);
      }
      if (cRes.status === 'fulfilled') {
        const d = cRes.value;
        setCampaigns(Array.isArray(d) ? d : d.results || []);
      }
    } catch {
      showToast('Failed to load vouchers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = vouchers.filter(v => {
    const matchStatus = filter === 'all' || v.status === filter;
    const code = v.code || v.voucher_code || '';
    const ben = v.beneficiary_name || v.beneficiaryName || '';
    const matchSearch = code.toLowerCase().includes(search.toLowerCase()) ||
      ben.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleCreateFromCampaign = async () => {
    if (!campaignId) { showToast('Select a campaign', 'error'); return; }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/vouchers/create-from-campaigns/', {
        method: 'POST',
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      showToast('Voucher created from campaign', 'success');
      setShowCreate(false);
      setCampaignId('');
      load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to create voucher', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Voucher Management</h1>
          <p className="text-gray-500 text-sm">{vouchers.length} total vouchers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-admin text-sm flex items-center gap-2">
          <Plus size={16} /> Create Voucher
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by code or beneficiary..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
          {['all','generated','issued','redeemed','expired','void'].map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : statusLabel(s)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Code', 'Beneficiary', 'Amount', 'Created', 'Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No vouchers found</td>
                </tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono font-bold text-gray-900">{v.code || v.voucher_code || v.id}</td>
                  <td className="p-4 text-gray-700">{v.beneficiary_name || v.beneficiaryName || '—'}</td>
                  <td className="p-4 font-semibold" style={{ color: 'var(--primary)' }}>
                    {formatXAF(Number(v.amount ?? v.amountXAF ?? 0))}
                  </td>
                  <td className="p-4 text-gray-400 text-xs">
                    {v.created_at ? formatDate(v.created_at) : '—'}
                  </td>
                  <td className="p-4">
                    <span className={`badge ${statusColor(v.status || 'generated')}`}>
                      {statusLabel(v.status || 'generated')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create from Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Create Voucher from Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Select Campaign *</label>
              <select className="input-field" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
                <option value="">— Choose a campaign —</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.title || c.name} ({formatXAF(Number(c.current_amount ?? c.raisedXAF ?? 0))} raised)</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                className="flex-1 text-sm font-bold py-2.5 rounded-xl text-white"
                style={{ background: '#471DDB' }}
                onClick={handleCreateFromCampaign}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
