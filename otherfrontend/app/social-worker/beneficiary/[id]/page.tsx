'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Calendar, Plus, Save, LayoutDashboard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { normalizeBeneficiaryResponse, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard',         href: '/social-worker/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Enroll Beneficiary',href: '/social-worker/enroll',    icon: <Plus size={16} /> },
];

const SEVERITY_COLORS: Record<string, string> = {
  MILD:     'bg-yellow-100 text-yellow-700',
  MODERATE: 'bg-orange-100 text-orange-700',
  SEVERE:   'bg-red-100 text-red-600',
  CRITICAL: 'bg-red-200 text-red-800',
};

export default function BeneficiaryProfile() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { beneficiaries, showToast } = useStore();

  const [b, setB]                   = useState<any>(null);
  const [healthIssues, setHIssues]  = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [note, setNote]             = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showHIForm, setShowHIForm] = useState(false);
  const [hiForm, setHIForm]         = useState({ description: '', severity: 'MODERATE' });
  const [submittingHI, setSubHI]    = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      authenticatedFetch(`/api/beneficiaries/${id}/`),
      authenticatedFetch(`/api/beneficiaries/health-issues/?beneficiary=${id}`),
    ]).then(([bRes, hiRes]) => {
      if (bRes.status === 'fulfilled') {
        const norm = normalizeBeneficiaryResponse(bRes.value);
        setB(norm);
        setNote(bRes.value.notes || '');
      } else {
        const local = beneficiaries.find(x => x.id === id);
        if (local) setB(local);
      }
      if (hiRes.status === 'fulfilled') {
        const all = Array.isArray(hiRes.value) ? hiRes.value : hiRes.value.results || [];
        setHIssues(all);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await authenticatedFetch(`/api/beneficiaries/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: note }),
      });
      showToast('Note saved', 'success');
    } catch { showToast('Failed to save note', 'error'); }
    finally { setSavingNote(false); }
  };

  const handleSubmitHI = async () => {
    if (!hiForm.description) { showToast('Description is required', 'error'); return; }
    setSubHI(true);
    try {
      const data = await authenticatedFetch('/api/beneficiaries/health-issues/', {
        method: 'POST',
        body: JSON.stringify({ beneficiary: id, description: hiForm.description, severity: hiForm.severity }),
      });
      setHIssues(p => [data, ...p]);
      setHIForm({ description: '', severity: 'MODERATE' });
      setShowHIForm(false);
      showToast('Health issue reported', 'success');
    } catch (e: any) { showToast(e?.message || 'Failed to report', 'error'); }
    finally { setSubHI(false); }
  };

  const handleHIAction = async (hiId: string, action: 'verify' | 'reject') => {
    setActionLoading(hiId + action);
    try {
      await authenticatedFetch(`/api/beneficiaries/health-issues/${hiId}/${action}/`, { method: 'POST' });
      setHIssues(p => p.map(h => h.id === hiId ? { ...h, status: action === 'verify' ? 'VALIDATED' : 'REJECTED' } : h));
      showToast(`Health issue ${action === 'verify' ? 'verified' : 'rejected'}`, 'success');
    } catch (e: any) { showToast(e?.message || `Failed to ${action}`, 'error'); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <DashboardShell navItems={NAV} accentColor="#1D38DB" brandLabel="Social Worker">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardShell>
  );

  if (!b) return (
    <DashboardShell navItems={NAV} accentColor="#1D38DB" brandLabel="Social Worker">
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Beneficiary not found</p>
        <button onClick={() => router.back()} className="btn-primary">Go Back</button>
      </div>
    </DashboardShell>
  );

  const timeline = [
    { label: 'Enrolled',            date: b.enrolledAt ? formatDate(b.enrolledAt) : '—', done: true },
    { label: 'Matched to Campaign', date: b.status !== 'awaiting_match' ? 'Completed' : 'Pending', done: b.status !== 'awaiting_match' },
    { label: 'Voucher Issued',      date: ['voucher_issued','VOUCHER_ISSUED','care_received','CARE_RECEIVED'].includes(b.status) ? 'Completed' : 'Pending', done: ['voucher_issued','VOUCHER_ISSUED','care_received','CARE_RECEIVED'].includes(b.status) },
    { label: 'Care Received',       date: ['care_received','CARE_RECEIVED'].includes(b.status) ? 'Completed' : 'Pending', done: ['care_received','CARE_RECEIVED'].includes(b.status) },
  ];

  return (
    <DashboardShell navItems={NAV} accentColor="#1D38DB" brandLabel="Social Worker" brandSub="Beneficiary management">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Caseload
      </button>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">
              {(b.fullName || '?').charAt(0)}
            </div>
            <h2 className="font-black text-gray-900 mb-1">{b.fullName}</h2>
            {b.healthId && b.healthId !== '—' && (
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-2" style={{ background: 'var(--secondary)' }}>
                {b.healthId}
              </div>
            )}
            <br />
            <span className={`badge ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
          </div>

          <div className="card p-5 space-y-3 text-sm">
            {b.phone && (
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400 flex-shrink-0" /><span className="text-gray-700">{b.phone}</span></div>
            )}
            <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400 flex-shrink-0" /><span className="text-gray-700">{b.community}{b.region ? `, ${b.region}` : ''}</span></div>
            <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400 flex-shrink-0" /><span className="text-gray-700">Age {b.age || '—'} · Category: {b.category || '—'}</span></div>
            {b.address && <div className="text-gray-500 text-xs mt-1">{b.address}</div>}
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-5">
          {/* Timeline */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-5">Care Journey</h3>
            <div className="space-y-3">
              {timeline.map((t, i) => (
                <div key={t.label} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${t.done ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                    style={t.done ? { background: 'var(--success)' } : {}}>
                    {t.done ? '✓' : i + 1}
                  </div>
                  <div className={`flex-1 pb-3 ${i < timeline.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <p className={`font-semibold text-sm ${t.done ? 'text-gray-900' : 'text-gray-400'}`}>{t.label}</p>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health Issues */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Health Issues</h3>
              <button onClick={() => setShowHIForm(p => !p)} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl text-white" style={{ background: 'var(--secondary)' }}>
                <Plus size={13} /> Report Issue
              </button>
            </div>

            {showHIForm && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description *</label>
                  <input className="input-field text-sm" placeholder="e.g. Severe headache and high blood pressure"
                    value={hiForm.description} onChange={e => setHIForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Severity</label>
                  <select className="input-field" value={hiForm.severity} onChange={e => setHIForm(p => ({ ...p, severity: e.target.value }))}>
                    <option value="MILD">Mild</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                    <option value="CRITICAL">Critical / Life-Threatening</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline text-xs py-1.5 flex-1" onClick={() => setShowHIForm(false)}>Cancel</button>
                  <button className="text-xs py-1.5 flex-1 rounded-xl font-bold text-white disabled:opacity-60"
                    style={{ background: 'var(--secondary)' }} onClick={handleSubmitHI} disabled={submittingHI}>
                    {submittingHI ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            )}

            {healthIssues.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No health issues reported</p>
            ) : (
              <div className="space-y-3">
                {healthIssues.map(hi => (
                  <div key={hi.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm text-gray-800 font-medium">{hi.description}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`badge text-xs ${SEVERITY_COLORS[hi.severity] || 'bg-gray-100 text-gray-600'}`}>
                          {hi.severity}
                        </span>
                        <span className={`badge text-xs ${statusColor(hi.status || 'PENDING')}`}>
                          {statusLabel(hi.status || 'PENDING')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{hi.created_at ? formatDate(hi.created_at) : '—'}</p>
                      {hi.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline disabled:opacity-50"
                            onClick={() => handleHIAction(hi.id, 'verify')}
                            disabled={actionLoading === hi.id + 'verify'}
                          >
                            <CheckCircle size={12} /> Verify
                          </button>
                          <button
                            className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:underline disabled:opacity-50"
                            onClick={() => handleHIAction(hi.id, 'reject')}
                            disabled={actionLoading === hi.id + 'reject'}
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-3">Follow-up Notes</h3>
            <textarea className="input-field text-sm resize-none" rows={3}
              placeholder="Add a follow-up note for this patient..."
              value={note} onChange={e => setNote(e.target.value)} />
            <button className="flex items-center gap-2 text-sm py-2 px-4 rounded-xl font-bold text-white mt-3 disabled:opacity-60"
              style={{ background: 'var(--secondary)' }} onClick={handleSaveNote} disabled={savingNote}>
              <Save size={14} /> {savingNote ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
