"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Share2,
  Download,
} from "lucide-react";
import { toBlob } from "html-to-image";
import { toast } from "sonner";
import { useInfiniteQuery } from "@tanstack/react-query";
import Navbar from "@/components/shared/Navbar";
import { getMyDonations } from "@/actions/campaigns";
import DonationShareCard from "@/components/dashboard/DonationShareCard";
import { formatXAF } from "@/lib/utils";
import { useI18n } from "@/locales/client";

export default function DonationsPage() {
  const router = useRouter();
  const t = useI18n();
  const { data: session, status } = useSession();
  const authUserId = session?.user?.id;
  const token = session?.accessToken || session?.user?.accessToken;
  const [expandedDonations, setExpandedDonations] = useState<Record<string, boolean>>({});
  const [sharing, setSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const userInfo = session?.user?.userInfo as
    | { first_name?: string; last_name?: string }
    | undefined;
  const donorName = [userInfo?.first_name, userInfo?.last_name]
    .filter(Boolean)
    .join(" ") || "A JoyFund Donor";

  const toggleExpand = (id: string) => {
    setExpandedDonations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?redirect=/dashboard/donor/donations");
    }
  }, [status, router]);

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["my-donations-all", authUserId],
    queryFn: async ({ pageParam = 1 }) => {
      if (!token) throw new Error("No access token");
      const response = await getMyDonations(token);
      return response as any;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const nextPage = lastPage?.json?.next || lastPage?.next;
      if (!nextPage) return undefined;
      const pageNum = lastPage?.json?.page || lastPage?.page || 1;
      return pageNum + 1;
    },
    enabled: !!token && !!authUserId,
  });

  const donations =
    data?.pages.flatMap((page: any) => {
      return page?.json?.results || page?.results || [];
    }) || [];

  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const campaignCount = new Set(donations.map((d) => d.campaign_id)).size;
  const averageDonation = donations.length > 0 ? totalAmount / donations.length : 0;

  const generateCard = useCallback(async () => {
    if (!cardRef.current) return null;
    const el = cardRef.current;
    const prev = el.style.cssText;
    el.style.cssText =
      "position:fixed;top:0;left:0;z-index:99999;opacity:1;visibility:visible;";
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const blob = await toBlob(el, { pixelRatio: 2, cacheBust: true });
      return blob;
    } finally {
      el.style.cssText = prev;
    }
  }, []);

  async function handlePreview() {
    setSharing(true);
    try {
      const blob = await generateCard();
      if (!blob) throw new Error("Failed to generate image");
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Failed to generate card");
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleShare() {
    try {
      const blob = await generateCard();
      if (!blob) throw new Error("Failed to generate image");
      const file = new File([blob], "joyfund-card.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My JoyFund Impact",
          text: `I've donated ${formatXAF(totalAmount)} to ${campaignCount} campaign${campaignCount !== 1 ? "s" : ""} on JoyFund! Join me in making a difference.`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "joyfund-donation-card.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
      setShowPreview(false);
      toast.success("Share card generated!");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Failed to generate card");
      }
    }
  }

  async function handleDownload() {
    try {
      const blob = await generateCard();
      if (!blob) throw new Error("Failed to generate image");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "joyfund-donation-card.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setShowPreview(false);
      toast.success("Card downloaded!");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast.error("Failed to download card");
      }
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success": return "text-emerald-600 bg-emerald-50";
      case "failed": return "text-red-600 bg-red-50";
      case "pending": return "text-amber-600 bg-amber-50";
      default: return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        {/* ── Header ── */}
        <header className="mb-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1 className="text-3xl font-black text-[#1A1A2E] leading-tight">
            My Donations
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Full history of your contributions
          </p>
        </header>

        {/* ── Summary ── */}
        {!isLoading && donations.length > 0 && (
          <div className="flex items-end justify-between mb-10 pb-8 border-b border-gray-200">
            <div className="flex items-baseline gap-10">
              <div>
                <span className="text-4xl font-black" style={{ color: 'var(--primary)' }}>{donations.length}</span>
                <span className="text-sm text-gray-400 ml-2">donations</span>
              </div>
              <div>
                <span className="text-4xl font-black text-[#1A1A2E]">{formatXAF(totalAmount)}</span>
                <span className="text-sm text-gray-400 ml-2">XAF raised</span>
              </div>
              <div>
                <span className="text-4xl font-black text-[#1A1A2E]">{campaignCount}</span>
                <span className="text-sm text-gray-400 ml-2">campaigns</span>
              </div>
            </div>
            <button
              onClick={handlePreview}
              disabled={sharing}
              className="text-sm font-bold shrink-0 transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              {sharing ? "Generating…" : "Share impact →"}
            </button>
          </div>
        )}

        {/* Off-screen share card */}
        <DonationShareCard
          ref={cardRef}
          donorName={donorName}
          totalDonations={donations.length}
          totalAmount={totalAmount}
          averageDonation={averageDonation}
          campaignCount={campaignCount}
        />

        {/* Preview Modal */}
        {showPreview && previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1A1A2E]">Preview</h3>
                <button
                  onClick={() => { setShowPreview(false); setPreviewUrl(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden border border-gray-100 mb-5">
                <img src={previewUrl} alt="Share card preview" className="w-full" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ background: 'var(--primary)' }}
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Donations List ── */}
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 size={24} className="animate-spin text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading donations…</p>
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">{(error as any)?.message || "Something went wrong"}</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-500 mb-4">No donations yet</p>
            <Link
              href="/explore"
              className="text-sm font-bold"
              style={{ color: 'var(--primary)' }}
            >
              Explore campaigns →
            </Link>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-200">
              <div className="col-span-5">Campaign</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Date</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {donations.map((donation: any) => {
              const isExpanded = expandedDonations[donation.id];

              return (
                <div key={donation.id} className="border-b border-gray-100">
                  {/* Main row — entire row is clickable */}
                  <button
                    onClick={() => toggleExpand(donation.id)}
                    className="w-full grid grid-cols-12 gap-4 py-4 items-center text-left hover:bg-gray-50/50 transition-colors -mx-1 px-1"
                  >
                    <div className="col-span-5 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                        Campaign
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {donation.is_anonymous ? "Anonymous" : donation.donor_name || "Donor"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusStyle(donation.status)}`}>
                        {donation.status}
                      </span>
                    </div>
                    <div className="col-span-3 text-xs text-gray-500">
                      {formatDate(donation.created_at)}
                    </div>
                    <div className="col-span-2 text-right flex items-center justify-end gap-3">
                      <span className="text-sm font-bold text-[#1A1A2E]">
                        {formatXAF(Number(donation.amount))} <span className="text-xs text-gray-400 font-normal">XAF</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-gray-300" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-300" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-1 pb-6 pt-2 space-y-5">
                      {/* Message */}
                      {donation.message && (
                        <div className="pl-4 border-l-2 border-gray-200">
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1.5">Message</p>
                          <p className="text-sm text-gray-600 italic">"{donation.message}"</p>
                        </div>
                      )}

                      {/* Payment info */}
                      {donation.payment && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Payment details</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                              { label: "Method", value: donation.payment.payment_method },
                              { label: "Phone", value: donation.payment.phone_number },
                              { label: "Reference", value: donation.payment.payment_reference || "Pending" },
                              { label: "Status", value: donation.payment.payment_status },
                            ].map((item) => (
                              <div key={item.label}>
                                <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">{item.label}</p>
                                <p className="text-sm text-[#1A1A2E] font-medium">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      {(donation.events?.length > 0 || donation.payment?.events?.length > 0) && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Timeline</p>
                          <div className="relative pl-4 border-l border-gray-200 space-y-3">
                            {(donation.events || []).map((event: any, idx: number) => (
                              <div key={event.id || idx} className="relative">
                                <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-gray-300 border-2 border-white" />
                                <p className="text-xs font-medium text-[#1A1A2E]">{event.status}</p>
                                <p className="text-[10px] text-gray-400">{formatDate(event.changed_at)}</p>
                              </div>
                            ))}
                            {(donation.payment?.events || []).map((event: any, idx: number) => (
                              <div key={`pay-${event.id || idx}`} className="relative">
                                <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border-2 border-white" style={{ background: 'var(--primary)' }} />
                                <p className="text-xs font-medium text-[#1A1A2E]">{event.status}</p>
                                <p className="text-[10px] text-gray-400">{formatDate(event.changed_at)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* IDs */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2">
                        <span className="font-mono text-[9px] text-gray-400">Donation: {donation.id}</span>
                        {donation.payment?.payment_id && (
                          <span className="font-mono text-[9px] text-gray-400">Payment: {donation.payment.payment_id}</span>
                        )}
                        <span className="font-mono text-[9px] text-gray-400">Campaign: {donation.campaign_id}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Load More */}
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-5 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 border-b border-gray-100"
              >
                {isFetchingNextPage ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronDown size={14} />
                )}
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
