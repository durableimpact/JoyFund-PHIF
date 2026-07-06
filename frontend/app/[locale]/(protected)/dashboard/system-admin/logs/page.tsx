"use client";
import { useI18n } from '@/locales/client';
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  RefreshCw,
  User,
} from "lucide-react";
import { useUrlSearchParams } from "@/hooks/use-url-search-params";
import { Badge } from "@/components/ui/badge";
import Paginator from "@/components/shared/Paginator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listActivityLogs,
  listRequestLogs,
  listErrorLogs,
  getLogStats,
} from "@/actions/logs";
import { getUsers } from "@/actions/accounts";

type LogTab = "activity" | "requests" | "errors";
const PAGE_SIZE = 15;

export default function AdminLogs() {
  const { data: session } = useSession();
  const [params, setParams] = useUrlSearchParams(
    { tab: "activity", page: 1, userId: "" },
    { page: Number }
  );
  const tab = (params.tab as LogTab) || "activity";
  const currentPage = Number(params.page) || 1;
  const userId = (params.userId as string) || "";
  const setPage = (p: number) => setParams({ page: p });
  const setUserFilter = (id: string) => setParams({ userId: id || "", page: 1 });
  const [selectedLog, setSelectedLog] = useState<
    ActivityLog | RequestLog | ErrorLog | null
  >(null);
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;

  const handleTabChange = (newTab: LogTab) => {
    setParams({ tab: newTab, page: 1, userId });
  };

  const { data: usersData } = useQuery({
    queryKey: ["admin-users-list", token],
    queryFn: async () => {
      const res = await getUsers(token!, { page_size: 500 });
      return res?.results || [];
    },
    enabled: !!token,
  });

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ["logs-activity", token, currentPage, userId],
    queryFn: async () => {
      const res = await listActivityLogs(token!, {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
        ...(userId ? { user_id: userId } : {}),
      });
      return res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && tab === "activity",
  });

  const { data: requestData, isLoading: loadingRequests } = useQuery({
    queryKey: ["logs-requests", token, currentPage, userId],
    queryFn: async () => {
      const res = await listRequestLogs(token, {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
        ...(userId ? { user_id: userId } : {}),
      });
      return res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && tab === "requests",
  });

  const { data: errorData, isLoading: loadingErrors } = useQuery({
    queryKey: ["logs-errors", token, currentPage, userId],
    queryFn: async () => {
      const res = await listErrorLogs(token, {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
        ...(userId ? { user_id: userId } : {}),
      });
      return res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && tab === "errors",
  });

  const activeData =
    tab === "activity"
      ? activityData
      : tab === "requests"
        ? requestData
        : errorData;
  const logs = activeData?.results || [];
  const totalCount = activeData?.count || 0;
  const hasNextPage = !!activeData?.next;
  const hasPreviousPage = !!activeData?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const loading =
    tab === "activity"
      ? loadingActivity
      : tab === "requests"
        ? loadingRequests
        : loadingErrors;

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const { data: stats } = useQuery<LogStats>({
    queryKey: ["logs-stats", token],
    queryFn: () => getLogStats(token),
    enabled: !!token,
  });

  const TABS: { key: LogTab; label: string; icon: React.ReactNode }[] = [
    { key: "activity", label: "Activity", icon: <Activity size={14} /> },
    { key: "requests", label: "Requests", icon: <Globe size={14} /> },
    { key: "errors", label: "Errors", icon: <AlertCircle size={14} /> },
  ];

  const refetch = () => {
    window.location.reload();
  };

  const formatFieldLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatFieldValue = (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }
    if (typeof value === "boolean") {
      return value ? "True" : "False";
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Logs</h1>
          <p className="text-gray-500 text-sm">
            Platform activity, API requests, and errors
          </p>
        </div>
        <button
          onClick={refetch}
          className="btn-outline text-sm flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-xl font-black" style={{ color: "#471DDB" }}>
              {stats.activity_count}
            </div>
            <div className="text-xs text-gray-500">Total Activity</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl font-black" style={{ color: "#1DB1DB" }}>
              {stats.request_count}
            </div>
            <div className="text-xs text-gray-500">API Requests</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl font-black" style={{ color: "#ef4444" }}>
              {stats.error_count}
            </div>
            <div className="text-xs text-gray-500">Errors</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key
                ? "text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
            style={tab === t.key ? { background: "#471DDB" } : {}}
          >
            {t.icon} {t.label}
          </button>
        ))}

        {/* User filter */}
        <div className="ml-auto flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <Select
            value={userId || "__all__"}
            onValueChange={(val) => setUserFilter(val && val !== "__all__" ? val : "")}
          >
            <SelectTrigger className="w-[220px]" size="sm">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All users</SelectItem>
              {usersData?.map((u: UnifiedUser) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <FileText size={32} className="mx-auto mb-3 opacity-40" />
            No {tab} logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="border-b border-gray-100">
                  {tab === "activity" &&
                    ["User", "Action", "Level", "Description", "Time"].map(
                      (h) => (
                        <TableHead
                          key={h}
                          className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </TableHead>
                      ),
                    )}
                  {tab === "requests" &&
                    [
                      "Method",
                      "Path",
                      "View Name",
                      "Action",
                      "Status",
                      "Duration",
                      "IP",
                      "Time",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </TableHead>
                    ))}
                  {tab === "errors" &&
                    ["Type", "Message", "Path", "Time"].map((h) => (
                      <TableHead
                        key={h}
                        className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, i) => (
                  <TableRow
                    key={(log as ActivityLog | RequestLog | ErrorLog).id || i}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {tab === "activity" && (
                      <>
                        <TableCell className="p-4 text-xs text-gray-700">
                          {(log as ActivityLog).actor_label || "—"}
                        </TableCell>
                        <TableCell className="p-4 text-xs font-mono text-blue-600">
                          {(log as ActivityLog).action || "—"}
                        </TableCell>
                        <TableCell className="p-4">
                          <span
                            className={`badge text-[10px] ${
                              (log as ActivityLog).level === "ERROR"
                                ? "bg-red-100 text-red-600"
                                : (log as ActivityLog).level === "WARNING"
                                  ? "bg-amber-100 text-amber-600"
                                  : (log as ActivityLog).level === "CRITICAL"
                                    ? "bg-red-200 text-red-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {(log as ActivityLog).level}
                          </span>
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-600 max-w-xs truncate">
                          {(log as ActivityLog).description ||
                            (log as ActivityLog).action}
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-400">
                          {(log as ActivityLog).created_at
                            ? new Date(
                                (log as ActivityLog).created_at,
                              ).toLocaleString()
                            : "—"}
                        </TableCell>
                      </>
                    )}
                    {tab === "requests" && (
                      <>
                        <TableCell className="p-4">
                          <span
                            className={`badge text-xs font-mono ${
                              (log as RequestLog).method === "GET"
                                ? "bg-blue-100 text-blue-700"
                                : (log as RequestLog).method === "POST"
                                  ? "bg-green-100 text-green-700"
                                  : (log as RequestLog).method === "DELETE"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {(log as RequestLog).method}
                          </span>
                        </TableCell>
                        <TableCell className="p-4 text-xs font-mono text-gray-700 max-w-xs truncate">
                          {(log as RequestLog).path}
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-600 max-w-xs truncate">
                          {(log as RequestLog).view_name || "—"}
                        </TableCell>
                        <TableCell className="p-4 text-xs font-mono text-purple-600 max-w-xs truncate">
                          {(log as RequestLog).action || "—"}
                        </TableCell>
                        <TableCell className="p-4">
                          <span
                            className={`badge text-xs ${(log as RequestLog).status_code >= 400 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {(log as RequestLog).status_code}
                          </span>
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-500">
                          {(log as RequestLog).response_time_ms}ms
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-500">
                          {(log as RequestLog).ip_address || "—"}
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-400">
                          {(log as RequestLog).created_at
                            ? new Date(
                                (log as RequestLog).created_at,
                              ).toLocaleString()
                            : "—"}
                        </TableCell>
                      </>
                    )}
                    {tab === "errors" && (
                      <>
                        <TableCell className="p-4">
                          <span className="badge bg-red-100 text-red-600 text-[10px]">
                            {(log as ErrorLog).error_type}
                          </span>
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-700 max-w-xs truncate">
                          {(log as ErrorLog).error_message}
                        </TableCell>
                        <TableCell className="p-4 text-xs font-mono text-gray-500 max-w-37.5 truncate">
                          {(log as ErrorLog).path || "—"}
                        </TableCell>
                        <TableCell className="p-4 text-xs text-gray-400">
                          {(log as ErrorLog).created_at
                            ? new Date(
                                (log as ErrorLog).created_at,
                              ).toLocaleString()
                            : "—"}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalCount > PAGE_SIZE && (
          <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Log Details
              <Badge variant="outline" className="font-medium">
                {tab}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Complete log information for audit and troubleshooting.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 px-6 py-4 overflow-y-auto">
            {selectedLog && (
              <div className="space-y-4">
                {Object.entries(selectedLog as Record<string, unknown>).map(
                  ([key, value]) => {
                    const formatted = formatFieldValue(value);
                    const isJsonLike =
                      typeof value === "object" && value !== null;

                    return (
                      <div
                        key={key}
                        className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 sm:gap-4 border-b border-gray-50 pb-3"
                      >
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {formatFieldLabel(key)}
                        </div>
                        {isJsonLike ? (
                          <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                            {formatted}
                          </pre>
                        ) : (
                          <div className="text-sm text-gray-800 break-normal">
                            {formatted}
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
