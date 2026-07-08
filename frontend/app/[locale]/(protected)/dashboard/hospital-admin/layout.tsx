"use client";

import React from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  Users,
  Ticket,
  Repeat,
  HeartPulse,
  Stethoscope,
  User,
  Shield,
  Bell,
  HelpCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";
import { useI18n } from "@/locales/client";

export default function HospitalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useI18n();
  const { data: session } = useSession();
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalName = userInfo?.hospital?.name;

  const NAV: NavItem[] = [
    { label: t('dashboard.sidebar.overview'), href: "/dashboard/hospital-admin", icon: <LayoutDashboard size={16} /> },
    { label: t('dashboard.sidebar.patients'), href: "/dashboard/hospital-admin/patients", icon: <HeartPulse size={16} /> },
    { label: t('hospitalAdmin.receptionist.title'), href: "/dashboard/hospital-admin/receptionist", icon: <Users size={16} /> },
    { label: t('hospitalAdmin.services.title'), href: "/dashboard/hospital-admin/services", icon: <Stethoscope size={16} /> },
    { label: t('dashboard.sidebar.vouchers'), href: "/dashboard/hospital-admin/vouchers", icon: <Ticket size={16} /> },
    { label: t('hospitalAdmin.medicalClaim.title'), href: "/dashboard/hospital-admin/medical-claim", icon: <ClipboardCheck size={16} /> },
    { label: t('hospitalAdmin.topUp.title'), href: "/dashboard/hospital-admin/top-up", icon: <Repeat size={16} /> },
    { label: t('dashboard.sidebar.disbursements'), href: "/dashboard/hospital-admin/disbursement", icon: <FileText size={16} /> },
    { label: t('dashboard.sidebar.notifications'), href: "/dashboard/hospital-admin/notifications", icon: <Bell size={16} /> },
    { label: t('dashboard.sidebar.security'), href: "/dashboard/hospital-admin/devices", icon: <Shield size={16} /> },
    { label: t('dashboard.sidebar.support'), href: "/dashboard/hospital-admin/support", icon: <HelpCircle size={16} /> },
    { label: t('dashboard.sidebar.profile'), href: "/dashboard/hospital-admin/profile", icon: <User size={16} /> },
  ];

  return (
    <ProtectedRoute requiredRole={"HOSPITAL_ADMIN"}>
      <DashboardShell
        navItems={NAV}
        accentColor="#1D75DB"
        brandLabel={t('systemAdmin.users.tabHospitalAdmins')}
        brandSub={t('hospitalAdmin.dashboard.title')}
        hospitalName={hospitalName}
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
