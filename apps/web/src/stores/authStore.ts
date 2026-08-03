import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  roles: string[];
  onboardingCompleted?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (session) => set({
        user: session.user,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken
      }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: "vendeur-ia-auth",
    }
  )
);
