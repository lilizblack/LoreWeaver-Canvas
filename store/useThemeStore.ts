import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type FontSize = 'sm' | 'md' | 'lg' | 'xl';

interface ThemeState {
  theme: Theme;
  fontSize: FontSize;
  toggleTheme: () => void;
  setFontSize: (size: FontSize) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      fontSize: 'md',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    { name: 'loreweaver-theme' }
  )
);
