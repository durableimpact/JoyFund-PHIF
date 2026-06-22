"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Helmet } from "react-helmet-async";
import CampaignCard from "@/components/shared/CampaignCard";
import { listCampaigns } from "@/actions/campaigns";

// Display labels for event types
const EVENT_TYPE_LABELS = [
  { value: "All", label: "All Types" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "WEDDING", label: "Wedding" },
  { value: "GRADUATION", label: "Graduation" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "MEMORIAL", label: "Memorial" },
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch campaigns with React Query
  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ["campaigns", filter, statusFilter],
    queryFn: async () =>
      await listCampaigns({
        event_type: filter === "All" ? undefined : (filter as any),
        status: statusFilter === "all" ? undefined : statusFilter,
        min_progress_percentage: 10,
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
      <Helmet>
        <title>Donate to Maternal Health Campaigns | JoyFund</title>
        <meta
          name="description"
          content="Browse active campaigns and fund a safe delivery in Cameroon today. 100% transparent donations via MTN MoMo and Orange Money."
        />
        <link rel="canonical" href="https://joy-fund.com/explore" />
        <meta
          property="og:title"
          content="Donate to Maternal Health Campaigns | JoyFund"
        />
        <meta
          property="og:description"
          content="Browse active campaigns and fund a safe delivery in Cameroon today. 100% transparent donations via MTN MoMo and Orange Money."
        />
        <meta property="og:url" content="https://joy-fund.com/explore" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://joy-fund.com/og-image.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Donate to Maternal Health Campaigns",
            url: "https://joy-fund.com/explore",
            description:
              "Browse active campaigns and fund a safe delivery in Cameroon today. 100% transparent donations via MTN MoMo and Orange Money.",
          })}
        </script>
      </Helmet>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="section-title text-3xl">Explore JoyFunds</h1>
            <p className="section-sub">
              Discover campaigns and give a gift that truly matters
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
                placeholder="Search campaigns or donors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input-field w-auto min-w-37.5"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Type pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
            {EVENT_TYPE_LABELS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === value ? "text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}
                style={filter === value ? { background: "var(--primary)" } : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="card p-8 text-center">Loading campaigns…</div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-5">
                {filtered.length} campaign{filtered.length !== 1 ? "s" : ""}{" "}
                found
              </p>
              {filtered.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="font-bold text-lg text-[#1A1A2E] mb-2">
                    No campaigns found
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your search or filters.
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
