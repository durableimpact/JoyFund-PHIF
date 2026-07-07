'use client';
import Navbar from '@/components/shared/Navbar';
import { Globe, MapPin, CheckCircle, Phone, Building2, Shield, ArrowRight } from 'lucide-react';
import { useI18n } from '@/locales/client';
import Link from 'next/link';

export default function SupportedCountriesPage() {
  const t = useI18n();

  const features = [
    t('countries.feature1'),
    t('countries.feature2'),
    t('countries.feature3'),
    t('countries.feature4'),
    t('countries.feature5'),
  ];

  const upcomingCountries = [
    { name: 'Nigeria', flag: '🇳🇬' },
    { name: 'Kenya', flag: '🇰🇪' },
    { name: 'Ghana', flag: '🇬🇭' },
    { name: 'Senegal', flag: '🇸🇳' },
    { name: "Côte d'Ivoire", flag: '🇨🇮' },
    { name: 'DR Congo', flag: '🇨🇩' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        {/* ── Header ── */}
        <header className="mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--primary)' }}>
            {t('countries.title')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] leading-tight mb-4">
            Cameroon
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg">
            {t('countries.subtitle')}
          </p>
        </header>

        {/* ── Status line ── */}
        <div className="flex items-center gap-3 mb-12 pb-6 border-b border-gray-200">
          <span className="text-3xl">🇨🇲</span>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">{t('countries.active')}</span>
          </div>
        </div>

        {/* ── Country details ── */}
        <section className="mb-16">
          <div className="grid grid-cols-2 gap-x-12 gap-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{t('countries.coverage')}</p>
              <p className="text-[#1A1A2E] font-semibold">Nationwide</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{t('countries.currency')}</p>
              <p className="text-[#1A1A2E] font-semibold">XAF (CFA Franc)</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{t('countries.paymentMethods')}</p>
              <p className="text-[#1A1A2E] font-semibold">MTN MoMo, Orange Money</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{t('countries.languages')}</p>
              <p className="text-[#1A1A2E] font-semibold">Français, English</p>
            </div>
          </div>
        </section>

        {/* ── What's available ── */}
        <section className="mb-16">
          <h2 className="text-lg font-black text-[#1A1A2E] mb-6">{t('countries.features')}</h2>
          <div className="space-y-0">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-4 py-4 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-400 mt-0.5 w-5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="h-px bg-gray-200 mb-16" />

        {/* ── Expanding ── */}
        <section className="mb-16">
          <h2 className="text-lg font-black text-[#1A1A2E] mb-2">{t('countries.expanding')}</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-md">
            {t('countries.expandingDesc')}
          </p>

          <div className="space-y-0">
            {upcomingCountries.map((country, i) => (
              <div key={country.name} className="flex items-center gap-4 py-4 border-t border-gray-200">
                <span className="text-xl">{country.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{country.name}</p>
                </div>
                <span className="text-xs font-medium text-gray-400">{t('countries.comingSoon')}</span>
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
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    </div>
  );
}
