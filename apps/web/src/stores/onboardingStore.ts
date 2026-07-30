import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  draft: {
    businessName: string;
    category: string;
    whatsappNumber: string;
    paymentChannels: Array<{ provider: string; label: string; number: string }>;
  };
  setDraft: (draft: Partial<OnboardingState["draft"]>) => void;
  clearDraft: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: {
        businessName: "",
        category: "fashion",
        whatsappNumber: "",
        paymentChannels: [],
      },
      setDraft: (newDraft) => set((state) => ({ draft: { ...state.draft, ...newDraft } })),
      clearDraft: () => set({
        draft: { businessName: "", category: "fashion", whatsappNumber: "", paymentChannels: [] }
      }),
    }),
    {
      name: "vendeur-ia-onboarding",
    }
  )
);
