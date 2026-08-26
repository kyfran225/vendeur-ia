import { useAuthStore } from "@/stores/authStore";

/**
 * Hook to determine if the current user has Founder/Admin privileges.
 * Used to bypass merchant onboarding and show system governance tools.
 */
export function useFounderRole() {
  const { user } = useAuthStore();

  const isFounder = Boolean(
    user?.roles?.includes("admin") ||
    user?.roles?.includes("creator") ||
    user?.email === "franck@vendeur-ia.com"
  );

  return {
    isFounder,
    isAdmin: isFounder, // Alias for convenience
    role: isFounder ? "founder" : "merchant"
  };
}
