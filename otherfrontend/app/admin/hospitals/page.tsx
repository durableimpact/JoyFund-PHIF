'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Plus, Search, X, MapPin, Phone } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { statusColor, statusLabel } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard',    href: '/admin/dashboard',    icon: <LayoutDashboard size={16} /> },
  { label: 'Hospitals',    href: '/admin/hospitals',    icon: <Building2 size={16} /> },
  { label: 'Vouchers',     href: '/admin/vouchers',     icon: <Ticket size={16} /> },
  { label: 'Beneficiaries',href: '/admin/beneficiaries',icon: <Users size={16} /> },
  { label: 'Analytics',    href: '/admin/analytics',    icon: <BarChart2 size={16} /> },
  { label: 'Logs',         href: '/admin/logs',         icon: <FileText size={16} /> },
  { label: 'Create User',  href: '/admin/create-user',  icon: <Users size={16} /> },
];

const CAMEROON_REGIONS = ['Adamawa','Centre','East','Far North','Littoral','North','North West','South','South West','West'];

const emptyForm = {
  name: '', accreditation_number: '', licence_number: '',
  region: '', city: '', address: '', phone_number: '', email: '',
  website: '', momo_number: '', momo_name: '',
  orange_number: '', orange_name: '',
  bank_account_number: '', bank_account_name: '', bank_name: '', bank_branch: '',
};

export default function AdminHospitals() {
  const { showToast } = useStore();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab]             = useState<'basic' | 'payment'>('basic');

  const load = async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/api/hospitals/');
      setHospitals(Array.isArray(data) ? data : data.results || []);
    } catch { showToast('Failed to load hospitals', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = hospitals.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.region?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.name || !form.region || !form.city || !form.address || !form.phone_number || !form.email || !form.accreditation_number || !form.licence_number) {
      showToast('Name, accreditation no., licence no., region, city, address, phone, and email are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/hospitals/', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          website: form.website || undefined,
        }),
      });
      showToast('Hospital added successfully!', 'success');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (e: any) {
      showToast(e?.message || 'Failed to add hospital', 'error');
    } finally { setSubmitting(false); }
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

      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-10" placeholder="Search by name, region, city..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Hospital','Location','Contact','Accreditation','Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No hospitals found</td></tr>
              ) : filtered.map(h => (
                <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: '#471DDB' }}>
                        {h.name?.charAt(0)}
                      </div>
                      <span className="font-semibold text-gray-900">{h.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-gray-600 text-xs"><MapPin size={12} />{h.city}, {h.region}</div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{h.address}</p>
                  </td>
                  <td className="p-4">
                    {h.phone_number && <div className="flex items-center gap-1 text-xs text-gray-600"><Phone size={12} />{h.phone_number}</div>}
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{h.email}</p>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-600">{h.accreditation_number || '—'}</td>
                  <td className="p-4">
                    <span className={`badge ${statusColor(h.partnership_status || 'ACTIVE')}`}>
                      {statusLabel(h.partnership_status || 'ACTIVE')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Hospital Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Add New Hospital</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {[['basic','Basic Info'], ['payment','Payment Info']].map(([t, l]) => (
                <button key={t} onClick={() => setTab(t as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                  style={tab === t ? { background: '#471DDB' } : {}}>
                  {l}
                </button>
              ))}
            </div>

            {tab === 'basic' && (
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Hospital Name *', placeholder: 'e.g. Hôpital Central de Yaoundé' },
                  { key: 'accreditation_number', label: 'MINSANTE Accreditation No. *', placeholder: 'e.g. MIN-2024-001' },
                  { key: 'licence_number', label: 'Licence Number *', placeholder: 'e.g. LIC-2024-001' },
                  { key: 'phone_number', label: 'Phone *', placeholder: '+237 6XX XXX XXX' },
                  { key: 'email', label: 'Email *', placeholder: 'hospital@example.com' },
                  { key: 'address', label: 'Address *', placeholder: 'Rue Joseph Mballa Eloumden' },
                  { key: 'website', label: 'Website', placeholder: 'https://hospital.cm' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                    <input className="input-field" placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Region *</label>
                    <select className="input-field" value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}>
                      <option value="">— Select Region —</option>
                      {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">City *</label>
                    <input className="input-field" placeholder="e.g. Yaoundé"
                      value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'payment' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400">Payment details allow fund disbursement to the hospital</p>
                {[
                  { key: 'momo_number',       label: 'MTN MoMo Number',    placeholder: '+237 6XX XXX XXX' },
                  { key: 'momo_name',         label: 'MTN MoMo Name',      placeholder: 'Account holder name' },
                  { key: 'orange_number',     label: 'Orange Money Number',placeholder: '+237 69X XXX XXX' },
                  { key: 'orange_name',       label: 'Orange Money Name',  placeholder: 'Account holder name' },
                  { key: 'bank_name',         label: 'Bank Name',          placeholder: 'e.g. Afriland First Bank' },
                  { key: 'bank_account_number', label: 'Bank Account No.', placeholder: 'Account number' },
                  { key: 'bank_account_name', label: 'Account Name',       placeholder: 'Account holder name' },
                  { key: 'bank_branch',       label: 'Branch',             placeholder: 'e.g. Yaoundé Agence Centrale' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                    <input className="input-field" placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button className="btn-outline flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: '#471DDB' }} onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Hospital'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
