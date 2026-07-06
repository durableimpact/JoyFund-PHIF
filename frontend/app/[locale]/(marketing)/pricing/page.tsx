'use client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getCurrentFeePolicy } from '@/actions/payments';
import { useState } from 'react';
import { useI18n } from '@/locales/client';
import Link from 'next/link';

const EXAMPLE_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

function getFaqItems(t: any) {
  return [
    { q: t("pricing.faq1Q"), a: t("pricing.faq1A") },
    { q: t("pricing.faq2Q"), a: t("pricing.faq2A") },
    { q: t("pricing.faq3Q"), a: t("pricing.faq3A") },
    { q: t("pricing.faq4Q"), a: t("pricing.faq4A") },
    { q: t("pricing.faq5Q"), a: t("pricing.faq5A") },
  ];
}

function formatXaf(n: number) {
  return n.toLocaleString('en-US');
}

export default function PricingPage() {
  const t = useI18n();
  const { data: feePolicy } = useQuery({
    queryKey: ['fee-policy-current'],
    queryFn: getCurrentFeePolicy,
  });

  const platformFeePct = Number(feePolicy?.platform_fee_percentage ?? 5);
  const escrowFeePct = Number(feePolicy?.escrow_fee_percentage ?? 0);
  const campayFeePct = 2;
  const pctToCampaign = 100 - campayFeePct - platformFeePct - escrowFeePct;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Helmet>
        <title>Pricing & Fees | JoyFund</title>
        <meta name="description" content="Understand how JoyFund fees work. See exactly where your donation goes — transparent pricing for maternal healthcare crowdfunding in Cameroon." />
        <link rel="canonical" href="https://joy-fund.com/pricing" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Pricing & Fees | JoyFund",
          "url": "https://joy-fund.com/pricing",
          "description": "Transparent pricing and fee breakdown for JoyFund donations.",
          "publisher": {
            "@type": "Organization",
            "name": "JoyFund",
            "url": "https://joy-fund.com"
          }
        })}</script>
      </Helmet>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        {/* ── Header ── */}
        <header className="mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--primary)' }}>
            {t('pricing.title')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] leading-tight mb-4">
            Where every franc goes
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg">
            {t('pricing.subtitle')}
          </p>
        </header>

        {/* ── Fee breakdown ── */}
        <section className="mb-16">
          <div className="grid grid-cols-4 gap-0 text-center border-y border-gray-200">
            <div className="py-8 px-4">
              <p className="text-3xl font-black text-[#1A1A2E] mb-1">{campayFeePct}%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t('pricing.campayFee')}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{t('pricing.campayFeeDesc')}</p>
            </div>
            <div className="py-8 px-4 border-x border-gray-200">
              <p className="text-3xl font-black text-[#1A1A2E] mb-1">{platformFeePct}%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t('pricing.platformFee')}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{t('pricing.platformFeeDesc')}</p>
            </div>
            <div className="py-8 px-4 border-r border-gray-200">
              <p className="text-3xl font-black text-[#1A1A2E] mb-1">{escrowFeePct}%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Escrow</p>
              <p className="text-xs text-gray-500 leading-relaxed">Secure fund holding until care is delivered</p>
            </div>
            <div className="py-8 px-4">
              <p className="text-3xl font-black mb-1" style={{ color: 'var(--primary)' }}>{pctToCampaign}%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t('pricing.goesToCampaign')}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{t('pricing.goesToCampaignDesc')}</p>
            </div>
          </div>
        </section>

        {/* ── Calculator ── */}
        <section className="mb-16">
          <h2 className="text-lg font-black text-[#1A1A2E] mb-2">{t('pricing.calculatorTitle')}</h2>
          <p className="text-gray-500 text-sm mb-8">{t('pricing.calculatorSubtitle')}</p>

          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 py-3 border-b border-gray-200 text-xs font-bold uppercase tracking-widest text-gray-400">
            <div>{t('pricing.donation')}</div>
            <div className="text-right">Campay</div>
            <div className="text-right">Platform</div>
            <div className="text-right">Escrow</div>
            <div className="text-right" style={{ color: 'var(--primary)' }}>{t('pricing.goesToCampaign')}</div>
          </div>

          {/* Table rows */}
          {EXAMPLE_AMOUNTS.map((amount) => {
            const campay = Math.round(amount * campayFeePct / 100);
            const platform = Math.round(amount * platformFeePct / 100);
            const escrow = Math.round(amount * escrowFeePct / 100);
            const net = amount - campay - platform - escrow;
            return (
              <div key={amount} className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100 text-sm">
                <div className="font-bold text-[#1A1A2E]">{formatXaf(amount)} XAF</div>
                <div className="text-right text-gray-500">-{formatXaf(campay)}</div>
                <div className="text-right text-gray-500">-{formatXaf(platform)}</div>
                <div className="text-right text-gray-500">-{formatXaf(escrow)}</div>
                <div className="text-right font-bold" style={{ color: 'var(--primary)' }}>{formatXaf(net)}</div>
              </div>
            );
          })}

          <p className="text-xs text-gray-400 mt-3">
            * {t('pricing.supportsHealthcare')}
          </p>
        </section>

        {/* ── Example walkthrough ── */}
        <section className="mb-16">
          <h2 className="text-lg font-black text-[#1A1A2E] mb-6">{t('pricing.exampleTitle')}</h2>
          <div className="space-y-0">
            {[
              { step: '1', bold: t('pricing.step1'), desc: t('pricing.step1Desc') },
              { step: '2', bold: `${formatXaf(Math.round(5000 * campayFeePct / 100))} XAF ${t('pricing.step2')}`, desc: t('pricing.step2Desc') },
              { step: '3', bold: t('pricing.step3', { amount: formatXaf(Math.round(5000 * platformFeePct / 100)), pct: platformFeePct }), desc: t('pricing.step3Desc') },
              { step: '4', bold: `${formatXaf(Math.round(5000 * escrowFeePct / 100))} XAF — Escrow (${escrowFeePct}%)`, desc: 'Held securely until care is confirmed' },
              { step: '5', bold: t('pricing.step4', { amount: formatXaf(5000 - Math.round(5000 * campayFeePct / 100) - Math.round(5000 * platformFeePct / 100) - Math.round(5000 * escrowFeePct / 100)), pct: pctToCampaign }), desc: t('pricing.step4Desc') },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">{item.step}</span>
                <div>
                  <p className="font-bold text-[#1A1A2E] text-sm">{item.bold}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="h-px bg-gray-200 mb-16" />

        {/* ── FAQ ── */}
        <section className="mb-16">
          <h2 className="text-lg font-black text-[#1A1A2E] mb-6">{t('pricing.faqTitle')}</h2>
          <div className="space-y-0">
            {getFaqItems(t).map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left border-t border-gray-200 hover:text-gray-600 transition-colors"
                >
                  <span className="font-bold text-sm text-[#1A1A2E] pr-4">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <p className="pb-5 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <div className="pt-8 border-t border-gray-200">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-bold transition-colors group"
            style={{ color: 'var(--primary)' }}
          >
            Explore active campaigns
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
