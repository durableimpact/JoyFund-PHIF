'use client';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Helmet>
        <title>About JoyFund - Our Mission for Maternal Healthcare</title>
        <meta name="description" content="Learn about JoyFund's mission to provide maternal healthcare for vulnerable women in Cameroon through community-powered crowdfunding." />
        <link rel="canonical" href="https://joy-fund.com/about" />
        <meta property="og:title" content="About JoyFund - Our Mission" />
        <meta property="og:description" content="JoyFund digitises Cameroon's Njangi solidarity culture, redirecting celebrations into maternal healthcare for vulnerable pregnant women." />
        <meta property="og:url" content="https://joy-fund.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joy-fund.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About JoyFund",
          url: "https://joy-fund.com/about",
          description: "JoyFund digitises Cameroon's Njangi solidarity culture, redirecting celebrations into maternal healthcare.",
          mainEntity: {
            "@type": "Organization",
            name: "JoyFund",
            url: "https://joy-fund.com"
          }
        })}</script>
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-[#1A1A2E] mb-4">About JoyFund</h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              <span className="font-semibold" style={{ color: 'var(--primary)' }}>Your Joy Saves Lives</span> — a transparent crowdfunding platform turning celebrations into maternal healthcare across Cameroon.
            </p>
          </div>

          {/* Mission */}
          <div className="card p-8 mb-6">
            <h2 className="text-xl font-black text-[#1A1A2E] mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              JoyFund digitises Cameroon's traditional <strong>Njangi</strong> solidarity culture — the time-honoured practice of community members pooling resources to support one another through milestones. We redirect this generosity toward maternal healthcare for vulnerable pregnant women.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Less than <strong>2% of Cameroonians</strong> hold formal health insurance. Approximately <strong>70%</strong> rely entirely on out-of-pocket payments. This results in widespread hospital detention of post-delivery mothers who cannot settle their bills.
            </p>
          </div>

          {/* How it works deeply */}
          <div className="card p-8 mb-6">
            <h2 className="text-xl font-black text-[#1A1A2E] mb-4">How the System Works</h2>
            <div className="space-y-4">
              {[
                { n: '1', t: 'Celebration Campaign', d: 'A donor creates a JoyFund campaign for their birthday, wedding, promotion, or graduation.' },
                { n: '2', t: 'Community Pools Funds', d: 'Friends and family donate via MTN MoMo or Orange Money. 95% goes to the People\'s Health Insurance Fund (PHIF). 5% covers platform operations.' },
                { n: '3', t: 'Social Worker Enrolls', d: 'A trained social worker identifies and enrolls a verified vulnerable beneficiary, issuing them a unique Digital Health ID (BEN-XXXX).' },
                { n: '4', t: 'Voucher Issued', d: 'A care voucher (6-digit alphanumeric code) is SMS-delivered to the beneficiary, covering specific healthcare services.' },
                { n: '5', t: 'Hospital Validates', d: 'The beneficiary presents the voucher at a partner hospital. The receptionist validates it via the Provider Portal or USSD offline mode.' },
                { n: '6', t: 'PIN Confirms Care', d: 'Upon service completion, the patient\'s 4-digit anti-fraud PIN confirms care was received. Funds are released directly to the hospital.' },
                { n: '7', t: 'Full Transparency', d: 'Every step is visible on the public transparency dashboard. Donors receive real-time notifications about their impact.' },
              ].map(s => (
                <div key={s.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>{s.n}</div>
                  <div>
                    <p className="font-bold text-[#1A1A2E] mb-0.5">{s.t}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { v: '< 2%', l: 'Cameroonians with health insurance' },
              { v: '70%', l: 'Rely on out-of-pocket payments' },
              { v: '11.4M', l: 'Active MoMo accounts in Cameroon' },
              { v: '500', l: '6-month target beneficiaries' },
            ].map(s => (
              <div key={s.l} className="card p-4 text-center">
                <div className="text-2xl font-black mb-1" style={{ color: 'var(--secondary)' }}>{s.v}</div>
                <div className="text-xs text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href="/dashboard/donor/campaigns/create" className="btn-primary mr-3">Start a JoyFund</Link>
            <Link href="/explore" className="btn-outline">Explore Campaigns</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
