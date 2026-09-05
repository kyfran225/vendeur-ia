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
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-md bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-vendeur-emerald/40 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-slate-900 dark:text-white"
        >
          {/* Background Glows */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 dark:bg-vendeur-emerald/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 dark:bg-vendeur-emerald/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-all cursor-pointer z-20"
            title="Fermer"
          >
            <X size={16} />
          </button>

          <div className="text-center space-y-4 relative z-10 overflow-y-auto pr-0.5">
            {/* Trophy Icon Compact */}
            <div className="relative inline-flex items-center justify-center pt-1">
              <motion.div
                animate={{ rotate: [0, -6, 6, -6, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 relative"
              >
                <Trophy size={30} />
                <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-black p-1 rounded-full shadow-md animate-pulse">
                  <Sparkles size={12} />
                </div>
              </motion.div>
            </div>

            {/* Header Text & Badge */}
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-700 dark:text-vendeur-emerald tracking-wider bg-emerald-50 dark:bg-vendeur-emerald/15 border border-emerald-200 dark:border-vendeur-emerald/40 px-3 py-0.5 rounded-full shadow-sm">
                <CheckCircle2 size={11} />
                {hasPaidInfo ? "Paiement Validé & 100% Opérationnel" : "Configuration 100% Terminée"}
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                Félicitations {businessName} ! 🎉
              </h2>

              <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed max-w-sm mx-auto">
                Votre boutique est <strong className="text-emerald-600 dark:text-vendeur-emerald">100% active</strong>. Votre Vendeur IA autonome est prêt à convertir vos clients 24/7 sur WhatsApp !
              </p>
            </div>

            {/* Payment Confirmation Card (Compact) */}
            {hasPaidInfo && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/60 dark:via-[#0d1f16] dark:to-emerald-950/60 border border-emerald-200 dark:border-vendeur-emerald/30 space-y-1.5 text-left shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-emerald-600 dark:text-vendeur-emerald" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Règlement Confirmé
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-black uppercase text-emerald-700 dark:text-vendeur-emerald">
                    ✓ Actif
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-white/5 text-[11px]">
                  <span className="font-bold text-slate-800 dark:text-white/90 truncate">
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

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/dashboard?test_ia=true"
                onClick={onClose}
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 dark:bg-vendeur-emerald/10 border border-emerald-200 dark:border-vendeur-emerald/30 hover:border-emerald-500 dark:hover:border-vendeur-emerald transition-all group cursor-pointer text-center"
              >
                <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                  <Play size={14} className="fill-current" />
                </div>
                <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase group-hover:text-emerald-700 dark:group-hover:text-vendeur-emerald transition-colors">
                  Tester le Simulateur
                </div>
                <span className="text-[9px] text-slate-500 dark:text-white/50">Essai en direct</span>
              </Link>

              <Link
                to="/products"
                onClick={onClose}
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all group cursor-pointer text-center"
              >
                <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Package size={16} />
                </div>
                <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Ajouter des Produits
                </div>
                <span className="text-[9px] text-slate-500 dark:text-white/50">Gérer mon stock</span>
              </Link>
            </div>

            {/* Back to Dashboard Primary CTA */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
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
