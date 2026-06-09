'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Megaphone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Tag,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { listCampaigns } from '@/actions/campaigns';

const PAGE_SIZE = 10;

export default function AdminCampaigns() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const statusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'DRAFT': return 'text-gray-600 bg-gray-50';
      case 'FUNDED': return 'text-blue-600 bg-blue-50';
      case 'CLOSED': return 'text-red-600 bg-red-50';
      case 'INACTIVE': return 'text-orange-600 bg-orange-50';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
          placeholder="Search by title, donor name, or description…" 
          value={search} 
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Campaign','Donor','Progress','Status','Created'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-16"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">{search ? 'No campaigns matching your search' : 'No campaigns yet'}</td></tr>
              ) : campaigns.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 bg-[#471DDB]">
                        <Megaphone size={16} />
                      </div>
                      <div className="max-w-[250px]">
                        <Link href={`/dashboard/system-admin/campaigns/${c.id}`} className="font-bold text-gray-900 text-sm hover:text-[#471DDB] hover:underline line-clamp-1">{c.title}</Link>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                          <Tag size={10} />
                          <span className="font-medium uppercase">{c.event_type}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <UserIcon size={12} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{c.donor_name || 'Donor'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1.5 min-w-[120px]">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-900">{formatXAF(Number(c.total_net_raised))}</span>
                        <span className="text-gray-400">/ {formatXAF(Number(c.goal_amount))}</span>
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={12} className="text-gray-400" />
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-xs text-gray-600">
              Showing <span className="font-semibold">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-semibold">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of <span className="font-semibold">{totalCount}</span> results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={!hasPreviousPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isCurrentPage
                          ? 'bg-[#471DDB] text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNextPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
