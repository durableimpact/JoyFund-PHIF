"use client";

import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import { useI18n } from "@/locales/client";
import { useQuery } from "@tanstack/react-query";
import { getCurrentFeePolicy } from "@/actions/payments";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function HowItWorksPage() {
  const t = useI18n();
  const { data: feePolicy } = useQuery({
    queryKey: ["fee-policy-current"],
    queryFn: getCurrentFeePolicy,
  });

  const platformFeePct = Number(feePolicy?.platform_fee_percentage ?? 0);
  const campayFeePct = 2;
  const pctToCampaign = 100 - campayFeePct - platformFeePct;

  const steps = [
    {
      num: 1,
      titleKey: "howItWorks.step1.title",
      descKey: "howItWorks.step1.desc",
      bulletsKey: "howItWorks.step1.bullets",
    },
    {
      num: 2,
      titleKey: "howItWorks.step2.title",
      descKey: "howItWorks.step2.desc",
      bulletsKey: "howItWorks.step2.bullets",
      noteKey: "howItWorks.step2.note",
    },
    {
      num: 3,
      titleKey: "howItWorks.step3.title",
      descKey: "howItWorks.step3.desc",
      bulletsKey: "howItWorks.step3.bullets",
    },
    {
      num: 4,
      titleKey: "howItWorks.step4.title",
      descKey: "howItWorks.step4.desc",
      bulletsKey: "howItWorks.step4.bullets",
    },
    {
      num: 5,
      titleKey: "howItWorks.step5.title",
      descKey: "howItWorks.step5.desc",
      highlightKey: "howItWorks.step5.highlight",
    },
    {
      num: 6,
      titleKey: "howItWorks.step6.title",
      descKey: "howItWorks.step6.desc",
      bulletsKey: "howItWorks.step6.bullets",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-[#1D38DB] to-[#1DB1DB] text-white">
        <div className="pointer-events-none absolute -right-28 -top-28 h-105 w-105 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 top-5 h-65 w-65 rounded-full border border-white/20" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-20 sm:px-8 space-y-5">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-widest text-white/70">
                <span className="inline-block h-px w-7 bg-white/50" />
                {t("howItWorks.hero.eyebrow")}
              </div>
              <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                {t("howItWorks.hero.title")}
              </h1>
              <p className="mb-8 max-w-[50ch] text-base leading-relaxed text-white/85 sm:text-lg">
                {t("howItWorks.hero.lead")}
              </p>
              <Link
                href="/dashboard/donor/campaigns/create"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#1D38DB] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {t("howItWorks.hero.cta")} <ArrowRight size={16} />
              </Link>
            </div>

            
          </div>
          {/* Video embed */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-2xl">
              <iframe
                src="https://www.youtube.com/embed/3zGfX54RpLM?start=149"
                title="How JoyFund Works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 py-20 sm:px-8">
        {/* Section header */}
        <div className="mb-16 max-w-2xl">
          <h2 className="mb-4 font-heading text-3xl font-bold text-[#0F172A] sm:text-4xl">
            {t("howItWorks.section.title")}
          </h2>
          <p className="text-lg text-[#64748B]">
            {t("howItWorks.section.desc")}
          </p>
        </div>

        {/* Steps */}
        <div className="relative ml-14 space-y-12 sm:ml-16">
          {/* Vertical dashed line */}
          <div className="absolute -left-[37px] bottom-3 top-3 w-0.5 sm:-left-[44px]">
            <div
              className="h-full w-full"
              style={{
                background:
                  "repeating-linear-gradient(to bottom, #1DB1DB 0 6px, transparent 6px 12px)",
              }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.num} className="relative pt-2">
              {/* Step number circle */}
              <div
                className={`absolute -left-14 top-0 flex size-10 items-center justify-center rounded-full border-[3px] border-white text-sm font-medium sm:-left-16 sm:size-[42px] ${
                  step.num === 5
                    ? "bg-[#1DB1DB] shadow-[0_0_0_2px_#1DB1DB] text-white"
                    : "bg-[#1D38DB] shadow-[0_0_0_2px_#1D38DB] text-white"
                }`}
              >
                {step.num}
              </div>

              <h3 className="mb-2 font-heading text-lg font-bold text-[#0F172A]">
                {t(step.titleKey)}
              </h3>
              <p className="max-w-[60ch] text-[15px] leading-relaxed text-[#475569]">
                {t(step.descKey)}
              </p>

              {/* Bullet points */}
              {step.bulletsKey && (
                <ul className="mt-4 space-y-2">
                  {(t(step.bulletsKey) as string)
                    .split("|")
                    .map((bullet: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-[15px] text-[#475569]"
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#1DB1DB]" />
                        <span>{bullet.trim()}</span>
                      </li>
                    ))}
                </ul>
              )}

              {step.noteKey && (
                <div className="mt-4 rounded-xl border border-[#1DB1DB]/20 bg-[#F0FDFA] p-4 text-[14px] leading-relaxed text-[#475569]">
                  {t(step.noteKey)}
                </div>
              )}

              {step.highlightKey && (
                <div className="mt-4 rounded-xl border border-[#1D38DB]/15 bg-[#EFF6FF] p-4 text-[14px] leading-relaxed text-[#475569]">
                  {t(step.highlightKey)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Where the money goes */}
        <section className="mt-20 rounded-3xl bg-[#1A1A2E] p-10 text-white sm:p-12">
          <h2 className="mb-4 font-heading text-2xl font-bold sm:text-3xl">
            {t("howItWorks.flow.title")}
          </h2>
          <p className="mb-8 max-w-[64ch] text-[15px] leading-relaxed text-white/80">
            {t("howItWorks.flow.desc")}
          </p>

          {/* Fee breakdown */}
          <div className="mb-10 grid grid-cols-3 gap-0 rounded-2xl bg-white/5 text-center">
            <div className="py-6 px-4">
              <p className="text-3xl font-black mb-1">{platformFeePct}%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
                {t("howItWorks.flow.feePlatform")}
              </p>
              <p className="text-xs text-white/60">
                {t("howItWorks.flow.feePlatformDesc")}
              </p>
            </div>
            <div className="py-6 px-4 border-x border-white/10">
              <p className="text-3xl font-black mb-1">{campayFeePct}%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
                {t("howItWorks.flow.feeCampay")}
              </p>
              <p className="text-xs text-white/60">
                {t("howItWorks.flow.feeCampayDesc")}
              </p>
            </div>
            <div className="py-6 px-4">
              <p className="text-3xl font-black text-[#1DB1DB] mb-1">
                {pctToCampaign}%
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">
                {t("howItWorks.flow.feeCampaign")}
              </p>
              <p className="text-xs text-white/60">
                {t("howItWorks.flow.feeCampaignDesc")}
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "💳",
                titleKey: "howItWorks.flow.item1.title",
                descKey: "howItWorks.flow.item1.desc",
              },
              {
                icon: "👨‍⚕️",
                titleKey: "howItWorks.flow.item3.title",
                descKey: "howItWorks.flow.item3.desc",
              },
              {
                icon: "📊",
                titleKey: "howItWorks.flow.item4.title",
                descKey: "howItWorks.flow.item4.desc",
              },
              {
                icon: "💚",
                titleKey: "howItWorks.flow.item5.title",
                descKey: "howItWorks.flow.item5.desc",
              },
            ].map((item) => (
              <div key={item.titleKey} className="rounded-2xl bg-white/5 p-5">
                <div className="mb-3 text-2xl">{item.icon}</div>
                <h4 className="mb-2 font-heading text-base font-bold">
                  {t(item.titleKey)}
                </h4>
                <p className="text-sm leading-relaxed text-white/70">
                  {t(item.descKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-20 rounded-3xl bg-gradient-to-br from-[#1D38DB] to-[#1DB1DB] p-10 text-center text-white sm:p-14">
          <h2 className="mb-4 font-heading text-3xl font-bold sm:text-4xl">
            {t("howItWorks.cta.title")}
          </h2>
          <p className="mb-8 max-w-[50ch] mx-auto text-white/80">
            {t("howItWorks.cta.desc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/donor/campaigns/create"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#1D38DB] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {t("howItWorks.cta.button")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              {t("howItWorks.cta.secondary")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
