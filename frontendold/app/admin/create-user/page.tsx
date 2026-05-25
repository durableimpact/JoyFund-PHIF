'use client';
import { useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Check } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Hospitals', href: '/admin/hospitals', icon: <Building2 size={16} /> },
  { label: 'Vouchers', href: '/admin/vouchers', icon: <Ticket size={16} /> },
  { label: 'Beneficiaries', href: '/admin/beneficiaries', icon: <Users size={16} /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart2 size={16} /> },
  { label: 'Logs', href: '/admin/logs', icon: <FileText size={16} /> },
  { label: 'Create User', href: '/admin/create-user', icon: <Users size={16} /> },
];

const ROLE_OPTIONS = [
  { value: 'donor', label: 'Donor', desc: 'Can create campaigns and donate' },
  { value: 'social_worker', label: 'Social Worker', desc: 'Enrolls beneficiaries' },
  { value: 'hospital_admin', label: 'Hospital Admin', desc: 'Manages hospital portal' },
  { value: 'receptionist', label: 'Receptionist', desc: 'Validates vouchers at hospital' },
];

const emptyForm = {
  first_name: '', last_name: '', email: '', phone_number: '',
  password: '', password2: '', role: 'donor',
};

export default function AdminCreateUser() {
  const { showToast } = useStore();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<any>(null);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const ENDPOINT_MAP: Record<string, string> = {
    donor: '/api/accounts/donors/register/',
    social_worker: '/api/accounts/social-workers/',
    hospital_admin: '/api/accounts/hospital-admins/',
    receptionist: '/api/accounts/receptionists/',
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (form.password !== form.password2) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = ENDPOINT_MAP[form.role];
      const payload: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number || undefined,
        password: form.password,
        password2: form.password2,
      };
      const data = await authenticatedFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCreated(data);
      showToast(`${form.role.replace('_', ' ')} account created!`, 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to create user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Create User Account</h1>
          <p className="text-gray-500 text-sm">Add a new platform user with a specific role</p>
        </div>

        {created ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#471DDB' }}>
              <Check size={28} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Account Created!</h2>
            <p className="text-gray-500 text-sm mb-6">
              {created.first_name || form.first_name} {created.last_name || form.last_name} has been registered as a{' '}
              <strong>{form.role.replace('_', ' ')}</strong>.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm mb-6">
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-mono">{form.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-semibold capitalize">{form.role.replace('_',' ')}</span></div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 btn-outline" onClick={() => { setCreated(null); setForm(emptyForm); }}>Create Another</button>
              <a href="/admin/dashboard" className="flex-1 text-sm font-bold py-2.5 rounded-xl text-white text-center" style={{ background: '#471DDB' }}>
                Back to Dashboard
              </a>
            </div>
          </div>
        ) : (
          <div className="card p-6 space-y-5">
            {/* Role picker */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Role *</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => set('role', r.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${form.role === r.value ? 'text-white' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    style={form.role === r.value ? { background: '#471DDB', borderColor: '#471DDB' } : {}}
                  >
                    <div className={`font-bold text-sm ${form.role === r.value ? 'text-white' : 'text-gray-900'}`}>{r.label}</div>
                    <div className={`text-xs mt-0.5 ${form.role === r.value ? 'text-white/75' : 'text-gray-500'}`}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">First Name *</label>
                <input className="input-field" placeholder="Jean-Pierre" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Last Name *</label>
                <input className="input-field" placeholder="Mbarga" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
              <input className="input-field" type="email" placeholder="user@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label>
              <input className="input-field" type="tel" placeholder="+237 6XX XXX XXX" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Password *</label>
                <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirm Password *</label>
                <input className="input-field" type="password" placeholder="••••••••" value={form.password2} onChange={e => set('password2', e.target.value)} />
              </div>
            </div>

            <button
              className="btn-admin w-full text-sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : `Create ${form.role.replace('_', ' ')} Account`}
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
