import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Bot,
  Package,
  CreditCard,
  Truck,
  X,
  Zap,
  Timer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NextAction {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  isPrimary?: boolean;
}

export interface StepMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  score?: number; // 0 to 100
  stepNumber?: number; // e.g. 2
  totalSteps?: number; // e.g. 5
  autoRedirectSeconds?: number; // default 7
  autoRedirectTo?: string; // default "/dashboard"
  primaryAction?: NextAction;
  secondaryAction?: NextAction; // e.g. "Ajouter un autre produit"
  dashboardActionLabel?: string; // default "Aller au Tableau de Bord"
  onDashboardClick?: () => void;
}

export function StepMilestoneModal({
  isOpen,
  onClose,
  title,
  subtitle,
  score,
  stepNumber,
  totalSteps = 5,
  autoRedirectSeconds = 7,
  autoRedirectTo = "/dashboard",
  primaryAction,
  secondaryAction,
  dashboardActionLabel = "Tableau de Bord",
  onDashboardClick
}: StepMilestoneModalProps) {
  const navigate = useNavigate();
  const [secondsRemaining, setSecondsRemaining] = useState(autoRedirectSeconds);
  const [isPaused, setIsPaused] = useState(false);

  // Reset timer on open
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(autoRedirectSeconds);
      setIsPaused(false);
    }
  }, [isOpen, autoRedirectSeconds]);

  const handleAutoRedirect = () => {
    onClose();
    if (primaryAction?.href) {
      navigate(primaryAction.href);
    } else if (primaryAction?.onClick) {
      primaryAction.onClick();
    } else if (autoRedirectTo) {
      navigate(autoRedirectTo);
    }
  };

  // Countdown timer with safe effect trigger
  useEffect(() => {
    if (!isOpen || isPaused) return;

    if (secondsRemaining === 0) {
      handleAutoRedirect();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, isPaused, secondsRemaining]);

  const handleDashboard = () => {
    onClose();
    if (onDashboardClick) {
      onDashboardClick();
    } else {
      navigate("/dashboard");
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.max(
    0,
    Math.min(100, score !== undefined ? score : stepNumber ? (stepNumber / totalSteps) * 100 : 50)
  );

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-[#0c0f0d] border border-vendeur-emerald/30 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden"
        >
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-vendeur-emerald/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-vendeur-emerald/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer z-20"
            title="Fermer"
          >
            <X size={18} />
          </button>

          <div className="space-y-6 relative z-10 text-center">
            {/* Success Badge Icon */}
            <div className="relative inline-flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15 }}
                className="h-16 w-16 md:h-20 md:w-20 rounded-3xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-xl shadow-vendeur-emerald/30"
              >
                <CheckCircle2 size={36} className="md:w-10 md:h-10" />
              </motion.div>
              <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-vendeur-coal p-1.5 rounded-full shadow-lg animate-bounce">
                <Sparkles size={14} />
              </div>
            </div>

            {/* Header Text */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest">
                <Zap size={12} />
                Étape Validée
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs md:text-sm text-white/70 font-medium max-w-md mx-auto leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Setup Progress Indicator Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5 text-left">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
                <span className="text-white/60">Progression globale de configuration</span>
                <span className="text-vendeur-emerald">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-vendeur-emerald to-emerald-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                />
              </div>
              <p className="text-[10px] text-white/40 font-medium italic text-right">
                {progressPercent === 100
                  ? "Votre boutique est prête à vendre 24/7 !"
                  : "Complétez les étapes pour rendre Vendeur IA 100% autonome."}
              </p>
            </div>

            {/* Actions Grid */}
            <div className="space-y-3 pt-1">
              {/* Primary Next Step Action */}
              {primaryAction && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (primaryAction.onClick) primaryAction.onClick();
                    else if (primaryAction.href) navigate(primaryAction.href);
                  }}
                  className="w-full min-h-[3.25rem] md:min-h-[3.5rem] bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2.5 px-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 cursor-pointer group"
                >
                  {primaryAction.icon || <Sparkles size={16} className="shrink-0" />}
                  <span className="truncate">{primaryAction.label}</span>
                  <ArrowRight size={16} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Secondary Same-Task Action (e.g. Add another product) */}
              {secondaryAction && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (secondaryAction.onClick) secondaryAction.onClick();
                    else if (secondaryAction.href) navigate(secondaryAction.href);
                  }}
                  className="w-full min-h-[2.85rem] md:min-h-[3rem] bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-wider text-xs rounded-2xl flex items-center justify-center gap-2 px-4 transition-all active:scale-95 cursor-pointer"
                >
                  {secondaryAction.icon || <Plus size={15} className="shrink-0" />}
                  <span className="truncate">{secondaryAction.label}</span>
                </button>
              )}

              {/* Dashboard / Dismiss Option */}
              <button
                type="button"
                onClick={handleDashboard}
                className="w-full text-center text-white/40 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors py-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard size={14} />
                <span>{dashboardActionLabel}</span>
              </button>
            </div>

            {/* Auto-redirect 7s Countdown bar */}
            <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-white/40 font-mono">
              <Timer size={12} className={isPaused ? "text-amber-400" : "text-vendeur-emerald"} />
              <span>
                {isPaused ? (
                  <span className="text-amber-400 font-sans">Compte à rebours en pause (survol)</span>
                ) : (
                  <>Redirection automatique dans <strong className="text-white font-black">{secondsRemaining}s</strong></>
                )}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
