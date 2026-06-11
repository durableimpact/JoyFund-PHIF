"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeftRight, Loader2, Search, Eye } from "lucide-react";
import { useState } from "react";
import { formatXAF, formatDate } from "@/lib/utils";
import { listTransactions } from "@/actions/payments";

const STATUS_FILTERS = ["all", "SUCCESSFUL", "PENDING", "FAILED"];
const TYPE_FILTERS = ["all", "DONATION", "PLATFORM_FEE", "DISBURSEMENT", "REFUND"];

export default function TransactionsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const params: Record<string, string> = {};
  if (typeFilter !== "all") params.type = typeFilter;
  if (statusFilter !== "all") params.status = statusFilter;
  if (search) params.search = search;

  const { data: txns, isLoading } = useQuery({
    queryKey: ["transactions", token, params],
    queryFn: async () => await listTransactions(token, params),
    enabled: !!token,
  });
  const rows = txns?.results ?? [];

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
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="text-sm bg-transparent border-none outline-none w-full"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none w-full sm:w-auto">
          {TYPE_FILTERS.map(t => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none w-full sm:w-auto">
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
          ))}
        </select>
      </div>

      <div className="card p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#471DDB] animate-spin" /></div>
        ) : !rows.length ? (
          <p className="text-gray-400 text-sm text-center py-12">No transactions found</p>
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
              {rows.map((t) => (
                <div key={t.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Type</span><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{t.type_display}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Direction</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.direction === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.direction_display}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-900">{formatXAF(t.amount)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Currency</span><span className="text-gray-600">{t.currency}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.status === "SUCCESSFUL" ? "bg-green-100 text-green-700" : t.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{t.status_display}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Gateway TX</span><span className="text-gray-400 font-mono text-xs truncate max-w-[140px]">{t.gateway_transaction_id || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="text-gray-400 text-xs">{formatDate(t.created_at)}</span></div>
                  <div className="pt-1">
                    <Link href={`/dashboard/system-admin/transactions/${t.id}`}
                      className="text-xs font-semibold text-[#471DDB] hover:underline">View details →</Link>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["ID", "Type", "Direction", "Amount", "Currency", "Status", "Gateway TX ID", "Date", ""].map(h => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50">
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
                      <td className="py-3">
                        <Link href={`/dashboard/system-admin/transactions/${t.id}`}
                          className="p-1.5 hover:bg-[#471DDB]/10 rounded-lg text-gray-400 hover:text-[#471DDB] inline-block">
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
