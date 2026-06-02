'use client';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1A2E] text-white py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
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
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Your Joy Saves Lives - a transparent crowdfunding platform turning celebrations into maternal healthcare across Cameroon.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm">Platform</p>
            <div className="flex flex-col gap-2 text-white/60 text-sm">
              {[
                ['Explore Campaigns', '/explore'],
                ['About JoyFund', '/about'],
                ['Leaderboard', '/leaderboard'],
                ['Sign In', '/login'],
              ].map(([l, h]) => (
                <Link key={h} href={h} className="hover:text-white transition-colors">
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-3 text-sm">Legal</p>
            <div className="flex flex-col gap-2 text-white/60 text-sm">
              {[
                ['Terms of Service', '/terms'],
                ['Privacy Policy', '/privacy'],
              ].map(([l, h]) => (
                <Link key={h} href={h} className="hover:text-white transition-colors">
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-white/40 text-xs">
          <p>© {currentYear} JoyFund - Solidarity Health Bridge. All rights reserved.</p>
          <p>Built for Cameroon, with love 🇨🇲</p>
        </div>
      </div>
    </footer>
  );
}
