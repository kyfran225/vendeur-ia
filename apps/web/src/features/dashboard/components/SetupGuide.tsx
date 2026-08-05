import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  Bot,
  Zap,
  ArrowRight
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

interface SetupGuideProps {
  setupStatus: {
    score: number;
    isFullyOperational: boolean;
    steps: Step[];
  };
  businessName: string;
}

export function SetupGuide({ setupStatus, businessName }: SetupGuideProps) {
  const { score, steps, isFullyOperational } = setupStatus;

  // Find the first uncompleted step to highlight it
  const nextStep = steps.find(s => !s.completed);

  const getActionLink = (id: string) => {
    switch (id) {
      case 'whatsapp': return "/settings?tab=connexions";
      case 'products': return "/products";
      case 'payments': return "/settings?tab=boutique";
      case 'delivery': return "/settings?tab=boutique";
      default: return "/";
    }
  };

  if (isFullyOperational) return null;

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
              "Félicitations pour le lancement de <span className="text-vendeur-emerald font-bold">{businessName}</span> ! Pour que je puisse vendre vos produits et encaisser vos paiements automatiquement, il nous manque encore quelques réglages. On s'en occupe ?"
            </p>
          </div>

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
          {steps.map((step) => (
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
              className="mt-6 flex items-center justify-center gap-2 w-full min-h-[3rem] px-4 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-[10px] md:text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
            >
              <Zap size={16} fill="currentColor" className="shrink-0" />
              <span className="truncate text-center flex-1">Continuer : {nextStep.label}</span>
              <ArrowRight size={16} className="shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
}
