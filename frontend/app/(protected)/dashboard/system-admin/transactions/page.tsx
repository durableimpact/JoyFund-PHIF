"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Loader2, Search } from "lucide-react";
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
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-xs">
          <Search size={14} className="text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="text-sm bg-transparent border-none outline-none w-full"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none">
          {TYPE_FILTERS.map(t => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none">
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
          ))}
        </select>
      </div>

      <div className="card p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#471DDB] animate-spin" /></div>
        ) : !rows.length ? (
          <p className="text-gray-400 text-sm text-center py-12">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
