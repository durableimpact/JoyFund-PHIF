'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { listBeneficiaries } from '@/actions/beneficiaries';
import { normalizeBeneficiaryResponse, statusColor, statusLabel } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';


export default function AdminBeneficiaries() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data, isLoading: loading } = useQuery({
    queryKey: ['beneficiaries', token, currentPage, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: '10',
      };
      if (search) {
        params.search = search;
      }
      const d = await listBeneficiaries(token, params);
      return d;
    },
    enabled: !!token,
  });

  const bens = (data?.results || []).map(normalizeBeneficiaryResponse);
  const totalCount = data?.count || 0;
  const hasNextPage = !!data?.next;
  const hasPreviousPage = !!data?.previous;
  const totalPages = Math.ceil(totalCount / 10);

  const filtered = bens.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchStatus;
  });

  const statuses = ['all', 'awaiting_match', 'voucher_issued', 'care_received', 'pending', 'suspended'];

  return (<>


          <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">All Beneficiaries</h1>
        <p className="text-gray-500 text-sm">{totalCount} enrolled in the system</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="input-field pl-10" 
            placeholder="Search by name, health ID, community..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        <select 
          className="input-field w-auto" 
          value={statusFilter} 
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
        >
          {statuses.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : statusLabel(s)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Beneficiary', 'Health ID', 'Community', 'Age / Week', 'Enrolled', 'Status'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No beneficiaries found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(b.fullName || '?').charAt(0)}
                      </div>
                      <Link href={`/social-worker/beneficiary/${b.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {b.fullName}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600">{b.healthId || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">{b.community || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">Age {b.age} · Wk {b.gestationalWeek}</td>
                  <td className="p-4 text-gray-400 text-xs">{b.enrolledAt || '—'}</td>
                  <td className="p-4">
                    <span className={`badge ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalCount > 10 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600">
              Showing <span className="font-semibold">{(currentPage - 1) * 10 + 1}</span> to <span className="font-semibold">{Math.min(currentPage * 10, totalCount)}</span> of <span className="font-semibold">{totalCount}</span> results
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!hasPreviousPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors animate-pulse-none"
                title="Previous page"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isCurrentPage
                          ? 'bg-purple-600 text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                      style={isCurrentPage ? { background: '#471DDB' } : {}}
                    >
                      {pageNum}
                    </button>
  )
;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={!hasNextPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
  
</>
);
}
