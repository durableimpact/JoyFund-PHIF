'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { useStore } from '@/store/useStore';
import { statusColor, statusLabel } from '@/lib/utils';

export default function SocialWorkerDashboard() {
  const { beneficiaries, currentUser } = useStore();
  const [backendBeneficiaries, setBackendBeneficiaries] = useState<any[]>([]);
  const name = currentUser?.name || 'Alphonse Kamga';

  useEffect(() => {
    fetch('/api/beneficiaries')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        const rawList = Array.isArray(data) ? data : data?.results || [];
        setBackendBeneficiaries(
          rawList.map((item: any) => ({
            ...item,
            healthId: item.digital_health_id,
            community: item.city && item.region ? `${item.city}, ${item.region}` : item.region || item.city || '',
            status: 'awaiting_match',
            gestationalWeek: item.gestational_week || 0,
            enrolledAt: item.created_at?.split('T')[0] || '',
          }))
        );
      })
      .catch(() => {
        // fallback to local store data
      });
  }, []);

  const activeBeneficiaries = backendBeneficiaries.length ? backendBeneficiaries : beneficiaries;
  const stats = [
    { label: 'Enrolled', value: activeBeneficiaries.length, color: 'var(--primary)' },
    { label: 'Awaiting Match', value: activeBeneficiaries.filter(b => b.status === 'awaiting_match').length, color: '#f59e0b' },
    { label: 'Voucher Issued', value: activeBeneficiaries.filter(b => b.status === 'voucher_issued').length, color: 'var(--secondary)' },
    { label: 'Care Received', value: activeBeneficiaries.filter(b => b.status === 'care_received').length, color: 'var(--success)' },
  ];
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Social Worker Portal</p>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {name.split(' ')[0]} 👋</h1>
              <p className="text-xs text-gray-400 mt-1">Area: Yaoundé & Centre Region</p>
            </div>
            <Link href="/social-worker/enroll" className="btn-primary text-sm">
              <Plus size={16} /> Enroll Beneficiary
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {stats.map(s => (
              <div key={s.label} className="card p-4">
                <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">My Caseload</h2>
          <p className="text-sm text-gray-500 mb-4">All beneficiaries under your management</p>
          <div className="space-y-3">
            {activeBeneficiaries.map(b => (
              <Link key={b.id} href={`/social-worker/beneficiary/${b.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow block">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {b.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{b.fullName}</p>
                  <p className="text-xs text-gray-500">{b.healthId} · {b.community} · Week {b.gestationalWeek}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-gray-400 hidden sm:block">{b.enrolledAt}</p>
                  <span className={`badge ${statusColor(b.status)}`}>{statusLabel(b.status)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
