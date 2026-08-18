import React, { useState } from "react";
import { X, Zap, Rocket, Check, ShieldCheck, Loader2, Server, Sparkles, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OffersModal({ isOpen, onClose }: OffersModalProps) {
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);
  const { user } = useAuthStore();
  const currency = useMerchantCurrency();
  const navigate = useNavigate();

  const { data: offers, isLoading, isError } = useQuery({
    queryKey: ["offers", currency],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/offers?currency=${currency}`);
      return res.data;
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <VendeurIALoader label="Chargement des formules..." />
      </div>
    );
  }

  const essential = offers?.find((o: any) => o.slug === 'essential');
  const pro = offers?.find((o: any) => o.slug === 'pro');

  const handleSelect = (offerSlug: string, setup?: string) => {
    setIsRedirecting(offerSlug);
    onClose();
    const url = setup ? `/checkout?offer=${offerSlug}&setup=${setup}` : `/checkout?offer=${offerSlug}`;
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-start md:items-center justify-center p-4 overflow-y-auto no-scrollbar pt-8 pb-20 md:py-20">
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#0c0f0d] border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 z-20 text-white/20 hover:text-white transition-colors bg-white/5 h-10 w-10 rounded-full flex items-center justify-center">
          <X size={20} />
        </button>

        {/* Option 1: Essential / RAM Contribution */}
        <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between min-h-[450px] md:min-h-[600px]">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-vendeur-emerald/10 rounded-xl flex items-center justify-center text-vendeur-emerald shrink-0">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{essential?.name || "Formule Essentiel"}</h3>
                <p className="text-white/40 text-[8px] font-black uppercase tracking-[0.15em] mt-1">Lancement rapide & efficace</p>
              </div>
            </div>

            <div className="space-y-4">
              {essential?.features?.slice(0, 5).map((f: string, i: number) => (
                <OfferFeature key={i} text={f} />
              )) || (
                <>
                  <OfferFeature text="Session WhatsApp 24h/7 active" />
                  <OfferFeature text="Réponses automatiques IA" />
                  <OfferFeature text="Support standard par ticket" />
                  <OfferFeature text="Mises à jour IA incluses" />
                </>
              )}
            </div>
          </div>

          <div className="pt-10">
            <div className="flex items-baseline gap-2 mb-8 h-12">
              <span className="text-4xl font-black text-vendeur-emerald">{essential?.monthlyPrice?.toLocaleString() || "5 000"}</span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{essential?.currency || currency} / MOIS</span>
            </div>

            <button
              onClick={() => handleSelect("essential")}
              disabled={!!isRedirecting}
              className="w-full h-16 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-vendeur-emerald transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
            >
              {isRedirecting === "essential" ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              Choisir cette offre
            </button>
          </div>
        </div>

        {/* Option 2: Pro + Expert Setup */}
        <div className="flex-1 p-8 md:p-12 bg-vendeur-emerald/5 flex flex-col justify-between min-h-[450px] md:min-h-[600px] relative">
          <div className="absolute top-6 left-8 md:left-12 z-10">
             <span className="bg-vendeur-emerald text-vendeur-coal text-[8px] font-black uppercase px-4 py-2 rounded-full tracking-[0.2em] shadow-lg shadow-vendeur-emerald/20 border border-vendeur-emerald/20">
               Recommandé
             </span>
          </div>

          <div className="space-y-8 pt-8 md:pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-vendeur-emerald rounded-xl flex items-center justify-center text-vendeur-coal shadow-lg shadow-vendeur-emerald/20 shrink-0">
                <Rocket size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Pack Pro Expert</h3>
                <p className="text-vendeur-emerald font-black text-[8px] uppercase tracking-[0.15em] mt-1">Accompagnement VIP Clé en main</p>
              </div>
            </div>

            <div className="space-y-4">
              <OfferFeature text="Configuration Meta Cloud WhatsApp" highlight />
              <OfferFeature text="Import Catalogue & Inventaire" highlight />
              <OfferFeature text="Personnalisation IA Avancée" highlight />
              <OfferFeature text="Formation IA & Vente" highlight />
              <OfferFeature text="Support VIP 24h/7 WhatsApp" highlight />
            </div>
          </div>

          <div className="pt-10">
             <div className="flex items-baseline gap-2 mb-8 h-12">
              <span className="text-4xl font-black text-white">
                {pro ? (pro.monthlyPrice + (pro.setupOptions?.find((o: any) => o.type === 'EXPERT')?.price || 0)).toLocaleString() : "25 000"}
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{pro?.currency || currency} (UNIQUE)</span>
            </div>

            <button
              onClick={() => handleSelect("pro", "EXPERT")}
              disabled={!!isRedirecting}
              className="w-full h-16 bg-vendeur-emerald text-vendeur-coal rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all active:scale-95 shadow-2xl shadow-vendeur-emerald/20 disabled:opacity-50"
            >
              {isRedirecting === "pro" ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Activer mon Pack Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferFeature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", highlight ? "bg-vendeur-emerald" : "bg-white/10")}>
        <Check size={12} className={highlight ? "text-vendeur-coal" : "text-white/40"} />
      </div>
      <span className={cn("text-xs font-medium", highlight ? "text-white" : "text-white/60")}>{text}</span>
    </div>
  );
}
