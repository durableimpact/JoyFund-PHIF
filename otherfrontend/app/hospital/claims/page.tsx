'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Ticket, ClipboardList, Plus, X, Loader2 } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';
import { statusColor, statusLabel, formatXAF, formatDate } from '@/lib/utils';

const NAV: NavItem[] = [
  { label: 'Voucher Validation', href: '/hospital/receptionist', icon: <Ticket size={16} /> },
  { label: 'Medical Claims',     href: '/hospital/claims',       icon: <ClipboardList size={16} /> },
];

// Claim items are services with a name and amount
const COMMON_SERVICES = [
  'Antenatal consultation', 'Normal delivery', 'Caesarean section',
  'Postnatal consultation', 'Ultrasound scan', 'Blood test',
  'Malaria treatment', 'Antibiotics', 'IV fluids', 'Wound dressing',
  'Hospital bed (per night)', 'Emergency consultation',
];

export default function HospitalClaimsPage() {
  const { currentUser, showToast } = useStore();
  const [claims, setClaims]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);

  // Form state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherData, setVoucherData] = useState<any>(null);
  const [lookingUp, setLookingUp]     = useState(false);
  const [serviceDescription, setServiceDescription] = useState('');
  const [items, setItems] = useState<{ name: string; amount: string }[]>([{ name: '', amount: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authenticatedFetch('/api/hospitals/medical-claims/');
      setClaims(Array.isArray(data) ? data : data.results || []);
    } catch { /* receptionist may see empty list */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Look up voucher by code to get its ID and hospital
  const lookupVoucher = async () => {
    if (!voucherCode.trim()) { showToast('Enter voucher code first', 'error'); return; }
    setLookingUp(true); setVoucherData(null);
    try {
      const data = await authenticatedFetch(`/api/vouchers/check/?code=${encodeURIComponent(voucherCode.trim().toUpperCase())}`);
      if (data.status !== 'USED' && data.status !== 'PENDING_CONFIRMATION') {
        showToast(`Voucher status is "${data.status}" — only PENDING_CONFIRMATION or USED vouchers can be claimed`, 'error');
        return;
      }
      setVoucherData(data);
      showToast('Voucher found!', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Voucher not found', 'error');
    } finally { setLookingUp(false); }
  };

  const handleAddItem = () => setItems(p => [...p, { name: '', amount: '' }]);
  const handleRemoveItem = (i: number) => setItems(p => p.filter((_, idx) => idx !== i));
  const handleItemChange = (i: number, key: 'name' | 'amount', val: string) => {
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [key]: val } : item));
  };

  const handleCreate = async () => {
    if (!voucherData?.id) { showToast('Look up a voucher first', 'error'); return; }
    const validItems = items.filter(i => i.name && Number(i.amount) > 0);
    if (!validItems.length) { showToast('Add at least one claim item with name and amount', 'error'); return; }

    setSubmitting(true);
    try {
      const data = await authenticatedFetch('/api/hospitals/medical-claims/', {
        method: 'POST',
        body: JSON.stringify({
          voucher: voucherData.id,
          hospital: voucherData.hospital?.id || voucherData.hospital,
          service_description: serviceDescription,
          claim_items: validItems.map(i => ({ name: i.name, amount: Number(i.amount) })),
        }),
      });
      setClaims(p => [data, ...p]);
      showToast('Medical claim submitted successfully!', 'success');
      setShowCreate(false);
      setVoucherCode(''); setVoucherData(null);
      setServiceDescription(''); setItems([{ name: '', amount: '' }]);
    } catch (e: any) {
      showToast(e?.message || 'Failed to submit claim', 'error');
    } finally { setSubmitting(false); }
  };

  const totalItems = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <DashboardShell navItems={NAV} accentColor="#0D9488" brandLabel="Receptionist" brandSub="Medical Claims">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Medical Claims</h1>
          <p className="text-gray-500 text-sm">Submit and track claims for services rendered</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#0D9488' }}>
          <Plus size={16} /> New Claim
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Claim ID', 'Voucher', 'Total Cost', 'Submitted', 'Status', ''].map(h => (
                  <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No claims yet</td></tr>
              ) : claims.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs text-gray-700">#{c.id?.toString().slice(-8)}</td>
                  <td className="p-4 font-mono text-xs text-gray-600">{c.voucher_code || c.voucher?.toString().slice(-8) || '—'}</td>
                  <td className="p-4 font-semibold text-xs" style={{ color: '#0D9488' }}>{formatXAF(Number(c.total_cost ?? 0))}</td>
                  <td className="p-4 text-gray-400 text-xs">{c.submitted_at ? formatDate(c.submitted_at) : '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(c.claim_status || 'PENDING')}`}>{statusLabel(c.claim_status || 'PENDING')}</span></td>
                  <td className="p-4">
                    <button onClick={() => setSelectedClaim(c)} className="text-xs font-semibold" style={{ color: '#0D9488' }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Claim Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overflow-y-auto py-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Submit Medical Claim</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            {/* Step 1: Voucher lookup */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Voucher Code *</label>
              <div className="flex gap-2">
                <input className="input-field flex-1 font-mono uppercase" placeholder="e.g. JF-00A1B2C3"
                  value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())} />
                <button className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0 disabled:opacity-60"
                  style={{ background: '#0D9488' }} onClick={lookupVoucher} disabled={lookingUp}>
                  {lookingUp ? <Loader2 size={14} className="animate-spin" /> : 'Lookup'}
                </button>
              </div>
              {voucherData && (
                <div className="mt-2 bg-emerald-50 rounded-xl p-3 text-xs space-y-1">
                  <p className="font-bold text-emerald-700">Voucher found ✓</p>
                  <p className="text-gray-600">Patient: <strong>{voucherData.beneficiary?.full_name || '—'}</strong></p>
                  <p className="text-gray-600">Status: <strong>{voucherData.status}</strong></p>
                  <p className="text-gray-600">Hospital: <strong>{voucherData.hospital?.name || '—'}</strong></p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Service Description</label>
              <textarea className="input-field resize-none" rows={2}
                placeholder="Brief description of services provided..."
                value={serviceDescription} onChange={e => setServiceDescription(e.target.value)} />
            </div>

            {/* Claim Items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500">Claim Items * <span className="font-normal text-gray-400">(min 1 item)</span></label>
                <button onClick={handleAddItem} className="text-xs font-semibold" style={{ color: '#0D9488' }}>+ Add Item</button>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select className="input-field text-sm" value={item.name}
                        onChange={e => handleItemChange(i, 'name', e.target.value)}>
                        <option value="">— Select service —</option>
                        {COMMON_SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                        <option value="Other">Other (type below)</option>
                      </select>
                      {item.name === 'Other' && (
                        <input className="input-field text-sm mt-1" placeholder="Service name"
                          onChange={e => handleItemChange(i, 'name', e.target.value)} />
                      )}
                    </div>
                    <input className="input-field w-28 text-sm flex-shrink-0" type="number" min={0} step={500}
                      placeholder="XAF" value={item.amount} onChange={e => handleItemChange(i, 'amount', e.target.value)} />
                    {items.length > 1 && (
                      <button onClick={() => handleRemoveItem(i)} className="text-gray-400 hover:text-red-500 pt-2.5"><X size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
              {totalItems > 0 && (
                <p className="text-right text-sm font-bold mt-2" style={{ color: '#0D9488' }}>
                  Total: {formatXAF(totalItems)}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: '#0D9488' }} onClick={handleCreate} disabled={submitting || !voucherData}>
                {submitting ? 'Submitting…' : 'Submit Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Claim Detail</h2>
              <button onClick={() => setSelectedClaim(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Claim ID', `#${selectedClaim.id?.toString().slice(-8)}`],
                ['Total Cost', formatXAF(Number(selectedClaim.total_cost ?? 0))],
                ['Status', statusLabel(selectedClaim.claim_status || 'PENDING')],
                ['Submitted', selectedClaim.submitted_at ? formatDate(selectedClaim.submitted_at) : '—'],
                ['Description', selectedClaim.service_description || 'No description'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            {selectedClaim.claim_items?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
                {selectedClaim.claim_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-semibold">{formatXAF(Number(item.amount))}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-outline w-full mt-5" onClick={() => setSelectedClaim(null)}>Close</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
