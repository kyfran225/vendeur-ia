import { useQueryClient } from "@tanstack/react-query";

/**
 * Returns the currency code (e.g. XOF, NGN, GHS, XAF, KES, EUR, USD…)
 * for the currently authenticated merchant.
 * Falls back to "XOF" only if the merchant data hasn't loaded yet.
 *
 * Reads from the TanStack Query cache keyed by ["dashboard"] to avoid
 * an extra network request – the data is almost always already cached.
 */
export function useMerchantCurrency(): string {
  const queryClient = useQueryClient();
  const dashboard = queryClient.getQueryData<any>(["dashboard"]);
  return dashboard?.merchant?.billingCurrency || dashboard?.merchant?.currency || "XOF";
}
