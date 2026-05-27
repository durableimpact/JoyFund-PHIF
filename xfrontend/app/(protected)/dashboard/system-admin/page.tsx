'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Ticket,
  TrendingUp,
  Users
} from 'lucide-react';









import { formatXAF } from '@/lib/utils';
import { listBeneficiaries } from '@/actions/beneficiaries';
import { listCampaigns } from '@/actions/campaigns';
import { listHospitals } from '@/actions/hospital';
import { listVouchers } from '@/actions/vouchers';
export default function AdminDashboard() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const currentUser = (session?.user as any)?.userInfo;
  const { data: beneficiaries = [], isLoading: bLoading } = useQuery<Beneficiary[]>({
    queryKey: ['admin-beneficiaries', token],
    queryFn: () => listBeneficiaries(token),
    enabled: !!token,
  });
  const { data: campaigns = [], isLoading: cLoading } = useQuery<Campaign[]>({
    queryKey: ['admin-campaigns', token],
    queryFn: () => listCampaigns(),
    enabled: !!token,
  });
  const { data: hospitals = [], isLoading: hLoading } = useQuery<Hospital[]>({
    queryKey: ['admin-hospitals', token],
    queryFn: () => listHospitals(token),
    enabled: !!token,
  });
  const { data: vouchers = [], isLoading: vLoading } = useQuery<Voucher[]>({
    queryKey: ['admin-vouchers', token],
    queryFn: () => listVouchers(token),
    enabled: !!token,
  });
  const loading = bLoading || cLoading || hLoading || vLoading;
  const totalRaised = campaigns.reduce((s, c) => s + (c.available_balance ?? 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const vouchersUsed = vouchers.filter((v) => v.status === 'USED').length;
  const kpis = [
    { label: 'Total Raised',       value: formatXAF(totalRaised), icon: TrendingUp,  color: '#471DDB', sub: 'Across all campaigns' },
    { label: 'Active Campaigns',   value: activeCampaigns,        icon: Activity,    color: '#1DB1DB', sub: `${campaigns.length} total` },
    { label: 'Vouchers Redeemed',  value: vouchersUsed,           icon: CheckCircle, color: '#1CDBC9', sub: `${vouchers.length} total issued` },
    { label: 'Hospitals',          value: hospitals.length,       icon: Building2,   color: '#f59e0b', sub: 'Partner hospitals' },
  ];
  return (<>

    
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Overview</h1>
          <p className="text-gray-500 text-sm">Welcome, {currentUser?.first_name || 'Admin'}</p>
        </div>
        <Link href="/dashboard/system-admin/users/create" className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Users size={15} /> Create User
        </Link>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="card p-5" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="flex items-start justify-between mb-2">
              <k.icon size={18} style={{ color: k.color }} />
              <span className="text-xs text-gray-400">{k.sub}</span>
            </div>
            <div className="text-2xl font-black" style={{ color: k.color }}>
              {loading ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" /> : k.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Quick nav */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hospitals',    href: '/dashboard/system-admin/hospitals',    icon: <Building2 size={20} />, color: '#1D38DB' },
              { label: 'Vouchers',     href: '/dashboard/system-admin/vouchers',     icon: <Ticket size={20} />,   color: '#471DDB' },
              { label: 'Beneficiaries',href: '/dashboard/system-admin/beneficiaries',icon: <Users size={20} />,    color: '#1DB1DB' },
              { label: 'Logs',         href: '/dashboard/system-admin/logs',         icon: <FileText size={20} />, color: '#1CDBC9' },
            ].map(n => (
              <Link key={n.label} href={n.href} className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: n.color }}>{n.icon}</div>
                <div className="font-bold text-sm text-gray-900">{n.label}</div>
              </Link>
            ))}
          </div>
          {/* Recent campaigns */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Campaigns</h3>
              <Link href="/explore" className="text-xs font-semibold" style={{ color: '#471DDB' }}>Explore</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : campaigns.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{c.title}</p>
                <span className="font-bold text-xs shrink-0" style={{ color: 'var(--primary)' }}>
                  {formatXAF(c.available_balance ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          {/* Summary stats */}
          <div className="card p-5">
            <h3 className="font-bold text-gray-900 mb-4">Platform Summary</h3>
            <div className="space-y-3">
              {[
                ['Total Campaigns',    campaigns.length],
                ['Active Campaigns',   activeCampaigns],
                ['Total Beneficiaries',beneficiaries.length],
                ['Total Vouchers',     vouchers.length],
                ['Partner Hospitals',  hospitals.length],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-bold text-gray-900">{loading ? '…' : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Partner hospitals */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Partner Hospitals</h3>
              <Link href="/dashboard/system-admin/hospitals" className="text-xs font-semibold" style={{ color: '#471DDB' }}>Manage</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{[1,2].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : hospitals.slice(0, 4).map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{h.name}</p>
                  <p className="text-xs text-gray-400">{h.city}, {h.region}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  
</>
);
}