'use client';
import { useI18n } from '@/locales/client';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useUrlSearchParams } from '@/hooks/use-url-search-params';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { listBeneficiaries } from '@/actions/beneficiaries';
import { formatDate } from '@/lib/utils';
import Paginator from '@/components/shared/Paginator';

export default function AdminBeneficiaries() {
  const t = useI18n();
  const { data: session } = useSession();
  const [params, setParams] = useUrlSearchParams({ search: "", page: 1 }, { page: Number });
  const search = (params.search as string) || "";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data, isLoading: loading } = useQuery({
    queryKey: ['beneficiaries', token, currentPage, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: '10',
      };
      if (search) params.search = search;
      return await listBeneficiaries(token, params);
    },
    enabled: !!token,
  });

  const bens: Beneficiary[] = data?.results || [];
  const totalCount = data?.count || 0;
  const hasNextPage = !!data?.next;
  const hasPreviousPage = !!data?.previous;
  const totalPages = Math.ceil(totalCount / 10);

  return (<>

          <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">{t('systemAdmin.beneficiaries.title')}</h1>
        <p className="text-gray-500 text-sm">{totalCount} {t('systemAdmin.beneficiaries.enrolledSuffix')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            className="input-field pl-10" 
            placeholder={t('systemAdmin.beneficiaries.searchPlaceholder')} 
            value={search} 
            onChange={e => setParams({ search: e.target.value, page: 1 })} 
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[t('systemAdmin.beneficiaries.beneficiary'), t('systemAdmin.beneficiaries.healthId'), t('systemAdmin.beneficiaries.location'), t('systemAdmin.beneficiaries.phone'), t('systemAdmin.beneficiaries.category'), t('systemAdmin.beneficiaries.enrolled'), t('systemAdmin.beneficiaries.verified')].map((h, i) => (
                  <th key={i} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(7)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : bens.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">{t('systemAdmin.beneficiaries.noBeneficiaries')}</td></tr>
              ) : bens.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(b.full_name || '?').charAt(0)}
                      </div>
                      <Link href={`/dashboard/system-admin/beneficiaries/${b.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {b.full_name}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600">{b.digital_health_id || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">{b.city || '—'}{b.region && b.region !== b.city ? `, ${b.region}` : ''}</td>
                  <td className="p-4 text-gray-600 text-xs">{b.phone || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">{b.category || '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{b.created_at ? formatDate(b.created_at) : '—'}</td>
                  <td className="p-4">
                    <span className={`badge text-[10px] ${b.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.is_verified ? t('systemAdmin.beneficiaries.verifiedStatus') : t('systemAdmin.beneficiaries.pendingStatus')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalCount > 10 && (
          <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={10} onPageChange={setPage} />
        )}
      </div>
  
</>
);
}
