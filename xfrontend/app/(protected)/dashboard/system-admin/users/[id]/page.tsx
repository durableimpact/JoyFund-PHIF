'use client';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import {
  getSystemAdmin,
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  Shield,
  User,
  X
  getHospitalAdmin,
  getSocialWorker,
  getReceptionist,
  getDonor,
} from '@/actions/accounts';

const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: 'System Admin',
  HOSPITAL_ADMIN: 'Hospital Admin',
  SOCIAL_WORKER: 'Social Worker',
  RECEPTIONIST: 'Receptionist',
  DONOR: 'Donor',
};

const ROLE_COLORS: Record<string, string> = {
  SYSTEM_ADMIN: 'bg-purple-100 text-purple-700',
  HOSPITAL_ADMIN: 'bg-blue-100 text-blue-700',
  SOCIAL_WORKER: 'bg-emerald-100 text-emerald-700',
  RECEPTIONIST: 'bg-amber-100 text-amber-700',
  DONOR: 'bg-gray-100 text-gray-700',
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get('role') || '';

  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: user, isLoading } = useQuery<any>({
    queryKey: ['user-detail', role, id, token],
    queryFn: async () => {
      switch (role) {
        case 'SYSTEM_ADMIN': return await getSystemAdmin(id, token);
        case 'HOSPITAL_ADMIN': return await getHospitalAdmin(id, token);
        case 'SOCIAL_WORKER': return await getSocialWorker(id, token);
        case 'RECEPTIONIST': return await getReceptionist(id, token);
        case 'DONOR': return await getDonor(id, token);
        default: throw new Error('Unknown role');
      }
    },
    enabled: !!token && !!id && !!role,
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

  if (!user) {
    return (
              <div className="text-center py-16 text-gray-400">User not found.</div>
    
    );
  }

  const u = user.user || user;

  return (
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 text-sm font-semibold">
        <ArrowLeft size={16} /> Back to Users
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {u.first_name} {u.last_name}
            <span className={`badge text-xs ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'}`}>
              {ROLE_LABELS[role] || role}
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">{u.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Profile */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User size={14} /> Profile
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Detail label="First Name" value={u.first_name} />
              <Detail label="Last Name" value={u.last_name} />
              <Detail label="Email" value={u.email} className="col-span-2" />
              <Detail label="Phone" value={u.phone_number} />
              <Detail label="Role" value={
                <span className={`badge ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
              } />
              <Detail label="Verified" value={
                u.is_verified
                  ? <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold"><Check size={14} /> Verified</span>
                  : <span className="flex items-center gap-1 text-gray-400 text-sm"><X size={14} /> Pending</span>
              } />
              <Detail label="Active" value={
                (u.is_active ?? true)
                  ? <span className="text-emerald-600 text-sm font-semibold">Active</span>
                  : <span className="text-red-500 text-sm font-semibold">Inactive</span>
              } />
              <Detail label="Joined" value={formatDate(u.created_at)} />
              <Detail label="Last Updated" value={formatDate(u.updated_at)} />
            </div>
          </div>

          {/* Role-specific fields */}
          {(role === 'HOSPITAL_ADMIN' || role === 'SOCIAL_WORKER' || role === 'RECEPTIONIST') && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Shield size={14} /> Identification
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Detail label="National ID #" value={user.national_id_number} mono />
                {user.front_national_id_image && (
                  <Detail label="Front of ID" value={
                    <a href={user.front_national_id_image} target="_blank" className="text-blue-600 hover:underline text-xs">View Image</a>
                  } />
                )}
                {user.back_national_id_image && (
                  <Detail label="Back of ID" value={
                    <a href={user.back_national_id_image} target="_blank" className="text-blue-600 hover:underline text-xs">View Image</a>
                  } />
                )}
              </div>
            </div>
          )}

          {role === 'SOCIAL_WORKER' && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Briefcase size={14} /> Assignment
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Organization" value={user.organization} />
                <Detail label="Region Assigned" value={user.region_assigned} />
                <Detail label="Approved" value={
                  user.is_approved
                    ? <span className="text-emerald-600 text-sm font-semibold">Approved</span>
                    : <span className="text-amber-600 text-sm font-semibold">Pending</span>
                } />
                {user.enrolled_by_id && (
                  <Detail label="Enrolled By" value={`System Admin (${user.enrolled_by_id?.slice(0, 8)}…)`} className="col-span-2" />
                )}
              </div>
            </div>
          )}

          {(role === 'HOSPITAL_ADMIN' || role === 'RECEPTIONIST') && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Building2 size={14} /> Hospital Assignment
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Detail label="Hospital ID" value={user.hospital_id || 'Unassigned'} mono />
                {user.enrolled_by_id && (
                  <Detail label="Enrolled By" value={`System Admin (${user.enrolled_by_id?.slice(0, 8)}…)`} className="col-span-2" />
                )}
              </div>
            </div>
          )}

          {role === 'SYSTEM_ADMIN' && (
            <div className="card">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Shield size={14} /> System Admin
              </h2>
              <p className="text-xs text-gray-500">Full platform access with all permissions.</p>
            </div>
          )}
        </div>

        {/* Right: Quick stats */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Account Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Verified</span>
                {u.is_verified
                  ? <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">Yes</span>
                  : <span className="badge bg-gray-100 text-gray-500 text-[10px]">No</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Active</span>
                {(u.is_active ?? true)
                  ? <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">Yes</span>
                  : <span className="badge bg-red-100 text-red-600 text-[10px]">No</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Role</span>
                <span className={`badge text-[10px] ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Joined</span>
                <span className="text-xs text-gray-700">{formatDate(u.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
  
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
