'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { formatXAF } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

type Stage = 'select' | 'pin' | 'success' | 'error';

export default function NursePage() {
  const { vouchers, showToast } = useStore();
  const [stage, setStage] = useState<Stage>('select');
  const [selected, setSelected] = useState<typeof vouchers[0] | null>(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [attempts, setAttempts] = useState(0);
  const eligible = vouchers.filter(v => v.status === 'redeemed');

  const handlePinInput = (idx: number, val: string) => {
    if (val.length > 1) return;
    const next = [...pin]; next[idx] = val; setPin(next);
    if (val && idx < 3) document.getElementById(`pin-${idx + 1}`)?.focus();
  };

  const handleConfirm = () => {
    if (!selected) return;
    if (pin.join('') === selected.patientPin) { setStage('success'); showToast('Payout initiated! 💸', 'success'); }
    else { setAttempts(a => a + 1); setPin(['', '', '', '']); if (attempts >= 2) setStage('error'); else showToast(`Incorrect PIN. ${2 - attempts} attempt(s) left.`, 'error'); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 text-white flex items-center gap-3" style={{ background: 'var(--secondary)' }}>
        <span className="text-xl">💊</span>
        <div><p className="font-black text-sm">Centre Hospitalier d&apos;Essos</p><p className="text-xs opacity-60">Nurse Portal · Service Confirmation</p></div>
      </div>
      <div className="max-w-md mx-auto px-4 py-8">
        {stage === 'select' && (
          <div className="card p-6 animate-fade-up">
            <h2 className="text-xl font-black text-gray-900 mb-1">Service Confirmation</h2>
            <p className="text-gray-500 text-sm mb-5">Select the patient whose care has been completed</p>
            {eligible.length === 0 ? (
              <div className="text-center py-8"><div className="text-4xl mb-3">🏥</div><p className="text-gray-500 text-sm">No patients currently checked in. Ask receptionist to validate a voucher first.</p></div>
            ) : (
              <div className="space-y-3">
                {eligible.map(v => (
                  <button key={v.id} onClick={() => { setSelected(v); setStage('pin'); }} className="w-full p-4 bg-gray-50 rounded-2xl border-2 border-gray-200 hover:border-gray-300 text-left transition-all">
                    <div className="font-bold text-gray-900">Mama {v.beneficiaryName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Voucher {v.code} · {formatXAF(v.amountXAF)}</div>
                    <div className="text-xs mt-1 font-medium" style={{ color: 'var(--primary)' }}>{v.services.join(', ')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {stage === 'pin' && selected && (
          <div className="card p-6 text-center animate-fade-up">
            <h2 className="text-xl font-black text-gray-900 mb-1">Enter Patient PIN</h2>
            <p className="text-gray-500 text-sm mb-3">Ask <strong>Mama {selected.beneficiaryName}</strong> to provide her 4-digit PIN from her SMS.</p>
            {attempts > 0 && <div className="flex items-center gap-2 justify-center text-amber-600 text-xs mb-4"><AlertTriangle size={14} /> {3 - attempts} attempt(s) remaining</div>}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map(i => (
                <input key={i} id={`pin-${i}`} type="password" maxLength={1} value={pin[i]} onChange={e => handlePinInput(i, e.target.value)} className="w-14 h-14 text-center text-2xl font-black border-2 rounded-xl outline-none transition-all" style={{ borderColor: pin[i] ? 'var(--primary)' : '#e5e7eb', boxShadow: pin[i] ? '0 0 0 3px rgba(29,177,219,0.15)' : 'none' }} />
              ))}
            </div>
            <button className="btn-primary w-full mb-3" onClick={handleConfirm} disabled={pin.some(p => !p)}>Confirm & Release Payment</button>
            <button className="btn-outline w-full text-sm" onClick={() => { setStage('select'); setPin(['','','','']); setAttempts(0); }}>Cancel</button>
          </div>
        )}
        {stage === 'success' && selected && (
          <div className="card p-8 text-center animate-fade-up" style={{ border: '2px solid var(--success)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white" style={{ background: 'var(--success)' }}><CheckCircle size={28} /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Service Confirmed!</h2>
            <p className="text-gray-500 text-sm mb-5">Payout initiated. Funds on their way.</p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2 text-sm text-left">
              <div className="flex justify-between"><span className="text-gray-500">Patient</span><span className="font-bold">Mama {selected.beneficiaryName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-bold" style={{ color: 'var(--success)' }}>{formatXAF(selected.amountXAF)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-medium">{selected.hospitalName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-mono text-xs">PAY-{Date.now().toString().slice(-8)}</span></div>
            </div>
            <button className="btn-primary w-full" onClick={() => { setStage('select'); setSelected(null); setPin(['','','','']); setAttempts(0); }}>Done</button>
          </div>
        )}
        {stage === 'error' && (
          <div className="card p-8 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100"><XCircle size={28} className="text-red-500" /></div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Too Many Attempts</h2>
            <p className="text-gray-500 text-sm mb-5">PIN verification failed 3 times. Session flagged for admin review.</p>
            <button className="btn-outline w-full" onClick={() => { setStage('select'); setAttempts(0); setPin(['','','','']); }}>Start Over</button>
          </div>
        )}
      </div>
    </div>
  );
}
