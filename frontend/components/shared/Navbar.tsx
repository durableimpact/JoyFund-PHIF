'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'About JoyFund', href: '/about' },
  { label: 'Explore JoyFunds', href: '/explore' },
  { label: 'Leaderboard', href: '/leaderboard' },
];

const roleLinks: Record<string, { label: string; href: string }> = {
  donor: { label: 'Donor Dashboard', href: '/dashboard' },
  social_worker: { label: 'SW Dashboard', href: '/social-worker/dashboard' },
  admin: { label: 'Admin Dashboard', href: '/admin/dashboard' },
  hospital_admin: { label: 'Hospital Admin', href: '/hospital-admin/dashboard' },
  receptionist: { label: 'Hospital Portal', href: '/hospital/receptionist' },
  nurse: { label: 'Hospital Portal', href: '/hospital/nurse' },
};

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentRole, currentUser, logout } = useStore();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isLoggedIn = currentRole !== 'guest';
  const useDark = (transparent || pathname === '/') && !scrolled && !mobileOpen;

  return (
    <nav
      className={`${
        useDark
          ? 'absolute top-0 left-0'
          : 'fixed top-0 left-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm'
      } w-full z-50 px-6 md:px-12 py-4 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2 font-black text-xl tracking-tight ${useDark ? 'text-white' : 'text-[#1A1A2E]'}`}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>
              J
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
                  ? 'text-white/85 hover:text-white'
                  : 'text-gray-600 hover:text-[#1D38DB]'
              } ${
                pathname === link.href
                  ? 'font-semibold underline underline-offset-4'
                  : ''
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
              {roleLinks[currentRole] && (
                <Link
                  href={roleLinks[currentRole].href}
                  className="bg-[#1D38DB] hover:bg-[#1530c4] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  {roleLinks[currentRole].label}
                </Link>
              )}
              <button
                onClick={() => { logout(); router.push('/'); }}
                className={`text-sm font-medium transition-colors px-3 py-2 ${
                  useDark ? 'text-white/85 hover:text-white' : 'text-gray-600 hover:text-[#1D38DB]'
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
                  useDark ? 'text-white/85 hover:text-white' : 'text-gray-600 hover:text-[#1D38DB]'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/create"
                className="bg-[#1D38DB] hover:bg-[#1530c4] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
              >
                Start a JoyFund
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden ${useDark ? 'text-white' : 'text-[#1A1A2E]'}`}
          onClick={() => setMobileOpen(!mobileOpen)}
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
                pathname === link.href ? 'font-semibold text-[#1D38DB]' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            {isLoggedIn ? (
              <>
                {roleLinks[currentRole] && (
                  <Link
                    href={roleLinks[currentRole].href}
                    onClick={() => setMobileOpen(false)}
                    className="bg-[#1D38DB] text-white font-semibold px-5 py-3 rounded-full text-center"
                  >
                    {roleLinks[currentRole].label}
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileOpen(false); router.push('/'); }}
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
                  href="/create"
                  onClick={() => setMobileOpen(false)}
                  className="bg-[#1D38DB] text-white font-semibold px-5 py-3 rounded-full text-center"
                >
                  Start a JoyFund
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}