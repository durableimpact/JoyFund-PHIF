'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Search, ClipboardCheck, CheckCircle } from 'lucide-react';
import { getMedicalClaims } from '@/actions/hospital';
import { useI18n } from '@/locales/client';

export default function ReceptionistDashboard() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalId = userInfo?.hospital;

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['rec-claims', token, hospitalId],
    queryFn: () => getMedicalClaims(token, { hospital: hospitalId, page_size: '100' }),
    enabled: !!token && !!hospitalId,
  });

  const claims: MedicalClaimList[] = claimsData?.results || [];
  const pending = claims.filter(c => c.claim_status === 'PENDING').length;
  const approved = claims.filter(c => c.claim_status === 'APPROVED').length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">{t('receptionist.dashboard.title')}</h1>
        <p className="text-gray-500 text-sm">{t('receptionist.dashboard.welcome', { name: userInfo?.first_name || 'Receptionist' })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5" style={{ borderTop: '3px solid #1D75DB' }}>
          <ClipboardCheck size={18} className="text-[#1D75DB] mb-2" />
          <div className="text-2xl font-black text-[#1D75DB]">{isLoading ? '—' : claims.length}</div>
          <div className="text-xs text-gray-500">{t('receptionist.dashboard.totalClaims')}</div>
        </div>
        <div className="card p-5" style={{ borderTop: '3px solid #f59e0b' }}>
          <ClipboardCheck size={18} className="text-amber-500 mb-2" />
          <div className="text-2xl font-black text-amber-500">{isLoading ? '—' : pending}</div>
          <div className="text-xs text-gray-500">{t('receptionist.dashboard.pendingReview')}</div>
        </div>
        <div className="card p-5" style={{ borderTop: '3px solid #22C55E' }}>
          <CheckCircle size={18} className="text-green-500 mb-2" />
          <div className="text-2xl font-black text-green-500">{isLoading ? '—' : approved}</div>
          <div className="text-xs text-gray-500">{t('receptionist.dashboard.approved')}</div>
        </div>
      </div>

      <Link
        href="/dashboard/receptionist/process"
        className="card p-6 flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-[#1D75DB]/30 hover:border-[#1D75DB]"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#1D75DB' }}>
          <Search size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{t('receptionist.dashboard.processVoucher')}</h3>
          <p className="text-sm text-gray-500">{t('receptionist.dashboard.processVoucherDesc')}</p>
        </div>
      </Link>
    </>
  );
}
