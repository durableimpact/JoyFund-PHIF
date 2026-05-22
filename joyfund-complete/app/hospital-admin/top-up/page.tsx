'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Users, TrendingUp, Plus, X } from 'lucide-react';
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

export default function HospitalTopUp() {
  const { showToast } = useStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/api/hospitals/voucher-top-up-requests/');
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast('Failed to load top-up requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.amount || !form.reason) {
      showToast('Amount and reason are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/hospitals/voucher-top-up-requests/create/', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(form.amount), reason: form.reason }),
      });
      showToast('Top-up request submitted', 'success');
      setShowCreate(false);
      setForm({ amount: '', reason: '' });
      load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell navItems={NAV} accentColor="#1D75DB" brandLabel="Hospital Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Voucher Top-Up Requests</h1>
          <p className="text-gray-500 text-sm">Request additional voucher funds from the platform</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-secondary text-sm flex items-center gap-2">
          <Plus size={16} /> Request Top-Up
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Request ID', 'Amount', 'Reason', 'Date', 'Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : requests.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No top-up requests yet</td></tr>
              ) : requests.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs text-gray-700">#{r.id?.toString().slice(-8)}</td>
                  <td className="p-4 font-semibold" style={{ color: 'var(--secondary)' }}>
                    {formatXAF(Number(r.amount ?? 0))}
                  </td>
                  <td className="p-4 text-gray-600 max-w-xs truncate text-xs">{r.reason || '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{r.created_at ? formatDate(r.created_at) : '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(r.status || 'pending')}`}>{statusLabel(r.status || 'pending')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Request Voucher Top-Up</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount Requested (XAF) *</label>
                <input className="input-field" type="number" placeholder="e.g. 500000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Reason *</label>
                <textarea className="input-field" rows={3} placeholder="Explain why additional funds are needed..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-secondary flex-1" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
