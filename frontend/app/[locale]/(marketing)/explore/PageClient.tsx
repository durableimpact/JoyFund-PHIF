"use client";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useUrlSearchParams } from "@/hooks/use-url-search-params";
import Navbar from "@/components/shared/Navbar";
import CampaignCard from "@/components/shared/CampaignCard";
import { listCampaigns } from "@/actions/campaigns";
import { useI18n } from "@/locales/client";

// Maps filter values to backend campaign statuses (uppercase choices).
const CAMPAIGN_STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  completed: "CLOSED",
};

// Display labels for event types
const getEventLabels = (t: any) => [
  { value: "All", label: t("explore.allTypes") },
  { value: "BIRTHDAY", label: t("donor.campaigns.create.eventType.birthday") },
  { value: "WEDDING", label: t("donor.campaigns.create.eventType.wedding") },
  { value: "GRADUATION", label: t("donor.campaigns.create.eventType.graduation") },
  { value: "PROMOTION", label: t("donor.campaigns.create.eventType.promotion") },
  { value: "MEMORIAL", label: t("donor.campaigns.create.eventType.memorial") },
];

export default function ExplorePage() {
  const t = useI18n();
  const [params, setParams] = useUrlSearchParams(
    { search: "", filter: "All", statusFilter: "all" },
    {},
  );
  const search = (params.search as string) || "";
  const filter = (params.filter as string) || "All";
  const statusFilter = (params.statusFilter as string) || "all";

  // Fetch campaigns with React Query
  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ["campaigns", filter, statusFilter],
    queryFn: async () =>
      await listCampaigns({
        event_type: filter === "All" ? undefined : (filter as any),
        status:
          statusFilter === "all" ? undefined : CAMPAIGN_STATUS_MAP[statusFilter],
        min_progress_percentage: 0,
        is_public: true,
        is_active: true,
      }),
  });

  const campaignList = campaignsResponse?.results || [];

  const filtered = campaignList.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="section-title text-3xl">{t("explore.title")}</h1>
            <p className="section-sub">
              {t("explore.subtitle")}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="input-field pl-10"
                placeholder={t("explore.searchPlaceholder")}
                value={search}
                onChange={(e) => setParams({ search: e.target.value })}
              />
            </div>
            <select
              className="input-field w-auto min-w-37.5"
              value={statusFilter}
              onChange={(e) => setParams({ statusFilter: e.target.value })}
            >
              <option value="all">{t("explore.allStatus")}</option>
              <option value="active">{t("explore.active")}</option>
              <option value="completed">{t("explore.completed")}</option>
            </select>
          </div>

          {/* Type pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {getEventLabels(t).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setParams({ filter: value })}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === value ? "text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}
                style={filter === value ? { background: "var(--primary)" } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="card p-8 text-center">{t("explore.loading")}</div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-5">
                {filtered.length === 1
                  ? t("explore.campaignFound", { count: filtered.length })
                  : t("explore.campaignsFound", { count: filtered.length })}
              </p>
              {filtered.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="font-bold text-lg text-[#1A1A2E] mb-2">
                    {t("explore.noResults")}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t("explore.noResultsHint")}
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((c) => (
                    <CampaignCard key={c.id} campaign={c} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
