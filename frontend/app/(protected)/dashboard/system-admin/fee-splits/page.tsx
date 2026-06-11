"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Percent, Loader2 } from "lucide-react";
import { formatXAF, formatDate } from "@/lib/utils";
import { listFeeSplits } from "@/actions/payments";

export default function FeeSplitsPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: splitsRes, isLoading } = useQuery({
    queryKey: ["fee-splits", token],
    queryFn: async () => await listFeeSplits(token),
    enabled: !!token,
  });
  const splits = splitsRes?.results ?? [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Fee Splits</h1>
          <p className="text-gray-500 text-sm">Breakdown of platform fees across transactions</p>
        </div>
      </div>

      <div className="card p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#471DDB] animate-spin" />
          </div>
        ) : !splits.length ? (
          <p className="text-gray-400 text-sm text-center py-12">No fee splits recorded yet</p>
        ) : (<>
          <div className="md:hidden space-y-3">
            {splits.map((s) => (
              <div key={s.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Gross</span><span className="font-semibold text-gray-900">{formatXAF(s.gross_amount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Escrow</span><span className="font-semibold text-[#1DB1DB]">{formatXAF(s.escrow_amount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Platform</span><span className="font-semibold text-[#471DDB]">{formatXAF(s.platform_amount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Policy</span><span className="text-gray-600">{s.fee_policy_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Created</span><span className="text-gray-400 text-xs">{formatDate(s.created_at)}</span></div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["#", "Gross Amount", "Escrow Amount", "Platform Amount", "Fee Policy", "Created"].map(h => (
                    <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {splits.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="py-3 text-gray-400 font-mono text-xs">{s.id}</td>
                    <td className="py-3 font-semibold text-gray-900">{formatXAF(s.gross_amount)}</td>
                    <td className="py-3 font-semibold text-[#1DB1DB]">{formatXAF(s.escrow_amount)}</td>
                    <td className="py-3 font-semibold text-[#471DDB]">{formatXAF(s.platform_amount)}</td>
                    <td className="py-3 text-gray-600">{s.fee_policy_name}</td>
                    <td className="py-3 text-gray-400 text-xs">{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}
      </div>
    </>
  );
}
