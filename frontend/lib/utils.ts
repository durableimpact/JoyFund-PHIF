import type { Campaign } from './mockData';

export function formatXAF(amount: number): string {
  return new Intl.NumberFormat('fr-CM', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' XAF';
}

export function normalizeCampaignResponse(raw: any): Campaign {
  const eventType = (raw.event_type || raw.eventType || 'other').toLowerCase();
  const title = raw.title || raw.name || 'JoyFund Campaign';
  const donorName = raw.donor_name || raw.donorName || raw.donor_id || 'JoyFund';
  const donorAvatar = (raw.donor_avatar || raw.donorAvatar || donorName)
    .toString()
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const coverColor = raw.cover_color || raw.coverColor || getColorFromString(raw.id || title || donorName);
  const goalXAF = Number(raw.goal_amount ?? raw.goalAmount ?? raw.goalXAF ?? 0);
  const raisedXAF = Number(raw.current_amount ?? raw.currentAmount ?? raw.raisedXAF ?? 0);
  const createdAt = raw.created_at || raw.start_date || raw.createdAt || new Date().toISOString().split('T')[0];
  const expiresAt = raw.end_date || raw.expiresAt || raw.expiresAt || '';
  const story = raw.description || raw.story || '';
  const contributors = Number(raw.contributors ?? 0);
  const goalDeliveries = Number(raw.goal_deliveries ?? raw.goalDeliveries ?? Math.max(1, Math.round(goalXAF / 60000)));
  const status = ['active', 'completed', 'draft'].includes(raw.status) ? raw.status : raw.status === 'inactive' ? 'completed' : 'active';
  const slug = raw.slug || title.replace(/\s+/g, '') || raw.id || '';

  return {
    id: raw.id || raw.uuid || slug,
    donorId: raw.donor_id || raw.donorId || 'donor-unknown',
    donorName,
    donorAvatar,
    title,
    eventType: ['birthday', 'wedding', 'graduation', 'promotion'].includes(eventType) ? eventType as Campaign['eventType'] : 'other',
    story,
    goalDeliveries,
    raisedXAF,
    goalXAF,
    contributors,
    status: status as Campaign['status'],
    createdAt,
    expiresAt,
    slug,
    coverColor,
  };
}

export function normalizeBeneficiaryResponse(raw: any) {
  const dateOfBirth = raw.date_of_birth || raw.dateOfBirth || '';
  const createdAt = raw.created_at || raw.createdAt || '';
  const city = raw.city || '';
  const region = raw.region || '';
  const community = city && region ? `${city}, ${region}` : region || city || '';

  return {
    ...raw,
    id: raw.id || raw.uuid || '',
    fullName: raw.full_name || raw.fullName || '',
    healthId: raw.digital_health_id || raw.health_id || raw.healthId || '',
    community,
    age: dateOfBirth ? new Date().getFullYear() - new Date(dateOfBirth).getFullYear() : 0,
    enrolledAt: createdAt.split('T')[0] || '',
    status: raw.status || 'awaiting_match',
    gestationalWeek: Number(raw.gestational_week ?? raw.gestationalWeek ?? 0),
    complications: raw.complications || 'No reported complications',
    notes: raw.notes || '',
  };
}

function getColorFromString(value: string): string {
  const colors = ['#1DB1DB', '#1D38DB', '#471DDB', '#1CDBC9', '#1D75DB'];
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length];
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
