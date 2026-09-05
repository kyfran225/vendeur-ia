import { useAuthStore } from "@/stores/authStore";

/**
 * Hook to determine if the current user has Founder/Admin privileges.
 * Used to bypass merchant onboarding and show system governance tools.
 */
export function useFounderRole() {
  const { user } = useAuthStore();

  const rawPhone = (user?.whatsappNumber || "").replace(/\D/g, "");
  const rawEmail = (user?.email || "").toLowerCase();

  const isFounder = Boolean(
    user?.roles?.includes("admin") ||
    user?.roles?.includes("creator") ||
    rawPhone.endsWith("5111157") ||
    rawPhone.includes("5111157") ||
    rawEmail === "franck@vendeur-ia.com" ||
    rawEmail === "kyfran6@gmail.com" ||
    rawEmail.includes("admin") ||
    rawEmail.includes("kyfran") ||
    rawEmail.includes("franck")
  );

  return {
    isFounder,
    isAdmin: isFounder, // Alias for convenience
    role: isFounder ? "founder" : "merchant"
  };
}
