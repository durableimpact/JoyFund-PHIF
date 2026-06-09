'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Trophy, TrendingUp, ExternalLink, Loader2, User } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { Helmet } from 'react-helmet-async';
import { getCampaignLeaderboard } from '@/actions/campaigns';
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from '@/components/ui/table';

export default function LeaderboardPage() {
  const router = useRouter();

  const {
    data: leaderboardResponse,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['campaign-leaderboard'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getCampaignLeaderboard({ page: pageParam, page_size: 20 });
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
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getDonorName = (campaign: CampaignLeaderboardEntry) => {
    return campaign.donor.user.first_name || 'Anonymous';
  };

  const handleDonorClick = (e: React.MouseEvent, campaign: CampaignLeaderboardEntry) => {
    e.stopPropagation();
    router.push(`/donor/${campaign.donor.id}`);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Helmet>
        <title>Campaign Leaderboard - Top JoyFund Campaigns</title>
        <meta name="description" content="See the top-performing JoyFund campaigns making the biggest impact on maternal healthcare in Cameroon." />
        <link rel="canonical" href="https://joy-fund.com/leaderboard" />
        <meta property="og:title" content="JoyFund Campaign Leaderboard" />
        <meta property="og:description" content="Celebrating the campaigns making the biggest impact on maternal healthcare in Cameroon." />
        <meta property="og:url" content="https://joy-fund.com/leaderboard" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joy-fund.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "JoyFund Campaign Leaderboard",
          url: "https://joy-fund.com/leaderboard",
          description: "Top-performing JoyFund campaigns making the biggest impact on maternal healthcare."
        })}</script>
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Trophy size={32} className="text-yellow-500" />
              <h1 className="text-4xl font-black" style={{ color: '#1A1A2E' }}>
                Campaign Leaderboard
              </h1>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              Celebrating the campaigns making the biggest impact on maternal healthcare. <br />
              <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                Join the movement and start your own JoyFund today.
              </span>
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            <div className="card p-6 text-center">
              <div className="text-3xl font-black mb-1" style={{ color: 'var(--primary)' }}>
                {leaderboard?.length ?? 0}
              </div>
              <div className="text-sm text-gray-600">Active Campaigns</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-black mb-1" style={{ color: 'var(--secondary)' }}>
                {leaderboard && leaderboard.length > 0
                  ? `XAF ${leaderboard.reduce((sum: number, c: any) => sum + (parseFloat(c?.total_net_raised as string) || 0), 0).toLocaleString()}`
                  : 'XAF 0'}
              </div>
              <div className="text-sm text-gray-600">Total Raised</div>
            </div>
            {leaderboard && leaderboard.length > 0 && (
              <div className="card p-6 text-center">
                <div className="text-3xl font-black mb-1 flex items-center justify-center gap-1">
                  <TrendingUp size={28} style={{ color: 'var(--primary)' }} />
                  <span style={{ color: 'var(--primary)' }}>
                    {(
                      leaderboard.reduce((sum: number, c: any) => sum + (c?.progress_percentage ?? 0), 0) /
                      leaderboard.length
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="text-sm text-gray-600">Avg. Progress</div>
              </div>
            )}
          </div>

          {/* Loading State - Skeleton Loader */}
          {isLoading && (
            <div className="space-y-4">
              {/* Stats Skeleton */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-6">
                    <div className="h-10 bg-gray-200 rounded mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Table Skeleton */}
              <div className="card overflow-hidden">
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <div className="grid grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="grid grid-cols-5 gap-4">
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="card p-8 border-l-4" style={{ borderLeftColor: '#EF4444' }}>
              <p className="text-red-600 font-semibold">Unable to load leaderboard</p>
              <p className="text-gray-600 text-sm mt-2">Please try refreshing the page.</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!leaderboard || leaderboard.length === 0) && (
            <div className="card p-12 text-center">
              <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg font-semibold mb-2">No campaigns yet</p>
              <p className="text-gray-500">Be the first to start a JoyFund and make an impact!</p>
            </div>
          )}

          {/* Leaderboard Table */}
          {!isLoading && !error && leaderboard && Array.isArray(leaderboard) && leaderboard.length > 0 && (
            <div className="card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50" style={{ borderBottomColor: 'var(--primary)' }}>
                    <TableHead className="w-12 text-center font-black text-[#1A1A2E]">Rank</TableHead>
                    <TableHead className="font-black text-[#1A1A2E]">Campaign</TableHead>
                    <TableHead className="text-right font-black text-[#1A1A2E]">Goal</TableHead>
                    <TableHead className="text-right font-black text-[#1A1A2E]">Raised</TableHead>
                    <TableHead className="text-center font-black text-[#1A1A2E]">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((campaign: any, index: number) => {
                    const rank = index + 1;
                    const progress = campaign?.progress_percentage ?? 0;
                    const medal = getMedalIcon(rank);
                    const goalAmount = parseFloat(campaign?.goal_amount as string) || 0;
                    const raisedAmount = parseFloat(campaign?.total_net_raised as string) || 0;

                    return (
                      <TableRow
                        key={campaign?.id ?? index}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/campaign/${campaign?.id}`)}
                      >
                        {/* Rank */}
                        <TableCell className="text-center font-black text-lg">
                          {medal ? (
                            <span className="text-2xl">{medal}</span>
                          ) : (
                            <span className="text-gray-600">#{rank}</span>
                          )}
                        </TableCell>

                        {/* Campaign Title & Donor */}
                        <TableCell>
                          <div>
                            <p className="font-bold text-[#1A1A2E] truncate group-hover:text-primary transition-colors flex items-center gap-2">
                              {campaign?.title ?? 'Untitled'}
                              <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <button
                              onClick={(e) => handleDonorClick(e, campaign)}
                              className="text-xs text-gray-500 hover:text-[#1DB1DB] transition-colors flex items-center gap-1 mt-0.5"
                            >
                              <User size={10} />
                              by {getDonorName(campaign)}
                            </button>
                          </div>
                        </TableCell>

                        {/* Goal Amount */}
                        <TableCell className="text-right">
                          <p className="font-semibold text-gray-700">
                            XAF {goalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </p>
                        </TableCell>

                        {/* Raised Amount */}
                        <TableCell className="text-right">
                          <p
                            className="font-bold text-lg"
                            style={{ color: 'var(--primary)' }}
                          >
                            XAF {raisedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </p>
                        </TableCell>

                        {/* Progress Bar */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(progress, 100)}%`,
                                  background: 'var(--primary)',
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-700 w-12 text-right">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Infinite scroll sentinel */}
              {hasNextPage && (
                <div ref={sentinelRef} className="py-4 flex justify-center border-t border-gray-100">
                  {isFetchingNextPage && (
                    <Loader2 className="w-5 h-5 text-[#1DB1DB] animate-spin" />
                  )}
                </div>
              )}

              {!hasNextPage && leaderboard.length > 0 && (
                <p className="py-4 text-center text-xs text-gray-300 font-medium border-t border-gray-100">
                  All campaigns loaded
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
