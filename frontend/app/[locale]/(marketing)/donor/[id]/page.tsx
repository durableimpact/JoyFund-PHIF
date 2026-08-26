'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getDonorPublicSumarry } from '@/actions/accounts';
import Navbar from '@/components/shared/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, TrendingUp, Target, ArrowRight, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import Link from 'next/link';
import { Helmet } from 'react-helmet-async';

export default function DonorPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const donorId = params.id as string;

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['donor-public-summary', donorId],
    queryFn: () => getDonorPublicSumarry(donorId),
    enabled: !!donorId,
  });

  const donorName = summary?.donor?.user?.first_name 
    ? `${summary.donor.user.first_name} ${summary.donor.user.last_name || ''}`.trim()
    : 'Anonymous Donor';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>{summary ? `${donorName}'s Impact | JoyFund` : 'Donor Profile | JoyFund'}</title>
        <meta name="description" content={`View ${donorName}'s public impact and contributions on JoyFund.`} />
        <meta property="og:site_name" content="JoyFund" />
      </Helmet>
      
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-[#1DB1DB] transition-colors font-medium text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#1DB1DB]" />
              <p className="text-gray-500 font-medium">Loading donor profile...</p>
            </div>
          ) : isError || !summary ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <Heart size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Profile Not Found</h2>
              <p className="text-gray-500 mb-6">We couldn't load this donor's profile. They may have set it to private or the link is invalid.</p>
              <Link href="/leaderboard" className="inline-flex items-center justify-center bg-[#1D38DB] hover:bg-[#1530c4] text-white font-semibold px-6 py-3 rounded-full transition-all shadow-md">
                Return to Leaderboard
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Left Column: Profile Card */}
              <div className="md:col-span-1 space-y-6">
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-b from-[#1DB1DB]/20 to-transparent opacity-50 pointer-events-none" />
                  
                  <Avatar className="w-32 h-32 mx-auto mb-6 border-4 border-white shadow-lg ring-4 ring-gray-50">
                    {summary.donor.user.profile_picture ? (
                      <AvatarImage src={summary.donor.user.profile_picture} alt={donorName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-linear-to-br from-[#1DB1DB] to-[#1D38DB] text-white text-4xl font-black">
                      {donorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-black text-[#1A1A2E] mb-1">{donorName}</h1>
                  <p className="text-[#1DB1DB] font-semibold text-sm mb-6 flex items-center justify-center gap-1.5">
                    <Heart size={14} className="fill-[#1DB1DB]" />
                    JoyFund Supporter
                  </p>

                  {/* <div className="space-y-4 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Joined</span>
                      <span className="font-semibold text-[#1A1A2E]">
                        {summary.donor.user.date_joined ? new Date(summary.donor.user.date_joined).getFullYear() : new Date().getFullYear()}
                      </span>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Right Column: Impact Stats & Activity */}
              <div className="md:col-span-2 space-y-8">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="w-12 h-12 rounded-xl bg-[#1DB1DB]/10 flex items-center justify-center shrink-0">
                      <Heart size={24} className="text-[#1DB1DB] fill-[#1DB1DB]/20" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Donations</p>
                      <p className="text-2xl font-black text-[#1A1A2E]">{summary.donations_count}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Target size={24} className="text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Campaigns</p>
                      <p className="text-2xl font-black text-[#1A1A2E]">{summary.campaign_count}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 transition-transform hover:-translate-y-1 duration-300">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <TrendingUp size={24} className="text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Impact</p>
                      <p className="text-xl sm:text-2xl font-black text-[#1A1A2E] wrap-break-word">
                        {formatXAF(summary.donations_total_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campaigns List */}
                {summary.campaigns.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                        <Target size={20} className="text-purple-600" />
                        Supported Campaigns
                      </h3>
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                        {summary.campaign_count}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {summary.campaigns.map((campaign) => (
                        <Link
                          key={campaign.id}
                          href={`/campaign/${campaign.id}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="min-w-0 flex-1 mb-2 sm:mb-0 pr-4">
                            <h4 className="text-base font-bold text-[#1A1A2E] group-hover:text-[#1DB1DB] transition-colors line-clamp-1 mb-1">
                              {campaign.title}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <TrendingUp size={14} className="text-green-500" />
                                {formatXAF(campaign.current_amount)} raised
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center text-sm font-semibold text-[#1DB1DB] group-hover:translate-x-1 transition-transform">
                            View Campaign <ArrowRight size={16} className="ml-1" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Donations List */}
                {summary.donations.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#1A1A2E] flex items-center gap-2">
                        <Heart size={20} className="text-[#1DB1DB] fill-[#1DB1DB]/20" />
                        Recent Contributions
                      </h3>
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                        {summary.donations_count}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {summary.donations.map((donation) => (
                        <Link
                          key={donation.id}
                          href={`/campaign/${donation.campaign_id}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="min-w-0 flex-1 mb-2 sm:mb-0 pr-4">
                            <h4 className="text-sm font-semibold text-gray-600 mb-1 flex items-center gap-1.5">
                              Donated to <span className="text-[#1A1A2E] group-hover:text-[#1DB1DB] transition-colors line-clamp-1 font-bold">{donation.campaign_title}</span>
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Calendar size={12} />
                              {new Date(donation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center justify-end">
                            <span className="text-lg font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-full">
                              {formatXAF(donation.amount)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {summary.campaigns.length === 0 && summary.donations.length === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                    <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-[#1A1A2E] text-lg font-bold mb-2">No public activity yet</p>
                    <p className="text-gray-500">This donor hasn't made any public contributions yet.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
