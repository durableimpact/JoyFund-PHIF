'use client';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import { ShieldAlert, Eye, Database, Share2, Lock, Scale } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Privacy Policy | JoyFund</title>
        <meta name="description" content="Learn how JoyFund protects your data and maintains transparency while providing maternal healthcare in Cameroon." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Privacy Policy | JoyFund",
          "url": "https://joy-fund.com/privacy",
          "description": "Privacy Policy for JoyFund maternal healthcare crowdfunding platform.",
          "publisher": {
            "@type": "Organization",
            "name": "JoyFund",
            "url": "https://joy-fund.com"
          }
        })}</script>
      </Helmet>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#1DB1DB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-[#1DB1DB]" />
          </div>
          <h1 className="text-4xl font-black text-[#1A1A2E] mb-3">Privacy Policy</h1>
          <p className="text-gray-500">Effective Date: June 2, 2026</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8 md:p-12 space-y-10">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">1. Data We Collect</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>JoyFund collects information necessary to facilitate transparent crowdfunding and healthcare delivery:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Donors:</strong> Name, email address, phone number (for mobile money processing), and campaign details.</li>
                <li><strong>Beneficiaries:</strong> Name, location, socioeconomic status (for vulnerability verification), and Digital Health ID.</li>
                <li><strong>Partner Personnel:</strong> Professional details for Social Workers and Hospital Staff to manage role-based access.</li>
                <li><strong>Transaction Data:</strong> Mobile money transaction IDs and care voucher redemption history.</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">2. How We Use Your Data</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>Your data is used specifically for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Issuing care vouchers via SMS to verified beneficiaries.</li>
                <li>Settling healthcare claims with partner hospitals.</li>
                <li>Providing donors with real-time notifications about the impact of their contributions.</li>
                <li>Maintaining a public transparency dashboard to prevent fund misappropriation.</li>
                <li>Platform security and fraud prevention via the 4-digit anti-fraud PIN system.</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">3. Data Sharing</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                We do not sell your data. We share information only with entities directly involved in the care cycle:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Hospitals:</strong> Receive the beneficiary&apos;s name and voucher code to validate and provide medical service.</li>
                <li><strong>Social Workers:</strong> Access beneficiary profiles to verify eligibility and manage enrollment.</li>
                <li><strong>Donors:</strong> See aggregated impact data (e.g., &quot;Your campaign funded 3 deliveries&quot;) and names of beneficiaries (unless the beneficiary has requested anonymity).</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">4. Data Security</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                We implement robust security measures to protect sensitive healthcare and financial data. All vouchers are protected by patient-held PINs, and access to beneficiary data is restricted to verified social workers and medical partners under strict confidentiality agreements.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">5. Legal Compliance</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                JoyFund operates in compliance with Cameroonian laws and regulations regarding data protection and financial solidarity funds. We cooperate with law enforcement only when required by valid legal process.
              </p>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-100 text-sm text-gray-400">
            <p>
              To request a copy of your data or to ask for data deletion, please contact us at privacy@joyfund.cm.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
