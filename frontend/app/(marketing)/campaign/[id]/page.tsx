"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  CheckCircle,
  Heart,
  Loader2,
  Award,
  TrendingUp,
  History,
  CircleDollarSign,
  ShieldCheck,
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  ChevronRight,
  HandHeart,
  Globe,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Helmet } from "react-helmet-async";
import { getCampaign, listCampaignDonations } from "@/actions/campaigns";
import { useCampaignViewTracker } from "@/hooks/useCampaignViewTracker";
import { formatXAF, cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const VISIBLE_DONORS = 8;

function DonorListDialog({
  open,
  onOpenChange,
  campaignId,
  campaignTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignTitle: string;
}) {
  const [pages, setPages] = useState<PaginationResponse<Donation>[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchDonations = useCallback(
    async (page: number) => {
      try {
        setIsFetching(true);
        const res = await listCampaignDonations(campaignId, {
          status: "SUCCESS",
          page: page.toString(),
        });
        const pageData = res as PaginationResponse<Donation>;
        setPages((prev) => [...prev, pageData]);
        setHasNextPage(!!pageData?.next);
      } finally {
        setIsFetching(false);
      }
    },
    [campaignId],
  );

  const fetchNextPage = useCallback(async () => {
    setIsFetchingNextPage(true);
    try {
      await fetchDonations(currentPage + 1);
      setCurrentPage((p) => p + 1);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [currentPage, fetchDonations]);

  useEffect(() => {
    if (open) {
      setPages([]);
      setCurrentPage(1);
      fetchDonations(1);
    }
  }, [open, campaignId, fetchDonations]);

  const allDonations: Donation[] =
    pages.flatMap((page) => page.results || []) || [];

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasNextPage || isFetchingNextPage) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-bold text-[#1A1A2E]">
            All donors
          </DialogTitle>
          <DialogDescription>
            {allDonations.length > 0
              ? `${allDonations.length} donor${allDonations.length !== 1 ? "s" : ""} have contributed to ${campaignTitle}`
              : "No donors yet"}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable donor list */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 divide-y divide-gray-50">
          {allDonations.length > 0 ? (
            allDonations.map((donation: Donation, idx: number) => (
              <div
                key={donation.id + "-modal-" + idx}
                className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
              >
                <Avatar className="w-10 h-10 border border-gray-100 shrink-0">
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-bold text-xs uppercase">
                    {(donation.donor_name || "A")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-bold text-[#1A1A2E] truncate">
                      {donation.is_anonymous
                        ? "Anonymous"
                        : donation.donor_name}
                    </p>
                    <span className="text-sm font-bold text-[#1DB1DB] whitespace-nowrap">
                      {formatXAF(donation.net_amount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {donation.created_at
                      ? new Date(donation.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "Just now"}
                  </p>
                  {donation.message && (
                    <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-3 italic">
                      "{donation.message}"
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <HandHeart className="mx-auto text-gray-200 mb-3 w-10 h-10" />
              <p className="text-gray-400 text-sm font-medium">
                Be the first to donate!
              </p>
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {hasNextPage && (
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-5 h-5 text-[#1DB1DB] animate-spin" />
              )}
            </div>
          )}

          {!hasNextPage && allDonations.length > 0 && (
            <p className="py-4 text-center text-xs text-gray-300 font-medium">
              That&apos;s everyone!
            </p>
          )}
        </div>

        {/* CTA Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/80">
          <Link
            href={`/campaign/${campaignId}/donate/`}
            onClick={() => onOpenChange(false)}
          >
            <Button className="w-full h-12 text-base font-bold bg-[#1DB1DB] hover:bg-[#1a9fc5] text-white rounded-full shadow-lg shadow-[#1DB1DB]/20 transition-all active:scale-[0.98]">
              Donate now
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DonorList({
  donations,
  totalDonors,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  campaignId,
  campaignTitle,
}: {
  donations: Donation[];
  totalDonors: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  campaignId: string;
  campaignTitle: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const visible = donations.slice(0, VISIBLE_DONORS);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <h3 className="font-bold text-[#1A1A2E] text-sm">Recent donors</h3>
          <span className="text-xs text-gray-400 font-medium">
            {totalDonors} total
          </span>
        </div>

        <div className="max-h-90 overflow-y-auto px-6 pb-5 space-y-4 scrollbar-thin">
          {visible.length > 0 ? (
            visible.map((donation: Donation, idx: number) => (
              <div
                key={donation.id + "-" + idx}
                className="flex items-start gap-3"
              >
                <Avatar className="w-10 h-10 border border-gray-100 shrink-0">
                  <AvatarFallback className="bg-gray-100 text-gray-600 font-bold text-xs uppercase">
                    {(donation.donor_name || "A")[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-bold text-[#1A1A2E] truncate">
                      {donation.is_anonymous
                        ? "Anonymous"
                        : donation.donor_name}
                    </p>
                    <span className="text-xs font-bold text-[#1DB1DB] whitespace-nowrap">
                      {formatXAF(donation.net_amount)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {donation.created_at
                      ? new Date(donation.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )
                      : "Just now"}
                  </p>
                  {donation.message && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2 italic">
                      "{donation.message}"
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <HandHeart className="mx-auto text-gray-200 mb-3 w-8 h-8" />
              <p className="text-gray-400 text-xs font-medium">
                Be the first to donate!
              </p>
            </div>
          )}

          {totalDonors > VISIBLE_DONORS && (
            <button
              className="w-full text-xs text-gray-500 font-semibold py-2.5 hover:text-[#1DB1DB] transition-colors flex items-center justify-center gap-1 rounded-xl hover:bg-gray-50"
              onClick={() => setDialogOpen(true)}
            >
              View all {totalDonors} donors
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <DonorListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={campaignId}
        campaignTitle={campaignTitle}
      />
    </>
  );
}

const TIMELINE_INLINE = 10;

function getTimelineIcon(type: string) {
  switch (type) {
    case "donation":
      return <CircleDollarSign className="w-5 h-5 text-green-600" />;
    case "voucher-allocated":
      return <Award className="w-5 h-5 text-blue-600" />;
    case "hospital-settled":
      return <Building2 className="w-5 h-5 text-purple-600" />;
    default:
      return <TrendingUp className="w-5 h-5 text-gray-400" />;
  }
}

function getTimelineColors(type: string) {
  switch (type) {
    case "donation":
      return "bg-green-50 border-green-200";
    case "voucher-allocated":
      return "bg-blue-50 border-blue-200";
    case "hospital-settled":
      return "bg-purple-50 border-purple-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

function TimelineRow({ item }: { item: TimelineItem }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border shrink-0 transition-all",
            getTimelineColors(item.type),
          )}
        >
          {getTimelineIcon(item.type)}
        </div>
        <div className="flex-1 w-px bg-gray-200 my-1.5" />
      </div>
      <div className="flex-1 pb-5">
        <div className="flex justify-between items-start">
          <p className="font-bold text-[#1A1A2E] text-sm">{item.label}</p>
          <span
            className={cn(
              "text-sm font-black ml-4 shrink-0",
              item.type === "donation" ? "text-green-600" : "text-[#1A1A2E]",
            )}
          >
            {item.type === "donation" ? "+" : "-"}
            {formatXAF(item.amount)}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <time className="text-xs text-gray-400">
            {new Date(item.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          <Badge
            variant="outline"
            className="text-[9px] py-0 h-4 border-gray-200 text-gray-500 uppercase font-bold rounded-full"
          >
            {item.type.replace(/-/g, " ")}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function TransparencyDialog({
  open,
  onOpenChange,
  timeline,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  timeline: TimelineItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-bold text-[#1A1A2E]">
            Full financial trail
          </DialogTitle>
          <DialogDescription>
            {timeline.length} item{timeline.length !== 1 ? "s" : ""} showing
            money in and money out
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-4">
          <div className="space-y-0">
            {timeline.map((item) => (
              <TimelineRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransparencyTimeline({
  donations,
  transactions,
}: {
  donations: Donation[];
  transactions: CampaignTransaction[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>(["all"]);
    if (donations.length > 0) types.add("donation");
    transactions.forEach((tx) => {
      const t = tx.transaction_type?.toLowerCase().replace(/_/g, "-");
      if (t) types.add(t);
    });
    return Array.from(types);
  }, [donations.length, transactions]);

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [
      ...donations.map((d) => ({
        id: `donation-${d.id}`,
        type: "donation" as const,
        amount: d.net_amount,
        label: d.is_anonymous
          ? "Anonymous donation"
          : `${d.donor_name} donated`,
        description: d.message || null,
        date: d.created_at,
      })),
      ...transactions
        .filter((tx) => tx.transaction_type !== "DONATION")
        .map((tx) => ({
          id: `tx-${tx.id}`,
          type: tx.transaction_type
            ?.toLowerCase()
            .replace(/_/g, "-") as TimelineItemType,
          amount: tx.amount,
          label: tx.description || tx.transaction_type?.replace(/_/g, " "),
          description: null,
          date: tx.created_at,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filterType !== "all") {
      return items.filter((item) => item.type === filterType);
    }
    return items;
  }, [donations, transactions, filterType]);

  if (donations.length === 0 && transactions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-3xl p-14 text-center border-2 border-dashed border-gray-200">
        <History className="mx-auto mb-4 text-gray-300 w-10 h-10" />
        <p className="text-gray-500 font-medium text-sm">
          No activity recorded yet.
        </p>
      </div>
    );
  }

  const inline = timeline.slice(0, TIMELINE_INLINE);
  const remaining = timeline.length - TIMELINE_INLINE;

  return (
    <>
      {uniqueTypes.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {uniqueTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-colors capitalize border",
                filterType === type
                  ? "bg-[#1DB1DB] text-white border-[#1DB1DB]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700",
              )}
            >
              {type.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-0">
        {timeline.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 italic">
            No items match this filter.
          </div>
        ) : (
          inline.map((item) => <TimelineRow key={item.id} item={item} />)
        )}
      </div>

      {remaining > 0 && (
        <button
          className="w-full text-xs text-gray-500 font-semibold py-3 hover:text-[#1DB1DB] transition-colors flex items-center justify-center gap-1 rounded-xl hover:bg-gray-50 mt-2"
          onClick={() => setDialogOpen(true)}
        >
          See all {timeline.length} items ({remaining} more)
          <ChevronRight className="w-3 h-3" />
        </button>
      )}

      <TransparencyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        timeline={timeline}
      />
    </>
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignDetail | null>(null);
  const [isCampaignLoading, setIsCampaignLoading] = useState(true);
  const [donationPages, setDonationPages] = useState<
    PaginationResponse<Donation>[]
  >([]);
  const [currentDonationPage, setCurrentDonationPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const hasFetchedCampaign = useRef(false);

  // Track campaign page view with source attribution
  useCampaignViewTracker(id);

  // Fetch campaign
  useEffect(() => {
    if (!id || hasFetchedCampaign.current) return;

    hasFetchedCampaign.current = true;
    const fetchCampaign = async () => {
      try {
        setIsCampaignLoading(true);
        const data = await getCampaign(id as string);
        setCampaignData(data as CampaignDetail);
      } finally {
        setIsCampaignLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  // Fetch initial donations
  useEffect(() => {
    if (!id) return;

    const fetchDonations = async () => {
      try {
        const pageData = (await listCampaignDonations(id as string, {
          status: "SUCCESS",
          page: "1",
        })) as PaginationResponse<Donation>;
        setDonationPages([pageData]);
        setHasNextPage(!!pageData?.next);
        setCurrentDonationPage(1);
      } catch (error) {
        console.error("Error fetching donations:", error);
      }
    };

    fetchDonations();
  }, [id]);

  const fetchNextDonationPage = useCallback(async () => {
    const nextPage = currentDonationPage + 1;
    setIsFetchingNextPage(true);
    try {
      const pageData = (await listCampaignDonations(id as string, {
        status: "SUCCESS",
        page: nextPage.toString(),
      })) as PaginationResponse<Donation>;
      setDonationPages((prev) => [...prev, pageData]);
      setHasNextPage(!!pageData?.next);
      setCurrentDonationPage(nextPage);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [id, currentDonationPage]);

  const campaign = campaignData;
  const donations: Donation[] =
    donationPages.flatMap((page) => page.results || []) || [];

  const fetchNextPage = fetchNextDonationPage;
  const handleCopy = () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/campaign/${campaign?.id}`
        : "";
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareUrl = (platform: string) => {
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}/campaign/${campaign?.id}`
        : "";
    return `${base}?src=${platform}`;
  };

  // Loading state
  if (isCampaignLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-32 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 text-[#1DB1DB] animate-spin" />
            <p className="text-sm font-medium">Loading campaign details…</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} className="text-gray-300" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Campaign not found
            </CardTitle>
            <CardDescription>
              The campaign you&apos;re looking for might have been closed or
              removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Link href="/explore">
              <Button className="bg-[#1DB1DB] hover:bg-[#1a9fc5] text-white rounded-full px-8">
                Back to Explore
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const raisedXAF = campaign.total_net_raised || 0;
  const goalXAF = campaign.goal_amount || 0;
  const progressPct = campaign.progress_percentage || 0;
  const voucherFundings = campaign.voucher_fundings || [];
  const transactions = campaign.transactions || [];
  const organizerName =
    campaign.organizer_name || campaign.donor_name || "Campaign Organizer";
  const organizerInitial = organizerName.charAt(0).toUpperCase();

  const campaignTitle = campaign.title || "Campaign";
  const campaignDesc =
    campaign.description?.slice(0, 160) ||
    `Support "${campaignTitle}" on JoyFund — help provide maternal healthcare for vulnerable women in Cameroon.`;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{`${campaignTitle} | JoyFund`}</title>
        <meta name="description" content={campaignDesc} />
        <link rel="canonical" href={`https://joy-fund.com/campaign/${id}`} />
        <meta property="og:title" content={`${campaignTitle} | JoyFund`} />
        <meta property="og:description" content={campaignDesc} />
        <meta
          property="og:url"
          content={`https://joy-fund.com/campaign/${id}`}
        />
        <meta property="og:type" content="website" />
        {campaign.cover_image && (
          <meta property="og:image" content={campaign.cover_image} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${campaignTitle} | JoyFund`} />
        <meta name="twitter:description" content={campaignDesc} />
        {campaign.cover_image && (
          <meta name="twitter:image" content={campaign.cover_image} />
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FundAction",
            name: campaignTitle,
            description: campaign.description || undefined,
            url: `https://joy-fund.com/campaign/${id}`,
            image: campaign.cover_image || undefined,
            organizer: organizerName
              ? { "@type": "Person", name: organizerName }
              : undefined,
            location: campaign.location
              ? { "@type": "Place", name: campaign.location }
              : undefined,
            offers: {
              "@type": "Offer",
              price: goalXAF,
              priceCurrency: "XAF",
              availability: "https://schema.org/InStock",
              url: `https://joy-fund.com/campaign/${id}/donate/`,
            },
          })}
        </script>
      </Helmet>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-28 pb-12 md:pt-36 md:pb-20">
        {/* ── Campaign Header ── */}
        <div className="mb-10 md:mb-14">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-[#1DB1DB] text-sm mb-6 transition-colors font-semibold group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Explore
          </button>

          <div className="space-y-4">
            <Badge className="bg-[#1DB1DB]/10 text-[#1DB1DB] border-none rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              {campaign.event_type || "Social Impact"}
            </Badge>
            <h1 className="text-3xl md:text-[52px] font-black text-[#1A1A2E] leading-[1.1] tracking-tight max-w-4xl">
              {campaign.title}
            </h1>
            {campaign.location && (
              <p className="flex items-center gap-2 text-gray-500 font-medium">
                <MapPin className="w-4 h-4 text-[#1DB1DB]" />
                {campaign.location}
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">
          {/* ── Left Column: Media & Story ── */}
          <div className="min-w-0 space-y-12">
            {/* Main Image */}
            {campaign.cover_image && (
              <div className="relative aspect-16/10 w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50">
                <img
                  src={campaign.cover_image}
                  alt={campaign.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            )}

            <Tabs defaultValue="story" className="w-full">
              <TabsList
                className="w-full justify-start gap-6 border-b border-gray-200 bg-transparent p-0 h-auto rounded-none"
                variant="line"
              >
                <TabsTrigger
                  value="story"
                  className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-gray-500 data-active:border-[#1DB1DB] data-active:text-[#1A1A2E] data-active:bg-transparent hover:text-[#1A1A2E] transition-colors"
                >
                  Story
                </TabsTrigger>
                <TabsTrigger
                  value="impact"
                  className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-gray-500 data-active:border-[#1DB1DB] data-active:text-[#1A1A2E] data-active:bg-transparent hover:text-[#1A1A2E] transition-colors"
                >
                  Impact
                </TabsTrigger>
                <TabsTrigger
                  value="transparency"
                  className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-semibold text-gray-500 data-active:border-[#1DB1DB] data-active:text-[#1A1A2E] data-active:bg-transparent hover:text-[#1A1A2E] transition-colors"
                >
                  Transparency
                </TabsTrigger>
              </TabsList>

              {/* ── Story Tab ── */}
              <TabsContent
                value="story"
                className="pt-8 focus-visible:outline-none"
              >
                <div className="prose prose-gray max-w-none">
                  <h2 className="text-xl font-bold text-[#1A1A2E] mb-4 font-heading">
                    About this campaign
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {campaign.description ||
                      "No description provided for this campaign."}
                  </p>
                </div>

                {/* Campaign meta */}
                <div className="mt-10 grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100">
                      <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Started
                      </p>
                      <p className="text-sm font-bold text-[#1A1A2E]">
                        {new Date(campaign.created_at).toLocaleDateString(
                          "en-US",
                          { month: "long", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-100">
                      <Globe className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                        Category
                      </p>
                      <p className="text-sm font-bold text-[#1A1A2E] capitalize">
                        {campaign.event_type?.toLowerCase() || "General"}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Impact Tab ── */}
              <TabsContent
                value="impact"
                className="pt-8 focus-visible:outline-none"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#1A1A2E] font-heading">
                        Vouchers Funded
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Real-time tracking of how your donations help.
                      </p>
                    </div>
                    <Badge className="bg-[#1DB1DB]/10 text-[#1DB1DB] rounded-full px-3 py-1 text-xs font-bold">
                      {voucherFundings.length} total
                    </Badge>
                  </div>

                  {voucherFundings.length > 0 ? (
                    <div className="space-y-3">
                      {voucherFundings.map((funding: VoucherFundingDetail) => (
                        <div
                          key={funding.id}
                          className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-11 h-11 bg-[#1DB1DB]/10 rounded-full flex items-center justify-center shrink-0">
                            <Award size={20} className="text-[#1DB1DB]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1A1A2E] text-sm truncate">
                              {funding.beneficiary_name ||
                                funding.voucher?.beneficiary?.full_name ||
                                "Vulnerable Beneficiary"}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 size={11} />{" "}
                                {funding.hospital_name ||
                                  funding.voucher?.hospital?.name ||
                                  "Local Facility"}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <CreditCard size={11} />{" "}
                                {funding.voucher_code ||
                                  funding.voucher?.voucher_code ||
                                  "---"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-[#1DB1DB]">
                              {formatXAF(funding.amount)}
                            </p>
                            <Badge
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider mt-1 rounded-full px-2 py-0.5",
                                (funding.status || funding.voucher?.status) ===
                                  "USED"
                                  ? "bg-green-100 text-green-700"
                                  : (funding.status ||
                                        funding.voucher?.status) === "EXPIRED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700",
                              )}
                            >
                              {funding.status ||
                                funding.voucher?.status ||
                                "Allocated"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-3xl p-14 text-center border-2 border-dashed border-gray-200">
                      <HandHeart className="mx-auto mb-4 text-gray-300 w-10 h-10" />
                      <p className="text-gray-500 font-medium text-sm">
                        No vouchers funded yet. Donations will appear here as
                        they are allocated.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Transparency Tab ── */}
              <TabsContent
                value="transparency"
                className="pt-8 focus-visible:outline-none"
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A2E] font-heading">
                      Financial Transparency
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Complete trail of money in and money out.
                    </p>
                  </div>

                  <TransparencyTimeline
                    donations={donations}
                    transactions={transactions}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Right Column: Donation Sidebar ── */}
          <div className="lg:sticky lg:top-24 self-start space-y-6">
            {/* ── Donation Card ── */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
              <div className="p-6 space-y-5">
                {/* Amount raised */}
                <div className="space-y-3">
                  <p className="text-3xl md:text-[34px] font-black text-[#1A1A2E] tracking-tight">
                    {formatXAF(raisedXAF)}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    raised of{" "}
                    <span className="font-bold text-[#1A1A2E]">
                      {formatXAF(goalXAF)}
                    </span>{" "}
                    goal
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1DB1DB] to-[#1CDBC9] transition-all duration-700"
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#1A1A2E]">
                      {progressPct.toFixed(0)}% funded
                    </span>
                    <span className="text-gray-500">
                      <span className="font-bold text-[#1A1A2E]">
                        {donations.length}
                      </span>{" "}
                      donor{donations.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* CTA buttons */}
                <div className="space-y-3">
                  <Link
                    href={`/campaign/${campaign.id}/donate/`}
                    className="block"
                  >
                    <Button className="w-full h-14 text-lg font-bold bg-[#1DB1DB] hover:bg-[#1a9fc5] text-white rounded-full shadow-lg shadow-[#1DB1DB]/25 transition-all hover:shadow-xl hover:shadow-[#1DB1DB]/30 active:scale-[0.98]">
                      Donate now
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-full border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors gap-2"
                    onClick={() => {
                      const shareUrl = getShareUrl("share");
                      const text = campaign?.title ? `Support: ${campaign.title}` : "Check out this campaign";
                      if (navigator.share) {
                        navigator.share({ title: campaign?.title, url: shareUrl, text }).catch(() => {});
                      } else {
                        handleCopy();
                      }
                    }}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Link copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Organizer */}
              <div className="border-t border-gray-100 px-6 py-4">
                <div className="flex items-center gap-3">
                  {campaign.donor ? (
                    <Avatar className="w-10 h-10 bg-[#1DB1DB]">
                      <AvatarImage
                        src={campaign.donor?.user?.profile_picture}
                      />
                      <AvatarFallback>{organizerInitial}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10 h-10 bg-[#1DB1DB] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {organizerInitial}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">
                      Organized by
                    </p>
                    {campaign.donor && (
                      <p className="text-sm font-bold text-[#1A1A2E] truncate">
                        {campaign.donor.user.first_name}{" "}
                        {campaign.donor.user.last_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Recent Donors ── */}
            <DonorList
              donations={donations}
              totalDonors={campaign.donor_count || donations.length}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              campaignId={campaign.id}
              campaignTitle={campaign.title}
            />

            {/* ── Impact Reference ──
            <div className="bg-gray-50 border border-gray-200 rounded-3xl p-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-[#1DB1DB]/10 rounded-full flex items-center justify-center">
                  <HandHeart size={18} className="text-[#1DB1DB]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A1A2E]">
                    Your impact
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                    Healthcare costs
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  ["6,000 XAF", "Antenatal visit"],
                  ["45,000 XAF", "Normal delivery"],
                  // ["120,000 XAF", "C-section + care"],
                ].map(([amt, label]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center bg-white rounded-xl p-3 border border-gray-100"
                  >
                    <span className="text-xs text-gray-500 font-medium">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-[#1A1A2E]">
                      {amt}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                * Based on average costs at partner facilities
              </p>
            </div>
            */}

            {/* ── Trust Badges ── */}
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-medium">Secure</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <CircleDollarSign className="w-4 h-4" />
                <span className="font-medium">100% to cause</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <HandHeart className="w-4 h-4" />
                <span className="font-medium">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
