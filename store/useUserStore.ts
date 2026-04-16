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
  setTier: (tier: UserTier) => void;
  setCustomFirebaseConfig: (config: FirebaseConfig | null) => void;
  resetUser: () => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      tier: 'spark',
      customFirebaseConfig: null,
      setTier: (tier) => set({ tier }),
      setCustomFirebaseConfig: (config) => set({ customFirebaseConfig: config }),
      resetUser: () => set({ tier: 'spark', customFirebaseConfig: null }),
      isSettingsOpen: false,
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
    }),
    {
      name: 'loreweaver-user-storage',
      partialize: (state) => ({
        tier: state.tier,
        customFirebaseConfig: state.customFirebaseConfig,
      }),
    }
  )
);
