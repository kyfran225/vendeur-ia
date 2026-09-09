import React, { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Package, Clock, CheckCircle2, XCircle, Truck, Banknote, User, Calendar, Loader2, Search, Filter, MoreVertical, ExternalLink, Plus, MapPin, CreditCard, Receipt, Download, CalendarDays, Shield, MessageSquare, Phone, AlertCircle } from "lucide-react";
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
import { CustomerAvatar } from "@/features/inbox/components/CustomerAvatar";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/25",
  confirmed: "bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/25",
  dispatched: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-500/25",
  delivered: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/25",
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-500 border-rose-500/25",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  dispatched: "En livraison",
  paid: "Payée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock size={12} className="shrink-0" />,
  confirmed: <Package size={12} className="shrink-0" />,
  dispatched: <Truck size={12} className="shrink-0 text-purple-600 dark:text-purple-400" />,
  paid: <Banknote size={12} className="shrink-0" />,
  delivered: <CheckCircle2 size={12} className="shrink-0" />,
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
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (variables.status === "delivered") {
        toast.success("Commande livrée ! Le client a reçu son message de remerciement sur WhatsApp 🎉");
      } else if (variables.status === "paid") {
        toast.success("Paiement validé avec succès ! 💰");
      } else {
        toast.success("Statut mis à jour avec succès !");
      }
      setOrderToCancel(null);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour.");
    }
  });

  const stats = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;
    let dispatchedCount = 0;

    for (const o of orders) {
      if (o.status === "paid" || o.status === "delivered") {
        totalPaid += (o.totalAmount || 0);
      }
      if (o.status === "pending" || o.status === "confirmed" || o.status === "dispatched") {
        totalPending += (o.totalAmount || 0);
      }
      if (o.status === "dispatched" || (o.deliveryGuyPhone && o.status !== "delivered" && o.status !== "cancelled")) {
        dispatchedCount++;
      }
    }

    return {
      totalPaid,
      totalPending,
      dispatchedCount,
      totalOrders: orders.length
    };
  }, [orders]);

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
        o.customerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.deliveryGuyName?.toLowerCase().includes(search.toLowerCase()) ||
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
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 max-w-6xl mx-auto animate-in fade-in duration-700 pb-24 md:pb-12 text-slate-900 dark:text-white">
      <header id="tour-orders-management" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
            <ShoppingCart className="text-vendeur-emerald shrink-0" size={24} />
            <span>{config.ordersLabel}</span>
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-xs sm:text-sm font-normal mt-1">Suivez vos ventes et gérez le cycle de vie de vos {config.ordersLabel.toLowerCase()}.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShieldModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 px-4 h-12 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            title="Ouvrir le registre d'audit et scanner Shield OCR"
          >
            <Shield size={18} className="animate-pulse" />
            <span className="hidden sm:inline">Shield Preuves IA</span>
            <span className="sm:hidden">Shield</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-vendeur-emerald text-slate-950 px-5 h-12 rounded-2xl font-black uppercase text-xs tracking-wider shadow-xl shadow-vendeur-emerald/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Nouvelle {config.orderLabel}</span>
          </button>
        </div>
      </header>

      {/* Top KPI Statistics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-xl transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">Encaissé</span>
            <Banknote size={18} />
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.totalPaid.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-white/50">{merchantCurrency}</span>
          </div>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-xl transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">À Encaisser</span>
            <Clock size={18} />
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.totalPending.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-white/50">{merchantCurrency}</span>
          </div>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-xl transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">En Course</span>
            <Truck size={18} />
          </div>
          <div className="text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400">
            {stats.dispatchedCount} <span className="text-xs font-normal text-slate-500 dark:text-white/50">colis</span>
          </div>
        </div>

        <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-xl transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40">Total Ventes</span>
            <Package size={18} />
          </div>
          <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalOrders} <span className="text-xs font-normal text-slate-500 dark:text-white/50">{config.ordersLabel.toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-slate-50/95 dark:bg-vendeur-bg/95 backdrop-blur-xl">
        <div className="relative max-w-full w-full group">
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-slate-100 dark:from-vendeur-coal to-transparent pointer-events-none rounded-l-2xl transition-opacity duration-300",
            showLeftScroll ? "opacity-100" : "opacity-0"
          )} />
          <div className={cn(
            "absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-slate-100 dark:from-vendeur-coal to-transparent pointer-events-none rounded-r-2xl transition-opacity duration-300",
            showRightScroll ? "opacity-100" : "opacity-0"
          )} />

          <div
            ref={tabsRef}
            className="flex gap-2 p-1.5 bg-white dark:bg-vendeur-coal/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 w-fit shadow-md dark:shadow-2xl overflow-x-auto no-scrollbar max-w-full relative"
          >
            {[
              { id: "all", label: "Tous", icon: <Package size={16} /> },
              { id: "pending", label: "En attente", icon: <Clock size={16} /> },
              { id: "dispatched", label: "En livraison", icon: <Truck size={16} /> },
              { id: "paid", label: "Payée", icon: <Banknote size={16} /> },
              { id: "delivered", label: "Livrée", icon: <CheckCircle2 size={16} /> },
              { id: "cancelled", label: "Annulée", icon: <XCircle size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                data-active={filter === tab.id}
                className={cn(
                  "flex items-center justify-center gap-2 px-3.5 h-10 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all shrink-0 whitespace-nowrap cursor-pointer",
                  filter === tab.id
                    ? "bg-vendeur-emerald text-slate-950 shadow-md font-black"
                    : "text-slate-600 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
          <input
            className="w-full bg-white dark:bg-vendeur-coal/50 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 dark:text-white outline-none focus:border-vendeur-emerald transition-all shadow-sm dark:shadow-xl placeholder:text-slate-400 dark:placeholder:text-white/30"
            placeholder="Rechercher par client, livreur, article ou lieu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Time Range Selector */}
          <div className="flex items-center bg-white dark:bg-vendeur-coal/60 border border-slate-200 dark:border-white/10 rounded-2xl p-1 shadow-sm dark:shadow-lg">
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
                  "px-3 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer",
                  timeRange === t.id
                    ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm font-black"
                    : "text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-transparent"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="h-11 px-4 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 shadow-sm cursor-pointer"
            title="Exporter en CSV / Excel"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-12">
            <VendeurIALoader size="lg" label={`Chargement des ${config.ordersLabel.toLowerCase()}...`} />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 border-2 border-dashed border-slate-300 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-white/20 text-center">
            {config.emptyIcon}
            <p className="font-black uppercase tracking-[0.2em] text-xs">Aucune {config.orderLabel.toLowerCase()} trouvée</p>
          </div>
        ) : (
          filteredOrders.map((order: any) => (
            <div key={order._id} className="bg-white dark:bg-vendeur-coal/80 border border-slate-200 dark:border-white/10 rounded-2xl lg:rounded-[2rem] p-4 lg:p-6 hover:border-emerald-500/40 dark:hover:border-white/20 transition-all group shadow-sm hover:shadow-md dark:shadow-xl text-slate-900 dark:text-white">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
                
                {/* 1. Client & Delivery Meta Info */}
                <div className="flex items-start gap-3.5 lg:w-72 xl:w-80 shrink-0">
                  <CustomerAvatar
                    name={order.customerId?.name}
                    phone={order.customerId?.phone}
                    avatarUrl={order.customerId?.avatarUrl}
                    platform={order.customerId?.platform || "whatsapp"}
                    size="lg"
                    showPlatformBadge={true}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-black text-base lg:text-lg text-slate-900 dark:text-white truncate">
                        {order.customerId?.name || formatDisplayPhone(order.customerId?.phone, "CI") || "Client"}
                      </h3>
                      {(order.customerId?.loyaltyPoints || 0) >= 50 && (
                        <span className="text-[8px] font-black bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded uppercase shrink-0">
                          VIP
                        </span>
                      )}
                    </div>
                    {order.customerId?.name && order.customerId?.phone && (
                      <p className="text-[11px] text-slate-500 dark:text-white/50 font-mono mt-0.5 truncate">
                        {formatDisplayPhone(order.customerId?.phone, "CI")}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40">
                        <Calendar size={12} className="shrink-0" />
                        <span className="text-[10px] uppercase font-bold">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {(order.shippingAddress || order.customerId?.location) && (
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold max-w-[200px] truncate">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{order.shippingAddress || order.customerId?.location}</span>
                        </div>
                      )}
                      {order.paymentMethod && (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-white/50 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-transparent px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0">
                          <CreditCard size={10} className="shrink-0" />
                          <span>{order.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Items and Total Summary */}
                <div className="flex-1 lg:px-8 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/5 pt-3 lg:pt-0">
                  <div className="space-y-1.5">
                    {order.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs lg:text-sm">
                        <span className="text-slate-700 dark:text-white/70 font-medium truncate pr-3">{item.quantity}x {item.name}</span>
                        <span className="text-slate-900 dark:text-white font-bold shrink-0">{item.price.toLocaleString()} {order.currency || merchantCurrency}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-white/5">
                       <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Total</span>
                       <span className="text-lg lg:text-xl font-black text-emerald-600 dark:text-emerald-400">{order.totalAmount.toLocaleString()} {order.currency || merchantCurrency}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Status & Actions Bar */}
                <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/5 pt-3 lg:pt-0 lg:pl-8 flex flex-col gap-2.5 shrink-0">
                  
                  {/* Status Badge */}
                  <div className="flex items-center justify-between lg:justify-start gap-3">
                    <div className={cn(
                      "px-3.5 py-1.5 lg:py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0",
                      statusColors[order.status] || statusColors.pending
                    )}>
                      {statusIcons[order.status] || statusIcons.pending}
                      <span>{statusLabels[order.status] || order.status}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 w-full lg:w-64">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      {/* 1. Reçu */}
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="w-full h-10 min-h-[40px] px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/5 dark:text-white/85 border border-slate-200 dark:border-white/10 dark:hover:bg-white/10 dark:hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                        title="Imprimer ou partager le Bon de commande"
                      >
                        <Receipt size={14} className="text-slate-500 dark:text-white/60 shrink-0" />
                        <span className="truncate">Reçu</span>
                      </button>

                      {/* 2. Chat / WhatsApp Client */}
                      {order.customerId?.phone ? (
                        <a
                          href={`https://wa.me/${(order.customerId.phone || "").replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-10 min-h-[40px] px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25 dark:hover:bg-blue-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                          title="Contacter le client sur WhatsApp"
                        >
                          <MessageSquare size={14} className="shrink-0" />
                          <span className="truncate">Chat</span>
                        </a>
                      ) : <div />}

                      {/* 3. Livreur */}
                      {order.status !== "delivered" && order.status !== "cancelled" ? (
                        <button
                          onClick={() => setSelectedDispatchOrder(order)}
                          className="w-full h-10 min-h-[40px] px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/25 dark:hover:bg-purple-500/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                          title="Assigner un livreur (WhatsApp)"
                        >
                          <Truck size={14} className="shrink-0" />
                          <span className="truncate">{order.deliveryGuyPhone ? "Livreur 🛵" : "Livreur"}</span>
                        </button>
                      ) : null}

                      {/* 4. Action de Validation (Encaissé ou Livré en 1 clic) */}
                      {order.status === "delivered" ? (
                        <div
                          className="w-full h-10 min-h-[40px] px-2.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/25 font-bold text-xs flex items-center justify-center gap-1.5 select-none"
                          title="Commande livrée et clôturée avec succès"
                        >
                          <CheckCircle2 size={14} className="shrink-0 text-teal-600 dark:text-teal-400" />
                          <span className="truncate">Livrée ✨</span>
                        </div>
                      ) : order.status === "dispatched" || order.status === "paid" ? (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order._id, status: "delivered" })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full h-10 min-h-[40px] px-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md hover:shadow-teal-500/20 cursor-pointer"
                          title="Marquer comme livrée (Notifie le client sur WhatsApp & clôture la vente)"
                        >
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="truncate">Livré ✅</span>
                        </button>
                      ) : order.paymentMethod === "cash_on_delivery" ? (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order._id, status: "delivered" })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full h-10 min-h-[40px] px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md hover:shadow-emerald-500/20 cursor-pointer"
                          title="Livré & Encaissé (Paiement à la livraison)"
                        >
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="truncate">Livré & Encaissé ✅</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: order._id, status: "paid" })}
                          disabled={updateStatusMutation.isPending}
                          className="w-full h-10 min-h-[40px] px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md hover:shadow-emerald-500/20 cursor-pointer"
                          title="Marquer comme payée / Encaissée"
                        >
                          <Banknote size={14} className="shrink-0" />
                          <span className="truncate">Encaissé 💰</span>
                        </button>
                      )}
                    </div>

                    {/* Dedicated Cancel Row */}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        onClick={() => setOrderToCancel(order)}
                        className="w-full h-8 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/5 dark:hover:bg-rose-500/15 dark:text-rose-400/80 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-500/15 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title="Annuler la commande"
                      >
                        <XCircle size={13} className="shrink-0" />
                        <span>Annuler la commande</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Courier Visual Card if Assigned */}
              {order.deliveryGuyPhone && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/70 dark:bg-purple-500/[0.04] -mx-4 lg:-mx-6 -mb-4 lg:-mb-6 p-4 rounded-b-2xl lg:rounded-b-[2rem] border-t border-purple-200 dark:border-purple-500/15">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-500/30">
                      <Truck size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          🛵 Livreur : {order.deliveryGuyName || "Assigné"}
                        </span>
                        {order.dispatchedAt && (
                          <span className="text-[10px] text-purple-700 dark:text-purple-300/70 font-mono">
                            • Assigné à {new Date(order.dispatchedAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-purple-800 dark:text-purple-300/80 font-mono flex items-center gap-2">
                        <span>{formatDisplayPhone(order.deliveryGuyPhone, "CI")}</span>
                        {order.deliveryNotes && (
                          <span className="text-slate-500 dark:text-white/40 font-sans italic truncate text-[10px]">
                            • « {order.deliveryNotes} »
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={`https://wa.me/${order.deliveryGuyPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Phone size={12} />
                      <span>WhatsApp Livreur</span>
                    </a>
                    <button
                      onClick={() => setSelectedDispatchOrder(order)}
                      className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
                      title="Changer de coursier"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0B1512] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Annuler cette commande ?</h3>
              <p className="text-xs text-slate-500 dark:text-white/50">
                La commande #{orderToCancel._id.toString().slice(-6).toUpperCase()} sera marquée comme annulée.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setOrderToCancel(null)}
                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80 font-bold text-xs rounded-xl transition-colors border border-slate-200 dark:border-white/5 cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={() => updateStatusMutation.mutate({ id: orderToCancel._id, status: "cancelled" })}
                className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

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
