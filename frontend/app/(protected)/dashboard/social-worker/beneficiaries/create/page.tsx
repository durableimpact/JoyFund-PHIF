'use client';
import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, Upload, UserPlus, MapPin, Navigation, X } from 'lucide-react';
import { z } from 'zod';
import { createBeneficiary } from '@/actions/beneficiaries';

const LocationPickerMap = dynamic(() => import('@/components/shared/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="w-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center" style={{ height: 220 }}>
    <MapPin size={24} className="text-gray-300" />
  </div>,
});

const beneficiarySchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender is required' }),
  category: z.enum(['MATERNAL', 'ELDERLY', 'OTHER'], { message: 'Category is required' }),
  phone: z.string().min(6, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  national_id_number: z.string().min(1, 'National ID is required'),
  number_of_previous_births: z.string().optional(),
  region: z.string().min(1, 'Region is required'),
  city: z.string().min(1, 'City is required'),
  address: z.string().min(1, 'Address is required'),
  lat: z.string().optional(),
  lng: z.string().optional(),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(6, 'Emergency contact phone is required'),
  emergency_contact_relationship: z.string().min(1, 'Relationship is required'),
});

type BeneficiaryForm = z.infer<typeof beneficiarySchema>;

const personalFields = ['full_name', 'date_of_birth', 'gender', 'category', 'phone', 'email', 'national_id_number'] as const;
const detailFields = ['number_of_previous_births'] as const;
const locationFields = ['region', 'city', 'address', 'lat', 'lng'] as const;
const emergencyFields = ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'] as const;

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
  { key: 'personal',  label: 'Personal',  num: 1, fields: personalFields },
  { key: 'details',   label: 'Details',   num: 2, fields: detailFields },
  { key: 'location',  label: 'Location',  num: 3, fields: locationFields },
  { key: 'emergency', label: 'Emergency', num: 4, fields: emergencyFields },
  { key: 'documents', label: 'Documents', num: 5, fields: [] as readonly string[] },
] as const;

type Step = typeof STEPS[number];

export default function CreateBeneficiaryPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stepIdx, setStepIdx] = useState(0);
  const [documents, setDocuments] = useState<File[]>([]);
  const [apiError, setApiError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const form = useForm<BeneficiaryForm>({
    resolver: zodResolver(beneficiarySchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      date_of_birth: '',
      gender: undefined,
      category: undefined,
      phone: '',
      email: '',
      national_id_number: '',
      region: '',
      city: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
    },
  });

  const { watch, control, handleSubmit, trigger, setValue, getValues, formState: { errors } } = form;
  const category = watch('category');
  const gender = watch('gender');
  const canShowDetails = category === 'MATERNAL' && gender !== 'MALE';
  const currentStep = STEPS[stepIdx];

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('lat', pos.coords.latitude.toFixed(6));
        setValue('lng', pos.coords.longitude.toFixed(6));
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [setValue]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    e.target.value = '';
  };

  const removeDocument = (index: number) => setDocuments(prev => prev.filter((_, i) => i !== index));

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldNames = currentStep.fields as readonly (keyof BeneficiaryForm)[];
    if (fieldNames.length === 0) return true;
    const valid = await trigger(fieldNames as any);
    return valid;
  };

  const next = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setStepIdx(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prev = () => setStepIdx(prev => Math.max(prev - 1, 0));

  const goToStep = async (target: number) => {
    if (target < stepIdx) { setStepIdx(target); return; }
    for (let i = stepIdx; i < target; i++) {
      const s = STEPS[i];
      const fieldNames = s.fields as readonly (keyof BeneficiaryForm)[];
      if (fieldNames.length > 0) {
        const ok = await trigger(fieldNames as any);
        if (!ok) return;
      }
    }
    setStepIdx(target);
  };

  const createMutation = useMutation({
    mutationFn: (data: BeneficiaryForm) => {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== '') {
          if (k === 'lat' || k === 'lng') formData.append(k, String(parseFloat(v)));
          else formData.append(k, String(v));
        }
      });
      documents.forEach(file => formData.append('uploaded_documents', file));
      return createBeneficiary(token, formData);
    },
    onSuccess: (result: any) => router.push(`/dashboard/social-worker/beneficiaries/${result.id}`),
    onError: (err: any) => {
      const msg = err?.message || 'Failed to create beneficiary';
      try { setApiError(JSON.parse(err)); } catch { setApiError(msg); }
    },
  });

  const onSubmit = handleSubmit((data) => {
    setApiError('');
    createMutation.mutate(data);
  });

  return (<>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Enroll New Beneficiary</h1>
        <p className="text-gray-500 text-sm">Step {stepIdx + 1} of {STEPS.length}</p>
      </div>

      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => goToStep(i)}
                className={`flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  done ? 'bg-teal-100 text-teal-700' : active ? 'text-white' : 'bg-gray-100 text-gray-400'
                }`}
                style={active ? { background: '#0D9488' } : {}}
              >
                {done ? <Check size={12} /> : <span className="text-[10px] font-black">{s.num}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`w-4 h-px shrink-0 ${i < stepIdx ? 'bg-teal-300' : 'bg-gray-200'}`} />}
            </div>
          );
        })}
      </div>

      <div className="card max-w-2xl">
        <form onSubmit={onSubmit} className="p-6">
          {apiError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold mb-5">{apiError}</div>}

          {stepIdx === 0 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name *" error={errors.full_name?.message}>
                  <input className="input-field" {...form.register('full_name')} placeholder="e.g. Marie Kamga" />
                </Field>
                <Field label="Date of Birth *" error={errors.date_of_birth?.message}>
                  <input type="date" className="input-field" {...form.register('date_of_birth')} />
                </Field>
                <Field label="Gender *" error={errors.gender?.message}>
                  <Controller name="gender" control={control} render={({ field }) => (
                    <select className="input-field" value={field.value || ''} onChange={e => field.onChange(e.target.value || undefined)}>
                      <option value="">— Select —</option>
                      {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  )} />
                </Field>
                <Field label="Category *" error={errors.category?.message}>
                  <Controller name="category" control={control} render={({ field }) => (
                    <select className="input-field" value={field.value || ''} onChange={e => field.onChange(e.target.value || undefined)}>
                      <option value="">— Select —</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  )} />
                </Field>
                <Field label="Phone *" error={errors.phone?.message}>
                  <input type="tel" className="input-field" {...form.register('phone')} placeholder="+237..." />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input type="email" className="input-field" {...form.register('email')} placeholder="marie@example.com" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="National ID Number *" error={errors.national_id_number?.message}>
                    <input className="input-field" {...form.register('national_id_number')} placeholder="e.g. NID-112345" />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {stepIdx === 1 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Additional Details</h2>
              {canShowDetails ? (
                <Field label="Number of Previous Births" error={errors.number_of_previous_births?.message}>
                  <input type="number" min="0" className="input-field" {...form.register('number_of_previous_births')} placeholder="e.g. 2" />
                </Field>
              ) : (
                <p className="text-gray-400 text-sm py-8 text-center">No additional details required for the selected category and gender.</p>
              )}
            </section>
          )}

          {stepIdx === 2 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <MapPin size={14} /> Location
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Region *" error={errors.region?.message}>
                  <input className="input-field" {...form.register('region')} placeholder="e.g. Centre" />
                </Field>
                <Field label="City *" error={errors.city?.message}>
                  <input className="input-field" {...form.register('city')} placeholder="e.g. Yaoundé" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address *" error={errors.address?.message}>
                    <input className="input-field" {...form.register('address')} placeholder="Quartier, rue..." />
                  </Field>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pin Location on Map</label>
                  <button type="button" onClick={handleLocateMe} disabled={geoLoading}
                    className="text-[10px] font-semibold flex items-center gap-1 text-teal-600 hover:text-teal-700">
                    <Navigation size={12} className={geoLoading ? 'animate-pulse' : ''} />
                    {geoLoading ? 'Locating...' : 'Use my location'}
                  </button>
                </div>
                <LocationPickerMap
                  value={(() => {
                    const latVal = getValues('lat');
                    const lngVal = getValues('lng');
                    return latVal && lngVal ? [parseFloat(latVal), parseFloat(lngVal)] : null;
                  })()}
                  onChange={(newLat, newLng) => {
                    setValue('lat', newLat.toFixed(6));
                    setValue('lng', newLng.toFixed(6));
                  }}
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Field label="Latitude" error={errors.lat?.message}>
                    <input className="input-field text-xs" {...form.register('lat')} placeholder="Auto-filled from map" />
                  </Field>
                  <Field label="Longitude" error={errors.lng?.message}>
                    <input className="input-field text-xs" {...form.register('lng')} placeholder="Auto-filled from map" />
                  </Field>
                </div>
              </div>
            </section>
          )}

          {stepIdx === 3 && (
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Emergency Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Name *" error={errors.emergency_contact_name?.message}>
                  <input className="input-field" {...form.register('emergency_contact_name')} placeholder="Jean Kamga" />
                </Field>
                <Field label="Phone *" error={errors.emergency_contact_phone?.message}>
                  <input type="tel" className="input-field" {...form.register('emergency_contact_phone')} placeholder="+237..." />
                </Field>
                <Field label="Relationship *" error={errors.emergency_contact_relationship?.message}>
                  <Controller name="emergency_contact_relationship" control={control} render={({ field }) => (
                    <select className="input-field" value={field.value || ''} onChange={e => field.onChange(e.target.value || undefined)}>
                      <option value="">— Select —</option>
                      {RELATIONSHIPS.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                    </select>
                  )} />
                </Field>
              </div>
            </section>
          )}

          {stepIdx === 4 && (
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
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-semibold border border-dashed border-gray-300 rounded-xl px-4 py-3 text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors w-full justify-center">
                  <Upload size={14} /> Upload Documents (photos, PDFs)
                </button>
              </div>
              {documents.length === 0 && <p className="text-gray-400 text-xs">No documents uploaded. You can skip this step.</p>}
            </section>
          )}

          <div className="flex gap-3 pt-6">
            {stepIdx > 0 ? (
              <button type="button" onClick={prev} className="btn-outline flex items-center gap-1.5">
                <ChevronLeft size={14} /> Back
              </button>
            ) : (
              <button type="button" onClick={() => router.back()} className="btn-outline">Cancel</button>
            )}

            {stepIdx < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5" style={{ background: '#0D9488' }}>
                Continue <ChevronRight size={14} />
              </button>
            ) : (
              <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#0D9488' }}>
                {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                <UserPlus size={16} /> Enroll Beneficiary
              </button>
            )}
          </div>
        </form>
      </div>
  
</>
);
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
