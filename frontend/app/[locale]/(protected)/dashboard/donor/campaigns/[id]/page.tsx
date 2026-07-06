"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Share2,
  Edit,
  Download,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { formatXAF } from "@/lib/utils";
import { getCampaign, listCampaignDonations, getCampaignDonationChart, getCampaignAnalytics } from "@/actions/campaigns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { DetailPageSkeleton } from "@/components/shared/PageSkeletons";
import { useI18n } from "@/locales/client";

const chartConfig = { total_amount: { label: "Amount", color: "var(--primary)" } } satisfies ChartConfig;

const statusColor: Record<string, string> = {
  ACTIVE: "text-emerald-700 bg-emerald-50",
  DRAFT: "text-gray-600 bg-gray-100",
  FUNDED: "text-blue-700 bg-blue-50",
  CLOSED: "text-red-700 bg-red-50",
  INACTIVE: "text-orange-700 bg-orange-50",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useI18n();
  const { data: session, status } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<DonationChartPeriod>("30d");
  const [chartData, setChartData] = useState<DonationChartData | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<CampaignAnalyticsPeriod>("day");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?redirect=/dashboard/donor/campaigns/${id}`);
  }, [status, router, id]);

  useEffect(() => {
    if (!token || !id) return;
    let off = false;
    (async () => {
      try { const d = await getCampaign(id as string, token); if (!off) setCampaign(d as CampaignDetail); }
      finally { if (!off) setIsLoading(false); }
    })();
    return () => { off = true; };
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    let off = false;
    (async () => {
      try {
        const d = await listCampaignDonations(id as string, { status: "SUCCESS" });
        if (!off) setDonations((d as any)?.json?.results || (d as any)?.results || []);
      } catch {}
    })();
    return () => { off = true; };
  }, [token, id]);

  useEffect(() => {
    if (!id) return;
    let off = false;
    (async () => {
      try { const d = await getCampaignDonationChart(id as string, chartPeriod); if (!off) setChartData(d as DonationChartData); } catch {}
    })();
    return () => { off = true; };
  }, [id, chartPeriod]);

  useEffect(() => {
    if (!token || !id) return;
    let off = false;
    (async () => {
      try { const d = await getCampaignAnalytics(id as string, token, { period: analyticsPeriod }); if (!off) setAnalytics(d as CampaignAnalytics); } catch {}
    })();
    return () => { off = true; };
  }, [token, id, analyticsPeriod]);

  async function handleDownloadCertificate() {
    if (!campaign || !token) return;
    setDownloadingCert(true);
    try {
      const base = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
      const res = await fetch(`${base}/api/campaigns/${campaign.id}/certificate/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${campaign.slug || "campaign"}_certificate.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (err) { console.error("Certificate download failed", err); }
    finally { setDownloadingCert(false); }
  }

  if (isLoading) return <DetailPageSkeleton />;
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">Campaign not found</p>
          <Link href="/dashboard/donor/campaigns" className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Back to campaigns →</Link>
        </div>
      </div>
    );
  }

  const pct = ((campaign.total_net_raised || 0) / (campaign.goal_amount || 1)) * 100;
  const sc = statusColor[campaign.status as string] || "text-gray-600 bg-gray-100";

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ── Header ── */}
      <div className="max-w-4xl mx-auto px-4 pt-32 pb-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${sc}`}>{campaign.status}</span>
              <span className="text-xs text-gray-400">{campaign.event_type}</span>
            </div>
            <h1 className="text-2xl font-black text-[#1A1A2E] leading-tight">{campaign.title}</h1>
          </div>
        </div>

        {/* ── Progress ── */}
        <div className="mb-6 space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black" style={{ color: 'var(--primary)' }}>{formatXAF(campaign.total_net_raised || 0)}</span>
            <span className="text-xs text-gray-400">of {formatXAF(campaign.goal_amount || 0)} XAF</span>
            <span className="text-sm font-bold text-gray-500 ml-auto hidden sm:inline">{pct.toFixed(0)}%</span>
            <span className="text-xs text-gray-400 hidden sm:inline">{donations.length} donor{donations.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--primary)' }} />
          </div>
          <div className="flex items-center justify-between sm:hidden text-xs text-gray-400">
            <span>{pct.toFixed(0)}% funded</span>
            <span>{donations.length} donor{donations.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* ── Content: Tabs + Sidebar ── */}
        <div className="grid md:grid-cols-[1fr_280px] gap-10">
          <div className="min-w-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList variant="line" className="w-full justify-start gap-6 border-b border-gray-200 bg-transparent p-0 h-auto rounded-none">
                <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-gray-500 data-active:border-[var(--primary)] data-active:text-[#1A1A2E] data-active:bg-transparent hover:text-[#1A1A2E] transition-colors">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="donations" className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-gray-500 data-active:border-[var(--primary)] data-active:text-[#1A1A2E] data-active:bg-transparent hover:text-[#1A1A2E] transition-colors">
                  Donations ({donations.length})
                </TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-gray-500 data-active:border-[var(--primary)] data-active:text-[#1A1A2E] data-active:bg-transparent hover:text-[#1A1A2E] transition-colors">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <div className="py-8">
                {/* ═══ Overview Tab ═══ */}
                <TabsContent value="overview" className="focus-visible:outline-none space-y-8 w-full">
                  {campaign.description && (
                    <section>
                      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">About</h2>
                      <p className="text-sm text-gray-600 leading-relaxed">{campaign.description}</p>
                    </section>
                  )}
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Details</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Created</p>
                        <p className="text-[#1A1A2E] font-medium">{campaign.created_at ? fmtDate(campaign.created_at) : "—"}</p>
                      </div>
                      {campaign.end_date && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Ends</p>
                          <p className="text-[#1A1A2E] font-medium">{fmtDate(campaign.end_date)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Visibility</p>
                        <p className="text-[#1A1A2E] font-medium">{campaign.is_public ? "Public" : "Private"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Goal</p>
                        <p className="text-[#1A1A2E] font-medium">{formatXAF(campaign.goal_amount || 0)} XAF</p>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Recent activity</h2>
                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 overflow-x-auto">
                      {chartData && chartData.series.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-40 w-full">
                          <LineChart data={chartData.series} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(v: string) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} fontSize={11} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} fontSize={11} tickMargin={8} width={36} />
                            <ChartTooltip content={<ChartTooltipContent formatter={(v) => [formatXAF(Number(v)), ""]} labelFormatter={(l) => new Date(String(l)).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} />} />
                            <Line type="monotone" dataKey="total_amount" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                          </LineChart>
                        </ChartContainer>
                      ) : (
                        <p className="text-xs text-gray-400 py-6 text-center">No donations yet</p>
                      )}
                    </div>
                  </section>
                </TabsContent>

                {/* ═══ Donations Tab ═══ */}
                <TabsContent value="donations" className="focus-visible:outline-none w-full">
                  {donations.length === 0 ? (
                    <p className="text-sm text-gray-400 py-10 text-center">No donations yet</p>
                  ) : (
                    <div className="space-y-0">
                      <div className="grid grid-cols-12 gap-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200">
                        <div className="col-span-5">Donor</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-3">Date</div>
                        <div className="col-span-2 text-right">Amount</div>
                      </div>
                      {donations.map((d: any) => (
                        <div key={d.id} className="grid grid-cols-12 gap-4 py-4 border-b border-gray-100 items-center">
                          <div className="col-span-5 min-w-0">
                            <p className="text-sm font-medium text-[#1A1A2E] truncate">{d.is_anonymous ? "Anonymous" : d.donor_name}</p>
                          </div>
                          <div className="col-span-2">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              d.status === "SUCCESS" ? "text-emerald-700 bg-emerald-50" : d.status === "FAILED" ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"
                            }`}>{d.status}</span>
                          </div>
                          <div className="col-span-3 text-xs text-gray-500">{fmtDate(d.created_at)}</div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{formatXAF(d.amount)}</span>
                            <span className="text-xs text-gray-400 ml-0.5">XAF</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ═══ Analytics Tab ═══ */}
                <TabsContent value="analytics" className="focus-visible:outline-none space-y-8 w-full">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Donation trends</h2>
                      <div className="flex gap-1">
                        {(["7d", "30d", "90d", "1y", "all"] as DonationChartPeriod[]).map((p) => (
                          <button key={p} onClick={() => setChartPeriod(p)} className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors ${chartPeriod === p ? "text-white" : "text-gray-400 hover:text-gray-600"}`} style={chartPeriod === p ? { background: "var(--primary)" } : undefined}>
                            {p === "all" ? "All" : p.replace("d", "D").replace("y", "Y")}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-gray-100">
                      {chartData && chartData.series.length > 0 ? (
                        <>
                          <ChartContainer config={chartConfig} className="h-48 w-full">
                            <LineChart data={chartData.series} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(v: string) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} fontSize={11} tickMargin={8} />
                              <YAxis tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} fontSize={11} tickMargin={8} width={36} />
                              <ChartTooltip content={<ChartTooltipContent formatter={(v) => [formatXAF(Number(v)), ""]} labelFormatter={(l) => new Date(String(l)).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} />} />
                              <Line type="monotone" dataKey="total_amount" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                            </LineChart>
                          </ChartContainer>
                          <div className="flex gap-8 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                            <span>Total: <strong className="text-[#1A1A2E]">{formatXAF(Number(chartData.totals.amount))}</strong></span>
                            <span>Count: <strong className="text-[#1A1A2E]">{chartData.totals.count}</strong></span>
                          </div>
                        </>
                      ) : <p className="text-sm text-gray-400 py-8 text-center">No donations in this period</p>}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Page views</h2>
                      <div className="flex gap-1">
                        {(["day", "week", "month"] as CampaignAnalyticsPeriod[]).map((p) => (
                          <button key={p} onClick={() => setAnalyticsPeriod(p)} className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors ${analyticsPeriod === p ? "text-white" : "text-gray-400 hover:text-gray-600"}`} style={analyticsPeriod === p ? { background: "var(--primary)" } : undefined}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {analytics ? (
                      <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-5">
                        <div className="flex items-baseline gap-8">
                          <div><span className="text-2xl font-black text-[#1A1A2E]">{analytics.unique_views}</span><span className="text-xs text-gray-400 ml-1.5">unique</span></div>
                          <div><span className="text-2xl font-black text-[#1A1A2E]">{analytics.total_views}</span><span className="text-xs text-gray-400 ml-1.5">total</span></div>
                        </div>
                        {analytics.sources && Object.keys(analytics.sources).length > 0 && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Traffic sources</p>
                            <div className="space-y-2.5">
                              {Object.entries(analytics.sources).sort(([, a], [, b]) => b.unique - a.unique).map(([src, stats]) => (
                                <div key={src} className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-600 w-16 capitalize">{src}</span>
                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${analytics.unique_views > 0 ? (stats.unique / analytics.unique_views) * 100 : 0}%`, background: "var(--primary)" }} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-500 w-10 text-right">{stats.unique}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {analytics.timeline && analytics.timeline.length > 0 && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Views over time</p>
                            <ChartContainer config={chartConfig} className="h-36 w-full">
                              <LineChart data={analytics.timeline} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="period" tickLine={false} axisLine={false} tickFormatter={(v: string) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} fontSize={11} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} fontSize={11} tickMargin={8} width={36} allowDecimals={false} />
                                <ChartTooltip content={<ChartTooltipContent formatter={(v) => [`${v}`, ""]} labelFormatter={(l) => new Date(String(l)).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} />} />
                                <Line type="monotone" dataKey="unique" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                              </LineChart>
                            </ChartContainer>
                            <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                              <span>{analytics.start_date}</span><span>{analytics.end_date}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : <p className="text-sm text-gray-400 py-6 text-center">Loading analytics…</p>}
                  </section>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* ── Sidebar (always visible) ── */}
          <aside className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Actions</h3>
              <div className="space-y-2">
                <Link href={`/dashboard/donor/campaigns/${campaign.id}/edit`} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }}>
                  <Edit size={14} /> Edit
                </Link>
                <Popover>
                  <PopoverTrigger className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                    <Share2 size={14} /> Share
                  </PopoverTrigger>
                  <PopoverContent align="start" sideOffset={8} className="w-52 p-2">
                    <div className="space-y-0.5">
                      {[
                        { label: "Facebook", src: "fb", url: "https://www.facebook.com/sharer/sharer.php?u=" },
                        { label: "Twitter / X", src: "tw", url: "https://twitter.com/intent/tweet?url=&text=" },
                        { label: "WhatsApp", src: "whatsapp", url: "https://wa.me/?text=" },
                        { label: "LinkedIn", src: "linkedin", url: "https://www.linkedin.com/sharing/share-offsite/?url=" },
                      ].map((s) => (
                        <a key={s.src} href={`${s.url}${encodeURIComponent(`https://joy-fund.com/campaign/${campaign.id}?src=${s.src}`)}${s.src === "tw" || s.src === "whatsapp" ? encodeURIComponent(` ${campaign.title}`) : ""}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          <ExternalLink size={11} className="text-gray-400" />{s.label}
                        </a>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={() => { navigator.clipboard.writeText(`https://joy-fund.com/campaign/${campaign.id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors">
                        {copied ? <><Check size={11} className="text-emerald-500" /> Copied!</> : <><Copy size={11} /> Copy link</>}
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Link href={`/campaign/${campaign.id}`} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                  View public page
                </Link>
                {campaign.certificate_generated && (
                  <button onClick={handleDownloadCertificate} disabled={downloadingCert} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                    {downloadingCert ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {downloadingCert ? "Downloading…" : "Certificate"}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
