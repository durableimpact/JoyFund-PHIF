"use client";

import { useI18n } from '@/locales/client';
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Loader2,
  Send,
  Search,
  Check,
  X,
  Bell,
  Users,
  Globe,
  ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";

import { sendTestPush, getPushTaskStatus } from "@/actions/notifications";
import { getUsers } from "@/actions/accounts";

const ROLE_OPTIONS_RAW: { labelKey: string; value: USER_ROLE }[] = [
  { labelKey: "systemAdmin.pushNotifications.donors", value: "DONOR" },
  { labelKey: "systemAdmin.pushNotifications.hospitalAdmins", value: "HOSPITAL_ADMIN" },
  { labelKey: "systemAdmin.pushNotifications.socialWorkers", value: "SOCIAL_WORKER" },
  { labelKey: "systemAdmin.pushNotifications.receptionists", value: "RECEPTIONIST" },
  { labelKey: "systemAdmin.pushNotifications.systemAdmins", value: "SYSTEM_ADMIN" },
];

type TargetMode = "all" | "roles" | "users";

export default function PushNotificationsPage() {
  const t = useI18n();
  const { data: session } = useSession();
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [actions, setActions] = useState<PushAction[]>([]);
  const ROLE_OPTIONS = ROLE_OPTIONS_RAW.map(r => ({ label: t(r.labelKey as any, {}), value: r.value }));

  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [selectedRoles, setSelectedRoles] = useState<USER_ROLE[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  // Push broadcast task state
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<PushBroadcastTaskStatus | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Poll task status every 2s while task is PENDING or RUNNING
  useEffect(() => {
    if (!taskId || !token) return;

    const isTerminal = (s: string) => s === "COMPLETED" || s === "FAILED";

    if (taskStatus && isTerminal(taskStatus.status)) {
      stopPolling();
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const status = await getPushTaskStatus(token, taskId);
        if (status) {
          setTaskStatus(status);
          if (isTerminal(status.status)) stopPolling();
        }
      } catch {
        stopPolling();
      }
    }, 2000);

    return stopPolling;
  }, [taskId, token, taskStatus, stopPolling]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
      setUserPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [userSearch]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", token, debouncedUserSearch, userPage],
    queryFn: async () => {
      const res = await getUsers(token || "", {
        page: userPage,
        page_size: 10,
        search: debouncedUserSearch || undefined,
      });
      return res;
    },
    enabled: !!token && targetMode === "users",
  });

  const users = usersData?.results || [];

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");

      // Reset task state for new send
      setTaskId(null);
      setTaskStatus(null);
      stopPolling();

      const payload: TestPushPayload = {
        title,
        body,
        url: url || undefined,
        image: imageUrl || undefined,
        actions: actions.length > 0 ? actions : undefined,
        broadcast: false,
      };

      if (targetMode === "all") {
        payload.broadcast = true;
      } else if (targetMode === "roles") {
        payload.user_ids = undefined;
        payload.roles = selectedRoles;
      } else if (targetMode === "users") {
        payload.user_ids = selectedUserIds;
      }

      const result = await sendTestPush(token, payload);
      if (!result) throw new Error("No response from server");

      // 202 = async task dispatched
      if (result.status === 202) {
        const asyncData = result.data as TestPushAsyncResponse;
        setTaskId(asyncData.task_id);
        return { async: true, taskId: asyncData.task_id };
      }

      // 200 = sync (self-test)
      return { async: false, result: result.data };
    },
  });

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleRole = (role: USER_ROLE) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role],
    );
  };

  const canSend =
    title.trim() &&
    body.trim() &&
    (targetMode !== "users" || selectedUserIds.length > 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {t('systemAdmin.pushNotifications.pageTitle')}
          </h1>
          <p className="text-gray-500 text-sm">
            {t('systemAdmin.pushNotifications.pageSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Message Content */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Bell size={16} /> {t('systemAdmin.pushNotifications.message')}
            </h2>

            <div>
              <label className="label-field">{t('systemAdmin.pushNotifications.title')}</label>
              <input
                className="input-field w-full"
                placeholder={t('systemAdmin.pushNotifications.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="label-field">{t('systemAdmin.pushNotifications.body')}</label>
              <textarea
                className="input-field w-full min-h-[100px] resize-y"
                placeholder={t('systemAdmin.pushNotifications.bodyPlaceholder')}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            <div>
              <label className="label-field">
                {t('systemAdmin.pushNotifications.url')} <span className="text-gray-400 font-normal">({t('systemAdmin.pushNotifications.optional')})</span>
              </label>
              <input
                className="input-field w-full"
                placeholder={t('systemAdmin.pushNotifications.urlPlaceholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="label-field">
                {t('systemAdmin.pushNotifications.imageUrl')} <span className="text-gray-400 font-normal">({t('systemAdmin.pushNotifications.optional')})</span>
              </label>
              <input
                className="input-field w-full"
                placeholder={t('systemAdmin.pushNotifications.imageUrlPlaceholder')}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={t('systemAdmin.pushNotifications.previewAlt')}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="label-field">
                {t('systemAdmin.pushNotifications.actionButtons')} <span className="text-gray-400 font-normal">({t('systemAdmin.pushNotifications.optionalMax2')})</span>
              </label>
              <div className="space-y-2">
                {actions.map((action, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      className="input-field flex-1"
                      placeholder={t('systemAdmin.pushNotifications.actionIdPlaceholder')}
                      value={action.action}
                      onChange={(e) => {
                        const next = [...actions];
                        next[idx] = { ...next[idx], action: e.target.value };
                        setActions(next);
                      }}
                    />
                    <input
                      className="input-field flex-1"
                      placeholder={t('systemAdmin.pushNotifications.buttonLabelPlaceholder')}
                      value={action.title}
                      onChange={(e) => {
                        const next = [...actions];
                        next[idx] = { ...next[idx], title: e.target.value };
                        setActions(next);
                      }}
                    />
                    <button
                      onClick={() => setActions(actions.filter((_, i) => i !== idx))}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {actions.length < 2 && (
                  <button
                    onClick={() => setActions([...actions, { action: "", title: "" }])}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#471DDB] transition-colors"
                  >
                    <Plus size={12} /> {t('systemAdmin.pushNotifications.addActionButton')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Target Selection */}
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Users size={16} /> {t('systemAdmin.pushNotifications.recipients')}
            </h2>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "All Users", icon: <Globe size={14} /> },
                  { key: "roles", label: "By Role", icon: <Users size={14} /> },
                  { key: "users", label: "Select Users", icon: <Users size={14} /> },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTargetMode(opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    targetMode === opt.key
                      ? "text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={targetMode === opt.key ? { background: "#471DDB" } : {}}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {targetMode === "roles" && (
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <label
                    key={role.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="accent-[#471DDB]"
                    />
                    <span className="text-xs text-gray-700">{role.label}</span>
                  </label>
                ))}
              </div>
            )}

            {targetMode === "users" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="input-field w-full pl-9"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>

                {selectedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUserIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-medium"
                      >
                        {id.slice(0, 8)}...
                        <button
                          onClick={() => toggleUser(id)}
                          className="hover:text-red-500"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2
                        size={20}
                        className="animate-spin text-gray-400"
                      />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      No users found
                    </div>
                  ) : (
                    users.map((u: UnifiedUser) => (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => toggleUser(u.id)}
                          className="accent-[#471DDB]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {u.first_name} {u.last_name}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">
                            {u.email}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {u.role?.replace(/_/g, " ")}
                        </span>
                      </label>
                    ))
                  )}
                </div>

                {usersData && usersData.count > 10 && (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      disabled={userPage <= 1}
                      onClick={() => setUserPage((p) => p - 1)}
                      className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <span className="text-[10px] text-gray-400">
                      Page {userPage} of{" "}
                      {Math.ceil((usersData.count || 0) / 10)}
                    </span>
                    <button
                      disabled={userPage >= Math.ceil((usersData.count || 0) / 10)}
                      onClick={() => setUserPage((p) => p + 1)}
                      className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSend || mutation.isPending}
            className="btn-admin w-full flex items-center justify-center gap-2 text-sm"
            style={{ background: "#471DDB" }}
          >
            {mutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {mutation.isPending
              ? t('systemAdmin.pushNotifications.sendingBtn')
              : `${t('systemAdmin.pushNotifications.sendNotification')}${
                  targetMode === "users"
                    ? ` (${selectedUserIds.length} ${t('systemAdmin.pushNotifications.user')}${selectedUserIds.length !== 1 ? "s" : ""})`
                    : targetMode === "roles"
                      ? ` (${selectedRoles.length} ${t('systemAdmin.pushNotifications.role')}${selectedRoles.length !== 1 ? "s" : ""})`
                      : ` (${t('systemAdmin.pushNotifications.allUsers')})`
                }`}
          </button>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {mutation.isError && (
            <div className="card p-5 border border-red-200 bg-red-50">
              <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                <X size={16} /> Error
              </h3>
              <p className="text-xs text-red-600 mt-1">
                {String(mutation.error)}
              </p>
            </div>
          )}

          {/* Sync result (self-test) */}
          {mutation.data && !mutation.data.async && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Check size={16} className="text-emerald-500" /> {t('systemAdmin.pushNotifications.result')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-emerald-600">
                    {(mutation.data.result as TestPushSyncResponse).sent}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">{t('systemAdmin.pushNotifications.sent')}</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${
                  (mutation.data.result as TestPushSyncResponse).failed > 0 ? "bg-red-50" : "bg-gray-50"
                }`}>
                  <div className={`text-2xl font-black ${
                    (mutation.data.result as TestPushSyncResponse).failed > 0 ? "text-red-600" : "text-gray-400"
                  }`}>
                    {(mutation.data.result as TestPushSyncResponse).failed}
                  </div>
                  <div className={`text-[10px] font-medium ${
                    (mutation.data.result as TestPushSyncResponse).failed > 0 ? "text-red-700" : "text-gray-500"
                  }`}>{t('systemAdmin.pushNotifications.failed')}</div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  {(mutation.data.result as TestPushSyncResponse).total_subscriptions} {t('systemAdmin.pushNotifications.totalSubscriptions')}
                </div>
              </div>
            </div>
          )}

          {/* Async task in progress */}
          {taskStatus && taskStatus.status !== "COMPLETED" && taskStatus.status !== "FAILED" && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#471DDB]" /> {t('systemAdmin.pushNotifications.sending')}
              </h3>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-[#471DDB] h-2 rounded-full transition-all duration-500"
                  style={{
                    width: taskStatus.total > 0
                      ? `${Math.round(((taskStatus.sent + taskStatus.failed) / taskStatus.total) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="text-lg font-black text-gray-900">{taskStatus.total}</div>
                  <div className="text-[10px] text-gray-500">{t('systemAdmin.pushNotifications.total')}</div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-2">
                  <div className="text-lg font-black text-emerald-600">{taskStatus.sent}</div>
                  <div className="text-[10px] text-emerald-700">{t('systemAdmin.pushNotifications.sent')}</div>
                </div>
                <div className={`rounded-xl p-2 ${taskStatus.failed > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                  <div className={`text-lg font-black ${taskStatus.failed > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {taskStatus.failed}
                  </div>
                  <div className={`text-[10px] ${taskStatus.failed > 0 ? "text-red-700" : "text-gray-500"}`}>{t('systemAdmin.pushNotifications.failed')}</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 text-center">
                {taskStatus.total > 0
                  ? `${taskStatus.sent + taskStatus.failed} / ${taskStatus.total} processed`
                  : t('systemAdmin.pushNotifications.preparing')}
              </div>
            </div>
          )}

          {/* Async task completed */}
          {taskStatus && (taskStatus.status === "COMPLETED" || taskStatus.status === "FAILED") && (
            <div className={`card p-5 space-y-3 ${
              taskStatus.status === "FAILED" ? "border border-red-200" : ""
            }`}>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                {taskStatus.status === "COMPLETED" ? (
                  <><Check size={16} className="text-emerald-500" /> {t('systemAdmin.pushNotifications.broadcastComplete')}</>
                ) : (
                  <><X size={16} className="text-red-500" /> {t('systemAdmin.pushNotifications.broadcastFailed')}</>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-emerald-600">{taskStatus.sent}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">{t('systemAdmin.pushNotifications.sent')}</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${taskStatus.failed > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                  <div className={`text-2xl font-black ${taskStatus.failed > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {taskStatus.failed}
                  </div>
                  <div className={`text-[10px] font-medium ${taskStatus.failed > 0 ? "text-red-700" : "text-gray-500"}`}>
                    {t('systemAdmin.pushNotifications.failed')}
                  </div>
                </div>
              </div>

              {taskStatus.errors && taskStatus.errors.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3 max-h-32 overflow-y-auto">
                  <div className="text-[10px] font-semibold text-red-700 mb-1">{t('systemAdmin.pushNotifications.errors')}</div>
                  {taskStatus.errors.map((err, i) => (
                    <div key={i} className="text-[10px] text-red-600 mt-0.5">{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!mutation.data && !taskStatus && !mutation.isError && (
            <div className="card p-5 text-center">
              <Bell size={32} className="mx-auto text-gray-300 mb-2" />
              <div className="text-xs text-gray-400">
                {t('systemAdmin.pushNotifications.emptyHint')}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
