'use client';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, HeartPulse, Building2, CheckCircle2, Lock } from 'lucide-react';

export default function TrustAndTransparencyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Helmet>
        <title>Trust & Transparency | JoyFund Cameroon</title>
        <meta name="description" content="Discover how JoyFund guarantees 100% transparency. Our fraud-proof voucher system ensures your donations directly fund maternal healthcare in Cameroon." />
        <link rel="canonical" href="https://joy-fund.com/trust-and-transparency" />
        <meta property="og:title" content="Trust & Transparency | JoyFund" />
        <meta property="og:description" content="Our fraud-proof voucher system ensures your donations directly fund safe deliveries in Cameroon." />
        <meta property="og:url" content="https://joy-fund.com/trust-and-transparency" />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <Navbar />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-6">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A1A2E] mb-6 leading-tight">
              Radical Transparency in <br/>
              <span style={{ color: 'var(--primary)' }}>Maternal Healthcare</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              When you donate to a JoyFund, you deserve to know exactly where your money goes. We built a fraud-proof system to ensure every XAF helps a mother in need.
            </p>
          </div>

          {/* The 95/5 Split */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="card p-8 border-2 border-emerald-100 bg-emerald-50/30">
              <div className="text-4xl font-black text-emerald-500 mb-2">95%</div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">Direct Patient Care</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                95% of all donations go directly into the People's Health Insurance Fund (PHIF). This money is exclusively used to pay partner hospitals for safe deliveries and maternal care.
              </p>
            </div>
            <div className="card p-8 border-2 border-blue-100 bg-blue-50/30">
              <div className="text-4xl font-black text-blue-500 mb-2">5%</div>
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">Platform Operations</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                5% is retained to keep JoyFund running. This covers server costs, SMS gateway fees for vouchers, payment processing fees (MTN/Orange), and vetting new hospitals.
              </p>
            </div>
          </div>

          {/* How the Voucher System Works */}
          <div className="mb-16">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-8 text-center">The Fraud-Proof Voucher System</h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <Lock size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">1. Locked Funds</h3>
                  <p className="text-sm text-gray-600">Donations are securely held in the PHIF escrow wallet. Funds are never handed directly to patients in cash, eliminating mismanagement.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <HeartPulse size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">2. Digital Vouchers</h3>
                  <p className="text-sm text-gray-600">Verified vulnerable women receive a unique 6-digit alphanumeric SMS voucher that entitles them to specific maternal healthcare services.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-purple-100 text-purple-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <Building2 size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">3. Hospital Validation</h3>
                  <p className="text-sm text-gray-600">The patient presents the voucher at a vetted partner hospital. The hospital validates the code via our Provider Portal before providing care.</p>
                </div>
              </div>

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-amber-100 text-amber-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  <CheckCircle2 size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] card p-6">
                  <h3 className="font-bold text-[#1A1A2E] mb-2">4. Post-Care Payment</h3>
                  <p className="text-sm text-gray-600">After the safe delivery, the patient confirms receipt of care using a secret 4-digit PIN. Only then are the funds released directly to the hospital's bank account.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Public Ledger */}
          <div className="card p-8 bg-[#1A1A2E] text-white text-center mb-16">
            <h2 className="text-2xl font-black mb-4">Public Financial Ledger</h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto text-sm leading-relaxed">
              Every campaign page features a public financial trail. You can see every donation coming in, and every voucher payment going out to a hospital. Real-time accountability.
            </p>
            <Link href="/explore" className="btn-primary bg-white text-[#1A1A2E] hover:bg-gray-100 inline-flex items-center gap-2">
              View Active Campaigns <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
