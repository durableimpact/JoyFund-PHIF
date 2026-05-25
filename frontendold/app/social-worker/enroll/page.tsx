'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { LayoutDashboard, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';

type Beneficiary = {
  id: string;
  healthId?: string;
  fullName: string;
  age?: number;
  phone?: string;
  community?: string;
  gestationalWeek?: number;
  complications?: string;
  enrolledBy?: string;
  enrolledAt?: string;
  status?: string;
  notes?: string;
};

export default function EnrollPage() {
  const router = useRouter();
  const { addBeneficiary, showToast, currentUser } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [healthId, setHealthId] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'FEMALE',
    category: 'MATERNAL',
    phone: '',
    email: '',
    region: '',
    city: '',
    address: '',
    nationalId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    complications: '',
    noInsurance: false,
    lowIncome: false,
    noPrevEnroll: false,
    gestationalWeek: '',
  });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const isValid =
    form.fullName &&
    form.dateOfBirth &&
    form.phone &&
    form.region &&
    form.city &&
    form.address &&
    form.nationalId &&
    form.emergencyContactName &&
    form.emergencyContactPhone &&
    form.emergencyContactRelationship &&
    form.noInsurance &&
    form.lowIncome &&
    form.noPrevEnroll;

  const handleSubmit = async () => {
    if (!isValid) {
      showToast('Please fill all required fields and confirm eligibility', 'error');
      return;
    }

    try {
      const response = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: form.fullName,
          date_of_birth: form.dateOfBirth,
          gender: form.gender,
          category: form.category,
          phone: form.phone,
          email: form.email || undefined,
          region: form.region,
          city: form.city,
          address: form.address,
          national_id_number: form.nationalId,
          emergency_contact_name: form.emergencyContactName,
          emergency_contact_phone: form.emergencyContactPhone,
          emergency_contact_relationship: form.emergencyContactRelationship,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = data.detail || data.error || JSON.stringify(data) || 'Unable to enroll beneficiary';
        throw new Error(message);
      }

      const generatedHealthId = data.digital_health_id || data.health_id || '';
      setHealthId(generatedHealthId);

      const beneficiary = {
        id: data.id,
        healthId: generatedHealthId,
        fullName: data.full_name,
        age: new Date().getFullYear() - new Date(data.date_of_birth).getFullYear(),
        phone: data.phone,
        community: `${data.city}, ${data.region}`,
        gestationalWeek: 0,
        complications: form.complications || 'None reported',
        enrolledBy: currentUser?.name || 'Social Worker',
        enrolledAt: new Date().toISOString().split('T')[0],
        status: 'awaiting_match',
        notes: '',
      } as Beneficiary;

      addBeneficiary(beneficiary);
      setSubmitted(true);
      showToast('Beneficiary enrolled successfully', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to enroll beneficiary', 'error');
    }
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
          <button className="btn-outline w-full" onClick={() => { setSubmitted(false); setForm({ fullName: '', dateOfBirth: '', gender: 'FEMALE', category: 'MATERNAL', phone: '', email: '', region: '', city: '', address: '', nationalId: '', emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '', complications: '', noInsurance: false, lowIncome: false, noPrevEnroll: false, gestationalWeek: '' }); }}>Enroll Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell navItems={[
      { label: 'Dashboard', href: '/social-worker/dashboard', icon: <LayoutDashboard size={16} /> },
      { label: 'Enroll Beneficiary', href: '/social-worker/enroll', icon: <Plus size={16} /> },
    ]} accentColor="#1D38DB" brandLabel="Social Worker" brandSub="Beneficiary management">
      <div className="max-w-lg">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700"><ArrowLeft size={16} /> Back</button>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Enroll New Beneficiary</h1>
          <p className="text-gray-500 text-sm mb-6">Register a vulnerable pregnant woman into JoyFund</p>
          <div className="card p-6 space-y-5">
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label>
                  <input className="input-field" placeholder="e.g. Marie Solange Ateba" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Date of Birth *</label>
                    <input className="input-field" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone *</label>
                    <input className="input-field" type="tel" placeholder="6XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender *</label>
                    <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Category *</label>
                    <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="MATERNAL">Pregnant Woman</option>
                      <option value="ELDERLY">Elderly</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                  <input className="input-field" type="email" placeholder="Optional email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Location & ID</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Region *</label>
                    <input className="input-field" placeholder="e.g. Centre Region" value={form.region} onChange={e => set('region', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">City *</label>
                    <input className="input-field" placeholder="e.g. Yaoundé" value={form.city} onChange={e => set('city', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Address *</label>
                  <input className="input-field" placeholder="Street address or neighborhood" value={form.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">National ID Number *</label>
                  <input className="input-field" placeholder="e.g. CM1234567890" value={form.nationalId} onChange={e => set('nationalId', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Emergency Contact *</h3>
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Contact name</label><input className="input-field" placeholder="e.g. John Doe" value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} /></div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Contact phone</label><input className="input-field" type="tel" placeholder="e.g. 6XX XXX XXX" value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} /></div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Relationship</label><input className="input-field" placeholder="e.g. Spouse, Friend" value={form.emergencyContactRelationship} onChange={e => set('emergencyContactRelationship', e.target.value)} /></div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Health Context</h3>
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Gestational Age (weeks)</label><input className="input-field" type="number" placeholder="28" min={1} max={42} value={form.gestationalWeek} onChange={e => set('gestationalWeek', e.target.value)} /></div>
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
    </DashboardShell>
  );
}
