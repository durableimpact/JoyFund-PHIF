"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/shared/Navbar";
import {
  Heart,
  ArrowRight,
  HeartCrack,
  CalendarX2,
  Stethoscope,
  Wallet,
  Baby,
  TrendingDown,
} from "lucide-react";
import { useI18n } from "@/locales/client";
import type { LucideIcon } from "lucide-react";

const TEAL = "#0B7B63";

const partners = [
  {
    name: "Durable Impact",
    img: "https://durableimpact.org/assets/durable-impact-logo-removebg-preview.jpg",
  },
  {
    name: "Campay",
    img: "https://campay.net/static/v2/custom_assets/images/images/logo.png",
  },
  {
    name: "Partner Hospitals",
    img: "/assets/images/partner-hosptital-removebg-preview.png",
  },
];

export default function AboutPage() {
  const t = useI18n();

  const maternalStats: {
    icon: LucideIcon;
    value: string;
    label: string;
    source: string;
  }[] = [
    {
      icon: HeartCrack,
      value: t("about.stat1Value"),
      label: t("about.stat1Label"),
      source: t("about.statSourceRmncah"),
    },
    {
      icon: CalendarX2,
      value: t("about.stat2Value"),
      label: t("about.stat2Label"),
      source: t("about.statSourceRmncah"),
    },
    {
      icon: Stethoscope,
      value: t("about.stat3Value"),
      label: t("about.stat3Label"),
      source: t("about.statSourceRmncah"),
    },
    {
      icon: Wallet,
      value: t("about.stat4Value"),
      label: t("about.stat4Label"),
      source: t("about.statSourceNha"),
    },
  ];

  const newbornStats: { icon: LucideIcon; value: string; label: string }[] = [
    {
      icon: Baby,
      value: t("about.stat5Value"),
      label: t("about.stat5Label"),
    },
    {
      icon: TrendingDown,
      value: t("about.stat6Value"),
      label: t("about.stat6Label"),
    },
  ];

  const evolution = [
    { then: t("about.evolvedThen1"), now: t("about.evolvedNow1") },
    { then: t("about.evolvedThen2"), now: t("about.evolvedNow2") },
    { then: t("about.evolvedThen3"), now: t("about.evolvedNow3") },
    { then: t("about.evolvedThen4"), now: t("about.evolvedNow4") },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ════════════════════════════════════════════════════════════════
          HERO - About page (full-bleed image behind everything)
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[68vh] flex flex-col overflow-hidden">
        <Image
          src="/assets/images/about-us-joyfund-image.jpeg"
          alt="JoyFund about - community-powered maternal and newborn health"
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(6,14,12,0.78) 0%, rgba(6,14,12,0.42) 45%, rgba(6,14,12,0.62) 100%)",
          }}
        />

        <Navbar transparent />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20">
          <p className="text-[0.72rem] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white/70 mb-6">
            About JoyFund
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-md"
            style={{ letterSpacing: "-1px" }}
          >
            {t("about.title")}
          </h1>
          <p className="text-white/85 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed drop-shadow">
            {t("about.heroDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/get-support"
              className="bg-white font-bold px-8 py-3.5 rounded-full text-sm hover:opacity-90 transition-all"
              style={{ color: TEAL }}
            >
              Get Support
            </Link>
            <Link
              href="/how-to-start"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white/10 transition-all text-sm"
            >
              How JoyFund Works <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          01 - OUR STORY
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-black uppercase tracking-[0.25em] mb-3"
              style={{ color: TEAL }}
            >
              {t("about.storyKicker")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">
              {t("about.storyTitle")}
            </h2>
          </div>

          <p className="font-bold text-[#1A1A2E] mb-4 leading-relaxed">
            {t("about.storyLead")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.storyP1")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.storyP2")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.storyP3")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.storyP4")}
          </p>

          <div className="my-12 py-10 px-6 sm:px-10 rounded-3xl" style={{ background: "#F2F8F8" }}>
            <p className="text-gray-500 italic leading-relaxed mb-3">
              {t("about.storyQuoteLead")}
            </p>
            <p className="text-2xl sm:text-3xl font-black leading-snug" style={{ color: TEAL }}>
              &ldquo;{t("about.storyQuote")}&rdquo;
            </p>
          </div>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.storyP5")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.storyP6")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.storyP7")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            {t("about.storyP8")}
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          02 - WHY JOYFUND MATTERS (the numbers)
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ background: "#F3F9F9" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-black uppercase tracking-[0.25em] mb-3"
              style={{ color: TEAL }}
            >
              {t("about.mattersKicker")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] max-w-3xl mx-auto leading-snug">
              {t("about.mattersTitle")}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mt-5">
              {t("about.mattersLead")}
            </p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-2xl mx-auto mt-3">
              {t("about.mattersBody")}
            </p>
          </div>

          <p className="text-center font-bold text-[#1A1A2E] mb-8">
            {t("about.mattersNumbersTitle")}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {maternalStats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#0B7B63]/10 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(11,123,99,0.10)" }}>
                  <s.icon size={24} style={{ color: TEAL }} />
                </div>
                <div className="text-4xl font-black leading-none" style={{ color: TEAL }}>
                  {s.value}
                </div>
                <div className="text-[0.82rem] font-semibold text-[#1A1A2E] mt-3 leading-snug">
                  {s.label}
                </div>
                <div className="text-[0.65rem] text-gray-400 mt-3">{s.source}</div>
              </div>
            ))}
          </div>

          {/* Newborn consequences - teal band */}
          <div className="mt-12 rounded-3xl px-6 py-12 sm:px-12 text-center" style={{ background: TEAL }}>
            <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white/80 mb-8">
              {t("about.newbornTitle")}
            </h3>
            <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {newbornStats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl p-6 flex items-center gap-5 text-left"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(11,123,99,0.10)" }}>
                    <s.icon size={24} style={{ color: TEAL }} />
                  </div>
                  <div>
                    <div className="text-4xl font-black leading-none" style={{ color: TEAL }}>
                      {s.value}
                    </div>
                    <div className="text-sm font-semibold text-[#1A1A2E] mt-2 leading-snug">
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 text-center">
            <p className="font-bold text-[#1A1A2E] text-lg leading-snug">
              {t("about.mattersClosingLead")}
            </p>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mt-3">
              {t("about.mattersClosingText")}
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          03 - WHY WE EVOLVED
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs font-black uppercase tracking-[0.25em] mb-3"
              style={{ color: TEAL }}
            >
              {t("about.evolvedKicker")}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] max-w-2xl mx-auto leading-snug">
              {t("about.evolvedTitle")}
            </h2>
          </div>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3">
            {t("about.evolvedP1")}
          </p>
          <p className="font-bold text-[#1A1A2E] mb-4">{t("about.evolvedP1End")}</p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            {t("about.evolvedP2")}
          </p>

          <div
            className="my-10 rounded-r-3xl border-l-4 bg-[#F3F9F9] px-6 sm:px-8 py-6"
            style={{ borderColor: TEAL }}
          >
            <p className="text-xl sm:text-2xl font-black text-[#1A1A2E] leading-snug">
              {t("about.evolvedHighlight")}
            </p>
          </div>

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-4">
            {t("about.evolvedP3")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            {t("about.evolvedP4")}
          </p>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-3">
            {t("about.evolvedP5")}
          </p>
          <p className="font-bold text-[#1A1A2E] mb-12">{t("about.evolvedP5End")}</p>

          {/* Then / Now */}
          <h3 className="text-xl sm:text-2xl font-black text-[#1A1A2E] text-center mb-8">
            {t("about.evolvedHead")}
          </h3>
          <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-sm border border-gray-100">
            <div className="bg-[#F4F8FB] px-6 sm:px-8 py-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400 mb-6">
                {t("about.thenLabel")}
              </p>
              <ul className="space-y-5">
                {evolution.map((e) => (
                  <li
                    key={e.then}
                    className="flex items-start gap-3 text-gray-600 text-sm sm:text-base leading-snug"
                  >
                    <span className="w-2 h-2 rounded-full mt-1.5 bg-gray-300 flex-shrink-0" />
                    {e.then}
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 sm:px-8 py-8" style={{ background: TEAL }}>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/80 mb-6">
                {t("about.nowLabel")}
              </p>
              <ul className="space-y-5">
                {evolution.map((e) => (
                  <li
                    key={e.now}
                    className="flex items-start gap-3 text-white text-sm sm:text-base leading-snug font-medium"
                  >
                    <span className="w-2 h-2 rounded-full mt-1.5 bg-white flex-shrink-0" />
                    {e.now}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg sm:text-xl font-black text-[#1A1A2E] leading-snug">
              {t("about.evolvedPrinciple")}
            </p>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto mt-4">
              {t("about.evolvedClosing")}
            </p>
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 mt-8 font-bold text-sm hover:opacity-80 transition-all"
              style={{ color: TEAL }}
            >
              {t("about.evolvedReadMore")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PARTNERS / FEATURED IN
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-8 text-gray-400">
            {t("about.ourPartners")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {partners.map((p) => (
              <div key={p.name} className="flex flex-col items-center gap-3">
                <Image
                  src={p.img}
                  alt={p.name}
                  width={128}
                  height={64}
                  className="h-16 w-32 object-contain"
                />
                <span className="text-sm font-medium text-gray-600 text-center">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          DUAL CTA BANNERS - Discover / Create
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6">
          <div className="relative rounded-3xl overflow-hidden h-48 sm:h-56 flex items-center">
            <Image
              src="/assets/images/elderly-hospital-image-gemini.webp"
              alt="Donors supporting a JoyFund campaign"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 px-8">
              <h3 className="text-white text-xl sm:text-2xl font-black mb-4 leading-snug">
                {t("about.discoverTitle1")}
                <br />
                {t("about.discoverTitle2")}
              </h3>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-white font-bold px-6 py-3 rounded-full text-sm"
                style={{ color: "var(--secondary)" }}
              >
                {t("about.discoverButton")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden h-48 sm:h-56 flex items-center">
            <Image
              src="https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200&auto=format&fit=crop"
              alt="Person celebrating a milestone"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 px-8">
              <h3 className="text-white text-xl sm:text-2xl font-black mb-4 leading-snug">
                {t("about.createTitle1")}
                <br />
                {t("about.createTitle2")}
              </h3>
              <Link
                href="/dashboard/donor/campaigns/create"
                className="inline-flex items-center gap-2 bg-white font-bold px-6 py-3 rounded-full text-sm"
                style={{ color: "var(--secondary)" }}
              >
                {t("about.createButton")} <Heart size={16} className="fill-current" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="py-20 px-4"
        style={{ background: "linear-gradient(135deg, #1D38DB, #1DB1DB)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Your celebration could save a life
          </h2>
          <p className="text-white/80 mb-8">
            It takes 2 minutes to create a JoyFund. Your network does the rest.
          </p>
          <Link
            href="/dashboard/donor/campaigns/create"
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all"
            style={{ color: "var(--secondary)" }}
          >
            Start Your JoyFund <Heart size={18} className="fill-current" />
          </Link>
        </div>
      </section>
    </div>
  );
}