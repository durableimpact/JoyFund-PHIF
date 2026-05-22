'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Calendar, Plus, Save, LayoutDashboard, Users } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { normalizeBeneficiaryResponse, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/social-worker/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Enroll Beneficiary', href: '/social-worker/enroll', icon: <Plus size={16} /> },
  { label: 'My Caseload', href: '/social-worker/dashboard', icon: <Users size={16} /> },
];

export default function BeneficiaryProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { beneficiaries, showToast } = useStore();
  const [b, setB] = useState<any>(null);
  const [healthIssues, setHealthIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showHIForm, setShowHIForm] = useState(false);
  const [hiForm, setHIForm] = useState({ description: '', severity: 'MODERATE' });
  const [submittingHI, setSubmittingHI] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      authenticatedFetch(`/api/beneficiaries/${id}/`),
      authenticatedFetch('/api/beneficiaries/health-issues/'),
    ]).then(([bRes, hiRes]) => {
      if (bRes.status === 'fulfilled') {
        setB(normalizeBeneficiaryResponse(bRes.value));
        setNote(bRes.value.notes || '');
      } else {
        const local = beneficiaries.find(x => x.id === id);
        if (local) setB(local);
      }
      if (hiRes.status === 'fulfilled') {
        const all = Array.isArray(hiRes.value) ? hiRes.value : hiRes.value.results || [];
        setHealthIssues(all.filter((h: any) => h.beneficiary === id || h.beneficiary_id === id));
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
    } catch {
      showToast('Failed to save note', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSubmitHI = async () => {
    if (!hiForm.description) { showToast('Description is required', 'error'); return; }
    setSubmittingHI(true);
    try {
      const data = await authenticatedFetch('/api/beneficiaries/health-issues/', {
        method: 'POST',
        body: JSON.stringify({ beneficiary: id, description: hiForm.description, severity: hiForm.severity }),
      });
      setHealthIssues(p => [data, ...p]);
      setHIForm({ description: '', severity: 'MODERATE' });
      setShowHIForm(false);
      showToast('Health issue reported', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to report health issue', 'error');
    } finally {
      setSubmittingHI(false);
    }
  };

  if (loading) return (
    <DashboardShell navItems={NAV} accentColor="#1D38DB" brandLabel="Social Worker">
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading beneficiary profile…</div>
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
    { label: 'Enrolled', date: b.enrolledAt ? formatDate(b.enrolledAt) : '—', done: true },
    { label: 'Matched to Campaign', date: b.status !== 'awaiting_match' ? 'Completed' : 'Pending', done: b.status !== 'awaiting_match' },
    { label: 'Voucher Issued', date: b.status === 'voucher_issued' || b.status === 'care_received' ? 'Completed' : 'Pending', done: b.status === 'voucher_issued' || b.status === 'care_received' },
    { label: 'Care Received', date: b.status === 'care_received' ? 'Completed' : 'Pending', done: b.status === 'care_received' },
  ];

  return (
    <DashboardShell navItems={NAV} accentColor="#1D38DB" brandLabel="Social Worker" brandSub="Beneficiary management">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Caseload
      </button>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="md:col-span-1 space-y-4">
          <div className="card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">
              {b.fullName.charAt(0)}
            </div>
            <h2 className="font-black text-gray-900 mb-1">{b.fullName}</h2>
            <div className="inline-block px-4 py-1.5 rounded-full font-bold text-sm text-white mb-3" style={{ background: 'var(--secondary)' }}>
              {b.healthId || 'N/A'}
            </div>
            <br />
            <span className={`badge ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
          </div>

          <div className="card p-5 space-y-3">
            {b.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gray-400" />
                <span className="text-gray-700">{b.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-gray-400" />
              <span className="text-gray-700">{b.community || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-gray-700">Age {b.age || '—'} · Week {b.gestationalWeek || '—'}</span>
            </div>
            {b.complications && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Complications</p>
                <p className="text-sm text-gray-700">{b.complications}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-5">
          {/* Timeline */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-5">Care Journey Timeline</h3>
            <div className="space-y-4">
              {timeline.map((t, i) => (
                <div key={t.label} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold ${t.done ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                    style={t.done ? { background: 'var(--success)' } : {}}>
                    {t.done ? '✓' : i + 1}
                  </div>
                  <div className={`flex-1 pb-4 ${i < timeline.length - 1 ? 'border-b border-gray-100' : ''}`}>
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
              <button onClick={() => setShowHIForm(p => !p)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                <Plus size={13} /> Report Issue
              </button>
            </div>

            {showHIForm && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Description *</label>
                  <textarea
                    className="input-field text-sm"
                    rows={2}
                    placeholder="Describe the health issue..."
                    value={hiForm.description}
                    onChange={e => setHIForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Severity</label>
                  <select className="input-field" value={hiForm.severity} onChange={e => setHIForm(p => ({ ...p, severity: e.target.value }))}>
                    <option value="MILD">Mild</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline text-xs py-1.5 flex-1" onClick={() => setShowHIForm(false)}>Cancel</button>
                  <button className="btn-primary text-xs py-1.5 flex-1" onClick={handleSubmitHI} disabled={submittingHI}>
                    {submittingHI ? 'Submitting...' : 'Submit Issue'}
                  </button>
                </div>
              </div>
            )}

            {healthIssues.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No health issues reported</p>
            ) : (
              <div className="space-y-3">
                {healthIssues.map(hi => (
                  <div key={hi.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${hi.severity === 'SEVERE' || hi.severity === 'CRITICAL' ? 'bg-red-500' : hi.severity === 'MODERATE' ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{hi.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{hi.severity} · {hi.created_at ? formatDate(hi.created_at) : '—'}</p>
                    </div>
                    <span className={`badge text-xs ${statusColor(hi.status || 'pending')}`}>{statusLabel(hi.status || 'pending')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-3">Follow-up Notes</h3>
            {b.notes && <div className="bg-amber-50 rounded-xl p-3 mb-3 text-sm text-amber-800">{b.notes}</div>}
            <textarea
              className="input-field text-sm"
              rows={3}
              placeholder="Add a follow-up note..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button className="btn-primary mt-3 text-sm py-2 flex items-center gap-2" onClick={handleSaveNote} disabled={savingNote}>
              <Save size={14} /> {savingNote ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
