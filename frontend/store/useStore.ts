import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  campaigns as initialCampaigns,
  contributions as initialContributions,
  beneficiaries as initialBeneficiaries,
  vouchers as initialVouchers,
  Campaign,
  Contribution,
  Beneficiary,
  Voucher,
} from '@/lib/mockData';

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

      // ── Campaigns ───────────────────────────
      campaigns: initialCampaigns,

      addCampaign: (campaign) =>
        set((s) => ({ campaigns: [campaign, ...s.campaigns] })),

      updateCampaign: (id, updates) =>
        set((s) => ({
          campaigns: s.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      // ── Contributions ───────────────────────
      contributions: initialContributions,

      addContribution: (contribution) =>
        set((s) => {
          const updatedCampaigns = s.campaigns.map((c) =>
            c.id === contribution.campaignId
              ? {
                  ...c,
                  raisedXAF:    c.raisedXAF + contribution.amountXAF,
                  contributors: c.contributors + 1,
                }
              : c
          );
          return {
            contributions: [contribution, ...s.contributions],
            campaigns:     updatedCampaigns,
          };
        }),

      // ── Beneficiaries ───────────────────────
      beneficiaries: initialBeneficiaries,

      addBeneficiary: (b) =>
        set((s) => ({ beneficiaries: [b, ...s.beneficiaries] })),

      updateBeneficiary: (id, updates) =>
        set((s) => ({
          beneficiaries: s.beneficiaries.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      // ── Vouchers ────────────────────────────
      vouchers: initialVouchers,

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