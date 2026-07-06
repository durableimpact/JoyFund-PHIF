'use client';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import { Scale, Mail } from 'lucide-react';
import { useI18n } from '@/locales/client';

export default function TermsPage() {
  const t = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms of Service | JoyFund</title>
        <meta
          name="description"
          content="Read the Terms of Service for JoyFund — your rights and responsibilities on our maternal healthcare crowdfunding platform."
        />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service | JoyFund',
          url: 'https://joy-fund.com/terms',
          description:
            'Terms of Service for JoyFund maternal healthcare crowdfunding platform.',
          publisher: {
            '@type': 'Organization',
            name: 'JoyFund',
            url: 'https://joy-fund.com',
          },
        })}</script>
      </Helmet>
      <Navbar />

      <main className="relative">
        {/* Hero */}
        <div className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-3xl px-4 pt-32 pb-16 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1DB1DB] to-[#0D8EBA] shadow-sm">
              <Scale className="size-7 text-white" />
            </div>
            <h1 className="mb-3 font-heading text-4xl font-bold tracking-tight text-[#0F172A]">
              {t('terms.title')}
            </h1>
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#1DB1DB]" />
            <p className="text-[#64748B]">{t('terms.effectiveDate')}</p>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-[#475569]">
              {t('terms.section1P1')}
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
              {t('terms.section1Title')}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-[#475569]">
              <p>{t('terms.section1P2')}</p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-16 scroll-mt-24" id="section-2">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">02</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('terms.section2Title')}
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-[#475569]">
              <p>{t('terms.section2P1')}</p>
              <ul className="flex flex-col gap-4">
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('terms.section2Role1Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('terms.section2Role1Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('terms.section2Role2Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('terms.section2Role2Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('terms.section2Role3Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('terms.section2Role3Desc')}
                  </span>
                </li>
                <li className="rounded-lg bg-white p-5 ring-1 ring-[#E2E8F0] transition-shadow hover:ring-[#1DB1DB]/30">
                  <strong className="block text-[#0F172A]">
                    {t('terms.section2Role4Title')}
                  </strong>
                  <span className="mt-1 block text-[#64748B]">
                    {t('terms.section2Role4Desc')}
                  </span>
                </li>
              </ul>
              <p>{t('terms.section2P2')}</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-16 scroll-mt-24" id="section-3">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">03</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('terms.section3Title')}
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-[#475569]">
              <p>{t('terms.section3P1')}</p>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4 ring-1 ring-[#E2E8F0]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">1</span>
                  <span className="pt-0.5">{t('terms.section3Item1')}</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4 ring-1 ring-[#E2E8F0]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">2</span>
                  <span className="pt-0.5">{t('terms.section3Item2')}</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4 ring-1 ring-[#E2E8F0]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">3</span>
                  <span className="pt-0.5">{t('terms.section3Item3')}</span>
                </li>
                <li className="flex items-start gap-3 rounded-lg bg-white/60 p-4 ring-1 ring-[#E2E8F0]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 text-xs font-semibold text-[#1DB1DB]">4</span>
                  <span className="pt-0.5">{t('terms.section3Item4')}</span>
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
              {t('terms.section4Title')}
            </h2>
            <div className="space-y-5 text-base leading-relaxed text-[#475569]">
              <p>{t('terms.section4P1')}</p>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 p-1">
                    <span className="size-2 rounded-full bg-[#1DB1DB]" />
                  </span>
                  <span className="pt-0.5">{t('terms.section4Item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 p-1">
                    <span className="size-2 rounded-full bg-[#1DB1DB]" />
                  </span>
                  <span className="pt-0.5">{t('terms.section4Item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 p-1">
                    <span className="size-2 rounded-full bg-[#1DB1DB]" />
                  </span>
                  <span className="pt-0.5">{t('terms.section4Item3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1DB1DB]/10 p-1">
                    <span className="size-2 rounded-full bg-[#1DB1DB]" />
                  </span>
                  <span className="pt-0.5">{t('terms.section4Item4')}</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-16 scroll-mt-24" id="section-5">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">05</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('terms.section5Title')}
            </h2>
            <div className="rounded-lg bg-gradient-to-r from-[#F0FDFA] to-white p-6 text-base leading-relaxed text-[#475569] ring-1 ring-[#E2E8F0]">
              <p>{t('terms.section5P1')}</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-16 scroll-mt-24" id="section-6">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">06</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('terms.section6Title')}
            </h2>
            <div className="rounded-lg bg-white p-6 text-base leading-relaxed text-[#475569] ring-1 ring-[#E2E8F0]">
              <p>{t('terms.section6P1')}</p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="scroll-mt-24" id="section-7">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-heading text-4xl font-bold text-[#1DB1DB]/20">07</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#1DB1DB]/30 to-transparent" />
            </div>
            <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-[#0F172A]">
              {t('terms.section7Title')}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-[#475569]">
              <p>{t('terms.section7P1')}</p>
            </div>
          </section>
        </div>

        {/* Contact */}
        <div className="border-t border-[#E2E8F0] bg-[#F1F5F9]">
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 px-4 py-10 text-center">
            <Mail className="size-5 text-[#1DB1DB]" />
            <p className="text-sm leading-relaxed text-[#64748B]">
              {t('terms.contact')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
