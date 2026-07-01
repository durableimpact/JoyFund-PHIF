'use client';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import { Globe, MapPin, CheckCircle, Phone, Building2, Shield } from 'lucide-react';

const CAMeroonDETAILS = {
  name: 'Cameroon',
  flag: '🇨🇲',
  code: 'CM',
  status: 'active' as const,
  currency: 'XAF (Central African CFA Franc)',
  paymentMethods: ['MTN Mobile Money', 'Orange Money'],
  coverage: 'Nationwide',
  languages: ['French', 'English'],
  stats: [
    { label: 'Safe Deliveries Funded', value: '120+' },
    { label: 'Partner Hospitals', value: '15+' },
    { label: 'Social Workers', value: '25+' },
  ],
  features: [
    'Mobile money donations via MTN MoMo and Orange Money',
    'Care vouchers sent via SMS to verified beneficiaries',
    'PIN-protected voucher redemption at partner hospitals',
    'Real-time transparency dashboard',
    'Multi-language support (French & English)',
  ],
};

export default function SupportedCountriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Supported Countries | JoyFund</title>
        <meta name="description" content="JoyFund currently operates in Cameroon, supporting maternal healthcare through transparent community crowdfunding. Learn about our coverage and payment methods." />
        <link rel="canonical" href="https://joy-fund.com/countries" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Supported Countries | JoyFund",
          "url": "https://joy-fund.com/countries",
          "description": "JoyFund currently operates in Cameroon, supporting maternal healthcare through transparent community crowdfunding.",
          "publisher": {
            "@type": "Organization",
            "name": "JoyFund",
            "url": "https://joy-fund.com"
          }
        })}</script>
      </Helmet>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-32 pb-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-[#1DB1DB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-[#1DB1DB]" />
          </div>
          <h1 className="text-4xl font-black text-[#1A1A2E] mb-3">Supported Countries</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            JoyFund is currently live in Cameroon, with plans to expand to more countries across Africa.
          </p>
        </div>

        {/* Current country */}
        <section className="mb-16">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            {/* Country header */}
            <div className="bg-linear-to-r from-[#1DB1DB] to-[#178fa8] p-8 md:p-10 text-white">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{CAMeroonDETAILS.flag}</span>
                <div>
                  <h2 className="text-3xl font-black">{CAMeroonDETAILS.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-semibold text-emerald-300">Currently Active</span>
                  </div>
                </div>
              </div>
              {/* TODO: Add real stats once available
              <div className="grid grid-cols-3 gap-4 mt-6">
                {CAMeroonDETAILS.stats.map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-black">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
              */}
            </div>

            {/* Details */}
            <div className="p-8 md:p-10 space-y-8">
              {/* Info grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#1DB1DB] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#1A1A2E]">Coverage</p>
                    <p className="text-sm text-gray-500">{CAMeroonDETAILS.coverage}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#1DB1DB] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#1A1A2E]">Payment Methods</p>
                    <p className="text-sm text-gray-500">{CAMeroonDETAILS.paymentMethods.join(', ')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-[#1DB1DB] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#1A1A2E]">Currency</p>
                    <p className="text-sm text-gray-500">{CAMeroonDETAILS.currency}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#1DB1DB] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-[#1A1A2E]">Languages</p>
                    <p className="text-sm text-gray-500">{CAMeroonDETAILS.languages.join(', ')}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-bold text-[#1A1A2E] mb-3">What&apos;s Available in Cameroon</h3>
                <ul className="space-y-2">
                  {CAMeroonDETAILS.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Coming soon */}
        <section>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8 md:p-10">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Expanding Across Africa</h2>
            <p className="text-gray-500 text-sm mb-6">
              We&apos;re working to bring transparent healthcare crowdfunding to more countries.
              Join our newsletter to be notified when we launch in a new country.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Nigeria', flag: '🇳🇬', status: 'Coming Soon' },
                { name: 'Kenya', flag: '🇰🇪', status: 'Coming Soon' },
                { name: 'Ghana', flag: '🇬🇭', status: 'Coming Soon' },
                { name: 'Senegal', flag: '🇸🇳', status: 'Coming Soon' },
                { name: 'Côte d\'Ivoire', flag: '🇨🇮', status: 'Coming Soon' },
                { name: 'DR Congo', flag: '🇨🇩', status: 'Coming Soon' },
              ].map((country) => (
                <div
                  key={country.name}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div>
                    <p className="font-bold text-[#1A1A2E] text-sm">{country.name}</p>
                    <p className="text-xs text-gray-400">{country.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
