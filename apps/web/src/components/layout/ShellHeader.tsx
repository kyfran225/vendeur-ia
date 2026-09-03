import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Store, User, LogOut, AlertCircle, ShieldAlert, ShieldCheck, HelpCircle } from "lucide-react";
import { useFounderRole } from "@/hooks/useFounderRole";
import { Logo } from "@/components/ui/Logo";
import { PackProModal } from "@/features/dashboard/components/PackProModal";
import { useSocket } from "@/hooks/useSocket";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ShellHeaderProps {
  isVisible?: boolean;
}

export function ShellHeader({ isVisible = true }: ShellHeaderProps) {
  const { isFounder } = useFounderRole();
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

  const isAdmin = isFounder;

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

  // Une déconnexion inopinée s'applique dès que le marchand a un numéro configuré ou a déjà été connecté, et que la ligne est déconnectée ou en erreur
  const hasEverConnected = Boolean(whatsapp?.connectedAt || merchant?.whatsappConfig?.connectedAt || activePhone);
  const isUnexpectedDisconnect = !isFounder && hasEverConnected && (
    merchant?.whatsappConfig?.status === 'error' || 
    merchant?.whatsappConfig?.status === 'disconnected' ||
    whatsapp?.status === 'DISCONNECTED' ||
    whatsapp?.status === 'disconnected'
  );

  // Ne pas afficher le bandeau si l'utilisateur est déjà sur les réglages/connexions
  const showBanner = Boolean(isUnexpectedDisconnect && !isConnexionsPage);

  return (
    <div className="sticky top-0 z-20 w-full flex flex-col shrink-0">
      <PackProModal isOpen={isPackProOpen} onClose={() => setIsPackProOpen(false)} />

      <header
        className="h-14 md:h-16 border-b border-slate-200/80 dark:border-white/5 bg-white/80 dark:bg-[#07100d]/90 backdrop-blur-md flex items-center justify-between px-4 md:px-10 w-full gap-4 shrink-0 transition-colors"
      >
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
          <div className="md:hidden h-9 w-9 flex items-center justify-center overflow-hidden shrink-0 text-slate-900 dark:text-white">
            {isFounder ? (
              <Logo size={24} />
            ) : merchant?.branding?.logoUrl ? (
              <img src={merchant.branding.logoUrl} alt={merchant.businessName || "Boutique"} className="h-full w-full object-cover rounded-xl" />
            ) : (
              <Logo size={24} />
            )}
          </div>
          <div className="hidden md:flex h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-vendeur-emerald/10 items-center justify-center border border-emerald-200 dark:border-vendeur-emerald/20 shrink-0 overflow-hidden shadow-inner">
            {isFounder ? (
              <ShieldCheck className="text-emerald-600 dark:text-vendeur-emerald" size={20} />
            ) : merchant?.branding?.logoUrl ? (
              <img src={merchant.branding.logoUrl} alt={merchant.businessName || "Boutique"} className="h-full w-full object-cover" />
            ) : (
              <Store className="text-emerald-600 dark:text-vendeur-emerald" size={20} />
            )}
          </div>
          <div className="text-left min-w-0">
            <p className="text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight">
              {isFounder ? "MASTER CONTROL" : (merchant?.businessName || "SYSTEM CORE")}
            </p>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-vendeur-emerald/60 font-black leading-none truncate">
              {isFounder ? "FOUNDER OS v2.4-STABLE" : "Boutique Active"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {isFounder && (
            <Link
              to="/admin"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl border transition-all text-xs font-black uppercase tracking-wider shadow-sm",
                pendingPaymentsCount > 0
                  ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-500 dark:text-amber-400"
                  : "bg-vendeur-emerald text-vendeur-coal border-vendeur-emerald/20 hover:scale-105"
              )}
              title="Cockpit Administrateur"
            >
              <ShieldCheck size={14} className={pendingPaymentsCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-vendeur-coal"} />
              <span className="hidden sm:inline">Founder</span>
              {pendingPaymentsCount > 0 && (
                <span className="h-5 px-1.5 rounded-full bg-vendeur-coal text-white font-mono font-black text-[10px] flex items-center justify-center">
                  {pendingPaymentsCount}
                </span>
              )}
            </Link>
          )}

          {activePhone && (
            <Link
              to="/settings?tab=connexions"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 text-slate-700 dark:text-white transition-all group shadow-sm"
              title="Ligne WhatsApp Connectée"
            >
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-white/90 group-hover:text-emerald-600 dark:group-hover:text-vendeur-emerald transition-colors">
                {formatDisplayPhone(activePhone, merchant?.country || "CI")}
              </span>
            </Link>
          )}

          <ThemeToggle />

          <Link
            to="/help"
            className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/60 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-vendeur-emerald transition-all overflow-hidden group shadow-sm"
            title="Centre d'Aide & FAQ"
          >
            <HelpCircle size={18} />
          </Link>

          <Link
            to="/settings"
            className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-white/60 hover:bg-slate-200/70 dark:hover:bg-white/10 hover:border-emerald-500/30 hover:text-emerald-600 dark:hover:text-vendeur-emerald transition-all overflow-hidden group shadow-sm"
            title="Paramètres de la Boutique"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profil" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <User size={18} />
            )}
          </Link>
        </div>
      </header>

      {/* Connection Status Banner - flux normal en dessous du header, ne masque jamais le titre */}
      {showBanner && (
        <div className={cn(
          "w-full py-2 px-3 sm:px-4 flex items-center justify-between sm:justify-center gap-2 sm:gap-3 animate-in slide-in-from-top duration-300 shadow-md border-b border-black/10 shrink-0",
          isProPlan ? "bg-vendeur-emerald text-vendeur-coal" : "bg-red-500 text-white"
        )}>
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
            <AlertCircle size={14} className={cn("shrink-0", isProPlan ? "text-vendeur-coal" : "text-white")} />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-left sm:text-center truncate">
              {isProPlan 
                ? "⚡ Ré-activation requise pour votre Vendeur IA Pro" 
                : "Session WhatsApp interrompue"}
            </p>
          </div>
          <Link
            to="/settings?tab=connexions"
            className={cn(
              "px-2.5 sm:px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all shadow-sm shrink-0 whitespace-nowrap",
              isProPlan ? "bg-vendeur-coal text-vendeur-emerald hover:bg-black" : "bg-white text-red-500 hover:bg-white/90"
            )}
          >
            {isProPlan ? "Activer" : "Reconnecter"}
          </Link>
        </div>
      )}
    </div>
  );
}
