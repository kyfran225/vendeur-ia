import React, { useState, useEffect } from "react";
import { Sparkles, Users, Megaphone, Loader2, CheckCircle2, ShoppingBag, History, TrendingUp } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function MarketingHub() {
  const { accessToken } = useAuthStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSegment, setSelectedSegment] = useState<string>("vip");
  const [previewText, setPreviewText] = useState("");
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

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

  const { data: serverActiveCampaign } = useQuery({
    queryKey: ["activeCampaign"],
    queryFn: async () => {
      const res = await apiClient.get("/api/marketing/active");
      return res.data;
    },
    refetchInterval: (data) => (data ? 5000 : false) // Refetch every 5s if active
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

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/marketing/preview", {
        productId: selectedProduct?._id,
        segment: selectedSegment
      });
      return res.data;
    },
    onSuccess: (data) => setPreviewText(data.preview)
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/marketing/broadcast", {
        productId: selectedProduct?._id,
        segment: selectedSegment,
        customText: previewText
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Diffusion lancée vers ${data.count} clients !`);
      setActiveCampaign({
        campaignId: data.campaignId,
        sentCount: 0,
        targetCount: data.count,
        status: "active"
      });
      setPreviewText("");
      setSelectedProduct(null);
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

  return (
    <div className="p-4 md:p-10 space-y-10 pb-24 md:pb-12 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase flex items-center gap-4">
            <Megaphone className="text-sky-400" size={40} />
            Hub Marketing
          </h1>
          <p className="text-white/40 md:text-lg">Faites savoir à vos clients que vous avez du nouveau.</p>
        </div>
      </header>

      {/* Campaign Progress Overlay */}
      {activeCampaign && (
        <div className="bg-sky-500/10 border border-sky-500/20 p-6 rounded-[2rem] animate-in slide-in-from-top duration-500 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="h-12 w-12 bg-sky-500 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-sky-500/20 shrink-0">
               <Loader2 className="animate-spin" size={24} />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Diffusion en cours...</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 mt-1">
                  {activeCampaign.sentCount} / {activeCampaign.targetCount} envoyés
                </p>
             </div>
          </div>
          <div className="flex-1 w-full max-w-md h-2 bg-white/5 rounded-full overflow-hidden">
             <div
                className="h-full bg-sky-400 transition-all duration-1000 ease-out"
                style={{ width: `${(activeCampaign.sentCount / activeCampaign.targetCount) * 100}%` }}
             />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Pause de 30s</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Product Selection */}
        <section className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            Choisir un produit
          </h2>
          <div className="flex lg:grid lg:grid-cols-2 gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[500px] pr-2 custom-scrollbar no-scrollbar pb-2">
            {products.map((p: any) => (
              <button
                key={p._id}
                onClick={() => handleProductSelect(p)}
                className={cn(
                  "relative aspect-square w-32 lg:w-auto shrink-0 rounded-2xl overflow-hidden border-2 transition-all group",
                  selectedProduct?._id === p._id ? "border-sky-400" : "border-white/5 grayscale hover:grayscale-0 hover:border-white/20"
                )}
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} className="w-full h-full object-cover" alt={p.name} />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center"><ShoppingBag className="text-white/10" /></div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] font-bold text-white truncate">{p.name}</p>
                </div>
                {selectedProduct?._id === p._id && (
                  <div className="absolute top-2 right-2 bg-sky-400 rounded-full p-1 shadow-lg">
                    <CheckCircle2 size={12} className="text-black" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Segment & Preview */}
        <section className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">2</span>
              Cible & Message
            </h2>

            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { id: 'vip', label: 'VIPs', count: segments?.vip || 0, icon: Sparkles, color: 'amber' },
                { id: 'active', label: 'Actifs', count: segments?.active || 0, icon: Users, color: 'sky' },
                { id: 'all', label: 'Tous', count: segments?.all || 0, icon: Megaphone, color: 'emerald' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSegmentSelect(s.id)}
                  className={cn(
                    "p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all text-left space-y-2",
                    selectedSegment === s.id
                      ? `bg-${s.color}-500/10 border-${s.color}-500/50 shadow-lg shadow-${s.color}-500/5`
                      : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                  )}
                >
                  <s.icon size={18} className={cn("md:size-5", selectedSegment === s.id ? `text-${s.color}-400` : "text-white/20")} />
                  <div>
                    <p className="text-base md:text-xl font-black text-white leading-tight">{s.count}</p>
                    <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/40 truncate">{s.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0c0f0d] border border-white/10 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Sparkles size={120} />
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-black text-white uppercase tracking-widest text-xs">Aperçu du message IA</h3>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">Astuce : Utilisez {"{{name}}"} pour le nom du client</p>
              </div>
              <button
                onClick={() => previewMutation.mutate()}
                disabled={!selectedProduct || previewMutation.isPending}
                className="text-[10px] font-black text-sky-400 uppercase tracking-widest hover:underline disabled:opacity-20"
              >
                {previewMutation.isPending ? "Génération..." : "Ré-écrire"}
              </button>
            </div>

            <div className="min-h-[150px] relative">
              {!selectedProduct ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-white/20">
                   <ShoppingBag size={48} className="mb-4" />
                   <p className="text-sm font-medium">Sélectionnez d'abord un produit pour que l'IA puisse rédiger le message.</p>
                </div>
              ) : previewMutation.isPending ? (
                <div className="absolute inset-0 flex items-center justify-center">
                   <Loader2 className="animate-spin text-sky-400" size={32} />
                </div>
              ) : previewText ? (
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm leading-relaxed text-white/90 outline-none focus:border-sky-500 transition-all resize-none h-[200px]"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                />
              ) : (
                <button
                  onClick={() => previewMutation.mutate()}
                  className="w-full h-[150px] border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/20 hover:bg-white/[0.02] hover:border-white/10 transition-all"
                >
                   <Sparkles size={24} />
                   <span className="text-xs font-bold">Générer le message marketing</span>
                </button>
              )}
            </div>

            <button
              onClick={() => broadcastMutation.mutate()}
              disabled={!previewText || broadcastMutation.isPending}
              className="w-full h-16 bg-sky-400 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-sky-400/20 disabled:opacity-20"
            >
              {broadcastMutation.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Megaphone size={20} />
              )}
              {broadcastMutation.isPending ? "Envoi en cours..." : "Lancer la diffusion"}
            </button>

            <p className="text-center text-[10px] text-white/30 font-medium italic">
              L'IA enverra les messages progressivement (1 toutes les 30s) pour protéger votre compte WhatsApp.
            </p>
          </div>
        </section>

        {/* Step 3: History */}
        <section className="lg:col-span-3 space-y-6 pt-8">
           <header className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                <History className="text-white/20" size={18} />
                Dernières Campagnes
              </h2>
           </header>

           <div className="grid gap-4">
              {campaigns.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 p-12 rounded-[2.5rem] text-center opacity-40">
                   <p className="text-xs font-bold uppercase tracking-widest">Aucune campagne passée.</p>
                </div>
              ) : (
                campaigns.map((c: any) => (
                  <div key={c._id} className="bg-vendeur-coal border border-white/5 p-6 rounded-3xl flex flex-col gap-4 group hover:border-white/10 transition-all">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                             c.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 shadow-emerald-500/5" : "bg-sky-500/10 text-sky-400 shadow-sky-500/5"
                           )}>
                              {c.status === 'completed' ? <CheckCircle2 size={24} /> : <TrendingUp size={24} />}
                           </div>
                           <div>
                              <p className="text-sm font-black text-white">{c.content.substring(0, 60)}...</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{new Date(c.createdAt).toLocaleDateString()}</p>
                                 <span className="h-1 w-1 rounded-full bg-white/10" />
                                 <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{c.sentCount} clients touchés</p>
                                 <span className="h-1 w-1 rounded-full bg-white/10" />
                                 <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Segment: {c.segment}</p>
                              </div>
                           </div>
                        </div>
                        <div className={cn(
                          "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest",
                          c.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-sky-500/10 text-sky-400"
                        )}>
                           {c.status === 'completed' ? 'Succès' : 'En cours'}
                        </div>
                     </div>

                     {c.status === 'active' && (
                        <div className="space-y-2">
                           <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/40">
                              <span>Progression</span>
                              <span>{c.sentCount} / {c.targetCount}</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                 className="h-full bg-sky-400 transition-all duration-1000"
                                 style={{ width: `${(c.sentCount / c.targetCount) * 100}%` }}
                              />
                           </div>
                        </div>
                     )}
                  </div>
                ))
              )}
           </div>
        </section>
      </div>
    </div>
  );
}
