"use client";
import { useState, Suspense, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import { Helmet } from "react-helmet-async";
import { Confetti } from "@/components/ui/confetti";
import { formatXAF } from "@/lib/utils";
import { getCampaign, donateToCampaign } from "@/actions/campaigns";
import { getCurrentFeePolicy } from "@/actions/payments";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InputPhone } from "@/components/ui/input-phone";
import { toast } from "sonner";
import { DetailPageSkeleton } from "@/components/shared/PageSkeletons";
import { useI18n } from "@/locales/client";

const PAYMENT_METHODS = [
  {
    id: "MTN",
    label: "MTN Mobile Money",
    color: "#FFC107",
    prefix: "67, 65, 68",
  },
  { id: "ORANGE", label: "Orange Money", color: "#FF5A00", prefix: "69, 65" },
];

const AMOUNTS = [5000, 10000, 25000, 50000, 100000];

const donateSchema = z
  .object({
    donorName: z.string().optional(),
    isAnonymous: z.boolean(),
    amount: z.number().min(25, "Minimum donation is 25 XAF"),
    message: z.string().optional(),
    paymentMethod: z.enum(["MTN", "ORANGE"] as const),
    phoneNumber: z.string().min(9, "Please enter a valid phone number"),
  })
  .refine(
    (data) => {
      if (
        !data.isAnonymous &&
        (!data.donorName || data.donorName.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Please enter your name if you're not donating anonymously",
      path: ["donorName"],
    },
  );

type DonateFormValues = z.infer<typeof donateSchema>;

function DonatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useI18n();
  const searchParams = useSearchParams();
  const confettiRef = useRef<{ fire: (opts: { particleCount: number; spread: number; origin: { y: number } }) => void } | null>(null);
  const { data: session } = useSession();
  const isDonor = !!(
    session &&
    !session?.error &&
    session?.user?.role === "DONOR" &&
    session?.accessToken &&
    session?.expiresAt &&
    Date.now() < session.expiresAt
  );
  const accessToken = isDonor ? session.accessToken : undefined;

  // Check payment status from URL
  const paymentStatus = searchParams.get("status");
  const [showStatusMessage, setShowStatusMessage] = useState(!!paymentStatus);
  const [useCustom, setUseCustom] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DonateFormValues>({
    resolver: zodResolver(donateSchema),
    defaultValues: {
      isAnonymous: false,
      amount: 10000,
      paymentMethod: "MTN",
      donorName: "",
      message: "",
      phoneNumber: "",
    },
  });

  const amount = watch("amount");
  const isAnonymous = watch("isAnonymous");
  const paymentMethod = watch("paymentMethod");

  // Trigger confetti on success
  useEffect(() => {
    if (paymentStatus === "success" && confettiRef.current) {
      setTimeout(() => {
        confettiRef.current?.fire({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 300);
    }
  }, [paymentStatus]);

  // Fetch campaign with React Query
  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => await getCampaign(id as string),
    enabled: !!id,
  });

  const { data: feePolicy } = useQuery({
    queryKey: ["fee-policy-current"],
    queryFn: getCurrentFeePolicy,
  });

  const platformFeePct = Number(feePolicy?.platform_fee_percentage ?? 5);
  const paymentAggregatorFee = Math.round(amount * 0.02);
  const afterAggregator = amount - paymentAggregatorFee;
  const operationsFee = Math.round(afterAggregator * platformFeePct / 100);
  const totalFees = paymentAggregatorFee + operationsFee;
  const netContribution = Math.max(afterAggregator - operationsFee, 0);

  // Use mutation for donation
  const donateMutation = useMutation({
    mutationFn: async (payload: DonationCreatePayload) => {
      return await donateToCampaign(id as string, payload, accessToken);
    },
    onSuccess: (response) => {
      if (response?.payment_link) {
        window.location.href = response.payment_link;
      } else {
        toast.error("Payment link not available");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Payment failed. Please try again.");
    },
  });

  const onSubmit = (data: DonateFormValues) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const payload: DonationCreatePayload = {
      donor_name: data.isAnonymous ? "Anonymous" : data.donorName,
      amount: data.amount,
      message: data.message || undefined,
      is_anonymous: data.isAnonymous,
      payment_method: data.paymentMethod,
      phone_number: data.phoneNumber.replace(/\s/g, ""),
      success_url: `${origin}/campaign/${id}/donate/?status=success`,
      failure_url: `${origin}/campaign/${id}/donate/?status=failed`,
    };

    donateMutation.mutate(payload);
  };

  const campaignTitle = campaign?.title || "Campaign";
  const campaignDesc =
    campaign?.description?.slice(0, 160) ||
    "Support this campaign and help provide maternal healthcare for vulnerable women in Cameroon.";

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="pt-32">
          <DetailPageSkeleton />
        </div>
      </div>
    );
  }

  if (!campaign && !isLoading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center card p-10 max-w-sm">
          <p className="text-gray-500 mb-4">Campaign not found</p>
          <button
            onClick={() => router.push("/explore")}
            className="btn-primary"
          >
            Explore Campaigns
          </button>
        </div>
      </div>
    );

  const color = "#1DB1DB";

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Helmet>
        <title>{`Donate to ${campaignTitle} | JoyFund`}</title>
        <meta name="description" content={campaignDesc} />
        <link
          rel="canonical"
          href={`https://joy-fund.com/campaign/${id}/donate`}
        />
        <meta property="og:title" content={`Donate to ${campaignTitle}`} />
        <meta property="og:description" content={campaignDesc} />
        <meta
          property="og:url"
          content={`https://joy-fund.com/campaign/${id}/donate`}
        />
        <meta property="og:type" content="website" />
        {campaign?.cover_image && (
          <meta property="og:image" content={campaign.cover_image} />
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DonateAction",
            name: `Donate to ${campaignTitle}`,
            description: campaignDesc,
            url: `https://joy-fund.com/campaign/${id}/donate`,
            action: {
              "@type": "DonateAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `https://joy-fund.com/campaign/${id}/donate`,
              },
            },
          })}
        </script>
      </Helmet>
      {paymentStatus === "success" && (
        <Confetti
          ref={confettiRef}
          manualstart={true}
          className="fixed inset-0 pointer-events-none"
        />
      )}
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 text-sm mb-6 hover:text-gray-700"
          >
            <ArrowLeft size={16} /> {t("donate.back")}
          </button>

          {/* Campaign summary */}
          {campaign && (
            <div
              className="card p-4 flex items-center gap-3 mb-5"
              style={{ borderLeft: `4px solid ${color}` }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: color }}
              >
                <Heart size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#1A1A2E] truncate">
                  {campaign.title}
                </p>
                <p className="text-xs text-gray-500">
                  {formatXAF(campaign.total_net_raised || 0)} raised of{" "}
                  {formatXAF(campaign.goal_amount || 0)}
                </p>
              </div>
            </div>
          )}

          {/* Payment status message */}
          {showStatusMessage && paymentStatus && (
            <div
              className={`card p-4 mb-5 border-l-4 flex items-start justify-between ${
                paymentStatus === "success"
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <div className="flex-1">
                <p
                  className={`font-bold text-sm ${
                    paymentStatus === "success"
                      ? "text-emerald-900"
                      : "text-red-900"
                  }`}
                >
                  {paymentStatus === "success"
                    ? "✓ Payment Successful!"
                    : "✗ Payment Failed"}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    paymentStatus === "success"
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {paymentStatus === "success"
                    ? "Thank you for your donation! Your contribution has been received successfully."
                    : "Your payment could not be processed. Please try again or use a different payment method."}
                </p>
              </div>
              <button
                onClick={() => setShowStatusMessage(false)}
                className={`text-xs font-semibold ml-3 px-2 py-1 rounded ${
                  paymentStatus === "success"
                    ? "text-emerald-600 hover:bg-emerald-100"
                    : "text-red-600 hover:bg-red-100"
                }`}
              >
                Dismiss
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="card p-6 space-y-5"
          >
            <h1 className="text-xl font-black text-[#1A1A2E]">
              {t("donate.makeDonation")}
            </h1>

            {/* Donor name */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Your Name *
              </label>
              <input
                {...register("donorName")}
                className={`input-field ${errors.donorName ? "border-red-500" : ""}`}
                placeholder="e.g. Jean-Pierre Mbarga"
                disabled={isAnonymous}
              />
              {errors.donorName && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.donorName.message}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="anon" {...register("isAnonymous")} />
                <label htmlFor="anon" className="text-xs text-gray-500">
                  Donate anonymously
                </label>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">
                Amount (XAF) *
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setValue("amount", a);
                      setUseCustom(false);
                    }}
                    className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${!useCustom && amount === a ? "text-white" : "border-gray-200 text-gray-700 hover:border-gray-300"}`}
                    style={
                      !useCustom && amount === a
                        ? {
                            background: "var(--primary)",
                            borderColor: "var(--primary)",
                          }
                        : {}
                    }
                  >
                    {formatXAF(a)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${useCustom ? "text-white" : "border-gray-200 text-gray-700"}`}
                  style={
                    useCustom
                      ? {
                          background: "var(--secondary)",
                          borderColor: "var(--secondary)",
                        }
                      : {}
                  }
                >
                  Custom
                </button>
              </div>
              {useCustom && (
                <input
                  className={`input-field ${errors.amount ? "border-red-500" : ""}`}
                  type="number"
                  min={25}
                  step={25}
                  placeholder="Enter amount in XAF (min 1,000)"
                  value={amount}
                  onChange={(e) => setValue("amount", Number(e.target.value))}
                />
              )}
              {errors.amount && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.amount.message}
                </p>
              )}

              {amount > 0 && (
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  = {Math.round((amount / 60000) * 10) / 10} safe{" "}
                  {Math.round(amount / 60000) === 1 ? "delivery" : "deliveries"}{" "}
                  funded
                </p>
              )}

              {amount > 0 && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Donation breakdown
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          Payment aggregator fee (2%)
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatXAF(paymentAggregatorFee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          Operation management ({platformFeePct}%)
                        </span>
                        <span className="font-semibold text-slate-900">
                          {formatXAF(operationsFee)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-700">
                          Total fees
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatXAF(totalFees)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-emerald-100 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
                      What your donation really supports
                    </p>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-600">
                          Net amount sent to healthcare
                        </p>
                        <p className="text-2xl font-black text-emerald-700">
                          {formatXAF(netContribution)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {amount > 0
                            ? Math.round((netContribution / amount) * 100)
                            : 0}
                          % of your donation
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatXAF(amount)} total donation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Message{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                {...register("message")}
                className="input-field resize-none"
                rows={2}
                placeholder="Wishing you all the best on your special day!"
              />
            </div>

            {/* Payment method */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-2 block">
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() =>
                      setValue("paymentMethod", pm.id as "MTN" | "ORANGE")
                    }
                    className={`p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === pm.id ? "text-white" : "border-gray-200 bg-white"}`}
                    style={
                      paymentMethod === pm.id
                        ? { background: pm.color, borderColor: pm.color }
                        : {}
                    }
                  >
                    <div
                      className={`font-bold text-sm ${paymentMethod === pm.id ? "text-white" : "text-gray-900"}`}
                    >
                      {pm.label}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${paymentMethod === pm.id ? "text-white/80" : "text-gray-500"}`}
                    >
                      Prefixes: {pm.prefix}
                    </div>
                  </button>
                ))}
              </div>
              {errors.paymentMethod && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            {/* Phone number */}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Mobile Money Number *
              </label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <InputPhone
                    {...field}
                    defaultCountry="CM"
                    placeholder={
                      paymentMethod === "MTN"
                        ? "67X XXX XXX (MTN)"
                        : "69X XXX XXX (Orange)"
                    }
                    className={errors.phoneNumber ? "border-red-500" : ""}
                  />
                )}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                You will receive a payment prompt on this number.
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full text-sm py-3 flex items-center justify-center gap-2"
              disabled={donateMutation.isPending || !amount}
            >
              {donateMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Initiating
                  Payment…
                </>
              ) : (
                `Donate ${formatXAF(amount || 0)}`
              )}
            </button>

            <p className="text-center text-xs text-gray-400 leading-relaxed">
              2% goes to Campay, {platformFeePct}% to operations (on post-aggregator amount), and {100 - 2 - platformFeePct}%
              goes to healthcare.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DonatePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1DB1DB] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DonatePage />
    </Suspense>
  );
}
