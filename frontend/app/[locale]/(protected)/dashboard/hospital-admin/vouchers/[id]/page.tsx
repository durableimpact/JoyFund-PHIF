'use client';
import {
  Activity,
  ArrowLeft,
  Banknote,
  Check,
  Copy,
  MapPin,
  User
} from 'lucide-react';
import { formatXAF, statusColor, formatDate, formatDateTime } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { getVoucher } from '@/actions/vouchers';
import { useState } from 'react';
import { useI18n } from '@/locales/client';

export default function HospitalAdminVoucherDetailPage() {
  const t = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [copied, setCopied] = useState(false);

  const { data: voucher, isLoading } = useQuery<Voucher>({
    queryKey: ['ha-voucher', id, token],
    queryFn: () => getVoucher(id, token),
    enabled: !!token && !!id,
  });

  const copyCode = () => {
    if (voucher?.voucher_code) {
      navigator.clipboard.writeText(voucher.voucher_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!voucher) {
    return <div className="text-center py-16 text-gray-400">{t('hospitalAdmin.voucherDetail.notFound')}</div>;
  }

  const events = (voucher.events || []).slice().reverse();
  const fundings = voucher.funding_records || [];
  const totalCommitted = fundings.reduce((sum, f) => sum + Number(f.committed_amount || 0), 0);
  const totalUtilized = fundings.reduce((sum, f) => sum + Number(f.utilized_amount || 0), 0);

  return (
    <>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> {t('hospitalAdmin.voucherDetail.backToVouchers')}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {t('hospitalAdmin.voucherDetail.title')}
            <span className={`badge text-xs ${statusColor(voucher.status)}`}>
              {voucher.status?.replace(/_/g, ' ')}
            </span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <code className="font-mono text-sm font-bold text-gray-700 bg-gray-100 rounded-lg px-3 py-1 select-all">
              {voucher.voucher_code}
            </code>
            <button onClick={copyCode} className="text-gray-400 hover:text-gray-600 p-1" title={t('hospitalAdmin.voucherDetail.copyCode')}>
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Main info ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Key details card */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">{t('hospitalAdmin.voucherDetail.voucherInfo')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label={t('hospitalAdmin.voucherDetail.voucherCode')} value={voucher.voucher_code} mono />
              <Detail label={t('hospitalAdmin.voucherDetail.status')} value={<span className={`badge ${statusColor(voucher.status)}`}>{voucher.status?.replace(/_/g, ' ')}</span>} />
              <Detail label={t('hospitalAdmin.voucherDetail.language')} value={voucher.language_preference?.toUpperCase() || 'FR'} />
              <Detail label={t('hospitalAdmin.voucherDetail.expiryDate')} value={voucher.expiry_date ? formatDate(voucher.expiry_date) : '—'} />
              <Detail label={t('hospitalAdmin.voucherDetail.created')} value={formatDateTime(voucher.created_at)} />
              <Detail label={t('hospitalAdmin.voucherDetail.lockedAt')} value={voucher.locked_at ? formatDateTime(voucher.locked_at) : '—'} />
              <Detail label={t('hospitalAdmin.voucherDetail.redeemedAt')} value={voucher.redeemed_at ? formatDateTime(voucher.redeemed_at) : '—'} />
              <Detail label={t('hospitalAdmin.voucherDetail.expiredAt')} value={voucher.expired_at ? formatDateTime(voucher.expired_at) : '—'} />
              {voucher.patient_confirmation_pin && (
                <Detail label={t('hospitalAdmin.voucherDetail.confirmationPIN')} value={voucher.patient_confirmation_pin} mono />
              )}
            </div>
          </div>

          {/* Beneficiary card */}
          {voucher.beneficiary && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <User size={14} /> {t('hospitalAdmin.voucherDetail.beneficiary')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Detail label={t('hospitalAdmin.voucherDetail.fullName')} value={voucher.beneficiary.full_name} />
                <Detail label={t('hospitalAdmin.voucherDetail.digitalHealthId')} value={voucher.beneficiary.digital_health_id || '—'} mono />
                <Detail label={t('hospitalAdmin.voucherDetail.gender')} value={voucher.beneficiary.gender} />
                <Detail label={t('hospitalAdmin.voucherDetail.category')} value={voucher.beneficiary.category} />
                <Detail label={t('hospitalAdmin.voucherDetail.dateOfBirth')} value={voucher.beneficiary.date_of_birth ? formatDate(voucher.beneficiary.date_of_birth) : '—'} />
                <Detail label={t('hospitalAdmin.voucherDetail.phone')} value={voucher.beneficiary.phone} />
                <Detail label={t('hospitalAdmin.voucherDetail.region')} value={voucher.beneficiary.region} />
                {voucher.beneficiary.city && <Detail label={t('hospitalAdmin.voucherDetail.city')} value={voucher.beneficiary.city} />}
                {voucher.beneficiary.address && <Detail label={t('hospitalAdmin.voucherDetail.address')} value={voucher.beneficiary.address} className="col-span-2" />}
                <Detail label={t('hospitalAdmin.voucherDetail.emergencyContact')} value={voucher.beneficiary.emergency_contact_name ? `${voucher.beneficiary.emergency_contact_name} · ${voucher.beneficiary.emergency_contact_phone}` : '—'} />
              </div>
            </div>
          )}

          {/* Hospital card */}
          {voucher.hospital && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <MapPin size={14} /> {t('hospitalAdmin.voucherDetail.hospital')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Detail label={t('hospitalAdmin.voucherDetail.hospitalName')} value={voucher.hospital.name} />
                <Detail label={t('hospitalAdmin.voucherDetail.accreditation')} value={voucher.hospital.accreditation_number || '—'} />
                <Detail label={t('hospitalAdmin.voucherDetail.city')} value={voucher.hospital.city} />
                <Detail label={t('hospitalAdmin.voucherDetail.region')} value={voucher.hospital.region} />
                <Detail label={t('hospitalAdmin.voucherDetail.phone')} value={voucher.hospital.phone_number || '—'} />
                <Detail label={t('hospitalAdmin.voucherDetail.hospitalStatus')} value={voucher.hospital.partnership_status || '—'} />
              </div>
            </div>
          )}

          {/* Funding records */}
          {fundings.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Banknote size={14} /> {t('hospitalAdmin.voucherDetail.fundingSources')} ({fundings.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400">
                      <th className="text-left p-2">{t('hospitalAdmin.voucherDetail.colCampaignId')}</th>
                      <th className="text-right p-2">{t('hospitalAdmin.voucherDetail.colCommitted')}</th>
                      <th className="text-right p-2">{t('hospitalAdmin.voucherDetail.colUtilized')}</th>
                      <th className="text-right p-2">{t('hospitalAdmin.voucherDetail.colRefund')}</th>
                      <th className="text-center p-2">{t('hospitalAdmin.voucherDetail.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundings.map((f) => (
                      <tr key={f.id} className="border-b border-gray-50">
                        <td className="p-2 font-mono text-gray-600">{f.campaign_id?.slice(0, 8)}…</td>
                        <td className="p-2 text-right font-semibold" style={{ color: '#1D75DB' }}>{formatXAF(Number(f.committed_amount))}</td>
                        <td className="p-2 text-right">{f.utilized_amount ? formatXAF(Number(f.utilized_amount)) : '—'}</td>
                        <td className="p-2 text-right">{f.refund_amount ? formatXAF(Number(f.refund_amount)) : '—'}</td>
                        <td className="p-2 text-center">
                          <span className={`badge text-[10px] ${f.status === 'UTILIZED' ? 'bg-green-100 text-green-700' : f.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="text-gray-500 font-semibold">
                    <tr>
                      <td className="p-2">{t('hospitalAdmin.voucherDetail.totals')}</td>
                      <td className="p-2 text-right" style={{ color: '#1D75DB' }}>{formatXAF(totalCommitted)}</td>
                      <td className="p-2 text-right">{formatXAF(totalUtilized)}</td>
                      <td className="p-2" />
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Timeline ── */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Activity size={14} /> {t('hospitalAdmin.voucherDetail.activityTimeline')}
            </h2>
            {events.length === 0 ? (
              <p className="text-gray-400 text-xs">{t('hospitalAdmin.voucherDetail.noEvents')}</p>
            ) : (
              <div className="space-y-0">
                {events.map((event, i) => (
                  <div key={event.id || i} className="flex gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: '#1D75DB' }} />
                      {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800">{event.status?.replace(/_/g, ' ')}</p>
                      {event.notes && <p className="text-xs text-gray-500 mt-0.5">{event.notes}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(event.changed_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health Issue card */}
          {voucher.health_issue && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{t('hospitalAdmin.voucherDetail.healthIssue')}</h2>
              <div className="space-y-2">
                <Detail label={t('hospitalAdmin.voucherDetail.category')} value={voucher.health_issue.category} />
                <Detail label={t('hospitalAdmin.voucherDetail.severity')} value={voucher.health_issue.severity} />
                <Detail label={t('hospitalAdmin.voucherDetail.healthStatus')} value={voucher.health_issue.status} />
                <Detail label={t('hospitalAdmin.voucherDetail.description')} value={voucher.health_issue.description || '—'} />
              </div>
            </div>
          )}
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
