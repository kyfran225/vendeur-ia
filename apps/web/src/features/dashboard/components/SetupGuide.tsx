import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  Compass,
  Play,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Step {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
}

export function SetupGuide({ setupStatus, businessName, dashboard }: { setupStatus: any, businessName: string, dashboard?: any }) {
  const { score, steps, isFullyOperational } = setupStatus;

  // Find the first uncompleted step to highlight it
  const nextStep = steps.find((s: any) => !s.completed);

  const getActionLink = (id: string) => {
    switch (id) {
      case 'identity': return "/settings?tab=boutique#identity";
      case 'whatsapp': return "/settings?tab=connexions#whatsapp";
      case 'products': return "/products";
      case 'payments': return "/settings?tab=boutique#payments";
      case 'delivery': return "/settings?tab=boutique#delivery";
      default: return "/";
    }
  };

  if (isFullyOperational) return null;

  const firstProduct = dashboard?.products?.[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-vendeur-coal/50 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Sparkles size={120} className="text-vendeur-emerald" />
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10 w-full min-w-0">
        {/* Left Side: Agent Message */}
        <div className="flex-1 space-y-5 w-full min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-lg shrink-0">
              <Compass size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight truncate">
                Assistant de Configuration
              </h3>
              <p className="text-[9px] sm:text-[10px] font-black uppercase text-vendeur-emerald tracking-widest truncate">
                En route vers 100% opérationnel
              </p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 relative space-y-4 w-full min-w-0">
            <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed italic break-words">
              "{nextStep?.id === 'whatsapp' ? (
                <>
                  Bienvenue chez <span className="text-vendeur-emerald font-black not-italic">{businessName}</span> ! 🚀 Première étape essentielle : connectons ton numéro WhatsApp pour que je puisse enfin répondre à tes clients et vendre à ta place !
                </>
              ) : nextStep?.id === 'products' ? (
                firstProduct ? (
                  <>
                    Super, l'identité de <span className="text-vendeur-emerald font-black not-italic">{businessName}</span> prend forme ! Je vois déjà "{firstProduct.name}". Complète ton catalogue pour que mes réponses soient ultra précises.
                  </>
                ) : (
                  <>
                    Génial, WhatsApp est relié à <span className="text-vendeur-emerald font-black not-italic">{businessName}</span> ! 🛍️ Il ne me manque plus que tes articles et leurs prix pour commencer à négocier et vendre.
                  </>
                )
              ) : nextStep?.id === 'payments' ? (
                <>
                  Ton catalogue pour <span className="text-vendeur-emerald font-black not-italic">{businessName}</span> est en place ! 💰 Configure tes moyens de paiement (Mobile Money, Virement) pour qu'on puisse encaisser automatiquement.
                </>
              ) : nextStep?.id === 'identity' ? (
                <>
                  Bienvenue ! Commençons par donner un nom et une identité percutante à ta boutique <span className="text-vendeur-emerald font-black not-italic">{businessName}</span> pour inspirer confiance à tes acheteurs.
                </>
              ) : (
                <>
                  Bravo, nous y sommes presque ! Plus que quelques détails et <span className="text-vendeur-emerald font-black not-italic">{businessName}</span> tournera à 100% en automatique.
                </>
              )}"
            </p>

            {nextStep && (
              <div className="pt-1">
                <Link
                  to={getActionLink(nextStep.id)}
                  className="flex items-center justify-center gap-2 w-full min-h-[3rem] sm:min-h-[3.25rem] px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-xs tracking-wider hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 group cursor-pointer"
                >
                  <Zap size={15} fill="currentColor" className="shrink-0 animate-pulse text-vendeur-coal" />
                  <span className="truncate font-black">
                    {nextStep.id === 'whatsapp' ? 'Brancher mon WhatsApp' :
                     nextStep.id === 'products' ? 'Ajouter des articles & prix' :
                     nextStep.id === 'payments' ? 'Configurer mes paiements' :
                     nextStep.id === 'identity' ? 'Configurer ma boutique' : 'Action Requise'}
                  </span>
                  <ArrowRight size={15} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}

            {/* Quick Test IA Button if WhatsApp is connected */}
            {dashboard?.merchant?.whatsappConfig?.status === 'connected' && (
              <div className="pt-0.5">
                <Link
                  to="/dashboard?test_ia=true"
                  className="flex items-center justify-center gap-2 w-full min-h-[2.75rem] sm:min-h-[3rem] px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-white/5 border border-vendeur-emerald/30 text-vendeur-emerald font-black uppercase text-xs tracking-wider hover:bg-vendeur-emerald/10 transition-all cursor-pointer"
                >
                  <Play size={14} className="shrink-0 fill-current" />
                  <span className="truncate">Tester mon Vendeur IA en Direct</span>
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-1.5 w-full min-w-0">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Progression</span>
              <span className="text-base sm:text-lg font-black text-vendeur-emerald">{score}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden w-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-vendeur-emerald shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Step List */}
        <div className="w-full md:w-[360px] space-y-2 shrink-0 min-w-0">
          <p className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1 mb-2">Toutes les étapes</p>
          {steps.map((step: any) => (
            <Link
              key={step.id}
              to={getActionLink(step.id)}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl sm:rounded-2xl border transition-all group min-w-0",
                step.completed
                  ? "bg-vendeur-emerald/5 border-vendeur-emerald/20 opacity-60"
                  : step.id === nextStep?.id
                    ? "bg-vendeur-emerald/10 border-vendeur-emerald/40 shadow-lg"
                    : "bg-white/5 border-white/5 hover:border-white/20"
              )}
            >
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                step.completed ? "text-vendeur-emerald" : step.id === nextStep?.id ? "text-vendeur-emerald animate-pulse" : "text-white/20"
              )}>
                {step.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </div>
              <span className={cn(
                "flex-1 text-xs font-bold truncate min-w-0",
                step.completed ? "text-white/40 line-through" : step.id === nextStep?.id ? "text-white font-black" : "text-white"
              )}>
                {step.label}
              </span>
              
              {!step.completed && step.id === nextStep?.id && (
                <span className="text-[8px] font-black uppercase tracking-wider text-vendeur-emerald bg-vendeur-emerald/10 border border-vendeur-emerald/30 px-2 py-0.5 rounded-full shrink-0">
                  Prioritaire
                </span>
              )}

              {!step.completed && (
                <ChevronRight size={14} className="text-white/20 group-hover:text-vendeur-emerald transition-colors shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
