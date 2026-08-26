"use client";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { useI18n } from "@/locales/client";
import { BookOpen, ArrowRight, Sparkles, CreditCard, Share2, Shield, Globe2, HelpCircle, FileText, Lock, Heart } from "lucide-react";

export default function ResourcesPage() {
  const t = useI18n();

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

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>
            {t("resources.page.eyebrow")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] mb-4">
            {t("resources.page.title")}
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
            {t("resources.page.subtitle")}
          </p>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] mb-3">
            {t("resources.page.gettingStartedTitle")}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-xl">
            {t("resources.page.gettingStartedDesc")}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gettingStartedGuides.map((guide) => (
              <Link
                key={guide.title}
                href={guide.href}
                className="group rounded-2xl border border-gray-200 p-6 hover:border-[#3D77B9]/30 hover:shadow-md transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(29,56,219,0.08)" }}
                >
                  <guide.icon size={22} style={{ color: "var(--secondary)" }} />
                </div>
                <h3 className="font-bold text-[#1A1A2E] mb-2">{guide.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{guide.desc}</p>
                <span
                  className="inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:translate-x-0.5"
                  style={{ color: "var(--primary)" }}
                >
                  {t("resources.page.readMore")} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] mb-3">
            {t("resources.page.understandingTitle")}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-xl">
            {t("resources.page.understandingDesc")}
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {understandingResources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="group rounded-2xl border border-gray-200 p-6 hover:border-[#3D77B9]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(29,56,219,0.08)" }}
                  >
                    <resource.icon size={20} style={{ color: "var(--secondary)" }} />
                  </div>
                  <div>
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
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
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
        </div>
      </section>

      <section className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] mb-3">
            {t("resources.page.legalTitle")}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-xl">
            {t("resources.page.legalDesc")}
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {legalResources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="group rounded-2xl border border-gray-200 p-6 bg-white hover:border-[#3D77B9]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(29,56,219,0.08)" }}
                  >
                    <resource.icon size={20} style={{ color: "var(--secondary)" }} />
                  </div>
                  <div>
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
