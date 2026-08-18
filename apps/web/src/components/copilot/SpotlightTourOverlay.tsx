import React, { useEffect, useState } from "react";
import { useCopilotStore } from "@/stores/copilotStore";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  CheckCircle2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ISpotlightStep {
  route: string;
  selector: string;
  title: string;
  description: string;
  tips: string;
  badge: string;
}

const TOUR_STEPS: ISpotlightStep[] = [
  {
    route: "/dashboard",
    selector: "#tour-dashboard-stats",
    title: "1. Tableau de Bord & Ventes du Jour",
    description: "Visualisez en un coup d'œil votre chiffre d'affaires, vos commandes actives et vos opportunités de croissance générées par Vendeur IA.",
    tips: "💡 Astuce : Le bouton 'Tester mon Vendeur IA' simule un vrai client WhatsApp en direct !",
    badge: "Pilotage & Ventes"
  },
  {
    route: "/products",
    selector: "#tour-products-catalog",
    title: "2. Catalogue & Scan Rayon Vision IA",
    description: "Ajoutez vos articles en 1 seconde : prenez une simple photo de vos rayons ou cartons pour que Vendeur IA détecte prix, noms et stock sans saisie manuelle.",
    tips: "⭐ Astuce : Cliquez sur l'étoile pour mettre vos best-sellers en vedette sur votre boutique.",
    badge: "Catalogue Magique"
  },
  {
    route: "/orders",
    selector: "#tour-orders-management",
    title: "3. Commandes & Fiches Livreurs",
    description: "Chaque vente conclue sur WhatsApp ou sur votre vitrine atterrit ici. Générez le reçu officiel et assignez un coursier avec feuille de route WhatsApp 1-clic.",
    tips: "🚚 Astuce : Le livreur reçoit l'itinéraire GPS et le contact du client instantanément.",
    badge: "Expéditions 100% Fluides"
  },
  {
    route: "/inbox",
    selector: "#tour-inbox-channels",
    title: "4. Boîte de Vente & Encaissement Direct",
    description: "Centralisez vos conversations WhatsApp, Instagram et Web. Envoyez des notes vocales et des boutons de paiement Wave / Orange Money sécurisés.",
    tips: "🛡️ Astuce : Notre système Vision vérifie automatiquement les captures d'écran de virement reçues.",
    badge: "Conversations & Cash"
  },
  {
    route: "/settings",
    selector: "#tour-settings-branding",
    title: "5. Studio Vitrine & Mobile Money",
    description: "Personnalisez votre identité (logo, couverture, palette), connectez vos numéros de réception Wave / OM et ajustez les instructions de votre agent Vendeur IA.",
    tips: "✨ Astuce : Activez le bandeau promo défilant pour annoncer vos offres spéciales.",
    badge: "Identité & Encaissement"
  }
];

export function SpotlightTourOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isTourActive,
    tourStepIndex,
    nextTourStep,
    prevTourStep,
    endTour
  } = useCopilotStore();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[tourStepIndex];
  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;

  // Navigate to appropriate route when step changes
  useEffect(() => {
    if (!isTourActive || !currentStep) return;

    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isTourActive, tourStepIndex, currentStep, location.pathname, navigate]);

  // Track target element coordinates
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 300);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [isTourActive, tourStepIndex, currentStep, location.pathname]);

  if (!isTourActive || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none select-none animate-in fade-in duration-300">
      
      {/* Dark backdrop with cutout effect if target found, or uniform high-contrast overlay */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm pointer-events-auto" />

      {/* Target Spotlight Highlight Ring */}
      {targetRect && (
        <div
          className="absolute rounded-3xl border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all duration-500 pointer-events-none animate-pulse"
          style={{
            top: Math.max(8, targetRect.top - 8),
            left: Math.max(8, targetRect.left - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 30px rgba(16, 185, 129, 0.8)"
          }}
        />
      )}

      {/* Floating Guided Tour Card */}
      <div className="fixed inset-x-4 bottom-6 sm:bottom-10 sm:left-auto sm:right-10 sm:w-[460px] pointer-events-auto">
        <div className="bg-vendeur-coal/95 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Compass size={18} className="animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Visite Guidée (Étape {tourStepIndex + 1}/{TOUR_STEPS.length})
                </span>
                <p className="text-xs font-black text-white">{currentStep.badge}</p>
              </div>
            </div>

            <button
              onClick={endTour}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Quitter la visite"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="space-y-2">
            <h3 className="font-black text-base text-white">
              {currentStep.title}
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              {currentStep.description}
            </p>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-medium">
              {currentStep.tips}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={prevTourStep}
              disabled={tourStepIndex === 0}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all",
                tourStepIndex === 0 ? "opacity-30 cursor-not-allowed text-white/40" : "bg-white/5 hover:bg-white/10 text-white"
              )}
            >
              <ChevronLeft size={14} />
              <span>Précédent</span>
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === tourStepIndex ? "w-6 bg-emerald-400" : "w-1.5 bg-white/20"
                  )}
                />
              ))}
            </div>

            {isLastStep ? (
              <button
                onClick={endTour}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
              >
                <CheckCircle2 size={14} />
                <span>Terminer</span>
              </button>
            ) : (
              <button
                onClick={nextTourStep}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
              >
                <span>Suivant</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
