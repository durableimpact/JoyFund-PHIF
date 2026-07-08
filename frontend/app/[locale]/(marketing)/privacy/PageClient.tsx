'use client';
import Navbar from '@/components/shared/Navbar';
import { Shield, CheckCircle } from 'lucide-react';
import { useI18n } from '@/locales/client';

const trustBadges = [
  { label: 'GDPR', subtitle: 'European Data Protection' },
  { label: 'CCPA', subtitle: 'California Consumer Privacy' },
  { label: 'ISO 27001', subtitle: 'Information Security' },
];

export default function PrivacyPage() {
  const t = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative">
        {/* Hero */}
        <div className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-3xl px-4 pt-32 pb-16 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1DB1DB] to-[#0D8EBA] shadow-sm">
              <Shield className="size-7 text-white" />
            </div>
            <h1 className="mb-3 font-heading text-4xl font-bold tracking-tight text-[#0F172A]">
              {t('privacy.title')}
            </h1>
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#1DB1DB]" />
            <p className="text-[#64748B]">{t('privacy.effectiveDate')}</p>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-[#475569]">
              {t('privacy.section1P1')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-3xl px-4 py-16">
          {/* Section 1 */}
          <section className="mb-16 scroll-mt-24" id="section-1">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">01</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('privacy.section1Title')}
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-[#475569]">
              <ul className="flex flex-col gap-5">
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('privacy.section1Item1Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('privacy.section1Item1Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('privacy.section1Item2Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('privacy.section1Item2Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('privacy.section1Item3Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('privacy.section1Item3Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('privacy.section1Item4Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('privacy.section1Item4Desc')}
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-16 scroll-mt-24" id="section-2">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">02</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('privacy.section2Title')}
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-[#475569]">
              <p>{t('privacy.section2P1')}</p>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">1</span>
                  <span className="pt-0.5">{t('privacy.section2Item1')}</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">2</span>
                  <span className="pt-0.5">{t('privacy.section2Item2')}</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">3</span>
                  <span className="pt-0.5">{t('privacy.section2Item3')}</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">4</span>
                  <span className="pt-0.5">{t('privacy.section2Item4')}</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">5</span>
                  <span className="pt-0.5">{t('privacy.section2Item5')}</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-16 scroll-mt-24" id="section-3">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">03</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('privacy.section3Title')}
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-[#475569]">
              <p className="rounded-lg border-l-4 border-[#1DB1DB] bg-white py-4 pl-5 pr-4 text-[#0F172A] font-medium">
                {t('privacy.section3P1')}
              </p>
              <ul className="flex flex-col gap-4">
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0]">
                  <strong className="block text-[#0F172A]">
                    {t('privacy.section3Item1Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('privacy.section3Item1Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0]">
                  <strong className="block text-[#0F172A]">
                    {t('privacy.section3Item2Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('privacy.section3Item2Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0]">
                  <strong className="block text-[#0F172A]">
                    {t('privacy.section3Item3Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('privacy.section3Item3Desc')}
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-16 scroll-mt-24" id="section-4">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">04</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('privacy.section4Title')}
            </h2>
            <div className="rounded-lg bg-gradient-to-r from-[#F0FDFA] to-white p-6 text-base leading-relaxed text-[#475569] ring-1 ring-[#E2E8F0]">
              <p>{t('privacy.section4P1')}</p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="scroll-mt-24" id="section-5">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">05</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('privacy.section5Title')}
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-[#475569]">
              <p>{t('privacy.section5P1')}</p>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-[#1DB1DB]" />
                  <span>{t('privacy.section5Right1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-[#1DB1DB]" />
                  <span>{t('privacy.section5Right2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-[#1DB1DB]" />
                  <span>{t('privacy.section5Right3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-[#1DB1DB]" />
                  <span>{t('privacy.section5Right4')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-[#1DB1DB]" />
                  <span>{t('privacy.section5Right5')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-[#1DB1DB]" />
                  <span>{t('privacy.section5Right6')}</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Trust bar */}
        <div className="border-t border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-3xl px-4 py-12 text-center">
            <p className="mb-6 text-sm font-medium uppercase tracking-wider text-[#94A3B8]">Compliance & Certification</p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#1DB1DB]/10 font-heading text-sm font-bold text-[#1DB1DB]">
                    {badge.label}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#0F172A]">{badge.label}</p>
                    <p className="text-xs text-[#94A3B8]">{badge.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-[#E2E8F0] bg-[#F1F5F9]">
          <div className="mx-auto max-w-3xl px-4 py-10 text-center">
            <p className="text-sm leading-relaxed text-[#64748B]">
              {t('privacy.contact')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
