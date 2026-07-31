import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingState {
  draft: {
    businessName: string;
    category: string;
    whatsappNumber: string;
    city: string;
    address: string;
    countryCode: string;
    description: string;
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
        city: "Abidjan",
        address: "",
        countryCode: "CI",
        description: "",
        paymentChannels: [],
      },
      setDraft: (newDraft) => set((state) => ({ draft: { ...state.draft, ...newDraft } })),
      clearDraft: () => set({
        draft: {
          businessName: "",
          category: "fashion",
          whatsappNumber: "",
          city: "Abidjan",
          address: "",
          countryCode: "CI",
          description: "",
          paymentChannels: [],
        }
      }),
    }),
    {
      name: "vendeur-ia-onboarding",
    }
  )
);
