'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  Clock,
  Heart,
  Plus,
  UserPlus,
  Users
} from 'lucide-react';
import { getSocialWorkerDashboard } from '@/actions/accounts';
import { listBeneficiaries } from '@/actions/beneficiaries';

export default function SocialWorkerDashboard() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const swId = currentUser?.id;
  const socialWorkerId = (session as any)?.user?.userInfo.profile.id;


  const { data: dashboard, isLoading: dLoading } = useQuery({
    queryKey: ['sw-dashboard', socialWorkerId, token],
    queryFn: () => getSocialWorkerDashboard(socialWorkerId, token),
    enabled: !!token && !!socialWorkerId,
  });

  const { data: beneficiariesData } = useQuery({
    queryKey: ['sw-beneficiaries', token],
    queryFn: async () => {
      const res = await listBeneficiaries(token, { page_size: '1000' });
      const d = (res as any)?.json || res;
      return d || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token,
  });

  const beneficiaries: Beneficiary[] = beneficiariesData?.results || [];
  const totalCount = beneficiariesData?.count || 0;

  const kpis = [
    { label: 'Total Enrolled',     value: totalCount,                         icon: Users,      color: '#0D9488', sub: 'Beneficiaries registered' },
    { label: 'Awaiting Match',     value: dashboard?.awaiting_match ?? 0,     icon: Clock,      color: '#f59e0b', sub: 'Pending voucher assignment' },
    { label: 'Vouchers Issued',    value: dashboard?.voucher_issued ?? 0,     icon: Heart,      color: '#8B5CF6', sub: 'Assigned to beneficiaries' },
    { label: 'Care Received',      value: dashboard?.care_received ?? 0,      icon: CheckCircle,color: '#22C55E', sub: 'Completed treatment' },
  ];

  return (<>
    
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome, {currentUser?.first_name || 'Social Worker'}</p>
        </div>
        <Link href="/dashboard/social-worker/beneficiaries/create" className="btn-admin text-sm flex items-center gap-2" style={{ background: '#0D9488' }}>
          <UserPlus size={15} /> Enroll Beneficiary
        </Link>
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
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Recent Enrollments</h3>
          {dLoading ? (
            <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
          ) : (
            <div className="space-y-0">
              {beneficiaries.slice(0, 8).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(b.full_name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{b.full_name}</p>
                      <p className="text-xs text-gray-400">{b.city || b.region || '—'}</p>
                    </div>
                  </div>
                  <span className={`badge text-[10px] ${b.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {b.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
              {beneficiaries.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No beneficiaries enrolled yet</p>}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'View Beneficiaries', href: '/dashboard/social-worker/beneficiaries', icon: <Users size={20} />, color: '#0D9488' },
              { label: 'Enroll New',         href: '/dashboard/social-worker/beneficiaries/create', icon: <Plus size={20} />, color: '#8B5CF6' },
            ].map(a => (
              <Link key={a.label} href={a.href} className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: a.color }}>{a.icon}</div>
                <div className="font-bold text-sm text-gray-900">{a.label}</div>
              </Link>
            ))}
          </div>

          <h3 className="font-bold text-gray-900 mt-5 mb-3">Enrollment Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Enrolled',   value: totalCount,                         bar: 100 },
              { label: 'Awaiting Match',   value: dashboard?.awaiting_match ?? 0,     bar: totalCount > 0 ? Math.round((dashboard?.awaiting_match ?? 0) / totalCount * 100) : 0 },
              { label: 'Vouchers Issued',  value: dashboard?.voucher_issued ?? 0,     bar: totalCount > 0 ? Math.round((dashboard?.voucher_issued ?? 0) / totalCount * 100) : 0 },
              { label: 'Care Received',    value: dashboard?.care_received ?? 0,      bar: totalCount > 0 ? Math.round((dashboard?.care_received ?? 0) / totalCount * 100) : 0 },
            ].map(row => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-bold text-gray-900">{row.value}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(row.bar, 100)}%`, background: '#0D9488' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  
</>
);
}
