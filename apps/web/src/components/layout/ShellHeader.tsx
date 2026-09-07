import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  Store,
  User,
  LogOut,
  AlertCircle,
  ShieldCheck,
  HelpCircle,
  PauseCircle,
  Play,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Settings,
  Zap,
  ExternalLink,
  ChevronDown,
  Check
} from "lucide-react";
import { useFounderRole } from "@/hooks/useFounderRole";
import { Logo } from "@/components/ui/Logo";
import { PackProModal } from "@/features/dashboard/components/PackProModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useSocket } from "@/hooks/useSocket";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { useThemeStore } from "@/stores/themeStore";
import { getMerchantShopPath } from "@/lib/slugify";
import { toast } from "sonner";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isProParam = searchParams.get("pro") === "true";
  const isExpertParam = searchParams.get("expert") === "true";

  const [isPackProOpen, setIsPackProOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"fr" | "en">("fr");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout, accessToken } = useAuthStore();
  const { resolvedTheme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    (window as any).openPackPro = () => setIsPackProOpen(true);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

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
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: old.merchant ? {
            ...old.merchant,
            whatsappConfig: {
              ...old.merchant.whatsappConfig,
              status: "disconnected"
            }
          } : old.merchant,
          whatsappConnection: old.whatsappConnection ? {
            ...old.whatsappConnection,
            status: "DISCONNECTED"
          } : old.whatsappConnection
        };
      });
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

  // Vendeur IA Status & 1-Click Master Switch in Header
  const isPaidActive = merchant?.subscription?.status === "active";
  const isAutoReplyOn = merchant?.aiSettings?.autoReply !== false;
  const isPaused = isPaidActive && !isAutoReplyOn;

  const toggleAutoReplyMutation = useMutation({
    mutationFn: async (newAutoReply: boolean) => {
      const res = await apiClient.patch("/api/commerce/ai-settings", {
        autoReply: newAutoReply
      });
      return res.data;
    },
    onMutate: async (newAutoReply) => {
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
              autoReply: newAutoReply
            }
          }
        };
      });
      return { previousDashboard };
    },
    onSuccess: (data, newAutoReply) => {
      if (newAutoReply) {
        toast.success("Vendeur IA réactivé ! Vos ventes reprennent 24h/24 🚀");
      } else {
        toast.info("Vendeur IA mis en pause. Vous gérez désormais manuellement vos discussions WhatsApp ⏸️");
      }
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err, newAutoReply, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(["dashboard"], context.previousDashboard);
      }
      toast.error("Impossible de modifier l'état du Vendeur IA.");
    }
  });

  const handleToggleAutoReply = () => {
    toggleAutoReplyMutation.mutate(!isAutoReplyOn);
  };

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
  const isConnexionsPage = location.pathname.includes('/settings') || location.pathname.includes('/connexions') || location.pathname.includes('/plus');

  const hasEverConnected = Boolean(whatsapp?.connectedAt || merchant?.whatsappConfig?.connectedAt || activePhone);
  const isUnexpectedDisconnect = !isFounder && hasEverConnected && (
    merchant?.whatsappConfig?.status === 'error' || 
    merchant?.whatsappConfig?.status === 'disconnected' ||
    whatsapp?.status === 'DISCONNECTED' ||
    whatsapp?.status === 'disconnected'
  );

  const showBanner = Boolean(isUnexpectedDisconnect && !isConnexionsPage);

  // Détection Avatar Marchand / Logo
  const merchantAvatar = user?.avatarUrl || merchant?.branding?.logoUrl;

  return (
    <div className={cn("sticky top-0 w-full flex flex-col shrink-0", isDropdownOpen ? "z-[80]" : "z-40")}>
      <PackProModal isOpen={isPackProOpen} onClose={() => setIsPackProOpen(false)} />

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter de votre espace vendeur ?"
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        type="logout"
      />

      <header
        className="h-14 md:h-16 border-b border-slate-200/80 dark:border-white/5 bg-white/80 dark:bg-[#07100d]/90 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 md:px-10 w-full gap-2.5 sm:gap-4 shrink-0 transition-colors"
      >
        {/* Brand & Business Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 flex-1 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-emerald-50 dark:bg-vendeur-emerald/10 border border-emerald-200 dark:border-vendeur-emerald/20 text-slate-900 dark:text-white shadow-sm">
            {isFounder ? (
              <Logo size={24} />
            ) : merchantAvatar ? (
              <img src={merchantAvatar} alt={merchant?.businessName || "Boutique"} className="h-full w-full object-cover" />
            ) : (
              <Logo size={24} />
            )}
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm sm:text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight">
              {isFounder ? "MASTER CONTROL" : (merchant?.businessName || "SYSTEM CORE")}
            </p>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-emerald-600 dark:text-vendeur-emerald/70 font-black leading-none truncate flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
              <span>{isFounder ? "FOUNDER OS v2.4-STABLE" : "Boutique Active"}</span>
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
          {/* Founder Master Switch / Admin Link */}
          {isFounder && (
            <Link
              to="/admin"
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl border transition-all text-xs font-black uppercase tracking-wider shadow-sm",
                pendingPaymentsCount > 0
                  ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-500 dark:text-amber-400"
                  : "bg-vendeur-emerald text-slate-950 font-black border-vendeur-emerald/20 hover:scale-105"
              )}
              title="Cockpit Administrateur"
            >
              <ShieldCheck size={14} className={pendingPaymentsCount > 0 ? "text-amber-500 dark:text-amber-400" : "text-slate-950"} />
              <span className="hidden sm:inline">Founder</span>
              {pendingPaymentsCount > 0 && (
                <span className="h-5 px-1.5 rounded-full bg-slate-950 text-white font-mono font-black text-[10px] flex items-center justify-center">
                  {pendingPaymentsCount}
                </span>
              )}
            </Link>
          )}

          {/* 
            ⚡ INTERRUPTEUR GLOBAL VENDEUR IA DANS LE HEADER (Barre supérieure)
            Permet de mettre en pause ou réactiver instantanément le Vendeur IA partout dans l'application
          */}
          {!isFounder && (
            <button
              type="button"
              onClick={handleToggleAutoReply}
              disabled={toggleAutoReplyMutation.isPending}
              className={cn(
                "inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1.5 md:py-2 rounded-xl md:rounded-2xl border transition-all active:scale-95 cursor-pointer shadow-sm group",
                isAutoReplyOn
                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-vendeur-emerald"
                  : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-400 animate-pulse"
              )}
              title={
                isAutoReplyOn
                  ? "Vendeur IA actif 24h/24. Cliquez pour mettre en pause et répondre manuellement."
                  : "Vendeur IA en pause. Cliquez pour reprendre les ventes automatiques 24h/24."
              }
            >
              {isAutoReplyOn ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    <span className="hidden xs:inline sm:inline">En Vente</span>
                    <span className="xs:hidden sm:hidden">Vente</span>
                  </span>
                  <div className="w-5 h-3 sm:w-6 sm:h-3.5 bg-emerald-500 dark:bg-vendeur-emerald rounded-full p-0.5 flex items-center justify-end transition-all shrink-0">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white dark:bg-slate-950 rounded-full shadow-sm" />
                  </div>
                </>
              ) : (
                <>
                  <PauseCircle size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
                    <span className="hidden xs:inline sm:inline">En Pause</span>
                    <span className="xs:hidden sm:hidden">Pause</span>
                  </span>
                  <div className="w-5 h-3 sm:w-6 sm:h-3.5 bg-slate-300 dark:bg-white/20 rounded-full p-0.5 flex items-center justify-start transition-all shrink-0">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white rounded-full shadow-sm" />
                  </div>
                </>
              )}
            </button>
          )}

          {activePhone && (
            <Link
              to="/settings?tab=connexions"
              className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 text-slate-700 dark:text-white transition-all group shadow-sm"
              title="Ligne WhatsApp Connectée"
            >
              <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-white/90 group-hover:text-emerald-600 dark:group-hover:text-vendeur-emerald transition-colors">
                {formatDisplayPhone(activePhone, merchant?.country || "CI")}
              </span>
            </Link>
          )}

          {/* 
            📱 MENU DÉROULANT PROFIL & PARAMÈTRES (Dropdown Menu Mobile & Desktop)
          */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-xl sm:rounded-2xl border flex items-center justify-center transition-all overflow-hidden group shadow-sm shrink-0 cursor-pointer outline-none",
                isDropdownOpen
                  ? "bg-slate-200 dark:bg-white/15 border-emerald-500/50 ring-2 ring-emerald-500/20"
                  : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-emerald-500/30 hover:bg-slate-200/70 dark:hover:bg-white/10"
              )}
              title="Menu Profil & Paramètres"
            >
              {merchantAvatar ? (
                <img
                  src={merchantAvatar}
                  alt={merchant?.businessName || user?.displayName || "Profil"}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-700 dark:text-vendeur-emerald font-black text-xs md:text-sm">
                  {(merchant?.businessName?.[0] || user?.displayName?.[0] || "V").toUpperCase()}
                </div>
              )}
            </button>

            {/* Dropdown Floating Panel */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-[calc(100vw-1.5rem)] sm:w-88 max-w-[375px] bg-white dark:bg-[#0c1612] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4 z-[90] animate-in fade-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                {/* 1. Header Profile Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-2xl flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl overflow-hidden shrink-0 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-vendeur-emerald font-black text-sm">
                    {merchantAvatar ? (
                      <img src={merchantAvatar} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      (merchant?.businessName?.[0] || user?.displayName?.[0] || "V").toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black uppercase text-slate-900 dark:text-white truncate">
                      {merchant?.businessName || user?.displayName || "Mon Compte"}
                    </p>
                    <p className="text-xs font-mono text-slate-500 dark:text-white/50 truncate mt-0.5">
                      {activePhone ? formatDisplayPhone(activePhone, merchant?.country || "CI") : (user?.email || "Vendeur IA")}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-vendeur-emerald text-[10px] sm:text-xs font-black uppercase shrink-0">
                    {subscription?.plan ? subscription.plan.toUpperCase() : "ACTIVE"}
                  </span>
                </div>

                {/* 2. Theme Selector Control */}
                <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-2xl flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80">Thème d'affichage</span>
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-black/40 border border-slate-300/60 dark:border-white/10 gap-1">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer",
                        resolvedTheme === "light"
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <Sun size={14} className="text-amber-500" />
                      <span>Clair</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer",
                        resolvedTheme === "dark"
                          ? "bg-vendeur-emerald text-slate-950 font-black shadow-sm"
                          : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <Moon size={14} />
                      <span>Sombre</span>
                    </button>
                  </div>
                </div>

                {/* 3. Language Selector (FR / EN) */}
                <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 rounded-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80">
                    <Globe size={15} className="text-emerald-600 dark:text-vendeur-emerald shrink-0" />
                    <span>Langue / Language</span>
                  </div>
                  <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-black/40 border border-slate-300/60 dark:border-white/10 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguage("fr");
                        toast.success("Langue : Français (défaut)");
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer",
                        selectedLanguage === "fr"
                          ? "bg-vendeur-emerald text-slate-950 font-black shadow-sm"
                          : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      FR 🇫🇷
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLanguage("en");
                        toast.info("English language active 🇬🇧");
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer",
                        selectedLanguage === "en"
                          ? "bg-vendeur-emerald text-slate-950 font-black shadow-sm"
                          : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      EN 🇬🇧
                    </button>
                  </div>
                </div>

                {/* 4. Quick Nav Links */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-white/5">
                  <Link
                    to={getMerchantShopPath(merchant)}
                    target="_blank"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Store size={17} className="text-emerald-600 dark:text-vendeur-emerald group-hover:scale-110 transition-transform" />
                      <span>Ma Vitrine en Ligne</span>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
                  </Link>

                  <Link
                    to="/settings"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={17} className="text-slate-500 dark:text-white/50 group-hover:text-emerald-600 dark:group-hover:text-vendeur-emerald group-hover:rotate-45 transition-all" />
                      <span>Paramètres de la Boutique</span>
                    </div>
                  </Link>

                  <Link
                    to="/help"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle size={17} className="text-slate-500 dark:text-white/50 group-hover:text-emerald-600 dark:group-hover:text-vendeur-emerald group-hover:scale-110 transition-all" />
                      <span>Centre d'Aide & FAQ</span>
                    </div>
                  </Link>

                  <Link
                    to="/offers"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Zap size={17} className="text-amber-500 group-hover:scale-110 transition-transform" />
                      <span>Abonnements & Offres</span>
                    </div>
                  </Link>
                </div>

                {/* 5. Logout Button */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer group"
                  >
                    <LogOut size={17} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Se Déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Connection Status Banner - flux normal en dessous du header, ne masque jamais le titre */}
      {showBanner && (
        <div className={cn(
          "w-full py-2 px-3 sm:px-4 flex items-center justify-between sm:justify-center gap-2 sm:gap-3 animate-in slide-in-from-top duration-300 shadow-md border-b border-black/10 shrink-0",
          isProPlan ? "bg-vendeur-emerald text-slate-950 font-black" : "bg-red-500 text-white"
        )}>
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
            <AlertCircle size={14} className={cn("shrink-0", isProPlan ? "text-slate-950" : "!text-white text-white")} />
            <p className={cn(
              "text-[10px] sm:text-xs font-black uppercase tracking-wider text-left sm:text-center truncate",
              isProPlan ? "text-slate-950" : "!text-white text-white"
            )}>
              {isProPlan 
                ? "⚡ Ré-activation requise pour votre Vendeur IA Pro" 
                : "Session WhatsApp interrompue"}
            </p>
          </div>
          <Link
            to="/settings?tab=connexions"
            className={cn(
              "px-2.5 sm:px-3 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all shadow-sm shrink-0 whitespace-nowrap",
              isProPlan ? "bg-slate-950 text-vendeur-emerald hover:bg-black" : "bg-white text-red-600 font-black hover:bg-white/90"
            )}
          >
            {isProPlan ? "Activer" : "Reconnecter"}
          </Link>
        </div>
      )}
    </div>
  );
}
