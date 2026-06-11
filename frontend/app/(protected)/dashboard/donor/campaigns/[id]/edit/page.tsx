"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Loader2, ImagePlus, X } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { formatXAF } from "@/lib/utils";
import { getCampaign, updateCampaign } from "@/actions/campaigns";

export default function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authUserId = session?.user?.id;
  const token = session?.accessToken || session?.user?.accessToken;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState(0);
  const [endDate, setEndDate] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?redirect=/dashboard/donor/campaigns/${id}/edit`);
    }
  }, [status, router, id]);

  // Fetch campaign
  const { data: campaign, isLoading: campaignLoading } = useQuery({
    queryKey: ["donor-campaign", authUserId, id],
    queryFn: async () => await getCampaign(id as string),
    enabled: !!token && !!authUserId && !!id,
  });

  // Load campaign data when fetched
  useEffect(() => {
    if (campaign) {
      setTitle(campaign.title);
      setDescription(campaign.description);
      setGoalAmount(campaign.goal_amount);
      setEndDate(campaign.end_date?.split("T")[0] || "");
      setIsPublic(campaign.is_public);
      if (campaign.cover_image) {
        setCoverImagePreview(campaign.cover_image);
      }
      setIsLoading(false);
    }
  }, [campaign]);

  // Mutation for updating campaign
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No access token");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("goal_amount", goalAmount.toString());
      formData.append("end_date", new Date(endDate).toISOString());
      formData.append("is_public", isPublic.toString());
      if (coverImage) {
        formData.append("cover_image", coverImage);
      }

      return await updateCampaign(id as string, token, formData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["donor-campaign", authUserId, id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["donor-campaign-donations", authUserId, id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["my-campaigns", authUserId],
      });
      alert("Campaign updated successfully!");
      router.push(`/dashboard/donor/campaigns/${id}`);
    },
    onError: (error: any) => {
      try {
        const errorData = JSON.parse(error);
        alert(errorData?.error || "Failed to update campaign");
      } catch {
        alert(error?.message || "Failed to update campaign");
      }
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading || !campaign) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
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

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="card p-6">
            <h1 className="text-2xl font-black text-[#1A1A2E] mb-6">
              Edit Campaign
            </h1>

            <div className="space-y-6">
              {/* Cover Image */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-2 block">
                  Campaign Cover Image
                </label>
                <div className="relative">
                  {coverImagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 h-40 bg-gray-100">
                      <img
                        src={coverImagePreview}
                        alt="Campaign cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#1DB1DB] transition-colors"
                    >
                      <ImagePlus
                        size={32}
                        className="mx-auto text-gray-400 mb-2"
                      />
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload campaign cover image
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Campaign Title */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter campaign title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Campaign Description *{" "}
                  <span className="font-normal text-gray-400">
                    (min 50 characters)
                  </span>
                </label>
                <textarea
                  className="input-field min-h-24 resize-none"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell your campaign story..."
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{description.length} characters</span>
                  <span
                    className={
                      description.length < 50
                        ? "text-amber-500"
                        : "text-emerald-500"
                    }
                  >
                    {description.length < 50
                      ? `${50 - description.length} more needed`
                      : "✓ Good"}
                  </span>
                </div>
              </div>

              {/* Goal Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Goal Amount (XAF) *
                </label>
                <input
                  type="number"
                  className="input-field font-mono text-lg"
                  min={6000}
                  step={6000}
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(Number(e.target.value))}
                  placeholder="e.g. 120000"
                />
                <p className="text-xs text-gray-400 mt-1">
                  ≈ {Math.round(goalAmount / 60000)} safe{" "}
                  {Math.round(goalAmount / 60000) === 1
                    ? "delivery"
                    : "deliveries"}{" "}
                  funded
                </p>
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Campaign End Date *
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this campaign public (visible to everyone)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.back()}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateMutation.mutate()}
                  disabled={
                    updateMutation.isPending ||
                    !title ||
                    description.length < 50 ||
                    !goalAmount ||
                    !endDate
                  }
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update Campaign"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
