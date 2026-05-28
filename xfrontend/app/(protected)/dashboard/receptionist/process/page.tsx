'use client';
import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  FileText,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { checkVoucher } from '@/actions/vouchers';
import {
  listServices,
  createMedicalClaim,
  getMedicalClaim,
  addClaimItems,
  createMedicalClaimProof,
  markMedicalClaimComplete,
  createVoucherTopUpRequest,
} from '@/actions/hospital';
import { formatXAF, formatDate } from '@/lib/utils';

interface PendingItem {
  tempId: number;
  name: string;
  amount: number;
}

let nextTempId = 1;

export default function ProcessVoucher() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalId = userInfo?.hospital?.id || userInfo?.hospital;
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'idle' | 'checked' | 'manage'>('idle');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherData, setVoucherData] = useState<any>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<any>(null);
  const [serviceDescription, setServiceDescription] = useState('');
  const [error, setError] = useState('');

  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');

  const [extraItemName, setExtraItemName] = useState('');
  const [extraItemAmount, setExtraItemAmount] = useState('');
  const [extraServiceId, setExtraServiceId] = useState('');

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState('BILL');
  const proofRef = useRef<HTMLInputElement>(null);

  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpReason, setTopUpReason] = useState('');

  // ── Voucher Check ──
  const checkMutation = useMutation({
    mutationFn: () => checkVoucher(token, voucherCode.trim()),
    onSuccess: (data) => {
      if (!data) { setError('Invalid voucher response'); return; }
      setError('');
      setVoucherData(data);
      setStep('checked');
    },
    onError: () => setError('Invalid voucher code or network error'),
  });

  // ── Hospital Services ──
  const { data: servicesData } = useQuery({
    queryKey: ['rec-services', hospitalId, token],
    queryFn: () => listServices(hospitalId!, token),
    enabled: !!token && !!hospitalId,
  });
  const services: any[] = Array.isArray(servicesData) ? servicesData : (servicesData as any)?.results || [];

  // ── Add item to pending list ──
  const addPendingItem = () => {
    if (!itemName.trim() || !itemAmount || Number(itemAmount) <= 0) return;
    setPendingItems(prev => [...prev, { tempId: nextTempId++, name: itemName.trim(), amount: Number(itemAmount) }]);
    setItemName('');
    setItemAmount('');
    setSelectedServiceId('');
  };

  const removePendingItem = (tempId: number) => {
    setPendingItems(prev => prev.filter(i => i.tempId !== tempId));
  };

  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    const svc = services.find((s: any) => s.id === id);
    if (svc) {
      setItemName(svc.name);
      setItemAmount(String(svc.price));
    }
  };

  // ── Create Claim with items ──
  const createClaimMutation = useMutation({
    mutationFn: () => createMedicalClaim(token, {
      voucher: voucherData!.id,
      hospital: typeof hospitalId === 'string' ? hospitalId : hospitalId!,
      service_description: serviceDescription,
      claim_items: pendingItems.map(i => ({ name: i.name, amount: i.amount })),
    }),
    onSuccess: (claim) => {
      if (!claim) return;
      setClaimId(claim.id);
      setClaimData(claim);
      setPendingItems([]);
      setStep('manage');
    },
    onError: () => setError('Failed to create medical claim'),
  });

  // ── Add extra items after creation ──
  const addItemMutation = useMutation({
    mutationFn: () => addClaimItems(token, claimId!, {
      claim_items: [{ name: extraItemName, amount: Number(extraItemAmount) }],
    }),
    onSuccess: (claim) => {
      if (claim) setClaimData(claim);
      setExtraItemName('');
      setExtraItemAmount('');
      setExtraServiceId('');
    },
    onError: () => setError('Failed to add item'),
  });

  const fetchClaim = async () => {
    if (!claimId || !token) return;
    const data = await getMedicalClaim(claimId, token);
    if (data) setClaimData(data);
  };

  // ── Upload Proof ──
  const uploadProofMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', proofFile!);
      fd.append('document_type', proofType);
      return createMedicalClaimProof(claimId!, token, fd);
    },
    onSuccess: () => {
      setProofFile(null);
      setProofType('BILL');
      fetchClaim();
    },
    onError: () => setError('Failed to upload proof'),
  });

  // ── Complete Claim ──
  const completeMutation = useMutation({
    mutationFn: () => markMedicalClaimComplete(claimId!, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rec-claims'] });
      resetAll();
    },
    onError: () => setError('Failed to complete claim — ensure all proofs are uploaded'),
  });

  // ── Top-Up Request ──
  const topUpMutation = useMutation({
    mutationFn: () => {
      const maxTopUp = claimTotal - voucherAmount;
      const clampedAmount = Math.min(Number(topUpAmount), maxTopUp);
      return createVoucherTopUpRequest(token, {
        medical_claim: claimId!,
        requested_amount: clampedAmount,
        reason: topUpReason,
      });
    },
    onSuccess: () => {
      setShowTopUp(false);
      setTopUpAmount('');
      setTopUpReason('');
      alert('Top-up request submitted for hospital admin review.');
    },
    onError: () => setError('Failed to submit top-up request'),
  });

  const resetAll = () => {
    setStep('idle');
    setVoucherCode('');
    setVoucherData(null);
    setClaimId(null);
    setClaimData(null);
    setServiceDescription('');
    setPendingItems([]);
    setItemName('');
    setItemAmount('');
    setSelectedServiceId('');
    setExtraItemName('');
    setExtraItemAmount('');
    setExtraServiceId('');
    setProofFile(null);
    setError('');
  };

  const pendingTotal = pendingItems.reduce((s, i) => s + i.amount, 0);
  const claimTotal = claimData?.claim_items?.reduce((s: number, i: any) => s + i.amount, 0) || 0;
  const voucherAmount = voucherData?.amount || 0;
  const activeTotal = step === 'manage' ? claimTotal : pendingTotal;
  const overBudget = activeTotal > voucherAmount && voucherAmount > 0;
  const hasItems = step === 'manage'
    ? (claimData?.claim_items?.length || 0) > 0
    : pendingItems.length > 0;
  const hasProofs = (claimData?.proofs?.length || 0) > 0;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Process Voucher</h1>
        <p className="text-gray-500 text-sm">Enter a beneficiary&apos;s voucher code to begin</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      {/* ── Step 1: Voucher Code Entry ── */}
      {step === 'idle' && (
        <div className="card max-w-lg mx-auto mt-8 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Search size={28} className="text-[#1D75DB]" />
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2">Enter Voucher Code</h2>
          <p className="text-sm text-gray-500 mb-6">Ask the beneficiary for their voucher code to begin processing.</p>
          <div className="flex gap-3">
            <input
              className="input-field flex-1 text-center font-mono text-lg tracking-widest uppercase"
              placeholder="e.g. ABC-12345"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && voucherCode.trim() && checkMutation.mutate()}
              autoFocus
            />
            <button
              onClick={() => checkMutation.mutate()}
              disabled={!voucherCode.trim() || checkMutation.isPending}
              className="py-2.5 px-6 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center gap-2"
              style={{ background: '#1D75DB' }}
            >
              {checkMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Check
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Voucher Verified — Build Claim ── */}
      {step === 'checked' && voucherData && (
        <div className="space-y-5">
          {/* Voucher + Beneficiary Info */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Voucher & Beneficiary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Code</dt>
                <dd className="text-sm font-mono font-bold text-gray-900">{voucherData.voucher_code}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Status</dt>
                <dd>
                  <span className={`badge text-xs ${voucherData.is_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {voucherData.status?.replace(/_/g, ' ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Allocated Amount</dt>
                <dd className="text-sm font-bold" style={{ color: '#1D75DB' }}>{formatXAF(voucherData.amount)}</dd>
              </div>
              {voucherData.expiry_date && (
                <div>
                  <dt className="text-[10px] text-gray-400 uppercase">Expiry</dt>
                  <dd className="text-sm text-gray-700">{formatDate(voucherData.expiry_date)}</dd>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Beneficiary</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs">Name</span><p className="font-semibold">{voucherData.beneficiary.full_name}</p></div>
                <div><span className="text-gray-400 text-xs">Health ID</span><p className="font-mono text-xs">{voucherData.beneficiary.digital_health_id || '—'}</p></div>
                <div><span className="text-gray-400 text-xs">Phone</span><p>{voucherData.beneficiary.phone}</p></div>
                <div><span className="text-gray-400 text-xs">Category</span><p>{voucherData.beneficiary.category}</p></div>
              </div>
            </div>
          </div>

          {!voucherData.is_valid && (
            <div className="text-center">
              <p className="text-red-500 text-sm mb-3">This voucher is not valid for processing.</p>
              <button onClick={resetAll} className="btn-outline">Start Over</button>
            </div>
          )}

          {voucherData.is_valid && (
            <>
              {/* Service Description + Add Services (single form) */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Create Medical Claim</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">Budget:</span>
                    <span className="font-bold" style={{ color: '#1D75DB' }}>{formatXAF(voucherAmount)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Service Description *</label>
                    <textarea
                      className="input-field min-h-20"
                      placeholder="Describe the medical services being provided..."
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Select Hospital Service</label>
                    <select className="input-field" value={selectedServiceId} onChange={(e) => handleServiceSelect(e.target.value)}>
                      <option value="">— Choose a service —</option>
                      {services.filter((s: any) => s.is_available).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} — {formatXAF(s.price)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Service Name *</label>
                      <input className="input-field" placeholder="e.g. Consultation, Blood Test" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Amount (XAF) *</label>
                      <input className="input-field" type="number" min="0" placeholder="0" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} />
                    </div>
                  </div>

                  <button
                    onClick={addPendingItem}
                    disabled={!itemName.trim() || !itemAmount || Number(itemAmount) <= 0}
                    className="py-2 px-4 rounded-xl font-bold text-xs text-white disabled:opacity-60 flex items-center gap-2"
                    style={{ background: '#1D75DB' }}
                  >
                    <Plus size={14} /> Add Service
                  </button>
                </div>

                {/* Pending items table */}
                {pendingItems.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                          <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                          <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingItems.map((item, idx) => (
                          <tr key={item.tempId} className="border-b border-gray-50">
                            <td className="p-3 text-xs text-gray-400">{idx + 1}</td>
                            <td className="p-3 font-medium text-gray-800">{item.name}</td>
                            <td className="p-3 text-right font-semibold text-gray-900">{formatXAF(item.amount)}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => removePendingItem(item.tempId)} className="text-gray-400 hover:text-red-500">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={2} className="p-3 font-bold text-gray-900 text-right">Total</td>
                          <td className={`p-3 text-right font-bold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>{formatXAF(pendingTotal)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {pendingItems.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">No services added yet. Select from the hospital services above.</p>
                )}
              </div>

              {/* Over budget warning during build */}
              {overBudget && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-700">
                  <AlertTriangle size={14} />
                  Total ({formatXAF(pendingTotal)}) exceeds voucher budget ({formatXAF(voucherAmount)}). You can still create the claim and request a top-up later.
                </div>
              )}

              {/* Create Claim Button */}
              <div className="flex gap-3">
                <button onClick={resetAll} className="btn-outline flex-1">Cancel</button>
                <button
                  onClick={() => createClaimMutation.mutate()}
                  disabled={!serviceDescription.trim() || pendingItems.length === 0 || createClaimMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: '#1D75DB' }}
                >
                  {createClaimMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Create Claim ({pendingItems.length} service{pendingItems.length !== 1 ? 's' : ''})
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 3: Manage Claim (add more items, proofs, complete) ── */}
      {step === 'manage' && claimData && (
        <div className="space-y-5">
          {/* Claim Header */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-900">Claim #{String(claimData.id).slice(-8)}</h3>
                <p className="text-xs text-gray-400">{claimData.service_description}</p>
              </div>
              <span className={`badge text-xs ${claimData.claim_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                {claimData.claim_status}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Voucher Budget</dt>
                <dd className="text-sm font-bold" style={{ color: '#1D75DB' }}>{formatXAF(voucherAmount)}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Claim Total</dt>
                <dd className={`text-sm font-bold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatXAF(claimTotal)}
                  {overBudget && <span className="text-xs ml-1">(over budget)</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Remaining</dt>
                <dd className={`text-sm font-bold ${overBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatXAF(voucherAmount - claimTotal)}
                </dd>
              </div>
            </div>
          </div>

          {/* Claim Items */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Services / Items ({claimData.claim_items?.length || 0})
            </h3>

            {claimData.claim_items && claimData.claim_items.length > 0 && (
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                      <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimData.claim_items.map((item: any, idx: number) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="p-3 text-xs text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-medium text-gray-800">{item.name}</td>
                        <td className="p-3 text-right font-semibold text-gray-900">{formatXAF(item.amount)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="p-3 font-bold text-gray-900 text-right">Total</td>
                      <td className={`p-3 text-right font-bold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>{formatXAF(claimTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Add more items */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Add Another Service</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hospital Service (optional)</label>
                  <select className="input-field" value={extraServiceId} onChange={(e) => {
                    setExtraServiceId(e.target.value);
                    const svc = services.find((s: any) => s.id === e.target.value);
                    if (svc) { setExtraItemName(svc.name); setExtraItemAmount(String(svc.price)); }
                  }}>
                    <option value="">— Custom entry —</option>
                    {services.filter((s: any) => s.is_available).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} — {formatXAF(s.price)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Service Name *</label>
                    <input className="input-field" placeholder="e.g. Consultation, Blood Test" value={extraItemName} onChange={(e) => setExtraItemName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Amount (XAF) *</label>
                    <input className="input-field" type="number" min="0" placeholder="0" value={extraItemAmount} onChange={(e) => setExtraItemAmount(e.target.value)} />
                  </div>
                </div>
                <button
                  onClick={() => addItemMutation.mutate()}
                  disabled={!extraItemName.trim() || !extraItemAmount || Number(extraItemAmount) <= 0 || addItemMutation.isPending}
                  className="py-2 px-4 rounded-xl font-bold text-xs text-white disabled:opacity-60 flex items-center gap-2"
                  style={{ background: '#1D75DB' }}
                >
                  {addItemMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add Service
                </button>
              </div>
            </div>
          </div>

          {/* Over Budget Warning */}
          {overBudget && (
            <div className="card p-5 border-2 border-amber-300 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-800 text-sm mb-1">Over Budget</h4>
                  <p className="text-xs text-amber-700 mb-3">
                    Claim total ({formatXAF(claimTotal)}) exceeds voucher budget ({formatXAF(voucherAmount)}).
                    You can save and wait, or request a top-up from the hospital admin.
                  </p>
                  {!showTopUp && (
                    <button onClick={() => { setShowTopUp(true); setTopUpAmount(String(claimTotal - voucherAmount)); }} className="text-xs font-bold text-amber-800 underline">Request Top-Up</button>
                  )}
                  {showTopUp && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-amber-600">Maximum top-up: {formatXAF(claimTotal - voucherAmount)}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input-field" type="number" min="0" max={claimTotal - voucherAmount} placeholder="Amount (XAF)" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
                        <input className="input-field" placeholder="Reason" value={topUpReason} onChange={(e) => setTopUpReason(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowTopUp(false)} className="text-xs text-amber-700 underline">Cancel</button>
                        <button
                          onClick={() => topUpMutation.mutate()}
                          disabled={!topUpAmount || !topUpReason.trim() || topUpMutation.isPending}
                          className="text-xs font-bold text-white bg-amber-600 px-3 py-1.5 rounded-lg disabled:opacity-60"
                        >
                          {topUpMutation.isPending ? 'Submitting...' : 'Submit Request'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Proofs Section */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
              Document Proofs ({claimData.proofs?.length || 0})
            </h3>

            {claimData.proofs && claimData.proofs.length > 0 && (
              <div className="space-y-2 mb-4">
                {claimData.proofs.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{String(p.document_type).replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-gray-400">{p.uploaded_at ? formatDate(p.uploaded_at) : '—'}</p>
                      </div>
                    </div>
                    <span className={`badge text-[10px] ${
                      p.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                      p.verification_status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.verification_status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Upload Proof</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Document Type</label>
                  <select className="input-field" value={proofType} onChange={(e) => setProofType(e.target.value)}>
                    {['BILL', 'PRESCRIPTION', 'LAB_RESULT', 'DISCHARGE', 'IMAGING', 'OTHER'].map((t) => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input ref={proofRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                  <button
                    type="button"
                    onClick={() => proofRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#1D75DB] transition-colors"
                  >
                    {proofFile ? (
                      <div className="flex items-center gap-2 justify-center text-sm text-gray-700">
                        <FileText size={16} /> {proofFile.name}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-center text-sm text-gray-400">
                        <Upload size={16} /> Click to upload document
                      </div>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => uploadProofMutation.mutate()}
                  disabled={!proofFile || uploadProofMutation.isPending}
                  className="py-2 px-4 rounded-xl font-bold text-xs text-white disabled:opacity-60 flex items-center gap-2"
                  style={{ background: '#1D75DB' }}
                >
                  {uploadProofMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  Upload Proof
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={resetAll} className="btn-outline flex-1">Cancel / Start Over</button>
            <button
              onClick={() => completeMutation.mutate()}
              disabled={!hasItems || !hasProofs || completeMutation.isPending}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#22C55E' }}
            >
              {completeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Complete &amp; Submit
            </button>
          </div>
          {(!hasItems || !hasProofs) && (
            <p className="text-xs text-gray-400 text-center -mt-2">
              {!hasItems && !hasProofs && 'Add service items and upload document proofs before completing.'}
              {!hasItems && hasProofs && 'Add at least one service item before completing.'}
              {hasItems && !hasProofs && 'Upload at least one document proof before completing.'}
            </p>
          )}
        </div>
      )}
    </>
  );
}
