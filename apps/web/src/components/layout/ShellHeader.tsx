import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Store, User, LogOut, AlertCircle, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { PackProModal } from "@/features/dashboard/components/PackProModal";
import { useSocket } from "@/hooks/useSocket";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShellHeaderProps {
  isVisible?: boolean;
}

export function ShellHeader({ isVisible = true }: ShellHeaderProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isProParam = searchParams.get("pro") === "true";
  const isExpertParam = searchParams.get("expert") === "true";

  const [isPackProOpen, setIsPackProOpen] = useState(false);
  const { user, logout, accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const socket = useSocket();

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

  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    const handleConnected = () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    socket.on("whatsapp:disconnected", handleDisconnect);
    socket.on("whatsapp:connected", handleConnected);

    return () => {
      socket.off("whatsapp:disconnected", handleDisconnect);
      socket.off("whatsapp:connected", handleConnected);
    };
  }, [socket, queryClient]);

  const merchant = dashboard?.merchant;
  const subscription = dashboard?.subscription;
  const whatsapp = dashboard?.whatsappConnection;
  const activePhone = merchant?.whatsappNumber || merchant?.phone || whatsapp?.phoneNumber || user?.whatsappNumber || "";

  const isAdmin = Boolean(user?.roles?.includes("admin") || user?.email === "franck@vendeur-ia.com");

  // Admin: Fetch pending payments count with real-time socket updates
  const { data: pendingPayments } = useQuery({
    queryKey: ["admin:header:pending_payments"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/payments?status=under_verification");
      return res.data;
    },
    enabled: !!accessToken && isAdmin,
    refetchInterval: 12000
  });

  const pendingPaymentsCount = pendingPayments?.length || 0;

  useEffect(() => {
    if (!socket || !isAdmin) return;

    const handleAdminPaymentAlert = () => {
      queryClient.invalidateQueries({ queryKey: ["admin:header:pending_payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin:payments:pendingCount"] });
    };

    socket.on("admin:payment_incoming", handleAdminPaymentAlert);
    socket.on("payment:pending_review", handleAdminPaymentAlert);

    return () => {
      socket.off("admin:payment_incoming", handleAdminPaymentAlert);
      socket.off("payment:pending_review", handleAdminPaymentAlert);
    };
  }, [socket, isAdmin, queryClient]);

  // Détection absolue du Pack Pro / Formule Clé en Main / Expert
  const isPackPro = 
    isExpertParam || 
    subscription?.plan === 'business' || 
    subscription?.plan === 'pro' || 
    subscription?.type === 'pack_pro' || 
    whatsapp?.connectionType === 'expert' ||
    merchant?.subscription?.plan === 'pro' ||
    merchant?.subscription?.plan === 'business' ||
    merchant?.whatsappConfig?.connectionType === 'expert';

  const isProPlan = isProParam || merchant?.subscription?.plan === 'pro' || merchant?.whatsappConfig?.provider === 'meta';
  const isDisconnected = merchant?.whatsappConfig?.status === 'error' || merchant?.whatsappConfig?.status === 'disconnected';

  // Détection des états de connexion
  const isConnexionsPage = location.pathname.includes('/settings') || location.pathname.includes('/connexions') || location.pathname.includes('/plus');

  // Une déconnexion inopinée (qui nécessite l'alerte rouge) ne s'applique que si le marchand avait une session active qui est tombée en erreur ou explicitement déconnectée après avoir été active.
  const isUnexpectedDisconnect = merchant?.whatsappConfig?.status === 'error' || 
    (merchant?.whatsappConfig?.status === 'disconnected' && merchant?.whatsappConfig?.connectedAt);

  // Ne JAMAIS afficher le bandeau si l'utilisateur est sur les réglages/connexions, si c'est un Pack Pro, ou s'il n'a encore jamais configuré son WhatsApp.
  const showBanner = isUnexpectedDisconnect && !isPackPro && !isConnexionsPage;

  return (
    <header
      className={cn(
        "h-14 md:h-16 border-b border-white/5 bg-vendeur-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-10 sticky top-0 z-20 w-full gap-4 shrink-0 transition-all duration-300 ease-in-out",
        isVisible
          ? "translate-y-0 opacity-100 mt-0"
          : "-translate-y-full opacity-0 pointer-events-none -mt-14 md:-mt-16"
      )}
    >
      <PackProModal isOpen={isPackProOpen} onClose={() => setIsPackProOpen(false)} />

      {/* Connection Status Banner - uniquement en cas de déconnexion inopinée d'un WhatsApp précédemment relié */}
      {showBanner && (
        <div className={cn(
          "absolute top-full left-0 right-0 py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 shadow-lg z-50",
          isProPlan ? "bg-vendeur-emerald text-vendeur-coal" : "bg-red-500 text-white"
        )}>
          <AlertCircle size={14} className={isProPlan ? "text-vendeur-coal animate-pulse" : "text-white animate-pulse"} />
          <p className="text-[10px] font-black uppercase tracking-widest">
            {isProPlan 
              ? "⚡ Votre Vendeur IA Pro nécessite une ré-activation." 
              : "Attention : Votre session WhatsApp a été interrompue !"}
          </p>
          <Link
            to="/settings?tab=connexions"
            className={cn(
              "px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all shadow-sm",
              isProPlan ? "bg-vendeur-coal text-vendeur-emerald hover:bg-black" : "bg-white text-red-500 hover:bg-white/90"
            )}
          >
            {isProPlan ? "Activer" : "Reconnecter"}
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
        <div className="md:hidden h-9 w-9 flex items-center justify-center overflow-hidden bg-white/5 rounded-xl p-1.5 border border-white/10 shrink-0 text-vendeur-emerald">
          <Logo size={22} />
        </div>
        <div className="hidden md:flex h-10 w-10 rounded-2xl bg-vendeur-emerald/10 items-center justify-center border border-vendeur-emerald/20 shrink-0">
          <Store className="text-vendeur-emerald" size={20} />
        </div>
        <div className="text-left min-w-0">
          <p className="text-base md:text-xl font-black text-white uppercase tracking-tight truncate leading-tight">
            {merchant?.businessName || "SYSTEM CORE"}
          </p>
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-vendeur-emerald/60 font-black leading-none truncate">
            Boutique Active
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {isAdmin && (
          <Link
            to="/admin"
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl border transition-all text-xs font-black uppercase tracking-wider shadow-sm",
              pendingPaymentsCount > 0
                ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-400 animate-pulse"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
            )}
            title="Cockpit Administrateur"
          >
            <ShieldAlert size={14} className={pendingPaymentsCount > 0 ? "text-amber-400" : "text-white/40"} />
            <span className="hidden sm:inline">Admin</span>
            {pendingPaymentsCount > 0 && (
              <span className="h-5 px-1.5 rounded-full bg-amber-400 text-black font-mono font-black text-[10px] flex items-center justify-center">
                {pendingPaymentsCount}
              </span>
            )}
          </Link>
        )}

        {activePhone && (
          <Link
            to="/settings?tab=connexions"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-vendeur-emerald/30 text-white transition-all group shadow-sm"
            title="Ligne WhatsApp Connectée"
          >
            <span className="h-2 w-2 rounded-full bg-vendeur-emerald animate-pulse shrink-0" />
            <span className="text-[11px] font-mono font-bold text-white/90 group-hover:text-vendeur-emerald transition-colors">
              {formatDisplayPhone(activePhone, merchant?.country || "CI")}
            </span>
          </Link>
        )}

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
