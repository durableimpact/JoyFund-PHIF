"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useI18n } from "@/locales/client";
import {  Heart,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Cake,
  Gift,
  Hospital,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Users,
  Globe2,
  HandHeart,
  ClipboardCheck,
  TrendingUp,
  Building2,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import CampaignCard from "@/components/shared/CampaignCard";
import { listCampaigns, getPlatformStats } from "@/actions/campaigns";
import { useEffect, useState } from "react";

const stepIcons = [Cake, Gift, Hospital] as const;
const stepKeys = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;

const featureIcons = [
  Sparkles, ShieldCheck, Smartphone, TrendingUp,
  Users, Hospital, HandHeart, Globe2, Building2,
] as const;
const featureKeys = [
  "easy", "verified", "momo", "transparency",
  "diaspora", "hospital", "pooling", "reach", "partnerships",
] as const;

const whyJoyFundFeatures = [
  {
    title: "Built on Local Philanthropy",
    description:
      "JoyFund transforms everyday giving and moments of celebration into organised support for vulnerable mothers and newborns.",
  },
  {
    title: "Verified Support",
    description:
      "Women seeking support are screened against defined eligibility criteria, with healthcare needs verified through participating health facilities.",
  },
  {
    title: "Direct-to-Provider Payments",
    description:
      "Where healthcare costs are supported, funds are paid directly to participating providers rather than handed to beneficiaries.",
  },
  {
    title: "Transparent & Traceable",
    description:
      "Contributions, approved support and payments are digitally documented to strengthen accountability from giving to care.",
  },
  {
    title: "Community-Focused",
    description:
      "JoyFund addresses not only healthcare costs, but verified last-mile barriers such as transportation to care and referral facilities.",
  },
  {
    title: "Targeted Support",
    description:
      "JoyFund targets verified gaps that can remain even where public maternal and newborn health programmes already exist.",
  },
] as const;

const testimonialData = [
  {
    name: "Jean-Pierre M.",
    roleKey: "birthday",
    quoteKey: "quote1",
    avatar: "JM",
  },
  {
    name: "Solange N.",
    roleKey: "wedding",
    quoteKey: "quote2",
    avatar: "SN",
  },
  {
    name: "Dr. Mireille O.",
    roleKey: "hospital",
    quoteKey: "quote3",
    avatar: "MO",
  },
];

const faqKeys = ["what", "how", "donate", "eligible", "transparent", "goal"] as const;

export default function HomePage() {
  const t = useI18n();
  const [feedIdx, setFeedIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const activityFeed = [
    {
      id: 1,
      type: "donation",
      message: "20 XAF contributed to Solange & Eric's Wedding JoyFund",
      timeAgo: "3 hours ago",
    },
    {
      id: 2,
      type: "voucher",
      message: "Voucher JF3R8T generated for BEN-0071",
      timeAgo: "4 hours ago",
    },
  ];

  // Fetch campaigns with React Query
  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () =>
      await listCampaigns({
        status: "ACTIVE",
        is_public: true,
        is_active: true,
        min_progress_percentage: 0,
      }),
  });

  // Fetch platform stats with React Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => await getPlatformStats(),
    initialData: { lives_supported: 0, active_campaigns: 0, total_raised: "0" },
  });

  useEffect(() => {
    const t = setInterval(
      () => setFeedIdx((i: number) => (i + 1) % activityFeed.length),
      3000,
    );
    return () => clearInterval(t);
  }, []);

  const activeCampaigns = (campaignsResponse?.results || []).slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background photo */}
        {/* "url('https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1600&auto=format&fit=crop')", */}
        <div
          className="absolute inset-0 bg-transparent bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/images/hero-image-preg-joyfund.jpeg')",
            filter: "brightness(1.2) saturate(1.05)",
          }}
        />

        {/* Soft gradient overlay: dark at top, fades to page bg at bottom */}
        {/* <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,20,60,0.58) 0%, rgba(15,30,90,0.38) 38%, rgba(249,250,251,0.90) 80%, #F9FAFB 100%)",
          }}
        /> */}

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,20,60,0.10) 0%, rgba(10,20,60,0.05) 35%, rgba(255,255,255,0.02) 65%, rgba(249,250,251,0.50) 90%, #F9FAFB 100%)",
          }}
        />

        {/* Navbar sits on top of everything */}
        <Navbar transparent />

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-24">
          {/* Live toast pill */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8"></div>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8">
            {/* <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" /> */}
            {/* <span className="opacity-90 truncate max-w-xs">{activityFeed[feedIdx].message}</span>
              <span className="opacity-60 hidden sm:inline">{activityFeed[feedIdx].timeAgo}</span> */}
          </div>

          <div className="inline-flex items-center justify-center border border-white/60 bg-white/15 backdrop-blur-[2px] px-5 py-3 text-center mb-8">
            <span className="text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white">
              {t("hero.eyebrow")}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-md"
            style={{ letterSpacing: "-1px" }}
          >
            {t("hero.title")}
          </h1>

          {/* Subtext */}
          <p className="text-white/80 text-base sm:text-lg max-w-4xl mx-auto mb-10 leading-relaxed drop-shadow">
            {t("hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              href="/dashboard/donor/campaigns/create"
              className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2"
            >
              {t("hero.startCampaign")} <Sparkles size={18} className="fill-current" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white/10 transition-all"
            >
              {t("hero.exploreCampaigns")} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              {
                v: stats?.lives_supported,
                l: t("hero.stats.livesSupported"),
                color: "text-rose-300",
              },
              {
                v: stats?.active_campaigns,
                l: t("hero.stats.activeCampaigns"),
                color: "text-amber-300",
              },
              {
                v: stats?.total_raised,
                l: t("hero.stats.totalRaised"),
                color: "text-emerald-300",
              },
            ].map((s) => (
              <div
                key={s.l}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-white border border-white/20 flex flex-col items-center text-center"
              >
                <div className="text-lg font-black">{s.v}</div>
                <div className="text-xs opacity-70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Smooth wave into next section */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 40C360 80 1080 0 1440 40V80H0V40Z" fill="#F9FAFB" />
          </svg>
        </div>
      </section>

      {/* ── Launch a JoyFund ── */}
      <section id="make-an-impact" className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--primary)" }}
            >
              {t("how.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {stepKeys.map((key) => (
              <div key={key} className="flex flex-col gap-4">
                <div className="card p-5 text-sm text-gray-600 leading-relaxed">
                  <div className="font-black text-base text-[#1A1A2E] mb-2">
                    {t(`how.${key}.title`)}
                  </div>
                  <p>{t(`how.${key}.desc1`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      {/* <section id="make-an-impact" className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--primary)" }}
            >
              Launch a JoyFund to Save Lives
            </h2>

          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="card p-8 text-center relative">
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black"
                  style={{ background: "var(--primary)" }}
                >
                  {s.step}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mt-6 mb-5"
                  style={{ background: "rgba(29,56,219,0.08)" }}
                >
                  <s.icon size={26} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="text-lg font-black text-[#1A1A2E] mb-2">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── Why JoyFund ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[#1A1A2E]">
              {t("features.title")}
            </h2>
            {/*
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm">
              {t("features.subtitle")}
            </p>
            */}
          </div>

          {/*
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <div
                  key={key}
                  className="flex gap-4 p-6 rounded-2xl hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(29,56,219,0.08)" }}
                  >
                    <Icon size={22} style={{ color: "var(--primary)" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A2E] mb-1">{t(`features.${key}.title`)}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {t(`features.${key}.desc`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          */}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyJoyFundFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="flex flex-col gap-4 p-6 border border-gray-200 bg-white"
              >
                <div className="bg-[#cfe1c9] px-4 py-3 text-center font-black text-[#111827] text-base leading-snug">
                  {feature.title}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed text-left">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns ── */}
      <section className="py-16 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A2E]">
                {t("campaigns.activeTitle")}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {t("campaigns.activeSubtitle")}
              </p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: "var(--primary)" }}
            >
              {t("campaigns.seeAll")} <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact Model / About ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--primary)" }}
            >
              {t("model.label")}
            </p>
            <h2 className="text-3xl font-black text-[#1A1A2E] mb-4">
              {t("model.title")}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              {t("model.desc1")}
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {t("model.desc2")}
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full bg-[#F9FAFB] border border-gray-100 text-xs font-semibold text-[#1A1A2E]">
                {t("model.badge.momo")}
              </span>
              <span className="px-4 py-2 rounded-full bg-[#F9FAFB] border border-gray-100 text-xs font-semibold text-[#1A1A2E]">
                {t("model.badge.vouchers")}
              </span>
              <span className="px-4 py-2 rounded-full bg-[#F9FAFB] border border-gray-100 text-xs font-semibold text-[#1A1A2E]">
                {t("model.badge.transparency")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6 text-center">
              <ClipboardCheck
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                {t("model.card.verified")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("model.card.verifiedDesc")}
              </p>
            </div>
            <div className="card p-6 text-center">
              <Hospital
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                {t("model.card.hospital")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("model.card.hospitalDesc")}
              </p>
            </div>
            <div className="card p-6 text-center">
              <Globe2
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                {t("model.card.diaspora")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("model.card.diasporaDesc")}
              </p>
            </div>
            <div className="card p-6 text-center">
              <TrendingUp
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                {t("model.card.impact")}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("model.card.impactDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      {/*
        <section className="py-20 px-4 bg-[#F9FAFB]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black text-[#1A1A2E]">
                Voices from the Community
              </h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">
                Real celebrations, real impact, real stories from donors and
                partners across the JoyFund community.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="card p-6 bg-white">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic leading-relaxed mb-5">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "var(--primary)" }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1A1A2E]">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        */}

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-[#1A1A2E]">
              {t("faq.title")}
            </h2>
            <p className="text-gray-500 mt-3 text-sm">
              {t("faq.subtitle")}
            </p>
          </div>
          <div className="space-y-3">
            {faqKeys.map((key, i) => (
              <div key={key} className="card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold text-[#1A1A2E] text-sm sm:text-base">
                    {t(`faq.${key}.q`)}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    style={{ color: "var(--primary)" }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {t(`faq.${key}.a`)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-20 px-4"
        style={{ background: "linear-gradient(135deg, #1D38DB, #1DB1DB)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-white/80 mb-8">
            {t("cta.subtitle")}
          </p>
          <Link
            href="/dashboard/donor/campaigns/create"
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all"
            style={{ color: "var(--secondary)" }}
          >
            {t("cta.button")} <Heart size={18} className="fill-current" />
          </Link>
        </div>
      </section>
    </div>
  );
}
