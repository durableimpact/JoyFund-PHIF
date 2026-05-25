// ============================================================
// JoyFund Mock Data — All static data for frontend simulation
// ============================================================

export type CampaignStatus = 'active' | 'completed' | 'draft';
export type VoucherStatus = 'generated' | 'issued' | 'redeemed' | 'expired' | 'void';
export type BeneficiaryStatus = 'awaiting_match' | 'voucher_issued' | 'care_received';
export type HospitalStatus = 'active' | 'pending' | 'suspended';

export interface Campaign {
  id: string;
  donorId: string;
  donorName: string;
  donorAvatar: string;
  title: string;
  eventType: 'birthday' | 'wedding' | 'graduation' | 'promotion' | 'other';
  story: string;
  goalDeliveries: number;
  raisedXAF: number;
  goalXAF: number;
  contributors: number;
  status: CampaignStatus;
  createdAt: string;
  expiresAt: string;
  slug: string;
  coverColor: string;
}

export interface Contribution {
  id: string;
  campaignId: string;
  contributorName: string;
  amountXAF: number;
  timestamp: string;
  paymentMethod: 'mtn_momo' | 'orange_money';
  phone: string;
  anonymous: boolean;
  reference: string;
}

export interface Beneficiary {
  id: string;
  healthId: string;
  fullName: string;
  age: number;
  phone: string;
  community: string;
  gestationalWeek: number;
  complications: string;
  enrolledBy: string;
  enrolledAt: string;
  status: BeneficiaryStatus;
  voucherId?: string;
  notes: string;
}

export interface Voucher {
  id: string;
  code: string;
  beneficiaryId: string;
  beneficiaryName: string;
  campaignId: string;
  hospitalId: string;
  hospitalName: string;
  amountXAF: number;
  status: VoucherStatus;
  services: string[];
  generatedAt: string;
  redeemedAt?: string;
  patientPin: string;
}

export interface Hospital {
  id: string;
  name: string;
  region: string;
  address: string;
  momoAccount: string;
  contact: string;
  status: HospitalStatus;
  accreditationNumber: string;
  vouchersRedeemed: number;
  totalPaidOutXAF: number;
  lastActivity: string;
}

export interface Staff {
  id: string;
  hospitalId: string;
  name: string;
  role: 'receptionist' | 'nurse' | 'hospital_admin';
  status: 'active' | 'inactive';
  lastActive: string;
  staffId: string;
}

// ── Campaigns ───────────────────────────────────────────────
export const campaigns: Campaign[] = [
  {
    id: 'camp-001',
    donorId: 'donor-001',
    donorName: 'Jean-Pierre Mbarga',
    donorAvatar: 'JM',
    title: 'Jean-Pierre\'s 30th Birthday JoyFund',
    eventType: 'birthday',
    story: 'This year I turn 30 and instead of gifts, I want to give the gift of life. Every contribution to my JoyFund will help a pregnant woman in our community access safe, dignified healthcare. Join me in making this birthday truly meaningful.',
    goalDeliveries: 3,
    raisedXAF: 127500,
    goalXAF: 180000,
    contributors: 24,
    status: 'active',
    createdAt: '2026-03-15',
    expiresAt: '2026-05-15',
    slug: 'JeanPierreBirthday',
    coverColor: '#1DB1DB',
  },
  {
    id: 'camp-002',
    donorId: 'donor-002',
    donorName: 'Solange Nkemdirim',
    donorAvatar: 'SN',
    title: 'Solange & Eric\'s Wedding Joy',
    eventType: 'wedding',
    story: 'Our wedding day is a celebration of love, and we want that love to ripple outward. Instead of traditional gifts, please contribute to our JoyFund to help mothers who deserve a safe delivery as much as we deserve a beautiful life together.',
    goalDeliveries: 5,
    raisedXAF: 234000,
    goalXAF: 300000,
    contributors: 47,
    status: 'active',
    createdAt: '2026-03-01',
    expiresAt: '2026-06-01',
    slug: 'SolangeEricWedding',
    coverColor: '#1D38DB',
  },
  {
    id: 'camp-003',
    donorId: 'donor-003',
    donorName: 'Fabrice Tchinda',
    donorAvatar: 'FT',
    title: 'Fabrice\'s Promotion JoyFund',
    eventType: 'promotion',
    story: 'I just got promoted to Senior Engineer! My first act as a leader? Launching a JoyFund. This promotion means nothing if I cannot use this moment to uplift others. Let\'s fund safe deliveries for women who have none of the privileges I enjoy.',
    goalDeliveries: 2,
    raisedXAF: 89000,
    goalXAF: 120000,
    contributors: 18,
    status: 'active',
    createdAt: '2026-04-01',
    expiresAt: '2026-07-01',
    slug: 'FabricePromotion',
    coverColor: '#471DDB',
  },
  {
    id: 'camp-004',
    donorId: 'donor-004',
    donorName: 'Amina Bello',
    donorAvatar: 'AB',
    title: 'Amina\'s Graduation JoyFund',
    eventType: 'graduation',
    story: 'Four years of hard work culminated in my medical degree. Now it\'s time to give back before I\'ve even started practicing. Help me celebrate by funding the care I\'ll one day provide.',
    goalDeliveries: 4,
    raisedXAF: 300000,
    goalXAF: 240000,
    contributors: 63,
    status: 'completed',
    createdAt: '2026-01-10',
    expiresAt: '2026-03-10',
    slug: 'AminaGraduation',
    coverColor: '#1CDBC9',
  },
];

// ── Contributions ────────────────────────────────────────────
export const contributions: Contribution[] = [
  { id: 'cont-001', campaignId: 'camp-001', contributorName: 'Marie Nguemo', amountXAF: 5000, timestamp: '2026-04-11T14:32:00Z', paymentMethod: 'mtn_momo', phone: '6771****', anonymous: false, reference: 'REF-2026041114320' },
  { id: 'cont-002', campaignId: 'camp-001', contributorName: 'Anonymous', amountXAF: 10000, timestamp: '2026-04-10T09:15:00Z', paymentMethod: 'orange_money', phone: '9542****', anonymous: true, reference: 'REF-2026041009150' },
  { id: 'cont-003', campaignId: 'camp-001', contributorName: 'Paul Eto\'o', amountXAF: 2000, timestamp: '2026-04-09T18:45:00Z', paymentMethod: 'mtn_momo', phone: '6789****', anonymous: false, reference: 'REF-2026040918450' },
  { id: 'cont-004', campaignId: 'camp-001', contributorName: 'Chantal Mfoumou', amountXAF: 1000, timestamp: '2026-04-08T11:20:00Z', paymentMethod: 'mtn_momo', phone: '6712****', anonymous: false, reference: 'REF-2026040811200' },
  { id: 'cont-005', campaignId: 'camp-002', contributorName: 'Robert Fouda', amountXAF: 15000, timestamp: '2026-04-12T07:00:00Z', paymentMethod: 'orange_money', phone: '9534****', anonymous: false, reference: 'REF-2026041207000' },
  { id: 'cont-006', campaignId: 'camp-003', contributorName: 'Nathalie Biya', amountXAF: 5000, timestamp: '2026-04-11T16:00:00Z', paymentMethod: 'mtn_momo', phone: '6756****', anonymous: false, reference: 'REF-2026041116000' },
];

// ── Beneficiaries ────────────────────────────────────────────
export const beneficiaries: Beneficiary[] = [
  {
    id: 'ben-001',
    healthId: 'BEN-0042',
    fullName: 'Mama Rosine Ateba',
    age: 24,
    phone: '6723****',
    community: 'Mbalmayo, Centre Region',
    gestationalWeek: 32,
    complications: 'Mild anaemia noted',
    enrolledBy: 'SW-Alphonse',
    enrolledAt: '2026-03-20',
    status: 'care_received',
    voucherId: 'vouch-001',
    notes: 'Successfully delivered healthy baby boy on April 5th. Mother doing well.',
  },
  {
    id: 'ben-002',
    healthId: 'BEN-0056',
    fullName: 'Mama Celestine Oyono',
    age: 28,
    phone: '6745****',
    community: 'Yaoundé VI',
    gestationalWeek: 28,
    complications: 'None reported',
    enrolledBy: 'SW-Alphonse',
    enrolledAt: '2026-04-02',
    status: 'voucher_issued',
    voucherId: 'vouch-002',
    notes: 'Voucher SMS sent. Appointment scheduled at Centre Hospitalier.',
  },
  {
    id: 'ben-003',
    healthId: 'BEN-0071',
    fullName: 'Mama Grace Fokou',
    age: 19,
    phone: '6798****',
    community: 'Soa, Centre Region',
    gestationalWeek: 20,
    complications: 'First pregnancy, no ANC visits yet',
    enrolledBy: 'SW-Alphonse',
    enrolledAt: '2026-04-10',
    status: 'awaiting_match',
    notes: 'Urgently needs antenatal care. No income source.',
  },
  {
    id: 'ben-004',
    healthId: 'BEN-0082',
    fullName: 'Mama Suzanne Meke',
    age: 31,
    phone: '6767****',
    community: 'Nkolbisson, Yaoundé',
    gestationalWeek: 36,
    complications: 'Previous C-section',
    enrolledBy: 'SW-Alphonse',
    enrolledAt: '2026-04-08',
    status: 'awaiting_match',
    notes: 'High priority — due in 4 weeks. Needs pre-delivery consultation.',
  },
];

// ── Vouchers ─────────────────────────────────────────────────
export const vouchers: Voucher[] = [
  {
    id: 'vouch-001',
    code: 'JF7X2K',
    beneficiaryId: 'ben-001',
    beneficiaryName: 'Mama Rosine A.',
    campaignId: 'camp-004',
    hospitalId: 'hosp-001',
    hospitalName: 'Centre Hospitalier d\'Essos',
    amountXAF: 75000,
    status: 'redeemed',
    services: ['Prenatal Consultation', 'Delivery (Normal)', 'Postnatal Care (3 days)'],
    generatedAt: '2026-03-22',
    redeemedAt: '2026-04-05',
    patientPin: '4821',
  },
  {
    id: 'vouch-002',
    code: 'JF9M4P',
    beneficiaryId: 'ben-002',
    beneficiaryName: 'Mama Celestine O.',
    campaignId: 'camp-001',
    hospitalId: 'hosp-002',
    hospitalName: 'Hôpital de District de Biyem-Assi',
    amountXAF: 45000,
    status: 'issued',
    services: ['Prenatal Consultation (x3)', 'Delivery (Normal)'],
    generatedAt: '2026-04-03',
    patientPin: '2947',
  },
  {
    id: 'vouch-003',
    code: 'JF3R8T',
    beneficiaryId: 'ben-001',
    beneficiaryName: 'Mama Grace F.',
    campaignId: 'camp-002',
    hospitalId: 'hosp-001',
    hospitalName: 'Centre Hospitalier d\'Essos',
    amountXAF: 60000,
    status: 'generated',
    services: ['Antenatal Package (4 ANC visits)', 'Delivery'],
    generatedAt: '2026-04-11',
    patientPin: '7531',
  },
];

// ── Hospitals ────────────────────────────────────────────────
export const hospitals: Hospital[] = [
  {
    id: 'hosp-001',
    name: 'Centre Hospitalier d\'Essos',
    region: 'Centre',
    address: 'Essos, Yaoundé',
    momoAccount: 'MTN-677123456',
    contact: 'Dr. Mireille Ondoa',
    status: 'active',
    accreditationNumber: 'MIN-2022-0451',
    vouchersRedeemed: 14,
    totalPaidOutXAF: 1050000,
    lastActivity: '2026-04-05',
  },
  {
    id: 'hosp-002',
    name: 'Hôpital de District de Biyem-Assi',
    region: 'Centre',
    address: 'Biyem-Assi, Yaoundé',
    momoAccount: 'ORANGE-692345678',
    contact: 'Dr. Jean Atouba',
    status: 'active',
    accreditationNumber: 'MIN-2023-0198',
    vouchersRedeemed: 8,
    totalPaidOutXAF: 480000,
    lastActivity: '2026-04-10',
  },
  {
    id: 'hosp-003',
    name: 'Clinique La Grâce',
    region: 'Littoral',
    address: 'Akwa, Douala',
    momoAccount: 'MTN-699876543',
    contact: 'Dr. Victorine Ekambi',
    status: 'pending',
    accreditationNumber: 'MIN-2024-0033',
    vouchersRedeemed: 0,
    totalPaidOutXAF: 0,
    lastActivity: '2026-04-08',
  },
];

// ── Staff ────────────────────────────────────────────────────
export const staffMembers: Staff[] = [
  { id: 'staff-001', hospitalId: 'hosp-001', name: 'Brigitte Talla', role: 'receptionist', status: 'active', lastActive: '2026-04-12', staffId: 'REC-001' },
  { id: 'staff-002', hospitalId: 'hosp-001', name: 'Nurse Emmanuel Manga', role: 'nurse', status: 'active', lastActive: '2026-04-12', staffId: 'NUR-001' },
  { id: 'staff-003', hospitalId: 'hosp-001', name: 'Dr. Mireille Ondoa', role: 'hospital_admin', status: 'active', lastActive: '2026-04-11', staffId: 'ADM-001' },
  { id: 'staff-004', hospitalId: 'hosp-002', name: 'Pauline Nzouwe', role: 'receptionist', status: 'active', lastActive: '2026-04-10', staffId: 'REC-002' },
];

// ── Platform Stats ───────────────────────────────────────────
export const platformStats = {
  totalLivesSupported: 312,
  activeCampaigns: 47,
  totalRaisedXAF: 18_420_000,
  vouchersRedeemed: 287,
  partnerHospitals: 8,
  escrowBalanceXAF: 3_240_000,
  pendingMatches: 12,
  vouchersThisMonth: 34,
};

// ── Leaderboard ──────────────────────────────────────────────
export const leaderboard = [
  { rank: 1, name: 'Solange & Eric\'s Wedding', raisedXAF: 234000, lives: 4, eventType: 'wedding' },
  { rank: 2, name: 'Amina\'s Graduation JoyFund', raisedXAF: 300000, lives: 5, eventType: 'graduation' },
  { rank: 3, name: 'Jean-Pierre\'s 30th Birthday', raisedXAF: 127500, lives: 2, eventType: 'birthday' },
  { rank: 4, name: 'Fabrice\'s Promotion JoyFund', raisedXAF: 89000, lives: 1, eventType: 'promotion' },
  { rank: 5, name: 'Nadège\'s Anniversaire', raisedXAF: 78000, lives: 1, eventType: 'birthday' },
];

// ── Activity Feed ─────────────────────────────────────────────
export const activityFeed = [
  { id: 1, type: 'donation', message: '5,000 XAF contributed to Jean-Pierre\'s Birthday JoyFund', timeAgo: '3 mins ago' },
  { id: 2, type: 'checkin', message: 'Mama Celestine O. checked in at Hôpital de District de Biyem-Assi', timeAgo: '12 mins ago' },
  { id: 3, type: 'payout', message: '75,000 XAF disbursed to Centre Hospitalier d\'Essos', timeAgo: '1 hour ago' },
  { id: 4, type: 'enrollment', message: 'New beneficiary BEN-0082 enrolled in Nkolbisson', timeAgo: '2 hours ago' },
  { id: 5, type: 'donation', message: '15,000 XAF contributed to Solange & Eric\'s Wedding JoyFund', timeAgo: '3 hours ago' },
  { id: 6, type: 'voucher', message: 'Voucher JF3R8T generated for BEN-0071', timeAgo: '4 hours ago' },
];
