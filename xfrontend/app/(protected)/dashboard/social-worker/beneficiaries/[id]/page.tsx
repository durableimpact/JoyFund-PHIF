'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Heart,
  Loader2,
  MapPin,
  Phone,
  Plus,
  User,
  X
} from 'lucide-react';
import { getBeneficiary, listHealthIssues, listBeneficiaryDocuments, createHealthIssue } from '@/actions/beneficiaries';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function BeneficiaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: beneficiary, isLoading } = useQuery<Beneficiary>({
    queryKey: ['beneficiary', id, token],
    queryFn: () => getBeneficiary(id, token),
    enabled: !!token && !!id,
  });

  const { data: healthIssuesData } = useQuery({
    queryKey: ['beneficiary-health-issues', id, token],
    queryFn: async () => {
      const res = await listHealthIssues(token, { beneficiary_id: id, page_size: '100' });
      return res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && !!id,
  });

  const { data: documentsData } = useQuery({
    queryKey: ['beneficiary-documents', id, token],
    queryFn: async () => {
      const res = await listBeneficiaryDocuments(token, { beneficiary_id: id, page_size: '100' });
      return res || { results: [], next: null, previous: null, count: 0 };
    },
    enabled: !!token && !!id,
  });

  const healthIssues: HealthIssue[] = healthIssuesData?.results || [];
  const documents: BeneficiaryDocument[] = documentsData?.results || [];

  const queryClient = useQueryClient();
  const [showHealthIssueForm, setShowHealthIssueForm] = useState(false);
  const [hiCategory, setHiCategory] = useState('');
  const [hiSeverity, setHiSeverity] = useState('');
  const [hiDescription, setHiDescription] = useState('');

  const createHiMutation = useMutation({
    mutationFn: () => createHealthIssue(token, {
      beneficiary_id: id,
      category: hiCategory,
      severity: hiSeverity,
      description: hiDescription,
    }),
    onSuccess: () => {
      setShowHealthIssueForm(false);
      setHiCategory(''); setHiSeverity(''); setHiDescription('');
      queryClient.invalidateQueries({ queryKey: ['beneficiary-health-issues', id] });
    },
  });

  if (isLoading) {
    return (<>
              <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        </div>
    </>);
  }

  if (!beneficiary) {
    return (
              <div className="text-center py-16 text-gray-400">Beneficiary not found.</div>
    );
  }

  return (<>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to Beneficiaries
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Heart size={14} /> Health Issues ({healthIssues.length})
              </h2>
              <button onClick={() => setShowHealthIssueForm(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: '#0D9488' }}>
                <Plus size={14} /> Add Issue
              </button>
            </div>
            {healthIssues.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No health issues recorded yet.</p>
            ) : (
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
            )}
          </div>

          {documents.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText size={14} /> Documents ({documents.length})
              </h2>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.description || 'Document'}</p>
                      {doc.uploaded_at && <p className="text-[10px] text-gray-400">{formatDate(doc.uploaded_at)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                { label: 'Health Issues', value: healthIssues.length },
                { label: 'Documents', value: documents.length },
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

      {showHealthIssueForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">Add Health Issue</h2>
              <button onClick={() => setShowHealthIssueForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Category *</label>
                <select className="input-field" value={hiCategory} onChange={e => setHiCategory(e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="PREGNANCY">Pregnancy</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="CHRONIC">Chronic</option>
                  <option value="MENTAL_HEALTH">Mental Health</option>
                  <option value="INFECTIOUS">Infectious</option>
                  <option value="ELDERLY">Elderly</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Severity *</label>
                <select className="input-field" value={hiSeverity} onChange={e => setHiSeverity(e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Description *</label>
                <textarea className="input-field min-h-[80px]" value={hiDescription} onChange={e => setHiDescription(e.target.value)} placeholder="Describe the health issue..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowHealthIssueForm(false)} className="btn-outline flex-1">Cancel</button>
                <button
                  onClick={() => createHiMutation.mutate()}
                  disabled={createHiMutation.isPending || !hiCategory || !hiSeverity || !hiDescription}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: '#0D9488' }}
                >
                  {createHiMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Submit
                </button>
              </div>
            </div>
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
