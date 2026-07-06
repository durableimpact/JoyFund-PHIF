'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { Check, ArrowLeft, ArrowRight, Share2, Heart, GraduationCap, Star, Briefcase, Gift, Calendar, Loader2, ImagePlus, X, Phone } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/shared/Navbar';
import { formatXAF } from '@/lib/utils';
import { createCampaign, donateToCampaign } from '@/actions/campaigns';
import { useForm } from 'react-hook-form';
import { useI18n } from '@/locales/client';

// Exact choices from Campaign.EventType model
const EVENT_TYPES = [
  { id: 'BIRTHDAY',   label: 'Birthday',    icon: Gift,        desc: 'Celebrate another year' },
  { id: 'WEDDING',    label: 'Wedding',     icon: Heart,       desc: 'Share the love' },
  { id: 'GRADUATION', label: 'Graduation',  icon: GraduationCap, desc: 'Academic milestone' },
  { id: 'PROMOTION',  label: 'Job Promotion',icon: Briefcase, desc: 'Career achievement' },
  { id: 'MEMORIAL',   label: 'Memorial',    icon: Star,        desc: 'In loving memory' },
];

const COLORS = ['#1DB1DB', '#1D38DB', '#471DDB', '#1CDBC9', '#1D75DB'];

function CreateCampaignContent() {
  const t = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventTypeT = (id: string) => ({
    BIRTHDAY: t('donor.campaigns.create.eventType.birthday'),
    WEDDING: t('donor.campaigns.create.eventType.wedding'),
    GRADUATION: t('donor.campaigns.create.eventType.graduation'),
    PROMOTION: t('donor.campaigns.create.eventType.promotion'),
    MEMORIAL: t('donor.campaigns.create.eventType.memorial'),
  }[id] || id);
  const eventTypeDescT = (id: string) => ({
    BIRTHDAY: t('donor.campaigns.create.eventType.birthdayDesc'),
    WEDDING: t('donor.campaigns.create.eventType.weddingDesc'),
    GRADUATION: t('donor.campaigns.create.eventType.graduationDesc'),
    PROMOTION: t('donor.campaigns.create.eventType.promotionDesc'),
    MEMORIAL: t('donor.campaigns.create.eventType.memorialDesc'),
  }[id] || '');

  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState('BIRTHDAY');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState(120000);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [isPublic, setIsPublic] = useState(true);
  const [coverColor, setCoverColor] = useState(COLORS[0]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [publishedCampaign, setPublishedCampaign] = useState<any>(null);
  
  // Donation state
  const [donationAmount, setDonationAmount] = useState(() => Math.round(120000 * 0.1));
  const [paymentMethod, setPaymentMethod] = useState('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [campaignCreatedForDonation, setCampaignCreatedForDonation] = useState<any>(null);

  const eventLabel = eventTypeT(eventType) || t('donor.campaigns.create.celebration');
  const userName = session?.user?.name || t('donor.campaigns.create.donorFallback');
  const userInitials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

  // Mutation for creating campaign (used at step 5 before donation)
  const createCampaignForDonationMutation = useMutation({
    mutationFn: async () => {
      const token = (session as any)?.accessToken || session?.user?.accessToken;
      if (!token) throw new Error('No access token');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('event_type', eventType);
      formData.append('goal_amount', goalAmount.toString());
      formData.append('end_date', new Date(endDate).toISOString());
      formData.append('is_public', isPublic.toString());
      formData.append('status', 'ACTIVE');
      formData.append('is_active', 'true');
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      return await createCampaign(token, formData);
    },
    onSuccess: (data) => {
      setCampaignCreatedForDonation(data);
    },
    onError: (error: any) => {
      try {
        const errorData = JSON.parse(error);
        alert(errorData?.error || t('donor.campaigns.create.createFailed'));
      } catch {
        alert(error?.message || t('donor.campaigns.create.createFailed'));
      }
    },
  });

  // Mutation for initial donation to the created campaign
  const donateMutation = useMutation({
    mutationFn: async () => {
      if (!campaignCreatedForDonation?.id) {
        throw new Error('Campaign not created yet');
      }
      
      const payload = {
        donor_name: userName,
        amount: donationAmount,
        message: donationMessage || undefined,
        is_anonymous: false,
        payment_method: paymentMethod,
        phone_number: phoneNumber.replace(/\s/g, ''),
        success_url: `${window.location.origin}/dashboard/donor/campaigns/create?donate_success=1&campaign=${campaignCreatedForDonation.id}`,
        failure_url: `${window.location.origin}/dashboard/donor/campaigns/create?donate_failed=1`,
      };
      
      return await donateToCampaign(campaignCreatedForDonation.id, payload);
    },
    onSuccess: (response) => {
      if (response?.payment_link) {
        // Store campaign info in localStorage before redirecting
        localStorage.setItem('campaign_donation_info', JSON.stringify({
          campaignId: campaignCreatedForDonation.id,
          campaignData: campaignCreatedForDonation
        }));
        // Redirect to payment
        window.location.href = response.payment_link;
      }
    },
    onError: (error: any) => {
      try {
        const errorData = JSON.parse(error);
        alert(errorData?.error || t('donor.campaigns.create.paymentInitFailed'));
      } catch {
        alert(error?.message || t('donor.campaigns.create.paymentInitFailed'));
      }
    },
  });

  // Mutation for final campaign publication (after payment)
  const publishCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!campaignCreatedForDonation?.id) {
        throw new Error('Campaign not found');
      }
      // The campaign is already published when created
      // This is just to trigger success screen
      setPublishedCampaign(campaignCreatedForDonation);
      return campaignCreatedForDonation;
    },
    onSuccess: (data) => {
      setPublishedCampaign(data);
      setStep(6);
    },
  });

  // Update donation amount when goal amount changes
  useEffect(() => {
    const minDonation = Math.round(goalAmount * 0.1);
    setDonationAmount(minDonation);
  }, [goalAmount]);

  // Auto-generate title when event type or user name changes
  useEffect(() => {
    if (!title) {
      setTitle(`${userName.split(' ')[0]}'s ${eventLabel} JoyFund`);
    }
  }, [eventType, userName]);

  // Restore draft after login redirect
  useEffect(() => {
    if (searchParams?.get('draft') !== '1' || !session?.user) return;
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
  }, [searchParams, session?.user]);

  // Handle payment success - show success screen
  useEffect(() => {
    if (searchParams?.get('donate_success') !== '1') return;
    try {
      const raw = localStorage.getItem('campaign_donation_info');
      if (!raw) {
        // Campaign already in state
        if (campaignCreatedForDonation) {
          setPublishedCampaign(campaignCreatedForDonation);
          setStep(6);
        }
        return;
      }
      const data = JSON.parse(raw);
      setPublishedCampaign(data.campaignData);
      localStorage.removeItem('campaign_donation_info');
      setStep(6);
    } catch (err) {
      console.error('Error handling payment success:', err);
      if (campaignCreatedForDonation) {
        setPublishedCampaign(campaignCreatedForDonation);
        setStep(6);
      }
    }
  }, [searchParams, campaignCreatedForDonation]);

  // Auto-create campaign when entering step 5 (donation step)
  useEffect(() => {
    if (step === 5 && !campaignCreatedForDonation && !createCampaignForDonationMutation.isPending) {
      createCampaignForDonationMutation.mutate();
    }
  }, [step, campaignCreatedForDonation]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = () => {
    if (!session?.user) {
      try { localStorage.setItem('pending_campaign_step', JSON.stringify({ eventType, title, description, goalAmount, endDate, isPublic, coverColor })); } catch {}
      router.push(`/login?redirect=/dashboard/donor/campaigns/create?draft=1`);
      return;
    }
    if (!title || !description || !goalAmount || !endDate) {
      alert(t('donor.campaigns.create.fillRequired'));
      return;
    }
    setStep(5);
  };

  const steps = [
    t('donor.campaigns.create.step.eventType'),
    t('donor.campaigns.create.step.details'),
    t('donor.campaigns.create.step.goal'),
    t('donor.campaigns.create.step.preview'),
    t('donor.campaigns.create.step.donate'),
  ];

  return (
    <div className="h-full" style={{ background: 'var(--background)' }}>
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {step < 5 && (
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center justify-center gap-2 flex-1 mr-10">
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
            </div>
          )}

          {/* Step 1 — Event Type */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">{t('donor.campaigns.create.whatCelebrating')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('donor.campaigns.create.chooseMilestone')}</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {EVENT_TYPES.map(e => {
                  const Icon = e.icon;
                  return (
                    <button key={e.id} onClick={() => setEventType(e.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${eventType === e.id ? 'text-white' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      style={eventType === e.id ? { borderColor: 'var(--primary)', background: 'var(--primary)' } : {}}>
                      <div className={`mb-2 ${eventType === e.id ? 'text-white' : 'text-gray-500'}`}><Icon size={22} /></div>
                      <div className={`font-bold text-sm ${eventType === e.id ? 'text-white' : 'text-[#1A1A2E]'}`}>{eventTypeT(e.id)}</div>
                      <div className={`text-xs mt-0.5 ${eventType === e.id ? 'text-white/80' : 'text-gray-500'}`}>{eventTypeDescT(e.id)}</div>
                    </button>
                  );
                })}
              </div>
              <div className="mb-6">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">{t('donor.campaigns.create.campaignColour')}</label>
                <div className="flex gap-3">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setCoverColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${coverColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-400' : 'hover:scale-110'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => setStep(2)}>
                {t('donor.campaigns.create.continue')}
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">{t('donor.campaigns.create.campaignDetails')}</h2>
              
              {/* Cover Image */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">{t('donor.campaigns.create.campaignCoverImage')}</label>
                <div className="relative">
                  {coverImagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 h-40 bg-gray-100">
                      <Image
                        src={coverImagePreview}
                        alt={t('donor.campaigns.create.campaignCoverAlt')}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-[#1DB1DB] transition-colors"
                    >
                      <ImagePlus size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">{t('donor.campaigns.create.clickToUploadCover')}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('donor.campaigns.create.uploadHint')}</p>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('donor.campaigns.create.campaignTitle')}</label>
                <input className="input-field" placeholder={t('donor.campaigns.create.titlePlaceholder', { name: userName.split(' ')[0], event: eventLabel })}
                  value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('donor.campaigns.create.yourStory')} <span className="font-normal text-gray-400">{t('donor.campaigns.create.minChars')}</span></label>
                <textarea className="input-field min-h-35 resize-none" rows={5}
                  placeholder={t('donor.campaigns.create.storyPlaceholder')}
                  value={description} onChange={e => setDescription(e.target.value)} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{description.length} {t('donor.campaigns.create.characters')}</span>
                  <span className={description.length < 50 ? 'text-amber-500' : 'text-emerald-500'}>
                    {description.length < 50 ? t('donor.campaigns.create.moreNeeded', { count: 50 - description.length }) : t('donor.campaigns.create.good')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPublic" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
                <label htmlFor="isPublic" className="text-sm text-gray-700">{t('donor.campaigns.create.makePublic')}</label>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1 flex items-center justify-center gap-2" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> {t('general.back')}
                </button>
                <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => setStep(3)} disabled={!title || description.length < 50}>
                  {t('donor.campaigns.create.continue')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Goal */}
          {step === 3 && (
            <div className="card p-6 space-y-5">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">{t('donor.campaigns.create.setGoal')}</h2>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('donor.campaigns.create.goalAmount')}</label>
                <input className="input-field font-mono text-lg" type="number" min={6000} step={6000}
                  placeholder={t('donor.campaigns.create.goalPlaceholder')} value={goalAmount} onChange={e => setGoalAmount(Number(e.target.value))} />
                <p className="text-xs text-gray-400 mt-1">
                  {Math.round(goalAmount / 60000) === 1
                    ? t('donor.campaigns.create.deliveryFunded', { count: Math.round(goalAmount / 60000) })
                    : t('donor.campaigns.create.deliveriesFunded', { count: Math.round(goalAmount / 60000) })}
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
                <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('donor.campaigns.create.campaignEndDate')}</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="input-field pl-9" type="date" value={endDate} min={new Date().toISOString().split('T')[0]}
                    onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1 flex items-center justify-center gap-2" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} /> {t('general.back')}
                </button>
                <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={() => setStep(4)} disabled={!goalAmount || !endDate}>
                  {t('donor.campaigns.create.preview')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Preview */}
          {step === 4 && !publishedCampaign && (
            <div className="card p-6">
              <h2 className="font-bold text-xl text-[#1A1A2E] mb-4">{t('donor.campaigns.create.preview')}</h2>
              <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5">
                <div className="h-8" style={{ background: coverColor }} />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: coverColor }}>
                      {userInitials}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1A1A2E]">{title}</p>
                      <p className="text-xs text-gray-500">{eventLabel} · {t('campaign.goal', { amount: formatXAF(goalAmount) })}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-3">{description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {t('donor.campaigns.create.ends')}{' '}
                    {new Date(endDate).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-outline flex-1 flex items-center justify-center gap-2" onClick={() => setStep(3)}>
                  <ArrowLeft size={16} /> {t('general.edit')}
                </button>
                <button
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  onClick={handlePublish}
                >
                  {t('donor.campaigns.create.continueToDonate')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — Donate */}
          {step === 5 && !publishedCampaign && (
            <div className="card p-6 space-y-5">
              {!campaignCreatedForDonation ? (
                // Loading state - creating campaign
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  <h2 className="font-bold text-xl text-[#1A1A2E]">{t('donor.campaigns.create.creatingJoyFund')}</h2>
                  <p className="text-gray-500 text-sm">{t('donor.campaigns.create.settingUpCampaign')}</p>
                </div>
              ) : (
                // Donation form
                <>
                  <h2 className="font-bold text-xl text-[#1A1A2E] mb-1">{t('donor.campaigns.create.makeInitialDonation')}</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <p className="text-sm text-blue-900">
                      <strong>{t('donor.campaigns.create.initialDonationHintStrong')}</strong>{' '}{t('donor.campaigns.create.initialDonationHintRest')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('donor.campaigns.create.donationAmount')}</label>
                    <div className="text-xs text-gray-400 mb-2">{t('donor.campaigns.create.minimumAmount', { amount: formatXAF(Math.round(goalAmount * 0.1)) })}</div>
                    <input 
                      className="input-field font-mono text-lg" 
                      type="number" 
                      min={Math.round(goalAmount * 0.1)} 
                      step={1000}
                      placeholder={formatXAF(donationAmount)} 
                      value={donationAmount} 
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const minAmount = Math.round(goalAmount * 0.1);
                        if (val >= minAmount) {
                          setDonationAmount(val);
                        }
                      }} 
                    />
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      {Math.round(donationAmount / 60000) === 1
                        ? t('donor.campaigns.create.donationDeliveryFunded', { count: Math.round(donationAmount / 60000 * 10) / 10 })
                        : t('donor.campaigns.create.donationDeliveriesFunded', { count: Math.round(donationAmount / 60000 * 10) / 10 })}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block">{t('donor.campaigns.create.paymentMethod')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'MTN', label: t('donor.campaigns.create.mtnMobileMoney'), color: '#FFC107' },
                        { id: 'ORANGE', label: t('donor.campaigns.create.orangeMoney'), color: '#FF5A00' }
                      ].map(pm => (
                        <button 
                          key={pm.id} 
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === pm.id ? 'text-white' : 'border-gray-200 bg-white'}`}
                          style={paymentMethod === pm.id ? { background: pm.color, borderColor: pm.color } : {}}>
                          <div className={`font-bold text-sm ${paymentMethod === pm.id ? 'text-white' : 'text-gray-900'}`}>{pm.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('donor.campaigns.create.mobileMoneyNumber')}</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        className="input-field pl-9" 
                        type="tel"
                        placeholder={paymentMethod === 'MTN' ? t('donor.campaigns.create.mtnPhonePlaceholder') : t('donor.campaigns.create.orangePhonePlaceholder')}
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value)} 
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t('donor.campaigns.create.paymentPromptHint')}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{t('donor.campaigns.create.messageOptional')}</label>
                    <textarea 
                      className="input-field min-h-20 resize-none" 
                      rows={3}
                      placeholder={t('donor.campaigns.create.messagePlaceholder')}
                      value={donationMessage} 
                      onChange={e => setDonationMessage(e.target.value)} 
                    />
                  </div>

                  <div className="flex gap-3">
                    <button className="btn-outline flex-1 flex items-center justify-center gap-2" onClick={() => setStep(4)}>
                      <ArrowLeft size={16} /> {t('general.back')}
                    </button>
                    <button
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                      onClick={() => donateMutation.mutate()}
                      disabled={donateMutation.isPending || !phoneNumber || !donationAmount}
                    >
                      {donateMutation.isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {t('donor.campaigns.create.initiatingPayment')}
                        </>
                      ) : (
                        <>
                          {t('donor.campaigns.create.donateAmount', { amount: formatXAF(donationAmount) })}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 6 — Success */}
          {step === 6 && publishedCampaign && (
            <div className="card p-6 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white"
                style={{ background: 'var(--success)' }}
              >
                <Check size={28} />
              </div>
              <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">{t('donor.campaigns.create.joyFundIsLive')}</h2>
              <p className="text-gray-500 text-sm mb-5">{t('donor.campaigns.create.shareToCollect')}</p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('donor.campaigns.create.titleLabel')}</span>
                  <span className="font-medium truncate ml-4">{publishedCampaign.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('donor.campaigns.create.goalLabel')}</span>
                  <span className="font-medium">{formatXAF(Number(publishedCampaign.goal_amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('donor.campaigns.create.statusLabel')}</span>
                  <span className="font-medium capitalize">{publishedCampaign.status}</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `https://joy-fund.com/campaign/${publishedCampaign.id}`
                    );
                    alert(t('donor.campaigns.create.linkCopied'));
                  }}
                >
                  <Share2 size={16} /> {t('donor.campaigns.create.copyCampaignLink')}
                </button>
                <button
                  className="btn-secondary w-full"
                  onClick={() =>
                    router.push(
                      `/dashboard/donor/campaigns/${publishedCampaign.id}`
                    )
                  }
                >
                  {t('donor.campaigns.create.viewCampaign')}
                </button>
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
