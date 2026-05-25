'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, ArrowRight, Share2, Heart, GraduationCap, Star, Briefcase, Gift } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';

const EVENT_TYPES = [
  { id: 'birthday', label: 'Birthday', icon: <Gift size={22} />, desc: 'Celebrate another year' },
  { id: 'wedding', label: 'Wedding', icon: <Heart size={22} />, desc: 'Share the love' },
  { id: 'graduation', label: 'Graduation', icon: <GraduationCap size={22} />, desc: 'Academic milestone' },
  { id: 'promotion', label: 'Promotion', icon: <Briefcase size={22} />, desc: 'Career achievement' },
  { id: 'other', label: 'Other', icon: <Star size={22} />, desc: 'Any celebration' },
];

const COLORS = ['#1DB1DB', '#1D38DB', '#471DDB', '#1CDBC9', '#1D75DB'];

function CreateCampaignContent() {
  const router = useRouter();
  const { currentUser, addCampaign, showToast } = useStore();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState('birthday');
  const [story, setStory] = useState('');
  const [goalDeliveries, setGoalDeliveries] = useState(2);
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [publishedCampaign, setPublishedCampaign] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);

  const donorName = currentUser?.name || 'Jean-Pierre Mbarga';
  const donorInitials = donorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);
  const eventLabel = EVENT_TYPES.find(e => e.id === eventType)?.label || 'Celebration';
  const goalXAF = goalDeliveries * 60000;

  const handlePublish = async () => {
    if (!currentUser) {
      const draft = { eventType, story, goalDeliveries, coverColor };
      try { localStorage.setItem('pending_campaign', JSON.stringify(draft)); } catch {}
      window.location.href = `/login?redirect=${encodeURIComponent('/create?publishDraft=1')}`;
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        title: `${donorName.split(' ')[0]}'s ${eventLabel} JoyFund`,
        event_type: eventType,
        story,
        goal_deliveries: goalDeliveries,
        goal_amount: goalXAF,
        cover_color: coverColor,
      };
      const data = await authenticatedFetch('/api/campaigns/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Also add to local store for instant display
      addCampaign({
        id: data.id,
        donorId: currentUser.id,
        donorName,
        donorAvatar: donorInitials,
        title: data.title,
        eventType: data.event_type || eventType,
        story: data.story || story,
        goalDeliveries: data.goal_deliveries || goalDeliveries,
        raisedXAF: 0,
        goalXAF: Number(data.goal_amount ?? goalXAF),
        contributors: 0,
        status: 'active',
        createdAt: data.created_at || new Date().toISOString().split('T')[0],
        expiresAt: data.expires_at || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        slug: data.slug || `${donorName.split(' ')[0]}${eventLabel}`,
        coverColor,
      });
      setPublishedCampaign(data);
      showToast('Your JoyFund is live!', 'success');
      setStep(5);
    } catch (e: any) {
      showToast(e?.message || 'Failed to publish campaign', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Auto-publish pending draft after login redirect
  useEffect(() => {
    if (searchParams?.get('publishDraft') !== '1' || !currentUser) return;
    try {
      const raw = localStorage.getItem('pending_campaign');
      if (!raw) return;
      const draft = JSON.parse(raw);
      setEventType(draft.eventType);
      setStory(draft.story);
      setGoalDeliveries(draft.goalDeliveries);
      setCoverColor(draft.coverColor);
      localStorage.removeItem('pending_campaign');
      setStep(4);
    } catch {}
  }, [searchParams, currentUser]);

  const steps = ['Event Type', 'Your Story', 'Impact Goal', 'Preview'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">

          {/* Progress */}
          {step < 5 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 <= step ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                    style={i + 1 <= step ? { background: 'var(--primary)' } : {}}
                  >
                    {i + 1 < step ? <Check size={14} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-8 h-0.5" style={{ background: i + 1 < step ? 'var(--primary)' : '#e5e7eb' }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Event Type */}
          {step === 1 && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">What are you celebrating?</h2>
              <p className="text-gray-500 text-sm mb-6">Choose your milestone type</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {EVENT_TYPES.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setEventType(e.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${eventType === e.id ? 'text-white' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    style={eventType === e.id ? { borderColor: 'var(--primary)', background: 'var(--primary)' } : {}}
                  >
                    <div className={`mb-2 ${eventType === e.id ? 'text-white' : 'text-gray-500'}`}>{e.icon}</div>
                    <div className={`font-bold text-sm ${eventType === e.id ? 'text-white' : 'text-[#1A1A2E]'}`}>{e.label}</div>
                    <div className={`text-xs mt-0.5 ${eventType === e.id ? 'text-white/80' : 'text-gray-500'}`}>{e.desc}</div>
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Campaign Colour</label>
                <div className="flex gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCoverColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${coverColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-400' : 'hover:scale-110'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
              <button className="btn-primary w-full" onClick={() => setStep(2)}>
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2 — Story */}
          {step === 2 && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">Tell your story</h2>
              <p className="text-gray-500 text-sm mb-6">Help contributors understand why this matters to you (min. 50 characters)</p>
              <textarea
                className="input-field min-h-[180px] resize-none mb-2"
                placeholder="This year I turn 30, and instead of receiving gifts, I want to give the gift of life..."
                value={story}
                onChange={e => setStory(e.target.value)}
              />
              <div className="flex justify-between mb-6 text-xs text-gray-400">
                <span>{story.length} characters</span>
                <span className={story.length < 50 ? 'text-amber-500' : 'text-emerald-500'}>
                  {story.length < 50 ? `${50 - story.length} more needed` : '✓ Good length'}
                </span>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
                <button className="btn-primary flex-1" onClick={() => setStep(3)} disabled={story.length < 50}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Impact Goal */}
          {step === 3 && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">Set your impact goal</h2>
              <p className="text-gray-500 text-sm mb-6">How many safe deliveries do you want to fund?</p>
              <div className="text-center mb-6">
                <div className="text-7xl font-black mb-2" style={{ color: 'var(--primary)' }}>{goalDeliveries}</div>
                <div className="text-gray-500 text-sm">Safe Deliveries</div>
                <div className="text-xs text-gray-400 mt-1">≈ {(goalDeliveries * 60000).toLocaleString()} XAF needed</div>
              </div>
              <input
                type="range" min={1} max={10}
                value={goalDeliveries}
                onChange={e => setGoalDeliveries(Number(e.target.value))}
                className="w-full mb-6 accent-[#1DB1DB]"
              />
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[1, 2, 5, 10].map(n => (
                  <button key={n} onClick={() => setGoalDeliveries(n)}
                    className={`p-2 rounded-xl text-sm font-bold border-2 transition-all ${goalDeliveries === n ? 'text-white' : 'border-gray-200 text-gray-600'}`}
                    style={goalDeliveries === n ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
                <button className="btn-primary flex-1" onClick={() => setStep(4)}>Preview <ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {/* Step 4 — Preview */}
          {step === 4 && !publishedCampaign && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-4">Preview your JoyFund</h2>
              <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5">
                <div className="h-8" style={{ background: coverColor }} />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: coverColor }}>
                      {donorInitials}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1A1A2E]">
                        {donorName.split(' ')[0]}&apos;s {eventLabel} JoyFund
                      </p>
                      <p className="text-xs text-gray-500">
                        Goal: {goalDeliveries} safe {goalDeliveries === 1 ? 'delivery' : 'deliveries'} · {goalXAF.toLocaleString()} XAF
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3">{story}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep(3)}><ArrowLeft size={16} /> Edit</button>
                <button className="btn-secondary flex-1" onClick={handlePublish} disabled={publishing}>
                  {publishing ? 'Publishing…' : 'Publish JoyFund'}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Published */}
          {step === 5 && publishedCampaign && (
            <div className="animate-fade-up space-y-5">
              <div className="card p-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: 'var(--success)' }}>
                  <Check size={28} />
                </div>
                <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Your JoyFund is Live!</h2>
                <p className="text-gray-500 text-sm mb-5">Share it with your network to start collecting gifts that fund safe deliveries.</p>
                <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                  <p className="text-xs text-gray-400 mb-1">Campaign link</p>
                  <p className="font-bold text-[#1A1A2E]">
                    joyfund.cm/campaign/{publishedCampaign.id}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      const url = `https://wa.me/?text=${encodeURIComponent(`I just launched my JoyFund — help me fund safe deliveries for vulnerable mothers in Cameroon! https://joyfund.cm/campaign/${publishedCampaign.id}`)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Share on WhatsApp
                  </button>
                  <button
                    className="btn-outline w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://joyfund.cm/campaign/${publishedCampaign.id}`);
                      showToast('Link copied!', 'info');
                    }}
                  >
                    <Share2 size={16} /> Copy Link
                  </button>
                  <button className="btn-secondary w-full" onClick={() => router.push('/dashboard')}>
                    Go to My Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" /></div>}>
      <CreateCampaignContent />
    </Suspense>
  );
}
