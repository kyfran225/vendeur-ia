import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Users,
  Megaphone,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  History,
  TrendingUp,
  Zap,
  Calendar,
  Clock,
  MapPin,
  UserX,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Send,
  Info
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { WhatsAppPreview } from "./WhatsAppPreview";
import { useAuthStore } from "@/stores/authStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MarketingHub() {
  const { user } = useAuthStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [personalization, setPersonalization] = useState<"basic" | "ai_creative">("ai_creative");
  const [previewText, setPreviewText] = useState("");
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<"editor" | "whatsapp">("editor");

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on("marketing:progress", (data: any) => {
        setActiveCampaign((prev: any) => {
          if (!prev || prev.campaignId !== data.campaignId) return prev;
          return { ...prev, ...data };
        });
        if (data.status === "completed") {
          toast.success("Campagne terminée ! ✨");
          queryClient.invalidateQueries({ queryKey: ["campaigns"] });
          queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
          setTimeout(() => setActiveCampaign(null), 5000);
        }
      });
    }
    return () => {
      socket?.off("marketing:progress");
    };
  }, [socket, queryClient]);

  // Fetch Data
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/products");
      return res.data;
    }
  });

  const { data: segments } = useQuery({
    queryKey: ["segments"],
    queryFn: async () => {
      const res = await apiClient.get("/api/marketing/segments");
      return res.data;
    }
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await apiClient.get("/api/marketing/campaigns");
      return res.data;
    }
  });

  const { data: automations = { abandonedCart: true, postPurchaseFollowup: true } } = useQuery({
    queryKey: ["marketingAutomations"],
    queryFn: async () => {
      const res = await apiClient.get("/api/marketing/automations");
      return res.data;
    }
  });

  const updateAutomationMutation = useMutation({
    mutationFn: async (payload: { abandonedCart?: boolean; postPurchaseFollowup?: boolean }) => {
      const res = await apiClient.patch("/api/marketing/automations", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["marketingAutomations"], data);
      toast.success("Paramètres d'automatisation mis à jour ! ⚙️");
    },
    onError: () => {
      toast.error("Impossible de modifier l'automatisation.");
    }
  });

  const { data: serverActiveCampaign } = useQuery({
    queryKey: ["activeCampaign"],
    queryFn: async () => {
      const res = await apiClient.get("/api/marketing/active");
      return res.data;
    },
    refetchInterval: (query) => (query.state.data ? 5000 : false)
  });

  useEffect(() => {
    if (serverActiveCampaign && !activeCampaign) {
      setActiveCampaign({
        campaignId: serverActiveCampaign._id,
        sentCount: serverActiveCampaign.sentCount,
        targetCount: serverActiveCampaign.targetCount,
        status: serverActiveCampaign.status
      });
    }
  }, [serverActiveCampaign, activeCampaign]);

  // Calcul du nombre de clients pour le segment actuel
  const getSelectedCount = () => {
    if (!segments) return 0;
    if (selectedSegment === "vip") return segments.vip || 0;
    if (selectedSegment === "active") return segments.active || 0;
    if (selectedSegment === "inactive") return segments.inactive || 0;
    if (selectedSegment === "all") return segments.all || 0;
    if (selectedSegment.startsWith("city:")) {
      const cityName = selectedSegment.replace("city:", "");
      const found = segments.cities?.find((c: any) => c.name.toLowerCase() === cityName.toLowerCase() || c.slug === cityName);
      return found?.count || 0;
    }
    return segments.all || 0;
  };

  const selectedCount = getSelectedCount();

  const [selectedTemplate, setSelectedTemplate] = useState<string>("standard");

  const previewMutation = useMutation({
    mutationFn: async (templateOverride?: string) => {
      const templateToUse = templateOverride || selectedTemplate || "standard";
      if (templateOverride) setSelectedTemplate(templateOverride);

      const res = await apiClient.post("/api/marketing/preview", {
        productId: selectedProduct?._id,
        segment: selectedSegment,
        template: templateToUse
      });
      return res.data;
    },
    onSuccess: (data) => {
      setPreviewText(data.preview);
      toast.success("Nouveau texte généré par Vendeur IA ! ✨");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Impossible de générer le message");
    }
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        productId: selectedProduct?._id,
        segment: selectedSegment,
        customText: previewText,
        personalization
      };

      if (isScheduled && scheduledDateTime) {
        payload.scheduledAt = new Date(scheduledDateTime).toISOString();
      }

      const res = await apiClient.post("/api/marketing/broadcast", payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === "scheduled") {
        toast.success(`Diffusion programmée pour le ${new Date(data.scheduledAt).toLocaleString("fr-FR")} (${data.count} clients) ! 📅`);
      } else {
        toast.success(`Diffusion lancée vers ${data.count} clients ! 🚀`);
        setActiveCampaign({
          campaignId: data.campaignId,
          sentCount: 0,
          targetCount: data.count,
          status: "active"
        });
      }
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["activeCampaign"] });
      setPreviewText("");
      setSelectedProduct(null);
      setIsScheduled(false);
      setScheduledDateTime("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Échec du lancement de la diffusion.");
    }
  });

  const handleProductSelect = (p: any) => {
    setSelectedProduct(p);
    setPreviewText("");
  };

  const handleSegmentSelect = (s: string) => {
    setSelectedSegment(s);
    setPreviewText("");
  };

  // Helper pour les raccourcis de planification rapide
  const setQuickSchedule = (type: 'tonight' | 'tomorrow_morning' | 'tomorrow_evening') => {
    setIsScheduled(true);
    const date = new Date();
    if (type === 'tonight') {
      date.setHours(18, 30, 0, 0);
      if (date.getTime() <= Date.now()) {
        date.setDate(date.getDate() + 1);
      }
    } else if (type === 'tomorrow_morning') {
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0);
    } else if (type === 'tomorrow_evening') {
      date.setDate(date.getDate() + 1);
      date.setHours(18, 0, 0, 0);
    }
    const localIso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledDateTime(localIso);
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-10 space-y-6 sm:space-y-10 pb-24 md:pb-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase flex items-center gap-3">
            <Megaphone className="text-sky-500 dark:text-sky-400" size={28} />
            Hub Marketing
          </h1>
          <p className="text-slate-500 dark:text-white/40 text-xs sm:text-sm md:text-base mt-0.5">Faites savoir à vos clients que vous avez du nouveau.</p>
        </div>
      </header>

      {/* Campaign Progress Overlay */}
      {activeCampaign && activeCampaign.status === "active" && (
        <div className="bg-sky-500/10 border border-sky-500/20 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl animate-in slide-in-from-top duration-500 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 shadow-md">
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="h-9 w-9 sm:h-11 sm:w-11 bg-sky-500 rounded-xl flex items-center justify-center text-slate-950 font-black shadow-md shadow-sky-500/20 shrink-0">
               <Loader2 className="animate-spin" size={18} />
             </div>
             <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Diffusion en cours...</h3>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400 mt-0.5">
                  {activeCampaign.sentCount} / {activeCampaign.targetCount} envoyés
                </p>
             </div>
          </div>
          <div className="flex-1 w-full max-w-md h-1.5 sm:h-2 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
             <div
                className="h-full bg-sky-400 transition-all duration-1000 ease-out"
                style={{ width: `${activeCampaign.targetCount > 0 ? (activeCampaign.sentCount / activeCampaign.targetCount) * 100 : 0}%` }}
             />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 italic">Anti-ban actif (1 msg / 30s)</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        {/* Step 1: Product Selection */}
        <section className="space-y-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-white/60 flex items-center gap-2">
            <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center text-[9px] sm:text-[10px]">1</span>
            Choisir un produit
          </h2>
          <div className="flex lg:grid lg:grid-cols-2 gap-2 sm:gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[500px] pr-1 custom-scrollbar no-scrollbar pb-1">
            {products.length === 0 ? (
              <div className="col-span-2 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 p-5 rounded-2xl text-center text-slate-400 dark:text-white/30 text-xs shadow-sm">
                Aucun produit dans votre catalogue. Ajoutez-en d'abord un dans Produits.
              </div>
            ) : (
              products.map((p: any) => (
                <button
                  key={p._id}
                  onClick={() => handleProductSelect(p)}
                  className={cn(
                    "relative aspect-square w-24 sm:w-32 lg:w-auto shrink-0 rounded-2xl overflow-hidden border-2 transition-all group cursor-pointer shadow-sm",
                    selectedProduct?._id === p._id ? "border-sky-400 ring-2 ring-sky-400/20 shadow-md" : "border-slate-200/80 dark:border-white/5 grayscale hover:grayscale-0 hover:border-slate-300 dark:hover:border-white/20"
                  )}
                >
                  {p.images?.[0] ? (
                    <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center"><ShoppingBag className="text-slate-300 dark:text-white/10" /></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 sm:p-2 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-black/95 dark:via-black/80 dark:to-transparent backdrop-blur-[2px] transition-all">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-[8px] sm:text-[9px] text-sky-600 dark:text-sky-400 font-black">{p.price?.toLocaleString()} {p.currency}</p>
                  </div>
                  {selectedProduct?._id === p._id && (
                    <div className="absolute top-1.5 right-1.5 bg-sky-400 rounded-full p-1 shadow-lg">
                      <CheckCircle2 size={10} className="text-black" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </section>

        {/* Step 2: Segment & Preview */}
        <section className="lg:col-span-2 space-y-4 sm:space-y-5">
          <div className="space-y-2.5 sm:space-y-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-600 dark:text-white/60 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white flex items-center justify-center text-[9px] sm:text-[10px]">2</span>
                Cible & Message
              </span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                {selectedCount} client{selectedCount > 1 ? "s" : ""}
              </span>
            </h2>

            {/* Segment Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {[
                {
                  id: 'all',
                  label: 'Tous',
                  desc: 'Tous vos contacts',
                  count: segments?.all || 0,
                  icon: Megaphone,
                  color: 'emerald'
                },
                {
                  id: 'vip',
                  label: 'VIPs',
                  desc: '+50 pts fidélité',
                  count: segments?.vip || 0,
                  icon: Sparkles,
                  color: 'amber'
                },
                {
                  id: 'active',
                  label: 'Actifs',
                  desc: 'Actifs ce mois',
                  count: segments?.active || 0,
                  icon: Users,
                  color: 'sky'
                },
                {
                  id: 'inactive',
                  label: 'Inactifs',
                  desc: 'Inactifs > 30j',
                  count: segments?.inactive || 0,
                  icon: UserX,
                  color: 'rose'
                }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSegmentSelect(s.id)}
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left space-y-1.5 relative overflow-hidden cursor-pointer shadow-sm",
                    selectedSegment === s.id
                      ? `bg-${s.color}-500/10 border-${s.color}-500/50 shadow-md shadow-${s.color}-500/10`
                      : "bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.08]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <s.icon size={17} className={cn("sm:size-5", selectedSegment === s.id ? `text-${s.color}-500 dark:text-${s.color}-400` : "text-slate-400 dark:text-white/30")} />
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/50">{s.label}</span>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-none">{s.count}</p>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-white/60 mt-1 leading-snug truncate">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Geographic Segmentation (Cities / Zones) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600 dark:text-white/60 uppercase tracking-wider">
                  <MapPin size={13} className="text-sky-500 dark:text-sky-400" />
                  <span>Ciblage par ville / zone :</span>
                </div>
                {selectedSegment.startsWith("city:") && (
                  <button
                    type="button"
                    onClick={() => setSelectedSegment("all")}
                    className="text-[11px] sm:text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              {segments?.cities && segments.cities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {segments.cities.map((c: any) => {
                    const segId = `city:${c.name}`;
                    const isSelected = selectedSegment === segId;
                    return (
                      <button
                        key={c.slug || c.name}
                        onClick={() => handleSegmentSelect(segId)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm",
                          isSelected
                            ? "bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-400 shadow-sm"
                            : "bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20"
                        )}
                      >
                        <span>{c.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-[9px] text-slate-700 dark:text-white/90">{c.count}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 flex items-center gap-2.5 text-xs text-slate-600 dark:text-white/60 leading-relaxed shadow-sm">
                  <MapPin size={14} className="shrink-0 text-sky-500 dark:text-sky-400" />
                  <span>Vendeur IA détectera automatiquement les villes de vos clients (ex: <em>Cocody, Yopougon, Marcory</em>) dès leurs commandes.</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-vendeur-coal border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 relative overflow-hidden shadow-md dark:shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 hidden md:block">
               <Sparkles size={120} />
            </div>

            {/* Header avec switcher d'onglets (Éditeur / Rendu WhatsApp) et bouton Ré-écrire */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-black/50 p-1 rounded-xl border border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("editor")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                      previewTab === "editor" ? "bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <span>📝 Éditeur</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("whatsapp")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                      previewTab === "whatsapp" ? "bg-[#00a884] text-white font-black shadow-sm" : "text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <span>📱 Rendu WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Bouton Ré-écrire avec Vendeur IA */}
              <button
                type="button"
                onClick={() => previewMutation.mutate(selectedTemplate)}
                disabled={!selectedProduct || previewMutation.isPending}
                className={cn(
                  "px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 border cursor-pointer self-start sm:self-auto",
                  selectedProduct
                    ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/50 shadow-sm active:scale-95"
                    : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 cursor-not-allowed opacity-50"
                )}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-sky-500 dark:text-sky-400" />
                    <span>Rédaction...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={11} />
                    <span>Ré-écrire avec Vendeur IA</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Marketing Scenarios / Angles (1-Clic) */}
            <div className="space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider block">
                Angle de vente (1-clic) :
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  { id: "flash_sale", label: "🔥 Vente Flash 24h" },
                  { id: "new_arrival", label: "✨ Nouvel Arrivage" },
                  { id: "vip_privilege", label: "👑 Privilège VIP" },
                  { id: "clearance", label: "📦 Déstockage" },
                  { id: "friendly_checkin", label: "💬 Conseil Amical" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!selectedProduct || previewMutation.isPending}
                    onClick={() => previewMutation.mutate(t.id)}
                    className={cn(
                      "px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed",
                      selectedTemplate === t.id
                        ? "bg-sky-500/20 border-sky-400 text-sky-600 dark:text-sky-400 shadow-sm"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 shadow-sm"
                    )}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone de contenu / Prévisualisation */}
            <div className="min-h-[140px] relative">
              {!selectedProduct ? (
                <div className="border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl h-[140px] flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-white/30 space-y-1.5">
                   <ShoppingBag size={28} className="opacity-40" />
                   <p className="text-xs font-medium">Sélectionnez un produit à l'étape 1 pour rédiger l'annonce.</p>
                </div>
              ) : previewMutation.isPending ? (
                <div className="h-[140px] flex flex-col items-center justify-center border border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-white/[0.02]">
                   <VendeurIALoader size="md" label="Vendeur IA rédige une offre sur-mesure..." />
                </div>
              ) : previewTab === "whatsapp" ? (
                <WhatsAppPreview
                  product={selectedProduct}
                  text={previewText}
                  businessName={user?.displayName || "Votre Boutique"}
                  sampleCustomerName="Marc"
                />
              ) : previewText ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                     <button
                        type="button"
                        onClick={() => setPersonalization('basic')}
                        className={cn(
                           "flex-1 py-2.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer",
                           personalization === 'basic' ? "bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white shadow-sm" : "bg-transparent border-slate-200 dark:border-white/5 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60"
                        )}
                     >
                        Basique
                     </button>
                     <button
                        type="button"
                        onClick={() => setPersonalization('ai_creative')}
                        className={cn(
                           "flex-1 py-2.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer",
                           personalization === 'ai_creative' ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400 font-bold shadow-sm" : "bg-transparent border-slate-200 dark:border-white/5 text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60"
                        )}
                     >
                        <Zap size={10} /> IA Créative
                     </button>
                  </div>
                  <textarea
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-white/90 outline-none focus:border-sky-500 transition-all resize-none h-[130px]"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                  />
                  {personalization === 'ai_creative' && (
                     <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/10 rounded-xl text-[9px] sm:text-[10px] font-bold text-sky-700 dark:text-sky-400/80 italic">
                        <Sparkles size={11} className="shrink-0" />
                        <span>Chaque client recevra une version unique faisant référence à l'image du produit et à son historique.</span>
                     </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => previewMutation.mutate(undefined)}
                  className="w-full h-[140px] border-2 border-dashed border-sky-500/30 bg-sky-500/[0.03] hover:bg-sky-500/[0.08] hover:border-sky-500/50 rounded-2xl flex flex-col items-center justify-center gap-2.5 text-sky-600 dark:text-sky-400 transition-all group cursor-pointer shadow-sm"
                >
                   <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Sparkles size={20} className="text-sky-600 dark:text-sky-400" />
                   </div>
                   <div className="text-center">
                     <span className="text-xs font-black uppercase tracking-wider block">Générer le message avec Vendeur IA</span>
                     <span className="text-[9px] text-slate-400 dark:text-white/40 font-normal">Cliquez pour créer le texte vendeur</span>
                   </div>
                </button>
              )}
            </div>

            {/* Step 2.5: Planification stylée & légère */}
            <div className="bg-slate-50 dark:bg-white/[0.03] md:dark:bg-[#121614] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  <Calendar size={15} className="text-sky-500 dark:text-sky-400 shrink-0" />
                  <span>Mode d'envoi</span>
                </div>
                <div className="grid grid-cols-2 sm:flex bg-slate-200/70 dark:bg-black/50 p-1 rounded-xl border border-slate-300/50 dark:border-white/5 w-full sm:w-auto gap-1">
                  <button
                    type="button"
                    onClick={() => { setIsScheduled(false); setScheduledDateTime(""); }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      !isScheduled ? "bg-sky-500 text-white dark:bg-sky-400 dark:text-black shadow-sm" : "text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Send size={11} />
                    <span>Immédiat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScheduled(true);
                      if (!scheduledDateTime) setQuickSchedule('tonight');
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      isScheduled ? "bg-sky-500 text-white dark:bg-sky-400 dark:text-black shadow-sm" : "text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <Clock size={11} />
                    <span>Programmer</span>
                  </button>
                </div>
              </div>

              {isScheduled && (
                <div className="pt-3 border-t border-slate-200/80 dark:border-white/5 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Raccourcis rapides */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 block">
                      Raccourcis d'envoi populaires :
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickSchedule('tonight')}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-sky-50 dark:hover:bg-sky-500/20 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-500/30 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-white/70 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span>🌙</span> <span>Ce soir 18h30</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickSchedule('tomorrow_morning')}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-sky-50 dark:hover:bg-sky-500/20 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-500/30 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-white/70 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span>☀️</span> <span>Demain 09h00</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickSchedule('tomorrow_evening')}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-sky-50 dark:hover:bg-sky-500/20 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-sky-500/30 text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-white/70 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span>🚀</span> <span>Demain 18h00</span>
                      </button>
                    </div>
                  </div>

                  {/* Calendrier & Sélecteur interactif */}
                  <DateTimePicker
                    value={scheduledDateTime}
                    onChange={(val) => setScheduledDateTime(val)}
                  />
                </div>
              )}
            </div>

            {/* Warning if 0 customers */}
            {selectedCount === 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[11px] sm:text-xs">
                  <strong>0 client dans ce segment.</strong> Choisissez un autre segment (ex: <em>Tous</em>).
                </p>
              </div>
            )}

            {/* Mobile-First Action Button */}
            <button
              onClick={() => broadcastMutation.mutate()}
              disabled={!previewText || broadcastMutation.isPending || selectedCount === 0 || (isScheduled && !scheduledDateTime)}
              className="w-full h-12 sm:h-14 bg-sky-500 hover:bg-sky-600 text-white dark:bg-sky-400 dark:hover:bg-sky-300 dark:text-black font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-sky-500/20 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
            >
              {broadcastMutation.isPending ? (
                <Loader2 className="animate-spin" size={17} />
              ) : isScheduled ? (
                <Clock size={17} />
              ) : (
                <Megaphone size={17} />
              )}
              <span>
                {broadcastMutation.isPending
                  ? "Traitement..."
                  : isScheduled
                  ? "Programmer la diffusion"
                  : "Lancer la diffusion"}
              </span>
              {selectedCount > 0 && !broadcastMutation.isPending && (
                <span className="px-2 py-0.5 rounded-full bg-black/15 text-[10px] font-black">
                  {selectedCount}
                </span>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 dark:text-white/30 font-medium">
              <Info size={11} className="shrink-0" />
              <span>1 message toutes les 20-45s pour la protection WhatsApp.</span>
            </div>
          </div>
        </section>

        {/* Step 3: Autopilot Automations & Campaign History */}
        <section className="lg:col-span-3 space-y-4 pt-4 sm:pt-6">
           {/* Pilote Automatique Marketing */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             {/* Relance Panier Abandonné */}
             <div className={cn(
               "border p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all",
               automations.abandonedCart
                 ? "bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30 shadow-md shadow-emerald-500/5 bg-white dark:bg-transparent"
                 : "bg-slate-50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 opacity-60 shadow-sm"
             )}>
               <div className="flex items-center gap-3">
                 <div className={cn(
                   "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                   automations.abandonedCart ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-slate-200/70 dark:bg-white/5 text-slate-400 dark:text-white/30"
                 )}>
                   <Sparkles size={18} />
                 </div>
                 <div>
                   <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Relance Panier Abandonné</p>
                   <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-white/50">Relance automatique 2h après inactivité</p>
                 </div>
               </div>
               <button
                 type="button"
                 onClick={() => updateAutomationMutation.mutate({ abandonedCart: !automations.abandonedCart })}
                 disabled={updateAutomationMutation.isPending}
                 className={cn(
                   "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                   automations.abandonedCart ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/20"
                 )}
               >
                 <span
                   className={cn(
                     "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                     automations.abandonedCart ? "translate-x-5" : "translate-x-0"
                   )}
                 />
               </button>
             </div>

             {/* Fidélisation Post-Achat */}
             <div className={cn(
               "border p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 transition-all",
               automations.postPurchaseFollowup
                 ? "bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30 shadow-md shadow-purple-500/5 bg-white dark:bg-transparent"
                 : "bg-slate-50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 opacity-60 shadow-sm"
             )}>
               <div className="flex items-center gap-3">
                 <div className={cn(
                   "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                   automations.postPurchaseFollowup ? "bg-purple-500/20 text-purple-600 dark:text-purple-400" : "bg-slate-200/70 dark:bg-white/5 text-slate-400 dark:text-white/30"
                 )}>
                   <Clock size={18} />
                 </div>
                 <div>
                   <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Fidélisation Post-Achat</p>
                   <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-white/50">Suivi satisfaction & points fidélité (J+3)</p>
                 </div>
               </div>
               <button
                 type="button"
                 onClick={() => updateAutomationMutation.mutate({ postPurchaseFollowup: !automations.postPurchaseFollowup })}
                 disabled={updateAutomationMutation.isPending}
                 className={cn(
                   "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                   automations.postPurchaseFollowup ? "bg-purple-500" : "bg-slate-300 dark:bg-white/20"
                 )}
               >
                 <span
                   className={cn(
                     "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                     automations.postPurchaseFollowup ? "translate-x-5" : "translate-x-0"
                   )}
                 />
               </button>
             </div>
           </div>

           <header className="flex items-center justify-between pt-2">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-500 dark:text-white/60 flex items-center gap-2">
                <History className="text-slate-400 dark:text-white/20" size={16} />
                Dernières Campagnes & Performance
              </h2>
           </header>

           <div className="grid gap-3">
              {campaigns.length === 0 ? (
                <div className="bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 p-6 sm:p-10 rounded-2xl text-center text-slate-500 dark:text-white/40 space-y-1">
                   <History size={24} className="mx-auto opacity-20 mb-1" />
                   <p className="text-xs font-bold uppercase tracking-wider">Aucune campagne passée</p>
                   <p className="text-[10px] text-slate-400 dark:text-white/20">Vos diffusions apparaîtront ici avec leurs statistiques.</p>
                </div>
              ) : (
                campaigns.map((c: any) => {
                  const replyRate = c.sentCount > 0 ? Math.round(((c.repliedCount || 0) / c.sentCount) * 100) : 0;
                  const isCampScheduled = c.status === "scheduled" || (c.scheduledAt && new Date(c.scheduledAt) > new Date());

                  return (
                    <div key={c._id} className="bg-white dark:bg-[#0c0f0d] border border-slate-200/80 dark:border-white/5 p-4 sm:p-5 rounded-2xl flex flex-col gap-3 group hover:border-slate-300 dark:hover:border-white/10 transition-all shadow-md dark:shadow-xl">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shadow-md shrink-0",
                               c.status === 'completed'
                                 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                 : isCampScheduled
                                 ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                 : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                             )}>
                                {c.status === 'completed' ? (
                                  <CheckCircle2 size={20} />
                                ) : isCampScheduled ? (
                                  <Clock size={20} />
                                ) : (
                                  <TrendingUp size={20} />
                                )}
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-md">{c.content}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                                     {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                                   </p>
                                   <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
                                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60">
                                     {c.sentCount}/{c.targetCount} envoyés
                                   </p>
                                   <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
                                   <p className="text-[9px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 flex items-center gap-1">
                                     <MessageSquare size={9} />
                                     {c.repliedCount || 0} ({replyRate}%)
                                   </p>
                                   <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-white/10" />
                                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                     <TrendingUp size={9} />
                                     {(c.revenueGenerated || 0).toLocaleString()} XOF ({c.ordersCount || 0} vente{(c.ordersCount || 0) > 1 ? "s" : ""})
                                   </p>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {c.scheduledAt && isCampScheduled && (
                              <div className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                                <Calendar size={9} />
                                {new Date(c.scheduledAt).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            <div className={cn(
                              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                              c.status === 'completed'
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : isCampScheduled
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                            )}>
                               {c.status === 'completed' ? 'Succès' : isCampScheduled ? 'Programmé' : 'En cours'}
                            </div>
                          </div>
                       </div>

                       {c.status === 'active' && (
                          <div className="space-y-1">
                             <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                                <span>Progression</span>
                                <span>{c.sentCount} / {c.targetCount}</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                                <div
                                   className="h-full bg-sky-500 dark:bg-sky-400 transition-all duration-1000"
                                   style={{ width: `${c.targetCount > 0 ? (c.sentCount / c.targetCount) * 100 : 0}%` }}
                                />
                             </div>
                          </div>
                       )}
                    </div>
                  );
                })
              )}
           </div>
        </section>
      </div>
    </div>
  );
}
