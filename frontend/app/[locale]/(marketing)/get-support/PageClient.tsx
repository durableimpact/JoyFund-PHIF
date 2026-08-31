"use client";
import Image from "next/image";
import Navbar from "@/components/shared/Navbar";
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
} from "lucide-react";

const GET_SUPPORT_FORM_URL = "https://forms.gle/R9vxmx9g9jrYVbtC7";
const SUPPORT_PHONE_DISPLAY = "681 065 173";
const SUPPORT_WHATSAPP_LINK =
  "https://wa.me/237681065173?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue";

export default function GetSupportPage() {
  const t = useI18n();

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
          <div className="relative z-10 pb-14 md:pb-20">
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-2">
              {t("support.page.hero.titleLine1")}
              <br />
              {t("support.page.hero.titleLine2")}
            </h1>
            <p
              className="text-4xl sm:text-5xl font-black italic underline decoration-2 underline-offset-4 mb-6"
              style={{ color: "#F3CE55" }}
            >
              {t("support.page.hero.titleHighlight")}
            </p>

            <p className="text-white text-base sm:text-lg leading-relaxed mb-4 max-w-md">
              {t("support.page.hero.paragraph1")}
            </p>
            <p className="text-white text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              {t("support.page.hero.paragraph2")}
            </p>

            <a
              href={GET_SUPPORT_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-black text-sm sm:text-base tracking-wide px-8 py-4 rounded-md hover:opacity-90 transition-all"
              style={{ background: "#FBECB3", color: "#1A1A2E" }}
            >
              {t("support.page.hero.applyButton")}
            </a>

            <p className="text-sm mt-3 mb-8 max-w-sm" style={{ color: "#F3CE55" }}>
              {t("support.page.hero.confidentialLine1")}
              <br />
              {t("support.page.hero.confidentialLine2")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 max-w-lg">
              {supportPillars.map((pillar) => (
                <div key={pillar.title}>
                  <h3 className="font-black text-white text-sm mb-1">
                    {pillar.title}
                  </h3>
                  <p className="text-white/80 text-xs italic leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="border border-white/40 rounded-md px-4 py-3 max-w-xl">
              <p className="text-white text-xs sm:text-sm leading-relaxed">
                {t("support.page.hero.disclaimer")}
              </p>
            </div>
          </div>

          {/* Right: hero image */}
          <div className="relative hidden md:flex justify-end items-end h-full">
            <Image
              src="/assets/images/get-support-hero-image.png"
              alt={t("support.page.hero.imageAlt")}
              width={700}
              height={820}
              priority
              className="w-full max-w-lg h-auto object-contain object-bottom"
            />
          </div>
        </div>

        {/* Mobile image */}
        <div className="md:hidden mt-6 flex justify-center">
          <Image
            src="/assets/images/get-support-hero-image.png"
            alt={t("support.page.hero.imageAlt")}
            width={500}
            height={580}
            priority
            className="w-full max-w-xs h-auto object-contain"
          />
        </div>
      </section>

      {/* ---------- WHAT HAPPENS NEXT ---------- */}
      <section className="py-20 px-4" style={{ background: "#E9F4F4" }}>
        <div className="max-w-6xl mx-auto">
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col items-center text-center">
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
            ))}
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-black text-sm mb-1" style={{ color: "#2F8F6C" }}>
                {t("support.page.steps.footerTitle")}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                {t("support.page.steps.footerText")}
              </p>
            </div>
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
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl px-6 sm:px-10 py-10" style={{ background: "#E9F4F4" }}>
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

            <div className="space-y-6">
              {faqs.map((item, i) => (
                <div
                  key={item.q}
                  className={i < faqs.length - 1 ? "pb-6 border-b" : ""}
                  style={i < faqs.length - 1 ? { borderColor: "#CFE6E4" } : undefined}
                >
                  <h3
                    className="font-black text-sm sm:text-base mb-2"
                    style={{ color: "#2F8F6C" }}
                  >
                    {i + 1}. {item.q}
                  </h3>
                  {item.a.split("\n\n").map((para, j) => (
                    <p
                      key={j}
                      className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-2 last:mb-0"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Still need help */}
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
        </div>
      </section>
    </div>
  );
}

