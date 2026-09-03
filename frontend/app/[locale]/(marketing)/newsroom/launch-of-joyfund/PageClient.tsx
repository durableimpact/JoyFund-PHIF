"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/shared/Navbar";
import Reveal from "@/components/shared/Reveal";
import { useI18n } from "@/locales/client";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Newspaper,
  Camera,
} from "lucide-react";

const TEAL = "#0B7B63";

const galleryImages = [
  { src: "/assets/images/joyfund-launch/joyfund-launch-2.jpg", alt: "JoyFund launch" },
  { src: "/assets/images/joyfund-launch/joyfund-launch-3.jpg", alt: "JoyFund launch" },
  { src: "/assets/images/joyfund-launch/joyfund-launch-4.jpg", alt: "JoyFund launch" },
  { src: "/assets/images/joyfund-launch/joyfund-launch-5.jpg", alt: "JoyFund launch" },
  { src: "/assets/images/joyfund-launch/joyfund-launch-6.jpg", alt: "JoyFund launch" },
  { src: "/assets/images/joyfund-launch/joyfund-launch-7.jpg", alt: "JoyFund launch" },
  { src: "/assets/images/joyfund-launch/joyfund-launch-8.jpg", alt: "JoyFund launch" },
  { src: "/assets/images/joyfund-launch/joyfund-launch-9.jpg", alt: "JoyFund launch" },
];

export default function LaunchOfJoyFundPage() {
  const t = useI18n();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      {/* ════════════════════════════════════════════════════════════════
          ARTICLE HERO - full-bleed cover image
          ════════════════════════════════════════════════════════════════ */}
      <section className="relative z-0 pt-28 md:pt-36 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/images/joyfund-launch/joyfund-launch-1.jpg"
            alt="Launching of JoyFund"
            fill
            sizes="100vw"
            priority
            className="object-cover object-center"
          />
        </div>
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(100deg, rgba(4,10,9,0.7) 0%, rgba(4,10,9,0.45) 60%, rgba(4,10,9,0.55) 100%)",
          }}
        />

        <div className="relative z-20 max-w-4xl mx-auto px-6 pb-20 sm:pb-24 text-center">
          <Reveal>
            <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest text-white/80 mb-6">
              <span className="h-px w-7 bg-white/50" />
              {t("newsroom.launch.kicker")}
              <span className="h-px w-7 bg-white/50" />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-5 drop-shadow-md">
              {t("newsroom.launch.heroTitle")}
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <div className="flex items-center justify-center gap-2 text-white/85 text-sm font-medium">
              <CalendarDays size={16} />
              <span>{t("newsroom.launch.date")}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          ARTICLE BODY
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb / back link */}
          <Reveal>
            <Link
              href="/newsroom"
              className="inline-flex items-center gap-2 text-sm font-bold transition-colors hover:opacity-70 mb-10"
              style={{ color: "var(--primary)" }}
            >
              <ArrowLeft size={16} /> {t("newsroom.launch.backButton")}
            </Link>
          </Reveal>

          <div className="space-y-6 text-gray-600 text-base sm:text-lg leading-relaxed">
            <Reveal>
              <p>{t("newsroom.launch.body1")}</p>
            </Reveal>
            <Reveal>
              <p>
                <span className="font-bold" style={{ color: TEAL }}>
                  JoyFund
                </span>{" "}
                {t("newsroom.launch.body2")}
              </p>
            </Reveal>

            {/* Featured inline image */}
            <Reveal>
              <div className="my-8">
                <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-md">
                  <Image
                    src="/assets/images/joyfund-launch/joyfund-launch-2.jpg"
                    alt="JoyFund launch celebration"
                    fill
                    sizes="(min-width: 768px) 768px, 100vw"
                    className="object-cover"
                  />
                </div>
                <p
                  className="mt-3 text-xs font-medium text-gray-400 text-center"
                >
                  JoyFund Launch - 27 June 2026
                </p>
              </div>
            </Reveal>

            <Reveal>
              <p>{t("newsroom.launch.body3")}</p>
            </Reveal>

            <Reveal>
              <div
                className="rounded-2xl p-6 sm:p-7 my-8"
                style={{ background: "#F3F9F9" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(11,123,99,0.12)" }}
                  >
                    <Newspaper size={18} style={{ color: TEAL }} />
                  </div>
                  <h2
                    className="text-lg sm:text-xl font-black text-[#1A1A2E]"
                  >
                    {t("newsroom.launch.body4")}
                  </h2>
                </div>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {t("newsroom.launch.heroDateLine")}
                </p>
              </div>
            </Reveal>

            <Reveal>
              <p>{t("newsroom.launch.body5")}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PHOTO GALLERY
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4" style={{ background: "#F3F9F9" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3 flex items-center justify-center gap-2"
                style={{ color: TEAL }}
              >
                <Camera size={14} /> {t("newsroom.launch.galleryTitle")}
              </p>
              <h2
                className="text-2xl sm:text-3xl font-black text-[#1A1A2E] leading-snug"
              >
                {t("newsroom.launch.galleryTitle")}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xl mx-auto mt-4">
                {t("newsroom.launch.galleryDesc")}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {galleryImages.map((img, i) => (
              <Reveal key={img.src} delay={(i % 4) * 60}>
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden shadow-sm group">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          BACK CTA
          ════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A2E] mb-6">
              {t("newsroom.launch.backTitle")}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Link
              href="/newsroom"
              className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-sm hover:opacity-90 transition-all shadow-md"
              style={{ background: "linear-gradient(135deg, #1EA2A0, #0B7B63)", color: "#fff" }}
            >
              {t("newsroom.launch.backButton")} <ChevronRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
