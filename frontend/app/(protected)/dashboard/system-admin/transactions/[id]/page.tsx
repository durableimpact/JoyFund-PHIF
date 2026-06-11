"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft, Loader2, ArrowDownLeft, ArrowUpRight, Clock, ExternalLink,
} from "lucide-react";
import { formatXAF, formatDate, formatDateTime } from "@/lib/utils";
import { getTransaction } from "@/actions/payments";

const statusColors: Record<string, string> = {
  SUCCESSFUL: "text-green-600 bg-green-50 border-green-100",
  PENDING: "text-yellow-600 bg-yellow-50 border-yellow-100",
  FAILED: "text-red-600 bg-red-50 border-red-100",
};
const directionColors: Record<string, string> = {
  IN: "bg-green-100 text-green-700",
  OUT: "bg-red-100 text-red-700",
};
const typeColors: Record<string, string> = {
  DONATION: "bg-purple-100 text-purple-700",
  PLATFORM_FEE: "bg-blue-100 text-blue-700",
  DISBURSEMENT: "bg-amber-100 text-amber-700",
  REFUND: "bg-cyan-100 text-cyan-700",
};
function fmtLabel(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: tx, isLoading, isError } = useQuery({
    queryKey: ["transaction", id, token],
    queryFn: async () => await getTransaction(id, token),
    enabled: !!id && !!token,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-[#471DDB]" />
      </div>
    );
  }

  if (isError || !tx) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-gray-400 text-sm">Transaction not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-semibold text-[#471DDB]">Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm shrink-0">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Transaction Details</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[tx.status] || "text-gray-600 bg-gray-50 border-gray-100"}`}>
                {tx.status}
              </span>
              <span className="text-gray-300 text-xs">•</span>
              <span className="text-gray-500 text-xs font-medium truncate">ID: {tx.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tx.direction === "IN" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {tx.direction === "IN" ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black">{formatXAF(tx.amount)}</p>
            <p className="text-xs text-gray-400 font-medium">{tx.currency} · {tx.direction === "IN" ? "Incoming" : "Outgoing"}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Transaction Type</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[tx.type] || "bg-gray-100 text-gray-700"}`}>{fmtLabel(tx.type)}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Status</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[tx.status] || "bg-gray-50 text-gray-600 border border-gray-100"}`}>{fmtLabel(tx.status)}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Direction</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${directionColors[tx.direction] || "bg-gray-100 text-gray-700"}`}>{tx.direction === "IN" ? "Incoming" : "Outgoing"}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Gateway Transaction ID</p>
            <p className="text-xs font-mono text-gray-700 break-all">{tx.gateway_transaction_id || "—"}</p>
          </div>
          {tx.gateway_id && (
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Gateway</p>
              <Link href={`/dashboard/system-admin/gateways/${tx.gateway_id}`} className="text-xs font-semibold text-[#471DDB] hover:underline inline-flex items-center gap-1">
                View Gateway <ExternalLink size={10} />
              </Link>
            </div>
          )}
          {tx.donation_id && (
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Donation</p>
              <p className="text-xs font-mono text-gray-700 break-all">{tx.donation_id}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Created</p>
            <p className="text-sm text-gray-700">{formatDateTime(tx.created_at)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Updated</p>
            <p className="text-sm text-gray-700">{formatDateTime(tx.updated_at)}</p>
          </div>
        </div>

        {tx.source_id && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Source Account</p>
            <p className="text-xs font-mono text-gray-700 break-all">{tx.source_id}</p>
          </div>
        )}
        {tx.destination_id && (
          <div className="mt-3">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Destination Account</p>
            <p className="text-xs font-mono text-gray-700 break-all">{tx.destination_id}</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      {tx.metadata && Object.keys(tx.metadata).length > 0 && (
        <div className="card p-4 md:p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Metadata</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(tx.metadata).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-xl">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">{key}</p>
                <p className="text-xs text-gray-700 break-all">{typeof value === "object" ? JSON.stringify(value) : String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History */}
      {tx.events && tx.events.length > 0 && (
        <div className="card p-4 md:p-6">
          <h3 className="font-bold text-gray-900 text-sm mb-6 flex items-center gap-2">
            <Clock size={18} className="text-[#471DDB]" />
            Status History
          </h3>
          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {tx.events.map((event, idx) => (
              <div key={event.id || idx} className="relative pl-8">
                <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  event.status === "SUCCESSFUL" ? "bg-green-500" :
                  event.status === "FAILED" ? "bg-red-500" :
                  "bg-gray-300"
                }`} />
                <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{event.status}</p>
                {event.notes && <p className="text-[10px] text-gray-500 mt-0.5">{event.notes}</p>}
                <p className="text-[9px] text-gray-400 mt-1">{formatDateTime(event.changed_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
