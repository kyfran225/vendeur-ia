import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Package, Clock, CheckCircle2, XCircle, Truck, Banknote, User, Calendar, Loader2, Search, Filter, MoreVertical, ExternalLink, Plus, MapPin, CreditCard, Receipt, Download, CalendarDays, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { useMerchant } from "@/hooks/useMerchant";
import { OrderCreationModal } from "@/features/orders/OrderCreationModal";
import { OrderReceiptModal } from "@/features/orders/OrderReceiptModal";
import { DeliveryDispatchModal } from "@/features/orders/DeliveryDispatchModal";
import { PaymentProofAuditorModal } from "@/features/orders/PaymentProofAuditorModal";
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
  pending: <Clock size={12} className="shrink-0" />,
  confirmed: <Package size={12} className="shrink-0" />,
  paid: <Banknote size={12} className="shrink-0" />,
  delivered: <Truck size={12} className="shrink-0" />,
  cancelled: <XCircle size={12} className="shrink-0" />,
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
  const merchantCurrency = useMerchantCurrency();
  const queryClient = useQueryClient();
  const businessCategory = tempData?.category || "fashion";
  const config = BUSINESS_CONFIGS[businessCategory] || BUSINESS_CONFIGS.default;

  const [filter, setFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all"); // all, today, week, month
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);
  const [selectedDispatchOrder, setSelectedDispatchOrder] = useState<any>(null);
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false);
  const merchant = useMerchant();
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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);

    return orders.filter((o: any) => {
      const matchesFilter = filter === "all" || o.status === filter;

      const orderTime = new Date(o.createdAt).getTime();
      let matchesTime = true;
      if (timeRange === "today") matchesTime = orderTime >= today;
      else if (timeRange === "week") matchesTime = orderTime >= oneWeekAgo;
      else if (timeRange === "month") matchesTime = orderTime >= oneMonthAgo;

      const matchesSearch = !search ||
        o.customerId?.phone?.includes(search) ||
        o.shippingAddress?.toLowerCase().includes(search.toLowerCase()) ||
        o.items?.some((i: any) => i.name.toLowerCase().includes(search.toLowerCase()));

      return matchesFilter && matchesTime && matchesSearch;
    });
  }, [orders, filter, timeRange, search]);

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("Aucune commande à exporter.");
      return;
    }

    const headers = ["ID Commande", "Date", "Client", "Articles", "Total", "Devise", "Statut", "Adresse Livraison", "Paiement", "Livreur"];
    const rows = filteredOrders.map((o: any) => [
      `#${o._id.toString().slice(-6).toUpperCase()}`,
      new Date(o.createdAt).toLocaleDateString("fr-FR"),
      o.customerId?.phone || "Inconnu",
      o.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(" | ") || "",
      o.totalAmount || 0,
      o.currency || merchantCurrency,
      o.status,
      o.shippingAddress || "",
      o.paymentMethod || "",
      o.deliveryGuyPhone || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map((e: any[]) => e.map((val: any) => `"${val}"`).join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `commandes_${merchant?.businessName || "export"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV téléchargé ! 📊");
  };

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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShieldModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-4 h-12 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all"
            title="Ouvrir le registre d'audit et scanner Shield OCR"
          >
            <Shield size={18} className="animate-pulse" />
            <span className="hidden sm:inline">Shield Preuves IA</span>
            <span className="sm:hidden">Shield</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-vendeur-emerald text-vendeur-coal px-5 h-12 rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-vendeur-emerald/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span>Nouvelle {config.orderLabel}</span>
          </button>

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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input
            className="w-full bg-vendeur-coal/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-vendeur-emerald/50 transition-all shadow-xl"
            placeholder="Rechercher par client, article ou lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Time Range Selector */}
          <div className="flex items-center bg-vendeur-coal/60 border border-white/10 rounded-2xl p-1 shadow-lg">
            {[
              { id: "all", label: "Tout" },
              { id: "today", label: "Aujourd'hui" },
              { id: "week", label: "7 jours" },
              { id: "month", label: "30 jours" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap",
                  timeRange === t.id
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="h-11 px-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0"
            title="Exporter en CSV / Excel"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
        </div>
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
            <div key={order._id} className="bg-vendeur-coal/40 border border-white/5 rounded-2xl lg:rounded-[2rem] p-4 lg:p-6 hover:border-white/10 transition-all group shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
                
                {/* 1. Client & Delivery Meta Info */}
                <div className="flex items-start gap-3.5 lg:w-72 xl:w-80 shrink-0">
                  <div className="h-11 w-11 lg:h-12 lg:w-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 shrink-0 border border-white/5">
                    <User size={22} className="shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-base lg:text-lg text-white truncate">{order.customerId?.phone || "Client inconnu"}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Calendar size={12} className="shrink-0" />
                        <span className="text-[10px] uppercase font-bold">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {(order.shippingAddress || order.customerId?.location) && (
                        <div className="flex items-center gap-1 text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px] font-bold max-w-[200px] truncate">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{order.shippingAddress || order.customerId?.location}</span>
                        </div>
                      )}
                      {order.paymentMethod && (
                        <div className="flex items-center gap-1 text-white/50 bg-white/5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0">
                          <CreditCard size={10} className="shrink-0" />
                          <span>{order.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Items and Total Summary */}
                <div className="flex-1 lg:px-8 border-t lg:border-t-0 lg:border-l border-white/5 pt-3 lg:pt-0">
                  <div className="space-y-1.5">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-white/70 font-medium truncate pr-3">{item.quantity}x {item.name}</span>
                        <span className="text-white font-bold shrink-0">{item.price.toLocaleString()} {order.currency || merchantCurrency}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                       <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Total</span>
                       <span className="text-lg lg:text-xl font-black text-emerald-400">{order.totalAmount.toLocaleString()} {order.currency || merchantCurrency}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Status & Actions Bar */}
                <div className="border-t lg:border-t-0 lg:border-l border-white/5 pt-3 lg:pt-0 lg:pl-8 flex flex-col gap-2.5 shrink-0">
                  
                  {/* Status Badge */}
                  <div className="flex items-center justify-between lg:justify-start gap-3">
                    <div className={cn(
                      "px-3.5 py-1.5 lg:py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0",
                      statusColors[order.status]
                    )}>
                      {statusIcons[order.status]}
                      <span>{statusLabels[order.status]}</span>
                    </div>
                  </div>

                  {/* Action Buttons: 3 on same line on mobile, flex row on desktop */}
                  <div className="space-y-2 w-full lg:w-auto">
                    
                    {/* Primary 3 Action Buttons in 1 Row */}
                    <div className="grid grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 w-full">
                      {/* 1. Reçu */}
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="h-10 px-3 rounded-xl bg-white/5 text-white/85 border border-white/10 hover:bg-white/10 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                        title="Imprimer ou partager le Bon de commande"
                      >
                        <Receipt size={14} className="text-white/60 shrink-0" />
                        <span className="truncate">Reçu</span>
                      </button>

                      {/* 2. Livreur */}
                      {order.status !== "delivered" && order.status !== "cancelled" ? (
                        <button
                          onClick={() => setSelectedDispatchOrder(order)}
                          className="h-10 px-3 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/25 hover:bg-purple-500 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                          title="Assigner un livreur (WhatsApp)"
                        >
                          <Truck size={14} className="shrink-0" />
                          <span className="truncate">Livreur</span>
                        </button>
                      ) : (
                        <div className="hidden lg:hidden" />
                      )}

                      {/* 3. Action de Validation (Encaissé ou Livré) */}
                      {order.status === "pending" ? (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order._id, status: "paid" })}
                          className="h-10 px-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                          title="Marquer comme payée / Encaissée"
                        >
                          <Banknote size={14} className="shrink-0" />
                          <span className="truncate">Encaissé</span>
                        </button>
                      ) : order.status === "paid" ? (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order._id, status: "delivered" })}
                          className="h-10 px-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                          title="Marquer comme livrée"
                        >
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="truncate">Livré</span>
                        </button>
                      ) : null}
                    </div>

                    {/* Dedicated Cancel Row at the Bottom */}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: order._id, status: "cancelled" })}
                        className="w-full h-9 px-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        title="Annuler la commande"
                      >
                        <XCircle size={14} className="shrink-0" />
                        <span>Annuler la commande</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isCreateOpen && (
        <OrderCreationModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}

      {selectedReceiptOrder && (
        <OrderReceiptModal
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
          order={selectedReceiptOrder}
          merchant={merchant}
        />
      )}

      {selectedDispatchOrder && (
        <DeliveryDispatchModal
          isOpen={!!selectedDispatchOrder}
          onClose={() => setSelectedDispatchOrder(null)}
          order={selectedDispatchOrder}
        />
      )}

      {isShieldModalOpen && (
        <PaymentProofAuditorModal
          isOpen={isShieldModalOpen}
          onClose={() => setIsShieldModalOpen(false)}
        />
      )}
    </div>
  );
}
