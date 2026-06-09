"use client";

import React from "react";
import { LayoutDashboard, Users, User } from "lucide-react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/social-worker",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Beneficiaries",
    href: "/dashboard/social-worker/beneficiaries",
    icon: <Users size={16} />,
  },
  {
    label: "Profile",
    href: "/dashboard/social-worker/profile",
    icon: <User size={16} />,
  },
];

export default function SocialWorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="SOCIAL_WORKER">
      <DashboardShell
        navItems={NAV}
        accentColor="#0D9488"
        brandLabel="Social Worker"
        brandSub="Beneficiary management"
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
