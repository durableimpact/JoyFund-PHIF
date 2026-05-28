'use client';
import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ClipboardCheck,
  Copy,
  Check,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Send,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { getVoucher } from '@/actions/vouchers';
import {
  listServices,
  getMedicalClaims,
  getMedicalClaim,
  createMedicalClaim,
  addClaimItems,
  createMedicalClaimProof,
  markMedicalClaimComplete,
  createVoucherTopUpRequest,
} from '@/actions/hospital';
import { formatXAF, formatDate, formatDateTime, statusColor } from '@/lib/utils';

interface PendingItem {
  tempId: number;
  name: string;
  amount: number;
}

let nextTempId = 1;

export default function ReceptionistVoucherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const userInfo = (session?.user as any)?.userInfo;
  const hospitalId = userInfo?.hospital?.id || userInfo?.hospital;
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [serviceDescription, setServiceDescription] = useState('');
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
  const [error, setError] = useState('');

  // ── Fetch voucher ──
  const { data: voucherData, isLoading: vLoading } = useQuery({
    queryKey: ['rec-voucher', id, token],
    queryFn: () => getVoucher(id, token),
    enabled: !!token && !!id,
  });
  const voucher = voucherData as Voucher | undefined;

  // ── Fetch associated medical claim ──
  const { data: claimsData, isLoading: cLoading } = useQuery({
    queryKey: ['rec-voucher-claims', id, token],
    queryFn: () => getMedicalClaims(token, { voucher: id }),
    enabled: !!token && !!id,
  });

  const claim = (claimsData as any)?.results?.[0] as MedicalClaim | undefined;
  const claimId = claim?.id;

  // ── Fetch full claim details when we have an ID ──
  const { data: claimDetailData } = useQuery({
    queryKey: ['rec-voucher-claim', claimId, token],
    queryFn: () => getMedicalClaim(claimId!, token),
    enabled: !!token && !!claimId,
  });
  const claimDetail = claimDetailData as MedicalClaim | undefined;

  const activeClaim = claimDetail || claim;

  // ── Hospital Services ──
  const { data: servicesData } = useQuery({
    queryKey: ['rec-services', hospitalId, token],
    queryFn: () => listServices(hospitalId!, token),
    enabled: !!token && !!hospitalId,
  });
  const services: any[] = Array.isArray(servicesData) ? servicesData : (servicesData as any)?.results || [];

  // ── Mutations ──
  const createClaimMutation = useMutation({
    mutationFn: () => createMedicalClaim(token, {
      voucher: voucher!.id,
      hospital: typeof hospitalId === 'string' ? hospitalId : hospitalId!,
      service_description: serviceDescription,
      claim_items: pendingItems.map(i => ({ name: i.name, amount: i.amount })),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rec-voucher-claims', id] });
      setServiceDescription('');
      setPendingItems([]);
    },
    onError: () => setError('Failed to create medical claim'),
  });

  const addItemMutation = useMutation({
    mutationFn: () => addClaimItems(token, claimId!, {
      claim_items: [{ name: extraItemName, amount: Number(extraItemAmount) }],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rec-voucher-claim', claimId] });
      setExtraItemName('');
      setExtraItemAmount('');
      setExtraServiceId('');
    },
    onError: () => setError('Failed to add item'),
  });

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
      queryClient.invalidateQueries({ queryKey: ['rec-voucher-claim', claimId] });
    },
    onError: () => setError('Failed to upload proof'),
  });

  const completeMutation = useMutation({
    mutationFn: () => markMedicalClaimComplete(claimId!, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rec-claims'] });
      queryClient.invalidateQueries({ queryKey: ['rec-voucher-claim', claimId] });
    },
    onError: () => setError('Failed to complete claim'),
  });

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

  // ── Helpers ──
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleServiceSelect = (sid: string) => {
    setSelectedServiceId(sid);
    const svc = services.find((s: any) => s.id === sid);
    if (svc) { setItemName(svc.name); setItemAmount(String(svc.price)); }
  };

  const pendingTotal = pendingItems.reduce((s, i) => s + i.amount, 0);
  const claimTotal = activeClaim?.claim_items?.reduce((s: number, i: any) => s + i.amount, 0) || 0;
  const voucherAmount = voucher?.funding_records?.reduce((s, f) => s + f.committed_amount, 0) || 0;
  const overBudget = (activeClaim ? claimTotal : pendingTotal) > voucherAmount && voucherAmount > 0;
  const hasItems = activeClaim ? (activeClaim.claim_items?.length || 0) > 0 : pendingItems.length > 0;
  const hasProofs = (activeClaim?.proofs?.length || 0) > 0;

  if (vLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
        <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!voucher) {
    return <div className="text-center py-16 text-gray-400">Voucher not found.</div>;
  }

  return (
    <>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to Vouchers
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={16} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Voucher + Claim ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Voucher Info */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Receipt size={14} /> Voucher Information
              </h2>
              <span className={`badge text-xs ${statusColor(voucher.status)}`}>{voucher.status?.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <code className="font-mono text-lg font-bold text-gray-700 bg-gray-100 rounded-lg px-3 py-1 select-all">
                {voucher.voucher_code}
              </code>
              <button onClick={() => copyCode(voucher.voucher_code)} className="text-gray-400 hover:text-gray-600 p-1" title="Copy code">
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Budget</dt>
                <dd className="text-sm font-bold" style={{ color: '#1D75DB' }}>{formatXAF(voucherAmount)}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Language</dt>
                <dd className="text-sm text-gray-700">{voucher.language_preference?.toUpperCase()}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Expiry</dt>
                <dd className="text-sm text-gray-700">{voucher.expiry_date ? formatDate(voucher.expiry_date) : '—'}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-gray-400 uppercase">Created</dt>
                <dd className="text-sm text-gray-700">{formatDate(voucher.created_at)}</dd>
              </div>
            </div>
            {voucher.patient_confirmation_pin && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 uppercase">Confirmation PIN: </span>
                <span className="font-mono font-bold text-sm">{voucher.patient_confirmation_pin}</span>
              </div>
            )}
          </div>

          {/* Beneficiary */}
          {voucher.beneficiary && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <User size={14} /> Beneficiary
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs">Name</span><p className="font-semibold">{voucher.beneficiary.full_name}</p></div>
                <div><span className="text-gray-400 text-xs">Health ID</span><p className="font-mono text-xs">{voucher.beneficiary.digital_health_id || '—'}</p></div>
                <div><span className="text-gray-400 text-xs">Phone</span><p>{voucher.beneficiary.phone}</p></div>
                <div><span className="text-gray-400 text-xs">Category</span><p>{voucher.beneficiary.category}</p></div>
              </div>
            </div>
          )}

          {/* ── No Claim Yet: Create One ── */}
          {!activeClaim && !cLoading && (
            <div className="card p-5">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <ClipboardCheck size={14} /> Create Medical Claim
              </h2>
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
                    <input className="input-field" placeholder="e.g. Consultation" value={itemName} onChange={(e) => setItemName(e.target.value)} />
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

                {pendingItems.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
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

                <button
                  onClick={() => createClaimMutation.mutate()}
                  disabled={!serviceDescription.trim() || pendingItems.length === 0 || createClaimMutation.isPending}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: '#1D75DB' }}
                >
                  {createClaimMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Create Claim ({pendingItems.length} service{pendingItems.length !== 1 ? 's' : ''})
                </button>
              </div>
            </div>
          )}

          {cLoading && (
            <div className="card p-5"><div className="h-40 bg-gray-100 rounded animate-pulse" /></div>
          )}

          {/* ── Existing Claim ── */}
          {activeClaim && (
            <>
              {/* Claim Header */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <ClipboardCheck size={14} /> Claim #{String(activeClaim.id).slice(-8)}
                  </h2>
                  <span className={`badge text-xs ${activeClaim.claim_status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                    {activeClaim.claim_status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{activeClaim.service_description}</p>
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                  <div>
                    <dt className="text-[10px] text-gray-400 uppercase">Budget</dt>
                    <dd className="text-sm font-bold" style={{ color: '#1D75DB' }}>{formatXAF(voucherAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-gray-400 uppercase">Claim Total</dt>
                    <dd className={`text-sm font-bold ${claimTotal > voucherAmount && voucherAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatXAF(claimTotal)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-gray-400 uppercase">Remaining</dt>
                    <dd className={`text-sm font-bold ${claimTotal > voucherAmount && voucherAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatXAF(voucherAmount - claimTotal)}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Claim Items */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                  Services / Items ({activeClaim.claim_items?.length || 0})
                </h3>

                {activeClaim.claim_items && activeClaim.claim_items.length > 0 && (
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                        <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Service</th>
                        <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeClaim.claim_items.map((item: any, idx: number) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="p-3 text-xs text-gray-400">{idx + 1}</td>
                          <td className="p-3 font-medium text-gray-800">{item.name}</td>
                          <td className="p-3 text-right font-semibold text-gray-900">{formatXAF(item.amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="p-3 font-bold text-gray-900 text-right">Total</td>
                        <td className={`p-3 text-right font-bold ${claimTotal > voucherAmount && voucherAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatXAF(claimTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {/* Add more items */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Add Another Service</h4>
                  <div className="space-y-3">
                    <select className="input-field" value={extraServiceId} onChange={(e) => {
                      setExtraServiceId(e.target.value);
                      const svc = services.find((s: any) => s.id === e.target.value);
                      if (svc) { setExtraItemName(svc.name); setExtraItemAmount(String(svc.price)); }
                    }}>
                      <option value="">— Hospital service or custom —</option>
                      {services.filter((s: any) => s.is_available).map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} — {formatXAF(s.price)}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input className="input-field" placeholder="Service name" value={extraItemName} onChange={(e) => setExtraItemName(e.target.value)} />
                      </div>
                      <div>
                        <input className="input-field" type="number" min="0" placeholder="Amount" value={extraItemAmount} onChange={(e) => setExtraItemAmount(e.target.value)} />
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
              {claimTotal > voucherAmount && voucherAmount > 0 && (
                <div className="card p-5 border-2 border-amber-300 bg-amber-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-800 text-sm mb-1">Over Budget</h4>
                      <p className="text-xs text-amber-700 mb-3">
                        Claim total ({formatXAF(claimTotal)}) exceeds voucher budget ({formatXAF(voucherAmount)}).
                      </p>
                      {!showTopUp ? (
                        <button onClick={() => { setShowTopUp(true); setTopUpAmount(String(claimTotal - voucherAmount)); }} className="text-xs font-bold text-amber-800 underline">Request Top-Up</button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-amber-600">Maximum top-up: {formatXAF(claimTotal - voucherAmount)}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="input-field" type="number" min="0" max={claimTotal - voucherAmount} placeholder="Amount" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
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

              {/* Proofs */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                  Document Proofs ({activeClaim.proofs?.length || 0})
                </h3>

                {activeClaim.proofs && activeClaim.proofs.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {activeClaim.proofs.map((p: any) => (
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
                    <select className="input-field" value={proofType} onChange={(e) => setProofType(e.target.value)}>
                      {['BILL', 'PRESCRIPTION', 'LAB_RESULT', 'DISCHARGE', 'IMAGING', 'OTHER'].map((t) => (
                        <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
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

              {/* Complete Button */}
              <div className="flex gap-3">
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
              {!hasProofs && (
                <p className="text-xs text-gray-400 text-center -mt-2">Upload at least one document proof before completing.</p>
              )}
            </>
          )}
        </div>

        {/* ── Right: Activity Timeline ── */}
        <div className="space-y-4">
          {voucher.events && voucher.events.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Activity size={14} /> Activity
              </h3>
              <div className="space-y-0">
                {[...(voucher.events || [])].reverse().map((event: any, i: number, arr: any[]) => (
                  <div key={event.id || i} className="flex gap-3 pb-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: '#1D75DB' }} />
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800">{event.status?.replace(/_/g, ' ')}</p>
                      {event.notes && <p className="text-xs text-gray-500 mt-0.5">{event.notes}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(event.changed_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/dashboard/receptionist/process')}
                className="w-full text-left p-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Process New Voucher
              </button>
              <button
                onClick={() => router.push('/dashboard/receptionist/claims')}
                className="w-full text-left p-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Claims
              </button>
              <button
                onClick={() => router.push('/dashboard/receptionist/vouchers')}
                className="w-full text-left p-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                All Vouchers
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
