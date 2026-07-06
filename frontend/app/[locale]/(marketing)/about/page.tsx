"use client";
import Link from "next/link";
import Image from "next/image";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/shared/Navbar";
import {
  Heart,
  ArrowRight,
  Sparkles,
  HandHeart,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   Static content - tied to the JoyFund / Durable Impact project document
   ──────────────────────────────────────────────────────────────────────── */

const pressQuotes = [
  {
    name: "Durable Impact",
    quote:
      "JoyFund: Strengthening Social Health Protection through Digital Solidarity in Cameroon - a mobile-first platform converting celebration into care.",
  },
  {
    name: "Cameroon Health Coverage",
    quote:
      "Linked to MTN MoMo and Orange Money, JoyFund settles medical bills directly with partner hospitals - preventing detention over unpaid bills.",
  },
];

const differentiators = [
  {
    icon: HandHeart,
    title: "Rooted in Community Solidarity",
    desc: "Cameroonians have always pooled resources for each other. JoyFund digitalises this culture of mutual aid into a structured, sustainable People's Health Fund.",
  },
  {
    icon: ShieldCheck,
    title: "Verified, never anonymous",
    desc: "Every beneficiary is identified and vetted by social workers in partnership with hospitals and community structures before a single voucher is issued.",
  },
  {
    icon: Smartphone,
    title: "Built for how Cameroon pays",
    desc: "Donations and payouts run on MTN Mobile Money and Orange Money, with vouchers redeemed directly at partner hospitals - no cash, no detours.",
  },
];

const partners = [
  {
    name: "Durable Impact",
    img: "https://durableimpact.org/assets/durable-impact-logo-removebg-preview.jpg",
  },
  {
    name: "Campay",
    img: "https://campay.net/static/v2/custom_assets/images/images/logo.png",
  },
  {
    name: "Partner Hospitals",
    img: "/assets/images/partner-hosptital-removebg-preview.png",
    // img: "data:image/jpeg;base64,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",
  },
  // {
  //   name: "MTN MoMo & Orange Money",
  //   img: "data:image/png;base64,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",
  // },
];

/* ──────────────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>About JoyFund</title>
        <meta
          name="description"
          content="JoyFund turns Cameroon's culture of celebration and community mutual aid into a transparent People's Health Fund for vulnerable mothers and elderly people."
        />
        <link rel="canonical" href="https://joy-fund.com/about" />
      </Helmet>

      <Navbar />

      {/* ════════════════════════════════════════════════════════════════
          HERO - About page (full-bleed image behind everything)
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background image */}
        <Image
          src="/assets/images/elderly-hospital-image-gemini.webp"
          alt="Elderly patient receiving care from a doctor"
          fill
          className="object-cover"
        />
        {/* Overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(232,237,252,0.92) 0%, rgba(232,237,252,0.78) 35%, rgba(20,30,70,0.35) 70%, rgba(20,30,70,0.55) 100%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A2E] mb-4">
            About JoyFund
          </h1>
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            JoyFund turns everyday celebrations - birthdays, weddings,
            graduations, promotions - into a community health pooling platform that funds safe
            deliveries and emergency care for vulnerable mothers and elderly
            people across Cameroon. A project of{" "}
            <span className="font-semibold text-[#1A1A2E]">Durable Impact</span>
            .
          </p>
        </div>

        {/* Press quote cards, sitting over the lower part of the image */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 mt-72 sm:mt-80 md:mt-96">
          <div className="grid sm:grid-cols-2 gap-4">
            {pressQuotes.map((p) => (
              <div
                key={p.name}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-3"
              >
                <span className="text-sm font-black text-[#1A1A2E]">
                  {p.name}
                </span>
                <p className="text-gray-500 text-sm leading-relaxed italic">
                  &ldquo;{p.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW WE'RE DIFFERENT
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] text-center mb-14">
            How We&apos;re Different
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p className="font-bold text-[#1A1A2E] mb-4 leading-relaxed">
                At JoyFund, we&apos;ve built a platform that turns
                Cameroon&apos;s culture of solidarity into measurable,
                transparent healthcare impact.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Formal health insurance coverage in Cameroon remains extremely
                low, and existing subsidy schemes rarely reach the poorest
                households. Families are left to pay out of pocket - exposing
                them to catastrophic costs and, too often, forcing a choice
                between healthcare and basic needs.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                At the same time, Cameroonians have strong traditions of mutual
                aid - community pooling groups, alumni giving, diaspora support - and
                widespread access to mobile money. JoyFund channels that
                existing generosity into a structured People&apos;s Health Fund.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Every JoyFund campaign you create - for a birthday, a wedding, a
                graduation, a promotion - adds to a shared, trackable fund that
                pays hospital bills directly for verified, vulnerable
                beneficiaries.
              </p>
            </div>
            <div className="relative rounded-3xl overflow-hidden h-72 sm:h-80">
              <Image
                src="https://images.unsplash.com/photo-1676281050264-178eff38874a?w=1200&auto=format&fit=crop"
                alt="Mother and newborn receiving care"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Differentiator cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {differentiators.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-gray-100 p-6"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(29,56,219,0.08)" }}
                >
                  <d.icon size={22} style={{ color: "var(--primary)" }} />
                </div>
                <h3 className="font-black text-[#1A1A2E] mb-2">{d.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT STARTED - founder / origin story
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] text-center mb-12">
            How It Started
          </h2>
 
          <p className="font-bold text-[#1A1A2E] mb-4">
            Hi, I&apos;m Dr. Eric Kepeh Moh - Founder / CEO of Durable Impact and the
            person behind JoyFund.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Want to know how and why JoyFund started? I&apos;d love to fill you
            in.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            For years, I watched the same story repeat itself across
            hospitals in Cameroon: a mother arrives in labour, the family
            scrambles for cash, and a delay of even a few hours can mean the
            difference between life and death. Meanwhile, every week, someone
            in our community is celebrating a birthday, a wedding, a
            graduation, a promotion - and spending money on gifts that are
            forgotten within days.
          </p>
 
          <div className="my-12 text-center">
            <p className="text-2xl sm:text-3xl font-black text-[#1A1A2E] leading-snug max-w-lg mx-auto">
              &ldquo;This was the perfect time to turn celebration into
              care.&rdquo;
            </p>
          </div>
 
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            I wanted to build a platform that made it easy, joyful, and
            rewarding to give - one that fits naturally into the moments
            people already celebrate. More ways to mark a milestone. More
            ways to make that milestone matter to someone else.
          </p>
 
          <div className="relative rounded-3xl overflow-hidden my-10 h-64 sm:h-80">
            <Image
              src="/assets/images/joyfund-hero-image.webp"
              alt="Community health workers and volunteers"
              fill
              className="object-cover"
            />
          </div>
 
          <h3 className="font-bold text-[#1A1A2E] mb-3">
            Turning community solidarity into a national health fund.
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            That&apos;s when JoyFund was born - a digital pooled-giving platform linked
            directly to MTN Mobile Money and Orange Money, designed so that
            every donation becomes a care voucher a verified beneficiary can
            redeem at a partner hospital.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            We started with a simple goal: reduce maternal and elderly-related
            deaths by removing financial barriers to essential care - one
            celebration at a time.
          </p>
 
          <p className="font-bold text-[#1A1A2E] mb-3">
            The impact is already real.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Every JoyFund campaign - whether it raises a few thousand or
            hundreds of thousands of XAF - feeds a transparent People&apos;s
            Health Fund. Working with social workers and partner hospitals
            across Cameroon, from Yaoundé to remote districts, we&apos;re
            building a system where hospital detention for unpaid bills
            becomes a thing of the past.
          </p>
 
          <div className="my-12 text-center">
            <p className="text-2xl sm:text-3xl font-black text-[#1A1A2E] leading-snug max-w-lg mx-auto">
              &ldquo;I hope you&apos;ll become part of the JoyFund
              journey.&rdquo;
            </p>
          </div>
 
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Most importantly, we continue to work on making giving simple,
            joyful, and powerful - and on making sure every contribution is
            fully traceable, from your celebration to a real person&apos;s
            care.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            If you have questions, ideas, or want to partner with us, please
            reach out. To your celebration&apos;s success - and to someone
            else&apos;s safe delivery.
          </p>
 
          <p className="font-bold text-[#1A1A2E]">
            Dr. Eric Kepeh Moh & The JoyFund / Durable Impact Team
          </p>
        </div>
      </section>


      {/* <section className="py-20 px-4 bg-[#F9FAFB]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] text-center mb-12">
            How It Started
          </h2>

          <p className="font-bold text-[#1A1A2E] mb-4">
            Hi, I&apos;m Dr. Eric Kepeh Moh, and I work with Durable Impact.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            At Durable Impact, our work starts the same way every time: we look
            for problems that are quietly costing people their health, their
            dignity, or their lives - and we build practical tools to solve
            them. JoyFund is one of those problems. It won&apos;t be the last.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            The problem we kept seeing across hospitals in Cameroon was
            painfully consistent: a mother arrives in labour, the family
            scrambles for cash, and a delay of even a few hours can be the
            difference between life and death. Elderly patients face the same
            wall - held back from care, or held at the hospital afterwards,
            simply because the bill hasn&apos;t been paid.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            At the same time, we noticed something else: every week, someone in
            our community is celebrating a birthday, a wedding, a graduation, a
            promotion - and spending money on gifts that are forgotten within
            days. Two problems, sitting side by side, looking like they belonged
            to completely different worlds.
          </p>

          <div className="my-12 text-center">
            <p className="text-2xl sm:text-3xl font-black text-[#1A1A2E] leading-snug max-w-lg mx-auto">
              &ldquo;We saw the perfect time to turn celebration into
              care.&rdquo;
            </p>
          </div>

          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            That&apos;s how we approach every problem at Durable Impact: find
            the resource that already exists, and the gap that already exists,
            and build the bridge between them. In this case, the resource was
            Cameroon&apos;s deep culture of solidarity - community pooling groups, alumni
            giving, diaspora support - and the gap was a structured way to turn
            that solidarity into healthcare access.
          </p>

          <div className="relative rounded-3xl overflow-hidden my-10 h-64 sm:h-80">
            <Image
              src="https://images.unsplash.com/photo-1531983412531-1f49a365ffed?w=1200&auto=format&fit=crop"
              alt="Community health workers and volunteers"
              fill
              className="object-cover"
            />
          </div>

          <h3 className="font-bold text-[#1A1A2E] mb-3">
            Turning community solidarity into a national health fund.
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            That&apos;s when JoyFund was born - a digital pooled-giving platform linked directly
            to MTN Mobile Money and Orange Money, designed so that every
            donation becomes a care voucher a verified beneficiary can redeem at
            a partner hospital.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            We built it around a simple goal: reduce maternal and
            elderly-related deaths by removing financial barriers to essential
            care - one celebration at a time.
          </p>

          <p className="font-bold text-[#1A1A2E] mb-3">
            The impact is already taking shape.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Every JoyFund campaign - whether it raises a few thousand or
            hundreds of thousands of XAF - feeds a transparent People&apos;s
            Health Fund. Working with social workers and partner hospitals
            across Cameroon, from Yaoundé to remote districts, we&apos;re
            building a system where hospital detention for unpaid bills becomes
            a thing of the past.
          </p>

          <div className="my-12 text-center">
            <p className="text-2xl sm:text-3xl font-black text-[#1A1A2E] leading-snug max-w-lg mx-auto">
              &ldquo;We hope you&apos;ll become part of the JoyFund
              journey.&rdquo;
            </p>
          </div>

          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Most importantly, we continue to work on making giving simple,
            joyful, and powerful - and on making sure every contribution is
            fully traceable, from your celebration to a real person&apos;s care.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            If you have questions, ideas, or want to partner with us, please
            reach out. To your celebration&apos;s success - and to someone
            else&apos;s safe delivery.
          </p>

          <p className="font-bold text-[#1A1A2E]">
            Dr. Eric Kepeh Moh & The Durable Impact Team
          </p>
        </div>
      </section> */}

      {/* ════════════════════════════════════════════════════════════════
          DUAL CTA BANNERS - Discover / Create
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6">
          <div className="relative rounded-3xl overflow-hidden h-48 sm:h-56 flex items-center">
            <Image
              src="/assets/images/elderly-hospital-image-gemini.webp"
              alt="Donors supporting a JoyFund campaign"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 px-8">
              <h3 className="text-white text-xl sm:text-2xl font-black mb-4 leading-snug">
                Discover JoyFunds
                <br />
                near you
              </h3>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 bg-white font-bold px-6 py-3 rounded-full text-sm"
                style={{ color: "var(--secondary)" }}
              >
                Fund Someone <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden h-48 sm:h-56 flex items-center">
            <Image
              src="https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200&auto=format&fit=crop"
              alt="Person celebrating a milestone"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 px-8">
              <h3 className="text-white text-xl sm:text-2xl font-black mb-4 leading-snug">
                Create
                <br />
                your JoyFund
              </h3>
              <Link
                href="/dashboard/donor/campaigns/create"
                className="inline-flex items-center gap-2 bg-white font-bold px-6 py-3 rounded-full text-sm"
                style={{ color: "var(--secondary)" }}
              >
                Start Fundraising <Heart size={16} className="fill-current" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PARTNERS / FEATURED IN
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-[#F9FAFB]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-8 text-gray-400">
            Our Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
  {partners.map((p) => (
    <div key={p.name} className="flex flex-col items-center gap-3">
      <Image
        src={p.img}
        alt={p.name}
        width={128}
        height={64}
        className="h-16 w-32 object-contain"
      />

      <span className="text-sm font-medium text-gray-600 text-center">
        {p.name}
      </span>
    </div>
  ))}
</div>
          {/* <p className="text-gray-400 text-xs mt-6 max-w-md mx-auto">
            Logos shown are placeholders from Unsplash - swap in official
            Durable Impact, Campay, and partner hospital logos when available.
          </p> */}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════════════════════════ */}
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
