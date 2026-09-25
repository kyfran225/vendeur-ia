import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PauseCircle,
  X,
  MessageSquare,
  ShieldCheck,
  Zap,
  Loader2,
  PlayCircle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PauseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PauseConfirmationModal({ isOpen, onClose, onSuccess }: PauseConfirmationModalProps) {
  const queryClient = useQueryClient();

  const pauseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch("/api/commerce/ai-settings", {
        autoReply: false
      });
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });
      const previousDashboard = queryClient.getQueryData(["dashboard"]);
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: {
            ...old.merchant,
            aiSettings: {
              ...old.merchant?.aiSettings,
              autoReply: false
            }
          }
        };
      });
      return { previousDashboard };
    },
    onSuccess: (data) => {
      toast.info("Vendeur IA mis en pause. Vous gérez désormais manuellement vos discussions WhatsApp.");
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: {
            ...old.merchant,
            ...(data || {}),
            aiSettings: {
              ...old.merchant?.aiSettings,
              ...(data?.aiSettings || {}),
              autoReply: false
            }
          }
        };
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onSuccess?.();
      onClose();
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(["dashboard"], context.previousDashboard);
      }
      toast.error("Impossible de mettre l'IA en pause. Veuillez réessayer.");
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0e161b] border border-slate-200 dark:border-sky-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-900 dark:text-white z-10 my-auto"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-slate-400 hover:text-slate-900 dark:text-white/40 dark:hover:text-white rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          {/* Icon & Header */}
          <div className="flex flex-col items-center text-center space-y-1.5 sm:space-y-2.5 pt-1 sm:pt-2">
            <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 shadow-md sm:shadow-lg shadow-sky-500/20">
              <PauseCircle className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                Prise de contrôle manuelle
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Mettre le Vendeur IA en pause ?
              </h3>
            </div>
          </div>

          {/* Explanation Points */}
          <div className="my-3 sm:my-5 space-y-2 sm:space-y-2.5 bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
            <div className="flex items-start gap-2.5 sm:gap-3 text-left">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-md sm:rounded-lg bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-white/80 leading-tight sm:leading-relaxed font-medium">
                <strong className="text-slate-900 dark:text-white">WhatsApp reste connecté :</strong> Vos clients continuent de vous écrire normalement.
              </p>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 text-left">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-md sm:rounded-lg bg-sky-400/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-white/80 leading-tight sm:leading-relaxed font-medium">
                <strong className="text-slate-900 dark:text-white">Réponses manuelles :</strong> L'IA cesse de répondre afin que vous gardiez 100% la main.
              </p>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 text-left">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-md sm:rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-vendeur-emerald flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-white/80 leading-tight sm:leading-relaxed font-medium">
                <strong className="text-slate-900 dark:text-white">Reprise en 1 clic :</strong> Vous pourrez réactiver les ventes 24h/24 à tout moment.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-900 dark:text-white/80 dark:hover:text-white dark:border-white/10 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer order-2 sm:order-1"
            >
              Laisser Actif 24h/24
            </button>

            <button
              type="button"
              disabled={pauseMutation.isPending}
              onClick={() => pauseMutation.mutate()}
              className="w-full sm:flex-1 h-10 sm:h-11 rounded-lg sm:rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer order-1 sm:order-2"
            >
              {pauseMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span>Mise en pause...</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Oui, Mettre en Pause</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
