'use client';
import { useI18n } from '@/locales/client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  User,
  CreditCard,
  Briefcase,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import HospitalCombobox from './_components/HospitalCombobox';
import { InputPhone } from '@/components/ui/input-phone';
import { FileUpload } from '@/components/ui/file-upload';
import {
  createHospitalAdminAccount,
  createSocialWorkerAccount,
  createReceptionistAccount,
  createDonorAccount,
  createSystemAdminAccount,
} from '@/actions/accounts';

const ROLES = [
  { value: 'SYSTEM_ADMIN' as const, label: 'System Admin', desc: 'Full platform access', icon: Shield },
  { value: 'HOSPITAL_ADMIN' as const, label: 'Hospital Admin', desc: 'Manages hospital portal', icon: Building2 },
  { value: 'SOCIAL_WORKER' as const, label: 'Social Worker', desc: 'Enrolls beneficiaries', icon: Briefcase },
  { value: 'RECEPTIONIST' as const, label: 'Receptionist', desc: 'Validates vouchers', icon: User },
  { value: 'DONOR' as const, label: 'Donor', desc: 'Creates campaigns & donates', icon: CreditCard },
];

const CAMEROON_REGIONS = ['Adamawa','Centre','East','Far North','Littoral','North','North West','South','South West','West'];

type RoleValue = (typeof ROLES)[number]['value'];

const userSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(6, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string().min(1, 'Please confirm your password'),
  nationalId: z.string().optional(),
  organization: z.string().optional(),
  regionAssigned: z.string().optional(),
  hospitalId: z.string().optional(),
}).refine((data) => data.password === data.password2, {
  message: 'Passwords do not match',
  path: ['password2'],
});

type UserFormData = z.infer<typeof userSchema>;

const STEP_FIELDS: Record<string, readonly string[]> = {
  role: ['role'],
  info: ['firstName', 'lastName', 'email', 'phone'],
  password: ['password', 'password2'],
  id: ['nationalId'],
  extras: ['organization', 'regionAssigned'],
  hospital: ['hospitalId'],
};

function getSteps(role: RoleValue) {
  const isStaff = role === 'SOCIAL_WORKER' || role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST';
  const steps = [
    { key: 'role', label: 'Role', icon: Shield },
    { key: 'info', label: 'Personal Info', icon: User },
    { key: 'password', label: 'Password', icon: CreditCard },
  ];
  if (isStaff) {
    steps.push({ key: 'id', label: 'ID Verification', icon: CreditCard });
  }
  if (role === 'SOCIAL_WORKER') {
    steps.push({ key: 'extras', label: 'Assignment', icon: Briefcase });
  } else if (role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST') {
    steps.push({ key: 'hospital', label: 'Hospital', icon: Building2 });
  }
  return steps;
}

export default function AdminCreateUser() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [stepIdx, setStepIdx] = useState(0);
  const [frontId, setFrontId] = useState<File | null>(null);
  const [backId, setBackId] = useState<File | null>(null);
  const [created, setCreated] = useState<any>(null);
  const [serverError, setServerError] = useState('');

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'DONOR',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      password2: '',
      nationalId: '',
      organization: '',
      regionAssigned: '',
      hospitalId: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const role = watch('role') as RoleValue;
  const steps = getSteps(role);
  const currentStep = steps[stepIdx];
  const isStaff = role === 'SOCIAL_WORKER' || role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST';

  const validateCurrentStep = async (): Promise<boolean> => {
    const fields = STEP_FIELDS[currentStep.key] || [];
    if (fields.length === 0) return true;
    const valid = await trigger(fields as any);
    return valid;
  };

  const next = async () => {
    const ok = await validateCurrentStep();
    if (!ok) return;
    setStepIdx((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prev = () => setStepIdx((prev) => Math.max(prev - 1, 0));

  const goToStep = async (target: number) => {
    if (target < stepIdx) {
      setStepIdx(target);
      return;
    }
    for (let i = stepIdx; i < target; i++) {
      const fields = STEP_FIELDS[steps[i].key] || [];
      if (fields.length > 0) {
        const ok = await trigger(fields as any);
        if (!ok) return;
      }
    }
    setStepIdx(target);
  };

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      setServerError('');

      if (isStaff && (!frontId || !backId)) {
        setServerError('National ID number and both ID images are required for this role');
        throw new Error('');
      }

      const baseData: SystemAdminRegister = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName || '',
        phone_number: data.phone,
      };

      if (data.role === 'SYSTEM_ADMIN') {
        return await createSystemAdminAccount(token, baseData);
      }
      if (data.role === 'DONOR') {
        return await createDonorAccount(baseData);
      }

      const fd = new FormData();
      fd.append('first_name', data.firstName);
      fd.append('last_name', data.lastName || '');
      fd.append('email', data.email);
      fd.append('phone_number', data.phone);
      fd.append('password', data.password);
      fd.append('national_id_number', data.nationalId || '');
      if (frontId) fd.append('front_national_id_image', frontId);
      if (backId) fd.append('back_national_id_image', backId);

      if (data.role === 'SOCIAL_WORKER') {
        fd.append('organization', data.organization || '');
        fd.append('region_assigned', data.regionAssigned || '');
        return await createSocialWorkerAccount(token, fd);
      }

      if (data.hospitalId) fd.append('hospital', data.hospitalId);

      if (data.role === 'HOSPITAL_ADMIN') {
        return await createHospitalAdminAccount(token, fd);
      }
      if (data.role === 'RECEPTIONIST') {
        return await createReceptionistAccount(token, fd);
      }

      throw new Error('Unknown role');
    },
    onSuccess: (data: any) => {
      setCreated(data);
    },
    onError: (e: any) => {
      if (e?.message && e.message !== '') setServerError(e.message);
      else {
        try {
          const parsed = JSON.parse(e?.toString?.() || '');
          const msg = parsed.detail || parsed.email?.[0] || parsed.phone_number?.[0] || JSON.stringify(parsed);
          setServerError(msg);
        } catch {
          setServerError('Failed to create user. Please try again.');
        }
      }
    },
  });

  if (created) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-lg mx-auto">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#471DDB' }}>
              <Check size={28} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-500 text-sm mb-5">
              {watch('firstName')} {watch('lastName')} is now registered as a <strong>{ROLES.find(r => r.value === role)?.label}</strong>.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2 mb-5">
              {[['Email', watch('email')], ['Phone', watch('phone') || '—'], ['Role', ROLES.find(r => r.value === role)?.label]].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <button
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-opacity"
              style={{ background: '#471DDB' }}
              onClick={() => {
                setCreated(null);
                setStepIdx(0);
                setFrontId(null);
                setBackId(null);
                form.reset();
              }}
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/system-admin/users"
          className="p-2.5 hover:bg-white rounded-xl transition-colors border border-gray-200 bg-white/50 backdrop-blur-sm"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Create User Account</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Step {stepIdx + 1} of {steps.length} &mdash; {currentStep.label}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {serverError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-start">
          <div className="p-1 bg-red-100 rounded-lg shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-700 font-medium">{serverError}</p>
        </div>
      )}

      {/* Stepper */}
      <div className="mb-8 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-1">
          {steps.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  className={`flex items-center justify-center gap-2 flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    done
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-150'
                      : active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {done ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`w-3 h-px shrink-0 ${i < stepIdx ? 'bg-indigo-300' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit((data) => createUserMutation.mutate(data))}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Step 1: Role Selection */}
            {currentStep.key === 'role' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Select Role</h2>
                  <p className="text-sm text-gray-500 mt-1">Choose the role for this user account</p>
                </div>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ROLES.map((r) => {
                        const Icon = r.icon;
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => { field.onChange(r.value); setStepIdx(0); setServerError(''); }}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              field.value === r.value
                                ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                              field.value === r.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <Icon size={16} />
                            </div>
                            <div className={`font-bold text-xs ${field.value === r.value ? 'text-indigo-700' : 'text-gray-900'}`}>
                              {r.label}
                            </div>
                            <div className={`text-[10px] mt-0.5 ${field.value === r.value ? 'text-indigo-500' : 'text-gray-500'}`}>
                              {r.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.role && <p className="text-[11px] text-red-500 font-medium">{errors.role.message}</p>}
              </section>
            )}

            {/* Step 2: Personal Info */}
            {currentStep.key === 'info' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <User size={18} className="text-indigo-500" />
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Enter the user's basic details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">First Name *</label>
                    <input {...register('firstName')} className={`input-field ${errors.firstName ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`} placeholder="Jean-Pierre" />
                    {errors.firstName && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Last Name *</label>
                    <input {...register('lastName')} className={`input-field ${errors.lastName ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`} placeholder="Mbarga" />
                    {errors.lastName && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Email *</label>
                  <input {...register('email')} type="email" className={`input-field ${errors.email ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`} placeholder="user@example.com" />
                  {errors.email && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Phone *</label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <InputPhone
                        value={field.value}
                        onChange={(value) => field.onChange(value || '')}
                        defaultCountry="CM"
                        placeholder="+237 6XX XXX XXX"
                      />
                    )}
                  />
                  {errors.phone && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.phone.message}</p>}
                </div>
              </section>
            )}

            {/* Step 3: Password */}
            {currentStep.key === 'password' && (
              <PasswordStep control={control} register={register} errors={errors} />
            )}

            {/* Step 4: ID Verification (staff roles) */}
            {currentStep.key === 'id' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard size={18} className="text-indigo-500" />
                    ID Verification
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Required for staff roles — upload a valid national ID</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">National ID Number *</label>
                  <input {...register('nationalId')} className={`input-field ${errors.nationalId ? 'border-red-300' : ''}`} placeholder="e.g. NID-123456" />
                  {errors.nationalId && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.nationalId.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Front of ID *</label>
                    <FileUpload value={frontId} onChange={setFrontId} label="Upload front" accept="image/*" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Back of ID *</label>
                    <FileUpload value={backId} onChange={setBackId} label="Upload back" accept="image/*" />
                  </div>
                </div>
              </section>
            )}

            {/* Step: Social Worker Assignment */}
            {currentStep.key === 'extras' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase size={18} className="text-indigo-500" />
                    Assignment Details
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Organization and region for this Social Worker</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Organization *</label>
                  <input {...register('organization')} className={`input-field ${errors.organization ? 'border-red-300' : ''}`} placeholder="e.g. Ministry of Social Affairs" />
                  {errors.organization && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.organization.message}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Region Assigned *</label>
                  <select {...register('regionAssigned')} className={`input-field ${errors.regionAssigned ? 'border-red-300' : ''}`}>
                    <option value="">— Select Region —</option>
                    {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.regionAssigned && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.regionAssigned.message}</p>}
                </div>
              </section>
            )}

            {/* Step: Hospital Selection */}
            {currentStep.key === 'hospital' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-500" />
                    Hospital Assignment
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Link this user to a hospital (optional)</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Hospital</label>
                  <Controller
                    name="hospitalId"
                    control={control}
                    render={({ field }) => (
                      <HospitalCombobox value={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </section>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="px-6 sm:px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex gap-3 justify-between items-center">
            <div>
              {stepIdx > 0 ? (
                <button
                  type="button"
                  onClick={prev}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              ) : (
                <Link
                  href="/dashboard/system-admin/users"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-white transition-colors"
                >
                  <ChevronLeft size={14} />
                  Cancel
                </Link>
              )}
            </div>

            {stepIdx < steps.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="py-2.5 px-6 rounded-xl font-bold text-sm text-white flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Continue
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="py-2.5 px-6 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {createUserMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                Create {ROLES.find(r => r.value === role)?.label}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function PasswordStep({ control, register, errors }: { control: any; register: any; errors: any }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <CreditCard size={18} className="text-indigo-500" />
          Set Password
        </h2>
        <p className="text-sm text-gray-500 mt-1">Choose a secure password for this account</p>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Password * <span className="font-normal text-gray-400">(min 8 chars)</span></label>
        <div className="relative">
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            className={`input-field pr-10 ${errors.password ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.password.message}</p>}
      </div>
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Confirm Password *</label>
        <div className="relative">
          <input
            {...register('password2')}
            type={showPassword2 ? 'text' : 'password'}
            className={`input-field pr-10 ${errors.password2 ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword2(!showPassword2)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword2 ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password2 && <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.password2.message}</p>}
      </div>
    </section>
  );
}
