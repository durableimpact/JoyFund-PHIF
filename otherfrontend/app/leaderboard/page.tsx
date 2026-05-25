'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { formatXAF, eventTypeLabel, normalizeCampaignResponse } from '@/lib/utils';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const { campaigns: storeCampaigns } = useStore();
  const [campaigns, setCampaigns] = useState(storeCampaigns);
  const [loading, setLoading] = useState(storeCampaigns.length === 0);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(d => {
        const raw = Array.isArray(d) ? d : d.results || [];
        setCampaigns(raw.map(normalizeCampaignResponse));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...campaigns].sort((a, b) => b.raisedXAF - a.raisedXAF);
  const MEDAL_COLORS = ['#f59e0b', '#94a3b8', '#b45309'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white" style={{ background: '#f59e0b' }}>
              <Trophy size={26} />
            </div>
            <h1 className="text-3xl font-black text-[#1A1A2E] mb-2">JoyFund Leaderboard</h1>
            <p className="text-gray-500 text-sm">Top campaigns by funds raised — celebrating generosity</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="card h-16 animate-pulse" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 text-sm">
              <Trophy size={32} className="mx-auto mb-3 opacity-30" />
              No campaigns yet — be the first!
            </div>
          ) : (
            <>
              {/* Top 3 podium */}
              {sorted.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[sorted[1], sorted[0], sorted[2]].map((c, displayIdx) => {
                    const rank = displayIdx === 1 ? 0 : displayIdx === 0 ? 1 : 2;
                    const color = c.coverColor || '#1DB1DB';
                    const avatar = c.donorAvatar || (c.donorName || 'J').charAt(0);
                    return (
                      <Link
                        key={c.id}
                        href={`/campaign/${c.id}`}
                        className={`card p-5 text-center hover:shadow-md transition-shadow ${rank === 0 ? 'ring-2 ring-yellow-400 -mt-4' : ''}`}
                      >
                        <div className="text-2xl mb-2">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</div>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black mx-auto mb-2" style={{ background: color }}>
                          {avatar}
                        </div>
                        <p className="font-bold text-xs text-[#1A1A2E] line-clamp-2 mb-1">{(c.donorName || 'JoyFund').split(' ')[0]}</p>
                        <p className="text-xs text-gray-400">{eventTypeLabel(c.eventType || 'other')}</p>
                        <p className="font-black text-sm mt-2" style={{ color: 'var(--primary)' }}>{formatXAF(c.raisedXAF)}</p>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Full table */}
              <div className="card overflow-hidden">
                {sorted.map((c, i) => {
                  const color = c.coverColor || '#1DB1DB';
                  const avatar = c.donorAvatar || (c.donorName || 'J').charAt(0);
                  return (
                    <Link
                      key={c.id}
                      href={`/campaign/${c.id}`}
                      className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 text-center font-black text-lg flex-shrink-0" style={{ color: i < 3 ? MEDAL_COLORS[i] : '#94a3b8' }}>
                        {i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: color }}>
                        {avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1A1A2E] truncate">{c.title}</p>
                        <p className="text-xs text-gray-500">{eventTypeLabel(c.eventType || 'other')} · {c.contributors ?? 0} contributors</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm" style={{ color: 'var(--primary)' }}>{formatXAF(c.raisedXAF)}</p>
                        {c.goalDeliveries && <p className="text-xs text-gray-400">{c.goalDeliveries} deliveries goal</p>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
