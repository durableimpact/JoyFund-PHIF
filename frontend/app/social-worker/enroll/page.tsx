'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, UserPlus, LayoutDashboard, Plus } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/social-worker/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Enroll Beneficiary', href: '/social-worker/enroll', icon: <Plus size={16} /> },
];

// Exact choices from beneficiary.py models
const GENDERS = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
  { value: 'OTHER', label: 'Other' },
];

const CATEGORIES = [
  { value: 'MATERNAL', label: 'Maternal (Pregnant Woman)' },
  { value: 'ELDERLY', label: 'Elderly' },
  { value: 'OTHER', label: 'Other' },
];

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Neighbor', 'Other'];

const CAMEROON_REGIONS = [
  'Adamawa', 'Centre', 'East', 'Far North', 'Littoral',
  'North', 'North West', 'South', 'South West', 'West',
];

const emptyForm = {
  full_name: '',
  date_of_birth: '',
  gender: 'FEMALE',
  category: 'MATERNAL',
  phone: '',
  email: '',
  region: '',
  city: '',
  address: '',
  national_id_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: 'Spouse',
  number_of_previous_births: '',
};

export default function EnrollPage() {
  const router = useRouter();
  const { addBeneficiary, showToast } = useStore();
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!form.full_name) return 'Full name is required';
      if (!form.date_of_birth) return 'Date of birth is required';
      if (!form.phone || form.phone.length < 9) return 'Valid phone number required';
      if (!form.national_id_number) return 'National ID number is required';
    }
    if (s === 2) {
      if (!form.region) return 'Region is required';
      if (!form.city) return 'City is required';
      if (!form.address) return 'Address is required';
    }
    if (s === 3) {
      if (!form.emergency_contact_name) return 'Emergency contact name is required';
      if (!form.emergency_contact_phone) return 'Emergency contact phone is required';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep(p => p + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep(3);
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    try {
      const payload: any = {
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        category: form.category,
        phone: form.phone,
        region: form.region,
        city: form.city,
        address: form.address,
        national_id_number: form.national_id_number,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relationship: form.emergency_contact_relationship,
      };
      if (form.email) payload.email = form.email;
      if (form.number_of_previous_births) payload.number_of_previous_births = Number(form.number_of_previous_births);

      const data = await authenticatedFetch('/api/beneficiaries/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreated(data);
      addBeneficiary({
        id: data.id,
        fullName: data.full_name || form.full_name,
        healthId: data.digital_health_id || '',
        community: data.city || form.city,
        status: 'awaiting_match',
        enrolledAt: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      });
      showToast('Beneficiary enrolled successfully!', 'success');
      setStep(4);
    } catch (e: any) {
      setError(e?.message || 'Failed to enroll beneficiary');
      showToast(e?.message || 'Enrollment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ['Personal Info', 'Location', 'Emergency Contact', 'Confirmation'];

  return (
    <DashboardShell navItems={NAV} accentColor="#1D38DB" brandLabel="Social Worker" brandSub="Beneficiary management">
      <div className="max-w-2xl">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Enroll New Beneficiary</h1>
          <p className="text-gray-500 text-sm">Register a vulnerable person into the JoyFund care system</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {stepTitles.map((title, i) => (
            <div key={title} className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= step ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                style={i + 1 <= step ? { background: 'var(--secondary)' } : {}}>
                {i + 1 < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-gray-900' : 'text-gray-400'}`}>{title}</span>
              {i < stepTitles.length - 1 && <div className="w-6 h-0.5 bg-gray-200 hidden sm:block" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-gray-900 mb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label>
                <input className="input-field" placeholder="e.g. Mary Nkongoh" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date of Birth *</label>
                <input className="input-field" type="date" max={new Date().toISOString().split('T')[0]}
                  value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Gender</label>
                <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
                <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone Number *</label>
                <input className="input-field" type="tel" placeholder="+237 6XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Email <span className="font-normal text-gray-400">(optional)</span></label>
                <input className="input-field" type="email" placeholder="patient@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">National ID Number * <span className="font-normal text-gray-400">e.g. NID-123456 or CNI number</span></label>
                <input className="input-field" placeholder="e.g. NID-123456" value={form.national_id_number} onChange={e => set('national_id_number', e.target.value)} />
              </div>
              {form.category === 'MATERNAL' && (
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Number of Previous Births <span className="font-normal text-gray-400">(optional)</span></label>
                  <input className="input-field" type="number" min={0} max={20} placeholder="e.g. 2" value={form.number_of_previous_births} onChange={e => set('number_of_previous_births', e.target.value)} />
                </div>
              )}
            </div>
            <button className="btn-primary w-full mt-2" onClick={handleNext}>Continue <ArrowLeft size={16} className="rotate-180" /></button>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-gray-900 mb-2">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Region *</label>
                <select className="input-field" value={form.region} onChange={e => set('region', e.target.value)}>
                  <option value="">— Select Region —</option>
                  {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">City *</label>
                <input className="input-field" placeholder="e.g. Yaoundé" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Address *</label>
                <textarea className="input-field resize-none" rows={2} placeholder="e.g. Rue de la Paix, Quartier Bastos, Yaoundé" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className="btn-outline flex-1" onClick={() => { setStep(1); setError(''); }}>Back</button>
              <button className="btn-primary flex-1" onClick={handleNext}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 — Emergency Contact */}
        {step === 3 && (
          <div className="card p-6 space-y-4">
            <h3 className="font-bold text-gray-900 mb-2">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Name *</label>
                <input className="input-field" placeholder="e.g. Jean Nkongoh" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact Phone *</label>
                <input className="input-field" type="tel" placeholder="+237 6XX XXX XXX" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Relationship</label>
                <select className="input-field" value={form.emergency_contact_relationship} onChange={e => set('emergency_contact_relationship', e.target.value)}>
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <button className="btn-outline flex-1" onClick={() => { setStep(2); setError(''); }}>Back</button>
              <button className="btn-secondary flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Enrolling…' : 'Enroll Beneficiary'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Success */}
        {step === 4 && created && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: 'var(--success)' }}>
              <Check size={28} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Beneficiary Enrolled!</h2>
            <p className="text-gray-500 text-sm mb-5">{created.full_name || form.full_name} has been registered in the JoyFund system.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Digital Health ID</span><span className="font-mono font-bold">{created.digital_health_id || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{created.full_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium capitalize">{created.category}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-amber-600">Awaiting Campaign Match</span></div>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => { setForm(emptyForm); setStep(1); setCreated(null); setError(''); }}>
                Enroll Another
              </button>
              <button className="btn-primary flex-1" onClick={() => router.push('/social-worker/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
