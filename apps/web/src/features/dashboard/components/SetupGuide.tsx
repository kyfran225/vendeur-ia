import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  ShieldCheck,
  MessageSquareQuote
} from "lucide-react";
import { Link } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BriefingRoom } from "./BriefingRoom";

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
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const { score, steps, isFullyOperational } = setupStatus;

  // Find the first uncompleted step to highlight it
  const nextStep = steps.find((s: any) => !s.completed);

  const getActionLink = (id: string) => {
    switch (id) {
      case 'identity': return "/settings?tab=boutique";
      case 'whatsapp': return "/settings?tab=connexions";
      case 'products': return "/products";
      case 'payments': return "/settings?tab=boutique";
      case 'delivery': return "/settings?tab=boutique";
      default: return "/";
    }
  };

  if (isFullyOperational) return null;

  // Dynamic AI guidance message
  const firstProduct = dashboard?.products?.[0];
  const aiMessage = firstProduct
    ? `"Félicitations pour le lancement de ${businessName} ! Je connais déjà ton produit : ${firstProduct.name}. Pour que je puisse commencer à le vendre et encaisser tes paiements, il ne nous manque plus que quelques réglages. On s'en occupe ?"`
    : `"Félicitations pour le lancement de ${businessName} ! Pour que je puisse vendre tes produits et encaisser tes paiements automatiquement, il nous manque encore quelques réglages. On s'en occupe ?"`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-vendeur-coal/50 border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Sparkles size={120} className="text-vendeur-emerald" />
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
        {/* Left Side: Agent Message */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-lg">
              <Bot size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                Assistant de Configuration
              </h3>
              <p className="text-[10px] font-black uppercase text-vendeur-emerald tracking-widest">
                En route vers 100% opérationnel
              </p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 relative">
            <div className="absolute -left-2 top-6 w-4 h-4 bg-black/40 border-l border-t border-white/5 rotate-45" />
            <p className="text-sm md:text-base text-white/80 leading-relaxed italic">
              {aiMessage}
            </p>

            <button
              onClick={() => setIsBriefingOpen(true)}
              className="mt-6 flex items-center gap-3 px-5 py-2.5 rounded-xl bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest hover:bg-vendeur-emerald/20 transition-all group"
            >
              <MessageSquareQuote size={16} className="group-hover:rotate-12 transition-transform" />
              Briefing Room : Donner des instructions
            </button>
          </div>

          <BriefingRoom
            isOpen={isBriefingOpen}
            onClose={() => setIsBriefingOpen(false)}
            businessName={businessName}
          />

          <div className="space-y-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Progression</span>
              <span className="text-lg font-black text-vendeur-emerald">{score}%</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
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
        <div className="w-full md:w-[400px] space-y-3">
          {steps.map((step: any) => (
            <Link
              key={step.id}
              to={getActionLink(step.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all group",
                step.completed
                  ? "bg-vendeur-emerald/5 border-vendeur-emerald/20 opacity-60"
                  : step.id === nextStep?.id
                    ? "bg-vendeur-emerald/10 border-vendeur-emerald/40 scale-[1.02] shadow-xl"
                    : "bg-white/5 border-white/5 hover:border-white/20"
              )}
            >
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center shrink-0",
                step.completed ? "text-vendeur-emerald" : "text-white/20"
              )}>
                {step.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>
              <span className={cn(
                "flex-1 text-sm font-bold",
                step.completed ? "text-white/40 line-through" : "text-white"
              )}>
                {step.label}
              </span>
              {!step.completed && (
                <ChevronRight size={16} className="text-white/20 group-hover:text-vendeur-emerald transition-colors" />
              )}
            </Link>
          ))}

          {nextStep && (
            <Link
              to={getActionLink(nextStep.id)}
              className="mt-6 flex items-center justify-center gap-3 w-full min-h-[4rem] px-6 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-xs tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 group"
            >
              <Zap size={18} fill="currentColor" className="shrink-0 animate-pulse text-vendeur-coal" />
              <span className="flex-1 text-center font-black">
                {nextStep.id === 'whatsapp' ? 'Brancher mon WhatsApp' :
                 nextStep.id === 'products' ? 'Ajouter des prix' :
                 nextStep.id === 'payments' ? 'Configurer mes paiements' : 'Action Requise'}
              </span>
              <ArrowRight size={18} className="shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
}
