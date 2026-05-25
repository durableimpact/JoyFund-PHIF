'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Users, TrendingUp, Download } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/hospital-admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Medical Claims', href: '/hospital-admin/claims', icon: <FileText size={16} /> },
  { label: 'Top-Up Requests', href: '/hospital-admin/top-up', icon: <TrendingUp size={16} /> },
  { label: 'Staff', href: '/hospital-admin/staff', icon: <Users size={16} /> },
  { label: 'Transactions', href: '/hospital-admin/transactions', icon: <TrendingUp size={16} /> },
];

export default function HospitalTransactions() {
  const { showToast } = useStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIn, setTotalIn] = useState(0);

  useEffect(() => {
    authenticatedFetch('/api/payments/transactions/')
      .then(d => {
        const arr = Array.isArray(d) ? d : d.results || [];
        setTransactions(arr);
        setTotalIn(arr.filter((t: any) => t.type === 'payout' || t.transaction_type === 'payout').reduce((s: number, t: any) => s + Number(t.amount ?? 0), 0));
      })
      .catch(() => showToast('Failed to load transactions', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell navItems={NAV} accentColor="#1D75DB" brandLabel="Hospital Admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm">Payment history for your hospital</p>
        </div>
        <button onClick={() => showToast('Exporting transactions...', 'info')} className="btn-outline text-sm flex items-center gap-2">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Transactions', value: transactions.length, color: 'var(--secondary)' },
          { label: 'Total Received (XAF)', value: formatXAF(totalIn), color: 'var(--success)' },
          { label: 'Pending Payouts', value: transactions.filter(t => t.status === 'pending').length, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-lg font-black" style={{ color: s.color }}>
              {loading ? <span className="inline-block w-12 h-5 bg-gray-100 rounded animate-pulse" /> : s.value}
            </div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Ref', 'Type', 'Amount', 'Date', 'Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No transactions yet</td></tr>
              ) : transactions.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs text-gray-700">{t.reference || t.id?.toString().slice(-10)}</td>
                  <td className="p-4 text-xs capitalize text-gray-600">{t.transaction_type || t.type || '—'}</td>
                  <td className="p-4 font-semibold" style={{ color: 'var(--success)' }}>{formatXAF(Number(t.amount ?? 0))}</td>
                  <td className="p-4 text-gray-400 text-xs">{t.created_at ? formatDate(t.created_at) : '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(t.status || 'completed')}`}>{statusLabel(t.status || 'completed')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
