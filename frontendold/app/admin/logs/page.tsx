'use client';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, Ticket, BarChart2, FileText, RefreshCw, AlertCircle, Activity, Globe } from 'lucide-react';
import DashboardShell, { NavItem } from '@/components/layout/DashboardShell';
import { useStore } from '@/store/useStore';
import { authenticatedFetch } from '@/lib/api';

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Hospitals', href: '/admin/hospitals', icon: <Building2 size={16} /> },
  { label: 'Vouchers', href: '/admin/vouchers', icon: <Ticket size={16} /> },
  { label: 'Beneficiaries', href: '/admin/beneficiaries', icon: <Users size={16} /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart2 size={16} /> },
  { label: 'Logs', href: '/admin/logs', icon: <FileText size={16} /> },
  { label: 'Create User', href: '/admin/create-user', icon: <Users size={16} /> },
];

type LogTab = 'activity' | 'requests' | 'errors';

export default function AdminLogs() {
  const { showToast } = useStore();
  const [tab, setTab] = useState<LogTab>('activity');
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = async (t: LogTab) => {
    setLoading(true);
    try {
      const data = await authenticatedFetch(`/api/logs/${t}/`);
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast('Failed to load logs', 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(tab);
    authenticatedFetch('/api/logs/stats/').then(setStats).catch(() => {});
  }, [tab]);

  const TABS: { key: LogTab; label: string; icon: React.ReactNode }[] = [
    { key: 'activity', label: 'Activity', icon: <Activity size={14} /> },
    { key: 'requests', label: 'Requests', icon: <Globe size={14} /> },
    { key: 'errors', label: 'Errors', icon: <AlertCircle size={14} /> },
  ];

  return (
    <DashboardShell navItems={NAV} accentColor="#471DDB" brandLabel="System Admin" brandSub="Full platform oversight">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Logs</h1>
          <p className="text-gray-500 text-sm">Platform activity, API requests, and errors</p>
        </div>
        <button onClick={() => loadLogs(tab)} className="btn-outline text-sm flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Activity', value: stats.total_activity ?? stats.activity_count ?? '—', color: '#471DDB' },
            { label: 'API Requests', value: stats.total_requests ?? stats.request_count ?? '—', color: '#1DB1DB' },
            { label: 'Errors', value: stats.total_errors ?? stats.error_count ?? '—', color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
            style={tab === t.key ? { background: '#471DDB' } : {}}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <FileText size={32} className="mx-auto mb-3 opacity-40" />
            No {tab} logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {tab === 'activity' && ['User', 'Action', 'Description', 'Time'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {tab === 'requests' && ['Method', 'Path', 'Status', 'IP', 'Time'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {tab === 'errors' && ['Type', 'Message', 'Path', 'Time'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                    {tab === 'activity' && (
                      <>
                        <td className="p-4 text-xs text-gray-700">{log.user_email || log.user || '—'}</td>
                        <td className="p-4 text-xs font-mono text-blue-600">{log.action || log.event || '—'}</td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs truncate">{log.description || log.message || '—'}</td>
                        <td className="p-4 text-xs text-gray-400">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                      </>
                    )}
                    {tab === 'requests' && (
                      <>
                        <td className="p-4"><span className={`badge text-xs font-mono ${log.method === 'GET' ? 'bg-blue-100 text-blue-700' : log.method === 'POST' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{log.method}</span></td>
                        <td className="p-4 text-xs font-mono text-gray-700 max-w-xs truncate">{log.path || log.url || '—'}</td>
                        <td className="p-4"><span className={`badge text-xs ${log.status_code >= 400 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{log.status_code}</span></td>
                        <td className="p-4 text-xs text-gray-500">{log.ip_address || '—'}</td>
                        <td className="p-4 text-xs text-gray-400">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                      </>
                    )}
                    {tab === 'errors' && (
                      <>
                        <td className="p-4"><span className="badge bg-red-100 text-red-600 text-xs">{log.error_type || log.type || 'Error'}</span></td>
                        <td className="p-4 text-xs text-gray-700 max-w-xs truncate">{log.message || log.detail || '—'}</td>
                        <td className="p-4 text-xs font-mono text-gray-500">{log.path || '—'}</td>
                        <td className="p-4 text-xs text-gray-400">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
