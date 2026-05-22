'use client';
import { useState } from 'react';
import { LayoutDashboard, Search, CheckCircle, XCircle, Ticket } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/hospital/receptionist', icon: <LayoutDashboard size={16} /> },
];

export default function ReceptionistPage() {
  const { showToast } = useStore();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!code.trim()) { showToast('Enter a voucher code', 'error'); return; }
    setChecking(true);
    setResult(null);
    try {
      const data = await authenticatedFetch('/api/vouchers/check/', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      });
      setResult(data);
    } catch (e: any) {
      showToast(e?.message || 'Voucher not found or invalid', 'error');
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  const handleApprove = async () => {
    if (!result?.id) return;
    setApprovingId(result.id);
    try {
      await authenticatedFetch(`/api/hospitals/vouchers/${result.id}/approve/`, { method: 'POST' });
      showToast('Voucher approved — patient may proceed to care', 'success');
      setResult((p: any) => ({ ...p, status: 'approved' }));
    } catch (e: any) {
      showToast(e?.message || 'Failed to approve voucher', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const isValid = result && (result.status === 'issued' || result.status === 'generated');

  return (
    <DashboardShell
      navItems={NAV}
      accentColor="#0D9488"
      brandLabel="Receptionist"
      brandSub="Voucher validation"
    >
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Voucher Validation</h1>
          <p className="text-gray-500 text-sm">Scan or enter a beneficiary voucher code to verify and approve care</p>
        </div>

        {/* Search box */}
        <div className="card p-6 mb-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">
            Voucher Code
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-10 font-mono uppercase tracking-widest"
                placeholder="e.g. JF-2024-ABCD"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
              />
            </div>
            <button
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white flex-shrink-0 transition-opacity"
              style={{ background: '#0D9488' }}
              onClick={handleCheck}
              disabled={checking}
            >
              {checking ? 'Checking…' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`card p-6 border-2 ${isValid ? 'border-emerald-400' : 'border-red-300'}`}>
            <div className="flex items-center gap-3 mb-5">
              {isValid
                ? <CheckCircle size={28} className="text-emerald-500 flex-shrink-0" />
                : <XCircle size={28} className="text-red-400 flex-shrink-0" />
              }
              <div>
                <p className="font-black text-gray-900">{isValid ? 'Valid Voucher' : 'Invalid / Already Used'}</p>
                <p className="text-xs text-gray-500">{result.code || code}</p>
              </div>
              <div className="ml-auto">
                <span className={`badge ${statusColor(result.status || 'void')}`}>
                  {statusLabel(result.status || 'void')}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
              {[
                ['Beneficiary', result.beneficiary_name || result.beneficiary || '—'],
                ['Amount', formatXAF(Number(result.amount ?? result.amountXAF ?? 0))],
                ['Issued', result.issued_at ? new Date(result.issued_at).toLocaleDateString('fr-CM') : '—'],
                ['Valid Until', result.valid_until ? new Date(result.valid_until).toLocaleDateString('fr-CM') : '—'],
                ['Hospital', result.hospital_name || result.hospital || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>

            {isValid && (
              <button
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-opacity"
                style={{ background: '#0D9488' }}
                onClick={handleApprove}
                disabled={!!approvingId}
              >
                {approvingId ? 'Approving…' : 'Approve — Admit Patient for Care'}
              </button>
            )}

            {result.status === 'approved' && (
              <div className="flex items-center gap-2 justify-center py-2 text-emerald-600 font-semibold text-sm">
                <CheckCircle size={16} /> Patient admitted — voucher approved
              </div>
            )}

            {!isValid && result.status !== 'approved' && (
              <p className="text-center text-red-500 text-sm font-semibold">
                This voucher cannot be used. Status: {statusLabel(result.status || 'void')}
              </p>
            )}
          </div>
        )}

        {/* Guide */}
        {!result && (
          <div className="card p-5 text-center text-sm text-gray-500">
            <Ticket size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700 mb-1">How to validate</p>
            <p>Enter the voucher code printed on the beneficiary's card or SMS, then press <strong>Verify</strong>. If valid, approve the patient to receive care.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
