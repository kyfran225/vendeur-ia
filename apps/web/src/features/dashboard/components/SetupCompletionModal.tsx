import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, LayoutDashboard, Play, Package, X, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { playPaymentNotificationChime } from "@/lib/audioUtils";

interface SetupCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  paymentDetails?: {
    planName?: string;
    amount?: number;
    currency?: string;
    billingInterval?: string;
    expiresAt?: string | Date;
    reference?: string;
  } | null;
  isPaymentConfirmed?: boolean;
}

export function SetupCompletionModal({
  isOpen,
  onClose,
  businessName,
  paymentDetails,
  isPaymentConfirmed
}: SetupCompletionModalProps) {
  useEffect(() => {
    if (isOpen) {
      playPaymentNotificationChime(0.6);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasPaidInfo = Boolean(isPaymentConfirmed || paymentDetails?.planName || paymentDetails?.amount);
  const intervalText = paymentDetails?.billingInterval === "yearly" ? "Annuel (-17%)" : "Mensuel";

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          className="relative w-full max-w-sm bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-vendeur-emerald/40 rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-all cursor-pointer z-20"
            title="Fermer"
          >
            <X size={14} />
          </button>

          <div className="text-center space-y-3 relative z-10">
            {/* Trophy Icon Compact */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                <Trophy size={20} />
              </div>
              <div className="text-left min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 dark:text-vendeur-emerald tracking-wider">
                  <CheckCircle2 size={11} />
                  {hasPaidInfo ? "Paiement Validé & Opérationnel" : "Configuration 100% Terminée"}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight">
                  Félicitations {businessName} ! 🎉
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-white/70 leading-normal line-clamp-2">
              Votre boutique est <strong className="text-emerald-600 dark:text-vendeur-emerald">100% active</strong>. Votre Vendeur IA autonome est prêt à convertir vos clients 24/7 sur WhatsApp !
            </p>

            {/* Payment Confirmation Card (Compact) */}
            {hasPaidInfo && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-vendeur-emerald/30 text-left text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800 dark:text-white/90 truncate">
                    {paymentDetails?.planName || "Formule Vendeur IA"} ({intervalText})
                  </span>
                  {paymentDetails?.amount && (
                    <span className="font-mono font-black text-emerald-600 dark:text-vendeur-emerald shrink-0">
                      {paymentDetails.amount.toLocaleString()} {paymentDetails.currency || "XOF"}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutDashboard size={16} />
                <span>Voir mon Tableau de Bord</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
