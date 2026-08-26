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

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    enabled: isOpen
  });

  const latestPaymentIntent = dashboard?.latestPaymentIntent;
  const isUnderVerification = Boolean(
    latestPaymentIntent &&
    (latestPaymentIntent.status === "under_verification" ||
     latestPaymentIntent.status === "pending" ||
     latestPaymentIntent.status === "payment_detected" ||
     latestPaymentIntent.status === "awaiting_payment")
  );

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
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 md:p-6 overflow-y-auto no-scrollbar pt-6 pb-12 sm:py-8">
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#0c0f0d] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row my-auto shrink-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center cursor-pointer border border-white/10"
        >
          <X size={18} />
        </button>

        {/* Option 1: Essential / RAM Contribution */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between space-y-6 md:space-y-8 min-h-0">
          <div className="space-y-6">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-vendeur-emerald/10 border border-vendeur-emerald/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-vendeur-emerald shrink-0">
                <Server size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none truncate">{essential?.name || "Formule Essentiel"}</h3>
                <p className="text-white/50 text-[11px] sm:text-xs font-black uppercase tracking-wider mt-1 truncate">Lancement rapide & efficace</p>
              </div>
            </div>

            <div className="space-y-3.5">
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

          <div className="pt-6 md:pt-10 space-y-4">
            <div className="flex items-baseline gap-2 h-10 sm:h-12">
              <span className="text-3xl sm:text-5xl font-black text-vendeur-emerald font-mono">{essential?.monthlyPrice?.toLocaleString() || "5 000"}</span>
              <span className="text-[11px] sm:text-xs font-black text-white/40 uppercase tracking-wider">{essential?.currency || currency} / MOIS</span>
            </div>

            <button
              onClick={() => !isUnderVerification && handleSelect("essential")}
              disabled={!!isRedirecting || isUnderVerification}
              className={cn(
                "w-full h-13 sm:h-16 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer",
                isUnderVerification
                  ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                  : "bg-white text-vendeur-coal hover:bg-vendeur-emerald active:scale-95 shadow-white/5"
              )}
            >
              {isRedirecting === "essential" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : isUnderVerification ? (
                <span>Paiement en attente ⏳</span>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Choisir cette offre</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Option 2: Pro + Expert Setup */}
        <div className="flex-1 p-6 sm:p-8 md:p-12 bg-vendeur-emerald/5 flex flex-col justify-between space-y-6 md:space-y-8 min-h-0 relative">
          <div className="absolute top-4 left-6 sm:top-6 sm:left-8 md:left-12 z-10">
             <span className="bg-vendeur-emerald text-vendeur-coal text-[10px] sm:text-xs font-black uppercase px-3 sm:px-4 py-1 sm:py-1.5 rounded-full tracking-wider shadow-lg shadow-vendeur-emerald/20 border border-vendeur-emerald/20">
               ⭐ Recommandé
             </span>
          </div>

          <div className="space-y-6 pt-7 sm:pt-8 md:pt-6">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-vendeur-emerald rounded-xl sm:rounded-2xl flex items-center justify-center text-vendeur-coal shadow-lg shadow-vendeur-emerald/20 shrink-0">
                <Rocket size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none truncate">Pack Pro Expert</h3>
                <p className="text-vendeur-emerald font-black text-[11px] sm:text-xs uppercase tracking-wider mt-1 truncate">Accompagnement VIP Clé en main</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <OfferFeature text="Configuration Meta Cloud WhatsApp" highlight />
              <OfferFeature text="Import Catalogue & Inventaire" highlight />
              <OfferFeature text="Personnalisation IA Avancée" highlight />
              <OfferFeature text="Formation IA & Vente" highlight />
              <OfferFeature text="Support VIP 24h/7 WhatsApp" highlight />
            </div>
          </div>

          <div className="pt-6 md:pt-10 space-y-4">
            <div className="flex items-baseline gap-2 h-10 sm:h-12">
              <span className="text-3xl sm:text-5xl font-black text-white font-mono">
                {pro ? (pro.monthlyPrice + (pro.setupOptions?.find((o: any) => o.type === 'EXPERT')?.price || 25000)).toLocaleString() : "45 000"}
              </span>
              <span className="text-[11px] sm:text-xs font-black text-white/40 uppercase tracking-wider">{pro?.currency || currency} (INITIAL)</span>
            </div>

            <button
              onClick={() => !isUnderVerification && handleSelect("pro", "EXPERT")}
              disabled={!!isRedirecting || isUnderVerification}
              className={cn(
                "w-full h-13 sm:h-16 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-2xl cursor-pointer",
                isUnderVerification
                  ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                  : "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] active:scale-95 shadow-vendeur-emerald/20"
              )}
            >
              {isRedirecting === "pro" ? (
                <Loader2 className="animate-spin" size={18} />
              ) : isUnderVerification ? (
                <span>Paiement en attente ⏳</span>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Activer mon Pack Pro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Centered Bottom Link */}
      <div className="relative z-10 w-full max-w-4xl text-center mt-3 sm:mt-4 mb-2 shrink-0">
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider py-2.5 px-4 sm:px-6 rounded-2xl hover:bg-white/5 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <span>Continuer gratuitement & explorer mon espace</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

function OfferFeature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", highlight ? "bg-vendeur-emerald text-vendeur-coal" : "bg-white/10 text-white/50")}>
        <Check size={12} strokeWidth={2.5} />
      </div>
      <span className={cn("text-[15px] sm:text-base font-medium leading-snug", highlight ? "text-white" : "text-white/80")}>{text}</span>
    </div>
  );
}
