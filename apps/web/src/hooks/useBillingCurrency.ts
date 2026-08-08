import { useQueryClient } from "@tanstack/react-query";

/**
 * Returns the billing currency code (e.g. XOF, NGN, GHS, XAF, KES, EUR, USD…)
 * for the currently authenticated merchant.
 * Falls back to "XOF" if not defined.
 */
export function useBillingCurrency(): string {
  const queryClient = useQueryClient();
  const dashboard = queryClient.getQueryData<any>(["dashboard"]);
  return dashboard?.merchant?.billingCurrency || dashboard?.merchant?.currency || "XOF";
}
