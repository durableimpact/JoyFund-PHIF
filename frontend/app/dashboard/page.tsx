'use client';
import Link from 'next/link';
import { Plus, TrendingUp, Users, Heart, Bell } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import CampaignCard from '@/components/shared/CampaignCard';
import { useStore } from '@/store/useStore';
import { formatXAF } from '@/lib/utils';
import { contributions as allContribs } from '@/lib/mockData';

export default function DonorDashboard() {
  const { campaigns, currentUser } = useStore();
  const donorName = currentUser?.name || 'Jean-Pierre Mbarga';
  const donorId = currentUser?.id || 'donor-001';
  const myCampaigns = campaigns.filter(c => c.donorId === donorId);
  const totalRaised = myCampaigns.reduce((s, c) => s + c.raisedXAF, 0);
  const myContribs = allContribs.filter(c => myCampaigns.some(m => m.id === c.campaignId)).slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Welcome back 👋</p>
              <h1 className="text-2xl font-black text-[#1A1A2E]">{donorName.split(' ')[0]}&apos;s Dashboard</h1>
            </div>
            <Link href="/create" className="btn-primary text-sm gap-2">
              <Plus size={16} /> New JoyFund
            </Link>
          </div>

          {/* Notification banner */}
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 text-sm" style={{ background: 'linear-gradient(135deg, #1DB1DB15, #1CDBC915)', border: '1px solid #1DB1DB30' }}>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            <span className="text-gray-700">Your gift is now being used - <strong>Mama Celestine</strong> checked in at Hôpital de District de Biyem-Assi 🏥</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Raised', value: formatXAF(totalRaised), icon: TrendingUp, color: 'var(--primary)' },
              { label: 'My Campaigns', value: myCampaigns.length, icon: Heart, color: 'var(--secondary)' },
              { label: 'Contributors', value: myCampaigns.reduce((s, c) => s + c.contributors, 0), icon: Users, color: 'var(--success)' },
              { label: 'Lives Impacted', value: myCampaigns.filter(c => c.status === 'completed').length * 2 + 1, icon: Heart, color: '#471DDB' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + '15' }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* My Campaigns */}
            <div className="md:col-span-2">
              <h2 className="section-title text-xl mb-1">My JoyFunds</h2>
              <p className="section-sub">Your active and past campaigns</p>
              {myCampaigns.length === 0 ? (
                <div className="card p-10 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2">No campaigns yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Create your first JoyFund and turn your celebration into impact.</p>
                  <Link href="/create" className="btn-primary">Start a JoyFund</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {myCampaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div>
              <h2 className="section-title text-xl mb-1">Live Activity</h2>
              <p className="section-sub">Recent contributions</p>
              <div className="card p-4 space-y-3">
                {myContribs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No contributions yet</p>
                ) : myContribs.map(c => (
                  <div key={c.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {c.anonymous ? '?' : c.contributorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A2E] truncate">{c.anonymous ? 'Anonymous' : c.contributorName}</p>
                      <p className="text-xs text-gray-400">{c.paymentMethod === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--primary)' }}>{formatXAF(c.amountXAF)}</span>
                  </div>
                ))}
              </div>

              {/* Matched beneficiary */}
              <div className="card p-4 mt-4" style={{ border: '1px solid #1DB1DB30' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--primary)' }}>Matched Beneficiary</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg">👩</div>
                  <div>
                    <p className="font-bold text-sm text-[#1A1A2E]">Mama Celestine O.</p>
                    <p className="text-xs text-gray-500">BEN-0056 · Week 28</p>
                    <span className="badge bg-cyan-100 text-cyan-700 text-xs mt-1">Voucher Issued</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
