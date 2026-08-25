import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  X,
  Zap,
  MessageCircle,
  Package,
  CreditCard,
  Truck,
  Store,
} from "lucide-react";
import { Link } from "react-router-dom";

interface StepSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedStepId: string;
  completedStepLabel: string;
  nextStep: { id: string; label: string } | null;
  businessName?: string;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  identity: <Store size={32} />,
  whatsapp: <MessageCircle size={32} />,
  products: <Package size={32} />,
  payments: <CreditCard size={32} />,
  delivery: <Truck size={32} />,
};

const STEP_MESSAGES: Record<string, string> = {
  identity: "Votre profil boutique est configuré ! Vos clients vous connaîtront parfaitement.",
  whatsapp: "WhatsApp est relié ! Votre Vendeur IA peut maintenant discuter avec vos clients.",
  products: "Votre catalogue est en ligne ! Votre vitrine publique est désormais active.",
  payments: "Vos moyens d'encaissement sont configurés ! Votre Vendeur IA peut maintenant valider les paiements automatiquement.",
  delivery: "Vos zones de livraison sont définies ! Vos clients seront informés des délais et tarifs automatiquement.",
};

const NEXT_STEP_LINKS: Record<string, string> = {
  identity: "/settings?tab=connexions#whatsapp",
  whatsapp: "/products",
  products: "/settings?tab=boutique#payments",
  payments: "/settings?tab=boutique#delivery",
  delivery: "/dashboard",
};

const NEXT_STEP_CTA: Record<string, string> = {
  identity: "Brancher mon WhatsApp",
  whatsapp: "Ajouter mes articles & prix",
  products: "Configurer mes paiements",
  payments: "Définir mes zones de livraison",
  delivery: "Voir mon tableau de bord",
};

export function StepSuccessModal({
  isOpen,
  onClose,
  completedStepId,
  completedStepLabel,
  nextStep,
  businessName,
}: StepSuccessModalProps) {
  if (!isOpen) return null;

  const nextLink = nextStep ? NEXT_STEP_LINKS[completedStepId] : "/dashboard";
  const nextCTA = nextStep
    ? NEXT_STEP_CTA[completedStepId] || `Etape suivante : ${nextStep.label}`
    : "Voir mon tableau de bord";

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 24 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="relative w-full max-w-md bg-vendeur-coal border border-vendeur-emerald/40 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_60px_rgba(16,185,129,0.2)] overflow-hidden"
        >
          {/* Background Glows */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-vendeur-emerald/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-vendeur-emerald/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>

          <div className="relative z-10 text-center space-y-5">
            {/* Animated Check Icon */}
            <div className="relative inline-flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                className="h-20 w-20 rounded-3xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-xl shadow-vendeur-emerald/30"
              >
                {STEP_ICONS[completedStepId] || <CheckCircle2 size={32} />}
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-vendeur-emerald border-2 border-vendeur-coal flex items-center justify-center"
              >
                <CheckCircle2 size={14} className="text-vendeur-coal fill-vendeur-coal" />
              </motion.div>
            </div>

            {/* Header */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-vendeur-emerald tracking-[0.2em] bg-vendeur-emerald/10 border border-vendeur-emerald/30 px-3 py-1 rounded-full">
                Etape completee !
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                {completedStepLabel}
              </h2>
              <p className="text-xs md:text-sm text-white/65 leading-relaxed">
                {STEP_MESSAGES[completedStepId] ||
                  `Super, vous avez complete cette etape${businessName ? ` pour ${businessName}` : ""} !`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-1">
              {nextStep && (
                <Link
                  to={nextLink}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2.5 min-h-[52px] px-6 py-3.5 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-xs tracking-wider hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer"
                >
                  <Zap size={16} fill="currentColor" className="animate-pulse shrink-0" />
                  <span>{nextCTA}</span>
                  <ArrowRight size={16} className="shrink-0" />
                </Link>
              )}

              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 min-h-[44px] px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-black uppercase text-xs tracking-wider transition-all cursor-pointer active:scale-95"
              >
                Rester sur le tableau de bord
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
