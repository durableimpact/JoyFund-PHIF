import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatXAF(amount: number): string {
  if (isNaN(amount)) return '0 XAF';
  return `${amount.toLocaleString()} XAF`;
}

export function statusColor(status: string): string {
  const statusMap: Record<string, string> = {
    'active': 'bg-green-100 text-green-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'pending_confirmation': 'bg-yellow-100 text-yellow-700',
    'inactive': 'bg-gray-100 text-gray-700',
    'suspended': 'bg-red-100 text-red-700',
    'used': 'bg-blue-100 text-blue-700',
    'expired': 'bg-gray-100 text-gray-700',
    'cancelled': 'bg-red-100 text-red-700',
    'success': 'bg-green-100 text-green-700',
    'failed': 'bg-red-100 text-red-700',
    'awaiting_match': 'bg-yellow-100 text-yellow-700',
    'voucher_issued': 'bg-blue-100 text-blue-700',
    'care_received': 'bg-green-100 text-green-700',
  };
  return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
}

export function statusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    'pending_confirmation': 'Pending Confirmation',
    'awaiting_match': 'Awaiting Match',
    'voucher_issued': 'Voucher Issued',
    'care_received': 'Care Received',
  };
  if (labelMap[status?.toLowerCase()]) {
    return labelMap[status.toLowerCase()];
  }
  return status?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '—';
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

