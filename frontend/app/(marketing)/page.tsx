'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Heart, ArrowRight, Star, ChevronRight, Cake, Gift, Hospital, Sparkles, DollarSign, type LucideIcon } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import CampaignCard from '@/components/shared/CampaignCard';
import { listCampaigns, getPlatformStats } from '@/actions/campaigns';


type StepItem = { icon: LucideIcon; step: string; title: string; desc: string };
const steps: StepItem[] = [
  { icon: Cake, step: '01', title: 'Celebrate', desc: 'Create a JoyFund campaign for your birthday, wedding, promotion, or graduation instead of asking for traditional gifts.' },
  { icon: Gift, step: '02', title: 'Pool', desc: 'Friends and family donate via MTN MoMo or Orange Money. 95% goes directly to the healthcare fund.' },
  { icon: Hospital, step: '03', title: 'Care', desc: 'A verified vulnerable pregnant woman receives a care voucher, redeemable at partner hospitals across Cameroon.' },
];

const testimonials = [
  { name: 'Jean-Pierre M.', role: 'Birthday Donor', quote: 'My 30th birthday funded 2 safe deliveries. Nothing could have made this milestone more meaningful.', avatar: 'JM' },
  { name: 'Solange N.', role: 'Wedding Donor', quote: 'We asked for JoyFund contributions instead of gifts. Our guests loved it — we raised 234,000 XAF!', avatar: 'SN' },
  { name: 'Dr. Mireille O.', role: 'Partner Hospital', quote: 'The voucher system is simple, transparent, and fraud-proof. Exactly what maternal healthcare needs.', avatar: 'MO' },
];

export default function HomePage() {
  // const [feedIdx, setFeedIdx] = useState(0);
  // const activityFeed = [
  //   { id: 1, type: 'donation', message: '20 XAF contributed to Solange & Eric\'s Wedding JoyFund', timeAgo: '3 hours ago' },
  //   { id: 2, type: 'voucher', message: 'Voucher JF3R8T generated for BEN-0071', timeAgo: '4 hours ago' },
  // ];

  // Fetch campaigns with React Query
  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => await listCampaigns(),
  });

  // Fetch platform stats with React Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => await getPlatformStats(),
    initialData: { lives_supported: 0, active_campaigns: 0, total_raised: '0' },
  });

  // useEffect(() => {
  //   const t = setInterval(() => setFeedIdx(i => (i + 1) % activityFeed.length), 3000);
  //   return () => clearInterval(t);
  // }, []);

  const activeCampaigns = (campaignsResponse?.results || []).filter(c => c.status === 'ACTIVE').slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navbar transparent />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background photo */}
        {/* "url('https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1600&auto=format&fit=crop')", */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              // "url('https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1600&auto=format&fit=crop')",
            "url('/assets/images/joyfund-hero-image.jpeg')",
          }}
        />

        {/* Soft gradient overlay: dark at top, fades to page bg at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(10,20,60,0.58) 0%, rgba(15,30,90,0.38) 38%, rgba(249,250,251,0.90) 80%, #F9FAFB 100%)',
          }}
        />

        {/* Navbar sits on top of everything */}
        <Navbar transparent />

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-24">

          {/* Live toast pill */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8"></div>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8">
            {/* <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="opacity-90 truncate max-w-xs">{activityFeed[feedIdx].message}</span>
              <span className="opacity-60 hidden sm:inline">{activityFeed[feedIdx].timeAgo}</span> */}
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-md" style={{ letterSpacing: '-1px' }}>
            Turn your{' '}
            <span style={{ color: '#7de8c0' }}>celebration</span>
            {' '}into<br />someone&apos;s safe delivery
          </h1>

          {/* Subtext */}
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed drop-shadow">
            JoyFund digitalises Cameroon&apos;s Njangi solidarity - redirecting birthday gifts and wedding contributions into a transparent People&apos;s Health Insurance Fund for vulnerable pregnant women.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              href="/dashboard/donor/campaigns/create"
              className="btn-secondary text-base px-8 py-4 inline-flex items-center gap-2"
            >
              Start a JoyFund <Sparkles size={18} className="fill-current" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white/10 transition-all"
            >
              Explore Joyfunds <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { v: stats?.lives_supported, l: 'Lives Supported', icon: Heart, color: 'text-rose-300' },
              { v: stats?.active_campaigns, l: 'Active Campaigns', icon: Sparkles, color: 'text-amber-300' },
              { v: stats?.total_raised, l: 'XAF Raised', icon: DollarSign, color: 'text-emerald-300' },
            ].map((s) => (
              <div
                  key={s.l}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-white border border-white/20 flex flex-col items-center text-center"
                >
                  <s.icon size={28} className={`${s.color} mb-2`} />
                  <div className="text-lg font-black">{s.v}</div>
                  <div className="text-xs opacity-70">{s.l}</div>
                </div>
            ))}
          </div>
        </div>

        {/* Smooth wave into next section */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 40C360 80 1080 0 1440 40V80H0V40Z" fill="#F9FAFB" />
          </svg>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>How It Works</p>
            <h2 className="text-3xl font-black text-[#1A1A2E]">Celebrate → Pool → Care</h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">Three simple steps transform your personal milestone into life-saving maternal healthcare.</p>
          </div> */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <video
              src="/assets/videos/about-joyfund-intro-vid.mp4"
              className="w-full h-full min-h-[320px]"
              controls
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A2E]">Active JoyFunds</h2>
              <p className="text-gray-500 text-sm mt-1">Your gift makes a real difference</p>
            </div>
            <Link href="/explore" className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--primary)' }}>
              See all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-[#1A1A2E]">Voices from the Community</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm italic leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--primary)' }}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1A2E]">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg, #1D38DB, #1DB1DB)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">Your celebration could save a life</h2>
          <p className="text-white/80 mb-8">It takes 2 minutes to create a JoyFund. Your network does the rest.</p>
          <Link href="/dashboard/donor/campaigns/create" className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all" style={{ color: 'var(--secondary)' }}>
            Start Your JoyFund <Heart size={18} className="fill-current" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1A1A2E] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/10">
                  <img
                    src="/assets/joyfund-logo-half-removebg-preview.png"
                    alt="JoyFund logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-black text-lg">JoyFund</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-xs">Your Joy Saves Lives - a transparent crowdfunding platform turning celebrations into maternal healthcare across Cameroon.</p>
            </div>
            <div>
              <p className="font-semibold mb-3 text-sm">Platform</p>
              <div className="flex flex-col gap-2 text-white/60 text-sm">
                {[['Explore Campaigns', '/explore'], ['About JoyFund', '/about'], ['Leaderboard', '/leaderboard'], ['Sign In', '/login']].map(([l, h]) => (
                  <Link key={h} href={h} className="hover:text-white">{l}</Link>
                ))}
              </div>
            </div>

          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-white/40 text-xs">
            <p>© 2026 JoyFund - Solidarity Health Bridge. All rights reserved.</p>
            <p>Built for Cameroon, with love 🇨🇲</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
