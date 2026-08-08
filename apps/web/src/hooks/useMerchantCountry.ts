import { useQueryClient } from "@tanstack/react-query";
import { COUNTRIES, CountryData } from "@vendeur-ia/core";

/**
 * Returns the country data for the currently authenticated merchant.
 * Falls back to Côte d'Ivoire (CI) if not found.
 */
export function useMerchantCountry(): CountryData {
  const queryClient = useQueryClient();
  const dashboard = queryClient.getQueryData<any>(["dashboard"]);
  const countryCode = dashboard?.merchant?.country || "CI";

  return COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
}
