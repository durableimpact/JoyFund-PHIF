"use client";

import { useSession } from "next-auth/react";
import { TicketForm } from "@/components/support";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/locales/client";

export default function DonorNewTicketPage() {
  const t = useI18n();
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/donor/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('donor.support.createTicket')}</h1>
          <p className="text-muted-foreground">
            {t('donor.support.createTicketSubtitle')}
          </p>
        </div>
      </div>

      <TicketForm basePath="/dashboard/donor" />
    </div>
  );
}
