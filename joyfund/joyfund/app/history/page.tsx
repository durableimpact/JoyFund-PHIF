'use client';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { formatXAF, formatDate, statusColor, statusLabel } from '@/lib/utils';
import Link from 'next/link';
import { Download } from 'lucide-react';

export default function DonorHistory() {
  const { campaigns, currentUser } = useStore();
  const myId = currentUser?.id || 'donor-001';
  const myCampaigns = campaigns.filter(c => c.donorId === myId);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="section-title text-2xl">Donation History</h1>
          <p className="section-sub">All your past and active JoyFund campaigns</p>
          <div className="space-y-4">
            {myCampaigns.map(c => (
              <div key={c.id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold" style={{ background: c.coverColor }}>{c.donorAvatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1A1A2E] truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(c.createdAt)} · {c.contributors} contributors</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{formatXAF(c.raisedXAF)}</div>
                    <div className="text-xs text-gray-400">of {formatXAF(c.goalXAF)}</div>
                  </div>
                  <span className={`badge ${statusColor(c.status)}`}>{statusLabel(c.status)}</span>
                  {c.status === 'completed' && (
                    <button className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
                      <Download size={12} /> Certificate
                    </button>
                  )}
                </div>
              </div>
            ))}
            {myCampaigns.length === 0 && (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="font-bold mb-2">No campaigns yet</h3>
                <Link href="/create" className="btn-primary mt-4 inline-flex">Start a JoyFund</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
