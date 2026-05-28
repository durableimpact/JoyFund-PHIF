'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatXAF, formatDate, statusColor } from '@/lib/utils';
import { listVoucherTopUpRequests, getVoucherTopUpRequest } from '@/actions/hospital';

const STATUS_FILTERS = ['all', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZE = 10;

export default function HospitalAdminTopUpRequests() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ha-topup', token],
    queryFn: async () => {
      const res = await listVoucherTopUpRequests(token);
      return res?.results || res || [];
    },
    enabled: !!token,
  });

  const allRequests: any[] = Array.isArray(data) ? data : [];
  const filtered = allRequests.filter(r => filter === 'all' || r.status === filter);
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await getVoucherTopUpRequest(id, token);
      setSelectedRequest(detail);
    } catch {
      setSelectedRequest(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Top-Up Requests</h1>
        <p className="text-gray-500 text-sm">{totalCount} requests</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <select className="input-field w-auto" value={filter} onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Request ID', 'Amount', 'Reason', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No top-up requests found</td></tr>
              ) : paginated.map((r: any) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs text-gray-700">#{r.id?.toString().slice(-8)}</td>
                  <td className="p-4 font-bold text-gray-900">{formatXAF(Number(r.requested_amount || r.amount || 0))}</td>
                  <td className="p-4 text-gray-600 text-xs truncate max-w-[200px]">{r.reason || '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(r.status)}`}>{r.status?.replace(/_/g, ' ')}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{r.created_at ? formatDate(r.created_at) : '—'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleViewDetail(r.id)}
                      className="text-xs font-semibold"
                      style={{ color: '#1D75DB' }}
                    >
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

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-gray-900">Top-Up Request Detail</h2>
              <button onClick={() => setSelectedRequest(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Request ID', `#${selectedRequest.id?.toString().slice(-8)}`],
                ['Amount', formatXAF(Number(selectedRequest.requested_amount || selectedRequest.amount || 0))],
                ['Reason', selectedRequest.reason || '—'],
                ['Status', (selectedRequest.status || 'PENDING').replace(/_/g, ' ')],
                ['Created At', selectedRequest.created_at ? formatDate(selectedRequest.created_at) : '—'],
                ['Reviewed At', selectedRequest.reviewed_at ? formatDate(selectedRequest.reviewed_at) : '—'],
                ['Review Notes', selectedRequest.review_notes || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{v}</span>
                </div>
              ))}
            </div>

            {selectedRequest.events && selectedRequest.events.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Event History</h3>
                <div className="space-y-2">
                  {selectedRequest.events.map((e: any) => (
                    <div key={e.id} className="flex items-center justify-between text-xs border-l-2 border-gray-200 pl-3 py-1">
                      <div>
                        <span className={`badge text-xs ${statusColor(e.status)}`}>{e.status?.replace(/_/g, ' ')}</span>
                        {e.notes && <p className="text-gray-500 mt-0.5">{e.notes}</p>}
                      </div>
                      <span className="text-gray-400">{e.changed_at ? formatDate(e.changed_at) : '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="btn-outline w-full mt-5" onClick={() => setSelectedRequest(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
