'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';

export default function AdminVouchers() {
  const { vouchers, updateVoucher, showToast } = useStore();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = vouchers.filter(v => (filter === 'all' || v.status === filter) && (v.code.toLowerCase().includes(search.toLowerCase()) || v.beneficiaryName.toLowerCase().includes(search.toLowerCase())));
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: '#471DDB' }}>
        <div className="flex items-center gap-3"><span className="text-xl">🎟️</span><p className="font-black text-sm text-white">Voucher Management</p></div>
        <div className="flex gap-4 text-white opacity-70 text-xs"><Link href="/admin/dashboard" className="hover:opacity-100">Dashboard</Link><Link href="/admin/hospitals" className="hover:opacity-100">Hospitals</Link><Link href="/admin/analytics" className="hover:opacity-100">Analytics</Link></div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input-field pl-10" placeholder="Search by code or beneficiary..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="input-field w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
            {['all','generated','issued','redeemed','expired','void'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : statusLabel(s)}</option>)}
          </select>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Code','Beneficiary','Hospital','Amount','Generated','Status','Actions'].map(h => <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-gray-900">{v.code}</td>
                    <td className="p-4 text-gray-700">{v.beneficiaryName}</td>
                    <td className="p-4 text-gray-600 text-xs max-w-[140px] truncate">{v.hospitalName}</td>
                    <td className="p-4 font-semibold" style={{ color: 'var(--primary)' }}>{formatXAF(v.amountXAF)}</td>
                    <td className="p-4 text-gray-400 text-xs">{formatDate(v.generatedAt)}</td>
                    <td className="p-4"><span className={`badge ${statusColor(v.status)}`}>{statusLabel(v.status)}</span></td>
                    <td className="p-4"><div className="flex gap-2">{v.status !== 'void' && v.status !== 'redeemed' && <button onClick={() => { updateVoucher(v.id, { status: 'void' }); showToast(`Voucher ${v.code} revoked`, 'error'); }} className="text-xs text-red-500 hover:text-red-700 font-medium">Revoke</button>}<button onClick={() => showToast(`SMS resent for ${v.code}`, 'info')} className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>Resend SMS</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="text-center py-12"><div className="text-3xl mb-2">🎟️</div><p className="text-gray-500 text-sm">No vouchers match your filters</p></div>}
        </div>
      </div>
    </div>
  );
}
