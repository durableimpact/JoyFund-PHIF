'use client';
import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Upload, UserPlus, MapPin, Navigation, X } from 'lucide-react';
import { z } from 'zod';
import { createBeneficiary } from '@/actions/beneficiaries';

const stepSchemas = {
  personal: z.object({
    full_name: z.string().min(2, 'Full name is required'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender is required' }),
    category: z.enum(['MATERNAL', 'ELDERLY', 'OTHER'], { message: 'Category is required' }),
    phone: z.string().min(6, 'Phone is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    national_id_number: z.string().min(1, 'National ID is required'),
  }),
  details: z.object({
    number_of_previous_births: z.number().int().min(0).optional(),
  }),
  location: z.object({
    region: z.string().min(1, 'Region is required'),
    city: z.string().min(1, 'City is required'),
    address: z.string().min(1, 'Address is required'),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }),
  emergency: z.object({
    emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
    emergency_contact_phone: z.string().min(6, 'Emergency contact phone is required'),
    emergency_contact_relationship: z.string().min(1, 'Relationship is required'),
  }),
};

const GENDERS = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
  { value: 'OTHER', label: 'Other' },
] as const;

const CATEGORIES = [
  { value: 'MATERNAL', label: 'Pregnant Woman' },
  { value: 'ELDERLY', label: 'Elderly' },
  { value: 'OTHER', label: 'Other' },
] as const;

const RELATIONSHIPS = ['SPOUSE', 'PARENT', 'SIBLING', 'FRIEND', 'NEIGHBOR', 'OTHER'] as const;

const STEPS = [
  { key: 'personal', label: 'Personal', num: 1 },
  { key: 'details', label: 'Details', num: 2 },
  { key: 'location', label: 'Location', num: 3 },
  { key: 'emergency', label: 'Emergency', num: 4 },
  { key: 'documents', label: 'Documents', num: 5 },
] as const;

type StepKey = typeof STEPS[number]['key'];

export default function CreateBeneficiaryPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<StepKey>('personal');

  const [form, setForm] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    category: '',
    phone: '',
    email: '',
    national_id_number: '',
    region: '',
    city: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
  });
  const [previousBirths, setPreviousBirths] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = '';
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const currentStepIdx = STEPS.findIndex(s => s.key === step);

  const validateStep = (): boolean => {
    setError('');
    setApiError('');

    if (step === 'personal') {
      const r = stepSchemas.personal.safeParse({
        full_name: form.full_name,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        category: form.category,
        phone: form.phone,
        email: form.email || undefined,
        national_id_number: form.national_id_number,
      });
      if (!r.success) { setError(r.error.errors[0].message); return false; }
    }

    if (step === 'details' && form.category === 'MATERNAL' && form.gender !== 'MALE') {
      const r = stepSchemas.details.safeParse({
        number_of_previous_births: previousBirths ? Number(previousBirths) : undefined,
      });
      if (!r.success) { setError(r.error.errors[0].message); return false; }
    }

    if (step === 'location') {
      const r = stepSchemas.location.safeParse({
        region: form.region,
        city: form.city,
        address: form.address,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
      });
      if (!r.success) { setError(r.error.errors[0].message); return false; }
    }

    if (step === 'emergency') {
      const r = stepSchemas.emergency.safeParse({
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relationship: form.emergency_contact_relationship,
      });
      if (!r.success) { setError(r.error.errors[0].message); return false; }
    }

    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx].key);
  };

  const prev = () => {
    const prevIdx = currentStepIdx - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx].key);
  };

  const goToStep = (target: StepKey) => {
    const targetIdx = STEPS.findIndex(s => s.key === target);
    if (targetIdx < currentStepIdx) {
      setStep(target);
      return;
    }
    if (!validateStep()) return;
    setStep(target);
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = { ...form };
      if (form.email) payload.email = form.email;
      if (previousBirths) payload.number_of_previous_births = Number(previousBirths);
      if (lat) payload.lat = parseFloat(lat);
      if (lng) payload.lng = parseFloat(lng);

      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== '') formData.append(k, String(v));
      });
      documents.forEach((file) => {
        formData.append('uploaded_documents', file);
      });
      return createBeneficiary(token, formData);
    },
    onSuccess: (data: any) => {
      router.push(`/dashboard/social-worker/beneficiaries/${data.id}`);
    },
    onError: (err: any) => {
      try {
        const parsed = JSON.parse(err);
        setApiError(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
      } catch {
        setApiError('Failed to create beneficiary');
      }
    },
  });

  const handleSubmit = () => {
    setApiError('');
    if (!validateStep()) return;
    createMutation.mutate();
  };

  const canShowDetails = form.category === 'MATERNAL' && form.gender !== 'MALE';

  return (<>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Enroll New Beneficiary</h1>
        <p className="text-gray-500 text-sm">Step {currentStepIdx + 1} of {STEPS.length}</p>
      </div>

      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const done = i < currentStepIdx;
          const active = i === currentStepIdx;
          return (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <button
                onClick={() => goToStep(s.key)}
                className={`flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  done ? 'bg-teal-100 text-teal-700' :
                  active ? 'text-white' :
                  'bg-gray-100 text-gray-400'
                }`}
                style={active ? { background: '#0D9488' } : {}}
              >
                {done ? <Check size={12} /> : <span className="text-[10px] font-black">{s.num}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`w-4 h-px shrink-0 ${i < currentStepIdx ? 'bg-teal-300' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>

      <div className="card max-w-2xl">
        <div className="p-6">
          {apiError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold mb-5">{apiError}</div>}
          {error && <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold mb-5">{error}</div>}

          {step === 'personal' && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <input className="input-field" value={form.full_name} onChange={e => updateField('full_name', e.target.value)} placeholder="e.g. Marie Kamga" />
                </Field>
                <Field label="Date of Birth *">
                  <input type="date" className="input-field" value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
                </Field>
                <Field label="Gender *">
                  <select className="input-field" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                    <option value="">— Select —</option>
                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </Field>
                <Field label="Category *">
                  <select className="input-field" value={form.category} onChange={e => updateField('category', e.target.value)}>
                    <option value="">— Select —</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
                <Field label="Phone *">
                  <input type="tel" className="input-field" value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+237..." />
                </Field>
                <Field label="Email">
                  <input type="email" className="input-field" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="marie@example.com" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="National ID Number *">
                    <input className="input-field" value={form.national_id_number} onChange={e => updateField('national_id_number', e.target.value)} placeholder="e.g. NID-112345" />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {step === 'details' && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Additional Details</h2>
              {canShowDetails ? (
                <Field label="Number of Previous Births">
                  <input type="number" min="0" className="input-field" value={previousBirths} onChange={e => setPreviousBirths(e.target.value)} placeholder="e.g. 2" />
                </Field>
              ) : (
                <p className="text-gray-400 text-sm py-8 text-center">No additional details required for the selected category and gender.</p>
              )}
            </section>
          )}

          {step === 'location' && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <MapPin size={14} /> Location
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Region *">
                  <input className="input-field" value={form.region} onChange={e => updateField('region', e.target.value)} placeholder="e.g. Centre" />
                </Field>
                <Field label="City *">
                  <input className="input-field" value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="e.g. Yaoundé" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address *">
                    <input className="input-field" value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="Quartier, rue..." />
                  </Field>
                </div>
                <Field label="Latitude">
                  <input className="input-field" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 3.8480" />
                </Field>
                <Field label="Longitude">
                  <input className="input-field" value={lng} onChange={e => setLng(e.target.value)} placeholder="e.g. 11.5021" />
                </Field>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={geoLoading}
                    className="text-xs font-semibold flex items-center gap-1.5 text-teal-600 hover:text-teal-700"
                  >
                    <Navigation size={14} className={geoLoading ? 'animate-pulse' : ''} />
                    {geoLoading ? 'Locating...' : 'Use my current location'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === 'emergency' && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Emergency Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Name *">
                  <input className="input-field" value={form.emergency_contact_name} onChange={e => updateField('emergency_contact_name', e.target.value)} placeholder="Jean Kamga" />
                </Field>
                <Field label="Phone *">
                  <input type="tel" className="input-field" value={form.emergency_contact_phone} onChange={e => updateField('emergency_contact_phone', e.target.value)} placeholder="+237..." />
                </Field>
                <Field label="Relationship *">
                  <select className="input-field" value={form.emergency_contact_relationship} onChange={e => updateField('emergency_contact_relationship', e.target.value)}>
                    <option value="">— Select —</option>
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                  </select>
                </Field>
              </div>
            </section>
          )}

          {step === 'documents' && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Supporting Documents</h2>
              <div className="space-y-2">
                {documents.length > 0 && (
                  <div className="space-y-1">
                    {documents.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-xs">
                        <span className="text-gray-700 truncate">{file.name}</span>
                        <button type="button" onClick={() => removeDocument(i)} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={handleFiles} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-xs font-semibold border border-dashed border-gray-300 rounded-xl px-4 py-3 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors w-full justify-center">
                  <Upload size={14} /> Upload Documents (photos, PDFs)
                </button>
              </div>
              {documents.length === 0 && <p className="text-gray-400 text-xs">No documents uploaded. You can skip this step.</p>}
            </section>
          )}

          <div className="flex gap-3 pt-6">
            {currentStepIdx > 0 ? (
              <button type="button" onClick={prev} className="btn-outline flex items-center gap-1.5">
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <button type="button" onClick={() => router.back()} className="btn-outline">Cancel</button>
            )}

            {currentStepIdx < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5" style={{ background: '#0D9488' }}>
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#0D9488' }}>
                {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                <UserPlus size={16} /> Enroll Beneficiary
              </button>
            )}
          </div>
        </div>
      </div>
  
</>
);
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}
