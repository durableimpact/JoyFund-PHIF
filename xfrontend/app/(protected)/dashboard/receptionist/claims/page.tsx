'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getMedicalClaims } from '@/actions/hospital';
import { formatXAF, formatDate, statusColor } from '@/lib/utils';

const STATUS_FILTERS = ['all', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZE = 10;

export default function ReceptionistClaims() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalId = userInfo?.hospital;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const params: Record<string, string> = {
    page: currentPage.toString(),
    page_size: PAGE_SIZE.toString(),
  };
  if (hospitalId) params.hospital = hospitalId;
  if (filter !== 'all') params.claim_status = filter;
  if (search) params.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['rec-claims-list', token, hospitalId, currentPage, search, filter],
    queryFn: () => getMedicalClaims(token, params),
    enabled: !!token && !!hospitalId,
  });

  const claims: MedicalClaimList[] = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNextPage = !!data?.next;
  const hasPreviousPage = !!data?.previous;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">My Claims</h1>
        <p className="text-gray-500 text-sm">{totalCount} claims</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search claims..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}>
          {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Claim ID', 'Amount', 'Status', 'Submitted', 'Completed'].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : claims.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No claims found</td></tr>
              ) : claims.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs font-bold">
                    <Link href={`/dashboard/receptionist/claims/${c.id}`} className="text-gray-900 hover:text-[#1D75DB] hover:underline">
                      #{String(c.id).slice(-8)}
                    </Link>
                  </td>
                  <td className="p-4 font-semibold" style={{ color: '#1D75DB' }}>{formatXAF(Number(c.total_cost || 0))}</td>
                  <td className="p-4"><span className={`badge ${statusColor(c.claim_status)}`}>{c.claim_status}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{c.submitted_at ? formatDate(c.submitted_at) : '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{c.service_completed_at ? formatDate(c.service_completed_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Page {currentPage} of {totalPages} ({totalCount} results)</span>
            <div className="flex gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={!hasPreviousPage} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-600">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentPage((p) => p + 1)} disabled={!hasNextPage} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-600">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
