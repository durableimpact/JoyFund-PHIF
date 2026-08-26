"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { useI18n } from "@/locales/client";
import { Mail, ChevronDown, HelpCircle, Shield, CreditCard, Users, ArrowRight } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon } from "@hugeicons/core-free-icons";

export default function GetSupportPage() {
  const t = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqGroups = [
    {
      category: t("support.page.creatingTitle"),
      icon: HelpCircle,
      items: [
        { q: t("support.page.creatingQ1"), a: t("support.page.creatingA1") },
        { q: t("support.page.creatingQ2"), a: t("support.page.creatingA2") },
        { q: t("support.page.creatingQ3"), a: t("support.page.creatingA3") },
      ],
    },
    {
      category: t("support.page.donationsTitle"),
      icon: CreditCard,
      items: [
        { q: t("support.page.donationsQ1"), a: t("support.page.donationsA1") },
        { q: t("support.page.donationsQ2"), a: t("support.page.donationsA2") },
        { q: t("support.page.donationsQ3"), a: t("support.page.donationsA3") },
      ],
    },
    {
      category: t("support.page.accountTitle"),
      icon: Shield,
      items: [
        { q: t("support.page.accountQ1"), a: t("support.page.accountA1") },
        { q: t("support.page.accountQ2"), a: t("support.page.accountA2") },
        { q: t("support.page.accountQ3"), a: t("support.page.accountA3") },
      ],
    },
    {
      category: t("support.page.vouchersTitle"),
      icon: Users,
      items: [
        { q: t("support.page.vouchersQ1"), a: t("support.page.vouchersA1") },
        { q: t("support.page.vouchersQ2"), a: t("support.page.vouchersA2") },
        { q: t("support.page.vouchersQ3"), a: t("support.page.vouchersA3") },
      ],
    },
  ];

  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--primary)" }}>
            {t("support.page.eyebrow")}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] mb-4">
            {t("support.page.title")}
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
            {t("support.page.subtitle")}
          </p>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
          <a
            href="https://wa.me/237681065173?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-gray-200 p-6 hover:border-[#25D366]/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(37,211,102,0.1)" }}
              >
                <HugeiconsIcon icon={WhatsappIcon} size={24} color="#25D366" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A2E]">{t("support.page.whatsappTitle")}</h3>
                <p className="text-sm text-gray-500">{t("support.page.whatsappSubtitle")}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              {t("support.page.whatsappDesc")}
            </p>
            <span
              className="inline-flex items-center gap-2 text-sm font-bold transition-colors group-hover:translate-x-0.5"
              style={{ color: "#25D366" }}
            >
              {t("support.page.whatsappCta")} <ArrowRight size={14} />
            </span>
          </a>

          <a
            href="mailto:support@joyfund.app"
            className="group rounded-2xl border border-gray-200 p-6 hover:border-[#3D77B9]/40 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(61,119,185,0.08)" }}
              >
                <Mail size={22} style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A2E]">{t("support.page.emailTitle")}</h3>
                <p className="text-sm text-gray-500">{t("support.page.emailSubtitle")}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              {t("support.page.emailDesc")}
            </p>
            <span
              className="inline-flex items-center gap-2 text-sm font-bold transition-colors group-hover:translate-x-0.5"
              style={{ color: "var(--primary)" }}
            >
              {t("support.page.emailCta")} <ArrowRight size={14} />
            </span>
          </a>
        </div>
      </section>

      <section className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] text-center mb-4">
            {t("support.page.faqTitle")}
          </h2>
          <p className="text-gray-500 text-center text-sm leading-relaxed mb-12 max-w-md mx-auto">
            {t("support.page.faqSubtitle")}
          </p>

          <div className="space-y-10">
            {faqGroups.map((group) => (
              <div key={group.category}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(29,56,219,0.08)" }}
                  >
                    <group.icon size={18} style={{ color: "var(--secondary)" }} />
                  </div>
                  <h3 className="font-bold text-[#1A1A2E]">{group.category}</h3>
                </div>
                <div className="space-y-0 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  {group.items.map((item) => {
                    const currentIndex = globalIndex++;
                    const isOpen = openFaq === currentIndex;
                    return (
                      <div key={currentIndex}>
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : currentIndex)}
                          className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                          style={{
                            borderBottom:
                              currentIndex <
                              faqGroups.reduce((acc, g) => acc + g.items.length, 0) - 1
                                ? "1px solid #f3f4f6"
                                : undefined,
                          }}
                        >
                          <span className="font-bold text-sm text-[#1A1A2E] pr-4">
                            {item.q}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-gray-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="py-20 px-4"
        style={{ background: "linear-gradient(135deg, #1D38DB, #1DB1DB)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            {t("support.page.ctaTitle")}
          </h2>
          <p className="text-white/80 mb-8">
            {t("support.page.ctaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/237681065173?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full text-sm hover:opacity-90 transition-all"
              style={{ color: "var(--secondary)" }}
            >
              <HugeiconsIcon icon={WhatsappIcon} size={18} color="#1D38DB" />
              {t("support.page.ctaWhatsapp")}
            </a>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              {t("support.page.ctaExplore")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
