'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { formatXAF, getProgressPercent, normalizeCampaignResponse } from '@/lib/utils';
import { Campaign } from '@/lib/mockData';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

type Step = 'amount' | 'payment' | 'processing' | 'success';

export default function DonatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { campaigns, showToast } = useStore();
  const storeCampaign = campaigns.find(c => c.id === id);
  const [campaign, setCampaign] = useState<Campaign | null>(storeCampaign ?? null);

  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  if (!campaign) return <div className="min-h-screen flex items-center justify-center"><Link href="/explore" className="btn-primary">Back to Explore</Link></div>;

  const finalAmount = customAmount ? parseInt(customAmount) || 0 : amount;

  useEffect(() => {
    const status = searchParams?.get('status');
    if (status === 'success') {
      setStep('success');
    } else if (status === 'error') {
      setStep('payment');
      showToast('Payment failed or was cancelled. Please try again.', 'error');
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    let mounted = true;
    if (!id) return;

    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!mounted) return;
        if (data && !data.detail && data.id) {
          setCampaign(normalizeCampaignResponse(data));
        }
      })
      .catch(() => {
        // keep local state if backend is unreachable
      });

    return () => { mounted = false; };
  }, [id]);

  const handlePay = async () => {
    if (!phone || phone.length < 9) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    if (finalAmount < 100) {
      showToast('Please choose at least 100 XAF.', 'error');
      return;
    }

    setStep('processing');
    const ref = 'REF-' + Date.now();
    setReference(ref);

    try {
      const payload = {
        donor_name: anonymous ? 'Anonymous' : (name || 'Contributor'),
        amount: finalAmount,
        message,
        is_anonymous: anonymous,
        payment_method: method,
        phone_number: phone,
        success_url: `${window.location.origin}/donate/${campaign.id}?status=success`,
        failure_url: `${window.location.origin}/donate/${campaign.id}?status=error`,
      };

      const res = await fetch(`/api/campaigns/${campaign.id}/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.error || data.detail || data.message || `Donation failed: ${res.status}`;
        throw new Error(errMsg);
      }

      if (data.payment_link) {
        setPaymentLink(data.payment_link);
        window.location.href = data.payment_link;
        return;
      }

      showToast('Donation submitted. Redirecting to payment...', 'success');
      setStep('success');
    } catch (error: any) {
      setStep('payment');
      showToast(error?.message || 'Unable to process donation.', 'error');
    }
  };

  const pct = getProgressPercent(campaign.raisedXAF, campaign.goalXAF);

  if (step === 'success') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="card p-8 max-w-md w-full text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--success)', opacity: 0.15 }}>
          <CheckCircle size={40} style={{ color: 'var(--success)' }} />
        </div>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto -mt-[88px] mb-5" style={{ background: 'var(--success)' }}>
          <CheckCircle size={40} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Thank you! 🎉</h2>
        <p className="text-gray-500 text-sm mb-6">You just moved someone closer to a safe delivery.</p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold" style={{ color: 'var(--primary)' }}>{formatXAF(finalAmount)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Campaign</span><span className="font-medium text-[#1A1A2E] text-right max-w-[180px] truncate">{campaign.title}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-mono text-xs text-gray-600">{reference}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium">{method === 'mtn_momo' ? '📱 MTN MoMo' : '🟠 Orange Money'}</span></div>
        </div>
        <div className="flex flex-col gap-3">
          <Link href={`/campaign/${campaign.id}`} className="btn-primary w-full">Share this Campaign</Link>
          <Link href="/explore" className="btn-outline w-full">Explore More JoyFunds</Link>
        </div>
      </div>
    </div>
  );

  if (step === 'processing') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="card p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--primary)' }}>
          <Loader2 size={28} className="text-white animate-spin" />
        </div>
        <h3 className="font-bold text-[#1A1A2E] mb-2">Sending to JoyFund...</h3>
        <p className="text-gray-500 text-sm">Please approve the {method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'} push on your phone</p>
        <div className="mt-6 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
          📱 USSD push sent to {phone}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => step === 'payment' ? setStep('amount') : router.back()} className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700">
            <ArrowLeft size={16} /> {step === 'payment' ? 'Back' : 'Campaign'}
          </button>

          {/* Campaign preview */}
          <div className="card p-4 mb-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: campaign.coverColor }}>
              {campaign.donorAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A2E] text-sm truncate">{campaign.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="progress-bar flex-1" style={{ height: '4px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, height: '4px' }} />
                </div>
                <span className="text-xs text-gray-400">{pct}%</span>
              </div>
            </div>
          </div>

          {step === 'amount' && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-5">Choose Amount</h2>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount(''); }}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${amount === a && !customAmount ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    style={amount === a && !customAmount ? { borderColor: 'var(--primary)', background: 'var(--primary)' } : {}}
                  >
                    {formatXAF(a)}
                  </button>
                ))}
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Or enter custom amount</label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="e.g. 3000"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                />
                {customAmount && <p className="text-xs text-gray-400 mt-1">= {formatXAF(parseInt(customAmount) || 0)}</p>}
              </div>
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Your name (optional)</label>
                <input className="input-field" placeholder="Leave blank to appear as Anonymous" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Message (optional)</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Add a dedication or message for this gift"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500">
                  <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="rounded" />
                  <span>Donate anonymously</span>
                </label>
              </div>
              <button
                className="btn-primary w-full"
                disabled={finalAmount < 100}
                onClick={() => setStep('payment')}
              >
                Continue → Pay {formatXAF(finalAmount)}
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-5">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(['mtn_momo', 'orange_money'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={`p-4 rounded-2xl border-2 font-semibold text-sm transition-all text-left ${method === m ? 'text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    style={method === m ? { borderColor: m === 'mtn_momo' ? '#FFCB05' : '#FF6600', background: m === 'mtn_momo' ? '#FFCB05' : '#FF6600', color: '#1A1A2E' } : {}}
                  >
                    <div className="text-xl mb-1">{m === 'mtn_momo' ? '📱' : '🟠'}</div>
                    {m === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Mobile Number</label>
                <input
                  className="input-field"
                  placeholder={method === 'mtn_momo' ? '6XX XXX XXX' : '9XX XXX XXX'}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  type="tel"
                />
                <p className="text-xs text-gray-400 mt-1">You will receive a USSD push to approve the payment</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Donation</span><span className="font-bold" style={{ color: 'var(--primary)' }}>{formatXAF(finalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Platform fee (5%)</span><span className="text-gray-500">{formatXAF(Math.round(finalAmount * 0.05))}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="font-semibold">To healthcare fund</span><span className="font-bold" style={{ color: 'var(--success)' }}>{formatXAF(Math.round(finalAmount * 0.95))}</span></div>
              </div>
              <button className="btn-primary w-full" onClick={handlePay}>
                Confirm & Pay {formatXAF(finalAmount)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
