'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Heart, 
  Calendar, 
  DollarSign, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Phone, 
  CreditCard, 
  Hash, 
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ExternalLink,
  Info,
  History
} from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import Navbar from '@/components/shared/Navbar';
import { getMyDonations } from '@/actions/campaigns';

export default function DonationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [expandedDonations, setExpandedDonations] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedDonations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?redirect=/dashboard/donor/donations');
    }
  }, [status, router]);

  // Fetch donations with infinite scroll
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['my-donations-all', session?.user?.id],
    queryFn: async ({ pageParam = 1 }) => {
      const token = (session as any)?.accessToken || session?.user?.accessToken;
      if (!token) throw new Error('No access token');
      const response = await getMyDonations(token);
      return response as any;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      // Support both wrapped in 'json' and direct response
      const nextPage = lastPage?.json?.next || lastPage?.next;
      if (!nextPage) return undefined;
      
      // Try to extract page number from URL or use increment
      const pageNum = lastPage?.json?.page || lastPage?.page || 1;
      return pageNum + 1;
    },
    enabled: !!session?.user,
  });

  const donations = data?.pages.flatMap((page: any) => {
    // Robustly handle different response structures including the "json" wrapper mentioned by the user
    return page?.json?.results || page?.results || [];
  }) || [];
  
  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'failed':
        return <XCircle size={14} className="text-red-500" />;
      case 'pending':
        return <Clock size={14} className="text-amber-500" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-[#1A1A2E]">My Donations</h1>
              <p className="text-gray-500 text-sm mt-1">Full history of your contributions including payment details</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="card p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--primary)' + '15' }}>
                <Heart size={18} style={{ color: 'var(--primary)' }} />
              </div>
              <div className="text-2xl font-black" style={{ color: 'var(--primary)' }}>
                {donations.length}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Total Donations</div>
            </div>

            <div className="card p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#10b98115' }}>
                <DollarSign size={18} style={{ color: '#10b981' }} />
              </div>
              <div className="text-2xl font-black" style={{ color: '#10b981' }}>
                {totalAmount.toLocaleString()} XAF
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Total Donated</div>
            </div>

            <div className="card p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: '#471DDB15' }}>
                <TrendingUp size={18} style={{ color: '#471DDB' }} />
              </div>
              <div className="text-2xl font-black" style={{ color: '#471DDB' }}>
                {donations.length > 0 ? (totalAmount / donations.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'} XAF
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Average Donation</div>
            </div>
          </div>

          {/* Donations List */}
          {isLoading ? (
            <div className="card p-10 text-center">
              <Loader2 size={32} className="mx-auto mb-3 text-gray-300 animate-spin" />
              <p className="text-gray-500">Loading donations...</p>
            </div>
          ) : isError ? (
            <div className="card p-10 text-center">
              <Heart size={32} className="mx-auto mb-3 text-gray-200" />
              <h3 className="font-bold text-[#1A1A2E] mb-2">Error loading donations</h3>
              <p className="text-gray-500 text-sm">{error?.message || 'Please try again'}</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="card p-10 text-center">
              <Heart size={32} className="mx-auto mb-3 text-gray-200" />
              <h3 className="font-bold text-[#1A1A2E] mb-2">No donations yet</h3>
              <p className="text-gray-500 text-sm mb-4">Start making an impact by supporting campaigns</p>
              <Link href="/explore" className="btn-primary inline-flex items-center gap-2">
                Explore Campaigns
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => {
                const isExpanded = expandedDonations[donation.id];
                return (
                  <div
                    key={donation.id}
                    className="card p-0 overflow-hidden hover:shadow-md transition-all duration-300"
                  >
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        {/* Left Section */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm"
                            style={{ background: 'var(--primary)' }}
                          >
                            <Heart size={22} fill="currentColor" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                              <span className="font-bold text-[#1A1A2E] truncate">
                                Donation to Campaign #{donation.campaign_id.slice(0, 8)}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wider ${getStatusColor(donation.status)}`}
                              >
                                {getStatusIcon(donation.status)}
                                {donation.status}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-gray-400" />
                                {formatDate(donation.created_at)}
                              </span>
                              
                              <span className="flex items-center gap-1.5">
                                <User size={14} className="text-gray-400" />
                                {donation.is_anonymous ? 'Anonymous' : (donation.donor_name || 'Donor')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount Section */}
                        <div className="md:text-right shrink-0 bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none flex md:block justify-between items-center">
                          <div>
                            <p className="font-black text-2xl" style={{ color: 'var(--primary)' }}>
                              {Number(donation.amount).toLocaleString()}
                              <span className="text-xs ml-1 font-bold">XAF</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 hidden md:block">Ref: {donation.id.slice(0, 8)}</p>
                          </div>
                          <div className="md:hidden">
                             <p className="text-[10px] text-gray-400">Ref: {donation.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link 
                          href={`/campaign/${donation.campaign_id}`}
                          className="text-[11px] font-bold bg-[#471DDB]/10 text-[#471DDB] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#471DDB]/20 transition-colors"
                        >
                          <ExternalLink size={14} />
                          View Public Campaign
                        </Link>
                        
                        <button
                          onClick={() => toggleExpand(donation.id)}
                          className="text-[11px] font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {isExpanded ? 'Hide Details' : 'View Full Details'}
                        </button>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-5 pt-5 border-t border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* Payment Details */}
                          {donation.payment && (
                            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                              <div className="flex items-center gap-2 mb-4">
                                <CreditCard size={16} className="text-[#471DDB]" />
                                <h4 className="text-xs font-black text-[#1A1A2E] uppercase tracking-wider">Payment Information</h4>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Method</p>
                                  <p className="text-sm font-bold text-gray-700">{donation.payment.payment_method}</p>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Phone Number</p>
                                  <p className="text-sm font-bold text-gray-700">{donation.payment.phone_number}</p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Transaction Ref</p>
                                  <p className="text-sm font-bold text-gray-700 truncate" title={donation.payment.payment_reference || 'N/A'}>
                                    {donation.payment.payment_reference || 'Pending...'}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Status</p>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${donation.payment.payment_status?.toLowerCase() === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    <span className="text-sm font-bold text-gray-700">{donation.payment.payment_status}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Payment Dates */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Payment Created</p>
                                  <p className="text-[11px] font-medium text-gray-600">{formatDate(donation.payment.created_at)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">Last Updated</p>
                                  <p className="text-[11px] font-medium text-gray-600">{formatDate(donation.payment.updated_at)}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Message */}
                          {donation.message && (
                            <div className="bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare size={16} className="text-[#471DDB]" />
                                <h4 className="text-xs font-black text-[#1A1A2E] uppercase tracking-wider">Donation Message</h4>
                              </div>
                              <p className="text-sm text-gray-600 italic leading-relaxed">"{donation.message}"</p>
                            </div>
                          )}

                          {/* History/Events */}
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Donation Events */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <History size={16} className="text-gray-400" />
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Donation Timeline</h4>
                              </div>
                              <div className="space-y-3 border-l-2 border-gray-100 pl-4 ml-2">
                                {(donation.events || []).map((event: any, idx: number) => (
                                  <div key={event.id || idx} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-gray-300 border-2 border-white shadow-sm" />
                                    <p className="text-[11px] font-bold text-gray-700">{event.status}</p>
                                    <p className="text-[10px] text-gray-400">{formatDate(event.changed_at)}</p>
                                    {event.notes && <p className="text-[10px] text-gray-500 mt-1 italic">{event.notes}</p>}
                                  </div>
                                ))}
                                {(!donation.events || donation.events.length === 0) && (
                                  <p className="text-[10px] text-gray-400 italic">No timeline data available</p>
                                )}
                              </div>
                            </div>

                            {/* Payment Events */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <History size={16} className="text-gray-400" />
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Payment Timeline</h4>
                              </div>
                              <div className="space-y-3 border-l-2 border-gray-100 pl-4 ml-2">
                                {(donation.payment?.events || []).map((event: any, idx: number) => (
                                  <div key={event.id || idx} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-emerald-300 border-2 border-white shadow-sm" />
                                    <p className="text-[11px] font-bold text-gray-700">{event.status}</p>
                                    <p className="text-[10px] text-gray-400">{formatDate(event.changed_at)}</p>
                                    {event.notes && <p className="text-[10px] text-gray-500 mt-1 italic">{event.notes}</p>}
                                  </div>
                                ))}
                                {(!donation.payment?.events || donation.payment?.events.length === 0) && (
                                  <p className="text-[10px] text-gray-400 italic">No payment timeline available</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* System IDs */}
                          <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-400 font-mono">Donation ID: {donation.id}</span>
                            </div>
                            {donation.payment?.payment_id && (
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-400 font-mono">Payment ID: {donation.payment.payment_id}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-400 font-mono">Campaign ID: {donation.campaign_id}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="w-full card p-4 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#471DDB]" />
                      <span className="text-sm font-bold text-gray-600">Loading more...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={18} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-600">Load More Donations</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
