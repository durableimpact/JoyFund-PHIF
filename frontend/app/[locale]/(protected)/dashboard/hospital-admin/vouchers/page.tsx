'use client';
import { useUrlSearchParams } from '@/hooks/use-url-search-params';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, statusColor } from '@/lib/utils';
import { listVouchers } from '@/actions/vouchers';
import Paginator from '@/components/shared/Paginator';

const STATUS_FILTERS = ['all', 'ACTIVE', 'PENDING_CONFIRMATION', 'USED', 'EXPIRED'];
const PAGE_SIZE = 10;

export default function HospitalAdminVouchers() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [params, setParams] = useUrlSearchParams({ search: '', filter: 'all', page: 1 }, { page: Number });
  const search = (params.search as string) || '';
  const filter = (params.filter as string) || 'all';
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

  const queryParams: Record<string, string> = {
    page: currentPage.toString(),
    page_size: PAGE_SIZE.toString(),
  };
  if (search) queryParams.search = search;
  if (filter !== 'all') queryParams.status = filter;

  const { data, isLoading } = useQuery({
    queryKey: ['ha-vouchers-list', token, currentPage, search, filter],
    queryFn: () => listVouchers(token, queryParams),
    enabled: !!token,
  });

  const vouchers: any[] = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasNextPage = !!data?.next;
  const hasPreviousPage = !!data?.previous;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Vouchers</h1>
        <p className="text-gray-500 text-sm">{totalCount} total vouchers</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by code or beneficiary..." value={search} onChange={e => setParams({ search: e.target.value, page: 1 })} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={e => setParams({ filter: e.target.value, page: 1 })}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Code', 'Beneficiary', 'Status', 'Expiry', 'Created'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : vouchers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No vouchers found</td></tr>
              ) : vouchers.map((v: any) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-sm font-bold">
                    <Link href={`/dashboard/hospital-admin/vouchers/${v.id}`} className="text-gray-900 hover:text-[#1D75DB] hover:underline">
                      {v.voucher_code}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-700 text-xs">{v.beneficiary_name || '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(v.status)}`}>{v.status?.replace(/_/g, ' ')}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{v.expiry_date ? formatDate(v.expiry_date) : '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{v.created_at ? formatDate(v.created_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}
