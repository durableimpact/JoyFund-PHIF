import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeCampaignResponse, normalizeBeneficiaryResponse } from '@/lib/utils';

// Local lightweight types (avoid runtime dependency on mockData)
export interface Campaign {
  id: string;
  donorId?: string;
  donorName?: string;
  donorAvatar?: string;
  title: string;
  story?: string;
  eventType?: string;
  raisedXAF: number;
  goalXAF: number;
  contributors?: number;
  goalDeliveries?: number;
  status?: string;
  coverColor?: string;
  createdAt?: string;
  expiresAt?: string;
  slug?: string;
}

export interface Contribution {
  id: string;
  campaignId: string;
  amountXAF: number;
  donorName?: string;
  createdAt?: string;
}

export interface Beneficiary {
  id: string;
  fullName?: string;
  healthId?: string;
  community?: string;
  age?: number;
  enrolledAt?: string;
  status?: string;
  gestationalWeek?: number;
  complications?: string;
  notes?: string;
}

export interface Voucher {
  id: string;
  amountXAF?: number;
  hospitalId?: string;
  status?: string;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type UserRole =
  | 'guest'
  | 'donor'
  | 'contributor'
  | 'social_worker'
  | 'receptionist'
  | 'nurse'
  | 'admin'
  | 'hospital_admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  hospitalId?: string;   // for receptionist, nurse, hospital_admin
  avatarUrl?: string;
}

// What Django JWT returns on login/register
export interface DjangoAuthResponse {
  access: string;          // JWT access token
  refresh: string;         // JWT refresh token
  user: AuthUser;
}

// ─────────────────────────────────────────────
// State Interface
// ─────────────────────────────────────────────

interface AppState {

  // ── Auth ──────────────────────────────────
  currentRole: UserRole;
  currentUser: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  /** Call this after a successful Django login or register response */
  login: (payload: DjangoAuthResponse) => void;

  /** Clears all auth state — call on logout or 401 */
  logout: () => void;

  /** Update access token after a silent refresh (djangorestframework-simplejwt /token/refresh/) */
  setAccessToken: (token: string) => void;

  /** Update refresh token */
  setRefreshToken: (token: string) => void;

  // ── Campaigns ─────────────────────────────
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;

  // ── Contributions ─────────────────────────
  contributions: Contribution[];
  addContribution: (contribution: Contribution) => void;

  // ── Beneficiaries ─────────────────────────
  beneficiaries: Beneficiary[];
  addBeneficiary: (beneficiary: Beneficiary) => void;
  updateBeneficiary: (id: string, updates: Partial<Beneficiary>) => void;

  // ── Vouchers ──────────────────────────────
  vouchers: Voucher[];
  addVoucher: (voucher: Voucher) => void;
  updateVoucher: (id: string, updates: Partial<Voucher>) => void;

  // Hydrate store from backend APIs
  loadInitialData: () => Promise<void>;

  // ── UI ────────────────────────────────────
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

// ─────────────────────────────────────────────
// Role → default redirect map (used by login/register pages)
// ─────────────────────────────────────────────

export const ROLE_HOME: Record<UserRole, string> = {
  guest:          '/',
  donor:          '/dashboard',
  contributor:    '/explore',
  social_worker:  '/social-worker/dashboard',
  receptionist:   '/hospital/receptionist',
  nurse:          '/hospital/nurse',
  hospital_admin: '/hospital-admin/dashboard',
  admin:          '/admin/dashboard',
};

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set) => ({

      // ── Auth ────────────────────────────────
      currentRole:     'guest',
      currentUser:     null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      login: ({ access, refresh, user }) =>
        set({
          currentRole:     user.role,
          currentUser:     user,
          accessToken:     access,
          refreshToken:    refresh,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          currentRole:     'guest',
          currentUser:     null,
          accessToken:     null,
          refreshToken:    null,
          isAuthenticated: false,
        }),

      setAccessToken: (token) => set({ accessToken: token }),

      setRefreshToken: (token) => set({ refreshToken: token }),

      // ── Campaigns ───────────────────────────
      campaigns: [],

      addCampaign: (campaign) =>
        set((s) => ({ campaigns: [campaign, ...s.campaigns] })),

      updateCampaign: (id, updates) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      // ── Contributions ───────────────────────
      contributions: [],

      addContribution: (contribution) =>
        set((s) => {
          const updatedCampaigns = s.campaigns.map((c) =>
            c.id === contribution.campaignId
              ? {
                  ...c,
                  raisedXAF:    (c.raisedXAF ?? 0) + contribution.amountXAF,
                  contributors: (c.contributors ?? 0) + 1,
                }
              : c
          );
          return {
            contributions: [contribution, ...s.contributions],
            campaigns:     updatedCampaigns,
          };
        }),

      // ── Beneficiaries ───────────────────────
      beneficiaries: [],

      addBeneficiary: (b) =>
        set((s) => ({ beneficiaries: [b, ...s.beneficiaries] })),

      updateBeneficiary: (id, updates) =>
        set((s) => ({
          beneficiaries: s.beneficiaries.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      // ── Vouchers ────────────────────────────
      vouchers: [],

      // Hydration: load initial data from backend APIs and normalize
      loadInitialData: async () => {
        try {
          // Campaigns
          const campRes = await fetch('/api/campaigns');
          if (campRes.ok) {
            const json = await campRes.json();
            const raw = Array.isArray(json) ? json : json.results || [];
            const camps = raw.map((r: any) => normalizeCampaignResponse(r));
            set({ campaigns: camps });
          }

          // Beneficiaries
          const benRes = await fetch('/api/beneficiaries');
          if (benRes.ok) {
            const json = await benRes.json();
            const raw = Array.isArray(json) ? json : json.results || [];
            const bens = raw.map((r: any) => normalizeBeneficiaryResponse(r));
            set({ beneficiaries: bens });
          }

          // Contributions (best-effort, many backends expose this under different names)
          try {
            const contribRes = await fetch('/api/contributions');
            if (contribRes.ok) {
              const json = await contribRes.json();
              const raw = Array.isArray(json) ? json : json.results || [];
              const contribs = raw.map((r: any) => ({
                id: r.id || r.uuid || `${r.campaign_id || r.campaignId}-${Math.random()}`,
                campaignId: r.campaign_id || r.campaignId || r.campaign || '',
                amountXAF: Number(r.amount ?? r.amountXAF ?? 0),
                donorName: r.donor_name || r.donorName || 'Anonymous',
                createdAt: r.created_at || r.createdAt || '',
              }));
              set({ contributions: contribs });
            }
          } catch (e) {
            // ignore contributions if not exposed
          }

          // Vouchers (optional)
          try {
            const vRes = await fetch('/api/vouchers');
            if (vRes.ok) {
              const json = await vRes.json();
              const raw = Array.isArray(json) ? json : json.results || [];
              const vouchers = raw.map((r: any) => ({ id: r.id || r.uuid || '', amountXAF: Number(r.amount ?? r.amountXAF ?? 0), hospitalId: r.hospital_id || r.hospitalId || '', status: r.status || '' }));
              set({ vouchers });
            }
          } catch (e) {
            // ignore if not available
          }
        } catch (err) {
          // swallow — components can fallback or show error toast
          // eslint-disable-next-line no-console
          console.error('loadInitialData error', err);
        }
      },

      addVoucher: (v) =>
        set((s) => ({ vouchers: [v, ...s.vouchers] })),

      updateVoucher: (id, updates) =>
        set((s) => ({
          vouchers: s.vouchers.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        })),

      // ── UI ──────────────────────────────────
      toast: null,
      showToast: (message, type = 'success') => set({ toast: { message, type } }),
      clearToast: () => set({ toast: null }),
    }),

    {
      name: 'joyfund-auth',
      // Only persist auth — mock data is always re-hydrated from mockData.ts
      partialize: (s) => ({
        currentRole:     s.currentRole,
        currentUser:     s.currentUser,
        accessToken:     s.accessToken,
        refreshToken:    s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

// ─────────────────────────────────────────────
// Typed selectors  (use these in components — avoids full re-renders)
// ─────────────────────────────────────────────

export const selectAuth = (s: AppState) => ({
  user:            s.currentUser,
  role:            s.currentRole,
  isAuthenticated: s.isAuthenticated,
  accessToken:     s.accessToken,
});

export const selectCampaigns    = (s: AppState) => s.campaigns;
export const selectContributions = (s: AppState) => s.contributions;
export const selectBeneficiaries = (s: AppState) => s.beneficiaries;
export const selectVouchers      = (s: AppState) => s.vouchers;