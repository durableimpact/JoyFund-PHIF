"use client";

import React from "react";
import {
  LayoutDashboard,
  Search,
  ClipboardCheck,
  Ticket,
  User,
  Shield,
  HelpCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";
import { useI18n } from "@/locales/client";

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useI18n();
  const { data: session } = useSession();
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalName = userInfo?.hospital?.name;

  const NAV: NavItem[] = [
    { label: t('dashboard.sidebar.overview'), href: "/dashboard/receptionist", icon: <LayoutDashboard size={16} /> },
    { label: t('receptionist.dashboard.processVoucher'), href: "/dashboard/receptionist/process", icon: <Search size={16} /> },
    { label: t('dashboard.sidebar.vouchers'), href: "/dashboard/receptionist/vouchers", icon: <Ticket size={16} /> },
    { label: t('receptionist.claims.title'), href: "/dashboard/receptionist/claims", icon: <ClipboardCheck size={16} /> },
    { label: t('dashboard.sidebar.security'), href: "/dashboard/receptionist/devices", icon: <Shield size={16} /> },
    { label: t('dashboard.sidebar.support'), href: "/dashboard/receptionist/support", icon: <HelpCircle size={16} /> },
    { label: t('dashboard.sidebar.profile'), href: "/dashboard/receptionist/profile", icon: <User size={16} /> },
  ];

  return (
    <ProtectedRoute requiredRole={"RECEPTIONIST"}>
      <DashboardShell
        navItems={NAV}
        accentColor="#1D75DB"
        brandLabel={t('systemAdmin.users.tabReceptionists')}
        brandSub={t('receptionist.dashboard.title')}
        hospitalName={hospitalName}
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
