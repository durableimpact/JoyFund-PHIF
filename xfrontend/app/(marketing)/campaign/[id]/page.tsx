'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Users, Share2, ArrowLeft, CheckCircle, Heart, Loader2, 
  History, Award, Info, TrendingUp, Wallet, ExternalLink,
  CircleDollarSign, ShieldCheck, User2, MapPin, Building2,
  Calendar, CreditCard, ChevronRight, Activity, HandHeart
} from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { getCampaign, listCampaignDonations } from '@/actions/campaigns';
import { formatXAF, cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('story');
  
  // Fetch campaign with React Query
  const { data: campaignData, isLoading: isCampaignLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => await getCampaign(id as string),
    enabled: !!id,
  });

  // Robust data handling for campaign
  const campaign = (campaignData as any)?.json || campaignData;

  // Fetch donations with React Query infinite query
  const {
    data: donationsData,
    isLoading: donationsLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['campaign-donations', id, 'SUCCESS'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await listCampaignDonations(id as string, {
        status: 'SUCCESS',
        page: pageParam.toString(),
      });
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
    enabled: !!id,
  });

  const donations = donationsData?.pages.flatMap(page => {
    const results = (page as any)?.json?.results || (page as any)?.results || [];
    return results;
  }) || [];

  const handleCopy = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/campaign/${campaign?.id}` : '';
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isCampaignLoading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-32 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium">Loading campaign details…</p>
        </div>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={32} className="text-slate-300" />
          </div>
          <CardTitle className="text-2xl">Campaign not found</CardTitle>
          <CardDescription>The campaign you are looking for might have been closed or removed.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Link href="/explore">
            <Button variant="default">Back to Explore</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );

  const raisedXAF = campaign.total_net_raised || 0;
  const goalXAF = campaign.goal_amount || 0;
  const progressPct = campaign.progress_percentage || 0;
  const voucherFundings = campaign.voucher_fundings || [];
  const transactions = campaign.transactions || [];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden">
        {campaign.cover_image ? (
          <img
            src={campaign.cover_image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 to-secondary" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col justify-end pb-12 px-4">
          <div className="max-w-6xl mx-auto w-full">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 mb-6 -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Explore
            </Button>
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white backdrop-blur-md border-none hover:bg-white/30">
                {campaign.event_type || 'Social Impact'}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black text-white max-w-3xl leading-tight">
                {campaign.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Stats Card (Mobile only) */}
            <Card className="lg:hidden border-none shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-primary">{formatXAF(raisedXAF)}</span>
                    <span className="text-slate-400 text-sm mb-1">raised of {formatXAF(goalXAF)}</span>
                  </div>
                  <Progress value={progressPct} className="h-3" />
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>{progressPct.toFixed(1)}% Funded</span>
                    <span>{donations.length} Donors</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/campaign/${campaign.id}/donate/`} className="w-full">
                    <Button className="w-full h-12 text-md font-bold shadow-lg shadow-primary/20">Donate Now</Button>
                  </Link>
                  <Button variant="outline" className="w-full h-12" onClick={handleCopy}>
                    {copied ? <CheckCircle className="text-green-500" /> : <Share2 />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Tabs defaultValue="story" className="w-full bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
              <TabsList className="grid grid-cols-3 w-full mb-2 bg-slate-50/50 rounded-2xl p-1" variant="line">
                <TabsTrigger value="story" className="rounded-xl py-3 data-active:bg-white data-active:shadow-sm">
                  <Info className="w-4 h-4 mr-2" /> Our Story
                </TabsTrigger>
                <TabsTrigger value="impact" className="rounded-xl py-3 data-active:bg-white data-active:shadow-sm">
                  <HandHeart className="w-4 h-4 mr-2" /> Impact
                </TabsTrigger>
                <TabsTrigger value="transparency" className="rounded-xl py-3 data-active:bg-white data-active:shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Transparency
                </TabsTrigger>
              </TabsList>

              {/* Story Tab */}
              <TabsContent value="story" className="p-4 md:p-6 focus-visible:outline-none">
                <div className="prose prose-slate max-w-none">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">About this campaign</h3>
                  <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {campaign.description || 'No description provided for this campaign.'}
                  </div>
                </div>
                
                <div className="mt-12 grid sm:grid-cols-2 gap-4">
                  <Card className="bg-slate-50 border-none">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Start Date
                      </CardDescription>
                      <CardTitle className="text-sm">
                        {new Date(campaign.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card className="bg-slate-50 border-none">
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> Campaign Type
                      </CardDescription>
                      <CardTitle className="text-sm capitalize">
                        {campaign.event_type?.toLowerCase() || 'general'}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              {/* Impact Tab */}
              <TabsContent value="impact" className="p-4 md:p-6 focus-visible:outline-none">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Vouchers Funded</h3>
                      <p className="text-sm text-slate-500">Real-time impact tracking of your contributions.</p>
                    </div>
                    <Badge variant="secondary" className="px-3 py-1 text-sm font-bold">
                      {voucherFundings.length} Vouchers
                    </Badge>
                  </div>

                  {voucherFundings.length > 0 ? (
                    <div className="grid gap-4">
                      {voucherFundings.map((funding: any) => (
                        <Card key={funding.id} className="overflow-hidden border-slate-100 hover:border-primary/20 transition-colors group">
                          <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center">
                              <div className="p-4 flex-1 flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <Award size={20} />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-900 flex items-center gap-2">
                                    {funding.beneficiary_name || funding.voucher?.beneficiary?.full_name || 'Vulnerable Beneficiary'}
                                  </p>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Building2 size={12} /> {funding.hospital_name || funding.voucher?.hospital?.name || 'Local Health Facility'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <CreditCard size={12} /> {funding.voucher_code || funding.voucher?.voucher_code || '---'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-slate-50 md:bg-transparent px-4 py-3 md:py-0 md:px-6 flex md:flex-col items-center md:items-end justify-between gap-1 border-t md:border-t-0 md:border-l border-slate-100">
                                <span className="text-sm font-bold text-primary">{formatXAF(funding.amount)}</span>
                                <Badge className={cn(
                                  "text-[10px] font-black uppercase tracking-wider",
                                  (funding.status || funding.voucher?.status) === 'USED' ? "bg-green-100 text-green-700" :
                                  (funding.status || funding.voucher?.status) === 'EXPIRED' ? "bg-red-100 text-red-700" :
                                  "bg-blue-100 text-blue-700"
                                )}>
                                  {funding.status || funding.voucher?.status || 'Allocated'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                      <HandHeart className="mx-auto mb-4 text-slate-300 w-12 h-12" />
                      <p className="text-slate-500 font-medium">No vouchers funded yet. Your donations will appear here as they are allocated.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Transparency Tab */}
              <TabsContent value="transparency" className="p-4 md:p-6 focus-visible:outline-none">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Campaign Transactions</h3>
                    <p className="text-sm text-slate-500">Full financial trail from donation to healthcare delivery.</p>
                  </div>

                  <div className="space-y-4">
                    {transactions.length > 0 ? (
                      transactions.map((tx: any) => (
                        <div key={tx.id} className="flex gap-4 group">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-primary/30 transition-all shadow-sm">
                              {tx.transaction_type === 'DONATION' ? (
                                <CircleDollarSign className="w-5 h-5 text-green-500" />
                              ) : tx.transaction_type === 'VOUCHER_ALLOCATED' ? (
                                <Award className="w-5 h-5 text-blue-500" />
                              ) : tx.transaction_type === 'HOSPITAL_SETTLED' ? (
                                <Building2 className="w-5 h-5 text-purple-500" />
                              ) : (
                                <TrendingUp className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 w-px bg-slate-100 my-2" />
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-slate-900 text-sm">
                                {tx.description || tx.transaction_type?.replace(/_/g, ' ')}
                              </h4>
                              <span className={cn(
                                "text-sm font-black",
                                tx.transaction_type === 'DONATION' ? "text-green-600" : "text-slate-900"
                              )}>
                                {tx.transaction_type === 'DONATION' ? '+' : '-'}{formatXAF(tx.amount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <time>{new Date(tx.created_at).toLocaleString()}</time>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 text-slate-500 uppercase">
                                {tx.transaction_type?.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-center py-12">No transactions recorded yet.</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Support Card */}
            <Card className="border-none shadow-sm overflow-hidden hidden lg:block sticky top-24">
              <CardHeader className="bg-slate-900 text-white p-6">
                <CardTitle className="text-xl">Support this cause</CardTitle>
                <CardDescription className="text-slate-400">Join {donations.length} others who have contributed.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-black text-primary">{formatXAF(raisedXAF)}</span>
                      <span className="text-slate-400 text-sm mb-1 font-medium">of {formatXAF(goalXAF)}</span>
                    </div>
                    <Progress value={progressPct} className="h-3" />
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{progressPct.toFixed(1)}% Funded</span>
                      <span className="text-slate-900">{donations.length} Donors</span>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <Link href={`/campaign/${campaign.id}/donate/`} className="w-full">
                      <Button className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">Donate Now</Button>
                    </Link>
                    <Button variant="outline" className="w-full h-12 gap-2" onClick={handleCopy}>
                      {copied ? <><CheckCircle className="text-green-500 h-4 w-4" /> Copied link</> : <><Share2 className="h-4 w-4" /> Share Campaign</>}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Community Impact</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                      <span>100% Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <HandHeart className="w-5 h-5 text-pink-500" />
                      <span>{Math.round(raisedXAF / 45000)} Safe Deliveries Funded</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community/Donations Card */}
            <Card className="border-none shadow-sm overflow-hidden lg:sticky lg:top-[500px]">
              <CardHeader className="p-5 pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Users size={18} className="text-primary" /> Community
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-black">{donations.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {donations.length > 0 ? (
                      donations.map((donation, idx) => (
                        <div key={donation.id + idx} className="flex items-start gap-3">
                          <Avatar className="w-9 h-9 border border-slate-100">
                            <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-xs uppercase">
                              {(donation.donor_name || 'A')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {donation.is_anonymous ? 'Anonymous' : donation.donor_name}
                              </p>
                              <span className="text-xs font-black text-primary whitespace-nowrap ml-2">
                                {formatXAF(donation.amount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[10px] text-slate-400">
                                {donation.created_at ? new Date(donation.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Just now'}
                              </p>
                              {donation.message && <span className="text-slate-300 text-[10px]">•</span>}
                              {donation.message && <p className="text-[10px] text-slate-500 truncate italic">"{donation.message}"</p>}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <HandHeart className="mx-auto text-slate-200 mb-2 w-8 h-8" />
                        <p className="text-slate-400 text-xs font-medium">Be the first to donate!</p>
                      </div>
                    )}
                    
                    {hasNextPage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-slate-500 mt-2 hover:bg-slate-50 hover:text-primary transition-colors"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? (
                          <Loader2 className="animate-spin w-3 h-3 mr-2" />
                        ) : (
                          <ChevronRight className="w-3 h-3 mr-2 rotate-90" />
                        )}
                        Load more donors
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Impact Reference Card */}
            <Card className="bg-primary text-white border-none shadow-lg shadow-primary/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <HandHeart size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Every Franc Counts</h4>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest font-black">Impact Reference</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ['6,000 XAF', 'Antenatal Visit'],
                  ['45,000 XAF', 'Normal Delivery'],
                  ['120,000 XAF', 'C-section + care'],
                ].map(([amt, label]) => (
                  <div key={label} className="flex justify-between items-center bg-white/10 rounded-xl p-2.5 px-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/70">{label}</span>
                    <span className="font-black text-xs">{amt}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[10px] text-center text-white/50 font-medium">
                * Based on average healthcare costs in partner facilities.
              </p>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
