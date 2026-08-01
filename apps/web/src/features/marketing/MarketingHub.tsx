import React, { useState } from "react";
import { Sparkles, Users, Megaphone, Loader2, CheckCircle2, ShoppingBag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import axios from "axios";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function MarketingHub() {
  const { accessToken } = useAuthStore();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSegment, setSelectedSegment] = useState<string>("vip");
  const [previewText, setPreviewText] = useState("");

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
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Megaphone className="text-sky-400" size={32} />
            Hub Marketing
          </h1>
          <p className="text-white/40">Faites savoir à vos clients que vous avez du nouveau.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Product Selection */}
        <section className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">1</span>
            Choisir un produit
          </h2>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map((p: any) => (
              <button
                key={p._id}
                onClick={() => handleProductSelect(p)}
                className={cn(
                  "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group",
                  selectedProduct?._id === p._id ? "border-sky-400" : "border-white/5 grayscale hover:grayscale-0 hover:border-white/20"
                )}
              >
                {p.imageUrl ? (
                  <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} />
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

            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'vip', label: 'VIPs', count: segments?.vip || 0, icon: Sparkles, color: 'amber' },
                { id: 'active', label: 'Actifs', count: segments?.active || 0, icon: Users, color: 'sky' },
                { id: 'all', label: 'Tous', count: segments?.all || 0, icon: Megaphone, color: 'emerald' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSegmentSelect(s.id)}
                  className={cn(
                    "p-6 rounded-3xl border-2 transition-all text-left space-y-2",
                    selectedSegment === s.id
                      ? `bg-${s.color}-500/10 border-${s.color}-500/50`
                      : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                  )}
                >
                  <s.icon size={20} className={cn(selectedSegment === s.id ? `text-${s.color}-400` : "text-white/20")} />
                  <div>
                    <p className="text-lg font-black text-white">{s.count}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{s.label}</p>
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
              <h3 className="font-black text-white uppercase tracking-widest text-xs">Aperçu du message IA</h3>
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
      </div>
    </div>
  );
}
