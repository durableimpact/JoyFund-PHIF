"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Heart,
  Share2,
  Edit,
  TrendingUp,
  Gift,
  Zap,
  Clock,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { formatXAF } from "@/lib/utils";
import { getCampaign, listCampaignDonations } from "@/actions/campaigns";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const authUserId = session?.user?.id;
  const token = session?.accessToken || session?.user?.accessToken;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?redirect=/dashboard/donor/campaigns/${id}`);
    }
  }, [status, router, id]);

  // Fetch campaign with React Query
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["donor-campaign", authUserId, id],
    queryFn: async () => await getCampaign(id as string),
    enabled: !!token && !!authUserId && !!id,
  });

  // Fetch donations
  const { data: donationsResponse } = useQuery({
    queryKey: ["donor-campaign-donations", authUserId, id],
    queryFn: async () => await listCampaignDonations(id as string),
    enabled: !!token && !!authUserId && !!id,
  });

  const donations =
    (donationsResponse as any)?.json?.results ||
    donationsResponse?.results ||
    (Array.isArray((donationsResponse as any)?.json)
      ? (donationsResponse as any).json
      : (donationsResponse as any)?.json
        ? [(donationsResponse as any).json]
        : []);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#1DB1DB]" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center card p-10 max-w-sm">
          <p className="text-gray-500 mb-4">Campaign not found</p>
          <Link href="/dashboard/donor/campaigns" className="btn-primary">
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const pct =
    ((campaign.total_net_raised || 0) / (campaign.goal_amount || 1)) * 100;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#1A1A2E]">
                Campaign Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and track your JoyFund progress
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              {/* Campaign header with cover image */}
              <div className="card p-6 overflow-hidden">
                {campaign.cover_image && (
                  <img
                    src={campaign.cover_image}
                    alt="Campaign cover"
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-black text-[#1A1A2E]">
                      {campaign.title}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                      {campaign.event_type}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--primary)" }}
                  >
                    {campaign.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{campaign.description}</p>
              </div>

              {/* Progress */}
              <div className="card p-6">
                <h2 className="font-bold text-[#1A1A2E] mb-4">Progress</h2>
                <div className="space-y-3">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                        <div
                          className="h-full transition-all"
                          style={{
                            background: "var(--primary)",
                            width: `${Math.min(pct, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {pct.toFixed(1)}% of goal
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Raised</p>
                      <p className="font-bold text-lg text-[#1A1A2E]">
                        {formatXAF(campaign.total_net_raised || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Goal</p>
                      <p className="font-bold text-lg text-[#1A1A2E]">
                        {formatXAF(campaign.goal_amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-bold text-lg capitalize text-[#1A1A2E]">
                        {campaign.status || "Draft"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign details */}
              <div className="card p-6">
                <h2 className="font-bold text-[#1A1A2E] mb-4">
                  Campaign Details
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Created</span>
                    <span className="font-medium">
                      {campaign.created_at
                        ? new Date(campaign.created_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ends</span>
                    <span className="font-medium">
                      {campaign.end_date
                        ? new Date(campaign.end_date).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Visibility</span>
                    <span className="font-medium">
                      {campaign.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Donations */}
              {donations.length > 0 && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift size={18} className="text-[#1DB1DB]" />
                    <h2 className="font-bold text-[#1A1A2E]">
                      Donations ({donations.length})
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {donations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1A1A2E]">
                            {donation.is_anonymous
                              ? "Anonymous"
                              : donation.donor_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(donation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#1DB1DB]">
                            {formatXAF(donation.amount)}
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              donation.status === "SUCCESS"
                                ? "text-emerald-600"
                                : donation.status === "FAILED"
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}
                          >
                            {donation.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Actions */}
              <div className="card p-6 space-y-3">
                <h3 className="font-bold text-[#1A1A2E] mb-4">Actions</h3>
                <Link
                  href={`/dashboard/donor/campaigns/${campaign.id}/edit`}
                  className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> Edit Campaign
                </Link>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `https://joy-fund.com/campaign/${campaign.id}`,
                    )
                  }
                  className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                >
                  <Share2 size={16} /> Share Campaign
                </button>
                <Link
                  href={`/campaign/${campaign.id}`}
                  className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
                >
                  <Heart size={16} /> View Campaign
                </Link>
              </div>

              {/* Stats */}
              <div className="card p-6 space-y-4">
                <h3 className="font-bold text-[#1A1A2E]">Campaign Stats</h3>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Raised</p>
                  <p
                    className="text-2xl font-black"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatXAF(campaign.total_net_raised || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Goal Amount</p>
                  <p className="text-lg font-bold text-[#1A1A2E]">
                    {formatXAF(campaign.goal_amount || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
