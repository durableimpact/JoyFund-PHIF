'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { generateId, generateHealthId } from '@/lib/utils';
import { Beneficiary } from '@/lib/mockData';

export default function EnrollPage() {
  const router = useRouter();
  const { addBeneficiary, showToast, currentUser } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [healthId, setHealthId] = useState('');
  const [form, setForm] = useState({ fullName: '', age: '', phone: '', community: '', gestationalWeek: '', complications: '', noInsurance: false, lowIncome: false, noPrevEnroll: false });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const isValid = form.fullName && form.age && form.phone && form.community && form.gestationalWeek && form.noInsurance && form.lowIncome && form.noPrevEnroll;

  const handleSubmit = () => {
    if (!isValid) { showToast('Please fill all required fields and confirm eligibility', 'error'); return; }
    const hid = generateHealthId();
    setHealthId(hid);
    const b: Beneficiary = { id: generateId('ben'), healthId: hid, fullName: form.fullName, age: parseInt(form.age), phone: form.phone, community: form.community, gestationalWeek: parseInt(form.gestationalWeek), complications: form.complications || 'None reported', enrolledBy: currentUser?.name || 'SW-Alphonse', enrolledAt: new Date().toISOString().split('T')[0], status: 'awaiting_match', notes: '' };
    addBeneficiary(b);
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="card p-8 max-w-md w-full text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: 'var(--success)' }}><Check size={28} /></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Beneficiary Enrolled!</h2>
        <p className="text-gray-500 text-sm mb-6">{form.fullName} has been successfully enrolled into the JoyFund system.</p>
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Digital Health ID</p>
          <p className="text-2xl font-black" style={{ color: 'var(--secondary)' }}>{healthId}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full" onClick={() => router.push('/social-worker/dashboard')}>Back to Dashboard</button>
          <button className="btn-outline w-full" onClick={() => { setSubmitted(false); setForm({ fullName: '', age: '', phone: '', community: '', gestationalWeek: '', complications: '', noInsurance: false, lowIncome: false, noPrevEnroll: false }); }}>Enroll Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700"><ArrowLeft size={16} /> Back</button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Enroll New Beneficiary</h1>
          <p className="text-gray-500 text-sm mb-6">Register a vulnerable pregnant woman into JoyFund</p>
          <div className="card p-6 space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Personal Information</h3>
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label><input className="input-field" placeholder="e.g. Marie Solange Ateba" value={form.fullName} onChange={e => set('fullName', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Age *</label><input className="input-field" type="number" placeholder="24" value={form.age} onChange={e => set('age', e.target.value)} /></div>
                  <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Phone *</label><input className="input-field" type="tel" placeholder="6XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Community *</label><input className="input-field" placeholder="e.g. Mbalmayo, Centre Region" value={form.community} onChange={e => set('community', e.target.value)} /></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Health Context</h3>
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Gestational Age (weeks) *</label><input className="input-field" type="number" placeholder="28" min={1} max={42} value={form.gestationalWeek} onChange={e => set('gestationalWeek', e.target.value)} /></div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Complications Noted</label><textarea className="input-field" rows={2} placeholder="e.g. Mild anaemia, or leave blank" value={form.complications} onChange={e => set('complications', e.target.value)} /></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Eligibility Checklist *</h3>
              <div className="space-y-2">
                {[{ k: 'noInsurance', l: 'No formal health insurance' }, { k: 'lowIncome', l: 'Income below poverty threshold' }, { k: 'noPrevEnroll', l: 'No previous JoyFund enrollment' }].map(item => (
                  <label key={item.k} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:border-gray-200">
                    <input type="checkbox" checked={form[item.k as keyof typeof form] as boolean} onChange={e => set(item.k, e.target.checked)} className="w-4 h-4" />
                    <span className="text-sm text-gray-900">{item.l}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary w-full" onClick={handleSubmit} disabled={!isValid}>Enroll & Generate Health ID</button>
          </div>
        </div>
      </div>
    </div>
  );
}
