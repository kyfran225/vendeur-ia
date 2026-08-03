import React, { useState, useMemo } from "react";
import { ShoppingCart, Package, Clock, CheckCircle2, XCircle, Truck, DollarSign, User, Calendar, Loader2, Search, Filter, MoreVertical, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  delivered: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  confirmed: <Package size={14} />,
  paid: <DollarSign size={14} />,
  delivered: <Truck size={14} />,
  cancelled: <XCircle size={14} />,
};

// Adaptive Config based on business type
const BUSINESS_CONFIGS: Record<string, any> = {
  services: {
    orderLabel: "Prestation",
    ordersLabel: "Prestations",
    emptyIcon: <Calendar size={48} />,
  },
  default: {
    orderLabel: "Commande",
    ordersLabel: "Commandes",
    emptyIcon: <ShoppingCart size={48} />,
  }
};

export function OrderManager() {
  const { accessToken } = useAuthStore();
  const { tempData } = useOnboardingStore();
  const queryClient = useQueryClient();
  const businessCategory = tempData?.category || "fashion";
  const config = BUSINESS_CONFIGS[businessCategory] || BUSINESS_CONFIGS.default;

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/orders");
      return res.data;
    },
    enabled: !!accessToken
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await apiClient.patch(`/api/commerce/orders/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Statut mis à jour avec succès !");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour.");
    }
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const matchesFilter = filter === "all" || o.status === filter;
      const matchesSearch = !search ||
        o.customerId?.phone?.includes(search) ||
        o.items?.some((i: any) => i.name.toLowerCase().includes(search.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  return (
    <div className="p-4 md:p-10 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-700 pb-24 md:pb-12">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white">{config.ordersLabel}</h1>
          <p className="text-white/40 md:text-lg">Suivez vos ventes et gérez le cycle de vie de vos {config.ordersLabel.toLowerCase()}.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {["all", "pending", "paid", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border transition-all shadow-sm",
                filter === s
                  ? "bg-white text-black border-white shadow-xl scale-105"
                  : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:bg-white/10"
              )}
            >
              {s === "all" ? "Tous" : statusLabels[s]}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input
          className="w-full bg-[#0c0f0d] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all shadow-xl"
          placeholder="Rechercher par client ou produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/20">
            <Loader2 size={48} className="animate-spin" />
            <p className="font-black uppercase tracking-[0.2em] text-xs">Chargement des {config.ordersLabel.toLowerCase()}...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-white/20 text-center">
            {config.emptyIcon}
            <p className="font-black uppercase tracking-[0.2em] text-xs">Aucune {config.orderLabel.toLowerCase()} trouvée</p>
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order._id} className="bg-[#0c0f0d] border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition-all group shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">{order.customerId?.phone || "Client inconnu"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={12} className="text-white/20" />
                      <span className="text-[10px] text-white/40 uppercase font-bold">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 lg:px-8 border-t lg:border-t-0 lg:border-l border-white/5 pt-6 lg:pt-0">
                  <div className="space-y-2">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-white/60 font-medium">{item.quantity}x {item.name}</span>
                        <span className="text-white font-bold">{item.price.toLocaleString()} XOF</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total</span>
                      <span className="text-xl font-black text-emerald-400">{order.totalAmount.toLocaleString()} XOF</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 border-t lg:border-t-0 pt-6 lg:pt-0">
                  <div className={cn(
                    "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0",
                    statusColors[order.status]
                  )}>
                    {statusIcons[order.status]}
                    {statusLabels[order.status]}
                  </div>

                  <div className="flex gap-2">
                    {order.status !== "paid" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: order._id, status: "paid" })}
                        className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all"
                        title="Confirmer le paiement"
                      >
                        <DollarSign size={18} />
                      </button>
                    )}
                    {order.status !== "delivered" && order.status !== "cancelled" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: order._id, status: "delivered" })}
                        className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all"
                        title="Marquer comme livré"
                      >
                        <Truck size={18} />
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: order._id, status: "cancelled" })}
                        className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                        title="Annuler"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
