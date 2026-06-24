"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Heart,
  Share2,
  Edit,
  Gift,
  Calendar,
  Eye,
  TrendingUp,
  Download,
  Target,
  BarChart3,
} from "lucide-react";
import { formatXAF } from "@/lib/utils";
import { getCampaign, listCampaignDonations, getCampaignDonationChart } from "@/actions/campaigns";

const chartConfig = {
  total_amount: {
    label: "Amount",
    color: "var(--primary)",
  },
} satisfies ChartConfig;
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<DonationChartPeriod>("30d");
  const [chartData, setChartData] = useState<DonationChartData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?redirect=/dashboard/donor/campaigns/${id}`);
    }
  }, [status, router, id]);

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const data = await getCampaign(id as string, token);
        if (!cancelled) setCampaign(data as CampaignDetail);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  useEffect(() => {
    if (!token || !id) return;
    let cancelled = false;

    async function fetchDonations() {
      try {
        const data = await listCampaignDonations(id as string, { status: "SUCCESS" });
        if (!cancelled) {
          setDonations(
            (data as any)?.json?.results ||
              (data as any)?.results ||
              (Array.isArray((data as any)?.json)
                ? (data as any).json
                : (data as any)?.json
                  ? [(data as any).json]
                  : []),
          );
        }
      } catch {
        // ignore
      }
    }
    fetchDonations();

    return () => {
      cancelled = true;
    };
  }, [token, id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchChart() {
      try {
        const data = await getCampaignDonationChart(id as string, chartPeriod);
        if (!cancelled) setChartData(data as DonationChartData);
      } catch {
        // ignore
      }
    }
    fetchChart();

    return () => {
      cancelled = true;
    };
  }, [id, chartPeriod]);

  async function handleDownloadCertificate() {
    if (!campaign || !token) return;
    setDownloadingCert(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
      const res = await fetch(
        `${baseUrl}/api/campaigns/${campaign.id}/certificate/`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${campaign.slug || "campaign"}_impact_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Certificate download failed", err);
    } finally {
      setDownloadingCert(false);
    }
  }

  if (isLoading) {
    return (
      <div className="h-full" style={{ background: "var(--background)" }}>
        <div className="pt-32 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#1DB1DB]" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center card p-10 max-w-sm">
          <p className="text-gray-500 mb-4">Campaign not found</p>
          <Link href="/dashboard/donor/campaigns" className="btn-primary">
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const pct =
    ((campaign.total_net_raised || 0) / (campaign.goal_amount || 1)) * 100;

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ── Header ── */}
      <div>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#1A1A2E] truncate">
              {campaign.title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {campaign.event_type}
            </p>
          </div>
          <span
            className="shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* ── Main Column ── */}
          <div className="md:col-span-2 space-y-6">
            {/* Cover Image */}
            {campaign.cover_image && (
              <div className="card overflow-hidden">
                <div className="relative h-56 w-full">
                  <Image
                    src={campaign.cover_image}
                    alt="Campaign cover"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={18} style={{ color: "var(--primary)" }} />
                <h2 className="font-bold text-[#1A1A2E]">Funding Progress</h2>
              </div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-[#1A1A2E]">
                    {pct.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatXAF(campaign.total_net_raised || 0)} of{" "}
                    {formatXAF(campaign.goal_amount || 0)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Raised</p>
                  <p className="font-bold text-lg text-[#1A1A2E]">
                    {formatXAF(campaign.total_net_raised || 0)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Goal</p>
                  <p className="font-bold text-lg text-[#1A1A2E]">
                    {formatXAF(campaign.goal_amount || 0)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="font-bold text-lg capitalize text-[#1A1A2E]">
                    {campaign.status || "Draft"}
                  </p>
                </div>
              </div>
            </div>

            {/* Donation Chart */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} style={{ color: "var(--primary)" }} />
                  <h2 className="font-bold text-[#1A1A2E]">Donation Trends</h2>
                </div>
                <div className="flex gap-1">
                  {(["7d", "30d", "90d", "1y", "all"] as DonationChartPeriod[]).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setChartPeriod(p)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                          chartPeriod === p
                            ? "text-white"
                            : "text-gray-500 hover:bg-gray-100"
                        }`}
                        style={
                          chartPeriod === p
                            ? { background: "var(--primary)" }
                            : undefined
                        }
                      >
                        {p === "all" ? "All" : p.replace("d", "D").replace("y", "Y")}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {chartData && chartData.series.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-52 w-full">
                  <LineChart data={chartData.series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return d.toLocaleDateString("en", { month: "short", day: "numeric" });
                      }}
                      fontSize={11}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                      fontSize={11}
                      tickMargin={4}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [formatXAF(Number(value)), "Amount"]}
                          labelFormatter={(label) =>
                            new Date(String(label)).toLocaleDateString("en", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          }
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="total_amount"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-sm text-gray-400">
                  No donations in this period
                </div>
              )}

              {chartData && (
                <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-sm text-[#1A1A2E]">
                      {formatXAF(Number(chartData.totals.amount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Donations</p>
                    <p className="font-bold text-sm text-[#1A1A2E]">
                      {chartData.totals.count}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description + Details */}
            <div className="card p-6">
              <h2 className="font-bold text-[#1A1A2E] mb-4">
                About This Campaign
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">
                {campaign.description}
              </p>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-500">Created</span>
                  <span className="ml-auto font-medium text-[#1A1A2E]">
                    {campaign.created_at
                      ? fmtDate(campaign.created_at)
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-500">Ends</span>
                  <span className="ml-auto font-medium text-[#1A1A2E]">
                    {campaign.end_date
                      ? fmtDate(campaign.end_date)
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Eye size={16} className="text-gray-400" />
                  <span className="text-gray-500">Visibility</span>
                  <span className="ml-auto font-medium text-[#1A1A2E]">
                    {campaign.is_public ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            </div>

            {/* Donations */}
            {donations.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Gift size={18} style={{ color: "var(--primary)" }} />
                  <h2 className="font-bold text-[#1A1A2E]">
                    Donations ({donations.length})
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A2E] truncate">
                          {donation.is_anonymous
                            ? "Anonymous"
                            : donation.donor_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {fmtDate(donation.created_at)}
                        </p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p
                          className="font-bold text-sm"
                          style={{ color: "var(--primary)" }}
                        >
                          {formatXAF(donation.amount)}
                        </p>
                        <p
                          className={`text-xs font-semibold ${
                            donation.status === "SUCCESS"
                              ? "text-emerald-600"
                              : donation.status === "FAILED"
                                ? "text-red-600"
                                : "text-amber-600"
                          }`}
                        >
                          {donation.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} style={{ color: "var(--primary)" }} />
                <h3 className="font-bold text-[#1A1A2E]">Campaign Stats</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Raised</p>
                  <p
                    className="text-2xl font-black"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatXAF(campaign.total_net_raised || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Goal Amount</p>
                  <p className="text-lg font-bold text-[#1A1A2E]">
                    {formatXAF(campaign.goal_amount || 0)}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Progress</p>
                  <p className="text-lg font-bold text-[#1A1A2E]">
                    {pct.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6 space-y-3">
              <h3 className="font-bold text-[#1A1A2E] mb-4">Actions</h3>
              <Link
                href={`/dashboard/donor/campaigns/${campaign.id}/edit`}
                className="btn-primary w-full text-sm"
              >
                <Edit size={16} /> Edit Campaign
              </Link>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `https://joy-fund.com/campaign/${campaign.id}`,
                  )
                }
                className="btn-primary w-full text-sm"
              >
                <Share2 size={16} /> Share Campaign
              </button>
              <Link
                href={`/campaign/${campaign.id}`}
                className="btn-outline w-full text-sm"
              >
                <Heart size={16} /> View Public Page
              </Link>
              {campaign.certificate_generated && (
                <button
                  onClick={handleDownloadCertificate}
                  disabled={downloadingCert}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer border-2 border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingCert ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {downloadingCert ? "Downloading..." : "Download Certificate"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
