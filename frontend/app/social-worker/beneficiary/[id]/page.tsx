'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Calendar } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { statusColor, statusLabel, formatDate } from '@/lib/utils';

export default function BeneficiaryProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { beneficiaries, vouchers } = useStore();
  const [backendBeneficiary, setBackendBeneficiary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/beneficiaries/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        setBackendBeneficiary({
          ...data,
          healthId: data.digital_health_id,
          community: data.city && data.region ? `${data.city}, ${data.region}` : data.region || data.city || '',
          age: data.date_of_birth ? new Date().getFullYear() - new Date(data.date_of_birth).getFullYear() : undefined,
          enrolledAt: data.created_at?.split('T')[0] || '',
          status: 'awaiting_match',
          gestationalWeek: data.gestational_week || 0,
          complications: data.complications || 'No reported complications',
          notes: data.notes || '',
        });
      })
      .catch(() => {
        setBackendBeneficiary(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const b = backendBeneficiary || beneficiaries.find(x => x.id === id);
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-sm text-gray-500">Loading beneficiary details…</div></div>;
  if (!b) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-3">🔍</div><h2 className="font-bold mb-2">Not found</h2><button onClick={() => router.back()} className="btn-primary">Go Back</button></div></div>;
  const voucher = b.voucherId ? vouchers.find(v => v.id === b.voucherId) : null;
  const timeline = [
    { label: 'Enrolled', date: formatDate(b.enrolledAt), done: true },
    { label: 'Matched to Campaign', date: b.status !== 'awaiting_match' ? 'Completed' : 'Pending', done: b.status !== 'awaiting_match' },
    { label: 'Voucher Issued', date: voucher?.generatedAt ? formatDate(voucher.generatedAt) : 'Pending', done: b.status === 'voucher_issued' || b.status === 'care_received' },
    { label: 'Hospital Check-In', date: b.status === 'care_received' ? 'Completed' : 'Pending', done: b.status === 'care_received' },
    { label: 'Care Received', date: b.status === 'care_received' ? 'Completed' : 'Pending', done: b.status === 'care_received' },
  ];
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700"><ArrowLeft size={16} /> Back to Caseload</button>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="md:col-span-1 space-y-4">
              <div className="card p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-2xl mx-auto mb-3">{b.fullName.charAt(0)}</div>
                <h2 className="font-black text-gray-900 mb-1">{b.fullName}</h2>
                <div className="inline-block px-4 py-1.5 rounded-full font-bold text-sm text-white mb-3" style={{ background: 'var(--secondary)' }}>{b.healthId}</div>
                <br />
                <span className={`badge ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
              </div>
              <div className="card p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-gray-400" /><span className="text-gray-700">{b.phone}</span></div>
                <div className="flex items-center gap-2 text-sm"><MapPin size={14} className="text-gray-400" /><span className="text-gray-700">{b.community}</span></div>
                <div className="flex items-center gap-2 text-sm"><Calendar size={14} className="text-gray-400" /><span className="text-gray-700">Age {b.age} · Week {b.gestationalWeek}</span></div>
                <div className="pt-2 border-t border-gray-100"><p className="text-xs text-gray-400 mb-1">Complications</p><p className="text-sm text-gray-700">{b.complications}</p></div>
              </div>
              {voucher && (
                <div className="card p-5" style={{ border: '1px solid rgba(29,177,219,0.3)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--primary)' }}>Voucher</p>
                  <p className="font-black text-xl text-gray-900 tracking-wider">{voucher.code}</p>
                  <p className="text-xs text-gray-500 mb-2">{voucher.hospitalName}</p>
                  <span className={`badge ${statusColor(voucher.status)}`}>{statusLabel(voucher.status)}</span>
                </div>
              )}
            </div>
            <div className="md:col-span-2 space-y-5">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-5">Care Journey Timeline</h3>
                <div className="space-y-4">
                  {timeline.map((t, i) => (
                    <div key={t.label} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${t.done ? 'text-white' : 'bg-gray-100 text-gray-400'}`} style={t.done ? { background: 'var(--success)' } : {}}>{t.done ? '✓' : i + 1}</div>
                      <div className={`flex-1 pb-4 ${i < timeline.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <p className={`font-semibold text-sm ${t.done ? 'text-gray-900' : 'text-gray-400'}`}>{t.label}</p>
                        <p className="text-xs text-gray-400">{t.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-3">Notes</h3>
                <div className="bg-amber-50 rounded-xl p-3 mb-3 text-sm text-amber-800">{b.notes || 'No notes added yet.'}</div>
                <textarea className="input-field text-sm" rows={3} placeholder="Add a follow-up note..." />
                <button className="btn-primary mt-3 text-sm py-2">Save Note</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
