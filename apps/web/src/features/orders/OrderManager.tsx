import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Package, Clock, CheckCircle2, XCircle, Truck, Banknote, User, Calendar, Loader2, Search, Filter, MoreVertical, ExternalLink } from "lucide-react";
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
  paid: <Banknote size={14} />,
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
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const handleScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftScroll(scrollLeft > 10);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    const currentRef = tabsRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }
    window.addEventListener("resize", handleScroll);
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (tabsRef.current) {
      const activeBtn = tabsRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
      setTimeout(handleScroll, 400);
    }
  }, [filter]);

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
    <div className="p-4 md:p-10 space-y-8 md:space-y-10 max-w-6xl mx-auto animate-in fade-in duration-700 pb-24 md:pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white flex items-center gap-4">
            <ShoppingCart className="text-vendeur-emerald shrink-0" size={32} />
            {config.ordersLabel}
          </h1>
          <p className="text-white/40 text-sm md:text-lg">Suivez vos ventes et gérez le cycle de vie de vos {config.ordersLabel.toLowerCase()}.</p>
        </div>

        {/* Desktop Filter Menu */}
        <div className="hidden md:flex gap-2 p-1.5 bg-vendeur-coal/80 backdrop-blur-md rounded-3xl border border-white/10 w-fit shadow-2xl overflow-hidden">
          {[
            { id: "all", label: "Tous", icon: <Package size={18} /> },
            { id: "pending", label: "En attente", icon: <Clock size={18} /> },
            { id: "paid", label: "Payée", icon: <Banknote size={18} /> },
            { id: "delivered", label: "Livrée", icon: <Truck size={18} /> },
            { id: "cancelled", label: "Annulée", icon: <XCircle size={18} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              data-active={filter === tab.id}
              className={cn(
                "flex items-center justify-center gap-2 px-4 h-11 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 whitespace-nowrap",
                filter === tab.id
                  ? "bg-vendeur-emerald text-vendeur-coal shadow-lg"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="shrink-0">{tab.icon}</div>
              <span className="leading-none">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Mobile Navigation Onglets (Only on Mobile) */}
      <div className="md:hidden sticky top-0 z-30 -mx-4 px-4 py-3 bg-vendeur-bg/95 backdrop-blur-xl">
        <div className="relative max-w-full w-full group">
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-vendeur-coal to-transparent pointer-events-none rounded-l-2xl transition-opacity duration-300",
            showLeftScroll ? "opacity-100" : "opacity-0"
          )} />
          <div className={cn(
            "absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-vendeur-coal to-transparent pointer-events-none rounded-r-2xl transition-opacity duration-300",
            showRightScroll ? "opacity-100" : "opacity-0"
          )} />

          <div
            ref={tabsRef}
            className="flex gap-2 p-1.5 bg-vendeur-coal/80 backdrop-blur-md rounded-2xl border border-white/10 w-fit shadow-2xl overflow-x-auto no-scrollbar max-w-full relative"
          >
            {[
              { id: "all", label: "Tous", icon: <Package size={18} /> },
              { id: "pending", label: "En attente", icon: <Clock size={18} /> },
              { id: "paid", label: "Payée", icon: <Banknote size={18} /> },
              { id: "delivered", label: "Livrée", icon: <Truck size={18} /> },
              { id: "cancelled", label: "Annulée", icon: <XCircle size={18} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                data-active={filter === tab.id}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 h-12 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 whitespace-nowrap",
                  filter === tab.id
                    ? "bg-vendeur-emerald text-vendeur-coal shadow-lg"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="shrink-0">{tab.icon}</div>
                <span className="leading-none">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input
          className="w-full bg-vendeur-coal/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-vendeur-emerald/50 transition-all shadow-xl"
          placeholder="Rechercher par client ou produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-white/20">
            <Loader2 size={48} className="animate-spin text-vendeur-emerald" />
            <p className="font-black uppercase tracking-[0.2em] text-xs">Chargement des {config.ordersLabel.toLowerCase()}...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-white/20 text-center">
            {config.emptyIcon}
            <p className="font-black uppercase tracking-[0.2em] text-xs">Aucune {config.orderLabel.toLowerCase()} trouvée</p>
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order._id} className="bg-vendeur-coal/40 border border-white/5 rounded-[2rem] p-6 hover:border-white/10 transition-all group shadow-lg">
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
                        <Banknote size={18} />
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
