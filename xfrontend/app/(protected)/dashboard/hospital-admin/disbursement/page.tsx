'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatXAF, formatDate, statusColor } from '@/lib/utils';
import { getDisbursementsByHospital } from '@/actions/disbursement';

const STATUS_FILTERS = ['all', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
const PAGE_SIZE = 10;

export default function HospitalAdminDisbursements() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDisbursement, setSelectedDisbursement] = useState<Disbursement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ha-disbursements', token],
    queryFn: () => getDisbursementsByHospital(token),
    enabled: !!token,
  });

  const allDisbursements: Disbursement[] = Array.isArray(data) ? data : (data as any)?.results || [];
  const filtered = allDisbursements.filter(d => {
    const matchStatus = filter === 'all' || d.status === filter;
    const matchSearch = !search || d.hospital_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const paymentMethodLabels: Record<string, string> = {
    MOMO: 'Mobile Money',
    BANK_TRANSFER: 'Bank Transfer',
    CASH: 'Cash',
    OTHER: 'Other',
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Disbursements</h1>
        <p className="text-gray-500 text-sm">{totalCount} total disbursements</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by hospital name..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Amount', 'Payment Method', 'Status', 'Date', 'Reference'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
                <th className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No disbursements found</td></tr>
              ) : paginated.map(d => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-bold text-gray-900">{formatXAF(d.amount)}</td>
                  <td className="p-4 text-gray-600 text-xs">{paymentMethodLabels[d.payment_method] || d.payment_method || '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(d.status)}`}>{d.status}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{d.created_at ? formatDate(d.created_at) : '—'}</td>
                  <td className="p-4 text-gray-400 text-xs font-mono">{d.external_reference || d.gateway_transaction_id || '—'}</td>
                  <td className="p-4">
                    <button onClick={() => setSelectedDisbursement(d)} className="text-xs font-semibold" style={{ color: '#1D75DB' }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-600"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedDisbursement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Disbursement Detail</h2>
              <button onClick={() => setSelectedDisbursement(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Amount', formatXAF(selectedDisbursement.amount)],
                ['Payment Method', paymentMethodLabels[selectedDisbursement.payment_method] || selectedDisbursement.payment_method],
                ['Status', selectedDisbursement.status],
                ['Recipient Phone', selectedDisbursement.recipient_phone || '—'],
                ['Recipient Account', selectedDisbursement.recipient_account || '—'],
                ['External Reference', selectedDisbursement.external_reference || '—'],
                ['Gateway Transaction', selectedDisbursement.gateway_transaction_id || '—'],
                ['Notes', selectedDisbursement.notes || '—'],
                ['Created At', selectedDisbursement.created_at ? formatDate(selectedDisbursement.created_at) : '—'],
                ['Disbursed At', selectedDisbursement.disbursed_at ? formatDate(selectedDisbursement.disbursed_at) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{v}</span>
                </div>
              ))}
              {selectedDisbursement.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mt-2">
                  <span className="font-semibold">Error: </span>{selectedDisbursement.error_message}
                </div>
              )}
            </div>
            <button className="btn-outline w-full mt-5" onClick={() => setSelectedDisbursement(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
