import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Low",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  },
  MEDIUM: {
    label: "Medium",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  HIGH: {
    label: "High",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
};

export function TicketPriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
