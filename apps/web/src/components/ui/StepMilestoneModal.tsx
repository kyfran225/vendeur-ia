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
  const [displayScore, setDisplayScore] = useState<number>(0);

  // Compute raw score from props safely
  const rawScore = Math.max(
    0,
    Math.min(100, score !== undefined ? score : stepNumber ? Math.round((stepNumber / totalSteps) * 100) : 50)
  );

  // Lock score on open and prevent regression while open
  useEffect(() => {
    if (isOpen) {
      setDisplayScore((prev) => (prev > 0 ? Math.max(prev, rawScore) : rawScore));
      setSecondsRemaining(autoRedirectSeconds);
      setIsPaused(false);
    } else {
      setDisplayScore(0);
    }
  }, [isOpen, rawScore, autoRedirectSeconds]);

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

  const progressPercent = displayScore || rawScore;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[250] flex items-center justify-center p-3 bg-black/80 backdrop-blur-md"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#0c120e] border border-slate-200 dark:border-vendeur-emerald/30 rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-all cursor-pointer z-20"
            title="Fermer"
          >
            <X size={14} />
          </button>

          <div className="space-y-3.5 relative z-10 text-center">
            {/* Success Badge Icon + Title Compact Row */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <div className="h-10 w-10 rounded-xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shrink-0 shadow-md shadow-vendeur-emerald/20">
                <CheckCircle2 size={22} />
              </div>
              <div className="text-left min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-vendeur-emerald">
                  <Zap size={11} /> Étape Validée ({progressPercent}%)
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight">
                  {title}
                </h2>
              </div>
            </div>

            {subtitle && (
              <p className="text-xs text-slate-600 dark:text-white/70 font-medium leading-normal line-clamp-2">
                {subtitle}
              </p>
            )}

            {/* Compact Progress Line */}
            <div className="w-full bg-slate-100 dark:bg-black/60 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-vendeur-emerald rounded-full"
              />
            </div>

            {/* Primary Action Button */}
            {primaryAction && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (primaryAction.onClick) primaryAction.onClick();
                  else if (primaryAction.href) navigate(primaryAction.href);
                }}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 px-4 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <span className="truncate">{primaryAction.label}</span>
                <ArrowRight size={15} className="shrink-0" />
              </button>
            )}

            {/* Secondary Action / Dashboard Options in one line */}
            <div className="flex items-center justify-center gap-3 pt-0.5 text-xs font-bold">
              {secondaryAction && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (secondaryAction.onClick) secondaryAction.onClick();
                    else if (secondaryAction.href) navigate(secondaryAction.href);
                  }}
                  className="text-slate-700 dark:text-white/80 hover:text-emerald-600 dark:hover:text-vendeur-emerald underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {secondaryAction.label}
                </button>
              )}
              {secondaryAction && <span className="text-slate-300 dark:text-white/20">•</span>}
              <button
                type="button"
                onClick={handleDashboard}
                className="text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                {dashboardActionLabel}
              </button>
            </div>

            {/* Auto-redirect Timer line */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-white/40 font-mono pt-0.5">
              <Timer size={11} className={isPaused ? "text-amber-500" : "text-emerald-600 dark:text-vendeur-emerald"} />
              <span>
                {isPaused ? "Redirection en pause" : `Suite automatique dans ${secondsRemaining}s`}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
