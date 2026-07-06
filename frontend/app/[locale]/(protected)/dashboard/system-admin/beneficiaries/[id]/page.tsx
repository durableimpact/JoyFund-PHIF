'use client';
import { useI18n } from '@/locales/client';
import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Pencil,
  Plus,
  Ticket,
  Upload,
  User,
  X,
  ExternalLink,
} from 'lucide-react';
import { getBeneficiary, listHealthIssues, listBeneficiaryDocuments, createHealthIssue, createBeneficiaryDocument, updateBeneficiary, verifyBeneficiary, verifyHealthIssue, rejectHealthIssue } from '@/actions/beneficiaries';
import { listVouchers, createVouchersFromCampaigns } from '@/actions/vouchers';
import { listHospitals } from '@/actions/hospital';
import { listCampaigns } from '@/actions/campaigns';
import { formatXAF, formatDate, formatDateTime, statusColor } from '@/lib/utils';

const SUB_PAGE_SIZE = 5;

export default function AdminBeneficiaryDetailPage() {
  const t = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const queryClient = useQueryClient();

  const [hiPage, setHiPage] = useState(1);
  const [docPage, setDocPage] = useState(1);
  const [showHiForm, setShowHiForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<BeneficiaryDocument | null>(null);
  const [rejectHiId, setRejectHiId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [hiCategory, setHiCategory] = useState('');
  const [hiSeverity, setHiSeverity] = useState('');
  const [hiDescription, setHiDescription] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  // Voucher creation state
  const [showVoucherCreate, setShowVoucherCreate] = useState(false);
  const [voucherStep, setVoucherStep] = useState(1);
  const [voucherHealthIssueId, setVoucherHealthIssueId] = useState('');
  const [voucherHospitalId, setVoucherHospitalId] = useState('');
  const [voucherAmount, setVoucherAmount] = useState('');
  const [voucherAllocations, setVoucherAllocations] = useState<{ campaign_id: string; mode: 'amount' | 'percentage'; value: string }[]>([]);
  const [voucherError, setVoucherError] = useState('');

  const { data: beneficiary, isLoading } = useQuery({
    queryKey: ['beneficiary', id, token],
    queryFn: () => getBeneficiary(id, token),
    enabled: !!token && !!id,
  });

  const { data: healthIssuesData } = useQuery({
    queryKey: ['beneficiary-health-issues', id, token, hiPage],
    queryFn: async () => {
      const res = await listHealthIssues(token, { beneficiary: id, page: String(hiPage), page_size: String(SUB_PAGE_SIZE) });
      return (res as any)?.json || res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && !!id,
  });

  const { data: documentsData } = useQuery({
    queryKey: ['beneficiary-documents', id, token, docPage],
    queryFn: async () => {
      const res = await listBeneficiaryDocuments(id, token, { page: String(docPage), page_size: String(SUB_PAGE_SIZE) });
      return (res as any)?.json || res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && !!id,
  });

  const { data: vouchersData } = useQuery({
    queryKey: ['beneficiary-vouchers', id, token],
    queryFn: async () => {
      const res = await listVouchers(token, { beneficiary: id });
      return (res as any)?.json || res || { results: [], count: 0 };
    },
    enabled: !!token && !!id,
  });

  const healthIssues: HealthIssue[] = healthIssuesData?.results || [];
  const hiCount = healthIssuesData?.count || 0;
  const hiHasNext = !!healthIssuesData?.next;
  const hiHasPrev = !!healthIssuesData?.previous;

  const documents: BeneficiaryDocument[] = documentsData?.results || [];
  const docCount = documentsData?.count || 0;
  const docHasNext = !!documentsData?.next;
  const docHasPrev = !!documentsData?.previous;

  const vouchers: VoucherList[] = vouchersData?.results || [];
  const voucherCount = vouchersData?.count || 0;

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

  const createVoucherMutation = useMutation({
    mutationFn: () => {
      const total = Number(voucherAmount);
      const valid = voucherAllocations.filter(a => a.campaign_id && Number(a.value) > 0);
      return createVouchersFromCampaigns(token!, {
        health_issue_id: voucherHealthIssueId,
        hospital_id: voucherHospitalId,
        total_amount: total,
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
      setVoucherHealthIssueId('');
      setVoucherHospitalId('');
      setVoucherAmount('');
      setVoucherAllocations([]);
      setVoucherError('');
      queryClient.invalidateQueries({ queryKey: ['beneficiary-vouchers', id] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });

  const numericVoucherAmount = Number(voucherAmount) || 0;
  const validatedHiForVoucher = healthIssues.filter(hi => hi.status === 'VALIDATED');
  const totalAllocated = voucherAllocations.reduce((sum, a) => {
    const v = Number(a.value) || 0;
    return sum + (a.mode === 'percentage' ? (numericVoucherAmount * v) / 100 : v);
  }, 0);
  const totalPercentage = voucherAllocations.reduce((sum, a) => a.mode === 'percentage' ? sum + (Number(a.value) || 0) : sum, 0);
  const selectedVoucherCampaignIds = new Set(voucherAllocations.map(a => a.campaign_id));

  const openVoucherCreate = (preselectedHiId?: string) => {
    setShowVoucherCreate(true);
    setVoucherStep(1);
    setVoucherError('');
    if (preselectedHiId) setVoucherHealthIssueId(String(preselectedHiId));
  };

  const createHiMutation = useMutation({
    mutationFn: () => createHealthIssue(token, { beneficiary_id: id, category: hiCategory, severity: hiSeverity, description: hiDescription }),
    onSuccess: () => {
      setShowHiForm(false); setHiCategory(''); setHiSeverity(''); setHiDescription('');
      queryClient.invalidateQueries({ queryKey: ['beneficiary-health-issues', id] });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('document', docFile!);
      if (docDescription) fd.append('description', docDescription);
      return createBeneficiaryDocument(token, id, fd);
    },
    onSuccess: () => {
      setShowDocUpload(false); setDocFile(null); setDocDescription('');
      queryClient.invalidateQueries({ queryKey: ['beneficiary-documents', id] });
    },
  });

  const editMutation = useMutation({
    mutationFn: (fd: FormData) => updateBeneficiary(id, token, fd),
    onSuccess: () => {
      setShowEdit(false);
      queryClient.invalidateQueries({ queryKey: ['beneficiary', id] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyBeneficiary(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary', id] });
    },
  });

  const verifyHiMutation = useMutation({
    mutationFn: (hiId: number) => verifyHealthIssue(hiId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiary-health-issues', id] });
    },
  });

  const rejectHiMutation = useMutation({
    mutationFn: (hiId: number) => rejectHealthIssue(hiId, token, rejectReason),
    onSuccess: () => {
      setRejectHiId(null); setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['beneficiary-health-issues', id] });
    },
  });

  if (isLoading) {
    return (<><div className="space-y-4"><div className="h-8 bg-gray-100 rounded w-48 animate-pulse" /><div className="h-64 bg-gray-50 rounded-xl animate-pulse" /></div></>);
  }

  if (!beneficiary) {
    return (<div className="text-center py-16 text-gray-400">{t('systemAdmin.beneficiaries.detail.notFound')}</div>);
  }

  return (<>
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> {t('systemAdmin.beneficiaries.detail.backToList')}
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{beneficiary.full_name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {beneficiary.digital_health_id && <span className="font-mono mr-3">{beneficiary.digital_health_id}</span>}
            <span className={`badge text-xs ${beneficiary.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {beneficiary.is_verified ? t('systemAdmin.beneficiaries.detail.verified') : t('systemAdmin.beneficiaries.detail.pendingVerification')}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!beneficiary.is_verified && (
            <button onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}
              className="btn-admin text-sm flex items-center gap-2" style={{ background: '#059669' }}>
              {verifyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null} {t('systemAdmin.beneficiaries.detail.verify')}
            </button>
          )}
          <button onClick={() => setShowEdit(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
            <Pencil size={16} /> {t('systemAdmin.beneficiaries.detail.edit')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={14} /> {t('systemAdmin.beneficiaries.detail.personalInfo')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Full Name" value={beneficiary.full_name} />
              <Detail label="Gender" value={beneficiary.gender} />
              <Detail label="Category" value={beneficiary.category} />
              <Detail label="Date of Birth" value={formatDate(beneficiary.date_of_birth)} />
              <Detail label="National ID" value={beneficiary.national_id_number} mono />
              <Detail label="Phone" value={beneficiary.phone} />
              {beneficiary.email && <Detail label="Email" value={beneficiary.email} />}
              {beneficiary.number_of_previous_births != null && <Detail label="Previous Births" value={String(beneficiary.number_of_previous_births)} />}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <MapPin size={14} /> {t('systemAdmin.beneficiaries.detail.location')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Region" value={beneficiary.region} />
              <Detail label="City" value={beneficiary.city} />
              <Detail label="Address" value={beneficiary.address} className="col-span-2" />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Phone size={14} /> {t('systemAdmin.beneficiaries.detail.emergencyContact')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Name" value={beneficiary.emergency_contact_name || '—'} />
              <Detail label="Phone" value={beneficiary.emergency_contact_phone || '—'} />
              <Detail label="Relationship" value={beneficiary.emergency_contact_relationship || '—'} />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Heart size={14} /> {t('systemAdmin.beneficiaries.detail.healthIssues')} ({hiCount})
              </h2>
              <button onClick={() => setShowHiForm(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#471DDB' }}>
                <Plus size={14} /> {t('systemAdmin.beneficiaries.detail.addIssue')}
              </button>
            </div>
            {healthIssues.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">{t('systemAdmin.beneficiaries.detail.noHealthIssues')}</p>
            ) : (<>
              <div className="space-y-3">
                {healthIssues.map((hi) => (
                  <div key={hi.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">{hi.category}</span>
                      <span className={`badge text-[10px] ${
                        hi.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-700' :
                        hi.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                        hi.status === 'RESOLVED' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{hi.status}</span>
                    </div>
                    <p className="text-xs text-gray-600">{hi.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                      <span>{t('systemAdmin.beneficiaries.detail.severity')}: {hi.severity}</span>
                      {hi.created_at && <span>{formatDate(hi.created_at)}</span>}
                    </div>
                    {hi.status === 'REPORTED' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                        <button onClick={() => verifyHiMutation.mutate(hi.id)} disabled={verifyHiMutation.isPending}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1">
                          {verifyHiMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : null} {t('systemAdmin.beneficiaries.detail.validate')}
                        </button>
                        <button onClick={() => { setRejectHiId(hi.id); setRejectReason(''); }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                          {t('systemAdmin.beneficiaries.detail.reject')}
                        </button>
                      </div>
                    )}
                    {hi.status === 'VALIDATED' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                        <button onClick={() => openVoucherCreate(String(hi.id))}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white hover:opacity-90 transition-colors flex items-center gap-1" style={{ background: '#471DDB' }}>
                          <Ticket size={10} /> {t('systemAdmin.beneficiaries.detail.createVoucher')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {hiCount > SUB_PAGE_SIZE && <MiniPagination page={hiPage} setPage={setHiPage} hasPrev={hiHasPrev} hasNext={hiHasNext} />}
            </>)}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <FileText size={14} /> {t('systemAdmin.beneficiaries.detail.documents')} ({docCount})
              </h2>
              <button onClick={() => setShowDocUpload(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#471DDB' }}>
                <Upload size={14} /> {t('systemAdmin.beneficiaries.detail.upload')}
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">{t('systemAdmin.beneficiaries.detail.noDocuments')}</p>
            ) : (<>
              <div className="space-y-2">
                {documents.map((doc) => {
                  const docUrl = typeof doc.document === 'string' ? doc.document : (doc.document?.url || doc.document?.file || '');
                  const isImage = docUrl && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(docUrl);
                  const fullUrl = docUrl.startsWith('http') ? docUrl : `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}${docUrl}`;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <button onClick={() => setPreviewDoc(doc)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        {isImage ? (
                          <Image src={fullUrl} alt="" width={40} height={40} className="rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                            <FileText size={18} className="text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{doc.description || t('systemAdmin.beneficiaries.detail.document')}</p>
                          {doc.uploaded_at && <p className="text-[10px] text-gray-400">{formatDate(doc.uploaded_at)}</p>}
                        </div>
                      </button>
                      {docUrl && (
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" download className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors shrink-0" title={t('systemAdmin.beneficiaries.detail.download')}>
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
              {docCount > SUB_PAGE_SIZE && <MiniPagination page={docPage} setPage={setDocPage} hasPrev={docHasPrev} hasNext={docHasNext} />}
            </>)}
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Ticket size={14} /> {t('systemAdmin.beneficiaries.detail.vouchers')} ({voucherCount})
              </h2>
              <button onClick={() => openVoucherCreate()} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#471DDB' }}>
                <Plus size={14} /> {t('systemAdmin.beneficiaries.detail.createVoucherBtn')}
              </button>
            </div>
            {vouchers.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">{t('systemAdmin.beneficiaries.detail.noVouchers')}</p>
            ) : (
              <div className="space-y-2">
                {vouchers.map((v) => (
                  <a key={v.id} href={`/dashboard/system-admin/vouchers/${v.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-bold text-gray-900">{v.voucher_code}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {v.hospital_name && <span className="text-[10px] text-gray-400">{v.hospital_name}</span>}
                        {v.expiry_date && <span className="text-[10px] text-gray-400">{t('systemAdmin.beneficiaries.detail.expiry')}: {formatDate(v.expiry_date)}</span>}
                      </div>
                    </div>
                    <span className={`badge text-[10px] ${statusColor(v.status)}`}>{v.status?.replace(/_/g, ' ')}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Calendar size={14} /> {t('systemAdmin.beneficiaries.detail.enrollmentInfo')}
            </h2>
            <div className="space-y-3">
              <Detail label={t('systemAdmin.beneficiaries.detail.status')} value={beneficiary.is_active ? t('systemAdmin.beneficiaries.detail.active') : t('systemAdmin.beneficiaries.detail.inactive')} />
              <Detail label={t('systemAdmin.beneficiaries.detail.created')} value={beneficiary.created_at ? formatDateTime(beneficiary.created_at) : '—'} />
              <Detail label={t('systemAdmin.beneficiaries.detail.updated')} value={beneficiary.updated_at ? formatDateTime(beneficiary.updated_at) : '—'} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">{t('systemAdmin.beneficiaries.detail.summary')}</h2>
            <div className="space-y-3">
              {[
                { label: t('systemAdmin.beneficiaries.detail.summaryHealthIssues'), value: hiCount },
                { label: t('systemAdmin.beneficiaries.detail.summaryDocuments'), value: docCount },
                { label: t('systemAdmin.beneficiaries.detail.summaryVouchers'), value: voucherCount },
                { label: t('systemAdmin.beneficiaries.detail.summaryVerified'), value: beneficiary.is_verified ? t('systemAdmin.beneficiaries.detail.yes') : t('systemAdmin.beneficiaries.detail.no') },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-bold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showHiForm && <Modal title={t('systemAdmin.beneficiaries.detail.addHealthIssueModal')} onClose={() => setShowHiForm(false)}>
        <div className="space-y-4">
          <SelectField label={t('systemAdmin.beneficiaries.detail.categoryField')} value={hiCategory} onChange={setHiCategory} options={[
            { value: '', label: t('systemAdmin.beneficiaries.detail.selectDefault') }, { value: 'MATERNAL', label: t('systemAdmin.beneficiaries.detail.maternal') }, { value: 'EMERGENCY', label: t('systemAdmin.beneficiaries.detail.emergency') },
            { value: 'CHRONIC', label: t('systemAdmin.beneficiaries.detail.chronic') }, { value: 'MENTAL_HEALTH', label: t('systemAdmin.beneficiaries.detail.mentalHealth') },
            { value: 'INFECTIOUS', label: t('systemAdmin.beneficiaries.detail.infectious') }, { value: 'ELDERLY', label: t('systemAdmin.beneficiaries.detail.elderly') }, { value: 'OTHER', label: t('systemAdmin.beneficiaries.detail.other') },
          ]} />
          <SelectField label={t('systemAdmin.beneficiaries.detail.severityField')} value={hiSeverity} onChange={setHiSeverity} options={[
            { value: '', label: t('systemAdmin.beneficiaries.detail.selectDefault') }, { value: 'LOW', label: t('systemAdmin.beneficiaries.detail.low') }, { value: 'MEDIUM', label: t('systemAdmin.beneficiaries.detail.medium') },
            { value: 'HIGH', label: t('systemAdmin.beneficiaries.detail.high') }, { value: 'CRITICAL', label: t('systemAdmin.beneficiaries.detail.critical') },
          ]} />
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{t('systemAdmin.beneficiaries.detail.descriptionField')}</label>
            <textarea className="input-field min-h-[80px]" value={hiDescription} onChange={e => setHiDescription(e.target.value)} placeholder={t('systemAdmin.beneficiaries.detail.describeHealthIssue')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowHiForm(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={() => createHiMutation.mutate()} disabled={createHiMutation.isPending || !hiCategory || !hiSeverity || !hiDescription}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#471DDB' }}>
              {createHiMutation.isPending && <Loader2 size={16} className="animate-spin" />} Submit
            </button>
          </div>
        </div>
      </Modal>}

      {previewDoc && (
        <Modal title={previewDoc.description || 'Document Preview'} onClose={() => setPreviewDoc(null)}>
          <DocPreview doc={previewDoc} />
        </Modal>
      )}

      {showDocUpload && <Modal title="Upload Document" onClose={() => setShowDocUpload(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">File *</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setDocFile(e.target.files?.[0] || null)} className="text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <input className="input-field" value={docDescription} onChange={e => setDocDescription(e.target.value)} placeholder="e.g. National ID photo" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowDocUpload(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={() => uploadDocMutation.mutate()} disabled={uploadDocMutation.isPending || !docFile}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#471DDB' }}>
              {uploadDocMutation.isPending && <Loader2 size={16} className="animate-spin" />} Upload
            </button>
          </div>
        </div>
      </Modal>}

      {showEdit && <EditBeneficiaryModal beneficiary={beneficiary} onClose={() => setShowEdit(false)} onSave={(fd) => editMutation.mutate(fd)} saving={editMutation.isPending} />}

      {rejectHiId !== null && (
        <Modal title="Reject Health Issue" onClose={() => { setRejectHiId(null); setRejectReason(''); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Rejection Reason *</label>
              <textarea className="input-field min-h-[100px]" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this health issue is being rejected..." required />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setRejectHiId(null); setRejectReason(''); }} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => rejectHiMutation.mutate(rejectHiId)} disabled={rejectHiMutation.isPending || !rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#DC2626' }}>
                {rejectHiMutation.isPending && <Loader2 size={16} className="animate-spin" />} Reject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showVoucherCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Create Voucher for {beneficiary.full_name}</h2>
              <button onClick={() => setShowVoucherCreate(false)}><X size={20} className="text-gray-400" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {[{ id: 1, label: 'Voucher Details' }, { id: 2, label: 'Find Campaigns' }, { id: 3, label: 'Allocate & Create' }].map(step => (
                <div key={step.id} className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold ${voucherStep >= step.id ? 'text-white border-transparent' : 'text-gray-500 border-gray-200 bg-gray-50'}`}
                  style={voucherStep >= step.id ? { background: '#471DDB' } : {}}>
                  Step {step.id}: {step.label}
                </div>
              ))}
            </div>

            {validatedHiForVoucher.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                No VALIDATED health issues found. Validate a health issue before creating a voucher.
              </div>
            )}

            {voucherStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Health Issue (VALIDATED) *</label>
                  <select className="input-field" value={voucherHealthIssueId} onChange={e => setVoucherHealthIssueId(e.target.value)}>
                    <option value="">— Select health issue —</option>
                    {validatedHiForVoucher.map(h => (
                      <option key={h.id} value={h.id}>{h.category} — {h.description}</option>
                    ))}
                  </select>
                </div>
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
                    disabled={!voucherHealthIssueId || !voucherHospitalId || numericVoucherAmount <= 0}
                    onClick={() => setVoucherStep(2)}>Continue</button>
                </div>
              </div>
            )}

            {voucherStep === 2 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">
                  Target voucher amount: <span className="font-bold">{formatXAF(numericVoucherAmount)}</span>
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
                  Allocate funds from selected campaigns. Use fixed amount or percentage per campaign.
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {voucherAllocations.map(allocation => {
                    const campaign = campaigns.find(c => c.id === allocation.campaign_id);
                    return (
                      <div key={allocation.campaign_id} className="border border-gray-200 rounded-xl p-3">
                        <div className="text-sm font-semibold text-gray-900">{campaign?.title}</div>
                        <div className="flex gap-2">
                          <select className="input-field w-40" value={allocation.mode}
                            onChange={e => setVoucherAllocations(prev => prev.map(a => a.campaign_id === allocation.campaign_id ? { ...a, mode: e.target.value as 'amount' | 'percentage', value: '' } : a))}>
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

function Detail({ label, value, mono, className }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-gray-900">{title}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <select className="input-field" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function MiniPagination({ page, setPage, hasPrev, hasNext }: { page: number; setPage: (n: number) => void; hasPrev: boolean; hasNext: boolean }) {
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-3">
      <button onClick={() => setPage(page - 1)} disabled={!hasPrev} className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
        <ChevronLeft size={14} className="text-gray-500" />
      </button>
      <span className="text-xs text-gray-500">{page}</span>
      <button onClick={() => setPage(page + 1)} disabled={!hasNext} className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 transition-colors">
        <ChevronRight size={14} className="text-gray-500" />
      </button>
    </div>
  );
}

function EditBeneficiaryModal({ beneficiary, onClose, onSave, saving }: { beneficiary: any; onClose: () => void; onSave: (fd: FormData) => void; saving: boolean }) {
  const [full_name, setFullName] = useState(beneficiary.full_name);
  const [date_of_birth, setDob] = useState(beneficiary.date_of_birth);
  const [gender, setGender] = useState(beneficiary.gender);
  const [category, setCategory] = useState(beneficiary.category);
  const [phone, setPhone] = useState(beneficiary.phone);
  const [email, setEmail] = useState(beneficiary.email || '');
  const [region, setRegion] = useState(beneficiary.region);
  const [city, setCity] = useState(beneficiary.city);
  const [address, setAddress] = useState(beneficiary.address || '');
  const [national_id_number, setNid] = useState(beneficiary.national_id_number);
  const [previousBirths, setPrevBirths] = useState(beneficiary.number_of_previous_births?.toString() || '');
  const [ecName, setEcName] = useState(beneficiary.emergency_contact_name);
  const [ecPhone, setEcPhone] = useState(beneficiary.emergency_contact_phone);
  const [ecRel, setEcRel] = useState(beneficiary.emergency_contact_relationship);

  const handleSave = () => {
    const fd = new FormData();
    fd.append('full_name', full_name);
    fd.append('date_of_birth', date_of_birth);
    fd.append('gender', gender);
    fd.append('category', category);
    fd.append('phone', phone);
    if (email) fd.append('email', email);
    fd.append('region', region);
    fd.append('city', city);
    if (address) fd.append('address', address);
    fd.append('national_id_number', national_id_number);
    if (previousBirths) fd.append('number_of_previous_births', previousBirths);
    fd.append('emergency_contact_name', ecName);
    fd.append('emergency_contact_phone', ecPhone);
    fd.append('emergency_contact_relationship', ecRel);
    onSave(fd);
  };

  return (
    <Modal title="Edit Beneficiary" onClose={onClose}>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name" value={full_name} onChange={setFullName} />
          <Field label="Date of Birth" type="date" value={date_of_birth} onChange={setDob} />
          <SelectField label="Gender" value={gender} onChange={setGender} options={[
            { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' },
          ]} />
          <SelectField label="Category" value={category} onChange={setCategory} options={[
            { value: 'MATERNAL', label: 'Pregnant Woman' }, { value: 'ELDERLY', label: 'Elderly' }, { value: 'OTHER', label: 'Other' },
          ]} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Email" value={email} onChange={setEmail} />
          <div className="col-span-2"><Field label="National ID" value={national_id_number} onChange={setNid} /></div>
          <Field label="Previous Births" type="number" value={previousBirths} onChange={setPrevBirths} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Region" value={region} onChange={setRegion} />
          <Field label="City" value={city} onChange={setCity} />
          <div className="col-span-2"><Field label="Address" value={address} onChange={setAddress} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="EC Name" value={ecName} onChange={setEcName} />
          <Field label="EC Phone" value={ecPhone} onChange={setEcPhone} />
          <Field label="EC Relationship" value={ecRel} onChange={setEcRel} />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#471DDB' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

function DocPreview({ doc }: { doc: BeneficiaryDocument }) {
  const docUrl = typeof doc.document === 'string' ? doc.document : (doc.document?.url || doc.document?.file || '');
  const fullUrl = docUrl.startsWith('http') ? docUrl : `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}${docUrl}`;
  const isImage = docUrl && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(docUrl);

  return (
    <div className="space-y-3">
      {isImage ? (
        <div className="relative w-full max-h-[60vh] min-h-[300px] rounded-xl overflow-hidden">
          <Image src={fullUrl} alt={doc.description || 'Document'} fill className="object-contain" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <FileText size={48} className="text-gray-300" />
          <p className="text-sm text-gray-500">This document cannot be previewed inline.</p>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" download
            className="py-2 px-4 rounded-xl font-semibold text-sm text-white" style={{ background: '#471DDB' }}>
            Download
          </a>
        </div>
      )}
      {doc.description && <p className="text-xs text-gray-500 text-center">{doc.description}</p>}
      {doc.uploaded_at && <p className="text-[10px] text-gray-400 text-center">Uploaded {formatDate(doc.uploaded_at)}</p>}
    </div>
  );
}

function Field({ label, type, value, onChange, className }: { label: string; type?: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{label}</label>
      <input type={type || 'text'} className="input-field text-xs" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
