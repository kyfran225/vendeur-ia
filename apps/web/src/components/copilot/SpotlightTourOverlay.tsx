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

  const [targetInfo, setTargetInfo] = useState<{
    rect: DOMRect;
    borderRadius: string;
  } | null>(null);

  const currentStep = TOUR_STEPS[tourStepIndex];
  const isLastStep = tourStepIndex === TOUR_STEPS.length - 1;

  // Navigate to appropriate route when step changes
  useEffect(() => {
    if (!isTourActive || !currentStep) return;

    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [isTourActive, tourStepIndex, currentStep, location.pathname, navigate]);

  // Track target element coordinates and exact computed curvature
  useEffect(() => {
    if (!isTourActive || !currentStep) {
      setTargetInfo(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const borderRadius = style.borderRadius || "1.5rem";
        setTargetInfo({ rect, borderRadius });
      } else {
        setTargetInfo(null);
      }
    };

    // Scroll element into view smoothly on step change
    const scrollTimeout = setTimeout(() => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        updateRect();
      }
    }, 200);

    updateRect();
    const interval = setInterval(updateRect, 200);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);

    return () => {
      clearTimeout(scrollTimeout);
      clearInterval(interval);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [isTourActive, tourStepIndex, currentStep, location.pathname]);

  if (!isTourActive || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none select-none animate-in fade-in duration-300">
      
      {/* Dark backdrop fallback only when target element is not yet found */}
      {!targetInfo && (
        <div className="absolute inset-0 bg-black/75 pointer-events-auto" />
      )}

      {/* Target Spotlight Highlight Ring - perfectly sharp cutout with outer shadow and crisp interior */}
      {targetInfo && (
        <div
          className="absolute border-2 border-emerald-400 dark:border-emerald-400 transition-all duration-300 pointer-events-none"
          style={{
            top: Math.max(4, targetInfo.rect.top - 4),
            left: Math.max(4, targetInfo.rect.left - 4),
            width: targetInfo.rect.width + 8,
            height: targetInfo.rect.height + 8,
            borderRadius: targetInfo.borderRadius && targetInfo.borderRadius !== "0px"
              ? `calc(${targetInfo.borderRadius} + 4px)`
              : "1.5rem",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.78), 0 0 20px rgba(16, 185, 129, 0.45), inset 0 0 8px rgba(16, 185, 129, 0.15)"
          }}
        />
      )}

      {/* Floating Guided Tour Card */}
      <div className="fixed inset-x-4 bottom-6 sm:bottom-10 sm:left-auto sm:right-10 sm:w-[460px] pointer-events-auto">
        <div className="bg-white/95 dark:bg-vendeur-coal/95 border border-slate-200 dark:border-emerald-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4 animate-in slide-in-from-bottom-4 duration-300 text-slate-900 dark:text-white">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <Compass size={18} className="animate-spin" style={{ animationDuration: "12s" }} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Visite Guidée (Étape {tourStepIndex + 1}/{TOUR_STEPS.length})
                </span>
                <p className="text-xs font-black text-slate-900 dark:text-white">{currentStep.badge}</p>
              </div>
            </div>

            <button
              onClick={endTour}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-colors cursor-pointer"
              title="Quitter la visite"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="space-y-2">
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              {currentStep.title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-white/80 leading-relaxed">
              {currentStep.description}
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              {currentStep.tips}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={prevTourStep}
              disabled={tourStepIndex === 0}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer",
                tourStepIndex === 0 ? "opacity-30 cursor-not-allowed text-slate-400 dark:text-white/40" : "bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white"
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
                    idx === tourStepIndex ? "w-6 bg-emerald-500" : "w-1.5 bg-slate-300 dark:bg-white/20"
                  )}
                />
              ))}
            </div>

            {isLastStep ? (
              <button
                onClick={endTour}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Terminer</span>
              </button>
            ) : (
              <button
                onClick={nextTourStep}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
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
