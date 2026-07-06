"use client";

import { TicketForm } from "@/components/support";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/locales/client";

export default function ReceptionistNewTicketPage() {
  const t = useI18n();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/receptionist/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('receptionist.support.new.title')}</h1>
          <p className="text-muted-foreground">
            {t('receptionist.support.new.subtitle')}
          </p>
        </div>
      </div>

      <TicketForm basePath="/dashboard/receptionist" />
    </div>
  );
}
