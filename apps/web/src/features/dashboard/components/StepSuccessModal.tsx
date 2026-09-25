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
  score?: number;
  steps?: Array<{ id: string; label: string; completed: boolean; weight?: number }>;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  identity: <Store size={32} />,
  whatsapp: <MessageCircle size={32} />,
  products: <Package size={32} />,
  payments: <CreditCard size={32} />,
  delivery: <Truck size={32} />,
  subscription: <Zap size={32} />,
};

const STEP_MESSAGES: Record<string, string> = {
  identity: "Votre profil boutique est configuré ! Vos clients vous connaîtront parfaitement.",
  whatsapp: "WhatsApp est relié ! Votre Vendeur IA peut maintenant discuter avec vos clients.",
  products: "Votre catalogue est en ligne ! Votre vitrine publique est désormais active.",
  payments: "Vos moyens d'encaissement sont configurés ! Votre Vendeur IA peut maintenant valider les paiements automatiquement.",
  delivery: "Vos zones de livraison sont définies ! Votre boutique est maintenant techniquement prête à 100%.",
  subscription: "Votre forfait est actif ! Votre Vendeur IA est désormais en service 24h/24 pour propulser vos ventes.",
};

const NEXT_STEP_LINKS: Record<string, string> = {
  identity: "/settings?tab=connexions#whatsapp",
  whatsapp: "/products",
  products: "/settings?tab=boutique#payments",
  payments: "/settings?tab=boutique#delivery",
  delivery: "/dashboard",
  subscription: "/dashboard",
};

const NEXT_STEP_CTA: Record<string, string> = {
  identity: "Brancher mon WhatsApp",
  whatsapp: "Ajouter mes articles & prix",
  products: "Configurer mes paiements",
  payments: "Définir mes zones de livraison",
  delivery: "Voir mon tableau de bord",
  subscription: "Voir mon tableau de bord",
};

export function StepSuccessModal({
  isOpen,
  onClose,
  completedStepId,
  completedStepLabel,
  nextStep,
  businessName,
  score,
  steps,
}: StepSuccessModalProps) {
  if (!isOpen) return null;

  const rawScore = React.useMemo(() => {
    if (score !== undefined && score !== null && !isNaN(score)) {
      return Math.max(0, Math.min(100, score));
    }
    if (steps && steps.length > 0) {
      return Math.min(100, Math.round(steps.reduce((acc: number, s: any) => acc + (s.completed ? (s.weight || 33) : 0), 0)));
    }
    return 0;
  }, [score, steps]);

  const [displayScore, setDisplayScore] = React.useState<number>(0);

  React.useEffect(() => {
    if (isOpen) {
      setDisplayScore((prev) => (prev > 0 ? Math.max(prev, rawScore) : rawScore));
    } else {
      setDisplayScore(0);
    }
  }, [isOpen, rawScore]);

  const progressPercent = displayScore || rawScore;

  const nextLink = nextStep ? NEXT_STEP_LINKS[completedStepId] : "/dashboard";
  const nextCTA = nextStep
    ? NEXT_STEP_CTA[completedStepId] || `Étape suivante : ${nextStep.label}`
    : "Voir mon tableau de bord";

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-vendeur-emerald/40 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-all cursor-pointer"
            title="Fermer"
          >
            <X size={14} />
          </button>

          <div className="relative z-10 text-center space-y-4">
            {/* Animated Check Icon + Header Compact */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                {STEP_ICONS[completedStepId] || <CheckCircle2 size={22} />}
              </div>
              <div className="text-left min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-vendeur-emerald">
                  <Zap size={11} /> Étape complétée ✓ ({progressPercent}%)
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight truncate">
                  {completedStepLabel}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed px-1">
              {STEP_MESSAGES[completedStepId] ||
                `Super, vous avez complété cette étape${businessName ? ` pour ${businessName}` : ""} !`}
            </p>

            {/* Compact Progress Line */}
            <div className="w-full bg-slate-100 dark:bg-black/60 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-vendeur-emerald rounded-full"
              />
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {nextStep && (
                <Link
                  to={nextLink}
                  onClick={onClose}
                  className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Zap size={15} fill="currentColor" className="shrink-0" />
                  <span className="truncate">{nextCTA}</span>
                  <ArrowRight size={15} className="shrink-0" />
                </Link>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-colors cursor-pointer"
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
