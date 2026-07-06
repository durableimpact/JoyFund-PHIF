"use client";
import { useI18n } from '@/locales/client';
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe, Loader2, Zap, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getGateway, listWebhookEvents } from "@/actions/payments";
import { DetailPageSkeleton } from "@/components/shared/PageSkeletons";

export default function GatewayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const gatewayId = parseInt(id, 10);

  const { data: gateway, isLoading: gLoading } = useQuery({
    queryKey: ["gateway", gatewayId, token],
    queryFn: async () => await getGateway(gatewayId, token),
    enabled: !!token && !isNaN(gatewayId),
  });

  const { data: webhooksRes, isLoading: wLoading } = useQuery({
    queryKey: ["gateway-webhooks", gatewayId, token],
    queryFn: async () => await listWebhookEvents(token, { gateway: String(gatewayId) }),
    enabled: !!token && !isNaN(gatewayId),
  });

  const webhooks = webhooksRes?.results ?? [];
  const loading = gLoading || wLoading;

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!gateway) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">Gateway not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-semibold text-[#471DDB]">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm shrink-0">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">{gateway.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gateway.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {gateway.is_active ? "Active" : "Inactive"}
              </span>
              <span className="text-gray-300 text-xs">•</span>
              <span className="text-gray-500 text-xs font-medium">ID: {gateway.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Details */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#471DDB]/10 flex items-center justify-center">
            <Globe size={20} className="text-[#471DDB]" />
          </div>
          <h3 className="font-bold text-gray-900">Gateway Details</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Name</p>
            <p className="text-sm font-semibold text-gray-900">{gateway.name}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-600">{gateway.description || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Status</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${gateway.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {gateway.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Created</p>
            <p className="text-sm text-gray-600">{formatDate(gateway.created_at)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-1">Updated</p>
            <p className="text-sm text-gray-600">{formatDate(gateway.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Webhook Events */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Zap size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Webhook Events</h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">{webhooks.length}</span>
        </div>

        {wLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : !webhooks.length ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Zap size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No webhook events for this gateway yet.</p>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {webhooks.map((w) => (
                <div key={w.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Event</span><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{w.event_type}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Received</span><span className="text-gray-400 text-xs">{formatDate(w.received_at)}</span></div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["ID", "Event Type", "Received At"].map(h => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((w) => (
                    <tr key={w.id} className="border-b border-gray-50">
                      <td className="py-3 text-gray-400 font-mono text-xs">{w.id}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          <Zap size={10} /> {w.event_type}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">{formatDate(w.received_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
