'use client';
import { useUrlSearchParams } from '@/hooks/use-url-search-params';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Heart, Search } from 'lucide-react';
import { listBeneficiaries } from '@/actions/beneficiaries';
import { formatDate } from '@/lib/utils';
import Paginator from '@/components/shared/Paginator';
import { useI18n } from '@/locales/client';

const PAGE_SIZE = 10;

export default function HospitalAdminPatients() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const hospitalId = currentUser?.hospital?.id;

  const [params, setParams] = useUrlSearchParams({ search: "", page: 1 }, { page: Number });
  const search = (params.search as string) || "";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

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
        <h1 className="text-2xl font-black text-gray-900">{t('hospitalAdmin.patients.title')}</h1>
        <p className="text-gray-500 text-sm">{t('hospitalAdmin.patients.total', { count: totalCount })}</p>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-10"
          placeholder={t('hospitalAdmin.patients.searchPlaceholder')}
          value={search}
          onChange={e => setParams({ search: e.target.value, page: 1 })}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[t('hospitalAdmin.patients.colBeneficiary'), t('hospitalAdmin.patients.colHealthId'), t('hospitalAdmin.patients.colLocation'), t('hospitalAdmin.patients.colCategory'), t('hospitalAdmin.patients.colHealthIssues'), t('hospitalAdmin.patients.colEnrolled')].map(h => (
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
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">{t('hospitalAdmin.patients.noResults')}</td></tr>
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
                      ) : <span className="text-xs text-gray-400">{t('hospitalAdmin.patients.none')}</span>}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{b.created_at ? formatDate(b.created_at) : '—'}</td>
                   
                  </tr>
                );
              })}
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
