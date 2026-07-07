"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useI18n } from "@/locales/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon } from "@hugeicons/core-free-icons";

const roleDashboardMap: Record<string, string> = {
  DONOR: "/dashboard/donor",
  SYSTEM_ADMIN: "/dashboard/system-admin",
  HOSPITAL_ADMIN: "/dashboard/hospital-admin",
  RECEPTIONIST: "/dashboard/receptionist",
  SOCIAL_WORKER: "/dashboard/social-worker",
};

export default function Navbar({
  transparent = false,
}: {
  transparent?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const t = useI18n();

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.impact"), href: "/#make-an-impact" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.explore"), href: "/explore" },
  ];

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isLoggedIn = status === "authenticated" && !isSigningOut;
  const useDark = (transparent || pathname === "/") && !scrolled && !mobileOpen;
  const userRole = session?.role || session?.user?.role || "";
  const dashboardHref = roleDashboardMap[userRole] || "/dashboard";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setMobileOpen(false);

    try {
      queryClient.clear();
      await signOut({ redirect: false });
      router.replace("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleLogoClick = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <nav
      className={`${
        useDark
          ? "absolute top-0 left-0"
          : "fixed top-0 left-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm"
      } w-full z-50 px-6 md:px-12 py-4 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className={`flex items-center gap-1 md:gap-2 font-black text-xs sm:text-sm md:text-lg lg:text-xl tracking-tight shrink-0 ${useDark ? "text-white" : "text-[#1A1A2E]"}`}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl overflow-hidden shrink-0">
            <Image
              src="/assets/joyfund-logo-half-removebg-preview.webp"
              alt="JoyFund logo"
              width={32}
              height={32}
              loading="eager"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-lg md:text-xl">
            <span className="text-[#80B034]">Joy</span>
            <span className="text-[#3D77B9]">Fund</span>
          </div>
        </button>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors whitespace-nowrap ${
                useDark
                  ? "text-white/85 hover:text-white"
                  : "text-gray-600 hover:text-[#3D77B9]"
              } ${
                pathname === link.href
                  ? "font-semibold underline underline-offset-4"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          <LocaleSwitcher dark={useDark} />
          {isLoggedIn ? (
            <>
              {userRole && (
                <Link
                  href={dashboardHref}
                  className="bg-[#3D77B9] hover:bg-[#1530c4] text-white text-xs lg:text-sm font-semibold px-3 lg:px-5 py-2 lg:py-2.5 rounded-full transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  {t("nav.dashboard")}
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className={`text-xs lg:text-sm font-medium transition-colors px-2 lg:px-3 py-2 ${
                  useDark
                    ? "text-white/85 hover:text-white"
                    : "text-gray-600 hover:text-[#3D77B9]"
                }`}
              >
                {t("nav.signOut")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-xs lg:text-sm font-medium transition-colors px-2 lg:px-3 py-2 ${
                  useDark
                    ? "text-white/85 hover:text-white"
                    : "text-gray-600 hover:text-[#3D77B9]"
                }`}
              >
                {t("nav.signIn")}
              </Link>
              <Link
                href="/dashboard/donor/campaigns/create"
                className="bg-[#3D77B9] hover:bg-[#1530c4] text-white text-xs lg:text-sm font-semibold px-3 lg:px-5 py-2 lg:py-2.5 rounded-full transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                {t("nav.startCampaign")}
              </Link>
              <Link
                href="https://wa.me/237650537465?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex text-sm bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold px-5 py-2.5 rounded-full transition-all items-center gap-2 whitespace-nowrap"
              >
                {t("nav.talkWithUs")}
                <HugeiconsIcon icon={WhatsappIcon} size={18} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <LocaleSwitcher dark={useDark} />

          <button
            className={`md:hidden ${useDark ? "text-white" : "text-[#1A1A2E]"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-6 px-6 flex flex-col gap-4 border-t border-gray-100">
          {/* <LocaleSwitcher dark={false} /> */}
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-gray-700 hover:text-[#3D77B9] font-medium transition-colors ${
                pathname === link.href ? "font-semibold text-[#3D77B9]" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            {isLoggedIn ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileOpen(false)}
                  className="bg-[#1DB1DB] text-white font-semibold px-5 py-3 rounded-full text-center"
                >
                  {t("nav.dashboard")}
                </Link>
                <button
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleSignOut();
                  }}
                  className="border border-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-full text-center"
                >
                  {t("nav.signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="border border-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-full text-center"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="bg-[#1DB1DB] text-white font-semibold px-5 py-3 rounded-full text-center"
                >
                  {t("nav.createAccount")}
                </Link>
                <a
                  href="https://wa.me/237650537465?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue"
                  onClick={() => setMobileOpen(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white font-semibold px-5 py-3 rounded-full text-center transition-all"
                >
                  {t("nav.talkWithUs")}
                  <HugeiconsIcon icon={WhatsappIcon} size={18} />
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
