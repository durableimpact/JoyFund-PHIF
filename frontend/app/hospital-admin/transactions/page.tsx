'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { hospitals } from '@/lib/mockData';

export default function HospitalTransactions() {
  const { vouchers, showToast } = useStore();
  const hospital = hospitals[0];
  const myVouchers = vouchers.filter(v => v.hospitalId === hospital.id);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = myVouchers.filter(v => statusFilter === 'all' || v.status === statusFilter);
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: 'var(--secondary)' }}>
        <div className="flex items-center gap-3"><span className="text-xl">📋</span><p className="font-black text-sm text-white">Transaction History</p></div>
        <div className="flex gap-4 text-white opacity-70 text-xs"><Link href="/hospital-admin/dashboard" className="hover:opacity-100">Dashboard</Link><Link href="/hospital-admin/staff" className="hover:opacity-100">Staff</Link></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-black text-gray-900">Transaction Ledger</h1><p className="text-gray-500 text-sm">{hospital.name} · {myVouchers.length} total transactions</p></div>
          <button className="btn-secondary text-sm flex items-center gap-2" onClick={() => showToast('Export ready! CSV downloaded.', 'success')}><Download size={16} /> Export CSV</button>
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['all','generated','issued','redeemed'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${statusFilter===s?'text-white':'bg-white text-gray-600 border border-gray-200'}`} style={statusFilter===s?{background:'var(--secondary)'}:{}}>{s==='all'?'All':statusLabel(s)}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{label:'Total Processed',value:formatXAF(myVouchers.reduce((s,v)=>s+v.amountXAF,0)),color:'var(--primary)'},{label:'Redeemed',value:formatXAF(myVouchers.filter(v=>v.status==='redeemed').reduce((s,v)=>s+v.amountXAF,0)),color:'var(--success)'},{label:'Pending',value:formatXAF(myVouchers.filter(v=>v.status==='issued').reduce((s,v)=>s+v.amountXAF,0)),color:'#f59e0b'}].map(s=>(
            <div key={s.label} className="card p-4 text-center"><div className="font-black text-lg" style={{color:s.color}}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
          ))}
        </div>
        <div className="space-y-3">
          {filtered.map(v => (
            <div key={v.id} className="card overflow-hidden">
              <button className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors" onClick={() => setExpanded(expanded===v.id?null:v.id)}>
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">🎟️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><span className="font-mono font-bold text-gray-900">{v.code}</span><span className={`badge ${statusColor(v.status)} text-xs`}>{statusLabel(v.status)}</span></div>
                  <p className="text-xs text-gray-500">{v.beneficiaryName} · {formatDate(v.generatedAt)}</p>
                </div>
                <div className="text-right flex-shrink-0"><div className="font-bold" style={{color:'var(--primary)'}}>{formatXAF(v.amountXAF)}</div><div className="text-xs text-gray-400">{expanded===v.id?'▲':'▼'}</div></div>
              </button>
              {expanded===v.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-gray-50 animate-fade-up">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><p className="text-xs font-semibold text-gray-500 mb-2">Services Covered</p><ul className="space-y-1">{v.services.map(s=><li key={s} className="flex items-center gap-2 text-xs text-gray-700"><span className="w-3 h-3 rounded-full flex-shrink-0" style={{background:'var(--success)'}} />{s}</li>)}</ul></div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Generated</span><span className="text-gray-700">{formatDate(v.generatedAt)}</span></div>
                      {v.redeemedAt && <div className="flex justify-between"><span className="text-gray-500">Redeemed</span><span className="text-gray-700">{formatDate(v.redeemedAt)}</span></div>}
                      <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold" style={{color:'var(--primary)'}}>{formatXAF(v.amountXAF)}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length===0 && <div className="card p-12 text-center"><div className="text-4xl mb-3">📋</div><p className="text-gray-500 text-sm">No transactions found</p></div>}
        </div>
      </div>
    </div>
  );
}
