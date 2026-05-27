'use client';
import {
  ArrowLeft,
  CreditCard,
  Pencil,
  Users
} from 'lucide-react';
  EditHospitalModal

type StaffTab = 'admins' | 'receptionists' | 'all';

export default function HospitalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [staffTab, setStaffTab] = useState<StaffTab>('all');
  const [showEdit, setShowEdit] = useState(false);

  const { data: hospital, isLoading } = useQuery<Hospital>({
    queryKey: ['hospital', id, token],
    queryFn: () => getHospital(id, token),
    enabled: !!token && !!id,
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<StaffMember[]>({
    queryKey: ['hospital-staff', id, token],
    queryFn: () => getHospitalStaff(id, token),
    enabled: !!token && !!id,
  });

  const { data: receptionists = [], isLoading: recLoading } = useQuery<Receptionist[]>({
    queryKey: ['hospital-receptionists', id, token],
    queryFn: () => getHospitalReceptionists(id, token),
    enabled: !!token && !!id,
  });

  if (isLoading) {
    return (<>

              <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48 animate-pulse" />
          <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      
    
    
</>
);
  }

  if (!hospital) {
    return (
              <div className="text-center py-16 text-gray-400">Hospital not found.</div>
      
    
    );
  }

  const displayStaff = staffTab === 'all'
    ? staff
    : staffTab === 'admins'
      ? staff.filter(s => (s as any).role === 'hospital_admin')
      : staff.filter(s => (s as any).role === 'receptionist');

  return (
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to Hospitals
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {hospital.name}
            <span className={`badge text-xs ${statusColor(hospital.partnership_status)}`}>
              {hospital.partnership_status?.replace(/_/g, ' ')}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">{hospital.city}, {hospital.region}</p>
        </div>
        <button onClick={() => setShowEdit(true)} className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Pencil size={16} /> Edit Hospital
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Hospital info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Hospital Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="Name" value={hospital.name} />
              <Detail label="Status" value={<span className={`badge ${statusColor(hospital.partnership_status)}`}>{hospital.partnership_status?.replace(/_/g, ' ')}</span>} />
              <Detail label="Accreditation #" value={hospital.accreditation_number} mono />
              <Detail label="Licence #" value={hospital.licence_number} mono />
              <Detail label="Region" value={hospital.region} />
              <Detail label="City" value={hospital.city} />
              <Detail label="Phone" value={hospital.phone_number} />
              <Detail label="Email" value={hospital.email} />
              {hospital.website && <Detail label="Website" value={hospital.website} className="col-span-2" />}
              <Detail label="Address" value={hospital.address} className="col-span-2" />
              <Detail label="Created" value={formatDate(hospital.created_at)} />
              <Detail label="Updated" value={formatDate(hospital.updated_at)} />
            </div>
          </div>

          {/* Payment Details */}
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <CreditCard size={14} /> Payment Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {hospital.momo_number && (
                
                  <Detail label="MoMo Number" value={hospital.momo_number} mono />
                  <Detail label="MoMo Name" value={hospital.momo_name || '—'} />
                
              )}
              {hospital.orange_number && (
                
                  <Detail label="Orange Number" value={hospital.orange_number} mono />
                  <Detail label="Orange Name" value={hospital.orange_name || '—'} />
                
              )}
              {hospital.bank_account_number && (
                
                  <Detail label="Bank Account #" value={hospital.bank_account_number} mono />
                  <Detail label="Bank Account Name" value={hospital.bank_account_name || '—'} />
                  <Detail label="Bank Name" value={hospital.bank_name || '—'} />
                  <Detail label="Bank Branch" value={hospital.bank_branch || '—'} />
                
              )}
              {!hospital.momo_number && !hospital.orange_number && !hospital.bank_account_number && (
                <p className="text-xs text-gray-400 col-span-2">No payment details configured</p>
              )}
            </div>
          </div>

          {/* Admins */}
          {hospital.admins && hospital.admins.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Hospital Administrators</h2>
              <div className="space-y-2">
                {hospital.admins.map((admin: HospitalManager) => (
                  <div key={admin.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: '#471DDB' }}>
                      {admin.first_name?.charAt(0)}{admin.last_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{admin.first_name} {admin.last_name}</p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{admin.phone_number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Staff */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Users size={14} /> Staff ({staff.length})
            </h2>

            {/* Staff tabs */}
            <div className="flex gap-1 mb-4">
              {([
                { key: 'all', label: 'All' },
                { key: 'admins', label: 'Admins' },
                { key: 'receptionists', label: 'Receptionists' },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setStaffTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    staffTab === t.key ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={staffTab === t.key ? { background: '#471DDB' } : {}}>
                  {t.label}
                </button>
              ))}
            </div>

            {staffLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : displayStaff.length === 0 ? (
              <p className="text-xs text-gray-400">No staff found.</p>
            ) : (
              <div className="space-y-2">
                {displayStaff.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: (s as any).role === 'hospital_admin' ? '#471DDB' : '#1DB1DB' }}>
                      {s.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`badge text-[10px] ${(s as any).role === 'hospital_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {(s as any).role === 'hospital_admin' ? 'Admin' : 'Receptionist'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && hospital && (
        <EditHospitalModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          hospital={hospital}
        />
      )}
    
  
  );
}

function Detail({ label, value, mono, className }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className={`text-sm font-semibold text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>{value || '—'}</dd>
    </div>
  )
;
}
