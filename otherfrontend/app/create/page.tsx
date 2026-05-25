'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ArrowLeft, ArrowRight, Share2, Heart, GraduationCap, Star, Briefcase, Gift, Calendar } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';
import { formatXAF } from '@/lib/utils';

// Exact choices from Campaign.EventType model
const EVENT_TYPES = [
  { id: 'BIRTHDAY',   label: 'Birthday',    icon: <Gift size={22} />,        desc: 'Celebrate another year' },
  { id: 'WEDDING',    label: 'Wedding',     icon: <Heart size={22} />,       desc: 'Share the love' },
  { id: 'GRADUATION', label: 'Graduation',  icon: <GraduationCap size={22}/>, desc: 'Academic milestone' },
  { id: 'PROMOTION',  label: 'Job Promotion',icon: <Briefcase size={22} />, desc: 'Career achievement' },
  { id: 'MEMORIAL',   label: 'Memorial',    icon: <Star size={22} />,        desc: 'In loving memory' },
];

const COLORS = ['#1DB1DB', '#1D38DB', '#471DDB', '#1CDBC9', '#1D75DB'];

function CreateCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, addCampaign, showToast } = useStore();

  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState('BIRTHDAY');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState(120000);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [isPublic, setIsPublic] = useState(true);
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [publishedCampaign, setPublishedCampaign] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);

  const eventLabel = EVENT_TYPES.find(e => e.id === eventType)?.label || 'Celebration';
  const donorName = currentUser?.name || 'Donor';
  const donorInitials = donorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

  // Auto-generate title when event type or donor name changes
  useEffect(() => {
    if (!title) {
      setTitle(`${donorName.split(' ')[0]}'s ${eventLabel} JoyFund`);
    }
  }, [eventType, donorName]);

  const handlePublish = async () => {
    if (!currentUser) {
      try { localStorage.setItem('pending_campaign_step', JSON.stringify({ eventType, title, description, goalAmount, endDate, isPublic, coverColor })); } catch {}
      router.push(`/login?redirect=/create?draft=1`);
      return;
    }
    if (!title || !description || !goalAmount || !endDate) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setPublishing(true);
    try {
      const data = await authenticatedFetch('/api/campaigns/', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          event_type: eventType,
          goal_amount: goalAmount,
          end_date: new Date(endDate).toISOString(),
          is_public: isPublic,
          status: 'ACTIVE',
          is_active: true,
        }),
      });
      setPublishedCampaign(data);
      addCampaign({
        id: data.id,
        donorId: currentUser.id,
        donorName,
        donorAvatar: donorInitials,
        title: data.title,
        eventType: data.event_type,
        story: data.description,
        goalDeliveries: Math.round(goalAmount / 60000),
        raisedXAF: 0,
        goalXAF: Number(data.goal_amount ?? goalAmount),
        contributors: 0,
        status: 'active',
        createdAt: data.start_date || new Date().toISOString(),
        expiresAt: data.end_date || endDate,
        slug: data.slug || data.id,
        coverColor,
      });
      showToast('Your JoyFund is live!', 'success');
      setStep(5);
    } catch (e: any) {
      showToast(e?.message || 'Failed to publish campaign', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Restore draft after login redirect
  useEffect(() => {
    if (searchParams?.get('draft') !== '1' || !currentUser) return;
    try {
      const raw = localStorage.getItem('pending_campaign_step');
      if (!raw) return;
      const d = JSON.parse(raw);
      setEventType(d.eventType || 'BIRTHDAY');
      setTitle(d.title || '');
      setDescription(d.description || '');
      setGoalAmount(d.goalAmount || 120000);
      setEndDate(d.endDate || endDate);
      setIsPublic(d.isPublic ?? true);
      setCoverColor(d.coverColor || COLORS[0]);
      localStorage.removeItem('pending_campaign_step');
      setStep(4);
    } catch {}
  }, [searchParams, currentUser]);

  const steps = ['Event Type', 'Details', 'Goal', 'Preview'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">

          {step < 5 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 <= step ? 'text-white' : 'bg-gray-200 text-gray-400'}`}
                    style={i + 1 <= step ? { background: 'var(--primary)' } : {}}>
                    {i + 1 < step ? <Check size={14} /> : i + 1}
                  </div>
                  {i < steps.length - 1 && <div className="w-8 h-0.5" style={{ background: i + 1 < step ? 'var(--primary)' : '#e5e7eb' }} />}
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Event Type */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">What are you celebrating?</h2>
              <p className="text-gray-500 text-sm mb-6">Choose your milestone</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {EVENT_TYPES.map(e => (
                  <button key={e.id} onClick={() => setEventType(e.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${eventType === e.id ? 'text-white' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    style={eventType === e.id ? { borderColor: 'var(--primary)', background: 'var(--primary)' } : {}}>
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
                    <button key={c} onClick={() => setCoverColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${coverColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-400' : 'hover:scale-110'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <button className="btn-primary w-full" onClick={() => setStep(2)}>Continue <ArrowRight size={16} /></button>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">Campaign Details</h2>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Campaign Title *</label>
                <input className="input-field" placeholder={`e.g. ${donorName.split(' ')[0]}'s ${eventLabel} JoyFund`}
                  value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Story * <span className="font-normal text-gray-400">(min 50 characters)</span></label>
                <textarea className="input-field min-h-[140px] resize-none" rows={5}
                  placeholder="This year I turn 30, and instead of receiving gifts, I want to give the gift of life to vulnerable mothers in Cameroon..."
                  value={description} onChange={e => setDescription(e.target.value)} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{description.length} characters</span>
                  <span className={description.length < 50 ? 'text-amber-500' : 'text-emerald-500'}>
                    {description.length < 50 ? `${50 - description.length} more needed` : '✓ Good'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
                <label htmlFor="isPublic" className="text-sm text-gray-700">Make this campaign public (visible to everyone)</label>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
                <button className="btn-primary flex-1" onClick={() => setStep(3)} disabled={!title || description.length < 50}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Goal */}
          {step === 3 && (
            <div className="card p-6 space-y-5">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">Set Your Goal</h2>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Goal Amount (XAF) *</label>
                <input className="input-field font-mono text-lg" type="number" min={6000} step={6000}
                  placeholder="e.g. 120000" value={goalAmount} onChange={e => setGoalAmount(Number(e.target.value))} />
                <p className="text-xs text-gray-400 mt-1">
                  ≈ {Math.round(goalAmount / 60000)} safe {Math.round(goalAmount / 60000) === 1 ? 'delivery' : 'deliveries'} funded
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[60000, 120000, 300000, 600000].map(n => (
                  <button key={n} onClick={() => setGoalAmount(n)}
                    className={`p-2 rounded-xl text-xs font-bold border-2 transition-all ${goalAmount === n ? 'text-white' : 'border-gray-200 text-gray-600'}`}
                    style={goalAmount === n ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {(n/1000)}k
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Campaign End Date *</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input-field pl-9" type="date" value={endDate} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
                <button className="btn-primary flex-1" onClick={() => setStep(4)} disabled={!goalAmount || !endDate}>
                  Preview <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Preview */}
          {step === 4 && !publishedCampaign && (
            <div className="card p-6">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-4">Preview</h2>
              <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5">
                <div className="h-8" style={{ background: coverColor }} />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: coverColor }}>
                      {donorInitials}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1A1A2E]">{title}</p>
                      <p className="text-xs text-gray-500">{eventLabel} · Goal: {formatXAF(goalAmount)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3">{description}</p>
                  <p className="text-xs text-gray-400 mt-2">Ends: {new Date(endDate).toLocaleDateString('fr-CM', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
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

          {/* Step 5 — Success */}
          {step === 5 && publishedCampaign && (
            <div className="card p-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: 'var(--success)' }}>
                <Check size={28} />
              </div>
              <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Your JoyFund is Live!</h2>
              <p className="text-gray-500 text-sm mb-5">Share it to start collecting gifts that fund safe deliveries.</p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium truncate ml-4">{publishedCampaign.title}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Goal</span><span className="font-medium">{formatXAF(Number(publishedCampaign.goal_amount))}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium capitalize">{publishedCampaign.status}</span></div>
              </div>
              <div className="flex flex-col gap-3">
                <button className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={() => { navigator.clipboard.writeText(`https://joyfund.cm/campaign/${publishedCampaign.id}`); showToast('Link copied!', 'success'); }}>
                  <Share2 size={16} /> Copy Campaign Link
                </button>
                <button className="btn-secondary w-full" onClick={() => router.push('/dashboard')}>Go to My Dashboard</button>
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
