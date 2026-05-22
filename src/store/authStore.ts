import { create } from 'zustand';
import { UserProfile } from '../services/userService';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  isLoggingIn: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setIsProfileComplete: (isComplete: boolean) => void;
  setIsEmailVerified: (isVerified: boolean) => void;
  setIsLoggingIn: (isLoggingIn: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isProfileComplete: true,
  isEmailVerified: true,
  isLoggingIn: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsProfileComplete: (isComplete) => set({ isProfileComplete: isComplete }),
  setIsEmailVerified: (isVerified) => set({ isEmailVerified: isVerified }),
  setIsLoggingIn: (isLoggingIn) => set({ isLoggingIn }),
}));
