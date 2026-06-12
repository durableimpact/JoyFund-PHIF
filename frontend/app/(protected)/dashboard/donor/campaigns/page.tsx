"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Loader2, Heart, ArrowLeft } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import CampaignDashboardCard from "@/components/dashboard/cards/CampaignDashboardCard";
import { getMyCampaigns } from "@/actions/campaigns";

export default function CampaignsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const authUserId = session?.user?.id;
  const token = session?.accessToken || session?.user?.accessToken;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/dashboard/donor/campaigns");
    }
  }, [status, router]);

  // Fetch campaigns with React Query
  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ["my-campaigns", authUserId],
    queryFn: async () => {
      if (!token) throw new Error("No access token");
      return await getMyCampaigns(token);
    },
    enabled: !!token && !!authUserId,
  });

  const campaigns = Array.isArray(campaignsResponse) ? campaignsResponse : [];

  if (isLoading) {
    return (
      <div className="h-full" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="pt-32 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#1DB1DB]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" style={{ background: "var(--background)" }}>
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center justify-between flex-1">
              <div>
                <h1 className="text-2xl font-black text-[#1A1A2E]">
                  My JoyFunds
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your active campaigns
                </p>
              </div>
              <Link
                href="/dashboard/donor/campaigns/create"
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={16} /> New Campaign
              </Link>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="card p-10 text-center">
              <Heart size={32} className="mx-auto mb-3 text-gray-300" />
              <h3 className="font-bold text-[#1A1A2E] mb-2">
                No campaigns yet
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Create your first JoyFund to start making an impact.
              </p>
              <Link
                href="/dashboard/donor/campaigns/create"
                className="btn-primary"
              >
                Create Your First JoyFund
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignDashboardCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
