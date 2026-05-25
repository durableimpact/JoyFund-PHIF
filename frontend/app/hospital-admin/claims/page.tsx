'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Users, TrendingUp, Plus, X, Upload, CheckCircle, XCircle } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { statusColor, statusLabel, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/hospital-admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Medical Claims', href: '/hospital-admin/claims', icon: <FileText size={16} /> },
  { label: 'Top-Up Requests', href: '/hospital-admin/top-up', icon: <TrendingUp size={16} /> },
  { label: 'Staff', href: '/hospital-admin/staff', icon: <Users size={16} /> },
  { label: 'Transactions', href: '/hospital-admin/transactions', icon: <TrendingUp size={16} /> },
];

export default function HospitalClaims() {
  const { showToast } = useStore();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [claimForm, setClaimForm] = useState({ beneficiary: '', amount: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/api/hospitals/medical-claims/');
      setClaims(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast('Failed to load claims', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!claimForm.beneficiary || !claimForm.amount) {
      showToast('Beneficiary and amount are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/hospitals/medical-claims/', {
        method: 'POST',
        body: JSON.stringify({
          beneficiary: claimForm.beneficiary,
          amount: parseFloat(claimForm.amount),
          notes: claimForm.notes,
        }),
      });
      showToast('Medical claim submitted', 'success');
      setShowCreate(false);
      setClaimForm({ beneficiary: '', amount: '', notes: '' });
      load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to submit claim', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell navItems={NAV} accentColor="#1D75DB" brandLabel="Hospital Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Medical Claims</h1>
          <p className="text-gray-500 text-sm">{claims.length} claims submitted</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-secondary text-sm flex items-center gap-2">
          <Plus size={16} /> New Claim
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Claim ID', 'Beneficiary', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No claims yet</td></tr>
              ) : claims.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs text-gray-700">#{c.id?.toString().slice(-8)}</td>
                  <td className="p-4 text-gray-700">{c.beneficiary_name || c.beneficiary || '—'}</td>
                  <td className="p-4 font-semibold text-xs" style={{ color: 'var(--secondary)' }}>
                    {c.amount ? `${Number(c.amount).toLocaleString()} XAF` : '—'}
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{c.created_at ? formatDate(c.created_at) : '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(c.status || 'pending')}`}>{statusLabel(c.status || 'pending')}</span></td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedClaim(c)}
                      className="text-xs font-semibold"
                      style={{ color: 'var(--secondary)' }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Claim Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Submit Medical Claim</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Beneficiary ID or Name *</label>
                <input className="input-field" placeholder="e.g. BEN-0123 or patient name" value={claimForm.beneficiary} onChange={e => setClaimForm(p => ({ ...p, beneficiary: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (XAF) *</label>
                <input className="input-field" type="number" placeholder="e.g. 60000" value={claimForm.amount} onChange={e => setClaimForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
                <textarea className="input-field" rows={2} placeholder="Services provided..." value={claimForm.notes} onChange={e => setClaimForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-secondary flex-1" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Claim Detail</h2>
              <button onClick={() => setSelectedClaim(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Claim ID', `#${selectedClaim.id?.toString().slice(-8)}`],
                ['Beneficiary', selectedClaim.beneficiary_name || selectedClaim.beneficiary || '—'],
                ['Amount', selectedClaim.amount ? `${Number(selectedClaim.amount).toLocaleString()} XAF` : '—'],
                ['Date', selectedClaim.created_at ? formatDate(selectedClaim.created_at) : '—'],
                ['Status', statusLabel(selectedClaim.status || 'pending')],
                ['Notes', selectedClaim.notes || 'No notes'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900 text-right">{v}</span>
                </div>
              ))}
            </div>
            <button className="btn-outline w-full mt-5" onClick={() => setSelectedClaim(null)}>Close</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
