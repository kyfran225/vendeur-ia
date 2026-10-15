import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Rafraîchit automatiquement les données quand l'utilisateur revient sur l'onglet
      refetchOnWindowFocus: true,
      staleTime: 30_000, // 30 secondes avant de considérer les données comme périmées
    },
  },
});
