'use client';
import { useState } from 'react';
import { LayoutDashboard, ShieldCheck, KeyRound, CheckCircle, Loader2 } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Care Completion', href: '/hospital/nurse', icon: <LayoutDashboard size={16} /> },
];

type Step = 'enter_voucher' | 'enter_pin' | 'success';

export default function NursePage() {
  const { showToast } = useStore();
  const [step, setStep] = useState<Step>('enter_voucher');
  const [voucherCode, setVoucherCode] = useState('');
  const [pin, setPin] = useState('');
  const [voucherInfo, setVoucherInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) { showToast('Enter a voucher code', 'error'); return; }
    setLoading(true);
    try {
      // GET /api/vouchers/check/?code=XXX
      const data = await authenticatedFetch(`/api/vouchers/check/?code=${encodeURIComponent(code)}`);
      if (!data.is_valid) {
        showToast(`Voucher is not active. Status: ${data.status}`, 'error');
        return;
      }
      setVoucherInfo(data);
      setStep('enter_pin');
    } catch (e: any) {
      showToast(e?.message || 'Voucher not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPin = async () => {
    if (!pin || pin.length !== 4) { showToast('Enter the 4-digit PIN', 'error'); return; }
    if (!voucherInfo?.id) return;
    setLoading(true);
    try {
      await authenticatedFetch(`/api/hospitals/vouchers/${voucherInfo.id}/confirm-pin/`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      setStep('success');
    } catch (e: any) {
      showToast(e?.message || 'Invalid PIN — please try again', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('enter_voucher');
    setVoucherCode('');
    setPin('');
    setVoucherInfo(null);
  };

  return (
    <DashboardShell navItems={NAV} accentColor="#065F46" brandLabel="Nurse / Midwife" brandSub="Care confirmation">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Care Completion</h1>
          <p className="text-gray-500 text-sm mt-1">Confirm care given by verifying the beneficiary's PIN</p>
        </div>

        {step === 'enter_voucher' && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: '#065F46' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Step 1 of 2</p>
                <p className="text-xs text-gray-500">Enter the beneficiary's voucher code</p>
              </div>
            </div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Voucher Code</label>
            <input
              className="input-field font-mono uppercase tracking-widest mb-4"
              placeholder="e.g. X9K3L2"
              value={voucherCode}
              onChange={e => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              maxLength={12}
            />
            <button
              className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#065F46' }}
              onClick={handleLookup}
              disabled={loading}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Looking up…</> : 'Continue'}
            </button>
          </div>
        )}

        {step === 'enter_pin' && voucherInfo && (
          <div className="card p-6">
            {/* Voucher summary */}
            <div className="bg-emerald-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-emerald-700 font-semibold mb-1">Voucher found</p>
              <p className="font-bold text-gray-900">{voucherInfo.beneficiary?.full_name || 'Beneficiary'}</p>
              <p className="text-xs text-gray-500 font-mono">{voucherInfo.voucher_code || voucherCode}</p>
              <p className="text-xs text-gray-500">Health ID: {voucherInfo.beneficiary?.digital_health_id || '—'}</p>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: '#065F46' }}>
                <KeyRound size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Step 2 of 2</p>
                <p className="text-xs text-gray-500">Ask the beneficiary for her 4-digit PIN</p>
              </div>
            </div>

            <label className="text-xs font-semibold text-gray-500 mb-1 block">Beneficiary PIN</label>
            <input
              className="input-field font-mono text-center text-2xl tracking-[0.5em] mb-4"
              placeholder="••••"
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />

            <div className="flex gap-3">
              <button className="btn-outline flex-1 text-sm" onClick={() => setStep('enter_voucher')}>Back</button>
              <button
                className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#065F46' }}
                onClick={handleConfirmPin}
                disabled={loading || pin.length !== 4}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Confirming…</> : 'Confirm Care Given'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Care Confirmed!</h2>
            <p className="text-gray-500 text-sm mb-2">
              The voucher has been marked as used and the care record has been updated.
            </p>
            {voucherInfo && (
              <p className="text-xs font-mono text-gray-400 mb-6">{voucherInfo.voucher_code || voucherCode}</p>
            )}
            <button
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: '#065F46' }}
              onClick={handleReset}
            >
              Validate Another Voucher
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
