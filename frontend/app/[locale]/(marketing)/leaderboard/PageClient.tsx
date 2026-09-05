'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, ExternalLink, Loader2, User, ArrowUpDown } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { getCampaignLeaderboard } from '@/actions/campaigns';
import { useI18n } from '@/locales/client';

export default function LeaderboardPage() {
  const router = useRouter();
  const t = useI18n();
  const [ordering, setOrdering] = useState<string>('raised');

  const {
    data: leaderboardResponse,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['campaign-leaderboard', ordering],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getCampaignLeaderboard({ page: pageParam, page_size: 20, ordering });
      return res;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const page = lastPage?.json || lastPage;
      if (page?.next) {
        const url = new URL(page.next, 'http://localhost');
        return parseInt(url.searchParams.get('page') || '2');
      }
      return undefined;
    },
  });

  const leaderboard =
    leaderboardResponse?.pages.flatMap((page) => {
      const results = (page as any)?.json?.results || (page as any)?.results || [];
      return results;
    }) || [];

  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const sentinelRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting && hasNextPage) {
              fetchNextPage();
            }
          },
          { threshold: 0.1 }
        );
        observerRef.current.observe(node);
      }
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getDonorName = (campaign: CampaignLeaderboardEntry) => {
    return campaign.donor?.user?.first_name || 'Anonymous';
  };

  const totalRaised = leaderboard.length > 0
    ? leaderboard.reduce((sum: number, c: any) => sum + (parseFloat(c?.total_net_raised as string) || 0), 0)
    : 0;

  const avgProgress = leaderboard.length > 0
    ? (leaderboard.reduce((sum: number, c: any) => sum + (c?.progress_percentage ?? 0), 0) / leaderboard.length).toFixed(1)
    : '0';

  const handleDonorClick = (e: React.MouseEvent, campaign: CampaignLeaderboardEntry) => {
    e.stopPropagation();
    if (campaign.donor?.id) {
      router.push(`/donor/${campaign.donor.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative">
        {/* Hero */}
        <div className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-5xl px-4 pt-32 pb-14 text-center">
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1DB1DB] to-[#0D8EBA] shadow-sm">
              <Trophy className="size-7 text-white" />
            </div>
            <h1 className="mb-3 font-heading text-4xl font-bold tracking-tight text-[#0F172A]">
              {t('leaderboard.title')}
            </h1>
            <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#1DB1DB]" />
            <p className="mx-auto max-w-2xl text-balance text-base leading-relaxed text-[#475569]">
              {t('leaderboard.subtitle')}
            </p>
            <p className="mt-2 text-sm font-medium text-[#1DB1DB]">
              {t('leaderboard.joinMovement')}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-12">
          {/* Stats Overview — Loading */}
          {isLoading && (
            <div className="mb-10 grid grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl bg-white p-6 ring-1 ring-[#E2E8F0]">
                  <div className="mb-2 h-8 w-24 rounded bg-[#E2E8F0]" />
                  <div className="h-4 w-32 rounded bg-[#F1F5F9]" />
                </div>
              ))}
            </div>
          )}

          {/* Stats Overview — Loaded */}
          {!isLoading && !error && (
            <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-6 text-center ring-1 ring-[#E2E8F0]">
                <p className="font-heading text-3xl font-bold text-[#1DB1DB]">
                  {leaderboard.length}
                </p>
                <p className="mt-1 text-sm text-[#64748B]">{t('leaderboard.activeCampaigns')}</p>
              </div>
              <div className="rounded-xl bg-white p-6 text-center ring-1 ring-[#E2E8F0]">
                <p className="font-heading text-3xl font-bold text-[#0F172A]">
                  XAF {totalRaised.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-sm text-[#64748B]">{t('leaderboard.totalRaised')}</p>
              </div>
              {leaderboard.length > 0 && (
                <div className="rounded-xl bg-white p-6 text-center ring-1 ring-[#E2E8F0]">
                  <p className="inline-flex items-center gap-1.5 font-heading text-3xl font-bold text-[#1DB1DB]">
                    <TrendingUp className="size-7" />
                    {avgProgress}%
                  </p>
                  <p className="mt-1 text-sm text-[#64748B]">{t('leaderboard.avgProgress')}</p>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-10 rounded-xl border-l-4 border-l-red-500 bg-white p-6 ring-1 ring-[#E2E8F0]">
              <p className="font-semibold text-red-600">{t('leaderboard.errorTitle')}</p>
              <p className="mt-1 text-sm text-[#64748B]">{t('leaderboard.errorHint')}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!leaderboard || leaderboard.length === 0) && (
            <div className="rounded-xl bg-white px-4 py-16 text-center ring-1 ring-[#E2E8F0]">
              <Trophy className="mx-auto mb-4 size-12 text-[#CBD5E1]" />
              <p className="mb-1 text-lg font-semibold text-[#475569]">{t('leaderboard.noCampaigns')}</p>
              <p className="text-sm text-[#94A3B8]">{t('leaderboard.noCampaignsHint')}</p>
            </div>
          )}

          {/* Table Area */}
          {!isLoading && !error && leaderboard && leaderboard.length > 0 && (
            <>
              {/* Sort Controls */}
              <div className="mb-4 flex items-center gap-2">
                <ArrowUpDown className="size-3.5 text-[#94A3B8]" />
                <span className="text-xs font-medium text-[#64748B]">{t('leaderboard.sortBy')}</span>
                {[
                  { value: 'raised', label: t('leaderboard.mostRaised') },
                  { value: 'goal', label: t('leaderboard.goalLowHigh') },
                  { value: '-goal', label: t('leaderboard.goalHighLow') },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setOrdering(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      ordering === opt.value
                        ? 'bg-[#1DB1DB] text-white shadow-sm'
                        : 'bg-white text-[#64748B] ring-1 ring-[#E2E8F0] hover:ring-[#1DB1DB]/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl bg-white ring-1 ring-[#E2E8F0]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="w-14 px-4 py-3.5 text-center font-heading text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                        {t('leaderboard.rank')}
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                        {t('leaderboard.campaign')}
                      </th>
                      <th className="px-4 py-3.5 text-right font-heading text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                        {t('leaderboard.goal')}
                      </th>
                      <th className="px-4 py-3.5 text-right font-heading text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                        {t('leaderboard.raised')}
                      </th>
                      <th className="px-4 py-3.5 text-center font-heading text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                        {t('leaderboard.progress')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((campaign: any, index: number) => {
                      const rank = index + 1;
                      const progress = campaign?.progress_percentage ?? 0;
                      const medal = getMedalIcon(rank);
                      const goalAmount = parseFloat(campaign?.goal_amount as string) || 0;
                      const raisedAmount = parseFloat(campaign?.total_net_raised as string) || 0;

                      return (
                        <tr
                          key={campaign?.id ?? index}
                          className="cursor-pointer border-b border-[#E2E8F0] transition-colors last:border-0 hover:bg-[#F0FDFA]"
                          onClick={() => router.push(`/campaign/${campaign?.id}`)}
                        >
                          {/* Rank */}
                          <td className="px-4 py-4 text-center">
                            {medal ? (
                              <span className="text-2xl">{medal}</span>
                            ) : (
                              <span className="font-heading text-sm font-semibold text-[#94A3B8]">
                                #{rank}
                              </span>
                            )}
                          </td>

                          {/* Campaign */}
                          <td className="px-4 py-4">
                            <p className="flex items-center gap-2 font-medium text-[#0F172A] transition-colors group-hover:text-[#1DB1DB]">
                              {campaign?.title ?? t('leaderboard.untitled')}
                              <ExternalLink className="size-3.5 text-[#94A3B8] opacity-0 transition-opacity group-hover:opacity-100" />
                            </p>
                            <button
                              onClick={(e) => handleDonorClick(e, campaign)}
                              className="mt-0.5 inline-flex items-center gap-1 text-xs text-[#94A3B8] transition-colors hover:text-[#1DB1DB]"
                            >
                              <User className="size-3" />
                              by {getDonorName(campaign)}
                            </button>
                          </td>

                          {/* Goal */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-medium text-[#64748B]">
                              XAF {goalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                          </td>

                          {/* Raised */}
                          <td className="px-4 py-4 text-right">
                            <span className="font-heading text-base font-bold text-[#1DB1DB]">
                              XAF {raisedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                          </td>

                          {/* Progress */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F5F9]">
                                <div
                                  className="h-full rounded-full bg-[#1DB1DB] transition-all duration-500"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-sm font-semibold text-[#475569]">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Infinite scroll sentinel */}
                {hasNextPage && (
                  <div ref={sentinelRef} className="flex justify-center border-t border-[#E2E8F0] py-5">
                    {isFetchingNextPage && (
                      <Loader2 className="size-5 animate-spin text-[#1DB1DB]" />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
