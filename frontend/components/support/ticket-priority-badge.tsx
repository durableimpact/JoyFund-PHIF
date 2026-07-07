"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/locales/client";

const priorityStyles: Record<TicketPriority, string> = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityKeys: Record<TicketPriority, string> = {
  LOW: "support.low",
  MEDIUM: "support.medium",
  HIGH: "support.high",
  URGENT: "support.urgent",
};

export function TicketPriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  const t = useI18n();
  return (
    <Badge variant="secondary" className={cn(priorityStyles[priority], className)}>
      {t(priorityKeys[priority] as any, {})}
    </Badge>
  );
}
