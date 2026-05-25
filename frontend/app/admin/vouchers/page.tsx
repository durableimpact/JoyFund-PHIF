'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, Search, Plus, X, ChevronDown } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
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

export default function AdminVouchers() {
  const { showToast } = useStore();
  const [vouchers, setVouchers]       = useState<any[]>([]);
  const [healthIssues, setHealthIssues] = useState<any[]>([]);
  const [hospitals, setHospitals]     = useState<any[]>([]);
  const [campaigns, setCampaigns]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [showCreate, setShowCreate]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [mode, setMode]               = useState<'single' | 'multi'>('single');

  // Single campaign form
  const [healthIssueId, setHealthIssueId] = useState('');
  const [hospitalId, setHospitalId]       = useState('');
  const [campaignId, setCampaignId]       = useState('');
  const [amount, setAmount]               = useState('');

  // Multi campaign form
  const [multiHealthIssueId, setMultiHealthIssueId] = useState('');
  const [multiHospitalId, setMultiHospitalId]       = useState('');
  const [totalAmount, setTotalAmount]               = useState('');
  const [allocations, setAllocations] = useState<{ campaign_id: string; amount: string }[]>([{ campaign_id: '', amount: '' }]);

  const load = async () => {
    setLoading(true);
    try {
      const [vRes, hiRes, hRes, cRes] = await Promise.allSettled([
        authenticatedFetch('/api/vouchers/'),
        authenticatedFetch('/api/beneficiaries/health-issues/'),
        authenticatedFetch('/api/hospitals/'),
        authenticatedFetch('/api/campaigns/'),
      ]);
      if (vRes.status === 'fulfilled') setVouchers(Array.isArray(vRes.value) ? vRes.value : vRes.value.results || []);
      if (hiRes.status === 'fulfilled') {
        const all = Array.isArray(hiRes.value) ? hiRes.value : hiRes.value.results || [];
        setHealthIssues(all.filter((h: any) => h.status === 'VALIDATED'));
      }
      if (hRes.status === 'fulfilled') setHospitals(Array.isArray(hRes.value) ? hRes.value : hRes.value.results || []);
      if (cRes.status === 'fulfilled') setCampaigns(Array.isArray(cRes.value) ? cRes.value : cRes.value.results || []);
    } catch { showToast('Failed to load vouchers', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = vouchers.filter(v => {
    const matchStatus = filter === 'all' || v.status === filter;
    const code = v.voucher_code || v.code || '';
    const ben = v.beneficiary?.full_name || v.beneficiary_name || '';
    return matchStatus && (code.toLowerCase().includes(search.toLowerCase()) || ben.toLowerCase().includes(search.toLowerCase()));
  });

  const handleCreateSingle = async () => {
    if (!healthIssueId || !hospitalId || !campaignId || !amount) {
      showToast('All fields are required', 'error'); return;
    }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/vouchers/create/', {
        method: 'POST',
        body: JSON.stringify({
          health_issue_id: healthIssueId,
          hospital_id: hospitalId,
          campaign_id: campaignId,
          amount: parseFloat(amount),
        }),
      });
      showToast('Voucher created!', 'success');
      setShowCreate(false);
      setHealthIssueId(''); setHospitalId(''); setCampaignId(''); setAmount('');
      load();
    } catch (e: any) { showToast(e?.message || 'Failed to create voucher', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleCreateMulti = async () => {
    if (!multiHealthIssueId || !multiHospitalId || !totalAmount) {
      showToast('Health issue, hospital, and total amount are required', 'error'); return;
    }
    const validAllocs = allocations.filter(a => a.campaign_id && Number(a.amount) > 0);
    if (!validAllocs.length) { showToast('Add at least one campaign allocation', 'error'); return; }
    setSubmitting(true);
    try {
      await authenticatedFetch('/api/vouchers/create-from-campaigns/', {
        method: 'POST',
        body: JSON.stringify({
          health_issue_id: multiHealthIssueId,
          hospital_id: multiHospitalId,
          total_amount: parseFloat(totalAmount),
          campaign_allocations: validAllocs.map(a => ({ campaign_id: a.campaign_id, amount: parseFloat(a.amount) })),
        }),
      });
      showToast('Voucher created from multiple campaigns!', 'success');
      setShowCreate(false);
      setMultiHealthIssueId(''); setMultiHospitalId(''); setTotalAmount('');
      setAllocations([{ campaign_id: '', amount: '' }]);
      load();
    } catch (e: any) { showToast(e?.message || 'Failed to create voucher', 'error'); }
    finally { setSubmitting(false); }
  };

  const STATUS_FILTERS = ['all','ACTIVE','PENDING_CONFIRMATION','USED','EXPIRED','CANCELLED'];

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Voucher Management</h1>
          <p className="text-gray-500 text-sm">{vouchers.length} total vouchers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-admin text-sm flex items-center gap-2">
          <Plus size={16} /> Create Voucher
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by code or beneficiary..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Code','Beneficiary','Amount','Hospital','Created','Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No vouchers found</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm font-bold text-gray-900">{v.voucher_code || v.code || v.id?.toString().slice(-8)}</td>
                  <td className="p-4 text-gray-700 text-xs">{v.beneficiary?.full_name || v.beneficiary_name || '—'}</td>
                  <td className="p-4 font-semibold text-xs" style={{ color: 'var(--primary)' }}>
                    {formatXAF(Number(v.amount ?? v.face_value ?? v.amountXAF ?? 0))}
                  </td>
                  <td className="p-4 text-gray-600 text-xs">{v.hospital?.name || '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{v.created_at ? formatDate(v.created_at) : '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(v.status || 'ACTIVE')}`}>{v.status || 'ACTIVE'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Voucher Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Create Voucher</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-5">
              {[['single','Single Campaign'], ['multi','Multiple Campaigns']].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m as any)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${mode === m ? 'text-white' : 'border-gray-200 text-gray-600'}`}
                  style={mode === m ? { background: '#471DDB', borderColor: '#471DDB' } : {}}>
                  {l}
                </button>
              ))}
            </div>

            {healthIssues.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                No VALIDATED health issues found. Health issues must be verified before creating a voucher.
              </div>
            )}

            {mode === 'single' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Health Issue (VALIDATED) *</label>
                  <select className="input-field" value={healthIssueId} onChange={e => setHealthIssueId(e.target.value)}>
                    <option value="">— Select health issue —</option>
                    {healthIssues.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.description} · {h.beneficiary_name || h.beneficiary || h.id?.toString().slice(-6)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Hospital *</label>
                  <select className="input-field" value={hospitalId} onChange={e => setHospitalId(e.target.value)}>
                    <option value="">— Select hospital —</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Funding Campaign *</label>
                  <select className="input-field" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
                    <option value="">— Select campaign —</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} · Balance: {formatXAF(Number(c.available_balance ?? c.current_amount ?? 0))}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (XAF) *</label>
                  <input className="input-field" type="number" min={1} placeholder="e.g. 60000" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                    style={{ background: '#471DDB' }} onClick={handleCreateSingle} disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Voucher'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'multi' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Health Issue (VALIDATED) *</label>
                  <select className="input-field" value={multiHealthIssueId} onChange={e => setMultiHealthIssueId(e.target.value)}>
                    <option value="">— Select health issue —</option>
                    {healthIssues.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.description} · {h.beneficiary_name || h.id?.toString().slice(-6)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Hospital *</label>
                  <select className="input-field" value={multiHospitalId} onChange={e => setMultiHospitalId(e.target.value)}>
                    <option value="">— Select hospital —</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Total Amount (XAF) *</label>
                  <input className="input-field" type="number" min={1} placeholder="e.g. 120000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500">Campaign Allocations *</label>
                    <button onClick={() => setAllocations(p => [...p, { campaign_id: '', amount: '' }])} className="text-xs font-semibold" style={{ color: '#471DDB' }}>+ Add Campaign</button>
                  </div>
                  {allocations.map((a, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <select className="input-field flex-1 text-sm" value={a.campaign_id}
                        onChange={e => setAllocations(p => p.map((x, idx) => idx === i ? { ...x, campaign_id: e.target.value } : x))}>
                        <option value="">— Campaign —</option>
                        {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <input className="input-field w-28 text-sm flex-shrink-0" type="number" placeholder="XAF"
                        value={a.amount} onChange={e => setAllocations(p => p.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))} />
                      {allocations.length > 1 && (
                        <button onClick={() => setAllocations(p => p.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                    style={{ background: '#471DDB' }} onClick={handleCreateMulti} disabled={submitting}>
                    {submitting ? 'Creating…' : 'Create Voucher'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
