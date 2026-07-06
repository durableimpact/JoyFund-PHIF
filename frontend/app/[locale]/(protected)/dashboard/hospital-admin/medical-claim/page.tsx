'use client';
import { useUrlSearchParams } from '@/hooks/use-url-search-params';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatXAF, formatDate, statusColor } from '@/lib/utils';
import { getMedicalClaims } from '@/actions/hospital';
import Paginator from '@/components/shared/Paginator';
import { useI18n } from '@/locales/client';

const STATUS_FILTERS = ['all', 'PENDING', 'APPROVED', 'REJECTED'];
const PAGE_SIZE = 10;

export default function HospitalAdminMedicalClaims() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const hospitalId = currentUser?.hospital?.id;

  const [params, setParams] = useUrlSearchParams({ search: "", filter: "all", page: 1 }, { page: Number });
  const search = (params.search as string) || "";
  const filter = (params.filter as string) || "all";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

  const queryParams: Record<string, string> = {
    page: currentPage.toString(),
    page_size: PAGE_SIZE.toString(),
  };
  if (hospitalId) queryParams.hospital = hospitalId;
  if (filter !== 'all') queryParams.claim_status = filter;
  if (search) queryParams.search = search;

  const { data, isLoading } = useQuery({
    queryKey: ['ha-claims', token, currentPage, filter, search, hospitalId],
    queryFn: () => getMedicalClaims(token, queryParams),
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
        <h1 className="text-2xl font-black text-gray-900">{t('hospitalAdmin.medicalClaim.title')}</h1>
        <p className="text-gray-500 text-sm">{t('hospitalAdmin.medicalClaim.total', { count: totalCount })}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder={t('hospitalAdmin.medicalClaim.searchPlaceholder')} value={search} onChange={e => setParams({ search: e.target.value, page: 1 })} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={e => setParams({ filter: e.target.value, page: 1 })}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? t('hospitalAdmin.medicalClaim.allStatus') : s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[t('hospitalAdmin.medicalClaim.colClaimId'), t('hospitalAdmin.medicalClaim.colHospital'), t('hospitalAdmin.medicalClaim.colAmount'), t('hospitalAdmin.medicalClaim.colStatus'), t('hospitalAdmin.medicalClaim.colSubmittedAt'), t('hospitalAdmin.medicalClaim.colCompletedAt')].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : claims.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">{t('hospitalAdmin.medicalClaim.noResults')}</td></tr>
              ) : claims.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs font-bold">
                    <Link href={`/dashboard/hospital-admin/medical-claim/${c.id}`} className="text-gray-900 hover:text-[#1D75DB] hover:underline">
                      #{String(c.id).slice(-8)}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-700 text-xs">{c.hospital_name || '—'}</td>
                  <td className="p-4 font-semibold" style={{ color: '#1D75DB' }}>{formatXAF(Number(c.total_cost || 0))}</td>
                  <td className="p-4"><span className={`badge ${statusColor(c.claim_status)}`}>{c.claim_status.replace(/_/g, ' ')}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{c.submitted_at ? formatDate(c.submitted_at) : '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{c.service_completed_at ? formatDate(c.service_completed_at) : '—'}</td>
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
