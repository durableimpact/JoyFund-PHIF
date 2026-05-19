 'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { generateId } from '@/lib/utils';
import type { Campaign } from '@/store/useStore';

const EVENT_TYPES = [
  { id: 'birthday', label: 'Birthday', icon: '🎂', desc: 'Celebrate another year' },
  { id: 'wedding', label: 'Wedding', icon: '💍', desc: 'Share the love' },
  { id: 'graduation', label: 'Graduation', icon: '🎓', desc: 'Academic milestone' },
  { id: 'promotion', label: 'Promotion', icon: '🚀', desc: 'Career achievement' },
  { id: 'other', label: 'Other', icon: '🎉', desc: 'Any celebration' },
];

const COLORS = ['#1DB1DB', '#1D38DB', '#471DDB', '#1CDBC9', '#1D75DB'];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { currentUser, addCampaign, showToast } = useStore();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState('birthday');
  const [story, setStory] = useState('');
  const [goalDeliveries, setGoalDeliveries] = useState(2);
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [campaignId, setCampaignId] = useState('');

  const donorName = currentUser?.name || 'Jean-Pierre Mbarga';
  const donorInitials = donorName.split(' ').map(n => n[0]).join('').slice(0, 2);
  const eventLabel = EVENT_TYPES.find(e => e.id === eventType)?.label || 'Celebration';
  const slug = donorName.split(' ')[0] + eventLabel;
  const goalXAF = goalDeliveries * 60000;

  const handlePublish = () => {
    // If not authenticated, save draft and redirect to login preserving intent
    if (!currentUser) {
      const draft = { eventType, story, goalDeliveries, coverColor };
      try {
        localStorage.setItem('pending_campaign', JSON.stringify(draft));
      } catch {}
      const redirectTo = encodeURIComponent('/create?publishDraft=1');
      window.location.href = `/login?redirect=${redirectTo}`;
      return;
    }

    const id = generateId('camp');
    setCampaignId(id);
    const campaign: Campaign = {
      id,
      donorId: currentUser?.id || 'donor-001',
      donorName,
      donorAvatar: donorInitials,
      title: `${donorName.split(' ')[0]}'s ${eventLabel} JoyFund`,
      eventType: eventType as Campaign['eventType'],
      story,
      goalDeliveries,
      raisedXAF: 0,
      goalXAF,
      contributors: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      slug,
      coverColor,
    };
    addCampaign(campaign);
    showToast('Your JoyFund is live! 🎉', 'success');
    setStep(4);
  };

  // Auto-publish a pending draft after returning from login
  useEffect(() => {
    const publishDraft = searchParams?.get('publishDraft');
    if (publishDraft !== '1') return;
    try {
      const raw = localStorage.getItem('pending_campaign');
      if (!raw) return;
      const draft = JSON.parse(raw);
      // ensure we have a logged-in user
      if (!currentUser) return;

      const id = generateId('camp');
      setCampaignId(id);
      const campaign: Campaign = {
        id,
        donorId: currentUser?.id || 'donor-001',
        donorName: currentUser?.name || donorName,
        donorAvatar: donorInitials,
        title: `${(currentUser?.name || donorName).split(' ')[0]}'s ${EVENT_TYPES.find(e=>e.id===draft.eventType)?.label || 'Celebration'} JoyFund`,
        eventType: draft.eventType,
        story: draft.story,
        goalDeliveries: draft.goalDeliveries,
        raisedXAF: 0,
        goalXAF: draft.goalDeliveries * 60000,
        contributors: 0,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        slug: (currentUser?.name || donorName).split(' ')[0] + (EVENT_TYPES.find(e=>e.id===draft.eventType)?.label || ''),
        coverColor: draft.coverColor,
      };
      addCampaign(campaign);
      showToast('Your JoyFund is live! 🎉', 'success');
      localStorage.removeItem('pending_campaign');
      setStep(4);
    } catch (e) {
      // ignore parse errors
    }
  }, [searchParams, currentUser, addCampaign, showToast]);

  const steps = ['Event Type', 'Your Story', 'Impact Goal', 'Preview & Publish'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Progress steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 < step ? 'text-white' : i + 1 === step ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                  style={i + 1 <= step ? { background: 'var(--primary)' } : {}}>
                  {i + 1 < step ? <Check size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i + 1 < step ? '' : 'bg-gray-200'}`} style={i + 1 < step ? { background: 'var(--primary)' } : {}} />}
              </div>
            ))}
          </div>

          {/* Step 1 — Event Type */}
          {step === 1 && (
            <div className="card p-6 animate-fade-up">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">What are you celebrating?</h2>
              <p className="text-gray-500 text-sm mb-6">Choose your milestone type</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {EVENT_TYPES.map(e => (
                  <button
                    key={e.id}
                    onClick={() => setEventType(e.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${eventType === e.id ? 'text-white' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    style={eventType === e.id ? { borderColor: 'var(--primary)', background: 'var(--primary)' } : {}}
                  >
                    <div className="text-2xl mb-2">{e.icon}</div>
                    <div className={`font-bold text-sm ${eventType === e.id ? 'text-white' : 'text-[#1A1A2E]'}`}>{e.label}</div>
                    <div className={`text-xs mt-0.5 ${eventType === e.id ? 'text-white/80' : 'text-gray-500'}`}>{e.desc}</div>
                  </button>
                ))}
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Campaign Color</label>
                <div className="flex gap-3">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setCoverColor(c)} className={`w-8 h-8 rounded-full transition-transform ${coverColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-400' : 'hover:scale-110'}`} style={{ background: c }} />
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
                <span className={story.length < 50 ? 'text-amber-500' : 'text-emerald-500'}>{story.length < 50 ? `${50 - story.length} more needed` : '✓ Good length'}</span>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
                <button className="btn-primary flex-1" onClick={() => setStep(3)} disabled={story.length < 50}>Continue <ArrowRight size={16} /></button>
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
                type="range"
                min={1} max={10}
                value={goalDeliveries}
                onChange={e => setGoalDeliveries(Number(e.target.value))}
                className="w-full mb-6 accent-[#1DB1DB]"
              />
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[1, 2, 5, 10].map(n => (
                  <button key={n} onClick={() => setGoalDeliveries(n)} className={`p-2 rounded-xl text-sm font-bold border-2 transition-all ${goalDeliveries === n ? 'text-white' : 'border-gray-200 text-gray-600'}`} style={goalDeliveries === n ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
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

          {/* Step 4 — Preview / Published */}
          {step === 4 && (
            <div className="animate-fade-up space-y-5">
              {campaignId ? (
                <div className="card p-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl" style={{ background: 'var(--success)' }}>🎉</div>
                  <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Your JoyFund is Live!</h2>
                  <p className="text-gray-500 text-sm mb-5">Share it with your network to start collecting gifts.</p>
                  <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                    <p className="text-xs text-gray-400 mb-1">Your campaign link</p>
                    <p className="font-bold text-[#1A1A2E]">joyfund.cm/{slug}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => { showToast('Shared to WhatsApp! 📲', 'success'); }}>
                      📲 Share on WhatsApp
                    </button>
                    <button className="btn-outline w-full flex items-center justify-center gap-2" onClick={() => { navigator.clipboard.writeText(`https://joyfund.cm/${slug}`); showToast('Link copied!', 'info'); }}>
                      <Share2 size={16} /> Copy Link
                    </button>
                    <button className="btn-secondary w-full" onClick={() => router.push('/dashboard')}>
                      Go to My Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <div className="card p-6 animate-fade-up">
                  <h2 className="font-bold text-xl text-[#1A1A2E] mb-4">Preview your JoyFund</h2>
                  {/* Mini preview card */}
                  <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5">
                    <div className="h-8" style={{ background: coverColor }} />
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: coverColor }}>{donorInitials}</div>
                        <div>
                          <p className="font-bold text-sm text-[#1A1A2E]">{donorName.split(' ')[0]}&apos;s {eventLabel} JoyFund</p>
                          <p className="text-xs text-gray-500">Goal: {goalDeliveries} safe deliveries · {(goalDeliveries * 60000).toLocaleString()} XAF</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3">{story}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="btn-outline flex-1" onClick={() => setStep(3)}><ArrowLeft size={16} /> Edit</button>
                    <button className="btn-secondary flex-1" onClick={handlePublish}>Publish JoyFund 🚀</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
