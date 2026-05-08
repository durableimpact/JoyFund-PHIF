'use client';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { formatXAF, eventTypeLabel } from '@/lib/utils';
import Link from 'next/link';

export default function LeaderboardPage() {
  const { campaigns } = useStore();
  const sorted = [...campaigns].sort((a, b) => b.raisedXAF - a.raisedXAF);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-[#1A1A2E] mb-2">🏆 JoyFund Leaderboard</h1>
            <p className="text-gray-500 text-sm">Top campaigns by funds raised — celebrating generosity</p>
          </div>

          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {sorted.slice(0, 3).map((c, i) => (
              <div key={c.id} className={`card p-5 text-center ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`} style={{ order: i === 0 ? 1 : i === 1 ? 0 : 2 }}>
                <div className="text-3xl mb-2">{medals[i]}</div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black mx-auto mb-2" style={{ background: c.coverColor }}>
                  {c.donorAvatar}
                </div>
                <p className="font-bold text-xs text-[#1A1A2E] line-clamp-2 mb-1">{c.donorName.split(' ')[0]}</p>
                <p className="text-xs text-gray-400">{eventTypeLabel(c.eventType)}</p>
                <p className="font-black text-sm mt-2" style={{ color: 'var(--primary)' }}>{formatXAF(c.raisedXAF)}</p>
              </div>
            ))}
          </div>

          {/* Full table */}
          <div className="card overflow-hidden">
            {sorted.map((c, i) => (
              <Link
                key={c.id}
                href={`/campaign/${c.id}`}
                className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 text-center font-black text-lg flex-shrink-0" style={{ color: i < 3 ? '#f59e0b' : '#94a3b8' }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: c.coverColor }}>
                  {c.donorAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#1A1A2E] truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{eventTypeLabel(c.eventType)} · {c.contributors} contributors</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-sm" style={{ color: 'var(--primary)' }}>{formatXAF(c.raisedXAF)}</p>
                  <p className="text-xs text-gray-400">{c.goalDeliveries} deliveries goal</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
