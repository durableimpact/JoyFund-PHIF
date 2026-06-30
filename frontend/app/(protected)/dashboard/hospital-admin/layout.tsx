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
  HelpCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/hospital-admin",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Patients",
    href: "/dashboard/hospital-admin/patients",
    icon: <HeartPulse size={16} />,
  },
  {
    label: "Receptionists",
    href: "/dashboard/hospital-admin/receptionist",
    icon: <Users size={16} />,
  },
  {
    label: "Services",
    href: "/dashboard/hospital-admin/services",
    icon: <Stethoscope size={16} />,
  },
  {
    label: "Vouchers",
    href: "/dashboard/hospital-admin/vouchers",
    icon: <Ticket size={16} />,
  },
  {
    label: "Medical Claims",
    href: "/dashboard/hospital-admin/medical-claim",
    icon: <ClipboardCheck size={16} />,
  },
  {
    label: "Top-Up Requests",
    href: "/dashboard/hospital-admin/top-up",
    icon: <Repeat size={16} />,
  },
  {
    label: "Disbursements",
    href: "/dashboard/hospital-admin/disbursement",
    icon: <FileText size={16} />,
  },
  {
    label: "Security",
    href: "/dashboard/hospital-admin/devices",
    icon: <Shield size={16} />,
  },
  {
    label: "Support",
    href: "/dashboard/hospital-admin/support",
    icon: <HelpCircle size={16} />,
  },
  {
    label: "Profile",
    href: "/dashboard/hospital-admin/profile",
    icon: <User size={16} />,
  },
];

export default function HospitalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalName = userInfo?.hospital?.name;

  return (
    <ProtectedRoute requiredRole={"HOSPITAL_ADMIN"}>
      <DashboardShell
        navItems={NAV}
        accentColor="#1D75DB"
        brandLabel="Hospital Admin"
        brandSub="Hospital management"
        hospitalName={hospitalName}
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
