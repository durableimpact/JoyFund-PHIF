'use client';
import { useState } from 'react';
import { LayoutDashboard, Search, CheckCircle, XCircle, Ticket, Loader2, ClipboardList } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';
import Link from 'next/link';

const NAV: NavItem[] = [
  { label: 'Voucher Validation', href: '/hospital/receptionist', icon: <Ticket size={16} /> },
  { label: 'Medical Claims',     href: '/hospital/claims',       icon: <ClipboardList size={16} /> },
];

export default function ReceptionistPage() {
  const { showToast } = useStore();
  const [code, setCode]               = useState('');
  const [checking, setChecking]       = useState(false);
  const [result, setResult]           = useState<any>(null);
  const [approving, setApproving]     = useState(false);
  const [confirmingPin, setConfirmingPin] = useState(false);
  const [pin, setPin]                 = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  // VoucherCheckView uses GET ?code= — NOT POST
  const handleCheck = async () => {
    if (!code.trim()) { showToast('Enter a voucher code', 'error'); return; }
    setChecking(true); setResult(null); setShowPinInput(false); setPin('');
    try {
      const data = await authenticatedFetch(
        `/api/vouchers/check/?code=${encodeURIComponent(code.trim().toUpperCase())}`
      );
      setResult(data);
    } catch (e: any) {
      showToast(e?.message || 'Voucher not found or invalid', 'error');
    } finally {
      setChecking(false);
    }
  };

  // Approve voucher — only works when status is ACTIVE → transitions to PENDING_CONFIRMATION
  const handleApprove = async () => {
    if (!result?.id) return;
    setApproving(true);
    try {
      await authenticatedFetch(`/api/hospitals/vouchers/${result.id}/approve/`, { method: 'POST' });
      showToast('Voucher approved — now ask the patient for her PIN', 'success');
      setResult((p: any) => ({ ...p, status: 'PENDING_CONFIRMATION' }));
      setShowPinInput(true);
    } catch (e: any) {
      showToast(e?.message || 'Failed to approve voucher', 'error');
    } finally {
      setApproving(false);
    }
  };

  // Confirm PIN — transitions PENDING_CONFIRMATION → USED
  const handleConfirmPin = async () => {
    if (!pin || pin.length < 4) { showToast('Enter the 4-digit PIN', 'error'); return; }
    if (!result?.id) return;
    setConfirmingPin(true);
    try {
      await authenticatedFetch(`/api/hospitals/vouchers/${result.id}/confirm-pin/`, {
        method: 'POST',
        body: JSON.stringify({ patient_pin: pin }),
      });
      showToast('PIN confirmed — service can proceed!', 'success');
      setResult((p: any) => ({ ...p, status: 'USED' }));
      setShowPinInput(false);
    } catch (e: any) {
      showToast(e?.message || 'Invalid PIN', 'error');
    } finally {
      setConfirmingPin(false);
    }
  };

  const isValid    = result && (result.status === 'ACTIVE');
  const isPending  = result && result.status === 'PENDING_CONFIRMATION';
  const isUsed     = result && result.status === 'USED';

  return (
    <DashboardShell navItems={NAV} accentColor="#0D9488" brandLabel="Receptionist" brandSub="Voucher validation">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Voucher Validation</h1>
          <p className="text-gray-500 text-sm">Enter a beneficiary voucher code to verify eligibility for care</p>
        </div>

        {/* Search */}
        <div className="card p-6 mb-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Voucher Code</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-10 font-mono uppercase tracking-widest"
                placeholder="e.g. JF-00A1B2C3"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
              />
            </div>
            <button
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white flex-shrink-0 disabled:opacity-60"
              style={{ background: '#0D9488' }}
              onClick={handleCheck}
              disabled={checking}
            >
              {checking ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`card p-6 border-2 ${isValid ? 'border-emerald-400' : isPending ? 'border-blue-400' : isUsed ? 'border-gray-300' : 'border-red-300'}`}>
            <div className="flex items-center gap-3 mb-5">
              {(isValid || isPending || isUsed)
                ? <CheckCircle size={28} className="text-emerald-500 flex-shrink-0" />
                : <XCircle size={28} className="text-red-400 flex-shrink-0" />
              }
              <div className="flex-1">
                <p className="font-black text-gray-900">
                  {isValid ? 'Valid Voucher' : isPending ? 'Awaiting PIN Confirmation' : isUsed ? 'Already Used' : 'Invalid / Expired'}
                </p>
                <p className="text-xs text-gray-500 font-mono">{result.voucher_code || code}</p>
              </div>
              <span className={`badge ${statusColor(result.status || 'void')}`}>
                {statusLabel(result.status || 'void')}
              </span>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
              {[
                ['Beneficiary',   result.beneficiary?.full_name || result.beneficiary_name || '—'],
                ['Health ID',     result.beneficiary?.digital_health_id || '—'],
                ['Amount',        formatXAF(Number(result.amount ?? result.face_value ?? 0))],
                ['Hospital',      result.hospital?.name || '—'],
                ['Valid Until',   result.expires_at ? new Date(result.expires_at).toLocaleDateString('fr-CM') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%] truncate">{v}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            {isValid && (
              <button
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                style={{ background: '#0D9488' }}
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? 'Approving…' : 'Approve — Admit Patient'}
              </button>
            )}

            {(isPending || showPinInput) && (
              <div className="space-y-3">
                <p className="text-sm text-blue-700 font-semibold text-center">
                  Ask the patient for her 4-digit secret PIN
                </p>
                <input
                  className="input-field font-mono text-center text-2xl tracking-[0.5em] text-center"
                  placeholder="••••"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                />
                <button
                  className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                  style={{ background: '#0D9488' }}
                  onClick={handleConfirmPin}
                  disabled={confirmingPin}
                >
                  {confirmingPin ? 'Confirming…' : 'Confirm PIN & Start Care'}
                </button>
              </div>
            )}

            {isUsed && (
              <p className="text-center text-gray-500 text-sm font-medium py-2">
                This voucher has already been redeemed.
              </p>
            )}

            {!isValid && !isPending && !isUsed && result && (
              <p className="text-center text-red-500 text-sm font-semibold">
                This voucher cannot be used. Status: {statusLabel(result.status || 'void')}
              </p>
            )}
          </div>
        )}

        {!result && (
          <div className="card p-6 text-center text-sm text-gray-500">
            <Ticket size={32} className="mx-auto mb-3 text-gray-200" />
            <p className="font-semibold text-gray-700 mb-1">How to validate</p>
            <p>Enter the voucher code from the patient's SMS or card, press <strong>Verify</strong>, then approve to admit.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
