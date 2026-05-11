'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { useStore } from '@/store/useStore';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About', href: '/about' },
  { label: 'Explore', href: '/explore' },
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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { currentRole, currentUser, logout } = useStore();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isActive = (href: string) => pathname === href;
  const isLoggedIn = currentRole !== 'guest';

  const bg = transparent && !scrolled && !open
    ? 'bg-transparent'
    : 'bg-white/95 backdrop-blur-sm shadow-sm';

  const textColor = transparent && !scrolled && !open ? 'text-white' : 'text-[#1A1A2E]';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: 'var(--primary)' }}>
              J
            </div>
            <span className={`font-black text-lg ${textColor}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              JoyFund
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:opacity-80 ${
                  isActive(link.href)
                    ? 'font-bold'
                    : ''
                } ${textColor}`}
                style={isActive(link.href) ? { color: 'var(--primary)' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                {roleLinks[currentRole] && (
                  <Link href={roleLinks[currentRole].href} className="btn-primary text-sm py-2 px-4">
                    {roleLinks[currentRole].label}
                  </Link>
                )}
                <button
                  onClick={() => { logout(); router.push('/'); }}
                  className={`text-sm font-medium ${textColor} hover:opacity-70`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/create" className="btn-secondary text-sm py-2 px-4">
                  Start a JoyFund
                </Link>
                <Link href="/login" className="btn-outline text-sm py-2 px-4">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className={`md:hidden p-2 ${textColor}`}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`py-2 text-sm font-medium ${isActive(link.href) ? 'font-bold' : 'text-[#1A1A2E]'}`}
              style={isActive(link.href) ? { color: 'var(--primary)' } : {}}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            {isLoggedIn ? (
              <>
                {roleLinks[currentRole] && (
                  <Link href={roleLinks[currentRole].href} onClick={() => setOpen(false)} className="btn-primary text-sm py-2.5">
                    {roleLinks[currentRole].label}
                  </Link>
                )}
                <button onClick={() => { logout(); setOpen(false); router.push('/'); }} className="btn-outline text-sm py-2.5">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/create" onClick={() => setOpen(false)} className="btn-secondary text-sm py-2.5">
                  Start a JoyFund
                </Link>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline text-sm py-2.5">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
