"use client";
import Image from "next/image";
import Navbar from "@/components/shared/Navbar";
import Reveal from "@/components/shared/Reveal";
import { useI18n } from "@/locales/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon } from "@hugeicons/core-free-icons";
import {
  FileEdit,
  ClipboardCheck,
  ShieldCheck,
  ClipboardList,
  HeartHandshake,
  Phone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

const GET_SUPPORT_FORM_URL = "https://forms.gle/R9vxmx9g9jrYVbtC7";
const SUPPORT_PHONE_DISPLAY = "681 065 173";
const SUPPORT_WHATSAPP_LINK =
  "https://wa.me/237681065173?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue";

export default function GetSupportPage() {
  const t = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const supportPillars = [
    {
      title: t("support.page.hero.pillarCareTitle"),
      description: t("support.page.hero.pillarCareDesc"),
    },
    {
      title: t("support.page.hero.pillarTransportTitle"),
      description: t("support.page.hero.pillarTransportDesc"),
    },

    {
      title: t("support.page.hero.pillarReferralTitle"),
      description: t("support.page.hero.pillarReferralDesc"),
    },
  ];
  const steps = [
    {
      icon: FileEdit,
      title: t("support.page.steps.step1Title"),
      description: t("support.page.steps.step1Desc"),
    },
    {
      icon: ClipboardCheck,
      title: t("support.page.steps.step2Title"),
      description: t("support.page.steps.step2Desc"),
    },
    {
      icon: ShieldCheck,
      title: t("support.page.steps.step3Title"),
      description: t("support.page.steps.step3Desc"),
    },
    {
      icon: ClipboardList,
      title: t("support.page.steps.step4Title"),
      description: t("support.page.steps.step4Desc"),
    },
    {
      icon: HeartHandshake,
      title: t("support.page.steps.step5Title"),
      description: t("support.page.steps.step5Desc"),
    },
  ];

  // Answers are stored with "\n\n" between paragraphs in the locale files.
  const faqs = [
    { q: t("support.page.faq.q1"), a: t("support.page.faq.a1") },
    { q: t("support.page.faq.q2"), a: t("support.page.faq.a2") },
    { q: t("support.page.faq.q3"), a: t("support.page.faq.a3") },
    { q: t("support.page.faq.q4"), a: t("support.page.faq.a4") },
    { q: t("support.page.faq.q5"), a: t("support.page.faq.a5") },
    { q: t("support.page.faq.q6"), a: t("support.page.faq.a6") },
    { q: t("support.page.faq.q7"), a: t("support.page.faq.a7") },
    { q: t("support.page.faq.q8"), a: t("support.page.faq.a8") },
    { q: t("support.page.faq.q9"), a: t("support.page.faq.a9") },
    { q: t("support.page.faq.q10"), a: t("support.page.faq.a10") },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ---------- HERO ---------- */}
      <section
        className="relative overflow-hidden pt-28 md:pt-36"
        style={{ background: "#1EA2A0" }}
      >
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-end">
          {/* Left: copy */}
          <div className="relative z-20 pb-14 md:pb-20">
            <Reveal>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-2">
                {t("support.page.hero.titleLine1")}
                <br />
                {t("support.page.hero.titleLine2")}
              </h1>
            </Reveal>
            <Reveal delay={70}>
              <p
                className="text-4xl sm:text-5xl font-black italic underline decoration-2 underline-offset-4 mb-6"
                style={{ color: "#F3CE55" }}
              >
                {t("support.page.hero.titleHighlight")}
              </p>
            </Reveal>

            <Reveal delay={90}>
              <p className="text-white text-base sm:text-lg leading-relaxed mb-4 max-w-md">
                {t("support.page.hero.paragraph1")}
              </p>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-white text-base sm:text-lg leading-relaxed mb-8 max-w-md">
                {t("support.page.hero.paragraph2")}
              </p>
            </Reveal>

            <Reveal delay={110}>
              <a
                href={GET_SUPPORT_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-black text-sm sm:text-base tracking-wide px-8 py-4 rounded-md hover:opacity-90 transition-all"
                style={{ background: "#FBECB3", color: "#1A1A2E" }}
              >
                {t("support.page.hero.applyButton")}
              </a>
            </Reveal>

            <Reveal delay={120}>
              <p className="text-sm mt-3 mb-8 max-w-sm" style={{ color: "#F3CE55" }}>
                {t("support.page.hero.confidentialLine1")}
                <br />
                {t("support.page.hero.confidentialLine2")}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-lg">
              {supportPillars.map((pillar, i) => (
                <Reveal key={pillar.title} delay={130 + i * 70}>
                  <div>
                    <h3 className="font-black text-white text-sm mb-1">
                      {pillar.title}
                    </h3>
                    <p className="text-white/80 text-xs italic leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={180}>
              <div className="border border-white/40 rounded-md px-4 py-3 max-w-xl">
                <p className="text-white text-xs sm:text-sm leading-relaxed">
                  {t("support.page.hero.disclaimer")}
                </p>
              </div>
            </Reveal>
          </div>

          {/* Right: hero image */}
          <div className="absolute right-0 bottom-0 w-full sm:w-3/4 md:w-[55%] lg:w-1/2 h-[45%] sm:h-[55%] md:h-[62%] lg:h-[85%] pointer-events-none z-0">
            <Image
              src="/assets/images/get-support-hero-image.png"
              alt={t("support.page.hero.imageAlt")}
              width={1264}
              height={842}
              priority
              className="w-full h-full object-cover object-right object-bottom"
            />
          </div>
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

      {/* ---------- WHAT HAPPENS NEXT ---------- */}
      <section className="py-20 px-4" style={{ background: "#E9F4F4" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <h2
                className="text-3xl sm:text-4xl font-black mb-2"
                style={{ color: "#2F8F6C" }}
              >
                {t("support.page.steps.title")}
              </h2>
              <div
                className="w-16 h-1 mx-auto mb-5 rounded-full"
                style={{ background: "#D98C3F" }}
              />
              <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: "#2F8F6C" }}>
                {t("support.page.steps.subtitleLine1")}
                <br />
                {t("support.page.steps.subtitleLine2")}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm"
                    style={{ background: "#14726D" }}
                  >
                    <step.icon size={26} color="#ffffff" strokeWidth={1.75} />
                  </div>
                  <div className="bg-white rounded-xl px-4 py-5 w-full h-full">
                    <h3
                      className="font-black text-base mb-1"
                      style={{ color: "#2F8F6C" }}
                    >
                      {step.title}
                    </h3>
                    <div
                      className="w-8 h-0.5 mx-auto mb-3 rounded-full"
                      style={{ background: "#D98C3F" }}
                    />
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <Reveal delay={100}>
              <div>
                <h3 className="font-black text-sm mb-1" style={{ color: "#2F8F6C" }}>
                  {t("support.page.steps.footerTitle")}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {t("support.page.steps.footerText")}
                </p>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="sm:text-right">
                <h3 className="font-black text-sm mb-1" style={{ color: "#2F8F6C" }}>
                  {t("support.page.steps.needHelpTitle")}
                </h3>
                <a
                  href={SUPPORT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-[#14726D] transition-colors sm:justify-end"
                >
                  <Phone size={14} />
                  {t("support.page.steps.needHelpText", { phone: SUPPORT_PHONE_DISPLAY })}
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl px-6 sm:px-10 py-10" style={{ background: "#E9F4F4" }}>
            <Reveal>
              <h2
                className="text-2xl sm:text-3xl font-black text-center mb-2"
                style={{ color: "#2F8F6C" }}
              >
                {t("support.page.faq.title")}
              </h2>
              <p
                className="text-center text-sm sm:text-base mb-10"
                style={{ color: "#2F8F6C" }}
              >
                {t("support.page.faq.subtitle")}
              </p>
            </Reveal>

            <div className="space-y-6">
              {faqs.map((item, i) => (
                <Reveal key={item.q} delay={i * 60}>
                  <div
                    className={i < faqs.length - 1 ? "pb-6 border-b" : ""}
                    style={i < faqs.length - 1 ? { borderColor: "#CFE6E4" } : undefined}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 text-left"
                      aria-expanded={openFaq === i}
                    >
                      <h3
                        className="font-black text-sm sm:text-base mb-0"
                        style={{ color: "#2F8F6C" }}
                      >
                        {i + 1}. {item.q}
                      </h3>
                      {openFaq === i ? (
                        <ChevronUp size={18} className="shrink-0" style={{ color: "#2F8F6C" }} />
                      ) : (
                        <ChevronDown size={18} className="shrink-0" style={{ color: "#2F8F6C" }} />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="mt-3">
                        {item.a.split("\n\n").map((para, j) => (
                          <p
                            key={j}
                            className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-2 last:mb-0"
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Still need help */}
          <Reveal delay={100}>
            <div className="mt-10 text-center">
              <p className="text-sm text-gray-600 mb-4">
                {t("support.page.faq.stillHaveQuestions")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={SUPPORT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "#25D366" }}
                >
                  <HugeiconsIcon icon={WhatsappIcon} size={18} color="#ffffff" />
                  {t("support.page.faq.chatWhatsapp")}
                </a>
                <a
                  href={GET_SUPPORT_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm text-white transition-all hover:opacity-90"
                  style={{ background: "#1EA2A0" }}
                >
                  {t("support.page.faq.applyForSupport")}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
