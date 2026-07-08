"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Ticket,
  BarChart2,
  FileText,
  User,
  Megaphone,
  Wallet,
  Globe,
  Percent,
  ArrowLeftRight,
  Receipt,
  Shield,
  Bell,
  HandHeart,
  Phone,
  Heart,
  HelpCircle,
} from "lucide-react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";
import { useI18n } from "@/locales/client";

export default function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useI18n();

  const NAV: NavItem[] = [
    { label: t('dashboard.sidebar.overview'), href: "/dashboard/system-admin", icon: <LayoutDashboard size={16} /> },
    { label: t('dashboard.sidebar.accounts'), href: "/dashboard/system-admin/accounts", icon: <Wallet size={16} /> },
    { label: "CamPay", href: "/dashboard/system-admin/campay", icon: <Phone size={16} /> },
    { label: t('dashboard.sidebar.transactions'), href: "/dashboard/system-admin/transactions", icon: <ArrowLeftRight size={16} /> },
    { label: t('dashboard.admin.feeSplits'), href: "/dashboard/system-admin/fee-splits", icon: <Percent size={16} /> },
    { label: t('dashboard.admin.feePolicies'), href: "/dashboard/system-admin/fee-policies", icon: <Receipt size={16} /> },
    { label: t('dashboard.sidebar.gateways'), href: "/dashboard/system-admin/gateways", icon: <Globe size={16} /> },
    { label: t('dashboard.sidebar.campaigns'), href: "/dashboard/system-admin/campaigns", icon: <Megaphone size={16} /> },
    { label: t('dashboard.sidebar.donations'), href: "/dashboard/system-admin/donations", icon: <HandHeart size={16} /> },
    { label: t('dashboard.sidebar.hospitals'), href: "/dashboard/system-admin/hospitals", icon: <Building2 size={16} /> },
    { label: t('dashboard.sidebar.vouchers'), href: "/dashboard/system-admin/vouchers", icon: <Ticket size={16} /> },
    { label: t('dashboard.sidebar.beneficiaries'), href: "/dashboard/system-admin/beneficiaries", icon: <Users size={16} /> },
    { label: t('dashboard.sidebar.healthIssues'), href: "/dashboard/system-admin/health-issues", icon: <Heart size={16} /> },
    { label: t('dashboard.sidebar.support'), href: "/dashboard/system-admin/support", icon: <HelpCircle size={16} /> },
    { label: t('dashboard.sidebar.analytics'), href: "/dashboard/system-admin/analytics", icon: <BarChart2 size={16} /> },
    { label: t('dashboard.sidebar.disbursements'), href: "/dashboard/system-admin/disbursements", icon: <FileText size={16} /> },
    { label: t('dashboard.sidebar.logs'), href: "/dashboard/system-admin/logs", icon: <FileText size={16} /> },
    { label: t('dashboard.sidebar.users'), href: "/dashboard/system-admin/users", icon: <Users size={16} /> },
    { label: t('dashboard.sidebar.security'), href: "/dashboard/system-admin/devices", icon: <Shield size={16} /> },
    { label: t('dashboard.sidebar.notifications'), href: "/dashboard/system-admin/notifications", icon: <Bell size={16} /> },
    { label: t('dashboard.sidebar.pushNotifications'), href: "/dashboard/system-admin/push-notifications", icon: <Bell size={16} /> },
    { label: t('dashboard.sidebar.profile'), href: "/dashboard/system-admin/profile", icon: <User size={16} /> },
  ];

  return (
    <ProtectedRoute requiredRole="SYSTEM_ADMIN">
      <DashboardShell
        navItems={NAV}
        accentColor="#471DDB"
        brandLabel={t('systemAdmin.users.tabSystemAdmins')}
        brandSub={t('dashboard.admin.systemOverview')}
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
