'use client';
import { useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { listNotifications } from '@/actions/notifications';
import { formatDate } from '@/lib/utils';

export default function NotificationsPanel() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', session?.user?.id],
    queryFn: async () => {
      const token = (session as any)?.accessToken || session?.user?.accessToken;
      if (!token) throw new Error('No access token');
      return await listNotifications(token);
    },
    enabled: !!session?.user && open,
  });

  const notifications = (notificationsData as any)?.results || (Array.isArray(notificationsData) ? notificationsData : []);
  const unread = notifications.filter(n => !n.is_read && !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.is_read && !n.read ? 'bg-blue-50/50' : ''}`}
                >
                  <p className="text-sm text-gray-800 font-medium">{n.title || n.message || n.body || '—'}</p>
                  {n.description && <p className="text-xs text-gray-500 mt-0.5">{n.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">{n.created_at ? formatDate(n.created_at) : ''}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
