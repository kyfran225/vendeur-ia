import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  Bot,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  PackagePlus,
  LayoutDashboard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";

export function ActivationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    }
  });

  const whatsapp = dashboard?.whatsappConnection;
  const merchant = dashboard?.merchant;

  const activePhone = merchant?.whatsappNumber || merchant?.phone || whatsapp?.phoneNumber || user?.whatsappNumber || "";
  const cleanPhone = activePhone.replace(/\D/g, "");

  // Auto-complete onboarding
  useEffect(() => {
    const markCompleted = async () => {
      try {
        await apiClient.post("/api/commerce/merchant", { onboardingCompleted: true });
        useAuthStore.getState().updateUser({ onboardingCompleted: true });
      } catch (err) {
        console.warn("[Activation] Failed to set onboardingCompleted:", err);
      }
    };
    markCompleted();
  }, []);

  if (isLoading) {
    return <VendeurIALoader fullscreen label="Activation de votre Vendeur IA Cloud..." size="lg" />;
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-xl w-full bg-vendeur-coal border border-white/10 p-6 sm:p-10 md:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] text-center space-y-6 sm:space-y-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-vendeur-emerald/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Animated Bot Avatar */}
        <div className="relative inline-block">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="h-20 w-20 sm:h-24 sm:w-24 bg-vendeur-emerald rounded-[2rem] flex items-center justify-center text-vendeur-coal mx-auto shadow-2xl shadow-vendeur-emerald/30 relative z-10"
          >
            <Bot size={44} />
          </motion.div>
          <div className="absolute -inset-2 bg-vendeur-emerald/20 rounded-[2.5rem] blur-xl animate-pulse" />
        </div>

        {/* Title & Status */}
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={12} />
            <span>WhatsApp Cloud Direct Actif</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight italic text-white leading-tight">
            Prêt à <span className="text-vendeur-emerald">Vendre !</span>
          </h1>

          <p className="text-xs sm:text-sm text-white/60 font-medium max-w-md mx-auto leading-relaxed">
            Votre Vendeur IA est désormais connecté 24h/24. Il répond automatiquement à vos clients, présente votre catalogue et génère vos commandes.
          </p>
        </div>

        {/* Active WhatsApp Number Card */}
        {activePhone && (
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/40 border border-white/10 flex items-center justify-between gap-4 text-left relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Ligne WhatsApp Active</p>
                <p className="text-sm sm:text-base font-bold font-mono text-white tracking-wider">{activePhone}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-vendeur-emerald bg-vendeur-emerald/10 px-2.5 py-1 rounded-full border border-vendeur-emerald/20">
              <span className="h-1.5 w-1.5 rounded-full bg-vendeur-emerald animate-pulse" />
              En Ligne
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 relative z-10">
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}?text=Bonjour`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 px-6 bg-vendeur-emerald text-vendeur-coal rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>Tester mon Vendeur IA sur WhatsApp</span>
            </a>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/products")}
              className="h-14 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <PackagePlus size={16} />
              <span>Ajouter des Produits</span>
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              className="h-14 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <LayoutDashboard size={16} />
              <span>Tableau de Bord</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
