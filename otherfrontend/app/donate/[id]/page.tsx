'use client';
import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Heart, Phone, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { formatXAF, normalizeCampaignResponse } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const PAYMENT_METHODS = [
  { id: 'MTN', label: 'MTN Mobile Money', color: '#FFC107', prefix: '67, 65, 68' },
  { id: 'ORANGE', label: 'Orange Money', color: '#FF5A00', prefix: '69, 65' },
];

const AMOUNTS = [5000, 10000, 25000, 50000, 100000];

function DonatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, campaigns, addContribution, showToast } = useStore();

  const [campaign, setCampaign] = useState<any>(campaigns.find(c => c.id === id));
  const [loading, setLoading] = useState(!campaign);

  const [donorName, setDonorName] = useState(currentUser?.name || '');
  const [amount, setAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  useEffect(() => {
    if (!id || campaign) return;
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => { if (d?.id) setCampaign(normalizeCampaignResponse(d)); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const finalAmount = useCustom ? Number(customAmount) : amount;

  const handleDonate = async () => {
    if (!currentUser) {
      router.push(`/login?redirect=/donate/${id}`);
      return;
    }
    if (!donorName || !finalAmount || finalAmount < 1000) {
      showToast('Please enter your name and a valid amount (min 1,000 XAF)', 'error');
      return;
    }
    if (!phoneNumber || phoneNumber.length < 9) {
      showToast('Please enter your mobile money phone number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const origin = window.location.origin;
      const data = await authenticatedFetch(`/api/campaigns/${id}/donate/`, {
        method: 'POST',
        body: JSON.stringify({
          donor_name: isAnonymous ? 'Anonymous' : donorName,
          amount: finalAmount,
          message: message || '',
          is_anonymous: isAnonymous,
          payment_method: paymentMethod,
          phone_number: phoneNumber.replace(/\s/g, ''),
          success_url: `${origin}/donate/${id}?status=success`,
          failure_url: `${origin}/donate/${id}?status=failed`,
        }),
      });

      setPaymentRef(data?.payment?.payment_reference || data?.id || '');
      setSuccess(true);

      addContribution({
        id: data?.id || String(Date.now()),
        campaignId: id,
        amountXAF: finalAmount,
        donorName: isAnonymous ? 'Anonymous' : donorName,
      });
      showToast('Payment initiated! Check your phone for the MoMo prompt.', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Payment failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle redirect back from payment gateway
  const status = searchParams?.get('status');
  useEffect(() => {
    if (status === 'success') { setSuccess(true); showToast('Payment completed successfully!', 'success'); }
    if (status === 'failed') { showToast('Payment was not completed. Please try again.', 'error'); }
  }, [status]);

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-32 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#1DB1DB]" />
      </div>
    </div>
  );

  if (!campaign && !loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center card p-10 max-w-sm">
        <p className="text-gray-500 mb-4">Campaign not found</p>
        <button onClick={() => router.push('/explore')} className="btn-primary">Explore Campaigns</button>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-md mx-auto">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm mb-2">Your payment is being processed.</p>
          <p className="text-gray-500 text-sm mb-6">
            Check your phone for the <strong>{paymentMethod === 'MTN' ? 'MTN MoMo' : 'Orange Money'}</strong> prompt to complete the donation.
          </p>
          {paymentRef && (
            <div className="bg-gray-50 rounded-xl p-3 mb-5 text-xs font-mono text-gray-500">
              Reference: {paymentRef}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button className="btn-primary w-full" onClick={() => router.push(`/campaign/${id}`)}>Back to Campaign</button>
            <button className="btn-outline w-full" onClick={() => router.push('/explore')}>Explore More</button>
          </div>
        </div>
      </div>
    </div>
  );

  const color = campaign?.coverColor || '#1DB1DB';

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700">
            <ArrowLeft size={16} /> Back
          </button>

          {/* Campaign summary */}
          {campaign && (
            <div className="card p-4 flex items-center gap-3 mb-5" style={{ borderLeft: `4px solid ${color}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: color }}>
                <Heart size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#1A1A2E] truncate">{campaign.title}</p>
                <p className="text-xs text-gray-500">
                  {formatXAF(campaign.raisedXAF || Number(campaign.current_amount || 0))} raised of {formatXAF(campaign.goalXAF || Number(campaign.goal_amount || 0))}
                </p>
              </div>
            </div>
          )}

          <div className="card p-6 space-y-5">
            <h1 className="text-xl font-black text-[#1A1A2E]">Make a Donation</h1>

            {/* Donor name */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Name *</label>
              <input className="input-field" placeholder="e.g. Jean-Pierre Mbarga" value={donorName}
                onChange={e => setDonorName(e.target.value)} disabled={isAnonymous} />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="anon" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                <label htmlFor="anon" className="text-xs text-gray-500">Donate anonymously</label>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Amount (XAF) *</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => { setAmount(a); setUseCustom(false); }}
                    className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${!useCustom && amount === a ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    style={!useCustom && amount === a ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {(a/1000)}k
                  </button>
                ))}
                <button onClick={() => setUseCustom(true)}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${useCustom ? 'text-white' : 'border-gray-200 text-gray-700'}`}
                  style={useCustom ? { background: 'var(--secondary)', borderColor: 'var(--secondary)' } : {}}>
                  Custom
                </button>
              </div>
              {useCustom && (
                <input className="input-field" type="number" min={1000} step={1000}
                  placeholder="Enter amount in XAF (min 1,000)"
                  value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
              )}
              {finalAmount > 0 && (
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  = {Math.round(finalAmount / 60000 * 10) / 10} safe {Math.round(finalAmount / 60000) === 1 ? 'delivery' : 'deliveries'} funded
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Message <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea className="input-field resize-none" rows={2}
                placeholder="Wishing you all the best on your special day!"
                value={message} onChange={e => setMessage(e.target.value)} />
            </div>

            {/* Payment method */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">Payment Method *</label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(pm => (
                  <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === pm.id ? 'text-white' : 'border-gray-200 bg-white'}`}
                    style={paymentMethod === pm.id ? { background: pm.color, borderColor: pm.color } : {}}>
                    <div className={`font-bold text-sm ${paymentMethod === pm.id ? 'text-white' : 'text-gray-900'}`}>{pm.label}</div>
                    <div className={`text-xs mt-0.5 ${paymentMethod === pm.id ? 'text-white/80' : 'text-gray-500'}`}>Prefixes: {pm.prefix}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone number */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Mobile Money Number *</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field pl-9" type="tel"
                  placeholder={paymentMethod === 'MTN' ? '+237 6XX XXX XXX (MTN)' : '+237 69X XXX XXX (Orange)'}
                  value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
              </div>
              <p className="text-xs text-gray-400 mt-1">You will receive a payment prompt on this number.</p>
            </div>

            <button className="btn-primary w-full text-sm py-3 flex items-center justify-center gap-2"
              onClick={handleDonate} disabled={submitting || !finalAmount}>
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Initiating Payment…</> : `Donate ${formatXAF(finalAmount || 0)}`}
            </button>

            <p className="text-center text-xs text-gray-400">
              95% goes directly to healthcare. Secured by CamPay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonatePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" /></div>}>
      <DonatePage />
    </Suspense>
  );
}
