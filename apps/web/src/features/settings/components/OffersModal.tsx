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
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none">{essential?.name || "Formule Essentiel"}</h3>
                <p className="text-white/50 text-xs font-black uppercase tracking-wider mt-1">Lancement rapide & efficace</p>
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
              <span className="text-4xl sm:text-5xl font-black text-vendeur-emerald font-mono">{essential?.monthlyPrice?.toLocaleString() || "5 000"}</span>
              <span className="text-xs font-black text-white/40 uppercase tracking-wider">{essential?.currency || currency} / MOIS</span>
            </div>

            <button
              onClick={() => !isUnderVerification && handleSelect("essential")}
              disabled={!!isRedirecting || isUnderVerification}
              className={cn(
                "w-full h-14 sm:h-16 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xl",
                isUnderVerification
                  ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                  : "bg-white text-vendeur-coal hover:bg-vendeur-emerald active:scale-95 cursor-pointer shadow-white/5"
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
        <div className="flex-1 p-8 md:p-12 bg-vendeur-emerald/5 flex flex-col justify-between min-h-[450px] md:min-h-[600px] relative">
          <div className="absolute top-6 left-8 md:left-12 z-10">
             <span className="bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider shadow-lg shadow-vendeur-emerald/20 border border-vendeur-emerald/20">
               ⭐ Recommandé
             </span>
          </div>

          <div className="space-y-8 pt-8 md:pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-vendeur-emerald rounded-2xl flex items-center justify-center text-vendeur-coal shadow-lg shadow-vendeur-emerald/20 shrink-0">
                <Rocket size={24} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none">Pack Pro Expert</h3>
                <p className="text-vendeur-emerald font-black text-xs uppercase tracking-wider mt-1">Accompagnement VIP Clé en main</p>
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
              <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                {pro ? (pro.monthlyPrice + (pro.setupOptions?.find((o: any) => o.type === 'EXPERT')?.price || 0)).toLocaleString() : "25 000"}
              </span>
              <span className="text-xs font-black text-white/40 uppercase tracking-wider">{pro?.currency || currency} (UNIQUE)</span>
            </div>

            <button
              onClick={() => !isUnderVerification && handleSelect("pro", "EXPERT")}
              disabled={!!isRedirecting || isUnderVerification}
              className={cn(
                "w-full h-14 sm:h-16 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-2xl",
                isUnderVerification
                  ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                  : "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] active:scale-95 shadow-vendeur-emerald/20 cursor-pointer"
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

      <div className="relative w-full max-w-4xl text-center mt-3">
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer inline-flex items-center gap-2"
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
