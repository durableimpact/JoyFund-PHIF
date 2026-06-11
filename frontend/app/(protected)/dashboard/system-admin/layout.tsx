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
} from "lucide-react";
import DashboardShell, { NavItem } from "../../_components/DashboardShell";
import { ProtectedRoute } from "@/components/protected-route";

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard/system-admin",
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: "Accounts",
    href: "/dashboard/system-admin/accounts",
    icon: <Wallet size={16} />,
  },
  {
    label: "Transactions",
    href: "/dashboard/system-admin/transactions",
    icon: <ArrowLeftRight size={16} />,
  },
  {
    label: "Fee Splits",
    href: "/dashboard/system-admin/fee-splits",
    icon: <Percent size={16} />,
  },
  {
    label: "Gateways",
    href: "/dashboard/system-admin/gateways",
    icon: <Globe size={16} />,
  },
  {
    label: "Campaigns",
    href: "/dashboard/system-admin/campaigns",
    icon: <Megaphone size={16} />,
  },
  {
    label: "Hospitals",
    href: "/dashboard/system-admin/hospitals",
    icon: <Building2 size={16} />,
  },
  {
    label: "Vouchers",
    href: "/dashboard/system-admin/vouchers",
    icon: <Ticket size={16} />,
  },
  {
    label: "Beneficiaries",
    href: "/dashboard/system-admin/beneficiaries",
    icon: <Users size={16} />,
  },
  {
    label: "Analytics",
    href: "/dashboard/system-admin/analytics",
    icon: <BarChart2 size={16} />,
  },
  {
    label: "Disbursements",
    href: "/dashboard/system-admin/disbursements",
    icon: <FileText size={16} />,
  },
  {
    label: "Logs",
    href: "/dashboard/system-admin/logs",
    icon: <FileText size={16} />,
  },
  {
    label: "Users",
    href: "/dashboard/system-admin/users",
    icon: <Users size={16} />,
  },
  {
    label: "Profile",
    href: "/dashboard/system-admin/profile",
    icon: <User size={16} />,
  },
];

export default function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="SYSTEM_ADMIN">
      <DashboardShell
        navItems={NAV}
        accentColor="#471DDB"
        brandLabel="System Admin"
        brandSub="Full platform oversight"
      >
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
