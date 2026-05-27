'use client';
import {
  Activity,
  AlertCircle,
  FileText,
  Globe,
  React,
  RefreshCw
} from 'lucide-react';







type LogTab = 'activity' | 'requests' | 'errors';

export default function AdminLogs() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<LogTab>('activity');
  const token = (session as any)?.accessToken || (session?.user as any)?.accessToken;

  const { data: activityLogs = [], isLoading: loadingActivity } = useQuery<ActivityLog[]>({
    queryKey: ['logs-activity', token],
    queryFn: () => listActivityLogs(token),
    enabled: !!token && tab === 'activity',
  });

  const { data: requestLogs = [], isLoading: loadingRequests } = useQuery<RequestLog[]>({
    queryKey: ['logs-requests', token],
    queryFn: () => listRequestLogs(token),
    enabled: !!token && tab === 'requests',
  });

  const { data: errorLogs = [], isLoading: loadingErrors } = useQuery<ErrorLog[]>({
    queryKey: ['logs-errors', token],
    queryFn: () => listErrorLogs(token),
    enabled: !!token && tab === 'errors',
  });

  const { data: stats } = useQuery<LogStats>({
    queryKey: ['logs-stats', token],
    queryFn: () => getLogStats(token),
    enabled: !!token,
  });

  const logs = tab === 'activity' ? activityLogs : tab === 'requests' ? requestLogs : errorLogs;
  const loading = tab === 'activity' ? loadingActivity : tab === 'requests' ? loadingRequests : loadingErrors;

  const TABS: { key: LogTab; label: string; icon: React.ReactNode }[] = [
    { key: 'activity', label: 'Activity', icon: <Activity size={14} /> },
    { key: 'requests', label: 'Requests', icon: <Globe size={14} /> },
    { key: 'errors', label: 'Errors', icon: <AlertCircle size={14} /> },
  ];

  const refetch = () => {
    window.location.reload();
  };

  return (<>

          <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">System Logs</h1>
          <p className="text-gray-500 text-sm">Platform activity, API requests, and errors</p>
        </div>
        <button onClick={refetch} className="btn-outline text-sm flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-xl font-black" style={{ color: '#471DDB' }}>{stats.activity_count}</div>
            <div className="text-xs text-gray-500">Total Activity</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl font-black" style={{ color: '#1DB1DB' }}>{stats.request_count}</div>
            <div className="text-xs text-gray-500">API Requests</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-xl font-black" style={{ color: '#ef4444' }}>{stats.error_count}</div>
            <div className="text-xs text-gray-500">Errors</div>
          </div>
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
                  {tab === 'activity' && ['User', 'Action', 'Level', 'Description', 'Time'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {tab === 'requests' && ['Method', 'Path', 'Status', 'Duration', 'IP', 'Time'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {tab === 'errors' && ['Type', 'Message', 'Path', 'Time'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={(log as any).id || i} className="border-b border-gray-50 hover:bg-gray-50">
                    {tab === 'activity' && (
                      
                        <td className="p-4 text-xs text-gray-700">{(log as ActivityLog).actor_label || '—'}</td>
                        <td className="p-4 text-xs font-mono text-blue-600">{(log as ActivityLog).action || '—'}</td>
                        <td className="p-4">
                          <span className={`badge text-[10px] ${
                            (log as ActivityLog).level === 'ERROR' ? 'bg-red-100 text-red-600' :
                            (log as ActivityLog).level === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                            (log as ActivityLog).level === 'CRITICAL' ? 'bg-red-200 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{(log as ActivityLog).level}</span>
                        </td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs truncate">{(log as ActivityLog).description || (log as ActivityLog).action}</td>
                        <td className="p-4 text-xs text-gray-400">{(log as ActivityLog).created_at ? new Date((log as ActivityLog).created_at).toLocaleString() : '—'}</td>
                      
                    )}
                    {tab === 'requests' && (
                      
                        <td className="p-4">
                          <span className={`badge text-xs font-mono ${
                            (log as RequestLog).method === 'GET' ? 'bg-blue-100 text-blue-700' :
                            (log as RequestLog).method === 'POST' ? 'bg-green-100 text-green-700' :
                            (log as RequestLog).method === 'DELETE' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{(log as RequestLog).method}</span>
                        </td>
                        <td className="p-4 text-xs font-mono text-gray-700 max-w-xs truncate">{(log as RequestLog).path}</td>
                        <td className="p-4">
                          <span className={`badge text-xs ${(log as RequestLog).status_code >= 400 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                            {(log as RequestLog).status_code}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500">{(log as RequestLog).response_time_ms}ms</td>
                        <td className="p-4 text-xs text-gray-500">{(log as RequestLog).ip_address || '—'}</td>
                        <td className="p-4 text-xs text-gray-400">{(log as RequestLog).created_at ? new Date((log as RequestLog).created_at).toLocaleString() : '—'}</td>
                      
                    )}
                    {tab === 'errors' && (
                      
                        <td className="p-4"><span className="badge bg-red-100 text-red-600 text-[10px]">{(log as ErrorLog).error_type}</span></td>
                        <td className="p-4 text-xs text-gray-700 max-w-xs truncate">{(log as ErrorLog).error_message}</td>
                        <td className="p-4 text-xs font-mono text-gray-500 max-w-[150px] truncate">{(log as ErrorLog).path || '—'}</td>
                        <td className="p-4 text-xs text-gray-400">{(log as ErrorLog).created_at ? new Date((log as ErrorLog).created_at).toLocaleString() : '—'}</td>
                      
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  
</>
)
;
}
