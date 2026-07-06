"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { TicketDetail } from "@/components/support";
import { getTicket } from "@/actions/support";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { DetailPageSkeleton } from "@/components/shared/PageSkeletons";
import { useI18n } from "@/locales/client";

export default function DonorTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const t = useI18n();
  const { ticketId } = use(params);
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support-ticket", token, ticketId],
    queryFn: () => getTicket(ticketId, token),
    enabled: !!token && !!ticketId,
  });

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('donor.support.ticketNotFound')}</p>
        <Link href="/dashboard/donor/support" className="text-indigo-600 hover:underline">
          {t('donor.support.backToTickets')}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/donor/support"
          className="text-gray-400 hover:text-gray-600"
        >
          {t('donor.support.back')}
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {t('donor.support.ticketTitle', { number: ticket.ticket_number })}
          </h1>
          <p className="text-gray-500 text-sm">{ticket.subject}</p>
        </div>
      </div>

      <TicketDetail
        ticket={ticket}
        isSystemAdmin={false}
        basePath="/dashboard/donor"
      />
    </>
  );
}
