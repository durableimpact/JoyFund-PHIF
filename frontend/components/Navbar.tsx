"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { label: "Home", href: "/" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "About JoyFund", href: "/about" },
    { label: "Explore JoyFunds", href: "/explore" },
    { label: "Leaderboard", href: "/leaderboard" },
    // { label: "Privacy Policy", href: "#" },
  ];

  const isHome = pathname === "/";
  const useDark = transparent || isHome;

  return (
    <nav
      className={`${
        useDark
          ? "absolute top-0 left-0"
          : "relative bg-white border-b border-gray-100 shadow-sm"
      } w-full z-50 px-6 md:px-12 py-4`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className={`font-bold text-xl tracking-tight ${useDark ? "text-white" : "text-gray-900"}`}
        >
          JoyFund
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                useDark
                  ? "text-white/90 hover:text-white"
                  : "text-gray-600 hover:text-blue-600"
              } ${pathname === link.href ? "font-semibold underline underline-offset-4" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="#"
            className={`text-sm font-medium transition-colors px-3 py-2 ${
              useDark ? "text-white/90 hover:text-white" : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Login
          </Link>
          <Link
            href="/start"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
          >
            start a JoyFund
          </Link>
          {/* <div className="w-9 h-9 rounded-full bg-gray-300 overflow-hidden border-2 border-white/40">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop"
              alt="user avatar"
              className="w-full h-full object-cover"
            />
          </div> */}
        </div>

        <button
          className={`md:hidden ${useDark ? "text-white" : "text-gray-800"}`}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-6 px-6 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/start"
            className="bg-blue-600 text-white font-semibold px-5 py-3 rounded-full text-center mt-2"
            onClick={() => setMobileOpen(false)}
          >
            start a JoyFund
          </Link>
        </div>
      )}
    </nav>
  );
}
