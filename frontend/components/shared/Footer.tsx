"use client";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/locales/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon } from "@hugeicons/core-free-icons";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useI18n();

  return (
    <footer className="bg-[#1A1A2E] text-white py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/10">
                <Image
                  src="/assets/joyfund-logo-half-removebg-preview.webp"
                  alt="JoyFund logo"
                  width={32}
                  height={32}
                  loading="eager"
                  className="w-full h-full object-contain"
                />
              </div>
              {/* <span className="font-black text-lg">JoyFund</span> */}
              <div className="font-black text-lg">
                <span className="text-[#80B034]">Joy</span>
                <span className="text-[#3D77B9]">Fund</span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
            <a
              href="https://wa.me/237681065173?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all mt-4"
            >
              {t("nav.talkWithUs")}
              <HugeiconsIcon icon={WhatsappIcon} size={18} />
            </a>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm">{t("footer.platform")}</p>
            <div className="flex flex-col gap-2 text-white/60 text-sm">
              {[
                [t("footer.exploreCampaigns"), "/explore"],
                [t("footer.about"), "/about"],
                [t("footer.howItWorks"), "/how-to-start"],
                [t("footer.leaderboard"), "/leaderboard"],
                [t("footer.pricingFees"), "/pricing"],
                [t("footer.supportedCountries"), "/countries"],
                [t("footer.signIn"), "/login"],
              ].map(([l, h]) => (
                <Link
                  key={h}
                  href={h}
                  className="hover:text-white transition-colors"
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm">{t("footer.legal")}</p>
            <div className="flex flex-col gap-2 text-white/60 text-sm">
              {[
                [t("footer.terms"), "/terms"],
                [t("footer.privacy"), "/privacy"],
              ].map(([l, h]) => (
                <Link
                  key={h}
                  href={h}
                  className="hover:text-white transition-colors"
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-white/55 text-xs">
          <p>{t("footer.copyright", { year: currentYear })}</p>
          <p>{t("footer.builtFor")} 🇨🇲</p>
        </div>
      </div>
    </footer>
  );
}
