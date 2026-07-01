'use client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import { Receipt, CreditCard, Building2, Heart, Calculator, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getCurrentFeePolicy } from '@/actions/payments';
import { useState } from 'react';

const EXAMPLE_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

const FAQ_ITEMS = [
  {
    q: "Who pays the fees?",
    a: "Fees are deducted from the donation amount before it reaches the campaign. The donor pays the full donation amount — no extra charges are added on top."
  },
  {
    q: "Why is there a 2% Campay fee?",
    a: "Campay is our payment processing partner that handles mobile money transactions (MTN MoMo and Orange Money). The 2% fee covers the cost of securely processing your payment."
  },
  {
    q: "What does the platform fee cover?",
    a: "The platform fee covers server hosting, SMS delivery for care vouchers, fraud prevention systems, customer support, and ongoing development to keep the platform running smoothly."
  },
  {
    q: "Are fees refundable?",
    a: "Donations are non-refundable once processed. The fees cover the actual cost of payment processing and platform operations that have already occurred."
  },
  {
    q: "Can I see where my money goes?",
    a: "Yes! Every donation is tracked on our Transparency Dashboard. You can see exactly how your contribution was allocated and the healthcare impact it created."
  }
];

function FeeBreakdownCard({ amount, platformFeePct }: { amount: number; platformFeePct: number }) {
  const campayFee = Math.round(amount * 0.02);
  const platformFee = Math.round(amount * platformFeePct / 100);
  const netToCampaign = amount - campayFee - platformFee;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#1A1A2E]">Donation</span>
        <span className="text-lg font-black text-[#1A1A2E]">{amount.toLocaleString()} XAF</span>
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-gray-600">Campay fee (2%)</span>
          </div>
          <span className="font-semibold text-gray-900">-{campayFee.toLocaleString()} XAF</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-gray-600">Platform fee ({platformFeePct}%)</span>
          </div>
          <span className="font-semibold text-gray-900">-{platformFee.toLocaleString()} XAF</span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">Goes to campaign</span>
          </div>
          <span className="text-lg font-black text-emerald-600">{netToCampaign.toLocaleString()} XAF</span>
        </div>
        <div className="mt-2 bg-emerald-50 rounded-lg px-3 py-1.5">
          <span className="text-xs font-semibold text-emerald-600">
            {Math.round((netToCampaign / amount) * 100)}% of your donation directly supports healthcare
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { data: feePolicy } = useQuery({
    queryKey: ['fee-policy-current'],
    queryFn: getCurrentFeePolicy,
  });

  const platformFeePct = Number(feePolicy?.platform_fee_percentage ?? 5);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
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

      <main className="max-w-5xl mx-auto px-4 pt-32 pb-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-[#1DB1DB]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-[#1DB1DB]" />
          </div>
          <h1 className="text-4xl font-black text-[#1A1A2E] mb-3">Transparent Pricing</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            We believe you deserve to know exactly where every franc of your donation goes.
            Here&apos;s a clear breakdown of our fees.
          </p>
        </div>

        {/* Fee Structure */}
        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-[#1A1A2E] mb-1">2%</h3>
              <p className="text-sm font-semibold text-[#1DB1DB] mb-2">Campay Fee</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Payment processing by Campay for MTN MoMo and Orange Money transactions.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-[#1A1A2E] mb-1">{platformFeePct}%</h3>
              <p className="text-sm font-semibold text-[#1DB1DB] mb-2">Platform Fee</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Covers server hosting, SMS vouchers, fraud prevention, support, and development.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-center ring-2 ring-emerald-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-[#1A1A2E] mb-1">{100 - 2 - platformFeePct}%</h3>
              <p className="text-sm font-semibold text-emerald-600 mb-2">Goes to Campaign</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Directly funds safe deliveries and maternal healthcare for vulnerable women.
              </p>
            </div>
          </div>
        </section>

        {/* Calculator */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#1DB1DB]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6 text-[#1DB1DB]" />
            </div>
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">See How It Works</h2>
            <p className="text-gray-500 text-sm">Pick an amount to see exactly how your donation is split.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAMPLE_AMOUNTS.map((amount) => (
              <FeeBreakdownCard key={amount} amount={amount} platformFeePct={platformFeePct} />
            ))}
          </div>
        </section>

        {/* Example walkthrough */}
        <section className="mb-16">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8 md:p-12">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Example: 5,000 XAF Donation</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-gray-600">1</span>
                </div>
                <div>
                  <p className="font-bold text-[#1A1A2E]">You donate 5,000 XAF</p>
                  <p className="text-sm text-gray-500">via MTN MoMo or Orange Money</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-amber-600">2</span>
                </div>
                <div>
                  <p className="font-bold text-[#1A1A2E]">100 XAF goes to Campay (2%)</p>
                  <p className="text-sm text-gray-500">Covers mobile money transaction processing</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="font-bold text-[#1A1A2E]">{Math.round(5000 * platformFeePct / 100).toLocaleString()} XAF goes to platform operations ({platformFeePct}%)</p>
                  <p className="text-sm text-gray-500">Keeps the platform running, sends SMS vouchers, prevents fraud</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-emerald-600">4</span>
                </div>
                <div>
                  <p className="font-bold text-emerald-700 text-lg">{(5000 - 100 - Math.round(5000 * platformFeePct / 100)).toLocaleString()} XAF goes to the campaign ({100 - 2 - platformFeePct}%)</p>
                  <p className="text-sm text-gray-500">This is what actually funds safe deliveries and maternal healthcare</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#1DB1DB]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <HelpCircle className="w-6 h-6 text-[#1DB1DB]" />
            </div>
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Frequently Asked Questions</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className={i < FAQ_ITEMS.length - 1 ? "border-b border-gray-100" : ""}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-[#1A1A2E] pr-4">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-[#1DB1DB] to-[#178fa8] rounded-[2.5rem] p-10 md:p-14 text-white">
            <h2 className="text-3xl font-black mb-3">Ready to Make a Difference?</h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Every donation directly supports safe deliveries for vulnerable women across Cameroon.
            </p>
            <a
              href="/explore"
              className="inline-block bg-white text-[#1DB1DB] font-bold px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Explore Campaigns
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
