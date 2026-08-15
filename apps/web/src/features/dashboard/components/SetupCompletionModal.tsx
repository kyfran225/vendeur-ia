import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, CreditCard, Truck, LayoutDashboard, Bot, Package, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SetupCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

export function SetupCompletionModal({ isOpen, onClose, businessName }: SetupCompletionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-vendeur-coal border border-vendeur-emerald/40 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.25)] overflow-hidden"
        >
          {/* Background Glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-vendeur-emerald/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-vendeur-emerald/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>

          <div className="text-center space-y-6 relative z-10">
            {/* Trophy Icon */}
            <div className="relative inline-flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="h-20 w-20 md:h-24 md:w-24 rounded-3xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-xl shadow-vendeur-emerald/30"
              >
                <Trophy size={48} />
              </motion.div>
              <div className="absolute -top-2 -right-2 bg-amber-400 text-vendeur-coal p-1.5 rounded-full shadow-lg">
                <Sparkles size={16} />
              </div>
            </div>

            {/* Header Text */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-vendeur-emerald tracking-[0.2em] bg-vendeur-emerald/10 border border-vendeur-emerald/30 px-3 py-1 rounded-full">
                Configuration 100% Terminée
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                Félicitations {businessName} ! 🎉
              </h2>
              <p className="text-xs md:text-sm text-white/70 leading-relaxed">
                Votre boutique est désormais <strong className="text-vendeur-emerald">100% opérationnelle</strong>. Votre Vendeur IA autonome est prêt à répondre et convertir vos clients 24/7 sur WhatsApp !
              </p>
            </div>

            {/* Suggestions Box */}
            <div className="space-y-3 pt-2 text-left">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1">
                Que souhaitez-vous faire ensuite ?
              </p>

              <div className="grid grid-cols-1 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                <Link
                  to="/dashboard?test_ia=true"
                  onClick={onClose}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/30 hover:border-vendeur-emerald transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal font-bold shrink-0">
                    <Bot size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white uppercase group-hover:text-vendeur-emerald transition-colors">
                      Tester mon Vendeur IA
                    </div>
                    <div className="text-[10px] text-white/60 truncate">
                      Simulez des réponses clients en direct
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-vendeur-emerald group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>

                <Link
                  to="/products"
                  onClick={onClose}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Package size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white uppercase group-hover:text-purple-400 transition-colors">
                      Ajouter d'autres produits ou services
                    </div>
                    <div className="text-[10px] text-white/60 truncate">
                      Enrichir votre catalogue et augmenter vos offres
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>

                <Link
                  to="/settings?tab=boutique#payments"
                  onClick={onClose}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white uppercase group-hover:text-amber-400 transition-colors">
                      Enrichir mes moyens de paiement
                    </div>
                    <div className="text-[10px] text-white/60 truncate">
                      Ajouter d'autres numéros Mobile Money ou RIB
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>

                <Link
                  to="/settings?tab=boutique#delivery"
                  onClick={onClose}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <Truck size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white uppercase group-hover:text-blue-400 transition-colors">
                      Ajuster mes zones & tarifs de livraison
                    </div>
                    <div className="text-[10px] text-white/60 truncate">
                      Définir des tarifs personnalisés par ville/quartier
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/40 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
              </div>
            </div>

            {/* Back to Dashboard CTA */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full h-12 rounded-2xl bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase tracking-widest hover:scale-102 active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 flex items-center justify-center gap-2"
              >
                <LayoutDashboard size={18} />
                <span>Accéder à mon Tableau de Bord</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
