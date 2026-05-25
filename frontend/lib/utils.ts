import type { Campaign } from './mockData';

export function formatXAF(amount: number): string {
  if (isNaN(amount)) return '0 XAF';
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M XAF`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k XAF`;
  return `${amount.toLocaleString()} XAF`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-CM', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export function getProgressPercent(raised: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

export function eventTypeLabel(eventType: string): string {
  const MAP: Record<string, string> = {
    birthday: 'Birthday',   BIRTHDAY: 'Birthday',
    wedding: 'Wedding',     WEDDING: 'Wedding',
    graduation: 'Graduation', GRADUATION: 'Graduation',
    promotion: 'Job Promotion', PROMOTION: 'Job Promotion',
    memorial: 'Memorial',   MEMORIAL: 'Memorial',
    other: 'Celebration',   OTHER: 'Celebration',
  };
  return MAP[eventType] || eventType || 'Celebration';
}

export function statusColor(status: string): string {
  const s = (status || '').toUpperCase();
  if (['ACTIVE', 'ACTIVE', 'APPROVED', 'VERIFIED', 'CARE_RECEIVED', 'COMPLETED', 'FUNDED', 'USED', 'OPERATIONAL'].includes(s))
    return 'bg-emerald-100 text-emerald-700';
  if (['PENDING', 'AWAITING_MATCH', 'DRAFT', 'GENERATED'].includes(s))
    return 'bg-amber-100 text-amber-700';
  if (['PENDING_CONFIRMATION'].includes(s))
    return 'bg-blue-100 text-blue-700';
  if (['VOUCHER_ISSUED', 'ISSUED'].includes(s))
    return 'bg-cyan-100 text-cyan-700';
  if (['REJECTED', 'CANCELLED', 'EXPIRED', 'INACTIVE', 'FAILED', 'VOID'].includes(s))
    return 'bg-red-100 text-red-600';
  if (['SUSPENDED', 'FLAGGED'].includes(s))
    return 'bg-orange-100 text-orange-600';
  return 'bg-gray-100 text-gray-600';
}

export function statusLabel(status: string): string {
  const MAP: Record<string, string> = {
    ACTIVE: 'Active', active: 'Active',
    PENDING: 'Pending', pending: 'Pending',
    PENDING_CONFIRMATION: 'Awaiting PIN',
    APPROVED: 'Approved', approved: 'Approved',
    REJECTED: 'Rejected', rejected: 'Rejected',
    VERIFIED: 'Verified', verified: 'Verified',
    COMPLETED: 'Completed', completed: 'Completed',
    CANCELLED: 'Cancelled', cancelled: 'Cancelled',
    EXPIRED: 'Expired', expired: 'Expired',
    DRAFT: 'Draft', draft: 'Draft',
    FUNDED: 'Funded', funded: 'Funded',
    CLOSED: 'Closed', closed: 'Closed',
    USED: 'Used', used: 'Used',
    GENERATED: 'Generated',
    ISSUED: 'Issued', issued: 'Issued',
    AWAITING_MATCH: 'Awaiting Match',
    awaiting_match: 'Awaiting Match',
    VOUCHER_ISSUED: 'Voucher Issued',
    voucher_issued: 'Voucher Issued',
    CARE_RECEIVED: 'Care Received',
    care_received: 'Care Received',
    SUSPENDED: 'Suspended',
    FLAGGED: 'Flagged',
    FAILED: 'Failed',
    INACTIVE: 'Inactive',
    OPERATIONAL: 'Operational',
    VALIDATED: 'Validated',
    void: 'Void', VOID: 'Void',
  };
  return MAP[status] || status || '—';
}

/**
 * Normalize Django campaign API response to frontend Campaign shape
 */
export function normalizeCampaignResponse(raw: any): Campaign {
  return {
    id:            raw.id || '',
    donorId:       raw.donor_id || raw.donor?.id || '',
    donorName:     raw.donor_name || raw.donor?.name || 'Anonymous',
    donorAvatar:   raw.donor_avatar || (raw.donor?.first_name || 'J').charAt(0).toUpperCase(),
    title:         raw.title || 'Untitled',
    story:         raw.description || raw.story || '',
    eventType:     raw.event_type || raw.eventType || 'OTHER',
    goalDeliveries: raw.goal_deliveries || Math.round(Number(raw.goal_amount ?? raw.goalXAF ?? 0) / 60000),
    raisedXAF:     Number(raw.current_amount ?? raw.total_net_raised ?? raw.raisedXAF ?? 0),
    goalXAF:       Number(raw.goal_amount ?? raw.goalXAF ?? 0),
    contributors:  raw.contributors_count ?? raw.contributors ?? 0,
    status:        (raw.status || 'DRAFT').toLowerCase(),
    coverColor:    raw.cover_color || raw.coverColor || '#1DB1DB',
    createdAt:     raw.start_date || raw.created_at || raw.createdAt || '',
    expiresAt:     raw.end_date || raw.expiresAt || '',
    slug:          raw.slug || raw.id || '',
  };
}

/**
 * Normalize Django beneficiary API response to frontend Beneficiary shape
 */
export function normalizeBeneficiaryResponse(raw: any): any {
  return {
    id:               raw.id || '',
    fullName:         raw.full_name || raw.fullName || '—',
    healthId:         raw.digital_health_id || raw.healthId || '—',
    community:        raw.city || raw.community || '—',
    region:           raw.region || '',
    age:              raw.date_of_birth
      ? Math.floor((Date.now() - new Date(raw.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : raw.age,
    gestationalWeek:  raw.gestational_week || raw.gestationalWeek,
    complications:    raw.complications || '',
    notes:            raw.notes || '',
    status:           raw.status || 'awaiting_match',
    phone:            raw.phone || '',
    email:            raw.email || '',
    enrolledAt:       raw.created_at ? raw.created_at.split('T')[0] : raw.enrolledAt || '',
    category:         raw.category || 'OTHER',
    gender:           raw.gender || 'OTHER',
    address:          raw.address || '',
    national_id_number: raw.national_id_number || '',
    health_issues:    raw.health_issues || [],
    documents:        raw.documents || [],
  };
}
