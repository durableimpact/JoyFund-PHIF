'use client';
import { useState } from 'react';
import { LayoutDashboard, ShieldCheck, KeyRound, CheckCircle } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/hospital/nurse', icon: <LayoutDashboard size={16} /> },
];

type Step = 'enter_voucher' | 'enter_pin' | 'success';

export default function NursePage() {
  const { showToast } = useStore();
  const [step, setStep] = useState<Step>('enter_voucher');
  const [voucherId, setVoucherId] = useState('');
  const [pin, setPin] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [voucherInfo, setVoucherInfo] = useState<any>(null);

  // Step 1: look up voucher
  const handleLookup = async () => {
    if (!voucherId.trim()) { showToast('Enter a voucher ID or code', 'error'); return; }
    setConfirming(true);
    try {
      const data = await authenticatedFetch('/api/vouchers/check/', {
        method: 'POST',
        body: JSON.stringify({ code: voucherId.trim() }),
      });
      setVoucherInfo(data);
      setStep('enter_pin');
    } catch (e: any) {
      showToast(e?.message || 'Voucher not found', 'error');
    } finally {
      setConfirming(false);
    }
  };

  // Step 2: confirm PIN
  const handleConfirmPin = async () => {
    if (!pin || pin.length < 4) { showToast('Enter the 4-digit PIN', 'error'); return; }
    if (!voucherInfo?.id) return;
    setConfirming(true);
    try {
      await authenticatedFetch(`/api/hospitals/vouchers/${voucherInfo.id}/confirm-pin/`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      setStep('success');
    } catch (e: any) {
      showToast(e?.message || 'Invalid PIN — care cannot be marked as complete', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleReset = () => {
    setStep('enter_voucher');
    setVoucherId('');
    setPin('');
    setVoucherInfo(null);
  };

  return (
    <DashboardShell
      navItems={NAV}
      accentColor="#065F46"
      brandLabel="Nurse / Midwife"
      brandSub="Care confirmation"
    >
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Care Completion</h1>
          <p className="text-gray-500 text-sm">Confirm delivery or care provided by entering the beneficiary's secret PIN</p>
        </div>

        {step === 'enter_voucher' && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#065F46' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Step 1</p>
                <p className="text-xs text-gray-500">Enter the beneficiary's voucher code</p>
              </div>
            </div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Voucher Code / ID</label>
            <input
              className="input-field font-mono uppercase mb-4"
              placeholder="e.g. JF-2024-ABCD"
              value={voucherId}
              onChange={e => setVoucherId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
            />
            <button
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: '#065F46' }}
              onClick={handleLookup}
              disabled={confirming}
            >
              {confirming ? 'Looking up…' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'enter_pin' && voucherInfo && (
          <div className="card p-6">
            <div className="bg-emerald-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-emerald-700 font-semibold mb-1">Voucher found</p>
              <p className="font-bold text-gray-900">{voucherInfo.beneficiary_name || 'Beneficiary'}</p>
              <p className="text-xs text-gray-500 font-mono">{voucherInfo.code || voucherId}</p>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: '#065F46' }}>
                <KeyRound size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Step 2</p>
                <p className="text-xs text-gray-500">Ask the beneficiary for her secret PIN</p>
              </div>
            </div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Beneficiary's PIN</label>
            <input
              className="input-field font-mono text-center text-2xl tracking-[0.5em] mb-4"
              placeholder="••••"
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/, ''))}
            />
            <div className="flex gap-3">
              <button className="btn-outline flex-1 text-sm" onClick={() => setStep('enter_voucher')}>Back</button>
              <button
                className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#065F46' }}
                onClick={handleConfirmPin}
                disabled={confirming}
              >
                {confirming ? 'Confirming…' : 'Confirm Care Given'}
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
              The voucher has been marked as redeemed and care has been recorded.
            </p>
            {voucherInfo && (
              <p className="text-xs font-mono text-gray-400 mb-6">{voucherInfo.code || voucherId}</p>
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
