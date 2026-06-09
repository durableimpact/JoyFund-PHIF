"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Heart, Plus, Search } from "lucide-react";
import { listBeneficiaries } from "@/actions/beneficiaries";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function SocialWorkerBeneficiaries() {
  const { data: session } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;
  const socialWorkerId = (
    session?.user?.userInfo as SocialWorkerInfo | undefined
  )?.profile?.id;
  const authUserId = session?.user?.id;
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading: loading } = useQuery({
    queryKey: [
      "sw-beneficiaries-list",
      authUserId,
      socialWorkerId,
      currentPage,
      search,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
      };
      if (socialWorkerId) params.enrolled_by_id = socialWorkerId;
      if (search) params.search = search;
      const res = await listBeneficiaries(token, params);
      return (res as any)?.json || res;
    },
    enabled: !!token && !!authUserId && !!socialWorkerId,
  });

  const bens: any[] = data?.results || [];
  const totalCount = data?.count || 0;
  const hasNextPage = !!data?.next;
  const hasPreviousPage = !!data?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Beneficiaries</h1>
          <p className="text-gray-500 text-sm">
            {totalCount} enrolled beneficiaries
          </p>
        </div>
        <Link
          href="/dashboard/social-worker/beneficiaries/create"
          className="btn-admin text-sm flex items-center gap-2"
          style={{ background: "#0D9488" }}
        >
          <Plus size={16} /> Enroll Beneficiary
        </Link>
      </div>

      <div className="relative mb-5">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input-field pl-10"
          placeholder="Search by name, health ID, city..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "Beneficiary",
                  "Health ID",
                  "Location",
                  "Health Issues",
                  "Enrolled",
                  "Status",
                ].map((h) => (
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
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="p-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bens.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    No beneficiaries found
                  </td>
                </tr>
              ) : (
                bens.map((b) => {
                  const issueCount = (b.health_issues || []).length;
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(b.full_name || "?").charAt(0)}
                          </div>
                          <Link
                            href={`/dashboard/social-worker/beneficiaries/${b.id}`}
                            className="font-semibold text-gray-900 hover:text-teal-600"
                          >
                            {b.full_name}
                          </Link>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-gray-600">
                        {b.digital_health_id || "—"}
                      </td>
                      <td className="p-4 text-gray-600 text-xs">
                        {b.city || "—"}
                        {b.region && b.region !== b.city ? `, ${b.region}` : ""}
                      </td>
                      <td className="p-4">
                        {issueCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Heart size={12} className="text-red-400" />
                            <span className="text-xs font-semibold text-gray-700">
                              {issueCount}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400 text-xs">
                        {b.created_at ? formatDate(b.created_at) : "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`badge text-[10px] ${b.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {b.is_verified ? "Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600">
              Showing{" "}
              <span className="font-semibold">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {Math.min(currentPage * PAGE_SIZE, totalCount)}
              </span>{" "}
              of <span className="font-semibold">{totalCount}</span> results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={!hasPreviousPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isCurrentPage
                          ? "text-white"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                      style={isCurrentPage ? { background: "#0D9488" } : {}}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
