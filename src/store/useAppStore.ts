import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  name: string;
  email: string;
  avatar: string;
  businessName: string;
  businessLogo?: string;
  role: 'admin' | 'user';
  license: {
    status: 'active' | 'suspended' | 'license_not_found' | 'license_tampered' | 'license_expired' | 'license_suspended';
    type: 'cloud' | 'on-premise';
    validUntil: string;
    supportPin: string;
    planName: string;
  };
}

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  login: (userData: User) => void;
  logout: () => void;
  updateBusiness: (name: string, logoUrl?: string) => void;
  updateProfile: (name: string, email: string, avatar: string) => void;
  toggleTheme: () => void;
  setLanguage: (lang: 'es' | 'en') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      theme: 'light',
      language: 'es',
      login: (userData) => set({ 
        isAuthenticated: true,
        user: userData
      }),
      logout: () => set({ isAuthenticated: false, user: null }),
      updateBusiness: (name, logoUrl) => set((state) => ({
        user: state.user ? { ...state.user, businessName: name, businessLogo: logoUrl } : null
      })),
      updateProfile: (name, email, avatar) => set((state) => ({
        user: state.user ? { ...state.user, name, email, avatar } : null
      })),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      setLanguage: (lang) => set({ language: lang })
    }),
    {
      name: 'nexus-core-storage', // key in localStorage
    }
  )
);
