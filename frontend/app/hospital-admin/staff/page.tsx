'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, UserX, UserCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';

type Hospital = {
  id: string;
  name: string;
};

type StaffMember = {
  id: string;
  hospitalId: string;
  name: string;
  role: 'receptionist' | 'nurse' | 'hospital_admin';
  staffId: string;
  status: 'active' | 'inactive';
  lastActive: string;
};

const staffMembers: StaffMember[] = [
  { id: 'staff-1', hospitalId: 'hospital-default', name: 'Brigitte Talla', role: 'receptionist', staffId: 'HS-001', status: 'active', lastActive: '2 hrs ago' },
  { id: 'staff-2', hospitalId: 'hospital-default', name: 'Nurse Emmanuel', role: 'nurse', staffId: 'HS-002', status: 'active', lastActive: 'Yesterday' },
  { id: 'staff-3', hospitalId: 'hospital-default', name: 'Dr. Mireille Ondoa', role: 'hospital_admin', staffId: 'HS-003', status: 'active', lastActive: '2 days ago' },
];

const defaultHospital: Hospital = {
  id: 'hospital-default',
  name: 'Hôpital de la Paix',
};

export default function HospitalStaff() {
  const { showToast } = useStore();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'receptionist', email: '' });
  const roleColors: Record<string, string> = { receptionist: 'var(--primary)', nurse: 'var(--success)', hospital_admin: '#471DDB' };

  useEffect(() => {
    async function loadHospitals() {
      try {
        const res = await fetch('/api/hospitals/');
        if (!res.ok) return;
        const data = await res.json();
        setHospitals(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadHospitals();
  }, []);

  const hospital = hospitals[0] ?? defaultHospital;
  const myStaff = staffMembers.filter((s) => s.hospitalId === hospital.id);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: 'var(--secondary)' }}>
        <div className="flex items-center gap-3"><span className="text-xl">👥</span><p className="font-black text-sm text-white">Staff Management</p></div>
        <div className="flex gap-4 text-white opacity-70 text-xs"><Link href="/hospital-admin/dashboard" className="hover:opacity-100">Dashboard</Link><Link href="/hospital-admin/transactions" className="hover:opacity-100">Transactions</Link></div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-black text-gray-900">Staff Members</h1><p className="text-gray-500 text-sm">{hospital.name} · {myStaff.length} accounts</p></div>
          <button className="btn-secondary text-sm" onClick={() => setShowInvite(!showInvite)}><Plus size={16} /> Invite Staff</button>
        </div>
        {showInvite && (
          <div className="card p-5 mb-6 animate-fade-up" style={{ border: '1px solid rgba(29,177,219,0.3)' }}>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Invite New Staff Member</h3>
            <div className="grid gap-3">
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label><input className="input-field" placeholder="e.g. Dr. Amina Bello" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Role *</label><select className="input-field" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as typeof form.role }))}><option value="receptionist">Receptionist</option><option value="nurse">Nurse</option><option value="hospital_admin">Hospital Admin</option></select></div>
              <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Email / Phone</label><input className="input-field" placeholder="email or phone number" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div className="flex gap-3"><button className="btn-primary text-sm" onClick={() => { showToast(`Invitation sent to ${form.name || 'new staff'}! 📧`, 'success'); setShowInvite(false); }}>Send Invitation</button><button className="btn-outline text-sm" onClick={() => setShowInvite(false)}>Cancel</button></div>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {myStaff.map((s) => (
            <div key={s.id} className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0" style={{ background: roleColors[s.role] || 'var(--primary)' }}>{s.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><p className="font-bold text-gray-900">{s.name}</p><span className="badge bg-gray-100 text-gray-600 text-xs capitalize">{s.role.replace('_', ' ')}</span></div>
                <p className="text-xs text-gray-500">Staff ID: {s.staffId} · Last active: {s.lastActive}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge text-xs ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                {s.status === 'active' ? <button className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium" onClick={() => showToast(`${s.name} deactivated`, 'error')}><UserX size={14} /> Deactivate</button> : <button className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--success)' }} onClick={() => showToast(`${s.name} reactivated`, 'success')}><UserCheck size={14} /> Activate</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="card p-5 mt-6">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Recent Staff Activity</h3>
          <div className="space-y-3 text-sm">
            {[
              { name: 'Brigitte Talla', action: 'Validated voucher JF9M4P', time: '2 hrs ago' },
              { name: 'Nurse Emmanuel', action: 'Confirmed PIN for Mama Rosine', time: 'Yesterday' },
              { name: 'Dr. Mireille Ondoa', action: 'Generated monthly report', time: '2 days ago' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{a.name.charAt(0)}</div>
                <div className="flex-1"><span className="font-medium text-gray-900">{a.name}</span><span className="text-gray-500"> {a.action}</span></div>
                <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
