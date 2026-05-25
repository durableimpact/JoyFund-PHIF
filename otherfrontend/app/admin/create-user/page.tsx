'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Check, Upload } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { DJANGO_API_URL } from '@/lib/apiClient';

const NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',    icon: <LayoutDashboard size={16} /> },
  { label: 'Hospitals',    href: '/admin/hospitals',    icon: <Building2 size={16} /> },
  { label: 'Vouchers',     href: '/admin/vouchers',     icon: <Ticket size={16} /> },
  { label: 'Beneficiaries',href: '/admin/beneficiaries',icon: <Users size={16} /> },
  { label: 'Analytics',    href: '/admin/analytics',    icon: <BarChart2 size={16} /> },
  { label: 'Logs',         href: '/admin/logs',         icon: <FileText size={16} /> },
  { label: 'Create User',  href: '/admin/create-user',  icon: <Users size={16} /> },
];

const ROLES = [
  { value: 'donor',         label: 'Donor',         desc: 'Creates campaigns & donates' },
  { value: 'social_worker', label: 'Social Worker',  desc: 'Enrolls beneficiaries' },
  { value: 'hospital_admin',label: 'Hospital Admin', desc: 'Manages hospital portal' },
  { value: 'receptionist',  label: 'Receptionist',   desc: 'Validates vouchers at hospital' },
];

const CAMEROON_REGIONS = ['Adamawa','Centre','East','Far North','Littoral','North','North West','South','South West','West'];

const ENDPOINTS: Record<string, string> = {
  donor:          '/api/accounts/donors/register/',
  social_worker:  '/api/accounts/social-workers/',
  hospital_admin: '/api/accounts/hospital-admins/',
  receptionist:   '/api/accounts/receptionists/',
};

export default function AdminCreateUser() {
  const { accessToken, showToast } = useStore();
  const [role, setRole] = useState('donor');
  const [hospitals, setHospitals] = useState<any[]>([]);

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // Social Worker extras
  const [nationalId, setNationalId] = useState('');
  const [frontId, setFrontId] = useState<File | null>(null);
  const [backId, setBackId] = useState<File | null>(null);
  const [organization, setOrganization] = useState('');
  const [regionAssigned, setRegionAssigned] = useState('');

  // Hospital Admin extras
  const [hospitalId, setHospitalId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role === 'hospital_admin' || role === 'receptionist') {
      fetch(`${DJANGO_API_URL}/api/hospitals/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(r => r.json())
        .then(d => setHospitals(Array.isArray(d) ? d : d.results || []))
        .catch(() => {});
    }
  }, [role, accessToken]);

  const handleSubmit = async () => {
    setError('');
    if (!firstName || !email || !password) { setError('First name, email, and password are required'); return; }
    if (password !== password2) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    // Social worker & hospital admin need national ID images
    if ((role === 'social_worker' || role === 'hospital_admin') && (!nationalId || !frontId || !backId)) {
      setError('National ID number and both ID images are required for this role');
      return;
    }
    if (role === 'social_worker' && (!organization || !regionAssigned)) {
      setError('Organization and region assigned are required for Social Worker');
      return;
    }

    setSubmitting(true);
    try {
      let response: Response;
      const endpoint = ENDPOINTS[role];

      if (role === 'social_worker' || role === 'hospital_admin') {
        // multipart/form-data for file uploads
        const fd = new FormData();
        fd.append('first_name', firstName);
        fd.append('last_name', lastName);
        fd.append('email', email);
        fd.append('phone_number', phone);
        fd.append('password', password);
        fd.append('national_id_number', nationalId);
        if (frontId) fd.append('front_national_id_image', frontId);
        if (backId) fd.append('back_national_id_image', backId);
        if (role === 'social_worker') {
          fd.append('organization', organization);
          fd.append('region_assigned', regionAssigned);
        }
        if (role === 'hospital_admin' && hospitalId) {
          fd.append('hospital', hospitalId);
        }
        response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: fd,
        });
      } else {
        // JSON for donor and receptionist
        const payload: any = {
          first_name: firstName, last_name: lastName,
          email, phone_number: phone,
          password, password2: password,
        };
        if (role === 'receptionist' && hospitalId) payload.hospital = hospitalId;
        response = await fetch(`${DJANGO_API_URL}${endpoint}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      if (!response.ok) {
        const msg = data.detail || data.email?.[0] || data.phone_number?.[0] || JSON.stringify(data);
        throw new Error(msg);
      }
      setCreated({ ...data, role });
      showToast(`${ROLES.find(r => r.value === role)?.label} account created!`, 'success');
    } catch (e: any) {
      setError(e?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="max-w-lg">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#471DDB' }}>
            <Check size={28} />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 text-sm mb-5">
            {created.first_name || firstName} {created.last_name || lastName} is now registered as a <strong>{ROLES.find(r => r.value === role)?.label}</strong>.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2 mb-5">
            {[['Email', email], ['Role', ROLES.find(r => r.value === role)?.label]].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-gray-500">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={() => {
              setCreated(null);
              setFirstName(''); setLastName(''); setEmail(''); setPhone('');
              setPassword(''); setPassword2(''); setNationalId('');
              setFrontId(null); setBackId(null); setOrganization('');
              setRegionAssigned(''); setHospitalId(''); setError('');
            }}>Create Another</button>
            <a href="/admin/dashboard" className="btn-admin flex-1 text-center text-sm py-2.5">Dashboard</a>
          </div>
        </div>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Create User Account</h1>
          <p className="text-gray-500 text-sm">Add a new platform user</p>
        </div>

        <div className="card p-6 space-y-5">
          {/* Role picker */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => { setRole(r.value); setError(''); }}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${role === r.value ? 'text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={role === r.value ? { background: '#471DDB', borderColor: '#471DDB' } : {}}>
                  <div className={`font-bold text-sm ${role === r.value ? 'text-white' : 'text-gray-900'}`}>{r.label}</div>
                  <div className={`text-xs mt-0.5 ${role === r.value ? 'text-white/75' : 'text-gray-500'}`}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

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

          {/* Social Worker extras */}
          {(role === 'social_worker' || role === 'hospital_admin') && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">ID Verification (required)</p>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">National ID Number *</label>
                <input className="input-field" placeholder="e.g. NID-123456 or CNI number" value={nationalId} onChange={e => setNationalId(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Front of ID *</label>
                  <label className={`flex items-center gap-2 border-2 border-dashed rounded-xl p-3 cursor-pointer transition-colors ${frontId ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Upload size={16} className={frontId ? 'text-emerald-500' : 'text-gray-400'} />
                    <span className="text-xs text-gray-600 truncate">{frontId ? frontId.name : 'Upload front image'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setFrontId(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Back of ID *</label>
                  <label className={`flex items-center gap-2 border-2 border-dashed rounded-xl p-3 cursor-pointer transition-colors ${backId ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Upload size={16} className={backId ? 'text-emerald-500' : 'text-gray-400'} />
                    <span className="text-xs text-gray-600 truncate">{backId ? backId.name : 'Upload back image'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => setBackId(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>
          )}

          {role === 'social_worker' && (
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

          {(role === 'hospital_admin' || role === 'receptionist') && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Hospital {role === 'receptionist' ? '(optional)' : '(optional)'}
              </label>
              <select className="input-field" value={hospitalId} onChange={e => setHospitalId(e.target.value)}>
                <option value="">— Select Hospital —</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
              </select>
              {hospitals.length === 0 && <p className="text-xs text-gray-400 mt-1">No hospitals loaded yet</p>}
            </div>
          )}

          <button className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-60"
            style={{ background: '#471DDB' }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : `Create ${ROLES.find(r => r.value === role)?.label}`}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
