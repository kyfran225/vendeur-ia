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

  const isEssentialActive = dashboard?.merchant?.subscription?.status === "active" && (
    dashboard?.merchant?.subscription?.plan === "essential" ||
    dashboard?.merchant?.subscription?.planId?.toLowerCase().includes("essential")
  );

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-start sm:justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto no-scrollbar pt-4 pb-16 sm:py-8">
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-[#09110d] border border-white/10 rounded-[1.75rem] sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 flex flex-col my-auto shrink-0">
        {/* Glow ambient spots */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-vendeur-emerald/10 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-emerald-600/5 blur-[90px] rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 z-20 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center cursor-pointer border border-white/10"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="p-5 sm:p-8 pb-4 sm:pb-5 text-center space-y-1.5 sm:space-y-2 border-b border-white/5 relative z-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
            <Sparkles size={12} className="shrink-0" />
            <span>{isEssentialActive ? "Passez au niveau supérieur" : "Formules Vendeur IA"}</span>
          </div>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {isEssentialActive ? (
              <>Passez à la vitesse <span className="text-vendeur-emerald">PRO</span></>
            ) : (
              <>Choisissez votre <span className="text-vendeur-emerald">Vendeur IA</span></>
            )}
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm text-white/60 font-medium max-w-xl mx-auto leading-relaxed px-2">
            {isEssentialActive
              ? "Débloquez l'API Meta Cloud officielle, le multicanal (WhatsApp + Instagram), le Broadcast IA et le support VIP."
              : "Activez votre commercial IA autonome 24h/24. Sans engagement, paiements Mobile Money (Wave, Orange, MTN, Moov) et Carte sécurisés."}
          </p>
        </div>

        {/* 3 Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10 items-stretch relative z-10">
          
          {/* OPTION 1: ESSENTIEL */}
          <div className={cn("p-5 sm:p-7 md:p-8 flex flex-col justify-between space-y-5 sm:space-y-6 relative", isEssentialActive ? "bg-white/[0.02]" : "hover:bg-white/[0.02] transition-colors")}>
            {isEssentialActive && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-white/10 border border-white/20 text-white/80 text-[9px] sm:text-[10px] font-black uppercase px-3 py-0.5 sm:py-1 rounded-full tracking-wider shadow-lg whitespace-nowrap">
                  ✓ Votre forfait actuel
                </span>
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white/60 shrink-0 shadow-inner">
                  <Zap size={20} className="sm:w-[22px] sm:h-[22px]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight leading-none truncate">Essentiel</h3>
                  <p className="text-white/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 truncate">Lancement rapide</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                <OfferFeature text="Agent Vendeur IA autonome 24h/7" />
                <OfferFeature text="Catalogue & Vitrine web dédiée" />
                <OfferFeature text="PaymentShield : Détection Mobile Money" />
                <OfferFeature text="Prise de commandes & Reçus automatiques" />
                <OfferFeature text="Studio Créatif : Affiches IA & Statuts" />
                <OfferFeature text="Messagerie avec reprise humaine" />
              </div>
            </div>

            <div className="pt-4 sm:pt-5 border-t border-white/5 space-y-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-4xl font-black text-white font-mono">
                  {essential?.monthlyPrice?.toLocaleString() || "5 000"}
                </span>
                <span className="text-[10px] sm:text-xs font-black text-white/40 uppercase tracking-wider">
                  {essential?.currency || currency} / MOIS
                </span>
              </div>

              <button
                onClick={() => !isUnderVerification && !isEssentialActive && handleSelect("essential")}
                disabled={!!isRedirecting || isUnderVerification || isEssentialActive}
                className={cn(
                  "w-full h-11 sm:h-14 min-h-[44px] rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg",
                  isEssentialActive
                    ? "bg-white/5 text-white/40 border border-white/10 cursor-default"
                    : isUnderVerification
                    ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                    : "bg-white/10 hover:bg-white text-white hover:text-vendeur-coal active:scale-95 border border-white/10 cursor-pointer"
                )}
              >
                {isRedirecting === "essential" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : isUnderVerification ? (
                  <span>Paiement en attente ⏳</span>
                ) : isEssentialActive ? (
                  <span>Forfait Actif</span>
                ) : (
                  <span>Choisir Essentiel</span>
                )}
              </button>
            </div>
          </div>

          {/* OPTION 2: PRO (AUTONOME) */}
          <div className="p-5 sm:p-7 md:p-8 bg-vendeur-emerald/[0.03] flex flex-col justify-between space-y-5 sm:space-y-6 relative hover:bg-vendeur-emerald/[0.05] transition-colors">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 bg-vendeur-emerald/15 border border-vendeur-emerald/30 rounded-xl sm:rounded-2xl flex items-center justify-center text-vendeur-emerald shrink-0 shadow-inner">
                  <Rocket size={20} className="sm:w-[22px] sm:h-[22px]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight leading-none truncate">Vendeur IA Pro</h3>
                  <p className="text-vendeur-emerald text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1 truncate">Expérience complète</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                <OfferFeature text="Tout ce qui est dans Essentiel" highlight />
                <OfferFeature text="Numéro Officiel Meta Cloud WhatsApp" highlight />
                <OfferFeature text="Multi-Canal : WhatsApp, Insta & Messenger" highlight />
                <OfferFeature text="Broadcast IA : Envoi de promos en 1 clic" highlight />
                <OfferFeature text="PaymentShield Forensic Anti-Fraude" highlight />
                <OfferFeature text="Support VIP Prioritaire 24h/7" />
              </div>
            </div>

            <div className="pt-4 sm:pt-5 border-t border-white/5 space-y-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-4xl font-black text-vendeur-emerald font-mono">
                  {pro?.monthlyPrice?.toLocaleString() || "20 000"}
                </span>
                <span className="text-[10px] sm:text-xs font-black text-white/40 uppercase tracking-wider">
                  {pro?.currency || currency} / MOIS
                </span>
              </div>

              <button
                onClick={() => !isUnderVerification && handleSelect("pro")}
                disabled={!!isRedirecting || isUnderVerification}
                className={cn(
                  "w-full h-11 sm:h-14 min-h-[44px] rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer",
                  isUnderVerification
                    ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                    : "bg-vendeur-emerald text-vendeur-coal hover:bg-emerald-400 active:scale-95 shadow-vendeur-emerald/20 font-black hover:scale-[1.02]"
                )}
              >
                {isRedirecting === "pro" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : isUnderVerification ? (
                  <span>Paiement en attente ⏳</span>
                ) : (
                  <span>Activer Forfait Pro</span>
                )}
              </button>
            </div>
          </div>

          {/* OPTION 3: PACK PRO EXPERT (CLÉ EN MAIN) */}
          <div className="p-5 sm:p-7 md:p-8 bg-gradient-to-b from-vendeur-emerald/10 via-vendeur-emerald/5 to-transparent flex flex-col justify-between space-y-5 sm:space-y-6 relative border-t md:border-t-0 border-vendeur-emerald/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <span className="bg-vendeur-emerald text-vendeur-coal text-[9px] sm:text-[10px] font-black uppercase px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full tracking-widest shadow-xl border border-vendeur-emerald/20 whitespace-nowrap">
                ⭐ Clé en Main
              </span>
            </div>

            <div className="space-y-4 sm:space-y-5 pt-1.5 sm:pt-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-11 sm:w-11 bg-vendeur-emerald text-vendeur-coal rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-vendeur-emerald/20 shrink-0">
                  <Sparkles size={20} className="sm:w-[22px] sm:h-[22px]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight leading-none truncate">Pack Pro Expert</h3>
                  <p className="text-amber-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1 truncate">Installation VIP Dédiée</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                <OfferFeature text="Forfait Pro Inclus (20 000 FCFA/mois)" highlight />
                <OfferFeature text="Installation Meta Cloud par nos experts" highlight />
                <OfferFeature text="Import Catalogue & Inventaire complet" highlight />
                <OfferFeature text="Paramétrage IA & Prompts sur-mesure" highlight />
                <OfferFeature text="Accompagnement & Support Dédié VIP" highlight />
              </div>
            </div>

            <div className="pt-4 sm:pt-5 border-t border-white/5 space-y-2.5 sm:space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-3xl font-black text-white font-mono">
                    20 000 <span className="text-[11px] sm:text-xs text-white/50">+ 25 000</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-amber-300 uppercase tracking-wider">
                    {currency} (INITIAL)
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-white/40 font-medium">
                  Total initial : 45 000 {currency} (puis 20k/mois)
                </p>
              </div>

              <button
                onClick={() => !isUnderVerification && handleSelect("pro", "EXPERT")}
                disabled={!!isRedirecting || isUnderVerification}
                className={cn(
                  "w-full h-11 sm:h-14 min-h-[44px] rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer",
                  isUnderVerification
                    ? "bg-white/5 text-white/40 border border-white/10 cursor-not-allowed shadow-none"
                    : "bg-white hover:bg-vendeur-emerald text-vendeur-coal font-black hover:scale-[1.02] active:scale-95 shadow-2xl"
                )}
              >
                {isRedirecting === "pro" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : isUnderVerification ? (
                  <span>Paiement en attente ⏳</span>
                ) : (
                  <span>Commander Pack Pro</span>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Centered Bottom Link */}
      <div className="relative z-10 w-full max-w-5xl text-center mt-3 sm:mt-4 mb-2 shrink-0">
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xs sm:text-sm font-bold uppercase tracking-wider py-2 sm:py-2.5 px-4 sm:px-6 rounded-2xl hover:bg-white/5 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
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
    <div className="flex items-start gap-2.5">
      <div className={cn(
        "h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
        highlight ? "bg-vendeur-emerald text-vendeur-coal" : "bg-white/10 text-white/60"
      )}>
        <Check size={11} strokeWidth={3} />
      </div>
      <span className={cn(
        "text-xs sm:text-[13px] font-medium leading-snug truncate sm:whitespace-normal",
        highlight ? "text-white font-semibold" : "text-white/70"
      )}>
        {text}
      </span>
    </div>
  );
}
