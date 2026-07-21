'use client'

import Link from 'next/link'
import Navbar from '@/components/shared/Navbar'
import { useI18n } from '@/locales/client'
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'

export default function BlogPage() {
  const t = useI18n()

  const steps = [
    {
      num: 1,
      titleKey: 'blog.step1.title',
      descKey: 'blog.step1.desc',
    },
    {
      num: 2,
      titleKey: 'blog.step2.title',
      descKey: 'blog.step2.desc',
      noteKey: 'blog.step2.note',
    },
    {
      num: 3,
      titleKey: 'blog.step3.title',
      descKey: 'blog.step3.desc',
    },
    {
      num: 4,
      titleKey: 'blog.step4.title',
      descKey: 'blog.step4.desc',
    },
    {
      num: 5,
      titleKey: 'blog.step5.title',
      descKey: 'blog.step5.desc',
      highlightKey: 'blog.step5.highlight',
    },
    {
      num: 6,
      titleKey: 'blog.step6.title',
      descKey: 'blog.step6.desc',
    },
  ]

  const pills = [
    'blog.flow.pill1',
    'blog.flow.pill2',
    'blog.flow.pill3',
    'blog.flow.pill4',
    'blog.flow.pill5',
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1D38DB] to-[#1DB1DB] text-white">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-28 -top-28 h-[420px] w-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 top-5 h-[260px] w-[260px] rounded-full border border-white/20" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-8">
          <div className="mb-6 flex items-center gap-3 text-xs uppercase tracking-widest text-white/70">
            <span className="inline-block h-px w-7 bg-white/50" />
            {t('blog.hero.eyebrow')}
          </div>
          <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {t('blog.hero.title')}
          </h1>
          <p className="max-w-[56ch] text-base leading-relaxed text-white/85 sm:text-lg">
            {t('blog.hero.lead')}
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-6 pb-24 sm:px-8">
        {/* Intro card */}
        <div className="relative z-20 -mt-12 mb-16 rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-lg sm:p-9">
          <p
            className="text-base leading-relaxed text-[#475569]"
            dangerouslySetInnerHTML={{ __html: t('blog.intro') }}
          />
        </div>

        {/* Section label */}
        <div className="mb-2 flex items-center gap-3 text-xs uppercase tracking-widest text-[#1DB1DB]">
          <span className="inline-block h-px w-[18px] bg-[#1DB1DB]" />
          {t('blog.section.process')}
        </div>
        <h2 className="mb-2 font-heading text-[1.9rem] font-bold tracking-tight text-[#0F172A]">
          {t('blog.section.processTitle')}
        </h2>
        <p className="mb-10 max-w-[60ch] text-[15px] leading-relaxed text-[#64748B]">
          {t('blog.section.processDesc')}
        </p>

        {/* Steps */}
        <div className="relative ml-14 space-y-10 sm:ml-16">
          {/* Vertical dashed line */}
          <div className="absolute -left-[37px] bottom-3 top-3 w-0.5 sm:-left-[44px]">
            <div
              className="h-full w-full"
              style={{
                background:
                  'repeating-linear-gradient(to bottom, #1DB1DB 0 6px, transparent 6px 12px)',
              }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.num} className="relative pt-2">
              {/* Step number circle */}
              <div
                className={`absolute -left-14 top-0 flex size-10 items-center justify-center rounded-full border-[3px] border-[#F9FAFB] text-sm font-medium sm:-left-16 sm:size-[42px] ${
                  step.num === 5
                    ? 'bg-[#1DB1DB] shadow-[0_0_0_2px_#1DB1DB] text-white'
                    : 'bg-[#1D38DB] shadow-[0_0_0_2px_#1D38DB] text-white'
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
        <div className="mt-16 rounded-2xl bg-[#1A1A2E] p-9 text-white sm:p-10">
          <h3 className="mb-4 font-heading text-xl font-bold">{t('blog.flow.title')}</h3>
          <p className="mb-5 max-w-[64ch] text-[15px] leading-relaxed text-white/80">
            {t('blog.flow.p1')}
          </p>
          <p className="mb-6 max-w-[64ch] text-[15px] leading-relaxed text-white/80">
            {t('blog.flow.p2')}
          </p>
          <div className="flex flex-wrap gap-3">
            {pills.map((pillKey) => (
              <span
                key={pillKey}
                className="rounded-full border border-white/20 px-4 py-2 text-xs tracking-wide text-white/90"
              >
                {t(pillKey)}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className="mt-14 rounded-2xl px-6 py-12 text-center sm:px-8"
          style={{ background: 'linear-gradient(135deg, #1D38DB, #1DB1DB)' }}
        >
          <h3 className="mb-3 font-heading text-2xl font-bold text-white sm:text-[1.7rem]">
            {t('blog.cta.title')}
          </h3>
          <p className="mb-8 text-[15px] text-white/75">
            {t('blog.cta.desc')}
          </p>
          <Link
            href="/dashboard/donor/campaigns/create"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#1D38DB] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {t('blog.cta.button')} <ArrowRight size={16} />
          </Link>
        </div>

        {/* Article meta */}
        <div className="mt-16 flex flex-wrap items-center gap-6 border-t border-[#E2E8F0] pt-8 text-xs text-[#64748B]">
          <span className="flex items-center gap-2">
            <Calendar size={14} />
            {t('blog.meta.published')}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={14} />
            {t('blog.meta.readTime')}
          </span>
          <Link
            href="/"
            className="ml-auto flex items-center gap-2 font-semibold text-[#1DB1DB] transition-colors hover:text-[#1D38DB]"
          >
            <ArrowLeft size={14} />
            {t('blog.meta.backHome')}
          </Link>
        </div>
      </main>
    </div>
  )
}
