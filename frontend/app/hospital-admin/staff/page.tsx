'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Users, TrendingUp, UserPlus, X } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/hospital-admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Medical Claims', href: '/hospital-admin/claims', icon: <FileText size={16} /> },
  { label: 'Top-Up Requests', href: '/hospital-admin/top-up', icon: <TrendingUp size={16} /> },
  { label: 'Staff', href: '/hospital-admin/staff', icon: <Users size={16} /> },
  { label: 'Transactions', href: '/hospital-admin/transactions', icon: <TrendingUp size={16} /> },
];

const roleColors: Record<string, string> = {
  receptionist: 'bg-blue-100 text-blue-700',
  nurse: 'bg-emerald-100 text-emerald-700',
  hospital_admin: 'bg-purple-100 text-purple-700',
};

export default function HospitalStaff() {
  const { showToast } = useStore();
  const [receptionists, setReceptionists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addRole, setAddRole] = useState<'receptionist'>('receptionist');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '', password: '', password2: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/api/accounts/receptionists/');
      setReceptionists(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.first_name || !form.email || !form.password) {
      showToast('First name, email, and password are required', 'error');
      return;
    }
    if (form.password !== form.password2) { showToast('Passwords do not match', 'error'); return; }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/accounts/receptionists/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast('Staff member added', 'success');
      setShowAdd(false);
      setForm({ first_name: '', last_name: '', email: '', phone_number: '', password: '', password2: '' });
      load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to add staff member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const allStaff = [
    ...receptionists.map(s => ({ ...s, role: 'receptionist' })),
  ];

  return (
    <DashboardShell navItems={NAV} accentColor="#1D75DB" brandLabel="Hospital Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm">{allStaff.length} staff members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-secondary text-sm flex items-center gap-2">
          <UserPlus size={16} /> Add Staff
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Staff Member', 'Email', 'Phone', 'Role', 'Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : allStaff.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No staff members yet</td></tr>
              ) : allStaff.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(s.first_name || '?').charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-900">{s.first_name} {s.last_name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600 text-xs">{s.email || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">{s.phone_number || s.phone || '—'}</td>
                  <td className="p-4">
                    <span className={`badge text-xs capitalize ${roleColors[s.role] || 'bg-gray-100 text-gray-600'}`}>
                      {s.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="badge bg-emerald-100 text-emerald-700 text-xs">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Add Staff Member</h2>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">First Name *</label>
                  <input className="input-field" placeholder="First name" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Last Name</label>
                  <input className="input-field" placeholder="Last name" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Email *</label>
                <input className="input-field" type="email" placeholder="staff@hospital.cm" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label>
                <input className="input-field" type="tel" value={form.phone_number} onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Password *</label>
                  <input className="input-field" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Confirm *</label>
                  <input className="input-field" type="password" value={form.password2} onChange={e => setForm(p => ({ ...p, password2: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-secondary flex-1" onClick={handleAdd} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
