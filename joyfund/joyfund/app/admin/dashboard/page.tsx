'use client';
import Link from 'next/link';
import { TrendingUp, Activity, Clock, CheckCircle } from 'lucide-react';
import { platformStats, activityFeed, hospitals } from '@/lib/mockData';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel } from '@/lib/utils';

export default function AdminDashboard() {
  const { campaigns, beneficiaries, showToast } = useStore();
  const kpis = [
    { label: 'Escrow Balance', value: formatXAF(platformStats.escrowBalanceXAF), icon: TrendingUp, color: '#471DDB', sub: '↑ 12% this month' },
    { label: 'Active Campaigns', value: platformStats.activeCampaigns, icon: Activity, color: '#471DDB', sub: `${campaigns.length} total` },
    { label: 'Pending Matches', value: platformStats.pendingMatches, icon: Clock, color: '#f59e0b', sub: 'Requires approval' },
    { label: 'Vouchers Redeemed', value: platformStats.vouchersThisMonth, icon: CheckCircle, color: '#1CDBC9', sub: 'This month' },
  ];
  const nav = [
    { label: 'Match Queue', href: '/admin/vouchers', icon: '🔗', desc: 'Approve beneficiary matches' },
    { label: 'Voucher Mgmt', href: '/admin/vouchers', icon: '🎟️', desc: 'Manage all vouchers' },
    { label: 'Hospitals', href: '/admin/hospitals', icon: '🏥', desc: 'Partner management' },
    { label: 'Analytics', href: '/admin/analytics', icon: '📊', desc: 'Reports & impact' },
  ];
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: '#471DDB' }}>
        <div className="flex items-center gap-3"><span className="text-xl">⚙️</span><div><p className="font-black text-sm text-white">JoyFund System Admin</p><p className="text-xs text-white opacity-60">Full platform oversight</p></div></div>
        <div className="flex gap-4">{nav.map(n => <Link key={n.label} href={n.href} className="text-white opacity-70 text-xs font-medium hover:opacity-100 hidden sm:block">{n.label}</Link>)}<Link href="/" className="text-white opacity-60 text-xs hover:opacity-100">Public Site</Link></div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6"><h1 className="text-2xl font-black text-gray-900">System Overview</h1><p className="text-gray-500 text-sm">Real-time platform health dashboard</p></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(k => (
            <div key={k.label} className="card p-5" style={{ borderTop: `3px solid ${k.color}` }}>
              <div className="flex items-start justify-between mb-2"><k.icon size={18} style={{ color: k.color }} /><span className="text-xs text-gray-400">{k.sub}</span></div>
              <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {nav.map(n => (<Link key={n.label} href={n.href} className="card p-4 hover:shadow-md transition-shadow block"><div className="text-2xl mb-2">{n.icon}</div><div className="font-bold text-sm text-gray-900">{n.label}</div><div className="text-xs text-gray-500 mt-0.5">{n.desc}</div></Link>))}
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Match Approval Queue</h3><Link href="/admin/vouchers" className="text-xs font-semibold" style={{ color: '#471DDB' }}>View All</Link></div>
              <div className="space-y-3">
                {beneficiaries.filter(b => b.status === 'awaiting_match').map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: 'var(--secondary)' }}>{b.fullName.charAt(0)}</div>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-gray-900 truncate">{b.fullName}</p><p className="text-xs text-gray-400">{b.healthId} · Week {b.gestationalWeek} · {b.community}</p></div>
                    <div className="flex gap-2">
                      <button className="text-xs font-semibold px-3 py-1.5 rounded-xl text-white" style={{ background: 'var(--success)' }} onClick={() => showToast(`Match approved for ${b.fullName}`, 'success')}>Approve</button>
                      <button className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-200 text-gray-600">Hold</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Partner Hospitals</h3><Link href="/admin/hospitals" className="text-xs font-semibold" style={{ color: '#471DDB' }}>Manage</Link></div>
              <div className="space-y-3">
                {hospitals.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div><p className="font-semibold text-sm text-gray-900">{h.name}</p><p className="text-xs text-gray-400">{h.region} · {h.vouchersRedeemed} vouchers</p></div>
                    <div className="text-right"><p className="text-sm font-bold" style={{ color: 'var(--secondary)' }}>{formatXAF(h.totalPaidOutXAF)}</p><span className={`badge ${statusColor(h.status)} text-xs`}>{statusLabel(h.status)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />Live Activity Feed</h3>
              <div className="space-y-3">
                {activityFeed.map(f => (
                  <div key={f.id} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="text-lg flex-shrink-0">{f.type === 'donation' ? '💝' : f.type === 'checkin' ? '🏥' : f.type === 'payout' ? '💰' : f.type === 'enrollment' ? '📋' : '🎟️'}</div>
                    <div><p className="text-xs text-gray-700 leading-relaxed">{f.message}</p><p className="text-xs text-gray-400 mt-0.5">{f.timeAgo}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-4">Platform Health</h3>
              <div className="space-y-3">
                {[['Payment Webhooks','✅ Operational'],['MTN MoMo API','✅ Connected'],['Orange Money API','✅ Connected'],['SMS Gateway','✅ Active'],['Escrow System','✅ Healthy']].map(([l, s]) => (
                  <div key={l} className="flex justify-between text-xs"><span className="text-gray-600">{l}</span><span className="text-emerald-600 font-medium">{s}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
