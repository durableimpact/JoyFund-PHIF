"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { TicketList } from "@/components/support";
import { listMyTickets } from "@/actions/support";
import { Loader2 } from "lucide-react";

export default function DonorSupportPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["my-tickets", token],
    queryFn: () => listMyTickets(token),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const tickets: SupportTicket[] = ticketsData?.results || [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Support</h1>
          <p className="text-gray-500 text-sm">
            Get help with your account or report issues
          </p>
        </div>
      </div>

      <TicketList
        tickets={tickets}
        showCreateButton={true}
        basePath="/dashboard/donor"
        showCreatedBy={false}
      />
    </>
  );
}
