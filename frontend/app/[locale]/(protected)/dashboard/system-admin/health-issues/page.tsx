'use client';
import { useI18n } from '@/locales/client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUrlSearchParams } from '@/hooks/use-url-search-params';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Ticket,
  ExternalLink,
  X,
  AlertTriangle,
} from 'lucide-react';
import { listHealthIssues, verifyHealthIssue, rejectHealthIssue } from '@/actions/beneficiaries';
import { listBeneficiaries } from '@/actions/beneficiaries';
import { listHospitals } from '@/actions/hospital';
import { listCampaigns } from '@/actions/campaigns';
import { createVouchersFromCampaigns } from '@/actions/vouchers';
import { formatDate, formatXAF, statusColor } from '@/lib/utils';
import Paginator from '@/components/shared/Paginator';

const STATUS_FILTERS = ['all', 'REPORTED', 'VALIDATED', 'REJECTED', 'RESOLVED'];
const PAGE_SIZE = 15;

type AllocationMode = 'amount' | 'percentage';

export default function HealthIssuesPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();

  const [params, setParams] = useUrlSearchParams({ search: "", filter: "all", page: 1 }, { page: Number });
  const search = (params.search as string) || "";
  const filter = (params.filter as string) || "all";
  const currentPage = Number(params.page) || 1;
  const setPage = (p: number) => setParams({ page: p });
  const nextPage = () => setPage(currentPage + 1);
  const prevPage = () => setPage(Math.max(1, currentPage - 1));
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Voucher creation state
  const [showVoucherCreate, setShowVoucherCreate] = useState(false);
  const [voucherStep, setVoucherStep] = useState(1);
  const [voucherHiId, setVoucherHiId] = useState<number | null>(null);
  const [voucherHospitalId, setVoucherHospitalId] = useState('');
  const [voucherAmount, setVoucherAmount] = useState('');
  const [voucherAllocations, setVoucherAllocations] = useState<{ campaign_id: string; mode: AllocationMode; value: string }[]>([]);
  const [voucherError, setVoucherError] = useState('');

  const { data: healthIssuesData, isLoading } = useQuery({
    queryKey: ['admin-health-issues', token, currentPage, search, filter],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
      };
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      return await listHealthIssues(token!, params);
    },
    enabled: !!token,
  });

  const healthIssues: HealthIssue[] = healthIssuesData?.results || [];
  const totalCount = healthIssuesData?.count || 0;
  const hasNextPage = !!healthIssuesData?.next;
  const hasPrevPage = !!healthIssuesData?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Fetch beneficiaries for name resolution
  const { data: beneficiariesData } = useQuery({
    queryKey: ['admin-beneficiaries-list', token],
    queryFn: async () => await listBeneficiaries(token!, { page_size: '1000' }),
    enabled: !!token,
  });
  const beneficiaryMap = new Map<string, string>();
  (beneficiariesData?.results || []).forEach((b: Beneficiary) => {
    beneficiaryMap.set(b.id, b.full_name);
  });

  // Voucher creation queries
  const { data: hospitalsData } = useQuery({
    queryKey: ['hospitals-picker', token],
    queryFn: async () => await listHospitals(token!, { page_size: '1000' }),
    enabled: !!token && showVoucherCreate,
  });
  const hospitals: Hospital[] = hospitalsData?.results || [];

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns-picker', token],
    queryFn: async () => await listCampaigns({ page_size: 1000 }),
    enabled: !!token && showVoucherCreate,
  });
  const campaigns: CampaignList[] = campaignsData?.results || [];

  const numericVoucherAmount = Number(voucherAmount) || 0;
  const totalAllocated = voucherAllocations.reduce((sum, a) => {
    const v = Number(a.value) || 0;
    return sum + (a.mode === 'percentage' ? (numericVoucherAmount * v) / 100 : v);
  }, 0);
  const totalPercentage = voucherAllocations.reduce((sum, a) => a.mode === 'percentage' ? sum + (Number(a.value) || 0) : sum, 0);
  const selectedVoucherCampaignIds = new Set(voucherAllocations.map(a => a.campaign_id));

  const verifyMutation = useMutation({
    mutationFn: (hiId: number) => verifyHealthIssue(String(hiId), token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-health-issues'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectHealthIssue(String(rejectId), token, rejectReason),
    onSuccess: () => {
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-health-issues'] });
    },
  });

  const createVoucherMutation = useMutation({
    mutationFn: () => {
      const valid = voucherAllocations.filter(a => a.campaign_id && Number(a.value) > 0);
      return createVouchersFromCampaigns(token!, {
        health_issue_id: String(voucherHiId),
        hospital_id: voucherHospitalId,
        total_amount: numericVoucherAmount,
        campaign_allocations: valid.map(a =>
          a.mode === 'percentage'
            ? { campaign_id: a.campaign_id, percentage: Number(a.value) }
            : { campaign_id: a.campaign_id, amount: Number(a.value) }
        ),
      });
    },
    onSuccess: () => {
      setShowVoucherCreate(false);
      setVoucherStep(1);
      setVoucherHiId(null);
      setVoucherHospitalId('');
      setVoucherAmount('');
      setVoucherAllocations([]);
      setVoucherError('');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  const openVoucherCreate = (hiId: number) => {
    setVoucherHiId(hiId);
    setShowVoucherCreate(true);
    setVoucherStep(1);
    setVoucherError('');
  };

  const severityColor = (s: string) => {
    switch (s) {
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const hiStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED': return 'bg-red-100 text-red-600';
      case 'RESOLVED': return 'bg-blue-100 text-blue-700';
      case 'REPORTED': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Health Issues</h1>
          <p className="text-gray-500 text-sm">{totalCount} total issues</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-10"
            placeholder="Search by description or beneficiary..."
            value={search}
            onChange={e => { setParams({ search: e.target.value, page: 1 }); }}
          />
        </div>
        <select
          className="input-field w-auto"
          value={filter}
          onChange={e => { setParams({ filter: e.target.value, page: 1 }); }}
        >
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : s}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Beneficiary', 'Category', 'Severity', 'Status', 'Description', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : healthIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                    No health issues found
                  </td>
                </tr>
              ) : (
                healthIssues.map(hi => (
                  <tr key={hi.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <Link
                        href={`/dashboard/system-admin/beneficiaries/${hi.beneficiary}`}
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {beneficiaryMap.get(hi.beneficiary) || hi.beneficiary.slice(0, 8)}
                        <ExternalLink size={11} className="text-gray-400" />
                      </Link>
                    </td>
                    <td className="p-4 text-xs font-medium text-gray-700">{hi.category}</td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${severityColor(hi.severity)}`}>{hi.severity}</span>
                    </td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${hiStatusColor(hi.status)}`}>{hi.status}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-600 max-w-[200px] truncate">{hi.description}</td>
                    <td className="p-4 text-xs text-gray-400">{hi.created_at ? formatDate(hi.created_at) : '—'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {hi.status === 'REPORTED' && (
                          <>
                            <button
                              onClick={() => verifyMutation.mutate(hi.id!)}
                              disabled={verifyMutation.isPending}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                              title="Validate"
                            >
                              <CheckCircle size={11} /> Validate
                            </button>
                            <button
                              onClick={() => { setRejectId(hi.id!); setRejectReason(''); }}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center gap-1"
                              title="Reject"
                            >
                              <XCircle size={11} /> Reject
                            </button>
                          </>
                        )}
                        {hi.status === 'VALIDATED' && (
                          <button
                            onClick={() => openVoucherCreate(hi.id!)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg text-white hover:opacity-90 transition-colors flex items-center gap-1"
                            style={{ background: '#471DDB' }}
                            title="Create Voucher"
                          >
                            <Ticket size={11} /> Voucher
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <Paginator currentPage={currentPage} totalPages={totalPages} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {/* Reject Modal */}
      {rejectId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Reject Health Issue</h2>
              <button onClick={() => { setRejectId(null); setRejectReason(''); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Rejection Reason *</label>
                <textarea className="input-field min-h-[100px]" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Explain why this health issue is being rejected..." required />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="btn-outline flex-1">Cancel</button>
                <button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#DC2626' }}>
                  {rejectMutation.isPending && <Loader2 size={16} className="animate-spin" />} Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Creation Modal */}
      {showVoucherCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Create Voucher</h2>
              <button onClick={() => setShowVoucherCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {[{ id: 1, label: 'Details' }, { id: 2, label: 'Campaigns' }, { id: 3, label: 'Allocate' }].map(step => (
                <div key={step.id} className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold ${voucherStep >= step.id ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 bg-gray-50'}`}
                  style={voucherStep >= step.id ? { background: '#471DDB' } : {}}>
                  Step {step.id}: {step.label}
                </div>
              ))}
            </div>

            {voucherStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Hospital *</label>
                  <select className="input-field" value={voucherHospitalId} onChange={e => setVoucherHospitalId(e.target.value)}>
                    <option value="">— Select hospital —</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Voucher Amount (XAF) *</label>
                  <input className="input-field" type="number" min={1} placeholder="e.g. 60000" value={voucherAmount} onChange={e => setVoucherAmount(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <button className="btn-outline flex-1" onClick={() => setShowVoucherCreate(false)}>Cancel</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#471DDB' }}
                    disabled={!voucherHiId || !voucherHospitalId || numericVoucherAmount <= 0}
                    onClick={() => setVoucherStep(2)}>Continue</button>
                </div>
              </div>
            )}

            {voucherStep === 2 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">
                  Target: <span className="font-bold">{formatXAF(numericVoucherAmount)}</span>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-2">
                  {campaigns.length === 0 ? (
                    <div className="text-xs text-gray-500 p-3">No campaigns available.</div>
                  ) : campaigns.map(campaign => (
                    <button key={campaign.id} type="button"
                      className={`w-full text-left border rounded-xl px-3 py-2 transition ${selectedVoucherCampaignIds.has(campaign.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => {
                        setVoucherAllocations(prev => {
                          const exists = prev.some(a => a.campaign_id === campaign.id);
                          if (exists) return prev.filter(a => a.campaign_id !== campaign.id);
                          return [...prev, { campaign_id: campaign.id, mode: 'amount' as const, value: '' }];
                        });
                      }}>
                      <div className="text-sm font-semibold text-gray-900">{campaign.title}</div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  <button className="btn-outline flex-1" onClick={() => setVoucherStep(1)}>Back</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#471DDB' }}
                    disabled={voucherAllocations.length === 0}
                    onClick={() => setVoucherStep(3)}>Continue</button>
                </div>
              </div>
            )}

            {voucherStep === 3 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  Allocate funds from selected campaigns.
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {voucherAllocations.map(allocation => {
                    const campaign = campaigns.find(c => c.id === allocation.campaign_id);
                    return (
                      <div key={allocation.campaign_id} className="border border-gray-200 rounded-xl p-3">
                        <div className="text-sm font-semibold text-gray-900">{campaign?.title}</div>
                        <div className="flex gap-2">
                          <select className="input-field w-40" value={allocation.mode}
                            onChange={e => setVoucherAllocations(prev => prev.map(a => a.campaign_id === allocation.campaign_id ? { ...a, mode: e.target.value as AllocationMode, value: '' } : a))}>
                            <option value="amount">Amount (XAF)</option>
                            <option value="percentage">Percentage (%)</option>
                          </select>
                          <input className="input-field flex-1" type="number" min={1} max={allocation.mode === 'percentage' ? 100 : undefined}
                            placeholder={allocation.mode === 'percentage' ? 'e.g. 35' : 'e.g. 20000'}
                            value={allocation.value}
                            onChange={e => setVoucherAllocations(prev => prev.map(a => a.campaign_id === allocation.campaign_id ? { ...a, value: e.target.value } : a))} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-xl border border-gray-200 p-3 text-xs space-y-1">
                  <div>Requested: <span className="font-bold">{formatXAF(numericVoucherAmount)}</span></div>
                  <div>Allocated: <span className="font-bold">{formatXAF(Math.floor(totalAllocated))}</span></div>
                  <div>Percentage: <span className="font-bold">{totalPercentage.toFixed(2)}%</span></div>
                </div>
                {voucherError && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{voucherError}</div>}
                <div className="flex gap-3 mt-2">
                  <button className="btn-outline flex-1" onClick={() => setVoucherStep(2)}>Back</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#471DDB' }}
                    onClick={() => {
                      setVoucherError('');
                      if (voucherAllocations.length === 0) { setVoucherError('Select at least one campaign.'); return; }
                      if (voucherAllocations.some(a => Number(a.value) <= 0)) { setVoucherError('Every campaign needs a valid amount.'); return; }
                      if (totalPercentage > 100) { setVoucherError('Total percentage cannot exceed 100%.'); return; }
                      createVoucherMutation.mutate();
                    }}
                    disabled={createVoucherMutation.isPending}>
                    {createVoucherMutation.isPending ? 'Creating...' : 'Create Voucher'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
