"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/shared/Navbar";
import Reveal from "@/components/shared/Reveal";
import { useI18n } from "@/locales/client";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  CreditCard,
  Share2,
  Shield,
  Globe2,
  HelpCircle,
  FileText,
  Lock,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

const TEAL = "#0B7B63";

export default function ResourcesPage() {
  const t = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const gettingStartedGuides = [
    {
      icon: Sparkles,
      title: t("resources.page.guide1Title"),
      desc: t("resources.page.guide1Desc"),
      href: "/dashboard/donor/campaigns/create",
    },
    {
      icon: Heart,
      title: t("resources.page.guide2Title"),
      desc: t("resources.page.guide2Desc"),
      href: "/explore",
    },
    {
      icon: CreditCard,
      title: t("resources.page.guide3Title"),
      desc: t("resources.page.guide3Desc"),
      href: "/pricing",
    },
  ];

  const howItWorksSteps = [
    { n: "01", title: t("resources.page.step1Title"), desc: t("resources.page.step1Desc") },
    { n: "02", title: t("resources.page.step2Title"), desc: t("resources.page.step2Desc") },
    { n: "03", title: t("resources.page.step3Title"), desc: t("resources.page.step3Desc") },
    { n: "04", title: t("resources.page.step4Title"), desc: t("resources.page.step4Desc") },
  ];

  const understandingResources = [
    {
      icon: Share2,
      title: t("resources.page.resource1Title"),
      desc: t("resources.page.resource1Desc"),
      href: "/#make-an-impact",
    },
    {
      icon: Shield,
      title: t("resources.page.resource2Title"),
      desc: t("resources.page.resource2Desc"),
      href: "/trust-and-transparency",
    },
    {
      icon: Globe2,
      title: t("resources.page.resource3Title"),
      desc: t("resources.page.resource3Desc"),
      href: "/countries",
    },
    {
      icon: BookOpen,
      title: t("resources.page.resource4Title"),
      desc: t("resources.page.resource4Desc"),
      href: "/about",
    },
  ];

  const faqs = [
    { q: t("resources.page.faqQ1"), a: t("resources.page.faqA1") },
    { q: t("resources.page.faqQ2"), a: t("resources.page.faqA2") },
    { q: t("resources.page.faqQ3"), a: t("resources.page.faqA3") },
    { q: t("resources.page.faqQ4"), a: t("resources.page.faqA4") },
    { q: t("resources.page.faqQ5"), a: t("resources.page.faqA5") },
  ];

  const legalResources = [
    {
      icon: FileText,
      title: t("resources.page.termsTitle"),
      desc: t("resources.page.termsDesc"),
      href: "/terms",
    },
    {
      icon: Lock,
      title: t("resources.page.privacyTitle"),
      desc: t("resources.page.privacyDesc"),
      href: "/privacy",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ════════════════════════════════════════════════════════════════
          HERO - solid teal background with hero image (same pattern as
          the get-support page: image anchored right/bottom, dark overlay
          for mobile & tablet readability).
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden pt-28 md:pt-36"
        style={{ background: "#1EA2A0" }}
      >
        <div className="relative z-20 max-w-4xl mx-auto px-6 pb-16 sm:pb-20 text-center">
          <Reveal>
            <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-white/80 mb-6">
              <span className="h-px w-7 bg-white/50" />
              {t("resources.page.heroKicker")}
              <span className="h-px w-7 bg-white/50" />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6 drop-shadow-md">
              {t("resources.page.heroTitleLine1")}
              <br />
              {t("resources.page.heroTitleLine2")}
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-white text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              {t("resources.page.heroDesc")}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <a
              href="#getting-started"
              className="inline-block bg-white font-bold px-8 py-4 rounded-full text-sm hover:opacity-90 transition-all shadow-lg"
              style={{ color: "var(--secondary)" }}
            >
              {t("resources.page.heroCta")}
            </a>
          </Reveal>
        </div>

        {/* Hero image - anchored right/bottom, responsive like get-support */}
        <div className="absolute right-0 bottom-0 w-full sm:w-3/4 md:w-[55%] lg:w-1/2 h-[45%] sm:h-[55%] md:h-[62%] lg:h-[85%] pointer-events-none z-0">
          <Image
            src="/assets/images/get-support-hero-image.png"
            alt=""
            width={1264}
            height={842}
            priority
            className="w-full h-full object-cover object-right object-bottom"
          />
        </div>

        {/* Dark overlay for readability - mobile & tablet only */}
        <div
          className="absolute inset-0 z-10 pointer-events-none lg:hidden"
          style={{
            background:
              "linear-gradient(100deg, rgba(4,10,9,0.55) 0%, rgba(4,10,9,0.35) 50%, rgba(4,10,9,0.5) 100%)",
          }}
        />
      </section>

      {/* ════════════════════════════════════════════════════════════════
          GETTING STARTED
          ════════════════════════════════════════════════════════════════ */}
      <section id="getting-started" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: TEAL }}
              >
                {t("resources.page.gettingStartedTitle")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] max-w-2xl mx-auto leading-snug">
                {t("resources.page.gettingStartedTitle")}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-xl mx-auto mt-4">
                {t("resources.page.gettingStartedDesc")}
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gettingStartedGuides.map((guide, i) => (
              <Reveal key={guide.title} delay={i * 80}>
                <Link
                  href={guide.href}
                  className="group rounded-2xl border border-gray-200 p-6 hover:border-[#3D77B9]/30 hover:shadow-md transition-all h-full flex flex-col"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(29,56,219,0.08)" }}
                  >
                    <guide.icon size={22} style={{ color: "var(--secondary)" }} />
                  </div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2">{guide.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{guide.desc}</p>
                  <span
                    className="inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-0.5"
                    style={{ color: "var(--primary)" }}
                  >
                    {t("resources.page.readMore")} <ArrowRight size={14} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS - Step-by-step visual guide
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ background: "#F3F9F9" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: TEAL }}
              >
                {t("resources.page.howItWorksKicker")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] max-w-2xl mx-auto leading-snug">
                {t("resources.page.howItWorksTitle")}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto mt-4">
                {t("resources.page.howItWorksDesc")}
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#0B7B63]/10 h-full relative">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-sm font-black"
                    style={{ background: "rgba(11,123,99,0.12)", color: TEAL }}
                  >
                    {step.n}
                  </div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                  {/* Connector arrow for desktop */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 text-gray-300">
                      <ArrowRight size={18} />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          UNDERSTANDING JOYFUND
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: TEAL }}
              >
                {t("resources.page.understandingTitle")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] max-w-2xl mx-auto leading-snug">
                {t("resources.page.understandingTitle")}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto mt-4">
                {t("resources.page.understandingDesc")}
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6">
            {understandingResources.map((resource, i) => (
              <Reveal key={resource.title} delay={i * 80}>
                <Link
                  href={resource.href}
                  className="group rounded-2xl border border-gray-200 p-6 hover:border-[#3D77B9]/30 hover:shadow-md transition-all h-full flex flex-col"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(29,56,219,0.08)" }}
                    >
                      <resource.icon size={20} style={{ color: "var(--secondary)" }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1A1A2E] mb-2">{resource.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">{resource.desc}</p>
                      <span
                        className="inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-0.5"
                        style={{ color: "var(--primary)" }}
                      >
                        {t("resources.page.learnMore")} <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FAQ SECTION
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ background: "#F3F9F9" }}>
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: TEAL }}
              >
                {t("resources.page.faqKicker")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">
                {t("resources.page.faqTitle")}
              </h2>
            </div>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <h3 className="font-bold text-[#1A1A2E] text-sm sm:text-base">{faq.q}</h3>
                    <span className="shrink-0 text-gray-400">
                      {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5">
                      <div className="w-full h-px bg-gray-100 mb-4" />
                      <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HELP CTA BANNER
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div
              className="rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6"
              style={{ background: "linear-gradient(135deg, #1D38DB, #1DB1DB)" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <HelpCircle size={26} className="text-white" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl font-black text-white mb-2">
                  {t("resources.page.helpCtaTitle")}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  {t("resources.page.helpCtaDesc")}
                </p>
                <Link
                  href="/get-support"
                  className="inline-flex items-center gap-2 bg-white font-bold px-6 py-3 rounded-full text-sm hover:opacity-90 transition-all"
                  style={{ color: "var(--secondary)" }}
                >
                  {t("resources.page.helpCtaButton")} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          LEGAL & POLICIES
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ background: "#F3F9F9" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: TEAL }}
              >
                {t("resources.page.legalTitle")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">
                {t("resources.page.legalTitle")}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto mt-4">
                {t("resources.page.legalDesc")}
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-6">
            {legalResources.map((resource, i) => (
              <Reveal key={resource.title} delay={i * 80}>
                <Link
                  href={resource.href}
                  className="group rounded-2xl border border-gray-200 p-6 bg-white hover:border-[#3D77B9]/30 hover:shadow-md transition-all h-full flex flex-col"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(29,56,219,0.08)" }}
                    >
                      <resource.icon size={20} style={{ color: "var(--secondary)" }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1A1A2E] mb-2">{resource.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">{resource.desc}</p>
                      <span
                        className="inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-0.5"
                        style={{ color: "var(--primary)" }}
                      >
                        {t("resources.page.readMore")} <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
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
          <Reveal>
            <h2 className="text-3xl font-black text-white mb-4">
              {t("resources.page.finalCtaTitle")}
            </h2>
          </Reveal>
          <Reveal delay={110}>
            <p className="text-white/80 mb-8">
              {t("resources.page.finalCtaDesc")}
            </p>
          </Reveal>
          <Reveal delay={220}>
            <Link
              href="/dashboard/donor/campaigns/create"
              className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all"
              style={{ color: "var(--secondary)" }}
            >
              {t("resources.page.finalCtaButton")} <Heart size={18} className="fill-current" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
