'use client';
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Toast() {
  const { toast, clearToast } = useStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast) return null;

  const icons = { success: CheckCircle, error: XCircle, info: Info };
  const colors = {
    success: 'bg-white border-l-4 text-emerald-700',
    error: 'bg-white border-l-4 text-red-600',
    info: 'bg-white border-l-4 text-blue-600',
  };
  const borderColors = {
    success: '#1CDBC9',
    error: '#ef4444',
    info: '#1DB1DB',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 shadow-xl text-sm font-medium max-w-sm ${colors[toast.type]}`}
      style={{ borderRadius: '12px', borderLeftColor: borderColors[toast.type], borderLeftWidth: '4px', animation: 'slideIn 0.3s ease' }}
    >
      <Icon size={18} />
      <span className="text-gray-800 flex-1">{toast.message}</span>
      <button onClick={clearToast} className="text-gray-400 hover:text-gray-600 ml-2">
        <X size={16} />
      </button>
    </div>
  );
}
