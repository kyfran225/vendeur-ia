import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useOnboardingStore } from "./onboardingStore";

interface AuthUser {
  id: string;
  email: string;
  whatsappNumber?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  avatarUrl?: string;
  roles: string[];
  onboardingCompleted?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
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
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
      setSession: (session) => {
        const currentUser = (useAuthStore.getState() as any)?.user;
        if (!currentUser || currentUser.id !== session.user.id || currentUser.whatsappNumber !== session.user.whatsappNumber) {
          useOnboardingStore.getState().clearOnboarding();
        }
        set({
          user: session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken
        });
      },
      logout: () => {
        // Clear onboarding data as well to prevent cross-account pollution
        useOnboardingStore.getState().clearOnboarding();

        set({ user: null, accessToken: null, refreshToken: null });
      },
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
    }),
    {
      name: "vendeur-ia-auth",
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      }
    }
  )
);
