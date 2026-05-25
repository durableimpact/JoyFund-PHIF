'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Share2, ArrowLeft, CheckCircle, Heart } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { formatXAF, getProgressPercent, eventTypeLabel, formatDate, normalizeCampaignResponse } from '@/lib/utils';

type Campaign = {
  id: string;
  title: string;
  slug?: string;
  coverColor?: string;
  donorAvatar?: string;
  donorName?: string;
  eventType?: string;
  createdAt?: string;
  raisedXAF: number;
  goalXAF: number;
  contributors?: number;
  goalDeliveries?: number;
  story?: string;
};

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { campaigns, contributions } = useStore();
  const initialCampaign = campaigns.find(c => c.id === id);
  const [campaign, setCampaign] = useState<Campaign | undefined>(initialCampaign);
  const [loading, setLoading] = useState(!initialCampaign);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.detail && data.id) setCampaign(normalizeCampaignResponse(data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-32 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading campaign…</p>
        </div>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="text-center card p-10 max-w-sm">
        <Heart size={40} className="mx-auto mb-4 text-gray-300" />
        <h2 className="font-bold text-xl mb-3">Campaign not found</h2>
        <Link href="/explore" className="btn-primary">Back to Explore</Link>
      </div>
    </div>
  );

  const color = campaign.coverColor || '#1DB1DB';
  const pct = getProgressPercent(campaign.raisedXAF, campaign.goalXAF);
  const campContribs = contributions.filter(c => c.campaignId === id).slice(0, 6);
  const avatar = campaign.donorAvatar || (campaign.donorName || 'J').charAt(0);
  const donorName = campaign.donorName || 'JoyFund';
  const createdAt = campaign.createdAt || '';

  const handleCopy = () => {
    const url = `https://joyfund.cm/campaign/${campaign.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-20 pb-16">
        {/* Hero banner */}
        <div className="h-48 relative" style={{ background: `linear-gradient(135deg, ${color}, #1A1A2E)` }}>
          <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent" />
          <div className="absolute bottom-4 left-4">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-white/80 text-sm hover:text-white">
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main */}
            <div className="md:col-span-2 space-y-5">
              <div className="card p-6">
                {/* Donor info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: color }}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1A2E]">{donorName}</p>
                    <p className="text-xs text-gray-500">
                      {eventTypeLabel(campaign.eventType || 'other')}
                      {createdAt ? ` · ${formatDate(createdAt)}` : ''}
                    </p>
                  </div>
                </div>

                <h1 className="text-2xl font-black text-[#1A1A2E] mb-4">{campaign.title}</h1>

                {/* Progress */}
                <div className="mb-5">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-lg" style={{ color: 'var(--primary)' }}>{formatXAF(campaign.raisedXAF)}</span>
                    <span className="text-gray-400 text-sm">of {formatXAF(campaign.goalXAF)}</span>
                  </div>
                  <div className="progress-bar mb-2" style={{ height: '12px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, height: '12px' }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500"><strong className="text-[#1A1A2E]">{campaign.contributors ?? 0}</strong> contributors</span>
                    {campaign.goalDeliveries && (
                      <span className="font-semibold" style={{ color: 'var(--secondary)' }}>{campaign.goalDeliveries} deliveries goal</span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed text-sm">{campaign.story}</p>
              </div>

              {/* Recent contributors */}
              <div className="card p-6">
                <h3 className="font-bold text-[#1A1A2E] mb-4 flex items-center gap-2">
                  <Users size={18} style={{ color: 'var(--primary)' }} /> Recent Contributors
                </h3>
                {campContribs.length === 0 ? (
                  <p className="text-gray-500 text-sm">Be the first to contribute!</p>
                ) : (
                  <div className="space-y-3">
                    {campContribs.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            {(c.donorName || 'A').charAt(0)}
                          </div>
                          <p className="text-sm font-medium text-[#1A1A2E]">{c.donorName || 'Anonymous'}</p>
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{formatXAF(c.amountXAF)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="card p-6 text-center sticky top-24">
                <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                  <Heart size={22} className="text-pink-500" />
                </div>
                <h3 className="font-bold text-[#1A1A2E] mb-2">Give a Gift</h3>
                <p className="text-xs text-gray-500 mb-5">Every contribution funds a safe delivery for a vulnerable mother.</p>
                <Link href={`/donate/${campaign.id}`} className="btn-primary w-full mb-3 text-sm">
                  Donate Now
                </Link>
                <button onClick={handleCopy} className="btn-outline w-full text-sm flex items-center justify-center gap-2">
                  {copied ? <><CheckCircle size={16} className="text-green-500" /> Copied!</> : <><Share2 size={16} /> Share Campaign</>}
                </button>
                {campaign.slug && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500">
                    <p className="font-medium text-gray-700 mb-1">joyfund.cm/{campaign.slug}</p>
                    <p>95% of donations go directly to healthcare</p>
                  </div>
                )}
              </div>

              {/* Impact card */}
              <div className="card p-5" style={{ background: 'linear-gradient(135deg, #1D38DB08, #1DB1DB10)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--primary)' }}>Your Impact</p>
                <div className="space-y-2 text-sm">
                  {[
                    ['6,000 XAF', 'Antenatal visit'],
                    ['45,000 XAF', 'Normal delivery'],
                    ['120,000 XAF', 'C-section + care'],
                  ].map(([amt, label]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-600">{amt}</span>
                      <span className="text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
