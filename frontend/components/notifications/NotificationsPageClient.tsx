"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Bell, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import {
  listNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { useI18n } from "@/locales/client";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TYPE_COLORS: Record<string, string> = {
  WELCOME: "bg-blue-100 text-blue-700",
  SYSTEM: "bg-gray-100 text-gray-700",
  ANNOUNCEMENT: "bg-purple-100 text-purple-700",
  ALERT: "bg-red-100 text-red-700",
  CAMPAIGN_UPDATE: "bg-amber-100 text-amber-700",
  DONATION_RECEIVED: "bg-green-100 text-green-700",
  DONATION_SENT: "bg-green-100 text-green-700",
  BENEFICIARY_UPDATE: "bg-teal-100 text-teal-700",
  PAYMENT_NOTIFICATION: "bg-indigo-100 text-indigo-700",
  VERIFICATION_STATUS: "bg-cyan-100 text-cyan-700",
  SUPPORT_TICKET: "bg-orange-100 text-orange-700",
};

function NotificationTypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${TYPE_COLORS[type] || "bg-gray-100 text-gray-600"}`}
    >
      {type.replace(/_/g, " ")}
    </span>
  );
}

export default function NotificationsPageClient() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Notification | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      return await listNotifications(token);
    },
    enabled: !!token,
  });

  const notifications: Notification[] =
    (data as any)?.results ||
    (Array.isArray(data) ? (data as Notification[]) : []);

  const unreadCount = notifications.filter(
    (n) => !n.is_read,
  ).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new Error("No token");
      return markNotificationAsRead(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markUnread = useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new Error("No token");
      return markNotificationAsUnread(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No token");
      return markAllNotificationsAsRead(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (!token) throw new Error("No token");
      return deleteNotification(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setSelected(null);
    },
  });

  const handleRowClick = useCallback(
    (n: Notification) => {
      setSelected(n);
      if (!n.is_read) markRead.mutate(n.id);
    },
    [markRead],
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {t("dashboard.notifications.title")}
          </h1>
          <p className="text-gray-500 text-sm">
            {t("dashboard.notifications.subtitle")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="gap-2"
          >
            <Eye size={14} />
            {t("dashboard.notifications.markAllRead")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Bell size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm">
            {t("dashboard.notifications.empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleRowClick(n)}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-sm ${
                !n.is_read
                  ? "bg-blue-50/50 border-blue-100"
                  : "bg-white border-gray-100"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.is_read ? "bg-blue-500" : "bg-transparent"}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {n.title}
                  </h3>
                  <NotificationTypeBadge type={n.notification_type} />
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {formatDate(n.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              <NotificationTypeBadge type={selected?.notification_type || ""} />
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              {selected?.message}
            </p>
            {selected?.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {selected?.description}
              </p>
            )}
            {selected?.created_at && (
              <p className="text-xs text-gray-400">
                {formatDate(selected.created_at)}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {selected?.action_url && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => window.open(selected.action_url!, "_blank")}
              >
                <ExternalLink size={12} />
                {t("dashboard.notifications.visit")}
              </Button>
            )}
            {selected && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  selected.is_read
                    ? markUnread.mutate(selected.id)
                    : markRead.mutate(selected.id)
                }
              >
                {selected.is_read ? (
                  <EyeOff size={12} />
                ) : (
                  <Eye size={12} />
                )}
                {selected.is_read
                  ? t("dashboard.notifications.markUnread")
                  : t("dashboard.notifications.markRead")}
              </Button>
            )}
            {selected && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => deleteMut.mutate(selected.id)}
                disabled={deleteMut.isPending}
              >
                <Trash2 size={12} />
                {t("dashboard.notifications.delete")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
