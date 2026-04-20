export function formatXAF(amount: number): string {
  return new Intl.NumberFormat('fr-CM', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' XAF';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-CM', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export function generateHealthId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `BEN-${num}`;
}

export function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'JF' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function getProgressPercent(raised: number, goal: number): number {
  return Math.min(Math.round((raised / goal) * 100), 100);
}

export function eventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    birthday: '🎂 Birthday',
    wedding: '💍 Wedding',
    graduation: '🎓 Graduation',
    promotion: '🚀 Promotion',
    other: '🎉 Celebration',
  };
  return labels[type] || type;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-emerald-100 text-emerald-700',
    draft: 'bg-gray-100 text-gray-600',
    generated: 'bg-blue-100 text-blue-700',
    issued: 'bg-cyan-100 text-cyan-700',
    redeemed: 'bg-indigo-100 text-indigo-700',
    expired: 'bg-gray-100 text-gray-500',
    void: 'bg-red-100 text-red-600',
    awaiting_match: 'bg-amber-100 text-amber-700',
    voucher_issued: 'bg-cyan-100 text-cyan-700',
    care_received: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Active',
    completed: 'Completed',
    draft: 'Draft',
    generated: 'Generated',
    issued: 'Issued',
    redeemed: 'Redeemed',
    expired: 'Expired',
    void: 'Void',
    awaiting_match: 'Awaiting Match',
    voucher_issued: 'Voucher Issued',
    care_received: 'Care Received',
    pending: 'Pending',
    suspended: 'Suspended',
  };
  return labels[status] || status;
}
