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

  const isAdmin = isMasterAdmin || Boolean(user?.roles?.includes("admin"));
  const isFounder = isMasterAdmin || Boolean(user?.roles?.includes("creator"));

  return {
    isFounder,
    isMasterAdmin,
    isFounderMerchant: false,
    isAdmin,
    role: isMasterAdmin ? "founder" : "merchant"
  };
}
