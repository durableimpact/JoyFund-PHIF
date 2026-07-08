'use client';
import Navbar from '@/components/shared/Navbar';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, HeartPulse, Building2, CheckCircle2, Lock } from 'lucide-react';
import { useI18n } from '@/locales/client';

export default function TrustAndTransparencyPage() {
  const t = useI18n();
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-6">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A1A2E] mb-6 leading-tight">
              {t('trust.title1')} <br/>
              <span style={{ color: 'var(--primary)' }}>{t('trust.title2')}</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              {t('trust.subtitle')}
            </p>
          </div>

          {/* The 95/5 Split */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="card p-8 border-2 border-emerald-100 bg-emerald-50/30">
              <div className="text-4xl font-black text-emerald-500 mb-2">{t('trust.percent95')}</div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">{t('trust.percent95Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('trust.percent95Desc')}
              </p>
            </div>
            <div className="card p-8 border-2 border-blue-100 bg-blue-50/30">
              <div className="text-4xl font-black text-blue-500 mb-2">{t('trust.percent5')}</div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">{t('trust.percent5Title')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('trust.percent5Desc')}
              </p>
            </div>
          </div>

          {/* How the Voucher System Works */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-8 text-center">{t('trust.voucherTitle')}</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <Lock size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">{t('trust.step1Title')}</h3>
                  <p className="text-sm text-gray-600">{t('trust.step1Desc')}</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <HeartPulse size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">{t('trust.step2Title')}</h3>
                  <p className="text-sm text-gray-600">{t('trust.step2Desc')}</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-purple-100 text-purple-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <Building2 size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">{t('trust.step3Title')}</h3>
                  <p className="text-sm text-gray-600">{t('trust.step3Desc')}</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-amber-100 text-amber-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <CheckCircle2 size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">{t('trust.step4Title')}</h3>
                  <p className="text-sm text-gray-600">{t('trust.step4Desc')}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Public Ledger */}
          <div className="card p-8 bg-[#1A1A2E] text-white text-center mb-16">
            <h2 className="text-2xl font-black mb-4">{t('trust.ledgerTitle')}</h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto text-sm leading-relaxed">
              {t('trust.ledgerDesc')}
            </p>
            <Link href="/explore" className="btn-primary bg-white text-[#1A1A2E] hover:bg-gray-100 inline-flex items-center gap-2">
              {t('trust.ledgerButton')} <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
