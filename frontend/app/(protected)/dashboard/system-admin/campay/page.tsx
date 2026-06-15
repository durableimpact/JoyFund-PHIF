'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Landmark,
  Loader2,
  Phone,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { getCampayBalance, campayDisburse } from '@/actions/campay';
import { listHospitals } from '@/actions/hospital';

export default function CampayPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();

  const [showDisburseForm, setShowDisburseForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { data: balance, isLoading: loadingBalance } = useQuery<CampayBalance>({
    queryKey: ['campayBalance', token],
    queryFn: () => getCampayBalance(token),
    enabled: !!token,
  });

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['hospitals', token],
    queryFn: async () => { const res = await listHospitals(token); return res?.results || res; },
    enabled: !!token,
  });

  const disburseMutation = useMutation({
    mutationFn: (payload: CampayDisbursePayload) => campayDisburse(token, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campayBalance'] });
      setShowDisburseForm(false);
      setFormSuccess(`Disbursed ${parseFloat(amount).toLocaleString()} XAF successfully. Reference: ${data.campay_reference}`);
      resetForm();
      setTimeout(() => setFormSuccess(''), 6000);
    },
    onError: (err: any) => {
      try { const parsed = JSON.parse(err); setFormError(parsed.error || parsed.message || parsed.detail || 'Disbursement failed'); }
      catch { setFormError('Disbursement failed'); }
    }
  });

  function resetForm() {
    setAmount(''); setPhone(''); setDescription(''); setSelectedHospital(''); setFormError('');
  }

  function handleDisburseSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('');
    if (!amount || parseFloat(amount) <= 0) return setFormError('Enter a valid amount');
    if (!phone) return setFormError('Enter recipient phone number');
    if (!description) return setFormError('Enter a description');
    const cleaned = phone.replace(/[\s\+]/g, '');
    if (!cleaned.startsWith('237') || cleaned.length !== 12) return setFormError('Phone must be 237XXXXXXXXX (12 digits)');
    disburseMutation.mutate({
      amount: parseFloat(amount),
      phone: cleaned,
      description,
      hospital: selectedHospital || undefined,
    });
  }

  const fmtXAF = (v?: number) => v != null ? `${v.toLocaleString()} XAF` : '0 XAF';

  return (
    <>
      {formSuccess && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={16} /> {formSuccess}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">CamPay</h1>
          <p className="text-gray-500 text-sm">Mobile Money wallet balance and disbursements</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowDisburseForm(true); }}
          className="btn-admin text-sm flex items-center gap-2"
          style={{ background: '#471DDB' }}
        >
          <Phone size={16} /> Disburse via CamPay
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Balance</p>
            <h3 className="text-2xl font-black text-gray-900">
              {loadingBalance ? <Loader2 className="animate-spin text-gray-400 size-5" /> : fmtXAF(balance?.total_balance)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600"><Wallet size={20} /></div>
        </div>
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">MTN Balance</p>
            <h3 className="text-2xl font-black text-gray-900">
              {loadingBalance ? <Loader2 className="animate-spin text-gray-400 size-5" /> : fmtXAF(balance?.mtn_balance)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600"><Smartphone size={20} /></div>
        </div>
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Orange Balance</p>
            <h3 className="text-2xl font-black text-gray-900">
              {loadingBalance ? <Loader2 className="animate-spin text-gray-400 size-5" /> : fmtXAF(balance?.orange_balance)}
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600"><Smartphone size={20} /></div>
        </div>
      </div>

      {showDisburseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Landmark size={18} /></div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Disburse via CamPay</h2>
                <p className="text-xs text-gray-400">Send money via Mobile Money (MTN / Orange)</p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <form onSubmit={handleDisburseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Amount (XAF)</label>
                <input type="number" min="1" step="0.01" className="input-field text-sm" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Recipient Phone</label>
                <input type="tel" className="input-field text-sm font-mono" placeholder="2376XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />
                <p className="text-[10px] text-gray-400 mt-1">Cameroon number starting with 237 (e.g. 237670000000)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description</label>
                <input type="text" className="input-field text-sm" placeholder="Reason for disbursement" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hospital (optional)</label>
                <select className="input-field text-sm" value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}>
                  <option value="">No hospital association</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDisburseForm(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={disburseMutation.isPending} className="px-4 py-2 text-white rounded-xl text-sm font-semibold hover:opacity-90 flex items-center gap-2" style={{ background: '#471DDB' }}>
                  {disburseMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  {disburseMutation.isPending ? 'Processing...' : 'Disburse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
