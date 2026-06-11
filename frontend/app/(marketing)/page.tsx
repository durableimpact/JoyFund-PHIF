"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Heart,
  ArrowRight,
  Star,
  ChevronRight,
  ChevronDown,
  Cake,
  Gift,
  Hospital,
  Sparkles,
  DollarSign,
  ShieldCheck,
  Smartphone,
  Users,
  Globe2,
  HandHeart,
  ClipboardCheck,
  TrendingUp,
  Building2,
  type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Helmet } from "react-helmet-async";
import CampaignCard from "@/components/shared/CampaignCard";
import { listCampaigns, getPlatformStats } from "@/actions/campaigns";
import { useEffect, useState } from "react";

type StepItem = { icon: LucideIcon; step: string; title: string; desc: string };
const steps: StepItem[] = [
  {
    icon: Cake,
    step: "01",
    title: "Celebrate",
    desc: "Create a JoyFund campaign for your birthday, wedding, promotion, or graduation instead of asking for traditional gifts.",
  },
  {
    icon: Gift,
    step: "02",
    title: "Pool",
    desc: "Friends and family donate via MTN MoMo, Orange Money or Bank. The bulk of every contribution goes directly to the healthcare fund.",
  },
  {
    icon: Hospital,
    step: "03",
    title: "Care",
    desc: "A verified vulnerable pregnant woman or elderly person receives a care voucher, redeemable at partner hospitals across Cameroon.",
  },
];

type FeatureItem = { icon: LucideIcon; title: string; desc: string };
const features: FeatureItem[] = [
  {
    icon: Sparkles,
    title: "Easy to Start",
    desc: "Turn any birthday, wedding, graduation or promotion into a JoyFund in just a couple of minutes.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Beneficiaries",
    desc: "Every recipient is screened by social workers and partner hospitals before receiving a care voucher.",
  },
  {
    icon: Smartphone,
    title: "Mobile Money Native",
    desc: "Donate and withdraw seamlessly with MTN MoMo and Orange Money - built for how Cameroonians pay.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Transparency",
    desc: "Track every contribution and voucher on a live dashboard, from donation to delivery room.",
  },
  {
    icon: Users,
    title: "Diaspora Friendly",
    desc: "Support family and community back home from anywhere in the world, in any currency.",
  },
  {
    icon: Hospital,
    title: "Direct Hospital Settlement",
    desc: "Funds go straight to partner hospitals as care vouchers - no cash changes hands, no detained patients.",
  },
  {
    icon: HandHeart,
    title: "Digital Njangi",
    desc: "Built on Cameroon's culture of mutual aid - Njangi and alumni giving, reimagined for healthcare.",
  },
  {
    icon: Globe2,
    title: "Nationwide Reach",
    desc: "From Yaoundé to remote districts, JoyFund connects donors to the communities that need them most.",
  },
  {
    icon: Building2,
    title: "Trusted Partnerships",
    desc: "Backed by formal agreements with hospitals, clinics and community structures across Cameroon.",
  },
];

const testimonials = [
  {
    name: "Jean-Pierre M.",
    role: "Birthday Donor",
    quote:
      "My 30th birthday funded 2 safe deliveries. Nothing could have made this milestone more meaningful.",
    avatar: "JM",
  },
  {
    name: "Solange N.",
    role: "Wedding Donor",
    quote:
      "We asked for JoyFund contributions instead of gifts. Our guests loved it - we raised 234,000 XAF!",
    avatar: "SN",
  },
  {
    name: "Dr. Mireille O.",
    role: "Partner Hospital",
    quote:
      "The voucher system is simple, transparent, and fraud-proof. Exactly what maternal healthcare needs.",
    avatar: "MO",
  },
];

type FaqItem = { q: string; a: string };
const faqs: FaqItem[] = [
  {
    q: "What is JoyFund?",
    a: "JoyFund is a digital Njangi - a platform that turns everyday celebrations like birthdays, weddings, graduations and promotions into a pooled fund that pays for safe deliveries and emergency care for vulnerable pregnant women and elderly people across Cameroon.",
  },
  {
    q: "How do donations reach beneficiaries?",
    a: "Contributions are pooled into the JoyFund and converted into care vouchers. These vouchers are redeemed directly at partner hospitals, so funds go straight to medical bills - never as cash to an individual.",
  },
  {
    q: "How do I donate?",
    a: "You can contribute to any JoyFund campaign using MTN Mobile Money, Orange Money or Bank transfers. The whole process takes less than a minute on your phone.",
  },
  {
    q: "Who is eligible to receive support?",
    a: "Beneficiaries are vulnerable pregnant women, indigent mothers, and elderly persons identified and verified by social workers in partnership with our network of hospitals and community structures.",
  },
  {
    q: "Is JoyFund transparent?",
    a: "Yes. Every donation and every voucher is tracked in real time on our transparency dashboard, and we publish regular public impact reports so donors can see exactly how their celebration created change.",
  },
  {
    q: "What happens to my campaign if I don't reach my goal?",
    a: "Every contribution still flows into the shared healthcare fund and helps a beneficiary - there's no all-or-nothing requirement. Your celebration creates impact no matter the final total.",
  },
];

export default function HomePage() {
  const [feedIdx, setFeedIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const activityFeed = [
    {
      id: 1,
      type: "donation",
      message: "20 XAF contributed to Solange & Eric's Wedding JoyFund",
      timeAgo: "3 hours ago",
    },
    {
      id: 2,
      type: "voucher",
      message: "Voucher JF3R8T generated for BEN-0071",
      timeAgo: "4 hours ago",
    },
  ];

  // Fetch campaigns with React Query
  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => await listCampaigns({ status: "ACTIVE" }),
  });

  // Fetch platform stats with React Query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => await getPlatformStats(),
    initialData: { lives_supported: 0, active_campaigns: 0, total_raised: "0" },
  });

  useEffect(() => {
    const t = setInterval(
      () => setFeedIdx((i: number) => (i + 1) % activityFeed.length),
      3000,
    );
    return () => clearInterval(t);
  }, []);

  const activeCampaigns = (campaignsResponse?.results || []).slice(0, 3);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>JoyFund</title>
        <meta
          name="description"
          content="Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare."
        />
        <link rel="canonical" href="https://joy-fund.com" />
        <meta property="og:title" content="JoyFund" />
        <meta
          property="og:description"
          content="Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare."
        />
        <meta property="og:url" content="https://joy-fund.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joy-fund.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="JoyFund" />
        <meta
          name="twitter:description"
          content="Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare."
        />
        <meta
          name="twitter:image"
          content="https://joy-fund.com/og-image.png"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "JoyFund",
            url: "https://joy-fund.com",
            description:
              "Transparent crowdfunding platform turning celebrations into maternal healthcare across Cameroon.",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://joy-fund.com/explore?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          })}
        </script>
      </Helmet>
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
        {/* <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,20,60,0.58) 0%, rgba(15,30,90,0.38) 38%, rgba(249,250,251,0.90) 80%, #F9FAFB 100%)",
          }}
        /> */}

        <div
          className="absolute inset-0"
          style={{
            background:
  "linear-gradient(to bottom, rgba(10,20,60,0.55) 0%, rgba(15,30,90,0.30) 45%, rgba(249,250,251,0.25) 70%, rgba(249,250,251,0.75) 90%, #F9FAFB 100%)"
             }}
        /> 
        

        {/* Navbar sits on top of everything */}
        <Navbar transparent />

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-24">
          {/* Live toast pill */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8"></div>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8">
            {/* <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" /> */}
              {/* <span className="opacity-90 truncate max-w-xs">{activityFeed[feedIdx].message}</span>
              <span className="opacity-60 hidden sm:inline">{activityFeed[feedIdx].timeAgo}</span> */}
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-md"
            style={{ letterSpacing: "-1px" }}
          >
            Turn your <span style={{ color: "#7de8c0" }}>celebration</span> into
            <br />
            someone&apos;s safe delivery
          </h1>

          {/* Subtext */}
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed drop-shadow">
            JoyFund digitalises Cameroon&apos;s Njangi solidarity - redirecting
            birthday gifts and wedding contributions into a transparent
            People&apos;s Health Insurance Fund for vulnerable pregnant women.
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
              {
                v: stats?.lives_supported,
                l: "Lives Supported",
                // icon: Heart,
                color: "text-rose-300",
              },
              {
                v: stats?.active_campaigns,
                l: "Active Campaigns",
                // icon: Sparkles,
                color: "text-amber-300",
              },
              {
                v: stats?.total_raised,
                l: "XAF Raised",
                // icon: DollarSign,
                color: "text-emerald-300",
              },
            ].map((s) => (
              <div
                key={s.l}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-white border border-white/20 flex flex-col items-center text-center"
              >
                {/* <s.icon size={28} className={`${s.color} mb-2`} /> */}
                <div className="text-lg font-black">{s.v}</div>
                <div className="text-xs opacity-70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Smooth wave into next section */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 40C360 80 1080 0 1440 40V80H0V40Z" fill="#F9FAFB" />
          </svg>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="make-an-impact" className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--primary)" }}
            >
              How It Works
            </p>
            <h2 className="text-3xl font-black text-[#1A1A2E]">
              Celebrate. Pool. Care.
            </h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">
              Three simple steps turn your personal milestone into life-saving
              maternal and emergency healthcare for someone who needs it most.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div
                key={s.step}
                className="card p-8 text-center relative"
              >
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black"
                  style={{ background: "var(--primary)" }}
                >
                  {s.step}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mt-6 mb-5"
                  style={{ background: "rgba(29,56,219,0.08)" }}
                >
                  <s.icon size={26} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="text-lg font-black text-[#1A1A2E] mb-2">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why JoyFund ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-[#1A1A2E]">
              Why Choose JoyFund
            </h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm">
              There are plenty of ways to give. Here&apos;s what makes turning
              your celebration into a JoyFund genuinely worth it.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-6 rounded-2xl hover:shadow-md transition-shadow border border-gray-100"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(29,56,219,0.08)" }}
                >
                  <f.icon size={22} style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A2E] mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Campaigns ── */}
      <section className="py-16 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-[#1A1A2E]">
                Active JoyFunds
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Your gift makes a real difference
              </p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: "var(--primary)" }}
            >
              See all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Impact Model / About ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--primary)" }}
            >
              Our Model
            </p>
            <h2 className="text-3xl font-black text-[#1A1A2E] mb-4">
              From celebration money to a People&apos;s Health Fund
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Cameroonians have always pooled resources for one another through
              Njangi groups and alumni giving. JoyFund brings that same spirit
              online - channelling everyday celebratory contributions from
              friends, family, and the diaspora into a shared fund that pays
              hospital bills directly.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Beneficiaries are vulnerable pregnant women, indigent mothers, and
              elderly persons identified by social workers and verified through
              our partner hospitals. No cash changes hands - every contribution
              becomes a redeemable care voucher, and every voucher is tracked
              from donation to delivery.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full bg-[#F9FAFB] border border-gray-100 text-xs font-semibold text-[#1A1A2E]">
                MTN MoMo & Orange Money
              </span>
              <span className="px-4 py-2 rounded-full bg-[#F9FAFB] border border-gray-100 text-xs font-semibold text-[#1A1A2E]">
                Verified Care Vouchers
              </span>
              <span className="px-4 py-2 rounded-full bg-[#F9FAFB] border border-gray-100 text-xs font-semibold text-[#1A1A2E]">
                Real-Time Transparency
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6 text-center">
              <ClipboardCheck
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                Verified Beneficiaries
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Screened by social workers & partner hospitals
              </p>
            </div>
            <div className="card p-6 text-center">
              <Hospital
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                Direct Hospital Settlement
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Vouchers paid straight to medical bills
              </p>
            </div>
            <div className="card p-6 text-center">
              <Globe2
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                Diaspora Ready
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Give to Cameroon from anywhere in the world
              </p>
            </div>
            <div className="card p-6 text-center">
              <TrendingUp
                size={28}
                className="mx-auto mb-3"
                style={{ color: "var(--primary)" }}
              />
              <p className="text-sm font-bold text-[#1A1A2E]">
                Public Impact Reports
              </p>
              <p className="text-xs text-gray-500 mt-1">
                See exactly where every XAF goes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-[#1A1A2E]">
              Voices from the Community
            </h2>
            <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">
              Real celebrations, real impact, real stories from donors and
              partners across the JoyFund community.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6 bg-white">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm italic leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "var(--primary)" }}
                  >
                    {t.avatar}
                  </div>
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

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-[#1A1A2E]">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 mt-3 text-sm">
              Everything you need to know about turning your celebration into
              someone&apos;s safe delivery.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={f.q}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold text-[#1A1A2E] text-sm sm:text-base">
                    {f.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    style={{ color: "var(--primary)" }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-20 px-4"
        style={{ background: "linear-gradient(135deg, #1D38DB, #1DB1DB)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">
            Your celebration could save a life
          </h2>
          <p className="text-white/80 mb-8">
            It takes 2 minutes to create a JoyFund. Your network does the rest.
          </p>
          <Link
            href="/dashboard/donor/campaigns/create"
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all"
            style={{ color: "var(--secondary)" }}
          >
            Start Your JoyFund <Heart size={18} className="fill-current" />
          </Link>
        </div>
      </section>
    </div>
  );
}






// "use client";
// import { useQuery } from "@tanstack/react-query";
// import Link from "next/link";
// import {
//   Heart,
//   ArrowRight,
//   Star,
//   ChevronRight,
//   Cake,
//   Gift,
//   Hospital,
//   Sparkles,
//   DollarSign,
//   type LucideIcon,
// } from "lucide-react";
// import Navbar from "@/components/shared/Navbar";
// import { Helmet } from "react-helmet-async";
// import CampaignCard from "@/components/shared/CampaignCard";
// import { listCampaigns, getPlatformStats } from "@/actions/campaigns";
// import { useEffect, useState } from "react";

// type StepItem = { icon: LucideIcon; step: string; title: string; desc: string };
// const steps: StepItem[] = [
//   {
//     icon: Cake,
//     step: "01",
//     title: "Celebrate",
//     desc: "Create a JoyFund campaign for your birthday, wedding, promotion, or graduation instead of asking for traditional gifts.",
//   },
//   {
//     icon: Gift,
//     step: "02",
//     title: "Pool",
//     desc: "Friends and family donate via MTN MoMo, Orange Money or Bank. 95% goes directly to the healthcare fund.",
//   },
//   {
//     icon: Hospital,
//     step: "03",
//     title: "Care",
//     desc: "A verified vulnerable pregnant woman receives a care voucher, redeemable at partner hospitals across Cameroon.",
//   },
// ];

// const testimonials = [
//   {
//     name: "Jean-Pierre M.",
//     role: "Birthday Donor",
//     quote:
//       "My 30th birthday funded 2 safe deliveries. Nothing could have made this milestone more meaningful.",
//     avatar: "JM",
//   },
//   {
//     name: "Solange N.",
//     role: "Wedding Donor",
//     quote:
//       "We asked for JoyFund contributions instead of gifts. Our guests loved it - we raised 234,000 XAF!",
//     avatar: "SN",
//   },
//   {
//     name: "Dr. Mireille O.",
//     role: "Partner Hospital",
//     quote:
//       "The voucher system is simple, transparent, and fraud-proof. Exactly what maternal healthcare needs.",
//     avatar: "MO",
//   },
// ];

// export default function HomePage() {
//   const [feedIdx, setFeedIdx] = useState(0);
//   const activityFeed = [
//     {
//       id: 1,
//       type: "donation",
//       message: "20 XAF contributed to Solange & Eric's Wedding JoyFund",
//       timeAgo: "3 hours ago",
//     },
//     {
//       id: 2,
//       type: "voucher",
//       message: "Voucher JF3R8T generated for BEN-0071",
//       timeAgo: "4 hours ago",
//     },
//   ];

//   // Fetch campaigns with React Query
//   const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
//     queryKey: ["campaigns"],
//     queryFn: async () => await listCampaigns({ status: "ACTIVE" }),
//   });

//   // Fetch platform stats with React Query
//   const { data: stats, isLoading: statsLoading } = useQuery({
//     queryKey: ["platform-stats"],
//     queryFn: async () => await getPlatformStats(),
//     initialData: { lives_supported: 0, active_campaigns: 0, total_raised: "0" },
//   });

//   useEffect(() => {
//     const t = setInterval(
//       () => setFeedIdx((i: number) => (i + 1) % activityFeed.length),
//       3000,
//     );
//     return () => clearInterval(t);
//   }, []);

//   const activeCampaigns = (campaignsResponse?.results || []).slice(0, 3);

//   return (
//     <div className="min-h-screen">
//       <Helmet>
//         <title>JoyFund</title>
//         <meta
//           name="description"
//           content="Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare."
//         />
//         <link rel="canonical" href="https://joy-fund.com" />
//         <meta property="og:title" content="JoyFund" />
//         <meta
//           property="og:description"
//           content="Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare."
//         />
//         <meta property="og:url" content="https://joy-fund.com" />
//         <meta property="og:type" content="website" />
//         <meta property="og:image" content="https://joy-fund.com/og-image.png" />
//         <meta name="twitter:card" content="summary_large_image" />
//         <meta name="twitter:title" content="JoyFund" />
//         <meta
//           name="twitter:description"
//           content="Turn your birthday or wedding into a digital Njangi. JoyFund is Cameroon's trusted platform to fund safe deliveries and maternal healthcare."
//         />
//         <meta
//           name="twitter:image"
//           content="https://joy-fund.com/og-image.png"
//         />
//         <script type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebSite",
//             name: "JoyFund",
//             url: "https://joy-fund.com",
//             description:
//               "Transparent crowdfunding platform turning celebrations into maternal healthcare across Cameroon.",
//             potentialAction: {
//               "@type": "SearchAction",
//               target: "https://joy-fund.com/explore?q={search_term_string}",
//               "query-input": "required name=search_term_string",
//             },
//           })}
//         </script>
//       </Helmet>
//       <Navbar transparent />

//       {/* ── Hero ── */}
//       <section className="relative min-h-screen flex flex-col overflow-hidden">
//         {/* Background photo */}
//         {/* "url('https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1600&auto=format&fit=crop')", */}
//         <div
//           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//           style={{
//             backgroundImage:
//               // "url('https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1600&auto=format&fit=crop')",
//               "url('/assets/images/joyfund-hero-image.jpeg')",
//           }}
//         />

//         {/* Soft gradient overlay: dark at top, fades to page bg at bottom */}
//         {/* <div
//           className="absolute inset-0"
//           style={{
//             background:
//               "linear-gradient(to bottom, rgba(10,20,60,0.58) 0%, rgba(15,30,90,0.38) 38%, rgba(249,250,251,0.90) 80%, #F9FAFB 100%)",
//           }}
//         /> */}

//         <div
//           className="absolute inset-0"
//           style={{
//             background:
//   "linear-gradient(to bottom, rgba(10,20,60,0.55) 0%, rgba(15,30,90,0.30) 45%, rgba(249,250,251,0.25) 70%, rgba(249,250,251,0.75) 90%, #F9FAFB 100%)"
//              }}
//         /> 
        

//         {/* Navbar sits on top of everything */}
//         <Navbar transparent />

//         {/* Hero content */}
//         <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-24">
//           {/* Live toast pill */}
//           <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8"></div>
//           <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-white text-xs mb-8">
//             {/* <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" /> */}
//               {/* <span className="opacity-90 truncate max-w-xs">{activityFeed[feedIdx].message}</span>
//               <span className="opacity-60 hidden sm:inline">{activityFeed[feedIdx].timeAgo}</span> */}
//           </div>

//           {/* Headline */}
//           <h1
//             className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-md"
//             style={{ letterSpacing: "-1px" }}
//           >
//             Turn your <span style={{ color: "#7de8c0" }}>celebration</span> into
//             <br />
//             someone&apos;s safe delivery
//           </h1>

//           {/* Subtext */}
//           <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed drop-shadow">
//             JoyFund digitalises Cameroon&apos;s Njangi solidarity - redirecting
//             birthday gifts and wedding contributions into a transparent
//             People&apos;s Health Insurance Fund for vulnerable pregnant women.
//           </p>

//           {/* CTAs */}
//           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
//             <Link
//               href="/dashboard/donor/campaigns/create"
//               className="btn-secondary text-base px-8 py-4 inline-flex items-center gap-2"
//             >
//               Start a JoyFund <Sparkles size={18} className="fill-current" />
//             </Link>
//             <Link
//               href="/explore"
//               className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white border-2 border-white/40 hover:bg-white/10 transition-all"
//             >
//               Explore Joyfunds <ArrowRight size={16} />
//             </Link>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
//             {[
//               {
//                 v: stats?.lives_supported,
//                 l: "Lives Supported",
//                 // icon: Heart,
//                 color: "text-rose-300",
//               },
//               {
//                 v: stats?.active_campaigns,
//                 l: "Active Campaigns",
//                 // icon: Sparkles,
//                 color: "text-amber-300",
//               },
//               {
//                 v: stats?.total_raised,
//                 l: "XAF Raised",
//                 // icon: DollarSign,
//                 color: "text-emerald-300",
//               },
//             ].map((s) => (
//               <div
//                 key={s.l}
//                 className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-white border border-white/20 flex flex-col items-center text-center"
//               >
//                 {/* <s.icon size={28} className={`${s.color} mb-2`} /> */}
//                 <div className="text-lg font-black">{s.v}</div>
//                 <div className="text-xs opacity-70">{s.l}</div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Smooth wave into next section */}
//         <div className="absolute bottom-0 left-0 right-0">
//           <svg
//             viewBox="0 0 1440 80"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path d="M0 40C360 80 1080 0 1440 40V80H0V40Z" fill="#F9FAFB" />
//           </svg>
//         </div>
//       </section>

//       {/* ── How It Works ── */}
//       <section id="make-an-impact" className="py-20 px-4">
//         <div className="max-w-5xl mx-auto">
//           {/* <div className="text-center mb-14">
//             <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--primary)' }}>How It Works</p>
//             <h2 className="text-3xl font-black text-[#1A1A2E]">Celebrate → Pool → Care</h2>
//             <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">Three simple steps transform your personal milestone into life-saving maternal healthcare.</p>
//           </div> */}
//           {/*<div className="relative rounded-3xl overflow-hidden shadow-2xl">
//             <video
//               src="/assets/videos/about-joyfund-intro-vid.mp4"
//               className="w-full h-full min-h-80"
//               controls
//               autoPlay
//               muted
//               loop
//               playsInline
//             />
//           </div>*/}
//         </div>
//       </section>

//       {/* ── Featured Campaigns ── */}
//       <section className="py-16 px-4 bg-white">
//         <div className="max-w-5xl mx-auto">
//           <div className="flex items-center justify-between mb-10">
//             <div>
//               <h2 className="text-2xl font-black text-[#1A1A2E]">
//                 Active JoyFunds
//               </h2>
//               <p className="text-gray-500 text-sm mt-1">
//                 Your gift makes a real difference
//               </p>
//             </div>
//             <Link
//               href="/explore"
//               className="text-sm font-semibold flex items-center gap-1"
//               style={{ color: "var(--primary)" }}
//             >
//               See all <ChevronRight size={16} />
//             </Link>
//           </div>
//           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
//             {activeCampaigns.map((c) => (
//               <CampaignCard key={c.id} campaign={c} />
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── Testimonials ── */}
//       {/*<section className="py-20 px-4">
//         <div className="max-w-5xl mx-auto">
//           <div className="text-center mb-12">
//             <h2 className="text-2xl font-black text-[#1A1A2E]">
//               Voices from the Community
//             </h2>
//           </div>
//           <div className="grid md:grid-cols-3 gap-6">
//             {testimonials.map((t) => (
//               <div key={t.name} className="card p-6">
//                 <div className="flex gap-1 mb-4">
//                   {[...Array(5)].map((_, i) => (
//                     <Star
//                       key={i}
//                       size={14}
//                       className="fill-yellow-400 text-yellow-400"
//                     />
//                   ))}
//                 </div>
//                 <p className="text-gray-600 text-sm italic leading-relaxed mb-5">
//                   &ldquo;{t.quote}&rdquo;
//                 </p>
//                 <div className="flex items-center gap-3">
//                   <div
//                     className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
//                     style={{ background: "var(--primary)" }}
//                   >
//                     {t.avatar}
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-[#1A1A2E]">{t.name}</p>
//                     <p className="text-xs text-gray-500">{t.role}</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>*/}

//       {/* ── CTA Banner ── */}
//       <section
//         className="py-20 px-4"
//         style={{ background: "linear-gradient(135deg, #1D38DB, #1DB1DB)" }}
//       >
//         <div className="max-w-2xl mx-auto text-center">
//           <h2 className="text-3xl font-black text-white mb-4">
//             Your celebration could save a life
//           </h2>
//           <p className="text-white/80 mb-8">
//             It takes 2 minutes to create a JoyFund. Your network does the rest.
//           </p>
//           <Link
//             href="/dashboard/donor/campaigns/create"
//             className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-all"
//             style={{ color: "var(--secondary)" }}
//           >
//             Start Your JoyFund <Heart size={18} className="fill-current" />
//           </Link>
//         </div>
//       </section>
//     </div>
//   );
// }
