import { useAuthStore } from "@/stores/authStore";

/**
 * Hook to determine if the current user has Founder/Admin privileges.
 * Used to bypass merchant onboarding and show system governance tools.
 */
export function useFounderRole() {
  const { user } = useAuthStore();

  const rawPhone = (user?.whatsappNumber || "").replace(/\D/g, "");
  const rawEmail = (user?.email || "").toLowerCase();

  // 0505111157: Master Admin (Tableau de bord et Menu Admin / Nexus)
  const isMasterAdmin = Boolean(
    rawPhone.endsWith("5111157") ||
    rawPhone.includes("5111157") ||
    rawEmail === "franck@vendeur-ia.com" ||
    rawEmail === "kyfran6@gmail.com"
  );

  // 0102273966: Marchand Fondateur (Auth Fondateur + Dashboard & Menu Marchand)
  const isFounderMerchant = Boolean(
    rawPhone.endsWith("0102273966") ||
    rawPhone.endsWith("02273966") ||
    rawPhone.endsWith("102273966")
  );

  const isFounder = isMasterAdmin || isFounderMerchant || Boolean(user?.roles?.includes("admin") || user?.roles?.includes("creator"));

  return {
    isFounder,
    isMasterAdmin,
    isFounderMerchant,
    isAdmin: isMasterAdmin,
    role: isMasterAdmin ? "founder" : "merchant"
  };
}
