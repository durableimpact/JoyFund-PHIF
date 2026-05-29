'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { formatXAF, formatDate } from '@/lib/utils';
import { getDisbursement } from '@/actions/disbursement';

export default function DisbursementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: disbursementDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: ['disbursement-detail', id, token],
    queryFn: () => getDisbursement(id, token),
    enabled: !!id && !!token,
  });

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Disbursement Detail</h1>
          <p className="text-gray-500 text-sm">View complete information for this disbursement</p>
        </div>
      </div>

      <div className="card max-w-3xl">
        {isDetailLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-[#1D75DB] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : disbursementDetail ? (
          <div className="p-6">
            <div className="space-y-4 text-sm">
              {[
                ['Amount', formatXAF(Number(disbursementDetail.amount))],
                ['Payment Method', disbursementDetail.payment_method_display || disbursementDetail.payment_method],
                ['Status', disbursementDetail.status_display || disbursementDetail.status],
                ['Recipient Phone', disbursementDetail.recipient_phone || '—'],
                ['Recipient Account', disbursementDetail.recipient_account || '—'],
                ['External Reference', disbursementDetail.external_reference || '—'],
                ['Gateway Transaction', disbursementDetail.gateway_transaction_id || '—'],
                ['Voucher Code', disbursementDetail.voucher_code || disbursementDetail.voucher?.voucher_code || '—'],
                ['Notes', disbursementDetail.notes || '—'],
                ['Created At', disbursementDetail.created_at ? formatDate(disbursementDetail.created_at) : '—'],
                ['Disbursed At', disbursementDetail.disbursed_at ? formatDate(disbursementDetail.disbursed_at) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="text-gray-500 font-medium">{k}</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{v}</span>
                </div>
              ))}
              
              {disbursementDetail.voucher && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Voucher Details</h3>
                  <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-sm text-gray-500">Code</span>
                      <span className="text-sm font-semibold text-gray-900">{disbursementDetail.voucher.voucher_code}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className="text-sm font-semibold text-gray-900">{disbursementDetail.voucher.status}</span>
                    </div>
                    {disbursementDetail.voucher.medical_claim && (
                      <div className="flex justify-between mt-1 pt-1">
                        <span className="text-sm text-gray-500">Claim Cost</span>
                        <span className="text-sm font-bold text-[#1D75DB]">{formatXAF(Number(disbursementDetail.voucher.medical_claim.total_cost))}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {disbursementDetail.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mt-4">
                  <span className="font-semibold">Error: </span>{disbursementDetail.error_message}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-500">Failed to load details</div>
        )}
      </div>
    </>
  );
}
