"use client";

import { useI18n } from '@/locales/client';
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { TicketList, TicketStatsCards } from "@/components/support";
import { listTickets, getTicketStats } from "@/actions/support";
import { Loader2 } from "lucide-react";
import { SupportPageSkeleton } from "@/components/shared/PageSkeletons";

export default function SystemAdminSupportPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["support-tickets", token],
    queryFn: () => listTickets(token),
    enabled: !!token,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["support-stats", token],
    queryFn: () => getTicketStats(token),
    enabled: !!token,
  });

  if (ticketsLoading || statsLoading) {
    return <SupportPageSkeleton />;
  }

  const tickets: SupportTicket[] = ticketsData?.results || [];
  const stats: TicketStats = statsData || {
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    tickets_by_category: {} as Record<TicketCategory, number>,
    tickets_by_priority: {} as Record<TicketPriority, number>,
    average_resolution_time_hours: 0,
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Support Tickets</h1>
          <p className="text-gray-500 text-sm">
            Manage and respond to user support requests
          </p>
        </div>
      </div>

      <TicketStatsCards stats={stats} />

      <div className="mt-6">
        <TicketList
          tickets={tickets}
          basePath="/dashboard/system-admin"
          showCreatedBy={true}
        />
      </div>
    </>
  );
}
