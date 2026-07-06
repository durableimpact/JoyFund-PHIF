"use client";

import { TicketForm } from "@/components/support";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/locales/client";

export default function SocialWorkerNewTicketPage() {
  const t = useI18n();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/social-worker/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t("socialWorker.support.createTitle")}</h1>
          <p className="text-muted-foreground">
            {t("socialWorker.support.createSubtitle")}
          </p>
        </div>
      </div>

      <TicketForm basePath="/dashboard/social-worker" />
    </div>
  );
}
