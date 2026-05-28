'use client';
import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, X, Upload, FileText } from 'lucide-react';
import { listReceptionists, createReceptionistAccount } from '@/actions/accounts';
import { getHospitalStaff } from '@/actions/hospital';

const roleColors: Record<string, string> = {
  receptionist: 'bg-blue-100 text-blue-700',
  hospital_admin: 'bg-purple-100 text-purple-700',
};

export default function HospitalStaff() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const hospitalId = currentUser?.hospital?.id;
  const queryClient = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', password2: '',
    national_id_number: '',
  });
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

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
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('email', form.email);
      fd.append('password', form.password);
      fd.append('first_name', form.first_name);
      fd.append('last_name', form.last_name);
      fd.append('phone_number', form.phone_number);
      if (form.national_id_number) fd.append('national_id_number', form.national_id_number);
      if (frontFile) fd.append('front_national_id_image', frontFile);
      if (backFile) fd.append('back_national_id_image', backFile);
      return createReceptionistAccount(token, fd);
    },
    onSuccess: () => {
      setShowAdd(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['ha-staff'] });
    },
  });

  const handleAdd = () => {
    if (!form.first_name || !form.email || !form.password) return;
    if (form.password !== form.password2) return;
    setSubmitting(true);
    createMutation.mutate(undefined, {
      onSettled: () => setSubmitting(false),
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Receptionists</h1>
          <p className="text-gray-500 text-sm">{staff.length} staff members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#1D75DB' }}>
          <UserPlus size={16} /> Add Receptionist
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
              {isLoading ? [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : staff.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No staff members yet</td></tr>
              ) : staff.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
                      <span className="badge bg-green-100 text-green-700 text-xs">Active</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-700 text-xs">Inactive</span>
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
              <h2 className="text-lg font-black text-gray-900">Add Receptionist</h2>
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

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400 mb-3">National ID (optional)</p>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">National ID Number</label>
                  <input className="input-field" placeholder="e.g. 123456789" value={form.national_id_number} onChange={e => setForm(p => ({ ...p, national_id_number: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Front ID Image</label>
                    <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={e => setFrontFile(e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => frontRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-[#1D75DB] transition-colors">
                      {frontFile ? (
                        <div className="flex items-center gap-2 justify-center text-xs text-gray-700">
                          <FileText size={14} /> {frontFile.name}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                          <Upload size={14} /> Upload front
                        </div>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Back ID Image</label>
                    <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={e => setBackFile(e.target.files?.[0] || null)} />
                    <button type="button" onClick={() => backRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-xl p-3 text-center hover:border-[#1D75DB] transition-colors">
                      {backFile ? (
                        <div className="flex items-center gap-2 justify-center text-xs text-gray-700">
                          <FileText size={14} /> {backFile.name}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                          <Upload size={14} /> Upload back
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {createMutation.isError && (
              <p className="text-red-500 text-xs mt-3">{(createMutation.error as any)?.message || 'Failed to add receptionist'}</p>
            )}
            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#1D75DB' }} onClick={handleAdd} disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Receptionist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
