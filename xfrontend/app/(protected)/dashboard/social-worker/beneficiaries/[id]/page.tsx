'use client';
import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Pencil,
  Plus,
  Upload,
  User,
  X
} from 'lucide-react';
import { getBeneficiary, listHealthIssues, listBeneficiaryDocuments, createHealthIssue, createBeneficiaryDocument, updateBeneficiary } from '@/actions/beneficiaries';
import { formatDate, formatDateTime } from '@/lib/utils';

const SUB_PAGE_SIZE = 5;

export default function BeneficiaryDetailPage() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hiCategory, setHiCategory] = useState('');
  const [hiSeverity, setHiSeverity] = useState('');
  const [hiDescription, setHiDescription] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [previewDoc, setPreviewDoc] = useState<BeneficiaryDocument | null>(null);

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

  const healthIssues: HealthIssue[] = healthIssuesData?.results || [];
  const hiCount = healthIssuesData?.count || 0;
  const hiHasNext = !!healthIssuesData?.next;
  const hiHasPrev = !!healthIssuesData?.previous;

  const documents: BeneficiaryDocument[] = documentsData?.results || [];
  const docCount = documentsData?.count || 0;
  const docHasNext = !!documentsData?.next;
  const docHasPrev = !!documentsData?.previous;

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

  if (isLoading) {
    return (<><div className="space-y-4"><div className="h-8 bg-gray-100 rounded w-48 animate-pulse" /><div className="h-64 bg-gray-50 rounded-xl animate-pulse" /></div></>);
  }

  if (!beneficiary) {
    return (<div className="text-center py-16 text-gray-400">Beneficiary not found.</div>);
  }

  return (<>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to Beneficiaries
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{beneficiary.full_name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {beneficiary.digital_health_id && <span className="font-mono mr-3">{beneficiary.digital_health_id}</span>}
            <span className={`badge text-xs ${beneficiary.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {beneficiary.is_verified ? 'Verified' : 'Pending Verification'}
            </span>
          </p>
        </div>
        <button onClick={() => setShowEdit(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#0D9488' }}>
          <Pencil size={16} /> Edit
        </button>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Heart size={14} /> Health Issues ({hiCount})
              </h2>
              <button onClick={() => setShowHiForm(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#0D9488' }}>
                <Plus size={14} /> Add Issue
              </button>
            </div>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <FileText size={14} /> Documents ({docCount})
              </h2>
              <button onClick={() => setShowDocUpload(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#0D9488' }}>
                <Upload size={14} /> Upload
              </button>
            </div>
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
                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" download className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors shrink-0" title="Download">
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
              <Detail label="Status" value={beneficiary.is_active ? 'Active' : 'Inactive'} />
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

      {showHiForm && <Modal title="Add Health Issue" onClose={() => setShowHiForm(false)}>
        <div className="space-y-4">
          <SelectField label="Category *" value={hiCategory} onChange={setHiCategory} options={[
            { value: '', label: '— Select —' }, { value: 'PREGNANCY', label: 'Pregnancy' }, { value: 'EMERGENCY', label: 'Emergency' },
            { value: 'CHRONIC', label: 'Chronic' }, { value: 'MENTAL_HEALTH', label: 'Mental Health' },
            { value: 'INFECTIOUS', label: 'Infectious' }, { value: 'ELDERLY', label: 'Elderly' }, { value: 'OTHER', label: 'Other' },
          ]} />
          <SelectField label="Severity *" value={hiSeverity} onChange={setHiSeverity} options={[
            { value: '', label: '— Select —' }, { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' }, { value: 'CRITICAL', label: 'Critical' },
          ]} />
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description *</label>
            <textarea className="input-field min-h-[80px]" value={hiDescription} onChange={e => setHiDescription(e.target.value)} placeholder="Describe the health issue..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowHiForm(false)} className="btn-outline flex-1">Cancel</button>
            <button onClick={() => createHiMutation.mutate()} disabled={createHiMutation.isPending || !hiCategory || !hiSeverity || !hiDescription}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#0D9488' }}>
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
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: '#0D9488' }}>
              {uploadDocMutation.isPending && <Loader2 size={16} className="animate-spin" />} Upload
            </button>
          </div>
        </div>
      </Modal>}

      {showEdit && <EditBeneficiaryModal beneficiary={beneficiary} onClose={() => setShowEdit(false)} onSave={(fd) => editMutation.mutate(fd)} saving={editMutation.isPending} />}
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
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ background: '#0D9488' }}>
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
        <img src={fullUrl} alt={doc.description || 'Document'} className="w-full rounded-xl object-contain max-h-[60vh]" />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <FileText size={48} className="text-gray-300" />
          <p className="text-sm text-gray-500">This document cannot be previewed inline.</p>
          <a href={fullUrl} target="_blank" rel="noopener noreferrer" download
            className="py-2 px-4 rounded-xl font-semibold text-sm text-white" style={{ background: '#0D9488' }}>
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
