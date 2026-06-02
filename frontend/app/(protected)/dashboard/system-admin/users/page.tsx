'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { formatDate } from '@/lib/utils';
import { getUsers } from '@/actions/accounts';

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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page on tab change
  const handleTabChange = (newTab: TabKey) => {
    setTab(newTab);
    setPage(1);
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', token, tab, debouncedSearch, page],
    queryFn: async () => {
      const params: any = { page, page_size: pageSize };
      if (tab !== 'all') params.role = tab;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getUsers(token, params);
      return res;
    },
    enabled: !!token,
  });

  const users = usersData?.results || [];
  const totalCount = usersData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">{totalCount} total users</p>
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
            onClick={() => handleTabChange(t.key)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key
                ? 'text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={tab === t.key ? { background: '#471DDB' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          className="input-field pl-10 w-full" 
          placeholder="Search by name or email…" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
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
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">No users found</td></tr>
              ) : (
                users.map((u: UnifiedUser, i: number) => (
                  <tr key={u.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 text-sm">
                        <Link href={`/dashboard/system-admin/users/${u.profile?.id}?role=${u.role}`} className="hover:text-blue-600 hover:underline">
                          {u.first_name || ''} {u.last_name || ''}
                        </Link>
                      </div>
                      <div className="text-[10px] text-gray-400">{u.phone_number}</div>
                    </td>
                    <td className="p-4 text-gray-600 text-xs">{u.email || '—'}</td>
                    <td className="p-4">
                      <span className={`badge text-[10px] ${u.role === 'SYSTEM_ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'HOSPITAL_ADMIN' ? 'bg-blue-100 text-blue-700' : u.role === 'SOCIAL_WORKER' ? 'bg-emerald-100 text-emerald-700' : u.role === 'RECEPTIONIST' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.is_verified
                        ? <span className="text-emerald-600 text-xs font-semibold">Verified</span>
                        : <span className="text-gray-400 text-xs">Pending</span>}
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{u.created_at ? formatDate(u.created_at) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-100">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages || users.length === 0}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}