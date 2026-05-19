'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';
import { formatXAF, statusColor, statusLabel } from '@/lib/utils';
import { useStore } from '@/store/useStore';

type Hospital = {
  id: string;
  name: string;
  region: string;
  address: string;
  momoAccount: string;
  contact: string;
  accreditationNumber: string;
  status: string;
  vouchersRedeemed: number;
  totalPaidOutXAF: number;
  lastActivity: string;
};

export default function AdminHospitals() {
  const { showToast } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [form, setForm] = useState({ name: '', region: '', address: '', momo: '', contact: '', accreditation: '' });

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

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: '#471DDB' }}>
        <div className="flex items-center gap-3"><span className="text-xl">🏥</span><p className="font-black text-sm text-white">Hospital Partner Management</p></div>
        <div className="flex gap-4 text-white opacity-70 text-xs"><Link href="/admin/dashboard" className="hover:opacity-100">Dashboard</Link><Link href="/admin/vouchers" className="hover:opacity-100">Vouchers</Link><Link href="/admin/analytics" className="hover:opacity-100">Analytics</Link></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-black text-gray-900">Partner Hospitals</h1><p className="text-gray-500 text-sm">{hospitals.length} hospitals, {hospitals.filter((h) => h.status === 'active').length} active</p></div>
          <button className="btn-admin text-sm" onClick={() => setShowAdd(!showAdd)}><Plus size={16} /> Add Hospital</button>
        </div>
        {showAdd && (
          <div className="card p-6 mb-6 animate-fade-up" style={{ border: '1px solid rgba(71,29,219,0.2)' }}>
            <h3 className="font-bold text-gray-900 mb-4">New Hospital Partner</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[{ k: 'name', l: 'Hospital Name *', ph: 'e.g. Clinique La Paix' }, { k: 'region', l: 'Region *', ph: 'e.g. Centre' }, { k: 'address', l: 'Address', ph: 'e.g. Akwa, Douala' }, { k: 'momo', l: 'MoMo Number *', ph: 'MTN-677XXXXXX' }, { k: 'contact', l: 'Contact', ph: 'Dr. Full Name' }, { k: 'accreditation', l: 'MINSANTE #', ph: 'MIN-XXXX-XXXX' }].map((f) => (
                <div key={f.k}><label className="text-xs font-semibold text-gray-500 mb-1 block">{f.l}</label><input className="input-field" placeholder={f.ph} value={form[f.k as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [f.k]: e.target.value }))} /></div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button className="btn-admin" onClick={() => { showToast('Hospital added! Welcome email sent.', 'success'); setShowAdd(false); }}>Add Hospital</button>
              <button className="btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {hospitals.map((h) => (
            <div key={h.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(71,29,219,0.1)' }}><Building2 size={20} style={{ color: '#471DDB' }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-gray-900">{h.name}</h3><span className={`badge ${statusColor(h.status)}`}>{statusLabel(h.status)}</span></div>
                  <p className="text-xs text-gray-500">{h.region} · {h.address} · {h.contact}</p>
                  <p className="text-xs text-gray-400">MoMo: {h.momoAccount} · MINSANTE: {h.accreditationNumber}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><div className="font-black text-lg" style={{ color: '#471DDB' }}>{h.vouchersRedeemed}</div><div className="text-xs text-gray-400">Vouchers</div></div>
                  <div><div className="font-black text-sm" style={{ color: 'var(--primary)' }}>{formatXAF(h.totalPaidOutXAF)}</div><div className="text-xs text-gray-400">Paid Out</div></div>
                  <div><div className="font-black text-xs text-gray-600">{h.lastActivity}</div><div className="text-xs text-gray-400">Last Active</div></div>
                </div>
                <div className="flex gap-2">
                  {h.status === 'pending' && <button className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white" style={{ background: 'var(--success)' }} onClick={() => showToast(`${h.name} activated!`, 'success')}>Activate</button>}
                  {h.status === 'active' && <button className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 text-red-600" onClick={() => showToast(`${h.name} suspended`, 'error')}>Suspend</button>}
                </div>
              </div>
            </div>
          ))}
          {hospitals.length === 0 && <div className="card p-6 text-center text-gray-500">No partner hospitals available yet.</div>}
        </div>
      </div>
    </div>
  );
}
