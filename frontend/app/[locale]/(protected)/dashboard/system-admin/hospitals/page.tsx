"use client";
import { useI18n } from '@/locales/client';
import { useUrlSearchParams } from "@/hooks/use-url-search-params";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { statusColor } from "@/lib/utils";
import { listHospitals } from "@/actions/hospital";
import Paginator from "@/components/shared/Paginator";

const PAGE_SIZE = 10;

export default function AdminHospitals() {
  const { data: session } = useSession();
  const token =
    session?.accessToken ||
    (session?.user as { accessToken?: string })?.accessToken;
  const [params, setParams] = useUrlSearchParams({ search: "", page: 1 }, { page: Number });
  const search = (params.search as string) || "";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));

  const { data, isLoading } = useQuery({
    queryKey: ["hospitals", token, currentPage, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
      };
      if (search) params.search = search;
      return await listHospitals(token, params);
    },
    enabled: !!token,
  });

  const hospitals: Hospital[] = data?.results || [];
  const totalCount = data?.count || 0;
  const hasNextPage = !!data?.next;
  const hasPreviousPage = !!data?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Hospitals</h1>
          <p className="text-gray-500 text-sm">{totalCount} total hospitals</p>
        </div>
        <Link
          href="/dashboard/system-admin/hospitals/create"
          className="btn-admin text-sm flex items-center gap-2"
          style={{ background: "#471DDB" }}
        >
          <Plus size={16} /> Add Hospital
        </Link>
      </div>

      <div className="relative mb-5">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          className="input-field pl-10"
          placeholder="Search by name, city, region, or email…"
          value={search}
          onChange={(e) => setParams({ search: e.target.value, page: 1 })}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Name", "Location", "Contact", "Status", "Created"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ),
                )}
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
              ) : hospitals.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    {search
                      ? "No hospitals matching your search"
                      : "No hospitals yet"}
                  </td>
                </tr>
              ) : (
                hospitals.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ background: "#471DDB" }}
                        >
                          <Building2 size={16} />
                        </div>
                        <div>
                          <Link
                            href={`/dashboard/system-admin/hospitals/${h.id}`}
                            className="font-semibold text-gray-900 text-sm hover:text-blue-600 hover:underline"
                          >
                            {h.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={12} className="text-gray-400" />
                        {h.city}, {h.region}
                      </div>
                      {h.address && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-50">
                          {h.address}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone size={11} className="text-gray-400" />
                          {h.phone_number}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail size={11} className="text-gray-400" />
                          {h.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`badge text-[10px] ${statusColor(h.partnership_status)}`}
                      >
                        {h.partnership_status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {h.created_at
                          ? new Date(h.created_at).toLocaleDateString()
                          : "—"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}
