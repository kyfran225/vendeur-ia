import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Merchant } from "@vendeur-ia/core";

interface AuthState {
  user: any | null;
  merchant: Merchant | null;
  accessToken: string | null;
  setSession: (session: { user: any; merchant?: Merchant; accessToken: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      merchant: null,
      accessToken: null,
      setSession: (session) => set({
        user: session.user,
        merchant: session.merchant || null,
        accessToken: session.accessToken
      }),
      logout: () => set({ user: null, merchant: null, accessToken: null }),
    }),
    {
      name: "vendeur-ia-auth",
    }
  )
);
