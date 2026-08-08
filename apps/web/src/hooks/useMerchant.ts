import { useQueryClient } from "@tanstack/react-query";

export function useMerchant() {
  const queryClient = useQueryClient();
  const dashboard = queryClient.getQueryData<any>(["dashboard"]);
  return dashboard?.merchant;
}
