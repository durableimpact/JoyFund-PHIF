"use client";
import { useI18n } from '@/locales/client';
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { useUrlSearchParams } from "@/hooks/use-url-search-params";
import { formatXAF, formatDate } from "@/lib/utils";
import { listTransactions } from "@/actions/payments";
import Paginator from "@/components/shared/Paginator";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_FILTERS = ["all", "SUCCESSFUL", "PENDING", "FAILED"];
const TYPE_FILTERS = ["all", "DONATION", "PLATFORM_FEE", "DISBURSEMENT", "REFUND"];
const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [params, setParams] = useUrlSearchParams(
    { search: "", typeFilter: "all", statusFilter: "all", page: 1 },
    { page: Number }
  );
  const search = (params.search as string) || "";
  const typeFilter = (params.typeFilter as string) || "all";
  const statusFilter = (params.statusFilter as string) || "all";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

  const apiParams: Record<string, string> = { page: currentPage.toString(), page_size: PAGE_SIZE.toString() };
  if (typeFilter !== "all") apiParams.type = typeFilter;
  if (statusFilter !== "all") apiParams.status = statusFilter;
  if (search) apiParams.search = search;

  const { data: txns, isLoading } = useQuery({
    queryKey: ["transactions", token, apiParams],
    queryFn: async () => await listTransactions(token, apiParams),
    enabled: !!token,
  });
  const rows = txns?.results ?? [];
  const totalCount = txns?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Transactions</h1>
          <p className="text-gray-500 text-sm">All platform financial transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 w-full sm:flex-1 sm:max-w-xs">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setParams({ search: e.target.value, page: 1 })}
            placeholder="Search transactions..."
            className="text-sm bg-transparent border-none outline-none w-full"
          />
        </div>
        <select value={typeFilter} onChange={e => setParams({ typeFilter: e.target.value, page: 1 })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none w-full sm:w-auto">
          {TYPE_FILTERS.map(t => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setParams({ statusFilter: e.target.value, page: 1 })}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none w-full sm:w-auto">
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
          ))}
        </select>
      </div>

      <div className="card p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Skeleton className="h-6 w-6 rounded" /></div>
        ) : !rows.length ? (
          <p className="text-gray-400 text-sm text-center py-12">No transactions found</p>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
              {rows.map((t) => (
                <Link key={t.id} href={`/dashboard/system-admin/transactions/${t.id}`} className="block border border-gray-100 rounded-xl p-4 space-y-2 hover:border-[#471DDB]/30 transition-colors">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Type</span><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{t.type_display}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Direction</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.direction === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.direction_display}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-900">{formatXAF(t.amount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Currency</span><span className="text-gray-600">{t.currency}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === "SUCCESSFUL" ? "bg-green-100 text-green-700" : t.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{t.status_display}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Gateway TX</span><span className="text-gray-400 font-mono text-xs truncate max-w-[140px]">{t.gateway_transaction_id || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="text-gray-400 text-xs">{formatDate(t.created_at)}</span></div>
                </Link>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["ID", "Type", "Direction", "Amount", "Currency", "Status", "Gateway TX ID", "Date"].map(h => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = `/dashboard/system-admin/transactions/${t.id}`}>
                      <td className="py-3 text-gray-400 font-mono text-xs">{t.id.slice(0, 8)}...</td>
                      <td className="py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {t.type_display}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.direction === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {t.direction_display}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-gray-900">{formatXAF(t.amount)}</td>
                      <td className="py-3 text-gray-600">{t.currency}</td>
                      <td className="py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          t.status === "SUCCESSFUL" ? "bg-green-100 text-green-700" :
                          t.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {t.status_display}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 font-mono text-xs max-w-[100px] truncate">{t.gateway_transaction_id || "—"}</td>
                      <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(t.created_at)}</td>
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
