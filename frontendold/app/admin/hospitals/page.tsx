'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Building2, Ticket, BarChart2,
  FileText, Plus, Search, X, MapPin, Phone
} from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { statusColor, statusLabel } from '@/lib/utils';
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

type Hospital = {
  id: string;
  name: string;
  region: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  accreditation_number?: string;
  status: string;
  created_at?: string;
};

const emptyForm = {
  name: '', region: '', city: '', address: '',
  phone: '', email: '', accreditation_number: '',
};

export default function AdminHospitals() {
  const { showToast } = useStore();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/api/hospitals/');
      setHospitals(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast('Failed to load hospitals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    (h.region || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name || !form.region || !form.city || !form.address) {
      showToast('Name, region, city, and address are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/hospitals/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast('Hospital added successfully', 'success');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to add hospital', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Partner Hospitals</h1>
          <p className="text-gray-500 text-sm">{hospitals.length} registered hospitals</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-admin text-sm flex items-center gap-2">
          <Plus size={16} /> Add Hospital
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-10"
          placeholder="Search by name, region, city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Hospital', 'Location', 'Contact', 'Accreditation', 'Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                    No hospitals found
                  </td>
                </tr>
              ) : filtered.map(h => (
                <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: '#471DDB' }}>
                        {h.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-900">{h.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <MapPin size={12} /> {h.city}, {h.region}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{h.address}</p>
                  </td>
                  <td className="p-4">
                    {h.phone && <div className="flex items-center gap-1 text-xs text-gray-600"><Phone size={12} />{h.phone}</div>}
                    {h.email && <p className="text-xs text-gray-400">{h.email}</p>}
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-600">{h.accreditation_number || '—'}</td>
                  <td className="p-4">
                    <span className={`badge ${statusColor(h.status || 'active')}`}>
                      {statusLabel(h.status || 'active')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Hospital Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Add New Hospital</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Hospital Name *', placeholder: 'e.g. Hôpital Central de Yaoundé' },
                { key: 'region', label: 'Region *', placeholder: 'e.g. Centre' },
                { key: 'city', label: 'City *', placeholder: 'e.g. Yaoundé' },
                { key: 'address', label: 'Address *', placeholder: 'e.g. Rue Joseph Mballa Eloumden' },
                { key: 'phone', label: 'Phone', placeholder: 'e.g. +237 6XX XXX XXX' },
                { key: 'email', label: 'Email', placeholder: 'hospital@example.com' },
                { key: 'accreditation_number', label: 'MINSANTE Accreditation No.', placeholder: 'e.g. MIN-1234-5678' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                  <input
                    className="input-field"
                    placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-outline flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="flex-1 text-sm font-bold py-2.5 rounded-xl text-white transition-all"
                style={{ background: '#471DDB' }}
                onClick={handleCreate}
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add Hospital'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
