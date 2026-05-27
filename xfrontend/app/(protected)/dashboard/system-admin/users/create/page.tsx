'use client';
import { Check, Upload } from 'lucide-react';
  HospitalCombobox
  createHospitalAdminAccount,
  createSocialWorkerAccount,
  createReceptionistAccount,
  createDonorAccount,
} from '@/actions/accounts';

const ROLES = [
  { value: 'SYSTEM_ADMIN',    label: 'System Admin',    desc: 'Full platform access' },
  { value: 'HOSPITAL_ADMIN',  label: 'Hospital Admin',  desc: 'Manages hospital portal' },
  { value: 'SOCIAL_WORKER',   label: 'Social Worker',   desc: 'Enrolls beneficiaries' },
  { value: 'RECEPTIONIST',    label: 'Receptionist',    desc: 'Validates vouchers at hospital' },
  { value: 'DONOR',           label: 'Donor',           desc: 'Creates campaigns & donates' },
] as const;

const CAMEROON_REGIONS = ['Adamawa','Centre','East','Far North','Littoral','North','North West','South','South West','West'];

type RoleValue = typeof ROLES[number]['value'];

export default function AdminCreateUser() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [role, setRole] = useState<RoleValue>('DONOR');

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // ID verification fields (Social Worker & Hospital Admin)
  const [nationalId, setNationalId] = useState('');
  const [frontId, setFrontId] = useState<File | null>(null);
  const [backId, setBackId] = useState<File | null>(null);

  // Social Worker extras
  const [organization, setOrganization] = useState('');
  const [regionAssigned, setRegionAssigned] = useState('');

  // Hospital selection
  const [hospitalId, setHospitalId] = useState('');

  const [created, setCreated] = useState<any>(null);
  const [error, setError] = useState('');

  const createUserMutation = useMutation({
    mutationFn: async () => {
      setError('');

      if (!firstName || !email || !password) {
        setError('First name, email, and password are required');
        throw new Error('');
      }
      if (password !== password2) {
        setError('Passwords do not match');
        throw new Error('');
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        throw new Error('');
      }

      const isStaffRole = role === 'SOCIAL_WORKER' || role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST';

      if (isStaffRole && (!nationalId || !frontId || !backId)) {
        setError('National ID number and both ID images are required for this role');
        throw new Error('');
      }
      if (role === 'SOCIAL_WORKER' && (!organization || !regionAssigned)) {
        setError('Organization and region assigned are required for Social Worker');
        throw new Error('');
      }

      const baseData: SystemAdminRegister = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
      };

      // System Admin — simple JSON
      if (role === 'SYSTEM_ADMIN') {
        return await createSystemAdminAccount(token, baseData);
      }

      // Donor — simple JSON
      if (role === 'DONOR') {
        return await createDonorAccount(baseData);
      }

      // Staff roles — multipart/form-data
      const fd = new FormData();
      fd.append('first_name', firstName);
      fd.append('last_name', lastName);
      fd.append('email', email);
      fd.append('phone_number', phone);
      fd.append('password', password);
      fd.append('national_id_number', nationalId);
      if (frontId) fd.append('front_national_id_image', frontId);
      if (backId) fd.append('back_national_id_image', backId);

      if (role === 'SOCIAL_WORKER') {
        fd.append('organization', organization);
        fd.append('region_assigned', regionAssigned);
        return await createSocialWorkerAccount(token, fd);
      }

      if (hospitalId) fd.append('hospital', hospitalId);

      if (role === 'HOSPITAL_ADMIN') {
        return await createHospitalAdminAccount(token, fd);
      }

      if (role === 'RECEPTIONIST') {
        return await createReceptionistAccount(token, fd);
      }

      throw new Error('Unknown role');
    },
    onSuccess: (data: any) => {
      setCreated(data);
    },
    onError: (e: any) => {
      if (e?.message && e.message !== '') setError(e.message);
      else {
        try {
          const parsed = JSON.parse(e?.toString?.() || '');
          const msg = parsed.detail || parsed.email?.[0] || parsed.phone_number?.[0] || JSON.stringify(parsed);
          setError(msg);
        } catch {
          setError('Failed to create user. Check the console for details.');
        }
      }
    },
  });

  if (created) return (<>

          <div className="max-w-lg">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#471DDB' }}>
            <Check size={28} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 text-sm mb-5">
            {firstName} {lastName} is now registered as a <strong>{ROLES.find(r => r.value === role)?.label}</strong>.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2 mb-5">
            {[['Email', email], ['Phone', phone || '—'], ['Role', ROLES.find(r => r.value === role)?.label]].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <button
            className="btn-admin w-full text-sm py-2.5"
            style={{ background: '#471DDB' }}
            onClick={() => {
              setCreated(null);
              setFirstName(''); setLastName(''); setEmail(''); setPhone('');
              setPassword(''); setPassword2(''); setNationalId('');
              setFrontId(null); setBackId(null); setOrganization('');
              setRegionAssigned(''); setHospitalId(''); setError('');
            }}
          >
            Create Another
          </button>
        </div>
      </div>
    
  
</>
);

  return (

          <div className="max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Create User Account</h1>
          <p className="text-gray-500 text-sm">Add a new platform user</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Role picker */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Role *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => { setRole(r.value); setError(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${role === r.value ? 'text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={role === r.value ? { background: '#471DDB', borderColor: '#471DDB' } : {}}>
                  <div className={`font-bold text-xs ${role === r.value ? 'text-white' : 'text-gray-900'}`}>{r.label}</div>
                  <div className={`text-[10px] mt-0.5 ${role === r.value ? 'text-white/75' : 'text-gray-500'}`}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">First Name *</label>
              <input className="input-field" placeholder="Jean-Pierre" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Last Name</label>
              <input className="input-field" placeholder="Mbarga" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
            <input className="input-field" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone <span className="font-normal text-gray-400">e.g. +237650537465</span></label>
            <input className="input-field" type="tel" placeholder="+237 6XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Password * <span className="font-normal text-gray-400">(min 8 chars)</span></label>
              <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirm Password *</label>
              <input className="input-field" type="password" placeholder="••••••••" value={password2} onChange={e => setPassword2(e.target.value)} />
            </div>
          </div>

          {/* ID Verification (staff roles) */}
          {(role === 'SOCIAL_WORKER' || role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST') && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">ID Verification (required)</p>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">National ID Number *</label>
                <input className="input-field" placeholder="e.g. NID-123456" value={nationalId} onChange={e => setNationalId(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Front of ID *</label>
                  <label className={`flex items-center gap-2 border-2 border-dashed rounded-xl p-3 cursor-pointer transition-colors ${frontId ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Upload size={16} className={frontId ? 'text-emerald-500' : 'text-gray-400'} />
                    <span className="text-xs text-gray-600 truncate">{frontId ? frontId.name : 'Upload front'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setFrontId(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Back of ID *</label>
                  <label className={`flex items-center gap-2 border-2 border-dashed rounded-xl p-3 cursor-pointer transition-colors ${backId ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Upload size={16} className={backId ? 'text-emerald-500' : 'text-gray-400'} />
                    <span className="text-xs text-gray-600 truncate">{backId ? backId.name : 'Upload back'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setBackId(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Social Worker extras */}
          {role === 'SOCIAL_WORKER' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Organization *</label>
                <input className="input-field" placeholder="e.g. Ministry of Social Affairs" value={organization} onChange={e => setOrganization(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Region Assigned *</label>
                <select className="input-field" value={regionAssigned} onChange={e => setRegionAssigned(e.target.value)}>
                  <option value="">— Select Region —</option>
                  {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Hospital selection for Hospital Admin & Receptionist */}
          {(role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST') && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Hospital {role === 'RECEPTIONIST' ? '(optional)' : '(optional)'}</label>
              <HospitalCombobox value={hospitalId} onChange={setHospitalId} />
            </div>
          )}

          <button
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-60"
            style={{ background: '#471DDB' }}
            onClick={() => createUserMutation.mutate()}
            disabled={createUserMutation.isPending}
          >
            {createUserMutation.isPending ? 'Creating…' : `Create ${ROLES.find(r => r.value === role)?.label}`}
          </button>
        </div>
      </div>
    
  )
;
}
