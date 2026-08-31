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

// "use client";
// import { useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import Navbar from "@/components/shared/Navbar";
// import Reveal from "@/components/shared/Reveal";
// import { useI18n } from "@/locales/client";
// import { Mail, ChevronDown, HelpCircle, Shield, CreditCard, Users, ArrowRight } from "lucide-react";
// import { HugeiconsIcon } from "@hugeicons/react";
// import { WhatsappIcon } from "@hugeicons/core-free-icons";
// import type { LucideIcon } from "lucide-react";

// const TEAL = "#0B7B63";
// const TEAL_LIGHT = "#2DD9B5";
// const WHATSAPP_LINK =
//   "https://wa.me/237681065173?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue";

// export default function GetSupportPage() {
//   const t = useI18n();
//   const [openFaq, setOpenFaq] = useState<number | null>(0);

//   const faqGroups: { category: string; icon: LucideIcon; items: { q: string; a: string }[] }[] = [
//     {
//       category: t("support.page.creatingTitle"),
//       icon: HelpCircle,
//       items: [
//         { q: t("support.page.creatingQ1"), a: t("support.page.creatingA1") },
//         { q: t("support.page.creatingQ2"), a: t("support.page.creatingA2") },
//         { q: t("support.page.creatingQ3"), a: t("support.page.creatingA3") },
//       ],
//     },
//     {
//       category: t("support.page.donationsTitle"),
//       icon: CreditCard,
//       items: [
//         { q: t("support.page.donationsQ1"), a: t("support.page.donationsA1") },
//         { q: t("support.page.donationsQ2"), a: t("support.page.donationsA2") },
//         { q: t("support.page.donationsQ3"), a: t("support.page.donationsA3") },
//       ],
//     },
//     {
//       category: t("support.page.accountTitle"),
//       icon: Shield,
//       items: [
//         { q: t("support.page.accountQ1"), a: t("support.page.accountA1") },
//         { q: t("support.page.accountQ2"), a: t("support.page.accountA2") },
//         { q: t("support.page.accountQ3"), a: t("support.page.accountA3") },
//       ],
//     },
//     {
//       category: t("support.page.vouchersTitle"),
//       icon: Users,
//       items: [
//         { q: t("support.page.vouchersQ1"), a: t("support.page.vouchersA1") },
//         { q: t("support.page.vouchersQ2"), a: t("support.page.vouchersA2") },
//         { q: t("support.page.vouchersQ3"), a: t("support.page.vouchersA3") },
//       ],
//     },
//   ];

//   let globalIndex = 0;

//   return (
//     <div className="min-h-screen bg-white">
//       {/* ════════════════════════════════════════════════════════════════
//           HERO
//           ════════════════════════════════════════════════════════════════ */}
//       <section className="relative h-[620px] sm:h-[680px] lg:h-[720px] flex flex-col overflow-hidden text-left">
//         <Image
//           src="/assets/images/get-support-hero-image.png"
//           alt="JoyFund supporters helping others through the People's Health Insurance Fund"
//           fill
//           priority
//           className="object-cover"
//         />

//         {/* Left-to-right dark gradient so the copy block sits on a readable base */}
//         <div
//           className="absolute inset-0"
//           style={{
//             background:
//               "linear-gradient(100deg, rgba(4,10,9,0.96) 0%, rgba(4,10,9,0.9) 22%, rgba(4,10,9,0.6) 42%, rgba(4,10,9,0.18) 62%, rgba(4,10,9,0) 78%)",
//           }}
//         />
//         {/* Subtle bottom vignette */}
//         <div
//           className="absolute inset-0"
//           style={{
//             background:
//               "linear-gradient(to top, rgba(4,10,9,0.55) 0%, rgba(4,10,9,0) 32%)",
//           }}
//         />

//         <Navbar transparent />

//         <div className="relative z-10 flex-1 flex items-center px-6 sm:px-12 lg:px-20 pb-16">
//           <Reveal>
//             <div className="max-w-xl">
//               <p
//                 className="text-xs font-black uppercase tracking-[0.28em] mb-3"
//                 style={{ color: TEAL_LIGHT }}
//               >
//                 {t("support.page.eyebrow")}
//               </p>
//               <div
//                 className="w-10 h-[3px] rounded-full mb-6"
//                 style={{ background: TEAL_LIGHT }}
//               />

//               <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-black text-white leading-[1.05] mb-6 drop-shadow-md">
//                 {t("support.page.title")}
//               </h1>

//               <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-md mb-8">
//                 {t("support.page.subtitle")}
//               </p>

//               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
//                 <a
//                   href={WHATSAPP_LINK}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
//                   style={{ background: "#25D366" }}
//                 >
//                   <HugeiconsIcon icon={WhatsappIcon} size={18} />
//                   {t("support.page.ctaWhatsapp")}
//                 </a>
//                 <a
//                   href={`mailto:${t("support.page.emailAddress")}`}
//                   className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
//                 >
//                   <Mail size={16} />
//                   {t("support.page.emailCta")}
//                 </a>
//               </div>
//             </div>
//           </Reveal>
//         </div>

//         {/* Curved white base + thin teal seam */}
//         <div className="absolute bottom-0 left-0 w-full leading-[0] pointer-events-none">
//           <svg
//             viewBox="0 0 1440 120"
//             className="w-full h-[50px] sm:h-[80px]"
//             preserveAspectRatio="none"
//           >
//             <path
//               d="M0,55 C280,115 480,10 760,50 C1040,90 1220,25 1440,65 L1440,120 L0,120 Z"
//               fill="white"
//             />
//             <path
//               d="M0,55 C280,115 480,10 760,50 C1040,90 1220,25 1440,65"
//               fill="none"
//               stroke={TEAL}
//               strokeWidth="2.5"
//               opacity="0.55"
//             />
//           </svg>
//         </div>
//       </section>

//       {/* ════════════════════════════════════════════════════════════════
//           CONTACT CHANNELS
//           ════════════════════════════════════════════════════════════════ */}
//       <section className="py-16 sm:py-20 px-4" id="contact">
//         <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
//           <Reveal>
//             <a
//               href={WHATSAPP_LINK}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="group block h-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
//             >
//               <div className="flex items-start justify-between mb-5">
//                 <div
//                   className="w-12 h-12 rounded-2xl flex items-center justify-center"
//                   style={{ background: "rgba(37,211,102,0.12)" }}
//                 >
//                   <HugeiconsIcon icon={WhatsappIcon} size={24} color="#25D366" />
//                 </div>
//                 <span
//                   className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
//                   style={{ background: "rgba(37,211,102,0.1)", color: "#1B7A3D" }}
//                 >
//                   <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
//                   {t("support.page.whatsappSubtitle")}
//                 </span>
//               </div>
//               <h3 className="font-black text-lg text-[#1A1A2E] mb-2">
//                 {t("support.page.whatsappTitle")}
//               </h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 {t("support.page.whatsappDesc")}
//               </p>
//               <span
//                 className="inline-flex items-center gap-2 text-sm font-bold transition-transform group-hover:translate-x-1"
//                 style={{ color: "#25D366" }}
//               >
//                 {t("support.page.whatsappCta")} <ArrowRight size={15} />
//               </span>
//             </a>
//           </Reveal>

//           <Reveal delay={80}>
//             <a
//               href={`mailto:${t("support.page.emailAddress")}`}
//               className="group block h-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
//             >
//               <div className="flex items-start justify-between mb-5">
//                 <div
//                   className="w-12 h-12 rounded-2xl flex items-center justify-center"
//                   style={{ background: "rgba(11,123,99,0.12)" }}
//                 >
//                   <Mail size={22} style={{ color: TEAL }} />
//                 </div>
//                 <span
//                   className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
//                   style={{ background: "rgba(11,123,99,0.1)", color: TEAL }}
//                 >
//                   <span className="w-1.5 h-1.5 rounded-full" style={{ background: TEAL_LIGHT }} />
//                   {t("support.page.emailSubtitle")}
//                 </span>
//               </div>
//               <h3 className="font-black text-lg text-[#1A1A2E] mb-2">
//                 {t("support.page.emailTitle")}
//               </h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 {t("support.page.emailDesc")}
//               </p>
//               <span
//                 className="inline-flex items-center gap-2 text-sm font-bold transition-transform group-hover:translate-x-1"
//                 style={{ color: TEAL }}
//               >
//                 {t("support.page.emailCta")} <ArrowRight size={15} />
//               </span>
//             </a>
//           </Reveal>
//         </div>
//       </section>

//       {/* ════════════════════════════════════════════════════════════════
//           FAQS
//           ════════════════════════════════════════════════════════════════ */}
//       <section id="faqs" className="py-20 px-4 bg-[#F3F9F9]">
//         <div className="max-w-3xl mx-auto">
//           <Reveal>
//             <div className="text-center mb-14">
//               <p
//                 className="text-xs font-black uppercase tracking-[0.25em] mb-3"
//                 style={{ color: TEAL }}
//               >
//                 {t("support.page.eyebrow")}
//               </p>
//               <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] mb-4">
//                 {t("support.page.faqTitle")}
//               </h2>
//               <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
//                 {t("support.page.faqSubtitle")}
//               </p>
//             </div>
//           </Reveal>

//           <div className="space-y-6">
//             {faqGroups.map((group, gi) => (
//               <Reveal key={group.category} delay={gi * 60}>
//                 <div className="overflow-hidden rounded-3xl border border-[#0B7B63]/10 bg-white shadow-sm">
//                   <div
//                     className="flex items-center gap-3 px-6 py-4 border-b border-[#E7F2EF]"
//                     style={{ background: "rgba(11,123,99,0.05)" }}
//                   >
//                     <div
//                       className="w-9 h-9 rounded-xl flex items-center justify-center"
//                       style={{ background: "rgba(11,123,99,0.12)" }}
//                     >
//                       <group.icon size={17} style={{ color: TEAL }} />
//                     </div>
//                     <h3 className="font-black text-sm sm:text-base text-[#1A1A2E]">
//                       {group.category}
//                     </h3>
//                   </div>

//                   <div>
//                     {group.items.map((item) => {
//                       const currentIndex = globalIndex++;
//                       const isOpen = openFaq === currentIndex;
//                       return (
//                         <div
//                           key={currentIndex}
//                           className="border-b border-gray-100 last:border-b-0"
//                         >
//                           <button
//                             onClick={() => setOpenFaq(isOpen ? null : currentIndex)}
//                             aria-expanded={isOpen}
//                             className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[#F3F9F9]/70 transition-colors"
//                           >
//                             <span className="font-bold text-sm text-[#1A1A2E] leading-snug">
//                               {item.q}
//                             </span>
//                             <span
//                               className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
//                                 isOpen ? "rotate-180" : "rotate-0"
//                               }`}
//                               style={{
//                                 background: isOpen ? "rgba(11,123,99,0.12)" : "#F4F5F7",
//                               }}
//                             >
//                               <ChevronDown
//                                 size={15}
//                                 style={isOpen ? { color: TEAL } : { color: "#9CA3AF" }}
//                               />
//                             </span>
//                           </button>
//                           <div
//                             className={`grid transition-all duration-300 ease-out ${
//                               isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
//                             }`}
//                           >
//                             <div className="overflow-hidden">
//                               <p className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
//                                 {item.a}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ════════════════════════════════════════════════════════════════
//           CTA BAND
//           ════════════════════════════════════════════════════════════════ */}
//       <section
//         className="py-20 px-4"
//         style={{ background: "linear-gradient(135deg, #0B7B63, #2DD9B5)" }}
//       >
//         <div className="max-w-2xl mx-auto text-center">
//           <Reveal>
//             <h2 className="text-3xl font-black text-white mb-4">
//               {t("support.page.ctaTitle")}
//             </h2>
//             <p className="text-white/85 mb-8">{t("support.page.ctaSubtitle")}</p>
//             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//               <a
//                 href={WHATSAPP_LINK}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full text-sm hover:opacity-90 transition-all"
//                 style={{ color: TEAL }}
//               >
//                 <HugeiconsIcon icon={WhatsappIcon} size={18} color={TEAL} />
//                 {t("support.page.ctaWhatsapp")}
//               </a>
//               <Link
//                 href="/explore"
//                 className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
//               >
//                 {t("support.page.ctaExplore")} <ArrowRight size={16} />
//               </Link>
//             </div>
//           </Reveal>
//         </div>
//       </section>
//     </div>
//   );
// }