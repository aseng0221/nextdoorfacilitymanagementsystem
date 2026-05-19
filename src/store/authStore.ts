import { create } from 'zustand';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setIsProfileComplete: (isComplete: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isProfileComplete: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsProfileComplete: (isComplete) => set({ isProfileComplete: isComplete }),
}));
