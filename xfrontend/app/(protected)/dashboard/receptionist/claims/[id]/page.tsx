'use client';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  ImageIcon,
  ClipboardCheck,
  User,
  Ticket,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import { formatXAF, formatDate, formatDateTime, statusColor } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { getMedicalClaim } from '@/actions/hospital';
import { getVoucher } from '@/actions/vouchers';
import { useState } from 'react';

export default function ReceptionistClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: claim, isLoading } = useQuery<MedicalClaim>({
    queryKey: ['rec-claim', id, token],
    queryFn: () => getMedicalClaim(id, token),
    enabled: !!token && !!id,
  });

  const voucherId = claim?.voucher;

  const { data: voucher, isLoading: vLoading } = useQuery<Voucher>({
    queryKey: ['rec-claim-voucher', voucherId, token],
    queryFn: () => getVoucher(voucherId!, token),
    enabled: !!token && !!voucherId,
  });

  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!claim) {
    return <div className="text-center py-16 text-gray-400">Claim not found.</div>;
  }

  const items = claim.claim_items || [];
  const proofs = claim.proofs || [];
  const totalCost = Number(claim.total_cost || 0);

  return (
    <>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to Claims
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            Claim Detail
            <span className={`badge text-xs ${statusColor(claim.claim_status)}`}>
              {claim.claim_status?.replace(/_/g, ' ')}
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono">#{String(claim.id).slice(-8)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: '#1D75DB' }}>{formatXAF(totalCost)}</p>
          <p className="text-xs text-gray-400">Total Cost</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText size={14} /> Claim Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Claim ID" value={`#${String(claim.id).slice(-8)}`} mono />
              <Detail label="Status" value={<span className={`badge ${statusColor(claim.claim_status)}`}>{claim.claim_status?.replace(/_/g, ' ')}</span>} />
              <Detail label="Total Cost" value={formatXAF(totalCost)} />
              <Detail label="Service Description" value={claim.service_description || '—'} className="col-span-2" />
              <Detail label="Submitted At" value={claim.submitted_at ? formatDateTime(claim.submitted_at) : '—'} />
              <Detail label="Reviewed At" value={claim.reviewed_at ? formatDateTime(claim.reviewed_at) : '—'} />
              <Detail label="Service Completed At" value={claim.service_completed_at ? formatDateTime(claim.service_completed_at) : '—'} />
              {claim.rejection_reason && (
                <Detail label="Rejection Reason" value={claim.rejection_reason} className="col-span-2" />
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Receipt size={14} /> Claim Items ({items.length})
            </h2>
            {items.length === 0 ? (
              <p className="text-gray-400 text-xs">No items recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Item</th>
                      <th className="text-right p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any, i: number) => (
                      <tr key={item.id || i} className="border-b border-gray-50">
                        <td className="p-2 text-gray-400">{i + 1}</td>
                        <td className="p-2 font-medium text-gray-900">{item.name}</td>
                        <td className="p-2 text-right font-semibold" style={{ color: '#1D75DB' }}>{formatXAF(Number(item.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-semibold text-gray-500">
                    <tr>
                      <td className="p-2" />
                      <td className="p-2 text-right">Total</td>
                      <td className="p-2 text-right" style={{ color: '#1D75DB' }}>{formatXAF(totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {voucherId && (
            <div className="space-y-5 border-t-2 border-[#1D75DB]/20 pt-5">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Ticket size={14} style={{ color: '#1D75DB' }} /> Associated Voucher
              </h2>

              {vLoading ? (
                <div className="card"><div className="h-40 bg-gray-100 rounded animate-pulse" /></div>
              ) : voucher ? (
                <>
                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Voucher Information</h3>
                      <span className={`badge text-xs ${statusColor(voucher.status)}`}>
                        {voucher.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="font-mono text-sm font-bold text-gray-700 bg-gray-100 rounded-lg px-3 py-1 select-all">
                        {voucher.voucher_code}
                      </code>
                      <button onClick={() => copyCode(voucher.voucher_code)} className="text-gray-400 hover:text-gray-600 p-1" title="Copy code">
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Detail label="Language" value={voucher.language_preference?.toUpperCase() || 'FR'} />
                      <Detail label="Expiry Date" value={voucher.expiry_date ? formatDate(voucher.expiry_date) : '—'} />
                      <Detail label="Created" value={formatDateTime(voucher.created_at)} />
                      <Detail label="Locked At" value={voucher.locked_at ? formatDateTime(voucher.locked_at) : '—'} />
                      <Detail label="Redeemed At" value={voucher.redeemed_at ? formatDateTime(voucher.redeemed_at) : '—'} />
                      <Detail label="Expired At" value={voucher.expired_at ? formatDateTime(voucher.expired_at) : '—'} />
                      {voucher.patient_confirmation_pin && (
                        <Detail label="Confirmation PIN" value={voucher.patient_confirmation_pin} mono />
                      )}
                    </div>
                  </div>

                  {voucher.beneficiary && (
                    <div className="card">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <User size={14} /> Beneficiary
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Detail label="Full Name" value={voucher.beneficiary.full_name} />
                        <Detail label="Digital Health ID" value={voucher.beneficiary.digital_health_id || '—'} mono />
                        <Detail label="Gender" value={voucher.beneficiary.gender} />
                        <Detail label="Category" value={voucher.beneficiary.category} />
                        <Detail label="Date of Birth" value={voucher.beneficiary.date_of_birth ? formatDate(voucher.beneficiary.date_of_birth) : '—'} />
                        <Detail label="Phone" value={voucher.beneficiary.phone} />
                        <Detail label="Region" value={voucher.beneficiary.region} />
                        {voucher.beneficiary.city && <Detail label="City" value={voucher.beneficiary.city} />}
                        {voucher.beneficiary.emergency_contact_name && (
                          <Detail label="Emergency Contact" value={`${voucher.beneficiary.emergency_contact_name} · ${voucher.beneficiary.emergency_contact_phone}`} />
                        )}
                      </div>
                    </div>
                  )}

                  {voucher.events && voucher.events.length > 0 && (
                    <div className="card">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Activity size={14} /> Voucher Activity Timeline
                      </h3>
                      <div className="space-y-0">
                        {[...(voucher.events || [])].reverse().map((event: any, i: number, arr: any[]) => (
                          <div key={event.id || i} className="flex gap-3 pb-3">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: '#1D75DB' }} />
                              {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-800">{event.status?.replace(/_/g, ' ')}</p>
                              {event.notes && <p className="text-xs text-gray-500 mt-0.5">{event.notes}</p>}
                              <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(event.changed_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="card"><p className="text-gray-400 text-xs text-center py-8">Could not load voucher details.</p></div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <ClipboardCheck size={14} /> Proof Documents ({proofs.length})
            </h2>
            {proofs.length === 0 ? (
              <p className="text-gray-400 text-xs">No proof documents uploaded.</p>
            ) : (
              <div className="space-y-3">
                {proofs.map((proof: any) => (
                  <div key={proof.id} className="border border-gray-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-700 uppercase">{proof.document_type?.replace(/_/g, ' ')}</span>
                    </div>
                    {proof.file && (
                      <a
                        href={proof.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold hover:underline block mb-2 truncate"
                        style={{ color: '#1D75DB' }}
                      >
                        View Document
                      </a>
                    )}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{proof.uploaded_at ? formatDate(proof.uploaded_at) : '—'}</span>
                      {proof.verification_status && (
                        <span className={`badge inline-flex items-center gap-1 text-xs ${
                          proof.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          proof.verification_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          proof.verification_status === 'FLAGGED' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {proof.verification_status === 'VERIFIED' ? <CheckCircle size={12} /> :
                           proof.verification_status === 'REJECTED' ? <XCircle size={12} /> :
                           <Clock size={12} />} {proof.verification_status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Detail({ label, value, mono, className }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}
