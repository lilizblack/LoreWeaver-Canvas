import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserTier = 'spark' | 'pro' | 'byoh';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

interface UserState {
  tier: UserTier;
  customFirebaseConfig: FirebaseConfig | null;
  weaverProPaymentInfo: { date: number; method: 'stripe' | 'paypal'; transactionId: string } | null;
  setTier: (tier: UserTier) => void;
  setCustomFirebaseConfig: (config: FirebaseConfig | null) => void;
  setWeaverProPaymentInfo: (info: { date: number; method: 'stripe' | 'paypal'; transactionId: string } | null) => void;
  resetUser: () => void;
  isSettingsOpen: boolean;
  settingsTab: 'hosting' | 'billing';
  setSettingsOpen: (open: boolean, tab?: 'hosting' | 'billing') => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      tier: 'spark',
      customFirebaseConfig: null,
      weaverProPaymentInfo: null,
      setTier: (tier) => set({ tier }),
      setCustomFirebaseConfig: (config) => set({ customFirebaseConfig: config }),
      setWeaverProPaymentInfo: (info) => set({ weaverProPaymentInfo: info }),
      resetUser: () => set({ tier: 'spark', customFirebaseConfig: null, weaverProPaymentInfo: null }),
      isSettingsOpen: false,
      settingsTab: 'hosting',
      setSettingsOpen: (open, tab = 'hosting') => set({ isSettingsOpen: open, settingsTab: tab }),
    }),
    {
      name: 'loreweaver-user-storage',
      partialize: (state) => ({
        tier: state.tier,
        customFirebaseConfig: state.customFirebaseConfig,
        weaverProPaymentInfo: state.weaverProPaymentInfo,
      }),
    }
  )
);
