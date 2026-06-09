"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X, LogOut } from "lucide-react";
import NotificationsPanel from "@/components/shared/NotificationsPanel";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  accentColor: string; // e.g. '#471DDB'
  brandLabel: string; // e.g. 'System Admin'
  brandSub?: string; // e.g. 'Full platform oversight'
  headerExtra?: React.ReactNode;
  hospitalName?: string; // e.g. 'Central Hospital Yaoundé'
  hideSidebar?: boolean;
}

export default function DashboardShell({
  children,
  navItems = [],
  accentColor,
  brandLabel,
  brandSub,
  headerExtra,
  hospitalName,
  hideSidebar = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const showSidebar = !hideSidebar;
  const mainContainerClass = showSidebar
    ? "flex-1 lg:ml-60 flex flex-col min-h-screen"
    : "flex-1 flex flex-col min-h-screen";

  const handleLogout = async () => {
    setIsSigningOut(true);

    try {
      queryClient.clear();
      await signOut({ redirect: false });
      router.replace("/");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const currentUser = session?.user?.userInfo;
  const initials =
    currentUser?.first_name && currentUser?.last_name
      ? (currentUser.first_name[0] + currentUser.last_name[0]).toUpperCase()
      : session?.user?.name
        ? session.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        : "U";

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/10">
            <img
              src="/assets/joyfund-logo-half-removebg-preview.png"
              alt="JoyFund logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="font-black text-white text-sm leading-tight">
              JoyFund
            </p>
            {brandSub && <p className="text-white/60 text-xs">{brandSub}</p>}
          </div>
        </Link>
        {hospitalName && (
          <div
            className="mt-3 px-1 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <p className="text-white/50 text-[10px] uppercase tracking-wider">
              Hospital
            </p>
            <p className="text-white text-xs font-semibold truncate">
              {hospitalName}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isRoot = /^\/dashboard\/[^/]+$/.test(item.href);
          const active = isRoot
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="shrink-0 w-5">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge !== 0 && (
                <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-all">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {currentUser?.first_name ||
                session?.user?.name?.split(" ")[0] ||
                "User"}
            </p>
            <p className="text-white/50 text-xs truncate">{brandLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            disabled={isSigningOut}
            className="text-white/50 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--background)" }}
    >
      {/* Desktop Sidebar */}
      {showSidebar && (
        <aside
          className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-white/10"
          style={{ background: accentColor }}
        >
          {renderSidebarContent()}
        </aside>
      )}

      {/* Mobile Sidebar Overlay */}
      {showSidebar && sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="flex flex-col w-64"
            style={{ background: accentColor }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-white font-black">JoyFund</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className={mainContainerClass}>
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-3 sticky top-0 z-30">
          {showSidebar && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-1"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="flex-1" />

          {hospitalName && (
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg hidden sm:block">
              {hospitalName}
            </span>
          )}

          {headerExtra}

          <NotificationsPanel />

          {/* User pill */}
          <div className="flex items-center gap-2 pl-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: accentColor }}
            >
              {initials}
            </div>
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">
              {currentUser?.first_name ||
                session?.user?.name?.split(" ")[0] ||
                "User"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
