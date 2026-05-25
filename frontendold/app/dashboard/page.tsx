'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, TrendingUp, Users, Heart, Bell, History } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import CampaignCard from '@/components/shared/CampaignCard';
import { useStore } from '@/store/useStore';
import { formatXAF, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

export default function DonorDashboard() {
  const router = useRouter();
  const { currentUser, showToast } = useStore();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login?redirect=/dashboard');
      return;
    }
    Promise.allSettled([
      authenticatedFetch('/api/campaigns/'),
      authenticatedFetch('/api/campaigns/donations/my-donations/'),
      authenticatedFetch('/api/accounts/donor/info/'),
    ]).then(([cRes, dRes, pRes]) => {
      if (cRes.status === 'fulfilled') {
        const all = Array.isArray(cRes.value) ? cRes.value : cRes.value.results || [];
        // filter to only this donor's campaigns
        const donorId = currentUser?.id;
        setCampaigns(all.filter((c: any) => c.donor === donorId || c.donor_id === donorId || c.created_by === donorId));
      }
      if (dRes.status === 'fulfilled') {
        setDonations(Array.isArray(dRes.value) ? dRes.value : dRes.value.results || []);
      }
      if (pRes.status === 'fulfilled') setProfile(pRes.value);
    }).catch(() => showToast('Failed to load some dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const donorName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : currentUser?.name || 'Donor';

  const totalRaised = campaigns.reduce((s, c) => s + Number(c.current_amount ?? c.raisedXAF ?? 0), 0);
  const totalContributors = campaigns.reduce((s, c) => s + (c.contributors_count ?? c.contributors ?? 0), 0);
  const totalDonated = donations.reduce((s, d) => s + Number(d.amount ?? d.amountXAF ?? 0), 0);

  const stats = [
    { label: 'Total Raised', value: formatXAF(totalRaised), icon: TrendingUp, color: 'var(--primary)' },
    { label: 'My Campaigns', value: campaigns.length, icon: Heart, color: 'var(--secondary)' },
    { label: 'Contributors', value: totalContributors, icon: Users, color: 'var(--success)' },
    { label: 'I\'ve Donated', value: formatXAF(totalDonated), icon: Heart, color: '#471DDB' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Welcome back</p>
              <h1 className="text-2xl font-black text-[#1A1A2E]">{donorName.split(' ')[0]}&apos;s Dashboard</h1>
            </div>
            <Link href="/create" className="btn-primary text-sm gap-2">
              <Plus size={16} /> New JoyFund
            </Link>
          </div>

          {/* Notification banner */}
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm" style={{ background: 'linear-gradient(135deg, #1DB1DB15, #1CDBC915)', border: '1px solid #1DB1DB30' }}>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            <span className="text-gray-700">Your generosity funds safe deliveries for vulnerable mothers across Cameroon.</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <div key={s.label} className="card p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + '15' }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <div className="text-xl font-black" style={{ color: s.color }}>
                  {loading ? <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" /> : s.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* My Campaigns */}
            <div className="md:col-span-2">
              <h2 className="section-title text-xl mb-1">My JoyFunds</h2>
              <p className="section-sub">Your active and past campaigns</p>
              {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => <div key={i} className="card h-48 animate-pulse bg-gray-50" />)}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="card p-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Heart size={20} className="text-gray-400" />
                  </div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2">No campaigns yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Turn your next celebration into impact for Cameroonian mothers.</p>
                  <Link href="/create" className="btn-primary">Start a JoyFund</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {campaigns.map(c => (
                    <CampaignCard key={c.id} campaign={{
                      ...c,
                      raisedXAF: Number(c.current_amount ?? c.raisedXAF ?? 0),
                      goalXAF: Number(c.goal_amount ?? c.goalXAF ?? 0),
                      donorName: c.donor_name || donorName,
                      eventType: c.event_type || c.eventType,
                      coverColor: c.cover_color || c.coverColor || 'var(--primary)',
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="section-title text-xl">Recent Donations</h2>
                <Link href="/history" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                  <History size={12} /> All
                </Link>
              </div>
              <p className="section-sub">Gifts you&apos;ve made</p>
              <div className="card p-4 space-y-3">
                {loading ? (
                  [1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)
                ) : donations.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <p>No donations yet</p>
                    <Link href="/explore" className="text-xs font-semibold mt-1 block" style={{ color: 'var(--primary)' }}>Explore campaigns</Link>
                  </div>
                ) : donations.slice(0, 5).map(d => (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
                      <Heart size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {d.campaign_title || `Campaign #${(d.campaign || '').toString().slice(-4)}`}
                      </p>
                      <p className="text-xs text-gray-400">{d.created_at ? formatDate(d.created_at) : '—'}</p>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--primary)' }}>
                      {formatXAF(Number(d.amount ?? d.amountXAF ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
