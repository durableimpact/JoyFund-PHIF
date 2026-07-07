'use client';
import { useI18n } from '@/locales/client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  React,
  Search,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { useUrlSearchParams } from '@/hooks/use-url-search-params';

















import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from '@/lib/utils';
import { listHospitals } from '@/actions/hospital';
import {
  listDisbursements,
  getDisbursementStatistics,
  createDisbursement,
  markDisbursementCompleted,
  markDisbursementFailed
} from '@/actions/disbursement';

const PAYMENT_METHODS_RAW = [
  { value: 'MOMO', labelKey: 'systemAdmin.disbursements.mobileMoney' },
  { value: 'BANK_TRANSFER', labelKey: 'systemAdmin.disbursements.bankTransfer' },
  { value: 'CASH', labelKey: 'systemAdmin.disbursements.cash' },
  { value: 'OTHER', labelKey: 'systemAdmin.disbursements.other' },
] as const;

export default function DisbursementsPage() {
  const t = useI18n();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();
  const PAYMENT_METHODS = PAYMENT_METHODS_RAW.map(m => ({ value: m.value, label: t(m.labelKey as any, {}) }));

  const [urlParams, setUrlParams] = useUrlSearchParams(
    { search: '', statusTab: 'ALL' },
    {}
  );
  const search = (urlParams.search as string) || '';
  const statusTab = (urlParams.statusTab as string) as 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED';
  const [showRecordModal, setShowRecordModal] = useState(false);

  const [selectedHospital, setSelectedHospital] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'BANK_TRANSFER' | 'CASH' | 'OTHER'>('MOMO');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const { data: disbursements = [], isLoading: loadingList } = useQuery<Disbursement[]>({
    queryKey: ['disbursements', token],
    queryFn: async () => { const res = await listDisbursements(token); return res?.results || res; },
    enabled: !!token,
  });

  const { data: statistics, isLoading: loadingStats } = useQuery<DisbursementStatistics>({
    queryKey: ['disbursementStats', token],
    queryFn: () => getDisbursementStatistics(token),
    enabled: !!token,
  });

  const { data: hospitals = [] } = useQuery<Hospital[]>({
    queryKey: ['hospitals', token],
    queryFn: async () => { const res = await listHospitals(token); return res?.results || res; },
    enabled: !!token && showRecordModal,
  });

  const createMutation = useMutation({
    mutationFn: (payload: DisbursementCreatePayload) => createDisbursement(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['disbursementStats'] });
      setShowRecordModal(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to record disbursement';
      try { const parsed = JSON.parse(err); setFormError(parsed.message || parsed.detail || msg); }
      catch { setFormError(msg); }
    }
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => markDisbursementCompleted(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['disbursementStats'] });
    }
  });

  const failMutation = useMutation({
    mutationFn: (id: string) => markDisbursementFailed(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['disbursementStats'] });
    }
  });

  function resetForm() {
    setSelectedHospital(''); setAmount(''); setPaymentMethod('MOMO');
    setRecipientPhone(''); setRecipientAccount('');
    setExternalReference(''); setNotes(''); setFormError('');
  }

  function handleRecordSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('');
    if (!selectedHospital) return setFormError('Please select a hospital');
    if (!amount || parseFloat(amount) <= 0) return setFormError('Please enter a valid amount');
    createMutation.mutate({
      hospital: selectedHospital,
      amount: parseFloat(amount),
      currency: 'XAF',
      payment_method: paymentMethod,
      recipient_phone: recipientPhone || undefined,
      recipient_account: recipientAccount || undefined,
      external_reference: externalReference || undefined,
      notes: notes || undefined,
    });
  }

  const filtered = disbursements.filter(d => {
    const s = search.toLowerCase();
    const matchesSearch = !s || d.hospital_name?.toLowerCase().includes(s) || d.id.toLowerCase().includes(s) || d.external_reference?.toLowerCase().includes(s);
    const matchesStatus = statusTab === 'ALL' || d.status === statusTab;
    return matchesSearch && matchesStatus;
  });

  const statusColor = (st: DisbursementStatus) => st === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : st === 'PENDING' ? 'bg-amber-100 text-amber-700' : st === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700';
  const fmtXAF = (v?: number) => v != null ? `${v.toLocaleString()} XAF` : '0 XAF';

  return (<>

    
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('systemAdmin.disbursements.title')}</h1>
          <p className="text-gray-500 text-sm">{t('systemAdmin.disbursements.subtitle')}</p>
        </div>
        <button onClick={() => { resetForm(); setShowRecordModal(true); }} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Plus size={16} /> Record Disbursement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <StatCard label={t('systemAdmin.disbursements.totalDisbursed')} value={statistics?.total_disbursed} loading={loadingStats} icon={<TrendingUp size={20} />} color="emerald" />
        <StatCard label={t('systemAdmin.disbursements.pending')} value={statistics?.total_pending} loading={loadingStats} icon={<Clock size={20} />} color="amber" />
        <StatCard label={t('systemAdmin.disbursements.failed')} value={statistics?.total_failed} loading={loadingStats} icon={<AlertCircle size={20} />} color="red" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-5">
        <div className="flex gap-2">
          {(['ALL', 'PENDING', 'COMPLETED', 'FAILED'] as const).map(tab => (
            <button key={tab} onClick={() => setUrlParams({ statusTab: tab })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusTab === tab ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              style={statusTab === tab ? { background: '#471DDB' } : {}}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 text-xs" placeholder="Search…" value={search} onChange={e => setUrlParams({ search: e.target.value })} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {[t('systemAdmin.disbursements.colHospital'), t('systemAdmin.disbursements.colAmount'), t('systemAdmin.disbursements.colMethod'), t('systemAdmin.disbursements.colReference'), t('systemAdmin.disbursements.colStatus'), t('systemAdmin.disbursements.colDate'), t('systemAdmin.disbursements.colActions')].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr><td colSpan={7} className="text-center py-16"><Skeleton className="h-5 w-5 rounded mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 text-sm">{t('systemAdmin.disbursements.empty')}</td></tr>
              ) : filtered.map(d => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/70">
                  <td className="p-4"><div className="font-semibold text-gray-900 text-sm">{d.hospital_name || t('systemAdmin.disbursements.unknown')}</div></td>
                  <td className="p-4 font-bold text-gray-900 text-xs">{fmtXAF(d.amount)}</td>
                  <td className="p-4 text-xs text-gray-700">{d.payment_method_display || d.payment_method}</td>
                  <td className="p-4 text-xs text-gray-500 font-mono">{d.external_reference || '—'}</td>
                  <td className="p-4"><span className={`badge text-[10px] ${statusColor(d.status)}`}>{d.status_display || d.status}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{formatDate(d.created_at)}</td>
                  <td className="p-4">
                    {d.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => completeMutation.mutate(d.id)} disabled={completeMutation.isPending} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Completed"><CheckCircle size={18} /></button>
                        <button onClick={() => failMutation.mutate(d.id)} disabled={failMutation.isPending} className="p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Failed"><XCircle size={18} /></button>
                      </div>
                    ) : <span className="text-xs text-gray-400 italic">{t('systemAdmin.disbursements.locked')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('systemAdmin.disbursements.recordNew')}</h2>
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2"><AlertCircle size={14} /> {formError}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.disbursements.recipientHospital')}</label>
                <select className="input-field text-sm" value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)} required>
                  <option value="">{t('systemAdmin.disbursements.selectHospital')}</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.disbursements.amount')}</label>
                  <input type="number" min="1" className="input-field text-sm" placeholder={t('systemAdmin.disbursements.amountPlaceholder')} value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.disbursements.paymentMethod')}</label>
                  <select className="input-field text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.disbursements.recipientPhone')}</label>
                  <input type="text" className="input-field text-sm font-mono" placeholder={t('systemAdmin.disbursements.phonePlaceholder')} value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.disbursements.recipientAccount')}</label>
                  <input type="text" className="input-field text-sm font-mono" placeholder={t('systemAdmin.disbursements.accountPlaceholder')} value={recipientAccount} onChange={e => setRecipientAccount(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.disbursements.externalReference')}</label>
                <input type="text" className="input-field text-sm font-mono" placeholder={t('systemAdmin.disbursements.referencePlaceholder')} value={externalReference} onChange={e => setExternalReference(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.disbursements.notes')}</label>
                <textarea className="input-field text-sm min-h-[80px]" placeholder={t('systemAdmin.disbursements.notesPlaceholder')} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRecordModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">{t('systemAdmin.disbursements.cancel')}</button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-white rounded-xl text-sm font-semibold hover:opacity-90 flex items-center gap-2" style={{ background: '#471DDB' }}>
                  {createMutation.isPending && <Loader2 size={16} className="animate-spin" />} {t('systemAdmin.disbursements.recordAndDisburse')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
</>
);
}

function StatCard({ label, value, loading, icon, color }: { label: string; value?: number; loading: boolean; icon: React.ReactNode; color: string }) {
  const bg = color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600';
  return (
    <div className="card flex items-center justify-between p-5">
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-black text-gray-900">{loading ? <Loader2 className="animate-spin text-gray-400 size-5" /> : `${(value ?? 0).toLocaleString()} XAF`}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bg}`}>{icon}</div>
    </div>
  );
}
