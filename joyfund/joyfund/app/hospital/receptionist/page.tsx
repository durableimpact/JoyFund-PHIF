'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { formatXAF, statusColor, statusLabel } from '@/lib/utils';
import { CheckCircle, XCircle, Lock, Clock } from 'lucide-react';

type Stage = 'entry' | 'valid' | 'invalid' | 'locked';

export default function ReceptionistPage() {
  const { vouchers, updateVoucher, showToast } = useStore();
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>('entry');
  const [foundVoucher, setFoundVoucher] = useState<typeof vouchers[0] | null>(null);

  const handleNumpad = (val: string) => {
    if (val === 'DEL') { setCode(c => c.slice(0, -1)); return; }
    if (code.length < 6) setCode(c => c + val);
  };

  const handleValidate = () => {
    const v = vouchers.find(x => x.code === code.toUpperCase() && x.status === 'issued');
    if (v) { setFoundVoucher(v); setStage('valid'); }
    else { setStage('invalid'); setTimeout(() => { setStage('entry'); setCode(''); }, 2500); }
  };

  const handleLock = () => {
    if (!foundVoucher) return;
    updateVoucher(foundVoucher.id, { status: 'redeemed' });
    showToast('Funds locked! Donor notified 🔔', 'success');
    setStage('locked');
  };

  const todayVouchers = vouchers.filter(v => v.status === 'redeemed').slice(0, 4);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="py-4 px-6 text-white flex items-center gap-3" style={{ background: 'var(--secondary)' }}>
        <div className="w-8 h-8 rounded-lg bg-white opacity-20 absolute" />
        <span className="text-xl">🏥</span>
        <div><p className="font-black text-sm">Centre Hospitalier d&apos;Essos</p><p className="text-xs opacity-60">Receptionist Portal · {new Date().toLocaleDateString()}</p></div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {(stage === 'entry' || stage === 'invalid') && (
          <div className="card p-6 text-center">
            <h2 className="text-xl font-black text-gray-900 mb-1">Voucher Check-In</h2>
            <p className="text-gray-500 text-sm mb-6">Enter the 6-digit JoyFund Care Code from the patient&apos;s SMS</p>
            <div className={`flex justify-center gap-2 mb-6 ${stage === 'invalid' ? 'animate-bounce' : ''}`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all ${stage === 'invalid' ? 'border-red-400 text-red-500' : ''}`} style={code[i] && stage !== 'invalid' ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : { borderColor: '#e5e7eb', background: '#f9fafb' }}>
                  {code[i] || ''}
                </div>
              ))}
            </div>
            {stage === 'invalid' && <div className="flex items-center justify-center gap-2 text-red-500 text-sm mb-4"><XCircle size={16} /> Invalid or already redeemed code.</div>}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-5">
              {['1','2','3','4','5','6','7','8','9','*','0','DEL'].map(k => (
                <button key={k} onClick={() => handleNumpad(k)} className={`h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 ${k === 'DEL' ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-900 hover:bg-gray-100'}`}>{k}</button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-3">Or type directly:</p>
            <input className="input-field text-center text-xl font-bold tracking-widest mb-5 uppercase" placeholder="e.g. JF9M4P" value={code} onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))} maxLength={6} />
            <button className="btn-secondary w-full" onClick={handleValidate} disabled={code.length < 6}>Validate Voucher</button>
          </div>
        )}
        {stage === 'valid' && foundVoucher && (
          <div className="animate-fade-up card p-6" style={{ border: '2px solid var(--success)' }}>
            <div className="flex items-center gap-2 mb-4"><CheckCircle size={20} style={{ color: 'var(--success)' }} /><span className="font-bold text-gray-900">Valid — {foundVoucher.code}</span></div>
            <div className="bg-gray-50 rounded-2xl p-4 mb-5">
              <p className="text-xs text-gray-400 mb-1">Patient</p>
              <p className="font-black text-xl text-gray-900">Mama {foundVoucher.beneficiaryName}</p>
            </div>
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services Covered</p>
              <div className="space-y-2">{foundVoucher.services.map(s => (<div key={s} className="flex items-center gap-2 text-sm"><div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs" style={{ background: 'var(--success)' }}>✓</div>{s}</div>))}</div>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl mb-5" style={{ background: 'rgba(29,177,219,0.1)' }}>
              <span className="text-sm font-semibold text-gray-700">Fund Value</span>
              <span className="font-black text-lg" style={{ color: 'var(--secondary)' }}>{formatXAF(foundVoucher.amountXAF)}</span>
            </div>
            <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={handleLock}><Lock size={16} /> Lock Funds & Proceed</button>
          </div>
        )}
        {stage === 'locked' && (
          <div className="card p-8 text-center animate-fade-up">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Funds Locked — Care in Progress</h2>
            <p className="text-gray-500 text-sm mb-5">Provide care, then the nurse confirms PIN to release payment.</p>
            <div className="badge bg-cyan-100 text-cyan-700 text-sm px-4 py-2 mb-5">Awaiting PIN Confirmation</div>
            <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 mb-5">📱 Donor notification sent</div>
            <button className="btn-primary w-full" onClick={() => { setStage('entry'); setCode(''); setFoundVoucher(null); }}>Validate Another Voucher</button>
          </div>
        )}
        {stage === 'entry' && todayVouchers.length > 0 && (
          <div className="card p-5 mt-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2"><Clock size={14} /> Today&apos;s Validated Vouchers</h3>
            <div className="space-y-2">
              {todayVouchers.map(v => (
                <div key={v.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                  <div><span className="font-mono font-bold text-gray-900">{v.code}</span><span className="text-gray-400 ml-2">{v.beneficiaryName}</span></div>
                  <span className={`badge ${statusColor(v.status)}`}>{statusLabel(v.status)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
