"use client";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Gift, CreditCard, User, MessageSquare } from "lucide-react";
import { formatXAF, formatDate, formatDateTime } from "@/lib/utils";
import { getDonation } from "@/actions/campaigns";

export default function DonationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: donation, isLoading } = useQuery({
    queryKey: ["donation", id],
    queryFn: () => getDonation(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-[#471DDB] animate-spin" />
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Donation not found</p>
      </div>
    );
  }

  const payment = (donation as any).payment;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} /> Back to Donations
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Donation Details</h1>
        <p className="text-gray-500 text-sm">ID: {donation.id}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Donation Info */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Gift size={18} className="text-[#471DDB]" />
            <h2 className="font-bold text-gray-900">Donation</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-lg text-gray-900">{formatXAF(donation.amount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${donation.status === "SUCCESS" ? "bg-green-100 text-green-700" : donation.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{donation.status}</span>
            </div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Campaign</span><span className="font-medium text-gray-900 text-right max-w-[200px]">{(donation as any).campaign_title || donation.campaign_id}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span className="text-gray-400 text-sm">{formatDateTime(donation.created_at)}</span></div>
          </div>
        </div>

        {/* Donor Info */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[#471DDB]" />
            <h2 className="font-bold text-gray-900">Donor</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Name</span><span className="font-medium text-gray-900">{donation.donor_name || "Anonymous"}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Anonymous</span><span className={donation.is_anonymous ? "text-amber-600 font-semibold" : "text-gray-400"}>{donation.is_anonymous ? "Yes" : "No"}</span></div>
            {donation.message && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-gray-500 text-sm"><MessageSquare size={14} /> Message</div>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{donation.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="md:col-span-2 card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={18} className="text-[#471DDB]" />
            <h2 className="font-bold text-gray-900">Payment</h2>
          </div>
          {payment ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Method</p>
                <p className="font-semibold text-gray-900">{payment.payment_method}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Phone</p>
                <p className="font-semibold text-gray-900">{payment.phone_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Amount</p>
                <p className="font-bold text-lg text-gray-900">{formatXAF(payment.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Status</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                  payment.payment_status === "SUCCESS" ? "bg-green-100 text-green-700" :
                  payment.payment_status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>{payment.payment_status}</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Reference</p>
                <p className="font-mono text-sm text-gray-600 break-all">{payment.payment_reference || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Created</p>
                <p className="text-sm text-gray-600">{formatDateTime(payment.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide mb-1">Updated</p>
                <p className="text-sm text-gray-600">{formatDateTime(payment.updated_at)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No payment information available</p>
          )}
        </div>
      </div>
    </div>
  );
}
