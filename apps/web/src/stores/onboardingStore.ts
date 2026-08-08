import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OnboardingData {
  businessName: string;
  category: string;
  description: string;
  country: string;
  currency?: string;
  address: string;
  whatsappNumber: string;
  city?: string;
  paymentMethods?: string[];
  firstProduct?: {
    name: string;
    price: number;
    description?: string;
    category?: string;
    tags?: string[];
  };
  productImage?: string; // Data URL or URL
}

interface OnboardingState {
  tempData: OnboardingData | null;
  currentStep: number;
  isSimulatorActive: boolean;
  setTempData: (data: Partial<OnboardingData>) => void;
  setStep: (step: number) => void;
  setSimulatorActive: (active: boolean) => void;
  clearOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      tempData: null,
      currentStep: 0,
      isSimulatorActive: false,
      setTempData: (data) =>
        set((state) => ({
          tempData: state.tempData ? { ...state.tempData, ...data } : (data as OnboardingData),
        })),
      setStep: (step) => set({ currentStep: step }),
      setSimulatorActive: (active) => set({ isSimulatorActive: active }),
      clearOnboarding: () => set({ tempData: null, currentStep: 0, isSimulatorActive: false }),
    }),
    {
      name: "vendeur-ia-onboarding",
    }
  )
);
