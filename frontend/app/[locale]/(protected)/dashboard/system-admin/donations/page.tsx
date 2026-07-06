"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { useUrlSearchParams } from "@/hooks/use-url-search-params";
import { formatXAF, formatDate } from "@/lib/utils";
import { listAllDonations } from "@/actions/campaigns";
import Paginator from "@/components/shared/Paginator";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_FILTERS = ["all", "SUCCESS", "PENDING", "FAILED"];
const METHOD_FILTERS = ["all", "MTN", "ORANGE"];
const PAGE_SIZE = 20;

export default function AdminDonationsPage() {
  const [params, setParams] = useUrlSearchParams(
    { search: "", statusFilter: "all", methodFilter: "all", page: 1 },
    { page: Number }
  );
  const search = (params.search as string) || "";
  const statusFilter = (params.statusFilter as string) || "all";
  const methodFilter = (params.methodFilter as string) || "all";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

  const apiParams: Record<string, string> = { page: currentPage.toString(), page_size: PAGE_SIZE.toString() };
  if (search) apiParams.search = search;
  if (statusFilter !== "all") apiParams.status = statusFilter;
  if (methodFilter !== "all") apiParams.payment_method = methodFilter;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-donations", apiParams],
    queryFn: async () => await listAllDonations(apiParams),
  });
  const rows = (data as any)?.results ?? [];
  const totalCount = (data as any)?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Donations</h1>
          <p className="text-gray-500 text-sm">All platform donations and payments</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full sm:flex-1 sm:max-w-xs">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setParams({ search: e.target.value, page: 1 })}
            placeholder="Search donor or campaign..."
            className="text-sm bg-transparent border-none outline-none w-full"
          />
        </div>
        <select value={statusFilter} onChange={e => setParams({ statusFilter: e.target.value, page: 1 })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none w-full sm:w-auto">
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
          ))}
        </select>
        <select value={methodFilter} onChange={e => setParams({ methodFilter: e.target.value, page: 1 })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none w-full sm:w-auto">
          {METHOD_FILTERS.map(m => (
            <option key={m} value={m}>{m === "all" ? "All Methods" : m}</option>
          ))}
        </select>
      </div>

      <div className="card p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Skeleton className="h-6 w-6 rounded" /></div>
        ) : !rows.length ? (
          <p className="text-gray-400 text-sm text-center py-12">No donations found</p>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {rows.map((d: any) => (
                <Link key={d.id} href={`/dashboard/system-admin/donations/${d.id}`} className="block border border-gray-100 rounded-xl p-4 space-y-2 hover:border-[#471DDB]/30 transition-colors">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Campaign</span><span className="font-medium text-gray-900 truncate max-w-[200px]">{d.campaign_title}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Donor</span><span className="text-gray-900">{d.donor_name || "Anonymous"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-900">{formatXAF(d.amount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${d.status === "SUCCESS" ? "bg-green-100 text-green-700" : d.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{d.status}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="text-gray-400 text-xs">{formatDate(d.created_at)}</span></div>
                </Link>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Campaign", "Donor", "Amount", "Status", "Date"].map(h => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d: any) => (
                    <tr key={d.id} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = `/dashboard/system-admin/donations/${d.id}`}>
                      <td className="py-3 font-medium text-gray-900 max-w-[200px] truncate">{d.campaign_title}</td>
                      <td className="py-3 text-gray-600">{d.donor_name || "Anonymous"}</td>
                      <td className="py-3 font-bold text-gray-900">{formatXAF(d.amount)}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          d.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                          d.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
}
