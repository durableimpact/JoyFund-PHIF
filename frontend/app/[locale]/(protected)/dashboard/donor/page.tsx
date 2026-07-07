"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, ArrowRight, Heart, ArrowUpRight } from "lucide-react";
import { formatXAF } from "@/lib/utils";
import { getMyCampaigns, getMyDonations } from "@/actions/campaigns";
import { getDonorDashboard } from "@/actions/accounts";
import { useI18n } from "@/locales/client";

function getGreeting(t: any) {
  const h = new Date().getHours();
  if (h < 12) return t("dashboard.donor.greetingMorning");
  if (h < 17) return t("dashboard.donor.greetingAfternoon");
  return t("dashboard.donor.greetingEvening");
}

export default function DonorDashboardPage() {
  const router = useRouter();
  const t = useI18n();
  const { data: session, status } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;
  const donorProfileId = (session?.user?.userInfo as DonorInfo | undefined)
    ?.profile?.id;

  const [campaigns, setCampaigns] = useState<CampaignList[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    if (!token) return;
    let off = false;
    (async () => {
      try {
        const data = await getMyCampaigns(token);
        if (!off) setCampaigns(Array.isArray(data) ? data : []);
      } catch {}
      finally {
        if (!off) setCampaignsLoading(false);
      }
    })();
    return () => { off = true; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let off = false;
    (async () => {
      try {
        const data = await getMyDonations(token);
        if (!off) {
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
      } catch {}
      finally {
        if (!off) setDonationsLoading(false);
      }
    })();
    return () => { off = true; };
  }, [token]);

  useEffect(() => {
    if (!token || !donorProfileId) return;
    let off = false;
    (async () => {
      try {
        const data = await getDonorDashboard(donorProfileId, token);
        if (!off) setDashboardData(data);
      } catch {}
      finally {
        if (!off) setDashboardLoading(false);
      }
    })();
    return () => { off = true; };
  }, [token, donorProfileId]);

  const loading = campaignsLoading || donationsLoading || dashboardLoading;

  const userInfo = (session?.user?.userInfo as DonorInfo | undefined);
  const firstName = userInfo?.first_name || session?.user?.name?.split(" ")[0] || t("dashboard.donor.there");

  const totalRaised =
    dashboardData?.total_raised ??
    campaigns.reduce((s, c) => s + (c.total_net_raised || 0), 0);
  const campaignCount = dashboardData?.my_campaigns ?? campaigns.length;
  const totalDonated =
    donations.reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const livesImpacted = dashboardData?.lives_impacted ?? 0;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* ── Greeting hero ── */}
      <section className="container mx-auto pt-6 pb-8 px-4 animate-slide-up" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
        <p className="text-sm text-gray-400 mb-1 font-medium tracking-wide">{getGreeting(t)}</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-[var(--text)] mb-4">
          {firstName}.
        </h1>
        {!loading && totalRaised > 0 && (
          <p className="text-base text-gray-500 leading-relaxed">
            {t("dashboard.donor.youHaveRaised")}{" "}
            <span className="font-semibold text-[var(--text)]">{formatXAF(totalRaised)}</span>{" "}
            {t("dashboard.donor.soFarAcross")}{" "}
            <span className="font-semibold text-[var(--text)]">{campaignCount}</span>{" "}
            {campaignCount === 1 ? t("dashboard.donor.fund") : t("dashboard.donor.funds")}.
          </p>
        )}
        {!loading && totalRaised === 0 && campaigns.length === 0 && (
          <p className="text-base text-gray-500 leading-relaxed">
            {t("dashboard.donor.startFirstJoyFund")}
          </p>
        )}
        <Link
          href="/dashboard/donor/campaigns/create"
          className="btn-primary text-sm mt-5"
        >
          <Plus size={16} /> {t("dashboard.donor.newJoyFund")}
        </Link>
      </section>

      {/* ── Stat strip ── */}
      <section className="container mx-auto px-4 pb-10 animate-slide-up" style={{ animationDelay: "80ms", animationFillMode: "forwards" }}>
        <div className="flex items-center gap-0 border-y border-gray-200/80">
          {[
            { label: t("dashboard.donor.statRaised"), value: loading ? "—" : formatXAF(totalRaised), highlight: true },
            { label: t("dashboard.donor.statFunds"), value: loading ? "—" : String(campaignCount) },
            { label: t("dashboard.donor.statLives"), value: loading ? "—" : String(livesImpacted) },
            { label: t("dashboard.donor.statDonated"), value: loading ? "—" : formatXAF(totalDonated) },
          ].map((stat, i) => (
            <div key={stat.label} className="flex-1 py-4 px-4 first:pl-0 last:pr-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-1">{stat.label}</p>
              <p className={`font-display text-lg sm:text-xl ${stat.highlight ? "text-[var(--text)]" : "text-gray-700"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Campaigns + Recent gifts ── */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-[1fr_280px] gap-10">
          {/* Campaigns */}
          <div className="min-w-0 animate-slide-up" style={{ animationDelay: "160ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-[var(--text)]">
                {t("dashboard.donor.myJoyFunds")}
              </h2>
              <Link
                href="/dashboard/donor/campaigns"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                {t("dashboard.donor.all")} <ArrowRight size={12} />
              </Link>
            </div>

            {campaignsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-white/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-warm)]/10 flex items-center justify-center mx-auto mb-4">
                  <Heart size={20} className="text-[var(--accent-warm)]" />
                </div>
                <h3 className="font-semibold text-[var(--text)] mb-1.5 text-sm">
                  {t("dashboard.donor.noCampaigns")}
                </h3>
                <p className="text-gray-400 text-xs mb-5 max-w-[260px] mx-auto leading-relaxed">
                  {t("dashboard.donor.noCampaignsHint")}
                </p>
                <Link
                  href="/dashboard/donor/campaigns/create"
                  className="btn-primary text-sm !py-2.5 !px-5"
                >
                  <Plus size={14} /> {t("dashboard.donor.startJoyFund")}
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.slice(0, 4).map((c) => {
                  const progress = c.progress_percentage || 0;
                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/donor/campaigns/${c.id}`}
                      className="group block bg-white rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm text-[var(--text)] truncate pr-2">
                          {c.title}
                        </h3>
                        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[var(--primary)] transition-colors shrink-0" />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 tabular-nums shrink-0">
                          {formatXAF(Number(c.total_net_raised || 0))}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {campaigns.length > 4 && (
              <Link
                href="/dashboard/donor/campaigns"
                className="mt-3 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                {t("dashboard.donor.viewAllFunds", { count: campaignCount })} <ArrowRight size={11} />
              </Link>
            )}
          </div>

          {/* Recent gifts */}
          <div className="animate-slide-up" style={{ animationDelay: "240ms", animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl text-[var(--text)]">
                {t("dashboard.donor.recentGifts")}
              </h2>
              <Link
                href="/dashboard/donor/donations"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                {t("dashboard.donor.all")} <ArrowRight size={12} />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              {donationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 bg-gray-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : donations.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-xs mb-2">{t("dashboard.donor.noDonations")}</p>
                  <Link
                    href="/explore"
                    className="text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    {t("dashboard.donor.exploreCampaigns")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-0">
                  {donations.slice(0, 6).map((d: any, i: number) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-warm)]/10 flex items-center justify-center shrink-0">
                        <Heart size={10} className="text-[var(--accent-warm)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 truncate">
                          <span className="font-semibold text-[var(--text)]">{formatXAF(Number(d.amount ?? 0))}</span>
                          {" "}{t("dashboard.donor.to")}{" "}
                          <span className="font-medium text-gray-600">{t("dashboard.donor.campaignLabel")} #{d.campaign_id?.slice(0, 8)}</span>
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-300 shrink-0 tabular-nums">
                        {d.created_at
                          ? new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
