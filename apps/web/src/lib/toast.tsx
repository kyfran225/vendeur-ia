import React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles } from "lucide-react";

interface PremiumToastOptions extends ExternalToast {
  badge?: string;
}

/**
 * Vendeur IA Premium Toast Notification System
 * Standardizes beautiful dark glassmorphism, brand-aligned emerald styling,
 * Assistant bot icon, and contextual badges across the entire app.
 */
export const toast = {
  /**
   * Premium Bot Success Toast (With Vendeur IA bot icon)
   */
  bot: (title: string, message?: string, options?: PremiumToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <div className="flex items-center gap-3.5 bg-[#09140f] border border-vendeur-emerald/40 text-white p-4 rounded-2xl shadow-[0_10px_35px_rgba(16,185,129,0.25)] min-w-[320px] max-w-[440px] animate-in slide-in-from-top-2 duration-300">
          <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 flex items-center justify-center shrink-0 shadow-inner">
            <AssistantIcon size={24} color="#10B981" withBackground={false} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-vendeur-emerald tracking-wider">
                {options?.badge || "Vendeur IA"}
              </span>
              <span className="text-white/40 text-[10px]">·</span>
              <span className="text-[10px] text-white/50 font-bold uppercase">En Ligne</span>
            </div>
            <p className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
              {title}
            </p>
            {message && (
              <p className="text-[11px] text-white/70 font-medium leading-snug mt-0.5 line-clamp-2">
                {message}
              </p>
            )}
          </div>
        </div>
      ),
      { duration: 3500, ...options }
    );
  },

  /**
   * Premium Success Toast
   */
  success: (title: string, options?: PremiumToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <div className="flex items-center gap-3.5 bg-[#0a1510] border border-emerald-500/40 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.2)] min-w-[300px] max-w-[420px] animate-in slide-in-from-top-2 duration-300">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            {options?.badge && (
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block mb-0.5">
                {options.badge}
              </span>
            )}
            <p className="text-xs sm:text-sm font-bold text-white leading-snug">
              {title}
            </p>
          </div>
        </div>
      ),
      { duration: 3200, ...options }
    );
  },

  /**
   * Premium Error Toast
   */
  error: (title: string, options?: PremiumToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <div className="flex items-center gap-3.5 bg-[#170a0a] border border-rose-500/40 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(244,63,94,0.2)] min-w-[300px] max-w-[420px] animate-in slide-in-from-top-2 duration-300">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 shadow-inner">
            <XCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block mb-0.5">
              {options?.badge || "Erreur"}
            </span>
            <p className="text-xs sm:text-sm font-bold text-white/90 leading-snug">
              {title}
            </p>
          </div>
        </div>
      ),
      { duration: 4000, ...options }
    );
  },

  /**
   * Premium Warning Toast
   */
  warning: (title: string, options?: PremiumToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <div className="flex items-center gap-3.5 bg-[#17130a] border border-amber-500/40 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.2)] min-w-[300px] max-w-[420px] animate-in slide-in-from-top-2 duration-300">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-0.5">
              {options?.badge || "Attention"}
            </span>
            <p className="text-xs sm:text-sm font-bold text-white/90 leading-snug">
              {title}
            </p>
          </div>
        </div>
      ),
      { duration: 3500, ...options }
    );
  },

  /**
   * Premium Info Toast
   */
  info: (title: string, options?: PremiumToastOptions) => {
    return sonnerToast.custom(
      (t) => (
        <div className="flex items-center gap-3.5 bg-[#0b1418] border border-sky-500/40 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(14,165,233,0.2)] min-w-[300px] max-w-[420px] animate-in slide-in-from-top-2 duration-300">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400 shadow-inner">
            <Info size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider block mb-0.5">
              {options?.badge || "Information"}
            </span>
            <p className="text-xs sm:text-sm font-bold text-white/90 leading-snug">
              {title}
            </p>
          </div>
        </div>
      ),
      { duration: 3500, ...options }
    );
  },

  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
  promise: sonnerToast.promise,
  loading: sonnerToast.loading,
};
