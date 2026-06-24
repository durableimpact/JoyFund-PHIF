"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Heart,
  Gift,
  Calendar,
  Tag,
  User as UserIcon,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { formatXAF, formatDateTime } from "@/lib/utils";
import { getCampaign, listCampaignDonations } from "@/actions/campaigns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [txFilter, setTxFilter] = useState("ALL");
  const [selectedDonation, setSelectedDonation] = useState<any>(null);

  // Fetch campaign
  const { data: response, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["admin-campaign", id, token],
    queryFn: async () => await getCampaign(id as string, token),
    enabled: !!id && sessionStatus !== "loading",
    retry: 1,
  });

  // Fetch donations
  const { data: donationsResponse, isLoading: donationsLoading } = useQuery({
    queryKey: ["admin-campaign-donations", id, token],
    queryFn: async () =>
      await listCampaignDonations(id as string, { page_size: "100" }, token),
    enabled: !!id && sessionStatus !== "loading",
  });

  const campaign = response ? ((response as any).json || response) : null;
  const donations = (donationsResponse as any)?.results || (Array.isArray(donationsResponse) ? donationsResponse : []);

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600 bg-green-50 border-green-100";
      case "DRAFT":
        return "text-gray-600 bg-gray-50 border-gray-100";
      case "FUNDED":
        return "text-blue-600 bg-blue-50 border-blue-100";
      case "CLOSED":
        return "text-red-600 bg-red-50 border-red-100";
      case "INACTIVE":
        return "text-orange-600 bg-orange-50 border-orange-100";
      case "CANCELLED":
        return "text-red-600 bg-red-50 border-red-100";
      default:
        return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  const txTypeInfo = (type: string) => {
    switch (type) {
      case "DONATION":
        return {
          label: "Donation",
          icon: <ArrowDownLeft size={12} />,
          color: "text-green-600 bg-green-50",
        };
      case "VOUCHER_ALLOCATED":
        return {
          label: "Allocation",
          icon: <ArrowUpRight size={12} />,
          color: "text-blue-600 bg-blue-50",
        };
      case "HOSPITAL_SETTLED":
        return {
          label: "Settlement",
          icon: <Building2 size={12} />,
          color: "text-purple-600 bg-purple-50",
        };
      case "SURPLUS_REFUND":
        return {
          label: "Refund",
          icon: <CheckCircle2 size={12} />,
          color: "text-amber-600 bg-amber-50",
        };
      default:
        return {
          label: type,
          icon: <TrendingUp size={12} />,
          color: "text-gray-600 bg-gray-50",
        };
    }
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-[#471DDB]" />
      </div>
    );
  }

  if (isError || !campaign) {
    const isUnauthorized = (queryError as any)?.message?.includes('401') || (queryError as any)?.message?.includes('403');
    
    return (
      <div className="text-center py-20 px-4">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isUnauthorized ? 'Access Denied' : 'Campaign Not Found'}
        </h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {isUnauthorized 
            ? 'You do not have the required permissions to audit this campaign or your session has expired.'
            : 'The campaign you are looking for does not exist or has been removed.'}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => router.back()} className="btn-secondary px-6 py-2 rounded-xl text-sm font-bold border border-gray-200">
            Go Back
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary px-6 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: '#471DDB' }}
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  const progress = campaign.progress_percentage || 0;
  const transactions = (campaign.transactions || []).filter(
    (tx: any) => txFilter === "ALL" || tx.transaction_type === txFilter,
  );
  const voucherFundings = campaign.voucher_fundings || [];
  const events = campaign.events || [];
  const donor = campaign.donor?.user || {};

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 w-full overflow-x-hidden px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm shrink-0"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Campaign Audit
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor(campaign.status)}`}
              >
                {campaign.status}
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-500 text-xs font-medium truncate">
                ID: {campaign.id}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/campaign/${campaign.id}`}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm self-start sm:self-auto"
        >
          <ExternalLink size={16} /> Public View
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Transactions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="card overflow-hidden">
            {campaign.cover_image && (
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={campaign.cover_image}
                  alt="Campaign cover"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-2 text-[#471DDB] font-bold text-xs uppercase tracking-wider">
                <Tag size={14} />
                {campaign.event_type}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-4 break-words">
                {campaign.title}
              </h2>
              <p className="text-gray-600 leading-relaxed break-words">
                {campaign.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#471DDB] shadow-sm">
                    {donor.profile_picture ? (
                      <Image
                        src={donor.profile_picture}
                        alt="Donor"
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <UserIcon size={20} />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                      Organized By
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate max-w-[180px] sm:max-w-none">
                      {donor.first_name
                        ? `${donor.first_name} ${donor.last_name}`
                        : "Anonymous Donor"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#471DDB] shadow-sm">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                      Timeline
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {new Date(campaign.created_at).toLocaleDateString()} —{" "}
                      {new Date(campaign.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Ledger */}
          <div className="card p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-2 bg-[#471DDB]/10 rounded-lg text-[#471DDB]">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Transaction Ledger
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100 overflow-x-auto no-scrollbar w-full md:w-auto">
                {[
                  "ALL",
                  "DONATION",
                  "VOUCHER_ALLOCATED",
                  "HOSPITAL_SETTLED",
                  "SURPLUS_REFUND",
                ].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTxFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      txFilter === type
                        ? "bg-[#471DDB] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {type.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Clock size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  No matching transactions recorded yet.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="md:hidden space-y-3">
                  {transactions.map((tx: any) => {
                    const info = txTypeInfo(tx.transaction_type);
                    return (
                      <div key={tx.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${info.color}`}>{info.icon}{info.label}</span>
                          <span className={`font-black text-xs ${tx.transaction_type === "DONATION" || tx.transaction_type === "SURPLUS_REFUND" ? "text-green-600" : "text-red-600"}`}>
                            {tx.transaction_type === "DONATION" || tx.transaction_type === "SURPLUS_REFUND" ? "+" : "-"} {formatXAF(tx.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Description</span><span className="text-xs text-gray-600 truncate max-w-[200px]">{tx.description}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</span></div>
                      </div>
                    );
                  })}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block overflow-hidden border border-gray-100 rounded-2xl">
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white shadow-sm z-10">
                        <tr className="text-left border-b border-gray-100">
                          <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Type</th>
                          <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Description</th>
                          <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Amount</th>
                          <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {transactions.map((tx: any) => {
                          const info = txTypeInfo(tx.transaction_type);
                          return (
                            <tr key={tx.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${info.color}`}>
                                  {info.icon}{info.label}
                                </span>
                              </td>
                              <td className="p-4">
                                <p className="text-xs text-gray-600 line-clamp-1" title={tx.description}>{tx.description}</p>
                              </td>
                              <td className="p-4 text-right">
                                <p className={`font-black text-xs ${tx.transaction_type === "DONATION" || tx.transaction_type === "SURPLUS_REFUND" ? "text-green-600" : "text-red-600"}`}>
                                  {tx.transaction_type === "DONATION" || tx.transaction_type === "SURPLUS_REFUND" ? "+" : "-"} {formatXAF(tx.amount)}
                                </p>
                              </td>
                              <td className="p-4 text-gray-400 text-[10px] text-right">{new Date(tx.created_at).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detailed Donation History */}
          <div className="card p-4 md:p-6">
            <div className="flex items-start sm:items-center justify-between mb-6 gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <Gift size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Donation History
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md shrink-0">
                {donations.length} Contribution{donations.length !== 1 ? "s" : ""}
              </span>
            </div>

            {donationsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Heart size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  No donations received for this campaign.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="md:hidden space-y-3">
                  {donations.map((d: any) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDonation(d)}
                      className="w-full text-left border border-gray-100 rounded-xl p-4 space-y-2 hover:border-[#471DDB]/20 hover:bg-[#471DDB]/[0.02] transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <UserIcon size={12} />
                          </div>
                          <span className="font-bold text-gray-900 text-xs">
                            {d.is_anonymous ? "Anonymous" : d.donor_name || "Guest"}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Gross</span>
                        <span className="font-black text-xs text-gray-900">{formatXAF(d.payment?.amount || d.amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Net to Campaign</span>
                        <span className="font-bold text-xs text-green-600">{formatXAF(d.net_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{new Date(d.created_at).toLocaleDateString()}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          d.status === "SUCCESS" ? "text-green-600 bg-green-50" :
                          d.status === "FAILED" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"
                        }`}>{d.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden md:block overflow-hidden border border-gray-100 rounded-2xl">
                  <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white shadow-sm z-10">
                        <tr className="text-left border-b border-gray-100">
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Donor</th>
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider">Method</th>
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Gross Amount</th>
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Aggregator Fee</th>
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Platform Fee</th>
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Net to Campaign</th>
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-center">Status</th>
                          <th className="p-3 font-bold text-gray-400 text-[10px] uppercase tracking-wider text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {donations.map((d: any) => (
                          <tr
                            key={d.id}
                            onClick={() => setSelectedDonation(d)}
                            className="group hover:bg-[#471DDB]/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                  <UserIcon size={12} />
                                </div>
                                <p className="font-bold text-gray-900 text-xs">
                                  {d.is_anonymous ? "Anonymous" : d.donor_name || "Guest"}
                                </p>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                d.payment?.payment_method === "MTN" ? "text-yellow-700 bg-yellow-50" : "text-orange-700 bg-orange-50"
                              }`}>
                                {d.payment?.payment_method || "—"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <p className="font-black text-xs text-gray-900">{formatXAF(d.payment?.amount || d.amount)}</p>
                            </td>
                            <td className="p-3 text-right">
                              <p className="text-xs text-red-500 font-medium">-{formatXAF(d.payment?.aggregator_fee || 0)}</p>
                            </td>
                            <td className="p-3 text-right">
                              <p className="text-xs text-amber-600 font-medium">-{formatXAF(d.platform_fee_amount || 0)}</p>
                            </td>
                            <td className="p-3 text-right">
                              <p className="text-xs font-bold text-green-600">{formatXAF(d.net_amount || 0)}</p>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                d.status === "SUCCESS" ? "text-green-600 bg-green-50" :
                                d.status === "FAILED" ? "text-red-600 bg-red-50" : "text-amber-600 bg-amber-50"
                              }`}>{d.status}</span>
                            </td>
                            <td className="p-3 text-gray-400 text-[10px] text-right">{new Date(d.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Donation Detail Dialog */}
          <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              {selectedDonation && (() => {
                const d = selectedDonation;
                const payment = d.payment || {};
                const gross = Number(payment.amount || d.amount || 0);
                const aggFee = Number(payment.aggregator_fee || 0);
                const platformFee = Number(d.platform_fee_amount || 0);
                const net = Number(d.net_amount || 0);
                const appAmount = gross - aggFee;

                return (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-black text-gray-900">
                        Donation Detail
                      </DialogTitle>
                    </DialogHeader>

                    {/* Donor + Status Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#471DDB]/10 flex items-center justify-center text-[#471DDB]">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {d.is_anonymous ? "Anonymous" : d.donor_name || "Guest"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(d.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        d.status === "SUCCESS" ? "text-green-600 bg-green-100" :
                        d.status === "FAILED" ? "text-red-600 bg-red-100" : "text-amber-600 bg-amber-100"
                      }`}>{d.status}</span>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="space-y-0 border border-gray-100 rounded-2xl overflow-hidden">
                      <div className="flex justify-between items-center p-4 bg-white">
                        <span className="text-sm text-gray-600">Gross Amount (what donor paid)</span>
                        <span className="text-sm font-black text-gray-900">{formatXAF(gross)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Aggregator Fee ({payment.payment_method || "—"})</span>
                        <span className="text-sm font-medium text-red-500">-{formatXAF(aggFee)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white border-t border-gray-100">
                        <span className="text-sm text-gray-600">App Amount (received by platform)</span>
                        <span className="text-sm font-bold text-gray-700">{formatXAF(appAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Platform Fee (JoyFund)</span>
                        <span className="text-sm font-medium text-amber-600">-{formatXAF(platformFee)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-green-50 border-t border-green-100">
                        <span className="text-sm font-bold text-green-700">Net to Campaign</span>
                        <span className="text-sm font-black text-green-700">{formatXAF(net)}</span>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard size={14} /> Payment Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Method</p>
                          <p className="text-sm font-bold text-gray-900">{payment.payment_method || "—"}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Phone</p>
                          <p className="text-sm font-bold text-gray-900">{payment.phone_number || "—"}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Reference</p>
                          <p className="text-xs font-mono text-gray-600 break-all">{payment.payment_reference || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {d.message && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <MessageSquare size={14} /> Donor Message
                        </h4>
                        <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                          {d.message}
                        </div>
                      </div>
                    )}

                    {/* IDs */}
                    <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Donation ID</span>
                        <span className="text-[10px] font-mono text-gray-500">{d.id}</span>
                      </div>
                      {payment.payment_id && (
                        <div className="flex justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Payment ID</span>
                          <span className="text-[10px] font-mono text-gray-500">{payment.payment_id}</span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>

          {/* Voucher Fundings / Impact */}
          <div className="card p-4 md:p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Gift size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Beneficiary Support
              </h3>
            </div>

            <div className="grid gap-4">
              {voucherFundings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No vouchers have been funded by this campaign yet.
                </div>
              ) : (
                voucherFundings.map((vf: any) => (
                  <div
                    key={vf.id}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#471DDB] shadow-sm shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {vf.voucher.beneficiary_name}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">
                          {vf.voucher.hospital} • {vf.voucher.voucher_code}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                              vf.status === "UTILIZED"
                                ? "text-emerald-700 bg-emerald-100"
                                : "text-blue-700 bg-blue-100"
                            }`}
                          >
                            {vf.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 sm:text-right">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">
                          Committed
                        </p>
                        <p className="text-xs font-bold text-gray-700">
                          {formatXAF(vf.committed_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">
                          Utilized
                        </p>
                        <p className="text-xs font-bold text-emerald-600">
                          {formatXAF(vf.utilized_amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financials & Events */}
        <div className="space-y-6">
          {/* Wallet Summary */}
          <div className="card p-4 md:p-6 bg-[#471DDB] text-white">
            <h3 className="font-bold text-white/80 text-xs uppercase tracking-wider mb-6 flex items-center gap-2">
              <Wallet size={14} />
              Campaign Wallet
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-3xl sm:text-4xl font-black mb-1 truncate">
                  {formatXAF(campaign.available_balance || 0)}
                </p>
                <p className="text-white/60 text-xs font-medium uppercase tracking-tight">
                  Available Balance
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-tight mb-1">
                      Total Net Raised
                    </p>
                    <p className="text-xl font-bold">
                      {formatXAF(campaign.total_net_raised)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-tight mb-1">
                      Completion
                    </p>
                    <p className="text-xl font-bold">{progress.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-tight mb-1">
                    Goal Amount
                  </p>
                  <p className="text-sm font-bold">
                    {formatXAF(campaign.goal_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-tight mb-1">
                    Vouchers Funded
                  </p>
                  <p className="text-sm font-bold">{voucherFundings.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline / Events */}
          <div className="card p-4 md:p-6">
            <h3 className="font-bold text-gray-900 text-sm mb-6 flex items-center gap-2">
              <Clock size={18} className="text-[#471DDB]" />
              Status History
            </h3>
            <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {events.length === 0 ? (
                <p className="text-xs text-gray-400 pl-6">
                  No status changes recorded.
                </p>
              ) : (
                events.map((event: any, idx: number) => (
                  <div key={event.id || idx} className="relative pl-8">
                    <div
                      className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        event.status === "ACTIVE"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                      {event.status}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {event.notes}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      {new Date(event.changed_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Oversight */}
          <div className="card p-4 md:p-6 border-2 border-amber-100 bg-amber-50/30">
            <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-600" />
              Administrative View
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-xl border border-amber-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">
                  Visibility
                </p>
                <p className="text-sm font-bold text-gray-700">
                  {campaign.is_public ? "Public" : "Private"}
                </p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">
                  Operational Status
                </p>
                <p className="text-sm font-bold text-gray-700">
                  {campaign.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
