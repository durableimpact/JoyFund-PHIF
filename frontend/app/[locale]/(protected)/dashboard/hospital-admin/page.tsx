'use client';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle,
  Clock,
  Ticket,
  FileText,
  Users,
} from 'lucide-react';
import { formatXAF } from '@/lib/utils';
import { getHospitalAdminInfo } from '@/actions/accounts';
import { getHospitalDashboard, getHospitalStaff, getHospitalRedeemedDaily } from '@/actions/hospital';
import { listVouchers } from '@/actions/vouchers';
import { useI18n } from '@/locales/client';

export default function HospitalAdminDashboard() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const hospitalId = currentUser?.hospital?.id;

  const { data: profile } = useQuery({
    queryKey: ['ha-profile', token],
    queryFn: () => getHospitalAdminInfo(token),
    enabled: !!token,
  });

  const hospital = profile?.hospital || currentUser?.hospital;
  const hospitalName = hospital?.name || t('hospitalAdmin.dashboard.myHospital');

  const { data: dashboard, isLoading: dLoading } = useQuery({
    queryKey: ['ha-dashboard', hospitalId, token],
    queryFn: () => getHospitalDashboard(hospitalId!, token),
    enabled: !!token && !!hospitalId,
  });

  const { data: staffData } = useQuery({
    queryKey: ['ha-staff', hospitalId, token],
    queryFn: async () => {
      const res = await getHospitalStaff(hospitalId!, token);
      return res?.results || res || [];
    },
    enabled: !!token && !!hospitalId,
  });

  const { data: vouchersData } = useQuery({
    queryKey: ['ha-vouchers', token],
    queryFn: async () => {
      const res = await listVouchers(token, { page_size: '1000' });
      return res?.results || res || [];
    },
    enabled: !!token,
  });

  const vouchers: any[] = Array.isArray(vouchersData) ? vouchersData : [];
  const staff: any[] = Array.isArray(staffData) ? staffData : [];
  const redeemedCount = vouchers.filter((v: any) => v.status === 'USED').length;
  const pendingCount = vouchers.filter((v: any) => v.status === 'PENDING_CONFIRMATION').length;

  const kpis = [
    { label: t('hospitalAdmin.dashboard.kpiRedeemed'),    value: redeemedCount,        icon: CheckCircle, color: '#22C55E', sub: t('hospitalAdmin.dashboard.kpiRedeemedSub') },
    { label: t('hospitalAdmin.dashboard.kpiTotal'),       value: vouchers.length,      icon: Ticket,      color: '#8B5CF6', sub: t('hospitalAdmin.dashboard.kpiTotalSub') },
    { label: t('hospitalAdmin.dashboard.kpiPending'),     value: pendingCount,         icon: Clock,       color: '#f59e0b', sub: t('hospitalAdmin.dashboard.kpiPendingSub') },
    { label: t('hospitalAdmin.dashboard.kpiStaff'),       value: staff.length,         icon: Users,       color: '#1D75DB', sub: t('hospitalAdmin.dashboard.kpiStaffSub') },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">{t('hospitalAdmin.dashboard.title')}</h1>
        {hospital && (
          <p className="text-gray-500 text-sm">
            {hospital.region && `${hospital.region} · `}
            {hospital.city && `${hospital.city} · `}
            {hospital.accreditation_number || ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="card p-5" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="flex items-start justify-between mb-2">
              <k.icon size={18} style={{ color: k.color }} />
              <span className="text-xs text-gray-400">{k.sub}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: k.color }}>
              {dLoading ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" /> : k.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Vouchers */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">{t('hospitalAdmin.dashboard.recentVouchers')}</h3>
          {dLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : vouchers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">{t('hospitalAdmin.dashboard.noVouchers')}</p>
          ) : vouchers.slice(0, 5).map((v: any) => (
            <div key={v.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-mono text-sm font-bold text-gray-900">{v.voucher_code}</p>
                <p className="text-xs text-gray-400">{v.beneficiary_name || '—'}</p>
              </div>
              <span className={`badge text-xs ${v.status === 'USED' ? 'bg-green-100 text-green-700' : v.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                {v.status?.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>

        {/* Hospital Info */}
        {hospital && (
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Building2 size={16} style={{ color: '#1D75DB' }} /> {t('hospitalAdmin.dashboard.hospitalInfo')}
            </h3>
            <div className="space-y-2 text-sm">
              {[
                [t('hospitalAdmin.dashboard.fieldName'), hospital.name],
                [t('hospitalAdmin.dashboard.fieldAccreditation'), hospital.accreditation_number],
                [t('hospitalAdmin.dashboard.fieldRegion'), hospital.region],
                [t('hospitalAdmin.dashboard.fieldCity'), hospital.city],
                [t('hospitalAdmin.dashboard.fieldPhone'), hospital.phone_number],
                [t('hospitalAdmin.dashboard.fieldEmail'), hospital.email],
              ].filter(([,v]) => v).map(([k,v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-right truncate max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staff Overview */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">{t('hospitalAdmin.dashboard.staffOverview')}</h3>
          {dLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : staff.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">{t('hospitalAdmin.dashboard.noStaff')}</p>
          ) : (
            <div className="space-y-2">
              {staff.slice(0, 4).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(s.name || s.first_name || '?').charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-gray-900">{s.name || `${s.first_name || ''} ${s.last_name || ''}`}</p>
                    <p className="text-xs text-gray-400">{s.email || '—'} · {s.role?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
