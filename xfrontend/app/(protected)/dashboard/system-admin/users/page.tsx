'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Plus,
  Search
} from 'lucide-react';




} from 'lucide-react';
import { formatDate, statusColor } from '@/lib/utils';
import {
  listSystemAdmins,
  listHospitalAdmins,
  listSocialWorkers,
  listReceptionists,
  listDonors,
} from '@/actions/accounts';
const TABS = [
  { key: 'all',             label: 'All Users' },
  { key: 'SYSTEM_ADMIN',    label: 'System Admins' },
  { key: 'HOSPITAL_ADMIN',  label: 'Hospital Admins' },
  { key: 'SOCIAL_WORKER',   label: 'Social Workers' },
  { key: 'RECEPTIONIST',    label: 'Receptionists' },
  { key: 'DONOR',           label: 'Donors' },
] as const;
type TabKey = typeof TABS[number]['key'];
export default function UsersPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;
  const [tab, setTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  // Fetch all role types
  const { data: systemAdmins = [], isLoading: loadingSA } = useQuery<SystemAdmin[]>({
    queryKey: ['systemAdmins', token],
    queryFn: () => listSystemAdmins(token),
    enabled: !!token,
  });
  const { data: hospitalAdmins = [], isLoading: loadingHA } = useQuery<HospitalAdmin[]>({
    queryKey: ['hospitalAdmins', token],
    queryFn: () => listHospitalAdmins(token),
    enabled: !!token,
  });
  const { data: socialWorkers = [], isLoading: loadingSW } = useQuery<SocialWorker[]>({
    queryKey: ['socialWorkers', token],
    queryFn: () => listSocialWorkers(token),
    enabled: !!token,
  });
  const { data: receptionists = [], isLoading: loadingRec } = useQuery<Receptionist[]>({
    queryKey: ['receptionists', token],
    queryFn: () => listReceptionists(token),
    enabled: !!token,
  });
  const { data: donors = [], isLoading: loadingDon } = useQuery<Donor[]>({
    queryKey: ['donors', token],
    queryFn: () => listDonors(token),
    enabled: !!token,
  });
  const isLoading = loadingSA || loadingHA || loadingSW || loadingRec || loadingDon;
  // Merge users by tab
  let users: any[] = [];
  if (tab === 'all') {
    users = [
      ...systemAdmins.map(u => ({ ...u, _role: 'SYSTEM_ADMIN', _searchName: u.user?.email || '' })),
      ...hospitalAdmins.map(u => ({ ...u, _role: 'HOSPITAL_ADMIN', _searchName: u.user?.email || '' })),
      ...socialWorkers.map(u => ({ ...u, _role: 'SOCIAL_WORKER', _searchName: u.user?.email || '' })),
      ...receptionists.map(u => ({ ...u, _role: 'RECEPTIONIST', _searchName: u.user?.email || '' })),
      ...donors.map(u => ({ ...u, _role: 'DONOR', _searchName: u.user?.email || '' })),
    ];
  } else if (tab === 'SYSTEM_ADMIN') users = systemAdmins.map(u => ({ ...u, _role: 'SYSTEM_ADMIN', _searchName: u.user?.email || '' }));
  else if (tab === 'HOSPITAL_ADMIN') users = hospitalAdmins.map(u => ({ ...u, _role: 'HOSPITAL_ADMIN', _searchName: u.user?.email || '' }));
  else if (tab === 'SOCIAL_WORKER') users = socialWorkers.map(u => ({ ...u, _role: 'SOCIAL_WORKER', _searchName: u.user?.email || '' }));
  else if (tab === 'RECEPTIONIST') users = receptionists.map(u => ({ ...u, _role: 'RECEPTIONIST', _searchName: u.user?.email || '' }));
  else if (tab === 'DONOR') users = donors.map(u => ({ ...u, _role: 'DONOR', _searchName: u.user?.email || '' }));
  const filtered = search
    ? users.filter(
        (u) =>
          u._searchName.toLowerCase().includes(search.toLowerCase()) ||
          u.user?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.user?.last_name?.toLowerCase().includes(search.toLowerCase())
      )
    : users;
  const counts = {
    all: systemAdmins.length + hospitalAdmins.length + socialWorkers.length + receptionists.length + donors.length,
    SYSTEM_ADMIN: systemAdmins.length,
    HOSPITAL_ADMIN: hospitalAdmins.length,
    SOCIAL_WORKER: socialWorkers.length,
    RECEPTIONIST: receptionists.length,
    DONOR: donors.length,
  };
  return (<>


          <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">{counts.all} total users</p>
        </div>
        <Link href="/dashboard/system-admin/users/create" className="btn-admin text-sm flex items-center gap-2" style={{ background: '#471DDB' }}>
          <Plus size={16} /> Create User
        </Link>
      </div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={tab === t.key ? { background: '#471DDB' } : {}}
          >
            {t.label}
            <span className={`ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
              tab === t.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>
      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input-field pl-10" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name','Email','Role','Verified','Created'].map((h) => (
                  <th key={h} className="text-left p-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-16"><Loader2 size={24} className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No users found</td></tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 text-sm">
                        <Link href={`/dashboard/system-admin/users/${u.id}?role=${u._role}`} className="hover:text-blue-600 hover:underline">
                          {u.user?.first_name || ''} {u.user?.last_name || ''}
                        </Link>
                      </div>
                      <div className="text-[10px] text-gray-400">{u.user?.phone_number}</div>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">{u.user?.email || '—'}</td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${u._role === 'SYSTEM_ADMIN' ? 'bg-purple-100 text-purple-700' : u._role === 'HOSPITAL_ADMIN' ? 'bg-blue-100 text-blue-700' : u._role === 'SOCIAL_WORKER' ? 'bg-emerald-100 text-emerald-700' : u._role === 'RECEPTIONIST' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u._role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.user?.is_verified
                        ? <span className="text-emerald-600 text-xs font-semibold">Verified</span>
                        : <span className="text-gray-400 text-xs">Pending</span>}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{u.user?.created_at ? formatDate(u.user.created_at) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
  
</>
)
;
}