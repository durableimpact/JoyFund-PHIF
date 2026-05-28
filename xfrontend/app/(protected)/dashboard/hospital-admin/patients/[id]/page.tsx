'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Heart,
  MapPin,
  Phone,
  User,
  X
} from 'lucide-react';
import { getBeneficiary, listHealthIssues, listBeneficiaryDocuments } from '@/actions/beneficiaries';
import { formatDate, formatDateTime } from '@/lib/utils';

const SUB_PAGE_SIZE = 5;

export default function HospitalPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const [hiPage, setHiPage] = useState(1);
  const [docPage, setDocPage] = useState(1);
  const [previewDoc, setPreviewDoc] = useState<BeneficiaryDocument | null>(null);

  const { data: beneficiary, isLoading } = useQuery({
    queryKey: ['ha-patient', id, token],
    queryFn: () => getBeneficiary(id, token),
    enabled: !!token && !!id,
  });

  const { data: healthIssuesData } = useQuery({
    queryKey: ['ha-patient-health-issues', id, token, hiPage],
    queryFn: async () => {
      const res = await listHealthIssues(token, { beneficiary: id, page: String(hiPage), page_size: String(SUB_PAGE_SIZE) });
      return (res as any)?.json || res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && !!id,
  });

  const { data: documentsData } = useQuery({
    queryKey: ['ha-patient-documents', id, token, docPage],
    queryFn: async () => {
      const res = await listBeneficiaryDocuments(id, token, { page: String(docPage), page_size: String(SUB_PAGE_SIZE) });
      return (res as any)?.json || res || { results: [], next: null, previous: null, count: 0 };
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

  if (isLoading) {
    return (<><div className="space-y-4"><div className="h-8 bg-gray-100 rounded w-48 animate-pulse" /><div className="h-64 bg-gray-50 rounded-xl animate-pulse" /></div></>);
  }

  if (!beneficiary) {
    return (<div className="text-center py-16 text-gray-400">Patient not found.</div>);
  }

  return (<>
    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
      <ArrowLeft size={16} /> Back to Patients
    </button>

    <div className="mb-6">
      <h1 className="text-2xl font-black text-gray-900">{beneficiary.full_name}</h1>
      <p className="text-gray-500 text-sm mt-1">
        {beneficiary.digital_health_id && <span className="font-mono mr-3">{beneficiary.digital_health_id}</span>}
        <span className={`badge text-xs ${beneficiary.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {beneficiary.is_verified ? 'Verified' : 'Pending Verification'}
        </span>
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <User size={14} /> Personal Information
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

        <div className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <MapPin size={14} /> Location
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Region" value={beneficiary.region} />
            <Detail label="City" value={beneficiary.city} />
            <Detail label="Address" value={beneficiary.address} className="col-span-2" />
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Phone size={14} /> Emergency Contact
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Name" value={beneficiary.emergency_contact_name || '—'} />
            <Detail label="Phone" value={beneficiary.emergency_contact_phone || '—'} />
            <Detail label="Relationship" value={beneficiary.emergency_contact_relationship || '—'} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Heart size={14} /> Health Issues ({hiCount})
          </h2>
          {healthIssues.length === 0 ? (
            <p className="text-xs text-gray-400 py-4">No health issues recorded yet.</p>
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
                    <span>Severity: {hi.severity}</span>
                    {hi.created_at && <span>{formatDate(hi.created_at)}</span>}
                  </div>
                </div>
              ))}
            </div>
            {hiCount > SUB_PAGE_SIZE && <MiniPagination page={hiPage} setPage={setHiPage} hasPrev={hiHasPrev} hasNext={hiHasNext} />}
          </>)}
        </div>

        <div className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <FileText size={14} /> Documents ({docCount})
          </h2>
          {documents.length === 0 ? (
            <p className="text-xs text-gray-400 py-4">No documents uploaded yet.</p>
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
                        <img src={fullUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                          <FileText size={18} className="text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.description || 'Document'}</p>
                        {doc.uploaded_at && <p className="text-[10px] text-gray-400">{formatDate(doc.uploaded_at)}</p>}
                      </div>
                    </button>
                    {docUrl && (
                      <a href={fullUrl} target="_blank" rel="noopener noreferrer" download className="p-1.5 text-gray-400 hover:text-[#1D75DB] rounded-lg hover:bg-blue-50 transition-colors shrink-0" title="Download">
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
      </div>

      <div className="space-y-4">
        <div className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Calendar size={14} /> Enrollment Info
          </h2>
          <div className="space-y-3">
            {/* <Detail label="Status" value={beneficiary.is_active ? 'Active' : 'Inactive'} /> */}
            <Detail label="Created" value={beneficiary.created_at ? formatDateTime(beneficiary.created_at) : '—'} />
            <Detail label="Updated" value={beneficiary.updated_at ? formatDateTime(beneficiary.updated_at) : '—'} />
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Health Issues', value: hiCount },
              { label: 'Documents', value: docCount },
              { label: 'Verified', value: beneficiary.is_verified ? 'Yes' : 'No' },
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

    {previewDoc && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-gray-900">{previewDoc.description || 'Document Preview'}</h2>
            <button onClick={() => setPreviewDoc(null)}><X size={20} className="text-gray-400" /></button>
          </div>
          <DocPreview doc={previewDoc} />
        </div>
      </div>
    )}
  </>);
}

function Detail({ label, value, mono, className }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

function DocPreview({ doc }: { doc: BeneficiaryDocument }) {
  const docUrl = typeof doc.document === 'string' ? doc.document : (doc.document?.url || doc.document?.file || '');
  const fullUrl = docUrl.startsWith('http') ? docUrl : `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}${docUrl}`;
  const isImage = docUrl && /\.(png|jpg|jpeg|gif|webp|svg)/i.test(docUrl);

  return (
    <div className="space-y-3">
      {isImage ? (
        <img src={fullUrl} alt={doc.description || 'Document'} className="w-full rounded-xl object-contain max-h-[60vh]" />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <FileText size={48} className="text-gray-300" />
          <p className="text-sm text-gray-500">This document cannot be previewed inline.</p>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" download
            className="py-2 px-4 rounded-xl font-semibold text-sm text-white" style={{ background: '#1D75DB' }}>
            Download
          </a>
        </div>
      )}
      {doc.description && <p className="text-xs text-gray-500 text-center">{doc.description}</p>}
      {doc.uploaded_at && <p className="text-[10px] text-gray-400 text-center">Uploaded {formatDate(doc.uploaded_at)}</p>}
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
