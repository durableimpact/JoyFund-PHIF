'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { formatXAF } from '@/lib/utils';

type Hospital = {
  id: string;
  name: string;
  status: string;
};

type LeaderboardItem = {
  rank: number;
  name: string;
  eventType: string;
  raisedXAF: number;
  lives: number;
};

const defaultRegions = [
  { name: 'Centre (Yaoundé)', pct: 60, count: 187 },
  { name: 'Littoral (Douala)', pct: 20, count: 64 },
  { name: 'Ouest (Bafoussam)', pct: 10, count: 31 },
  { name: 'Nord-Ouest', pct: 7, count: 21 },
  { name: 'Other Regions', pct: 3, count: 9 },
];

export default function AdminAnalytics() {
  const { campaigns, beneficiaries, vouchers, showToast } = useStore();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    async function loadHospitals() {
      try {
        const res = await fetch('/api/hospitals/');
        if (!res.ok) return;
        const data = await res.json();
        setHospitals(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadHospitals();
  }, []);

  const totalRaised = campaigns.reduce((s, c) => s + c.raisedXAF, 0);
  const vouchersRedeemed = vouchers.filter((v) => v.status === 'redeemed').length;
  const metrics = [
    { label: 'Deliveries Funded', value: vouchersRedeemed, icon: '👶' },
    { label: 'Women Served', value: beneficiaries.length, icon: '🤱' },
    { label: 'Avg Cost/Delivery', value: formatXAF(Math.round(totalRaised / Math.max(vouchersRedeemed, 1))), icon: '💰' },
    { label: 'Partner Hospitals', value: hospitals.filter((h) => h.status === 'active').length, icon: '🏥' },
  ];

  const leaderboard: LeaderboardItem[] = [...campaigns]
    .sort((a, b) => b.raisedXAF - a.raisedXAF)
    .slice(0, 5)
    .map((campaign, index) => ({
      rank: index + 1,
      name: campaign.title,
      eventType: campaign.eventType || 'other',
      raisedXAF: campaign.raisedXAF,
      lives: campaign.goalDeliveries ?? 0,
    }));

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 flex items-center justify-between" style={{ background: '#471DDB' }}>
        <div className="flex items-center gap-3"><span className="text-xl">📊</span><p className="font-black text-sm text-white">Analytics & Reports</p></div>
        <div className="flex gap-4 text-white opacity-70 text-xs">
          <Link href="/admin/dashboard" className="hover:opacity-100">Dashboard</Link>
          <Link href="/admin/vouchers" className="hover:opacity-100">Vouchers</Link>
          <Link href="/admin/hospitals" className="hover:opacity-100">Hospitals</Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-xl font-black text-gray-900">Impact Analytics</h1><p className="text-gray-500 text-sm">Platform-wide metrics and transparency reports</p></div>
          <button className="btn-admin text-sm flex items-center gap-2" onClick={() => showToast('Monthly report generated! PDF ready.', 'success')}><Download size={16} /> Export Report</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className="card p-5 text-center">
              <div className="text-3xl mb-2">{m.icon}</div>
              <div className="text-2xl font-black" style={{ color: '#471DDB' }}>{m.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">Escrow Balance — 30 Day Trend</h3>
            <div className="relative h-48">
              <svg viewBox="0 0 300 100" className="w-full h-full">
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1DB1DB" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#1DB1DB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 C20,75 40,70 60,60 C80,50 100,45 120,40 C140,35 160,38 180,30 C200,22 220,20 240,18 C260,16 280,15 300,12" stroke="#1DB1DB" strokeWidth="2.5" fill="none" />
                <path d="M0,80 C20,75 40,70 60,60 C80,50 100,45 120,40 C140,35 160,38 180,30 C200,22 220,20 240,18 C260,16 280,15 300,12 V100 H0Z" fill="url(#grad)" />
              </svg>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-1">
                <span>Mar 14</span><span>Mar 28</span><span>Apr 12</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--primary)' }} />
              <span className="text-xs text-gray-500">Escrow balance (XAF)</span>
              <span className="ml-auto font-bold text-sm" style={{ color: 'var(--primary)' }}>{formatXAF(totalRaised)}</span>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">Beneficiaries by Region</h3>
            <div className="space-y-4">
              {defaultRegions.map((r) => (
                <div key={r.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{r.name}</span>
                    <span className="font-semibold text-gray-900">{r.count} women · {r.pct}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${r.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6 lg:col-span-2">
            <h3 className="font-bold text-gray-900 mb-4">Top Campaigns by Funds Raised</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Rank', 'Campaign', 'Event Type', 'Raised', 'Lives'].map((h) => (
                      <th key={h} className="text-left pb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((l) => (
                    <tr key={l.rank} className="border-b border-gray-50">
                      <td className="py-3 font-black text-xl" style={{ color: l.rank === 1 ? '#f59e0b' : l.rank === 2 ? '#94a3b8' : l.rank === 3 ? '#b45309' : '#1A1A2E' }}>#{l.rank}</td>
                      <td className="py-3 font-medium text-gray-900">{l.name}</td>
                      <td className="py-3 text-gray-500 capitalize">{l.eventType}</td>
                      <td className="py-3 font-bold" style={{ color: 'var(--primary)' }}>{formatXAF(l.raisedXAF)}</td>
                      <td className="py-3 font-semibold text-gray-600">{l.lives}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
