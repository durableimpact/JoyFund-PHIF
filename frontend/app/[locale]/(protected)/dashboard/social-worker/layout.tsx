"use client";

import React from "react";
import { LayoutDashboard, Users, User, Shield, Bell, HelpCircle, ClipboardCheck } from "lucide-react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";
import { useI18n } from "@/locales/client";

export default function SocialWorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useI18n();

  const NAV: NavItem[] = [
    { label: t('dashboard.sidebar.overview'), href: "/dashboard/social-worker", icon: <LayoutDashboard size={16} /> },
    { label: t('dashboard.sidebar.beneficiaries'), href: "/dashboard/social-worker/beneficiaries", icon: <Users size={16} /> },
    { label: t('dashboard.sidebar.campaignReviews'), href: "/dashboard/social-worker/campaign-reviews", icon: <ClipboardCheck size={16} /> },
    { label: t('dashboard.sidebar.notifications'), href: "/dashboard/social-worker/notifications", icon: <Bell size={16} /> },
    { label: t('dashboard.sidebar.security'), href: "/dashboard/social-worker/devices", icon: <Shield size={16} /> },
    { label: t('dashboard.sidebar.support'), href: "/dashboard/social-worker/support", icon: <HelpCircle size={16} /> },
    { label: t('dashboard.sidebar.profile'), href: "/dashboard/social-worker/profile", icon: <User size={16} /> },
  ];

  return (
    <ProtectedRoute requiredRole="SOCIAL_WORKER">
      <DashboardShell
        navItems={NAV}
        accentColor="#0D9488"
        brandLabel={t('systemAdmin.users.tabSocialWorkers')}
        brandSub={t('socialWorker.dashboard.title')}
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
