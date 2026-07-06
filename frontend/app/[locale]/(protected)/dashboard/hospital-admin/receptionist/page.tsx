'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { getHospitalStaff } from '@/actions/hospital';
import { InputPhone } from '@/components/ui/input-phone';
import { FileUpload } from '@/components/ui/file-upload';
import api from '@/actions/api';
import { useI18n } from '@/locales/client';

const roleColors: Record<string, string> = {
  receptionist: 'bg-blue-100 text-blue-700',
  hospital_admin: 'bg-purple-100 text-purple-700',
};

const receptionistSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone_number: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password2: z.string().min(1, 'Please confirm your password'),
  national_id_number: z.string().optional(),
}).refine((data) => data.password === data.password2, {
  message: 'Passwords do not match',
  path: ['password2'],
});

type ReceptionistFormData = z.infer<typeof receptionistSchema>;

function parseBackendErrors(data: unknown): Record<string, string[]> {
  if (!data || typeof data !== 'object') return {};
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      result[key] = value.map(String);
    } else if (typeof value === 'string') {
      result[key] = [value];
    } else if (typeof value === 'object' && value !== null) {
      result[key] = [JSON.stringify(value)];
    }
  }
  return result;
}

export default function HospitalStaff() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const hospitalId = currentUser?.hospital?.id;
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ReceptionistFormData>({
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', password2: '',
    national_id_number: '',
  });
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['ha-staff', hospitalId, token],
    queryFn: async () => {
      const res = await getHospitalStaff(hospitalId!, token);
      return res?.results || res || [];
    },
    enabled: !!token && !!hospitalId,
  });

  const staff: any[] = Array.isArray(staffData) ? staffData : [];

  const resetForm = () => {
    setForm({ first_name: '', last_name: '', email: '', phone_number: '', password: '', password2: '', national_id_number: '' });
    setFrontFile(null);
    setBackFile(null);
    setShowPassword(false);
    setShowPassword2(false);
    setFieldErrors({});
    setTouched({});
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('email', form.email);
      fd.append('password', form.password);
      fd.append('first_name', form.first_name);
      fd.append('last_name', form.last_name);
      fd.append('phone_number', form.phone_number || '');
      if (form.national_id_number) fd.append('national_id_number', form.national_id_number);
      if (frontFile) fd.append('front_national_id_image', frontFile);
      if (backFile) fd.append('back_national_id_image', backFile);

      try {
        const { data: rec } = await api.post('/api/accounts/receptionists/', fd, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        return rec;
      } catch (err: any) {
        const responseData = err.response?.data;
        if (responseData && typeof responseData === 'object' && !responseData.detail && !responseData.error) {
          const parsed = parseBackendErrors(responseData);
          setFieldErrors(parsed);
          const messages = Object.entries(parsed)
            .map(([field, errs]) => `${field.replace(/_/g, ' ')}: ${errs.join(', ')}`)
            .join('\n');
          throw new Error(messages);
        }
        const msg = responseData?.detail || responseData?.error || responseData?.message || t('hospitalAdmin.receptionist.failedToAdd');
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      toast.success(t('hospitalAdmin.receptionist.addedSuccess'));
      setShowAdd(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['ha-staff'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t('hospitalAdmin.receptionist.failedToAdd'));
    },
  });

  const validate = (): boolean => {
    const result = receptionistSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      }
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    createMutation.mutate(undefined, {
      onSettled: () => setSubmitting(false),
    });
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string): string | undefined => {
    if (!touched[field]) return undefined;
    const errs = fieldErrors[field];
    return errs && errs.length > 0 ? errs[0] : undefined;
  };

  const fieldClass = (field: string) => {
    const hasError = touched[field] && fieldErrors[field]?.length;
    return `input-field ${hasError ? 'border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('hospitalAdmin.receptionist.title')}</h1>
          <p className="text-gray-500 text-sm">{t('hospitalAdmin.receptionist.staffCount', { count: staff.length })}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#1D75DB' }}>
          <UserPlus size={16} /> {t('hospitalAdmin.receptionist.addButton')}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[t('hospitalAdmin.receptionist.colStaff'), t('hospitalAdmin.receptionist.colEmail'), t('hospitalAdmin.receptionist.colPhone'), t('hospitalAdmin.receptionist.colRole'), t('hospitalAdmin.receptionist.colStatus')].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : staff.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">{t('hospitalAdmin.receptionist.noStaff')}</td></tr>
              ) : staff.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(s.name || s.first_name || '?').charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-900">{s.name || `${s.first_name || ''} ${s.last_name || ''}`}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 text-xs">{s.email || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">{s.phone_number || s.phone || '—'}</td>
                  <td className="p-4">
                    <span className={`badge text-xs capitalize ${roleColors[s.role] || 'bg-gray-100 text-gray-600'}`}>
                      {s.role?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    {s.is_active !== false ? (
                      <span className="badge bg-green-100 text-green-700 text-xs">{t('hospitalAdmin.receptionist.active')}</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-700 text-xs">{t('hospitalAdmin.receptionist.inactive')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">{t('hospitalAdmin.receptionist.addTitle')}</h2>
              <button onClick={() => { setShowAdd(false); resetForm(); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.receptionist.firstNameLabel')}</label>
                  <input className={fieldClass('first_name')} placeholder={t('hospitalAdmin.receptionist.firstNamePlaceholder')} value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} onBlur={() => handleBlur('first_name')} />
                  {getFieldError('first_name') && <p className="text-[11px] text-red-500 mt-1 font-medium">{getFieldError('first_name')}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.receptionist.lastNameLabel')}</label>
                  <input className={fieldClass('last_name')} placeholder={t('hospitalAdmin.receptionist.lastNamePlaceholder')} value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} onBlur={() => handleBlur('last_name')} />
                  {getFieldError('last_name') && <p className="text-[11px] text-red-500 mt-1 font-medium">{getFieldError('last_name')}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.receptionist.emailLabel')}</label>
                <input className={fieldClass('email')} type="email" placeholder={t('hospitalAdmin.receptionist.emailPlaceholder')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} onBlur={() => handleBlur('email')} />
                {getFieldError('email') && <p className="text-[11px] text-red-500 mt-1 font-medium">{getFieldError('email')}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.receptionist.phoneLabel')}</label>
                <InputPhone
                  value={form.phone_number}
                  onChange={(value) => setForm(p => ({ ...p, phone_number: value || '' }))}
                  defaultCountry="CM"
                  placeholder={t('hospitalAdmin.receptionist.phonePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.receptionist.passwordLabel')}</label>
                  <div className="relative">
                    <input className={`${fieldClass('password')} pr-10`} type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} onBlur={() => handleBlur('password')} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {getFieldError('password') && <p className="text-[11px] text-red-500 mt-1 font-medium">{getFieldError('password')}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.receptionist.confirmLabel')}</label>
                  <div className="relative">
                    <input className={`${fieldClass('password2')} pr-10`} type={showPassword2 ? 'text' : 'password'} value={form.password2} onChange={e => setForm(p => ({ ...p, password2: e.target.value }))} onBlur={() => handleBlur('password2')} />
                    <button type="button" onClick={() => setShowPassword2(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword2 ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {getFieldError('password2') && <p className="text-[11px] text-red-500 mt-1 font-medium">{getFieldError('password2')}</p>}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-3">{t('hospitalAdmin.receptionist.nationalIdOptional')}</p>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('hospitalAdmin.receptionist.nationalIdLabel')}</label>
                  <input className="input-field" placeholder={t('hospitalAdmin.receptionist.nationalIdPlaceholder')} value={form.national_id_number} onChange={e => setForm(p => ({ ...p, national_id_number: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <FileUpload value={frontFile} onChange={setFrontFile} accept="image/*" label={t('hospitalAdmin.receptionist.frontIdImage')} />
                  <FileUpload value={backFile} onChange={setBackFile} accept="image/*" label={t('hospitalAdmin.receptionist.backIdImage')} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={() => { setShowAdd(false); resetForm(); }}>{t('hospitalAdmin.receptionist.cancel')}</button>
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#1D75DB' }} onClick={handleAdd} disabled={submitting}>
                {submitting ? t('hospitalAdmin.receptionist.adding') : t('hospitalAdmin.receptionist.addButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
