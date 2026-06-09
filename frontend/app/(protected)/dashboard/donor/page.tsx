'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, TrendingUp, Users, Heart, History, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/shared/Navbar';
import CampaignDashboardCard from '@/components/dashboard/cards/CampaignDashboardCard';
import { formatXAF } from '@/lib/utils';
import { getMyCampaigns, getMyDonations } from '@/actions/campaigns';
import { getDonorDashboard } from '@/actions/accounts';

export default function DonorDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?redirect=/dashboard');
    }
  }, [status, router]);

  // Debug session
  useEffect(() => {
    if (session) {
      console.log('Session loaded:', {
        userId: session.user?.id,
        userName: session.user?.name,
        hasAccessToken: !!(session as any).accessToken,
        hasUserAccessToken: !!session.user?.accessToken,
      });
    }
  }, [session]);

  // Fetch donor dashboard stats with React Query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['donor-dashboard', (session?.user as any)?.userInfo?.profile.id],
    queryFn: async () => {
      const token = (session as any)?.accessToken || session?.user?.accessToken;
      const userId = (session?.user as any)?.userInfo?.profile.id;
      console.log('Fetching dashboard with:', { userId, hasToken: !!token,user:session?.user });
      if (!token || !userId) {
        console.warn('Missing token or user ID for dashboard:', { hasToken: !!token, userId });
        throw new Error('No access token or user ID');
      }
      try {
        return await getDonorDashboard(userId, token);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        throw err;
      }
    },
    enabled: !!session?.user && !!(session?.user as any)?.userInfo?.id,
  });

  // Fetch campaigns with React Query
  const { 
    data: campaignsResponse, 
    isLoading: campaignsLoading,
    isError: campaignsError,
    error: campaignsErrorMsg,
  } = useQuery({
    queryKey: ['my-campaigns', session?.user?.id],
    queryFn: async () => {
      const token = (session as any)?.accessToken || session?.user?.accessToken;
      if (!token) throw new Error('No access token');
      try {
        return await getMyCampaigns(token);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        throw err;
      }
    },
    enabled: !!session?.user,
  });

  // Fetch donations with React Query
  const { data: donationsResponse, isLoading: donationsLoading } = useQuery({
    queryKey: ['my-donations', session?.user?.userInfo?.id],
    queryFn: async () => {
      const token = (session as any)?.accessToken || session?.user?.accessToken;
      if (!token) throw new Error('No access token');
      return await getMyDonations(token);
    },
    enabled: !!session?.user,
  });

  const campaigns = campaignsResponse?.results || [];
  const donations = donationsResponse?.results || [];
  const loading = campaignsLoading || donationsLoading || dashboardLoading;

  const name = session?.user?.name || 'Donor';
  
  // Use dashboard data if available, otherwise fallback to calculated values
  const totalRaised = dashboardData?.total_raised ?? campaigns.reduce((s, c) => s + (c.total_net_raised || 0), 0);
  const totalContributors = dashboardData?.my_campaigns ?? campaigns.length;
  const totalDonated = dashboardData?.contributors ?? donations.reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const livesImpacted = dashboardData?.lives_impacted ?? 0;

  const stats = [
    { label: 'Total Raised', value: formatXAF(totalRaised), icon: TrendingUp, color: 'var(--primary)' },
    { label: 'My JoyFunds', value: totalContributors, icon: Heart, color: 'var(--secondary)' },
    { label: 'Lives Impacted', value: livesImpacted, icon: Users, color: 'var(--success)' },
    { label: "I've Donated", value: formatXAF(totalDonated), icon: Heart, color: '#471DDB' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* <Navbar /> */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-sm text-gray-500 mb-1">Welcome back</p>
              <h1 className="text-2xl font-black text-[#1A1A2E]">{name.split(' ')[0]}&apos;s Dashboard</h1>
            </div>
            <Link href="/dashboard/donor/campaigns/create" className="btn-primary text-sm">
              <Plus size={16} /> New JoyFund
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <div key={s.label} className="card p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + '15' }}>
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <div className="text-xl font-black" style={{ color: s.color }}>
                  {loading ? <span className="inline-block w-10 h-5 bg-gray-100 rounded animate-pulse" /> : s.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* My Campaigns */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[#1A1A2E]">My JoyFunds</h2>
                <div className="flex items-center gap-3">
                  <Link href="/dashboard/donor/campaigns" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>All</Link>
                  <Link href="/dashboard/donor/campaigns/create" className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>+ New</Link>
                </div>
              </div>
              {campaignsLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[1,2].map(i=><div key={i} className="card h-44 animate-pulse bg-gray-50"/>)}
                </div>
              ) : campaignsError ? (
                <div className="card p-10 text-center">
                  <Heart size={32} className="mx-auto mb-3 text-red-200" />
                  <h3 className="font-bold text-[#1A1A2E] mb-2">Unable to load campaigns</h3>
                  <p className="text-gray-500 text-sm mb-4">{campaignsErrorMsg?.message || 'Please try refreshing the page'}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    Refresh Page
                  </button>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="card p-10 text-center">
                  <Heart size={32} className="mx-auto mb-3 text-gray-200" />
                  <h3 className="font-bold text-[#1A1A2E] mb-2">No campaigns yet</h3>
                  <p className="text-gray-500 text-sm mb-4">Turn your next celebration into impact for Cameroonian mothers.</p>
                  <Link href="/dashboard/donor/campaigns/create" className="btn-primary">Start a JoyFund</Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {campaigns.slice(0, 3).map(c => <CampaignDashboardCard key={c.id} campaign={c} />)}
                </div>
              )}
            </div>

            {/* Recent Donations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-[#1A1A2E]">Recent Gifts</h2>
                <Link href="/dashboard/donor/donations" className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
                  <History size={12} /> All
                </Link>
              </div>
              <div className="card p-4 space-y-3">
                {loading ? (
                  [1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)
                ) : donations.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <p>No donations yet</p>
                    <Link href="/explore" className="text-xs font-semibold mt-1 block" style={{ color: 'var(--primary)' }}>Explore campaigns</Link>
                  </div>
                ) : donations.slice(0, 6).map((d: any) => (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'var(--primary)' }}>
                      <Heart size={11} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        Campaign #{d.campaign_id}
                      </p>
                      <p className="text-xs text-gray-400">
                        {d.created_at 
                          ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </p>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: 'var(--primary)' }}>
                      {formatXAF(Number(d.amount ?? 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
