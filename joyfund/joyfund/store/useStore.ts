import { create } from 'zustand';
import { campaigns as initialCampaigns, contributions as initialContributions, beneficiaries as initialBeneficiaries, vouchers as initialVouchers, Campaign, Contribution, Beneficiary, Voucher } from '@/lib/mockData';

export type UserRole = 'guest' | 'donor' | 'contributor' | 'social_worker' | 'receptionist' | 'nurse' | 'admin' | 'hospital_admin';

interface AppState {
  // Auth
  currentRole: UserRole;
  currentUser: { name: string; id: string } | null;
  setRole: (role: UserRole, user?: { name: string; id: string }) => void;
  logout: () => void;

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;

  // Contributions
  contributions: Contribution[];
  addContribution: (contribution: Contribution) => void;

  // Beneficiaries
  beneficiaries: Beneficiary[];
  addBeneficiary: (beneficiary: Beneficiary) => void;
  updateBeneficiary: (id: string, updates: Partial<Beneficiary>) => void;

  // Vouchers
  vouchers: Voucher[];
  addVoucher: (voucher: Voucher) => void;
  updateVoucher: (id: string, updates: Partial<Voucher>) => void;

  // UI
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentRole: 'guest',
  currentUser: null,
  setRole: (role, user) => set({ currentRole: role, currentUser: user || null }),
  logout: () => set({ currentRole: 'guest', currentUser: null }),

  campaigns: initialCampaigns,
  addCampaign: (campaign) => set((s) => ({ campaigns: [campaign, ...s.campaigns] })),
  updateCampaign: (id, updates) =>
    set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)) })),

  contributions: initialContributions,
  addContribution: (contribution) =>
    set((s) => {
      const updatedCampaigns = s.campaigns.map((c) =>
        c.id === contribution.campaignId
          ? { ...c, raisedXAF: c.raisedXAF + contribution.amountXAF, contributors: c.contributors + 1 }
          : c
      );
      return { contributions: [contribution, ...s.contributions], campaigns: updatedCampaigns };
    }),

  beneficiaries: initialBeneficiaries,
  addBeneficiary: (b) => set((s) => ({ beneficiaries: [b, ...s.beneficiaries] })),
  updateBeneficiary: (id, updates) =>
    set((s) => ({ beneficiaries: s.beneficiaries.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),

  vouchers: initialVouchers,
  addVoucher: (v) => set((s) => ({ vouchers: [v, ...s.vouchers] })),
  updateVoucher: (id, updates) =>
    set((s) => ({ vouchers: s.vouchers.map((v) => (v.id === id ? { ...v, ...updates } : v)) })),

  toast: null,
  showToast: (message, type = 'success') => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
}));
