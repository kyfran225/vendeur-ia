import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Bot, User, LogOut, AlertCircle } from "lucide-react";
import { PackProModal } from "@/features/dashboard/components/PackProModal";

export function ShellHeader() {
  const [isPackProOpen, setIsPackProOpen] = useState(false);
  const { user, logout, accessToken } = useAuthStore();

  useEffect(() => {
    (window as any).openPackPro = () => setIsPackProOpen(true);
  }, []);

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    enabled: !!accessToken
  });

  const merchant = dashboard?.merchant;

  return (
    <header className="h-14 md:h-20 border-b border-white/5 bg-vendeur-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-12 sticky top-0 z-40 w-full gap-4">
      <PackProModal isOpen={isPackProOpen} onClose={() => setIsPackProOpen(false)} />

      {/* Connection Error Banner */}
      {merchant?.whatsappConfig?.status === 'error' && (
        <div className="absolute top-full left-0 right-0 bg-red-500 py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 shadow-lg">
          <AlertCircle size={14} className="text-white animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white">Attention : Votre WhatsApp est déconnecté !</p>
          <Link
            to="/settings"
            className="px-3 py-1 bg-white text-red-500 rounded-lg text-[9px] font-black uppercase hover:bg-white/90 transition-all shadow-sm"
          >
            Reconnecter
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
        <div className="md:hidden h-9 w-9 flex items-center justify-center overflow-hidden bg-white/5 rounded-xl p-1.5 border border-white/10 shrink-0">
          <img src="/apple-touch-icon.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <div className="hidden md:flex h-10 w-10 rounded-2xl bg-vendeur-emerald/10 items-center justify-center border border-vendeur-emerald/20 shrink-0">
          <Bot className="text-vendeur-emerald" size={20} />
        </div>
        <div className="text-left min-w-0">
          <p className="text-base md:text-xl font-black text-white uppercase tracking-tight truncate leading-tight">
            {merchant?.businessName || "Mon Commerce"}
          </p>
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-vendeur-emerald/60 font-black leading-none truncate">
            AI Sales Machine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6 shrink-0">
         <Link
           to="/settings"
           className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:border-vendeur-emerald/30 hover:text-vendeur-emerald transition-all overflow-hidden group shadow-lg"
         >
           {user?.avatarUrl ? (
             <img src={user.avatarUrl} alt="Profil" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
           ) : (
             <User size={18} />
           )}
         </Link>
      </div>
    </header>
  );
}
