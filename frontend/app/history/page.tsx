'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowUpRight, Clock } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel, formatDate } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

export default function HistoryPage() {
  const router = useRouter();
  const { currentUser, showToast } = useStore();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login?redirect=/history');
      return;
    }
    authenticatedFetch('/api/campaigns/donations/my-donations/')
      .then(d => setDonations(Array.isArray(d) ? d : d.results || []))
      .catch(() => showToast('Failed to load donation history', 'error'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const totalGiven = donations.reduce((s, d) => s + Number(d.amount ?? d.amountXAF ?? 0), 0);
  const deliveriesFunded = Math.floor(totalGiven / 60000);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#1A1A2E]">My Donation History</h1>
            <p className="text-gray-500 mt-1">Every contribution you&apos;ve made to fund safe deliveries</p>
          </div>

          {/* Impact summary */}
          {!loading && donations.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Given', value: formatXAF(totalGiven), color: 'var(--primary)' },
                { label: 'Deliveries Funded', value: deliveriesFunded, color: 'var(--secondary)' },
                { label: 'Campaigns Supported', value: new Set(donations.map(d => d.campaign || d.campaign_id)).size, color: 'var(--success)' },
              ].map(s => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Donation list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="card p-12 text-center">
              <Heart size={36} className="mx-auto mb-3 text-gray-300" />
              <h3 className="font-bold text-gray-700 mb-2">No donations yet</h3>
              <p className="text-gray-500 text-sm mb-5">
                Your generosity can fund safe deliveries for vulnerable women in Cameroon.
              </p>
              <Link href="/explore" className="btn-primary inline-flex">
                Explore Campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map(d => (
                <div key={d.id} className="card p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--primary)' }}>
                    <Heart size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {d.campaign_title || d.campaign_name || `Campaign #${(d.campaign || d.campaign_id || '').toString().slice(-6)}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <Clock size={11} />
                      {d.created_at ? formatDate(d.created_at) : '—'}
                      {d.donor_name && <span>· {d.donor_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-black text-sm" style={{ color: 'var(--primary)' }}>
                        {formatXAF(Number(d.amount ?? d.amountXAF ?? 0))}
                      </p>
                      <span className={`badge text-xs ${statusColor(d.status || 'completed')}`}>
                        {statusLabel(d.status || 'completed')}
                      </span>
                    </div>
                    {(d.campaign || d.campaign_id) && (
                      <Link href={`/campaign/${d.campaign || d.campaign_id}`} className="text-gray-400 hover:text-gray-600">
                        <ArrowUpRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
