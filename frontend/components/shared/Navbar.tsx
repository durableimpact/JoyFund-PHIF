"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Impact", href: "/#make-an-impact" },
  // { label: 'How it Works', href: '/#how-it-works' },
  { label: "About", href: "/about" },
  { label: "Explore", href: "/explore" },
];

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

  return (
    <nav
      className={`${
        useDark
          ? "absolute top-0 left-0"
          : "fixed top-0 left-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm"
      } w-full z-50 px-6 md:px-12 py-4 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2 font-black text-xl tracking-tight ${useDark ? "text-white" : "text-[#1A1A2E]"}`}
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/10">
            <Image
              src="/assets/joyfund-logo-half-removebg-preview.webp"
              alt="JoyFund logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          JoyFund
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                useDark
                  ? "text-white/85 hover:text-white"
                  : "text-gray-600 hover:text-[#1D38DB]"
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
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {userRole && (
                <Link
                  href={dashboardHref}
                  className="bg-[#1D38DB] hover:bg-[#1530c4] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className={`text-sm font-medium transition-colors px-3 py-2 ${
                  useDark
                    ? "text-white/85 hover:text-white"
                    : "text-gray-600 hover:text-[#1D38DB]"
                }`}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-medium transition-colors px-3 py-2 ${
                  useDark
                    ? "text-white/85 hover:text-white"
                    : "text-gray-600 hover:text-[#1D38DB]"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/dashboard/donor/campaigns/create"
                className="bg-[#1D38DB] hover:bg-[#1530c4] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
              >
                Start a JoyFund
              </Link>
              <a
                href="https://wa.me/237650537465?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] hover:text-[#1fb855] text-sm font-semibold px-5 py-2.5 rounded-full transition-all flex items-center gap-2"
              >
                Talk with us →
              </a>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden ${useDark ? "text-white" : "text-[#1A1A2E]"}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-6 px-6 flex flex-col gap-4 border-t border-gray-100">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-gray-700 hover:text-[#1D38DB] font-medium transition-colors ${
                pathname === link.href ? "font-semibold text-[#1D38DB]" : ""
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
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleSignOut();
                  }}
                  className="border border-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-full text-center"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="border border-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-full text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="bg-[#1DB1DB] text-white font-semibold px-5 py-3 rounded-full text-center"
                >
                  Create Account
                </Link>
                <a
                  href="https://wa.me/237650537465?text=Hi%2C%20I%20am%20from%20the%20joyfund%20app%2C%20I%20have%20an%20issue"
                  onClick={() => setMobileOpen(false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366]font-semibold px-5 py-3 rounded-full text-center"
                >
                  Talk with us →
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
