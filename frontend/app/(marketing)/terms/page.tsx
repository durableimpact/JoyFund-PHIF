'use client';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import { ScrollText, ShieldCheck, UserCheck, HeartHandshake, Info } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Terms of Service | JoyFund</title>
        <meta name="description" content="Read the Terms of Service for JoyFund — understanding your rights and responsibilities on our maternal healthcare crowdfunding platform." />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Terms of Service | JoyFund",
          "url": "https://joy-fund.com/terms",
          "description": "Terms of Service for JoyFund maternal healthcare crowdfunding platform.",
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
            <ScrollText className="w-8 h-8 text-[#1DB1DB]" />
          </div>
          <h1 className="text-4xl font-black text-[#1A1A2E] mb-3">Terms of Service</h1>
          <p className="text-gray-500">Effective Date: June 2, 2026</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8 md:p-12 space-y-10">
          
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">1. Overview</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                JoyFund is a transparent digital platform operated by <strong>Solidarity Health Bridge</strong>. We digitise the traditional Cameroonian culture of community mutual aid to create a People&apos;s Health Insurance Fund (PHIF) dedicated to maternal healthcare for vulnerable women across Cameroon.
              </p>
              <p>
                By using JoyFund, you agree to these terms. If you are using the platform on behalf of a hospital or organisation, you represent that you have the authority to bind that entity to these terms.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">2. User Roles & Accounts</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>JoyFund serves several categories of users, each with specific responsibilities:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Donors:</strong> Individuals who create JoyFund campaigns for celebrations (birthdays, weddings, etc.) or contribute to existing funds.</li>
                <li><strong>Social Workers:</strong> Verified professionals responsible for identifying, enrolling, and verifying the vulnerability of beneficiaries.</li>
                <li><strong>Hospital Partners:</strong> Healthcare facilities that accept JoyFund vouchers. This includes <strong>Hospital Admins</strong> who manage staff and <strong>Receptionists</strong> who validate care vouchers.</li>
                <li><strong>System Admins:</strong> Platform overseers ensuring the integrity and smooth operation of the fund.</li>
              </ul>
              <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <HeartHandshake className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">3. Campaigns & Donations</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                JoyFund campaigns are intended to pool community resources for healthcare. Donors agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Donations are made voluntarily and are <strong>non-refundable</strong>.</li>
                <li>Donations are processed via mobile money providers (MTN MoMo, Orange Money). Any carrier-specific fees are the responsibility of the donor.</li>
                <li><strong>Fund Allocation:</strong> 95% of every donation goes directly into the People&apos;s Health Insurance Fund to pay for care vouchers. 5% is retained for platform maintenance and SMS gateway operations.</li>
                <li>Campaign descriptions and images must be truthful and must not violate any intellectual property or decency standards.</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-[#1DB1DB]" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">4. The Voucher System & Anti-Fraud</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                JoyFund uses a unique digital voucher system to ensure funds are spent only on verified healthcare services:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Vouchers are issued to verified vulnerable beneficiaries via SMS.</li>
                <li>A voucher has no cash value and cannot be exchanged for currency. It is redeemable only at partner hospitals for specific maternal health services.</li>
                <li><strong>Verification PIN:</strong> To prevent fraud, every beneficiary is assigned a unique PIN. Care is only confirmed and funds released to the hospital when the patient provides this PIN to the receptionist after receiving care.</li>
                <li>Any attempt to manipulate the voucher system or collude for fraudulent claims will result in immediate termination of access and legal reporting.</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-[#1A1A2E]">5. Transparency & Reporting</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                JoyFund is built on radical transparency. All financial trails (money in from donors and money out to hospitals) are logged and visible on the platform&apos;s Transparency Dashboards. By using the platform, you acknowledge that campaign totals and general impact metrics are public information.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-[#1A1A2E]">6. Limitation of Liability</h2>
            </div>
            <div className="text-gray-600 leading-relaxed space-y-4">
              <p>
                Solidarity Health Bridge/JoyFund provides the technology to bridge donors and healthcare. We are not a healthcare provider. We are not liable for the quality of medical care provided at partner hospitals, nor for any medical complications that may arise. Healthcare decisions remain between the patient and their medical provider.
              </p>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-100 text-sm text-gray-400">
            <p>
              If you have any questions regarding these terms, please contact us at support@joyfund.cm.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
