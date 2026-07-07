"use client";
import { useI18n } from '@/locales/client';
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useUrlSearchParams } from "@/hooks/use-url-search-params";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { getUsers, getAdminUserRoleSummary } from "@/actions/accounts";
import Paginator from "@/components/shared/Paginator";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

const TABS = [
  { key: "all" as const, labelKey: "systemAdmin.users.tabAll" },
  { key: "SYSTEM_ADMIN" as const, labelKey: "systemAdmin.users.tabSystemAdmins" },
  { key: "HOSPITAL_ADMIN" as const, labelKey: "systemAdmin.users.tabHospitalAdmins" },
  { key: "SOCIAL_WORKER" as const, labelKey: "systemAdmin.users.tabSocialWorkers" },
  { key: "RECEPTIONIST" as const, labelKey: "systemAdmin.users.tabReceptionists" },
  { key: "DONOR" as const, labelKey: "systemAdmin.users.tabDonors" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const VALID_TAB_KEYS = TABS.map((t) => t.key) as readonly string[];

export default function UsersPage() {
  const t = useI18n();
  const { data: session } = useSession();
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;
  const [params, setParams] = useUrlSearchParams(
    { tab: "all", page: 1 },
    { tab: VALID_TAB_KEYS, page: Number },
  );
  const tab = (params.tab as TabKey) || "all";
  const page = Number(params.page) || 1;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const pageSize = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setParams({ page: 1 }); // Reset page on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page on tab change
  const handleTabChange = (newTab: TabKey) => {
    setParams({ tab: newTab, page: 1 });
  };

  const setPage = (p: number) => {
    setParams({ page: p });
  };

  const nextPage = () => setPage(page + 1);
  const prevPage = () => setPage(Math.max(1, page - 1));

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", token, tab, debouncedSearch, page],
    queryFn: async () => {
      const params: Record<string, string | number | undefined> = {
        page,
        page_size: pageSize,
      };
      if (tab !== "all") params.role = tab;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getUsers(token || "", params);
      return res;
    },
    enabled: !!token,
  });

  const users = usersData?.results || [];
  const totalCount = usersData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const { data: roleSummary } = useQuery({
    queryKey: ["user-role-summary", token],
    queryFn: () => getAdminUserRoleSummary(token || ""),
    enabled: !!token,
  });

  const chartData = (roleSummary?.roles || [])
    .filter((r) => r.count > 0)
    .map((r) => ({
      name: r.label,
      value: r.count,
      fill: r.color,
    }));

  const chartConfig: ChartConfig = {
    value: { label: "Users" },
    ...Object.fromEntries(
      (roleSummary?.roles || []).map((r) => [
        r.label.toLowerCase().replace(/\s+/g, "_"),
        { label: r.label, color: r.color },
      ])
    ),
  };

  const getRoleBadgeClass = (role: string) => {
    const baseClass = "badge text-[10px]";
    if (role === "SYSTEM_ADMIN")
      return `${baseClass} bg-purple-100 text-purple-700`;
    if (role === "HOSPITAL_ADMIN")
      return `${baseClass} bg-blue-100 text-blue-700`;
    if (role === "SOCIAL_WORKER")
      return `${baseClass} bg-emerald-100 text-emerald-700`;
    if (role === "RECEPTIONIST")
      return `${baseClass} bg-amber-100 text-amber-700`;
    return `${baseClass} bg-gray-100 text-gray-700`;
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('systemAdmin.users.title')}</h1>
          <p className="text-gray-500 text-sm">{totalCount} {t('systemAdmin.users.totalUsers')}</p>
        </div>
        <Link
          href="/dashboard/system-admin/users/create"
          className="btn-admin text-sm flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start"
          style={{ background: "#471DDB" }}
        >
          <Plus size={16} /> {t('systemAdmin.users.createUser')}
        </Link>
      </div>

      {/* Role Distribution Chart */}
      {roleSummary && chartData.length > 0 && (
        <div className="card p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.users.distributionByRole')}</h2>
              <p className="text-2xl font-black text-gray-900">{roleSummary.total_users} <span className="text-sm font-medium text-gray-400">{t('systemAdmin.users.totalUsers')}</span></p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {roleSummary.roles.map((r) => (
                  <div key={r.role} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="text-gray-600">{r.label}</span>
                    <span className="font-bold text-gray-900">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full sm:w-48 h-48 shrink-0">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="name"
                        formatter={(value) => `${value} users`}
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Horizontal Scrollable on Mobile */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-2 sm:pb-0 snap-x snap-mandatory">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => handleTabChange(tabItem.key)}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap snap-center ${
              tab === tabItem.key
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={tab === tabItem.key ? { background: "#471DDB" } : {}}
          >
            {t(tabItem.labelKey as any)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 w-full sm:max-w-sm">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input-field pl-10 w-full"
          placeholder={t('systemAdmin.users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[t('systemAdmin.users.colName'), t('systemAdmin.users.colEmail'), t('systemAdmin.users.colRole'), t('systemAdmin.users.colVerified'), t('systemAdmin.users.colCreated')].map((h) => (
                  <th
                    key={h}
                    className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <Loader2
                      size={24}
                      className="animate-spin mx-auto text-gray-400"
                    />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    {t('systemAdmin.users.empty')}
                  </td>
                </tr>
              ) : (
                users.map((u: UnifiedUser, i: number) => (
                  <tr
                    key={u.id || i}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 text-sm">
                        <Link
                          href={`/dashboard/system-admin/users/${u.profile?.id}?role=${u.role}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {u.first_name || ""} {u.last_name || ""}
                        </Link>
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {u.phone_number}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">
                      {u.email || "—"}
                    </td>
                    <td className="p-4">
                      <span className={getRoleBadgeClass(u.role || "")}>
                        {u.role?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.is_verified ? (
                        <span className="text-emerald-600 text-xs font-semibold">
                          {t('systemAdmin.users.verified')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">{t('systemAdmin.users.pending')}</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">
                      {u.created_at ? formatDate(u.created_at) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <Paginator currentPage={page} totalPages={totalPages} totalCount={totalCount} pageSize={pageSize} onPageChange={setPage} />
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {t('systemAdmin.users.notFound')}
          </div>
        ) : (
          users.map((u: UnifiedUser, i: number) => (
            <Link
              key={u.id || i}
              href={`/dashboard/system-admin/users/${u.profile?.id}?role=${u.role}`}
              className="card p-4 block hover:shadow-md transition-all active:bg-gray-50"
            >
              <div className="space-y-3">
                {/* Name and Role */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {u.first_name} {u.last_name}
                    </h3>
                    <p className="text-[10px] text-gray-400 truncate">
                      {u.phone_number}
                    </p>
                  </div>
                  <span className={getRoleBadgeClass(u.role || "")}>
                    {(u.role || "")
                      .split("_")
                      .map(
                        (word) => word.charAt(0) + word.slice(1).toLowerCase(),
                      )
                      .join(" ")}
                  </span>
                </div>

                {/* Email */}
                <div className="border-t border-gray-100 pt-2">
                    <p className="text-[10px] text-gray-500 mb-1">{t('systemAdmin.users.email')}</p>
                  <p className="text-xs text-gray-700 truncate">
                    {u.email || "—"}
                  </p>
                </div>

                {/* Verified Status and Created Date */}
                <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-0.5">{t('systemAdmin.users.status')}</p>
                    {u.is_verified ? (
                      <span className="text-emerald-600 text-xs font-semibold">
                        {t('systemAdmin.users.verified')}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">{t('systemAdmin.users.pending')}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 mb-0.5">{t('systemAdmin.users.created')}</p>
                    <p className="text-xs text-gray-600">
                      {u.created_at ? formatDate(u.created_at) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="card p-4 flex flex-col items-center gap-3">
            <span className="text-xs text-gray-600 text-center">
              {t('systemAdmin.users.showingRange', {
                from: (page - 1) * pageSize + 1,
                of: Math.min(page * pageSize, totalCount),
                total: totalCount
              })}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {t('systemAdmin.users.pageInfo', { current: page, total: totalPages })}
            </span>
            <div className="flex gap-2 w-full">
              <button
                disabled={page === 1}
                onClick={prevPage}
                className="flex-1 p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              >
                <ChevronLeft size={16} />
                <span className="text-xs font-medium">{t('systemAdmin.users.previous')}</span>
              </button>
              <button
                disabled={page === totalPages || users.length === 0}
                onClick={nextPage}
                className="flex-1 p-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              >
                <span className="text-xs font-medium">{t('systemAdmin.users.next')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
