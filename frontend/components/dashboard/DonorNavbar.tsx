"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Heart,
  History,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  {
    label: "Dashboard",
    href: "/dashboard/donor",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "My Campaigns",
    href: "/dashboard/donor/campaigns",
    icon: <Heart size={16} />,
  },
  {
    label: "My Donations",
    href: "/dashboard/donor/donations",
    icon: <History size={16} />,
  },
];

export default function DonorNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const userInfo = (session?.user as any)?.userInfo;
  const initials =
    userInfo?.first_name && userInfo?.last_name
      ? (userInfo.first_name[0] + userInfo.last_name[0]).toUpperCase()
      : session?.user?.name
        ? session.user.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "U";
  const displayName =
    userInfo?.first_name || session?.user?.name?.split(" ")[0] || "User";

  const handleLogout = async () => {
    setSigningOut(true);
    queryClient.clear();
    await signOut({ redirect: true, redirectTo: "/login" });
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard/donor" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-gray-100">
            <img
              src="/assets/joyfund-logo-half-removebg-preview.webp"
              alt="JoyFund"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-black text-[#1A1A2E] text-sm hidden sm:block">
            JoyFund
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isRoot = /^\/dashboard\/[^/]+$/.test(link.href);
            const active = isRoot
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#1DB1DB]/10 text-[#1DB1DB]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition outline-none">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ background: "#1DB1DB" }}
                  >
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                    {displayName}
                  </span>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{session?.user?.email}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/donor/profile")}
              >
                <User size={16} />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/donor/devices")}
              >
                <Shield size={16} />
                Security & Devices
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
                disabled={signingOut}
              >
                {signingOut ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogOut size={16} />
                )}
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900 p-1"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const isRoot = /^\/dashboard\/[^/]+$/.test(link.href);
            const active = isRoot
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#1DB1DB]/10 text-[#1DB1DB]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
