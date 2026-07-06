"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { getMyCampaigns } from "@/actions/campaigns";
import { formatXAF } from "@/lib/utils";
import { useI18n } from "@/locales/client";

const statusStyle: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "text-emerald-700 bg-emerald-50" },
  DRAFT: { label: "Draft", className: "text-gray-600 bg-gray-100" },
  FUNDED: { label: "Funded", className: "text-blue-700 bg-blue-50" },
  CLOSED: { label: "Closed", className: "text-red-700 bg-red-50" },
  INACTIVE: { label: "Inactive", className: "text-orange-700 bg-orange-50" },
  CANCELLED: { label: "Cancelled", className: "text-red-700 bg-red-50" },
};

export default function CampaignsPage() {
  const router = useRouter();
  const t = useI18n();
  const { data: session, status } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;

  const [campaigns, setCampaigns] = useState<CampaignList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/dashboard/donor/campaigns");
    }
  }, [status, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function fetchData() {
      try {
        if (!token) return;
        const data = await getMyCampaigns(token);
        if (!cancelled) setCampaigns(Array.isArray(data) ? data : []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchData();

    return () => { cancelled = true; };
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      </div>
    );
  }

  const activeCount = campaigns.filter((c: any) => c.status === "ACTIVE").length;
  const totalRaised = campaigns.reduce((sum, c) => sum + Number(c.total_net_raised ?? 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-20 pb-24">
        {/* ── Header ── */}
        <header className="mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
                My JoyFunds
              </p>
              <h1 className="text-3xl font-black text-[#1A1A2E] leading-tight">
                Campaigns
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                Track progress and manage your JoyFund campaigns
              </p>
            </div>
            <Link
              href="/dashboard/donor/campaigns/create"
              className="text-sm font-bold shrink-0 transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              + New JoyFund
            </Link>
          </div>
        </header>

        {/* ── Summary ── */}
        {!isLoading && campaigns.length > 0 && (
          <div className="grid grid-cols-3 gap-0 mb-10 pb-8 border-b border-gray-200">
            <div className="text-center first:text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total campaigns</p>
              <p className="text-4xl font-black text-[#1A1A2E]">{campaigns.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Active now</p>
              <p className="text-4xl font-black" style={{ color: 'var(--primary)' }}>{activeCount}</p>
            </div>
            <div className="text-center last:text-right">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total raised</p>
              <p className="text-4xl font-black text-[#1A1A2E]">{formatXAF(totalRaised)} <span className="text-lg">XAF</span></p>
            </div>
          </div>
        )}

        {/* ── Campaigns ── */}
        {campaigns.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 mb-4">You haven&apos;t created any campaigns yet.</p>
            <Link
              href="/dashboard/donor/campaigns/create"
              className="text-sm font-bold"
              style={{ color: 'var(--primary)' }}
            >
              Create your first JoyFund →
            </Link>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200">
              <div className="col-span-5">Campaign</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Progress</div>
              <div className="col-span-2 text-right">Raised</div>
            </div>

            {campaigns.map((campaign: any) => {
              const progress = campaign.progress_percentage || 0;
              const raised = Number(campaign.total_net_raised ?? 0);
              const goal = Number(campaign.goal_amount ?? campaign.goal ?? 0);
              const st = statusStyle[campaign.status as string] || { label: campaign.status, className: "text-gray-600 bg-gray-100" };

              return (
                <Link
                  key={campaign.id}
                  href={`/dashboard/donor/campaigns/${campaign.id}`}
                  className="group grid grid-cols-12 gap-4 py-5 border-b border-gray-100 items-center hover:bg-gray-50/60 transition-colors -mx-1 px-1"
                >
                  {/* Campaign title + event type */}
                  <div className="col-span-5 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A2E] truncate group-hover:text-gray-600 transition-colors">
                      {campaign.title}
                    </p>
                    {campaign.event_type && (
                      <p className="text-xs text-gray-400 mt-0.5">{campaign.event_type}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${st.className}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--primary)' }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-10 text-right">{progress.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Raised / Goal + arrow */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1A1A2E]">{formatXAF(raised)}</p>
                      <p className="text-[10px] text-gray-400">of {formatXAF(goal)} XAF</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
