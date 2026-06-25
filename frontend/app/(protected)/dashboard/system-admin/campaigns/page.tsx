'use client';
import { useUrlSearchParams } from '@/hooks/use-url-search-params';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { listCampaigns } from '@/actions/campaigns';
import Paginator from '@/components/shared/Paginator';

const PAGE_SIZE = 10;

export default function AdminCampaigns() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [params, setParams] = useUrlSearchParams({ search: "", page: 1 }, { page: Number });
  const search = (params.search as string) || "";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-campaigns', token, currentPage, search],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        page_size: PAGE_SIZE,
      };
      if (search) params.search = search;
      return await listCampaigns(params);
    },
    enabled: !!token,
  });

  const campaigns = (data as any)?.results || [];
  const totalCount = (data as any)?.count || 0;
  const hasNextPage = !!(data as any)?.next;
  const hasPreviousPage = !!(data as any)?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm">{totalCount} total campaigns</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#471DDB]/20 focus:border-[#471DDB] transition-all" 
          placeholder="Search by title or description…" 
          value={search} 
          onChange={e => setParams({ search: e.target.value, page: 1 })} 
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Campaign','Progress','Donations'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center py-16"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-16 text-gray-400 text-sm">{search ? 'No campaigns matching your search' : 'No campaigns yet'}</td></tr>
              ) : campaigns.map((c: CampaignList) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 bg-[#471DDB]">
                        <Megaphone size={16} />
                      </div>
                      <div className="max-w-62.5">
                        <Link href={`/dashboard/system-admin/campaigns/${c.id}`} className="font-bold text-gray-900 text-sm hover:text-[#471DDB] hover:underline line-clamp-1">{c.title}</Link>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5 min-w-[120px]">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-900">{formatXAF(Number(c.total_net_raised))}</span>
                        <span className="text-gray-400">/ {formatXAF(Number(c.goal))}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#471DDB] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(c.progress_percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users size={12} className="text-gray-400" />
                      {c.total_number_of_successfull_donations} donations
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
