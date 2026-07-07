"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/client";

const statusStyles: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  WAITING_FOR_USER: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  RESOLVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const statusKeys: Record<TicketStatus, string> = {
  OPEN: "support.open",
  IN_PROGRESS: "support.inProgress",
  WAITING_FOR_USER: "support.waitingForUser",
  RESOLVED: "support.resolved",
  CLOSED: "support.closed",
};

export function TicketStatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const t = useI18n();
  return (
    <Badge variant="secondary" className={cn(statusStyles[status], className)}>
      {t(statusKeys[status] as any, {})}
    </Badge>
  );
}
