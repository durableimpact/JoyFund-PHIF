"use client";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Reveal from "@/components/shared/Reveal";
import { useI18n } from "@/locales/client";
import {
  ArrowRight,
  CalendarDays,
  Newspaper,
  BookOpen,
  Mail,
  CheckCircle2,
  Send,
} from "lucide-react";
import React, { useState } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";

const TEAL = "#0B7B63";

const newsItems = [
  {
    date: "18 Aug 2026",
    tag: "Launch Announcement",
    title: "Launching of JoyFund",
    excerpt:
      "We are proud to announce the official launch of JoyFund - a community-powered platform that mobilises local philanthropy to help vulnerable women and newborns access essential care across Cameroon.",
    href: "/about#our-story",
    featured: true,
  },
  {
    date: "05 Sep 2026",
    tag: "Milestone",
    title: "Your Joy Saves Lives Campaign Goes Live",
    excerpt:
      "Our flagship campaign is empowering communities to turn celebrations like weddings, birthdays, and milestones into life-saving maternal and newborn care.",
    href: "/explore",
    featured: false,
  },
  {
    date: "12 Sep 2026",
    tag: "Community",
    title: "JoyFund Reaches New Communities",
    excerpt:
      "Through local partners and hospital networks, JoyFund is extending its reach to more underserved mothers and newborns across the country.",
    href: "/about#our-approach",
    featured: false,
  },
];

const blogItems = [
  {
    title: "Clevia & Marcel: Our Wedding, Their Healthy Beginning",
    excerpt:
      "Instead of wedding favours, this couple is pre-funding prenatal consultations for five vulnerable pregnant women through their own JoyFund.",
    href: "/campaign/b05b40af-607d-4572-bd7e-556f9d4d7428",
  },
  {
    title: "From Celebration to Care: How a JoyFund Works",
    excerpt:
      "A step-by-step look at how a simple celebration becomes a lifeline for a family that cannot afford essential maternal care.",
    href: "/resources#getting-started",
  },
  {
    title: "Help 'Human Calculator Genesis' Fight Seizures",
    excerpt:
      "Nkeh Genesis Ngwagoh, known across Cameroon for his gift of mental mathematics, is using JoyFund to cover his medical care.",
    href: "/campaign/acc67483-aef9-44a3-ba0a-af19ae048b21",
  },
];

export default function NewsroomPage() {
  const t = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await subscribeToNewsletter(email);
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* ════════════════════════════════════════════════════════════════
          HERO
          ════════════════════════════════════════════════════════════════ */}
      <section
        className="relative z-0 pt-28 md:pt-36 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1EA2A0, #0B7B63)" }}
      >
        <div className="relative z-20 max-w-4xl mx-auto px-6 pb-20 sm:pb-24 text-center">
          <Reveal>
            <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-white/80 mb-6">
              <span className="h-px w-7 bg-white/50" />
              {t("newsroom.page.heroKicker")}
              <span className="h-px w-7 bg-white/50" />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6 drop-shadow-md">
              {t("newsroom.page.heroTitleLine1")}
              <br />
              {t("newsroom.page.heroTitleLine2")}
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-white text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
              {t("newsroom.page.heroDesc")}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <a
              href="#latest-news"
              className="inline-block bg-white font-bold px-8 py-4 rounded-full text-sm hover:opacity-90 transition-all shadow-lg"
              style={{ color: "var(--secondary)" }}
            >
              {t("newsroom.page.heroCta")}
            </a>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          LATEST NEWS
          ════════════════════════════════════════════════════════════════ */}
      <section id="latest-news" className="relative z-10 py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: TEAL }}
              >
                {t("newsroom.page.newsKicker")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] max-w-2xl mx-auto leading-snug">
                {t("newsroom.page.newsTitle")}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto mt-4">
                {t("newsroom.page.newsDesc")}
              </p>
            </div>
          </Reveal>

          {newsItems.map((item, i) =>
            item.featured ? (
              <Reveal key={item.title} delay={i * 80}>
                <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all mb-8 bg-white">
                  <div
                    className="p-8 sm:p-10"
                    style={{ background: "linear-gradient(135deg, #1EA2A0, #0B7B63)" }}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white/80 mb-3">
                      <Newspaper size={14} />
                      <span>{item.tag}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-white/85 text-base leading-relaxed max-w-3xl mb-5">
                      {item.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                        <CalendarDays size={14} />
                        <span>{item.date}</span>
                      </div>
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 bg-white font-bold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-all"
                        style={{ color: "var(--secondary)" }}
                      >
                        {t("newsroom.page.readMore")} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ) : (
              <Reveal key={item.title} delay={i * 80}>
                <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow-md transition-all h-full flex flex-col mb-6">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-3" style={{ color: TEAL }}>
                    <CalendarDays size={14} />
                    <span>{item.date}</span>
                  </div>
                  <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">{item.tag}</p>
                  <h3 className="font-bold text-[#1A1A2E] mb-2 leading-snug">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.excerpt}</p>
                  <Link
                    href={item.href}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-bold transition-all hover:translate-x-0.5"
                    style={{ color: "var(--primary)" }}
                  >
                    {t("newsroom.page.readMore")} <ArrowRight size={14} />
                  </Link>
                </div>
              </Reveal>
            ),
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          BLOG & STORIES
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4" style={{ background: "#F3F9F9" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: TEAL }}
              >
                {t("newsroom.page.blogsKicker")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] max-w-2xl mx-auto leading-snug">
                {t("newsroom.page.blogsTitle")}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto mt-4">
                {t("newsroom.page.blogsDesc")}
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogItems.map((blog, i) => (
              <Reveal key={blog.title} delay={i * 80}>
                <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-semibold mb-3" style={{ color: TEAL }}>
                    <BookOpen size={14} />
                    <span>JoyFund Community</span>
                  </div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2 leading-snug">{blog.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{blog.excerpt}</p>
                  <Link
                    href={blog.href}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-bold transition-all hover:translate-x-0.5"
                    style={{ color: "var(--primary)" }}
                  >
                    {t("newsroom.page.readMore")} <ArrowRight size={14} />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          NEWSLETTER SUBSCRIBE
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div
              className="rounded-3xl p-8 sm:p-10 text-center"
              style={{ background: "linear-gradient(135deg, #1D38DB, #1DB1DB)" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-6">
                <Mail size={26} className="text-white" />
              </div>
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3 text-white/80"
              >
                {t("newsroom.page.newsletterKicker")}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-snug">
                {t("newsroom.page.newsletterTitle")}
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                {t("newsroom.page.newsletterDesc")}
              </p>

              {status === "success" ? (
                <div className="bg-white/15 rounded-2xl p-6 flex flex-col items-center">
                  <CheckCircle2 size={32} className="text-white mb-3" />
                  <p className="text-white font-bold text-lg mb-1">
                    {t("newsroom.page.subscribeSuccessTitle")}
                  </p>
                  <p className="text-white/80 text-sm">
                    {t("newsroom.page.subscribeSuccessDesc")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("newsroom.page.emailPlaceholder")}
                    className="flex-1 rounded-full px-5 py-3.5 text-sm text-[#1A1A2E] placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/60"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center gap-2 bg-white font-bold px-7 py-3.5 rounded-full text-sm hover:opacity-90 transition-all disabled:opacity-70"
                    style={{ color: "var(--secondary)" }}
                  >
                    {status === "loading"
                      ? t("newsroom.page.subscribing")
                      : t("newsroom.page.subscribe")}
                    <Send size={15} />
                  </button>
                </form>
              )}

              {status === "error" && (
                <p className="mt-4 text-sm text-white bg-white/15 rounded-full px-4 py-2 inline-block">
                  {t("newsroom.page.subscribeError")}
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
