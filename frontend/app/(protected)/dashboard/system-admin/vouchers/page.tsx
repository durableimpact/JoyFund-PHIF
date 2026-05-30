'use client';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';



import { formatXAF, statusColor, formatDate } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listVouchers, createVoucher, createVouchersFromCampaigns } from '@/actions/vouchers';
import { listHealthIssues } from '@/actions/beneficiaries';
import { listHospitals } from '@/actions/hospital';
import { listCampaigns } from '@/actions/campaigns';

const STATUS_FILTERS = ['all','AVAILABLE','ACTIVE','PENDING_CONFIRMATION','USED','EXPIRED'];
const PAGE_SIZE = 10;

type CreateMode = 'single' | 'multi';

interface Allocation {
  campaign_id: string;
  amount: string;
}

export default function AdminVouchers() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [mode, setMode] = useState<CreateMode>('single');
  const [currentPage, setCurrentPage] = useState(1);

  const [healthIssueId, setHealthIssueId] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [amount, setAmount] = useState('');

  const [multiHealthIssueId, setMultiHealthIssueId] = useState('');
  const [multiHospitalId, setMultiHospitalId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [allocations, setAllocations] = useState<Allocation[]>([{ campaign_id: '', amount: '' }]);

  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ['vouchers', token, currentPage, search, filter],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        page_size: PAGE_SIZE.toString(),
      };
      if (search) params.search = search;
      if (filter !== 'all') params.status = filter;
      return await listVouchers(token, params);
    },
    enabled: !!token,
  });

  const vouchers: VoucherList[] = vouchersData?.results || [];
  const totalCount = vouchersData?.count || 0;
  const hasNextPage = !!vouchersData?.next;
  const hasPreviousPage = !!vouchersData?.previous;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const { data: healthIssuesData } = useQuery({
    queryKey: ['healthIssues', token],
    queryFn: async () => await listHealthIssues(token, { page_size: '1000' }),
    enabled: !!token,
  });

  const healthIssues: HealthIssue[] = healthIssuesData?.results || [];
  const validatedHealthIssues = healthIssues.filter((h) => h.status === 'VALIDATED');

  const { data: hospitalsData } = useQuery({
    queryKey: ['hospitals', token],
    queryFn: async () => await listHospitals(token, { page_size: '1000' }),
    enabled: !!token,
  });

  const hospitals: Hospital[] = hospitalsData?.results || [];

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns', token],
    queryFn: async () => await listCampaigns({ page_size: '1000' }),
  });

  const campaigns: Campaign[] = campaignsData?.results || [];

  const createSingleMutation = useMutation({
    mutationFn: () => createVoucher(token, { health_issue_id: healthIssueId, hospital_id: hospitalId, campaign_id: campaignId, amount: Number(amount) }),
    onSuccess: () => {
      setShowCreate(false); setHealthIssueId(''); setHospitalId(''); setCampaignId(''); setAmount('');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  const createMultiMutation = useMutation({
    mutationFn: () => {
      const valid = allocations.filter((a) => a.campaign_id && Number(a.amount) > 0);
      return createVouchersFromCampaigns(token, {
        health_issue_id: multiHealthIssueId,
        hospital_id: multiHospitalId,
        total_amount: Number(totalAmount),
        campaign_allocations: valid.map((a) => ({ campaign_id: a.campaign_id, amount: Number(a.amount) })),
      });
    },
    onSuccess: () => {
      setShowCreate(false); setMultiHealthIssueId(''); setMultiHospitalId(''); setTotalAmount('');
      setAllocations([{ campaign_id: '', amount: '' }]);
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Voucher Management</h1>
          <p className="text-gray-500 text-sm">{totalCount} total vouchers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Plus size={16} /> Create Voucher
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-10" placeholder="Search by code or beneficiary..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <select className="input-field w-auto" value={filter} onChange={e => { setFilter(e.target.value); setCurrentPage(1); }}>
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Code','Beneficiary','Hospital','Status','Expiry','Created'].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : vouchers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">No vouchers found</td></tr>
              ) : vouchers.map((v) => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4"><Link href={`/dashboard/system-admin/vouchers/${v.id}`} className="font-mono text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline">{v.voucher_code}</Link></td>
                  <td className="p-4 text-gray-700 text-xs">{v.beneficiary_name || '—'}</td>
                  <td className="p-4 text-gray-600 text-xs">{v.hospital_name || '—'}</td>
                  <td className="p-4"><span className={`badge ${statusColor(v.status)}`}>{v.status?.replace(/_/g, ' ')}</span></td>
                  <td className="p-4 text-gray-400 text-xs">{v.expiry_date ? formatDate(v.expiry_date) : '—'}</td>
                  <td className="p-4 text-gray-400 text-xs">{v.created_at ? formatDate(v.created_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-600">
              Showing <span className="font-semibold">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-semibold">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of <span className="font-semibold">{totalCount}</span> results
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={!hasPreviousPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={16} className="text-gray-600" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        isCurrentPage
                          ? 'text-white'
                          : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                      style={isCurrentPage ? { background: '#471DDB' } : {}}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNextPage}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Create Voucher</h2>
              <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="flex gap-2 mb-5">
              <button onClick={() => setMode('single')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${mode === 'single' ? 'text-white' : 'border-gray-200 text-gray-600'}`} style={mode === 'single' ? { background: '#471DDB', borderColor: '#471DDB' } : {}}>Single Campaign</button>
              <button onClick={() => setMode('multi')} className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${mode === 'multi' ? 'text-white' : 'border-gray-200 text-gray-600'}`} style={mode === 'multi' ? { background: '#471DDB', borderColor: '#471DDB' } : {}}>Multiple Campaigns</button>
            </div>

            {validatedHealthIssues.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">No VALIDATED health issues found. Health issues must be verified before creating a voucher.</div>
            )}

            {mode === 'single' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Health Issue (VALIDATED) *</label>
                  <select className="input-field" value={healthIssueId} onChange={e => setHealthIssueId(e.target.value)}>
                    <option value="">— Select health issue —</option>
                    {validatedHealthIssues.map((h) => <option key={h.id} value={h.id}>{h.description} · {h.beneficiary_id?.slice(-6)}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Hospital *</label>
                  <select className="input-field" value={hospitalId} onChange={e => setHospitalId(e.target.value)}>
                    <option value="">— Select hospital —</option>
                    {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Funding Campaign *</label>
                  <select className="input-field" value={campaignId} onChange={e => setCampaignId(e.target.value)}>
                    <option value="">— Select campaign —</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title} · Balance: {formatXAF(c.available_balance)}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (XAF) *</label>
                  <input className="input-field" type="number" min={1} placeholder="e.g. 60000" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#471DDB' }} onClick={() => createSingleMutation.mutate()} disabled={createSingleMutation.isPending}>
                    {createSingleMutation.isPending ? 'Creating…' : 'Create Voucher'}
                  </button>
                </div>
              </div>
            )}

            {mode === 'multi' && (
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Health Issue (VALIDATED) *</label>
                  <select className="input-field" value={multiHealthIssueId} onChange={e => setMultiHealthIssueId(e.target.value)}>
                    <option value="">— Select health issue —</option>
                    {validatedHealthIssues.map((h) => <option key={h.id} value={h.id}>{h.description} · {h.beneficiary_id?.slice(-6)}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Hospital *</label>
                  <select className="input-field" value={multiHospitalId} onChange={e => setMultiHospitalId(e.target.value)}>
                    <option value="">— Select hospital —</option>
                    {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.city}</option>)}
                  </select>
                </div>
                <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Total Amount (XAF) *</label>
                  <input className="input-field" type="number" min={1} placeholder="e.g. 120000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500">Campaign Allocations *</label>
                    <button onClick={() => setAllocations(prev => [...prev, { campaign_id: '', amount: '' }])} className="text-xs font-semibold" style={{ color: '#471DDB' }}>+ Add Campaign</button>
                  </div>
                  {allocations.map((a, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <select className="input-field flex-1 text-sm" value={a.campaign_id} onChange={e => setAllocations(prev => prev.map((x, idx) => idx === i ? { ...x, campaign_id: e.target.value } : x))}>
                        <option value="">— Campaign —</option>
                        {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      <input className="input-field w-28 text-sm shrink-0" type="number" placeholder="XAF" value={a.amount} onChange={e => setAllocations(prev => prev.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))} />
                      {allocations.length > 1 && <button onClick={() => setAllocations(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-2">
                  <button className="btn-outline flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#471DDB' }} onClick={() => createMultiMutation.mutate()} disabled={createMultiMutation.isPending}>
                    {createMultiMutation.isPending ? 'Creating…' : 'Create Voucher'}
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
