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
import { useI18n } from '@/locales/client';

export default function ReceptionistClaimDetailPage() {
  const t = useI18n();
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
    return <div className="text-center py-16 text-gray-400">{t('receptionist.claims.detail.notFound')}</div>;
  }

  const items = claim.claim_items || [];
  const proofs = claim.proofs || [];
  const totalCost = Number(claim.total_cost || 0);

  return (
    <>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> {t('receptionist.claims.detail.backToClaims')}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {t('receptionist.claims.detail.title')}
            <span className={`badge text-xs ${statusColor(claim.claim_status)}`}>
              {claim.claim_status?.replace(/_/g, ' ')}
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-mono">#{String(claim.id).slice(-8)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: '#1D75DB' }}>{formatXAF(totalCost)}</p>
          <p className="text-xs text-gray-400">{t('receptionist.claims.detail.totalCost')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText size={14} /> {t('receptionist.claims.detail.claimInformation')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label={t('receptionist.claims.detail.claimId')} value={`#${String(claim.id).slice(-8)}`} mono />
              <Detail label={t('receptionist.claims.detail.status')} value={<span className={`badge ${statusColor(claim.claim_status)}`}>{claim.claim_status?.replace(/_/g, ' ')}</span>} />
              <Detail label={t('receptionist.claims.detail.totalCost')} value={formatXAF(totalCost)} />
              <Detail label={t('receptionist.claims.detail.serviceDescription')} value={claim.service_description || '—'} className="col-span-2" />
              <Detail label={t('receptionist.claims.detail.submittedAt')} value={claim.submitted_at ? formatDateTime(claim.submitted_at) : '—'} />
              <Detail label={t('receptionist.claims.detail.reviewedAt')} value={claim.reviewed_at ? formatDateTime(claim.reviewed_at) : '—'} />
              <Detail label={t('receptionist.claims.detail.serviceCompletedAt')} value={claim.service_completed_at ? formatDateTime(claim.service_completed_at) : '—'} />
              {claim.rejection_reason && (
                <Detail label={t('receptionist.claims.detail.rejectionReason')} value={claim.rejection_reason} className="col-span-2" />
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Receipt size={14} /> {t('receptionist.claims.detail.claimItems', { count: items.length })}
            </h2>
            {items.length === 0 ? (
              <p className="text-gray-400 text-xs">{t('receptionist.claims.detail.noItems')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="text-left p-2">{t('receptionist.claims.detail.colNum')}</th>
                      <th className="text-left p-2">{t('receptionist.claims.detail.colItem')}</th>
                      <th className="text-right p-2">{t('receptionist.claims.detail.colAmount')}</th>
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
                      <td className="p-2 text-right">{t('receptionist.claims.detail.total')}</td>
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
                <Ticket size={14} style={{ color: '#1D75DB' }} /> {t('receptionist.claims.detail.associatedVoucher')}
              </h2>

              {vLoading ? (
                <div className="card"><div className="h-40 bg-gray-100 rounded animate-pulse" /></div>
              ) : voucher ? (
                <>
                  <div className="card">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">{t('receptionist.claims.detail.voucherInfo')}</h3>
                      <span className={`badge text-xs ${statusColor(voucher.status)}`}>
                        {voucher.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <code className="font-mono text-sm font-bold text-gray-700 bg-gray-100 rounded-lg px-3 py-1 select-all">
                        {voucher.voucher_code}
                      </code>
                      <button onClick={() => copyCode(voucher.voucher_code)} className="text-gray-400 hover:text-gray-600 p-1" title={t('receptionist.claims.detail.copyCode')}>
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Detail label={t('receptionist.claims.detail.language')} value={voucher.language_preference?.toUpperCase() || 'FR'} />
                      <Detail label={t('receptionist.claims.detail.expiryDate')} value={voucher.expiry_date ? formatDate(voucher.expiry_date) : '—'} />
                      <Detail label={t('receptionist.claims.detail.created')} value={formatDateTime(voucher.created_at)} />
                      <Detail label={t('receptionist.claims.detail.lockedAt')} value={voucher.locked_at ? formatDateTime(voucher.locked_at) : '—'} />
                      <Detail label={t('receptionist.claims.detail.redeemedAt')} value={voucher.redeemed_at ? formatDateTime(voucher.redeemed_at) : '—'} />
                      <Detail label={t('receptionist.claims.detail.expiredAt')} value={voucher.expired_at ? formatDateTime(voucher.expired_at) : '—'} />
                      {voucher.patient_confirmation_pin && (
                        <Detail label={t('receptionist.claims.detail.confirmationPin')} value={voucher.patient_confirmation_pin} mono />
                      )}
                    </div>
                  </div>

                  {voucher.beneficiary && (
                    <div className="card">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <User size={14} /> {t('receptionist.claims.detail.beneficiary')}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Detail label={t('receptionist.claims.detail.fullName')} value={voucher.beneficiary.full_name} />
                        <Detail label={t('receptionist.claims.detail.digitalHealthId')} value={voucher.beneficiary.digital_health_id || '—'} mono />
                        <Detail label={t('receptionist.claims.detail.gender')} value={voucher.beneficiary.gender} />
                        <Detail label={t('receptionist.claims.detail.category')} value={voucher.beneficiary.category} />
                        <Detail label={t('receptionist.claims.detail.dateOfBirth')} value={voucher.beneficiary.date_of_birth ? formatDate(voucher.beneficiary.date_of_birth) : '—'} />
                        <Detail label={t('receptionist.claims.detail.phone')} value={voucher.beneficiary.phone} />
                        <Detail label={t('receptionist.claims.detail.region')} value={voucher.beneficiary.region} />
                        {voucher.beneficiary.city && <Detail label={t('receptionist.claims.detail.city')} value={voucher.beneficiary.city} />}
                        {voucher.beneficiary.emergency_contact_name && (
                          <Detail label={t('receptionist.claims.detail.emergencyContact')} value={`${voucher.beneficiary.emergency_contact_name} · ${voucher.beneficiary.emergency_contact_phone}`} />
                        )}
                      </div>
                    </div>
                  )}

                  {voucher.events && voucher.events.length > 0 && (
                    <div className="card">
                      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Activity size={14} /> {t('receptionist.claims.detail.activityTimeline')}
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
                <div className="card"><p className="text-gray-400 text-xs text-center py-8">{t('receptionist.claims.detail.voucherLoadError')}</p></div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <ClipboardCheck size={14} /> {t('receptionist.claims.detail.proofDocuments', { count: proofs.length })}
            </h2>
            {proofs.length === 0 ? (
              <p className="text-gray-400 text-xs">{t('receptionist.claims.detail.noProofs')}</p>
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
                        {t('receptionist.claims.detail.viewDocument')}
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
