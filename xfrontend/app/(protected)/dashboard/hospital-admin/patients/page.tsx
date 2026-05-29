'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Heart, Search } from 'lucide-react';
import { listBeneficiaries } from '@/actions/beneficiaries';
import { formatDate } from '@/lib/utils';

const PAGE_SIZE = 10;

export default function HospitalAdminPatients() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const hospitalId = currentUser?.hospital?.id;

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['ha-patients', token, hospitalId, currentPage, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
      };
      if (hospitalId) params.hospital = hospitalId;
      if (search) params.search = search;
      const res = await listBeneficiaries(token, params);
      return (res as any)?.json || res;
    },
    enabled: !!token && !!hospitalId,
  });

  const patients: any[] = data?.results || [];
  const totalCount = data?.count || 0;
  const hasNextPage = !!data?.next;
  const hasPreviousPage = !!data?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Patients</h1>
        <p className="text-gray-500 text-sm">{totalCount} beneficiaries at this hospital</p>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-10"
          placeholder="Search by name, health ID, city..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Beneficiary', 'Health ID', 'Location', 'Category', 'Health Issues', 'Enrolled'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(7)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : patients.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">No patients found</td></tr>
              ) : patients.map((b: any) => {
                const issueCount = (b.health_issues || []).length;
                return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(b.full_name || '?').charAt(0)}
                        </div>
                        <Link href={`/dashboard/hospital-admin/patients/${b.id}`} className="font-semibold text-gray-900 hover:text-[#1D75DB]">
                          {b.full_name}
                        </Link>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-600">{b.digital_health_id || '—'}</td>
                    <td className="p-4 text-gray-600 text-xs">{b.city || '—'}{b.region && b.region !== b.city ? `, ${b.region}` : ''}</td>
                    <td className="p-4 text-gray-600 text-xs">{b.category?.replace(/_/g, ' ') || '—'}</td>
                    <td className="p-4">
                      {issueCount > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Heart size={12} className="text-red-400" />
                          <span className="text-xs font-semibold text-gray-700">{issueCount}</span>
                        </div>
                      ) : <span className="text-xs text-gray-400">None</span>}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{b.created_at ? formatDate(b.created_at) : '—'}</td>
                   
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages} ({totalCount} results)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={!hasPreviousPage}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-600"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!hasNextPage}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
