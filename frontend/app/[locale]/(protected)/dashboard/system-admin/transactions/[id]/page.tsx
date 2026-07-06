"use client";
import { useI18n } from '@/locales/client';
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft, Loader2, ArrowDownLeft, ArrowUpRight, Clock, ExternalLink,
} from "lucide-react";
import { formatXAF, formatDateTime } from "@/lib/utils";
import { getTransaction } from "@/actions/payments";
import { DetailPageSkeleton } from "@/components/shared/PageSkeletons";

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1.5">{label}</p>
      {children}
    </div>
  );
}

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
    return <DetailPageSkeleton />;
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
    <div className="space-y-6 pb-12">
      {/* Header */}
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

      {/* Overview Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${tx.direction === "IN" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {tx.direction === "IN" ? <ArrowDownLeft size={28} /> : <ArrowUpRight size={28} />}
          </div>
          <div>
            <p className="text-4xl font-black">{formatXAF(tx.amount)}</p>
            <p className="text-sm text-gray-400 font-medium">{tx.currency} &middot; {tx.direction === "IN" ? "Incoming" : "Outgoing"}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Field label="Transaction Type">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[tx.type] || "bg-gray-100 text-gray-700"}`}>{fmtLabel(tx.type)}</span>
          </Field>
          <Field label="Status">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[tx.status] || "bg-gray-50 text-gray-600 border border-gray-100"}`}>{fmtLabel(tx.status)}</span>
          </Field>
          <Field label="Direction">
            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${directionColors[tx.direction] || "bg-gray-100 text-gray-700"}`}>{tx.direction === "IN" ? "Incoming" : "Outgoing"}</span>
          </Field>
          <Field label="Gateway Transaction ID">
            <p className="text-sm font-mono text-gray-700 break-all">{tx.gateway_transaction_id || "&mdash;"}</p>
          </Field>
          {tx.gateway_id && (
            <Field label="Gateway">
              <Link href={`/dashboard/system-admin/gateways/${tx.gateway_id}`} className="text-sm font-semibold text-[#471DDB] hover:underline inline-flex items-center gap-1">
                View Gateway <ExternalLink size={12} />
              </Link>
            </Field>
          )}
          {tx.donation_id && (
            <Field label="Donation ID">
              <p className="text-sm font-mono text-gray-700 break-all">{tx.donation_id}</p>
            </Field>
          )}
          <Field label="Created">
            <p className="text-sm text-gray-700">{formatDateTime(tx.created_at)}</p>
          </Field>
          <Field label="Updated">
            <p className="text-sm text-gray-700">{formatDateTime(tx.updated_at)}</p>
          </Field>
        </div>

        {(tx.source_id || tx.destination_id) && (
          <div className="mt-6 pt-6 border-t border-gray-100 grid sm:grid-cols-2 gap-6">
            {tx.source_id && (
              <Field label="Source Account">
                <p className="text-sm font-mono text-gray-700 break-all">{tx.source_id}</p>
              </Field>
            )}
            {tx.destination_id && (
              <Field label="Destination Account">
                <p className="text-sm font-mono text-gray-700 break-all">{tx.destination_id}</p>
              </Field>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      {tx.metadata && Object.keys(tx.metadata).length > 0 && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4">Metadata</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
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
