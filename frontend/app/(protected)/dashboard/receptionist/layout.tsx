"use client";

import React from "react";
import {
  LayoutDashboard,
  Search,
  ClipboardCheck,
  Ticket,
  User,
  Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/receptionist",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Process Voucher",
    href: "/dashboard/receptionist/process",
    icon: <Search size={16} />,
  },
  {
    label: "Vouchers",
    href: "/dashboard/receptionist/vouchers",
    icon: <Ticket size={16} />,
  },
  {
    label: "My Claims",
    href: "/dashboard/receptionist/claims",
    icon: <ClipboardCheck size={16} />,
  },
  {
    label: "Security",
    href: "/dashboard/receptionist/devices",
    icon: <Shield size={16} />,
  },
  {
    label: "Profile",
    href: "/dashboard/receptionist/profile",
    icon: <User size={16} />,
  },
];

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalName = userInfo?.hospital?.name;

  return (
    <ProtectedRoute requiredRole={"RECEPTIONIST"}>
      <DashboardShell
        navItems={NAV}
        accentColor="#1D75DB"
        brandLabel="Receptionist"
        brandSub="Patient intake & claims"
        hospitalName={hospitalName}
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
