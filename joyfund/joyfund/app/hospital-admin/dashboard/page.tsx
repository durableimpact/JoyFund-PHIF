'use client';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { hospitals, staffMembers } from '@/lib/mockData';

export default function HospitalAdminDashboard() {
  const { vouchers } = useStore();
  const hospital = hospitals[0];
  const myVouchers = vouchers.filter(v => v.hospitalId === hospital.id);
  const redeemed = myVouchers.filter(v => v.status === 'redeemed');
  const totalXAF = redeemed.reduce((s, v) => s + v.amountXAF, 0);
  const kpis = [
    { label: 'Vouchers Processed', value: myVouchers.length, color: 'var(--secondary)' },
    { label: 'Total XAF Received', value: formatXAF(totalXAF), color: 'var(--primary)' },
    { label: 'Pending Payouts', value: myVouchers.filter(v => v.status === 'issued').length, color: '#f59e0b' },
    { label: 'Active Staff', value: staffMembers.filter(s => s.hospitalId === hospital.id && s.status === 'active').length, color: '#471DDB' },
  ];
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: 'var(--secondary)' }}>
        <div className="flex items-center gap-3"><span className="text-xl">🏥</span><div><p className="font-black text-sm text-white">{hospital.name}</p><p className="text-xs text-white opacity-60">Hospital Admin Portal</p></div></div>
        <div className="flex gap-4 text-white opacity-70 text-xs"><Link href="/hospital-admin/transactions" className="hover:opacity-100">Transactions</Link><Link href="/hospital-admin/staff" className="hover:opacity-100">Staff</Link></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6"><h1 className="text-xl font-black text-gray-900">Hospital Dashboard</h1><p className="text-gray-500 text-sm">{hospital.region} · {hospital.address} · MINSANTE: {hospital.accreditationNumber}</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(k => (<div key={k.label} className="card p-5"><div className="text-xl font-black mb-1" style={{ color: k.color }}>{k.value}</div><div className="text-xs text-gray-500">{k.label}</div></div>))}
        </div>
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Daily Voucher Redemptions — This Month</h3>
          <div className="flex items-end gap-1 h-32">
            {[2,1,3,0,2,4,1,3,2,1,0,2,3,2,1,4,2,3,1,2,0,3,2,1,4,3,2,1,2,3].map((v,i) => (
              <div key={i} className="flex-1 rounded-t transition-all hover:opacity-80" style={{ height: `${(v/4)*100}%`, background: v===0?'#e5e7eb':'var(--primary)', minHeight: '4px' }} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2"><span>Apr 1</span><span>Apr 15</span><span>Apr 30</span></div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Recent Transactions</h3><Link href="/hospital-admin/transactions" className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>View All</Link></div>
            <div className="space-y-3">
              {myVouchers.map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div><p className="font-mono text-xs font-bold text-gray-900">{v.code}</p><p className="text-xs text-gray-400">{v.beneficiaryName} · {formatDate(v.generatedAt)}</p></div>
                  <div className="text-right"><p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{formatXAF(v.amountXAF)}</p><span className={`badge ${statusColor(v.status)} text-xs`}>{statusLabel(v.status)}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Staff Members</h3><Link href="/hospital-admin/staff" className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>Manage</Link></div>
            <div className="space-y-3">
              {staffMembers.filter(s => s.hospitalId === hospital.id).map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.name.charAt(0)}</div>
                  <div className="flex-1"><p className="font-semibold text-sm text-gray-900">{s.name}</p><p className="text-xs text-gray-400 capitalize">{s.role.replace('_',' ')} · {s.staffId}</p></div>
                  <span className={`badge text-xs ${s.status==='active'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
