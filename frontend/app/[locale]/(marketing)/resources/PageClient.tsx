"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/shared/Navbar";
import Reveal from "@/components/shared/Reveal";
import { useI18n } from "@/locales/client";
import {
  BookOpen,
  ArrowRight,
  Share2,
  Shield,
  Globe2,
  HelpCircle,
  FileText,
  Lock,
  Heart,
  ChevronDown,
  ChevronUp,
  Play,
  Video,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";

const TEAL = "#0B7B63";

type VideoCardProps = {
  videoId: string;
  title: string;
  desc: string;
};

function VideoCard({ videoId, title, desc }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group cursor-pointer mb-4">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <>
            <Image
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt={title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play size={24} fill="#FF0000" color="#FF0000" />
              </span>
            </div>
            <button
              aria-label={`Play video: ${title}`}
              onClick={() => setPlaying(true)}
              className="absolute inset-0 z-10"
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: TEAL }}>
        <Video size={14} />
        <span>JoyFund</span>
      </div>
      <h3 className="font-bold text-[#1A1A2E] mb-2 leading-snug">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed mb-4">{desc}</p>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70"
        style={{ color: "var(--primary)" }}
      >
        <Play size={13} fill="currentColor" /> Watch Now
      </a>
    </div>
  );
}

export default function ResourcesPage() {
  const t = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const gettingStartedVideos = [
    {
      // https://youtu.be/kGhbdEKpPMk?si=4pK5_HfCRhh7eXCZ
      videoId: "kGhbdEKpPMk",
      title: "06 Steps you can follow to Start a Joyfund Campaign",
      desc: "A simple 6-step guide to turn your celebration into life-saving support for mothers and newborns.",
    },
    {
      // https://youtu.be/3zGfX54RpLM?si=5lLrA_t2CL9GpG6S
      videoId: "3zGfX54RpLM",
      title: "Les 09 étapes simples à savoir pour créer une campagne JoyFund",
      desc: "Un guide étape par étape pour créer et partager votre toute première campagne.",
    },
    {
      videoId: "uvRMWz1H30k",
      title: "How JoyFund Works - From Celebration to Care",
      desc: "Watch how a celebration becomes life-saving support for mothers and newborns.",
    },
  ];

  const gettingStartedBlogs = [
    {
      title: "Clevia & Marcel: Our Wedding, Their Healthy Beginning",
      excerpt:
        "As we begin our journey as husband and wife, we wanted our joy to create a meaningful beginning for someone else. So we're turning our wedding into a JoyFund campaign to pre-fund prenatal consultations for five vulnerable pregnant women.",
      href: "/campaign/b05b40af-607d-4572-bd7e-556f9d4d7428",
    },
    {
      title: "Help 'Human Calculator Genesis' Fight Seizures",
      excerpt:
        "Known across Cameroon for his gift of mental mathematics, Nkeh Genesis Ngwagoh now faces a difficult battle with recurrent seizures. He's using JoyFund to cover his medical care - and asking his community for support.",
      href: "/campaign/acc67483-aef9-44a3-ba0a-af19ae048b21",
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

  const faqs = Array.from({ length: 10 }, (_, i) => ({
    q: t(`support.page.faq.q${i + 1}` as any),
    a: t(`support.page.faq.a${i + 1}` as any),
  }));

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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════
          HERO - solid teal background with hero image (same pattern as
          the get-support page: image anchored right/bottom, dark overlay
          for mobile & tablet readability).
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative z-0 pt-28 md:pt-36"
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

        {/* Hero image - anchored right/bottom, laps down past the hero end,
            sized larger and zoomed in slightly */}
        <div className="absolute right-0 -bottom-[14%] translate-x-[16%] w-full sm:w-4/5 md:w-[62%] lg:w-3/5 h-[60%] sm:h-[75%] md:h-[85%] lg:h-[112%] pointer-events-none z-0">
          <Image
            src="/assets/images/resources-hero-img.png"
            alt=""
            width={1264}
            height={842}
            priority
            className="w-full h-full object-cover object-right object-bottom scale-[1.08]"
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
          VIDEOS & CAMPAIGN STORIES
          ════════════════════════════════════════════════════════════════ */}
      <section id="getting-started" className="relative z-10 py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
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

          <h3 className="text-lg font-black text-[#1A1A2E] mb-4 flex items-center gap-2">
            <Video size={18} style={{ color: "#FF0000" }} /> Videos
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gettingStartedVideos.map((video, i) => (
              <Reveal key={i} delay={i * 80}>
                <VideoCard
                  videoId={video.videoId}
                  title={video.title}
                  desc={video.desc}
                />
              </Reveal>
            ))}
          </div>

          <h3 className="text-lg font-black text-[#1A1A2E] mt-14 mb-4 flex items-center gap-2">
            <BookOpen size={18} style={{ color: TEAL }} /> Campaign Stories
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {gettingStartedBlogs.map((blog, i) => (
              <Reveal key={blog.title} delay={i * 80}>
                <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-3" style={{ color: TEAL }}>
                    <CalendarDays size={14} />
                    <span>JoyFund Community</span>
                  </div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2 leading-snug">{blog.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{blog.excerpt}</p>
                  <Link
                    href={blog.href}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-bold transition-all hover:translate-x-0.5"
                    style={{ color: "var(--primary)" }}
                  >
                    Read More <ArrowRight size={14} />
                  </Link>
                </div>
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
                {t("support.page.faq.title")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">
                {t("support.page.faq.subtitle")}
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
