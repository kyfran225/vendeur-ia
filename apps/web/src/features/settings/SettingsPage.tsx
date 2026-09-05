import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Brain,
  Bot,
  Zap,
  Mic,
  MessageSquare,
  Sparkles,
  Banknote,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Loader2,
  Globe,
  Instagram,
  Facebook,
  Bell,
  HelpCircle,
  Truck,
  User as UserIcon,
  Mail,
  Camera,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Link2,
  ExternalLink,
  Copy,
  Check,
  Palette,
  Menu,
  X,
  PauseCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { slugify } from "@/lib/slugify";
import { WhatsAppConnectionFlow } from "./components/WhatsAppConnectionFlow";
import { FacebookConnectionModal } from "./components/fb/FacebookConnectionModal";
import { MarketplaceGuideModal } from "./components/fb/MarketplaceGuideModal";
import { PackProModal } from "../dashboard/components/PackProModal";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { BillingTab } from "./components/BillingTab";
import { ReferralCard } from "./components/ReferralCard";
import { GrowthTab } from "./components/GrowthTab";
import { ProfileTab } from "./components/ProfileTab";
import { StorefrontBrandingTab } from "./components/StorefrontBrandingTab";
import { subscribeToPush } from "@/lib/pushUtils";
import { AddressAutocomplete } from "../onboarding/components/AddressAutocomplete";
import { ZoneAutocomplete } from "../onboarding/components/ZoneAutocomplete";
import { useNavigate } from "react-router-dom";

import { useSocket } from "@/hooks/useSocket";
import { getProvidersForCountry, getZonesForCity, getCountryByCode, convertCurrencyAmount, CURRENCIES_DATA } from "@vendeur-ia/core";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { StepMilestoneModal } from "@/components/ui/StepMilestoneModal";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/ui/SocialIcons";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Gift, TrendingUp } from "lucide-react";

type SettingsTab = "boutique" | "apparence" | "savoir" | "personnalite" | "connexions" | "growth" | "billing" | "referral" | "compte";

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const navigate = useNavigate();

  const handleScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftScroll(scrollLeft > 10);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(handleScroll, 350);
    }
  };

  useEffect(() => {
    handleScroll();
    const currentRef = tabsRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }
    window.addEventListener("resize", handleScroll);
    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const activeTab = (searchParams.get("tab") as SettingsTab) || "boutique";
  const setActiveTab = (tab: SettingsTab) => {
    setSearchParams({ tab });
  };

  const { accessToken, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (tabsRef.current) {
      const activeBtn = tabsRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
      // Re-check scroll after auto-scroll animation
      setTimeout(handleScroll, 400);
    }
  }, [activeTab]);

  const location = useLocation();
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  useEffect(() => {
    const hashTarget = location.hash.replace("#", "");
    const sectionTarget = searchParams.get("section") || hashTarget;

    if (sectionTarget) {
      setHighlightedSection(sectionTarget);
      let attempts = 0;
      const maxAttempts = 20;

      const triggerHighlight = () => {
        const el = document.getElementById(sectionTarget);
        if (el) {
          // Find the actual scrollable <main> container from AppLayout
          const mainContainer = document.querySelector('main') || el.closest('.overflow-y-auto');
          
          if (mainContainer) {
            const containerRect = mainContainer.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const relativeTop = elRect.top - containerRect.top;
            const stickyOffset = window.innerWidth < 768 ? 75 : 95;
            const targetScrollTop = mainContainer.scrollTop + relativeTop - stickyOffset;

            mainContainer.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: "smooth"
            });
          } else {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          
          // Apply universal non-clipped pulsing glow animation
          el.classList.add("highlight-target-glow");

          setTimeout(() => {
            el.classList.remove("highlight-target-glow");
          }, 5000);
          return true;
        }
        return false;
      };

      // Try immediately and at staggered intervals to account for lazy-rendered tabs and images
      if (!triggerHighlight()) {
        const interval = setInterval(() => {
          attempts++;
          if (triggerHighlight() || attempts >= maxAttempts) {
            clearInterval(interval);
          }
        }, 100);
        return () => clearInterval(interval);
      }

      const timer = setTimeout(() => {
        setHighlightedSection(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, searchParams, location.hash, location.search]);

  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    enabled: !!accessToken
  });

  const { data: knowledge, isLoading: isKnowledgeLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/knowledge");
      return res.data;
    },
    enabled: !!accessToken
  });

  if (isDashboardLoading || isKnowledgeLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <VendeurIALoader size="lg" label="Chargement des réglages..." />
      </div>
    );
  }

  const merchant = dashboard?.merchant;
  const systemSettings = dashboard?.systemSettings;

  const SETTINGS_TABS = [
    { id: "boutique" as const, label: "Boutique", icon: Store },
    { id: "apparence" as const, label: "Apparence & Vitrine", icon: Palette },
    { id: "savoir" as const, label: "Savoir IA", icon: Brain },
    { id: "personnalite" as const, label: "Personnalité", icon: Bot },
    { id: "connexions" as const, label: "Connexions", icon: Globe },
    { id: "growth" as const, label: "Croissance", icon: TrendingUp },
    { id: "billing" as const, label: "Facturation", icon: Banknote },
    { id: "referral" as const, label: "Parrainage", icon: Gift },
    { id: "compte" as const, label: "Mon Profil", icon: UserIcon },
  ];

  return (
    <div className="p-3.5 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-24 relative w-full max-w-full box-border">
      <header id="tour-settings-branding" className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
          <Settings className="text-emerald-600 dark:text-vendeur-emerald shrink-0" size={24} />
          <span className="truncate">Centre de Contrôle</span>
        </h1>
        <p className="text-slate-500 dark:text-white/50 text-xs sm:text-sm font-normal mt-1">Pilotez votre machine de vente et configurez votre Vendeur IA.</p>
      </header>

      {/* Sticky Navigation Tabs Bar (Responsive: Drawer on Mobile, Tabs on Desktop) */}
      <div className="sticky top-0 z-40 bg-slate-50/95 dark:bg-vendeur-bg/95 backdrop-blur-2xl border-b border-slate-200 dark:border-white/10 -mx-3.5 sm:-mx-6 md:-mx-10 px-3.5 sm:px-6 md:px-10 py-2 md:py-2.5 shadow-sm dark:shadow-lg">
        <div className="relative max-w-full w-full">

          {/* Mobile Tab Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden w-full h-13 min-h-[52px] flex items-center justify-between px-4 py-2.5 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white/80 active:scale-[0.98] transition-all shrink-0 cursor-pointer shadow-sm dark:shadow-none"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-vendeur-emerald/15 dark:bg-vendeur-emerald/10 flex items-center justify-center text-emerald-800 dark:text-vendeur-emerald border border-vendeur-emerald/30 shrink-0">
                {React.createElement(SETTINGS_TABS.find(t => t.id === activeTab)?.icon || Settings, { size: 18 })}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-700 dark:text-vendeur-emerald/60 leading-none">Réglages</span>
                <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  {SETTINGS_TABS.find(t => t.id === activeTab)?.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/40 shrink-0">
              <Menu size={18} />
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:block relative w-full group/tabs">
            {/* Left Scroll Button */}
            {showLeftScroll && (
              <button
                type="button"
                onClick={() => scrollTabs("left")}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 h-8 w-8 min-h-[32px] rounded-full bg-white/95 dark:bg-vendeur-coal/95 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:text-emerald-700 dark:hover:text-vendeur-emerald hover:border-emerald-500 dark:hover:border-vendeur-emerald flex items-center justify-center shadow-md dark:shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                title="Défiler vers la gauche"
              >
                <ChevronLeft size={16} />
              </button>
            )}

            {/* Right Scroll Button */}
            {showRightScroll && (
              <button
                type="button"
                onClick={() => scrollTabs("right")}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 h-8 w-8 min-h-[32px] rounded-full bg-white/95 dark:bg-vendeur-coal/95 border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:text-emerald-700 dark:hover:text-vendeur-emerald hover:border-emerald-500 dark:hover:border-vendeur-emerald flex items-center justify-center shadow-md dark:shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                title="Défiler vers la droite"
              >
                <ChevronRight size={16} />
              </button>
            )}

            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-slate-50 dark:from-vendeur-bg to-transparent pointer-events-none transition-opacity duration-300",
              showLeftScroll ? "opacity-100" : "opacity-0"
            )} />
            <div className={cn(
              "absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-slate-50 dark:from-vendeur-bg to-transparent pointer-events-none transition-opacity duration-300",
              showRightScroll ? "opacity-100" : "opacity-0"
            )} />

            <div
              ref={tabsRef}
              onWheel={(e) => {
                if (tabsRef.current && e.deltaY !== 0) {
                  tabsRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-center gap-1.5 md:gap-2 overflow-x-auto tabs-scrollbar py-1 pb-2 w-full"
            >
              {SETTINGS_TABS.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-active={isActive}
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 h-10 md:h-11 min-h-[40px] md:min-h-[44px] rounded-xl text-xs font-black uppercase tracking-tight transition-all shrink-0 whitespace-nowrap active:scale-95 cursor-pointer",
                      isActive
                        ? "bg-vendeur-emerald text-slate-950 shadow-md shadow-vendeur-emerald/20 font-black"
                        : "bg-white dark:bg-white/[0.03] text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/5 font-bold shadow-xs dark:shadow-none"
                    )}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Mobile Sidebar Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[150] md:hidden transition-all duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside
          className={cn(
            "fixed top-0 left-0 bottom-0 w-[300px] bg-white dark:bg-vendeur-coal border-r border-slate-200 dark:border-white/10 shadow-2xl transition-transform duration-300 ease-out flex flex-col",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 flex items-center justify-center border border-vendeur-emerald/20">
                <Settings className="text-emerald-700 dark:text-vendeur-emerald" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Réglages</h3>
                <p className="text-[10px] text-emerald-700 dark:text-vendeur-emerald font-bold tracking-widest uppercase">Configuration IA</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98]",
                  activeTab === tab.id
                    ? "bg-vendeur-emerald border-vendeur-emerald text-slate-950 font-black shadow-lg shadow-vendeur-emerald/20"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-white/[0.02] dark:border-white/5 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                    activeTab === tab.id ? "bg-slate-950 text-vendeur-emerald shadow-sm" : "bg-slate-200/80 dark:bg-white/5 text-emerald-700 dark:text-vendeur-emerald"
                  )}>
                    <tab.icon size={20} />
                  </div>
                  <span className="text-xs uppercase font-black tracking-widest">{tab.label}</span>
                </div>
                {activeTab === tab.id && <ChevronDown size={14} className="-rotate-90 text-slate-950/70" />}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-slate-200 dark:border-white/5">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all active:scale-95 group"
            >
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <LogOut size={20} />
              </div>
              <span className="text-xs uppercase font-black tracking-widest">Déconnexion</span>
            </button>
          </div>
        </aside>
      </div>

      <div className="pt-2">
        {activeTab === "boutique" && (
          <BoutiqueTab
            merchant={merchant}
            dashboard={dashboard}
            initialKnowledge={knowledge}
            accessToken={accessToken || ""}
            highlightedSection={highlightedSection}
          />
        )}
        {activeTab === "apparence" && <StorefrontBrandingTab merchant={merchant} />}
        {activeTab === "savoir" && <SavoirTab initialKnowledge={knowledge} />}
        {activeTab === "personnalite" && <PersonnaliteTab merchant={merchant} />}
        {activeTab === "connexions" && (
          <ConnexionsTab
            merchant={merchant}
            systemSettings={systemSettings}
          />
        )}
        {activeTab === "growth" && <GrowthTab merchant={merchant} />}
        {activeTab === "billing" && <BillingTab merchant={merchant} />}
        {activeTab === "referral" && <ReferralCard merchant={merchant} />}
        {activeTab === "compte" && <ProfileTab merchant={merchant} />}
      </div>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Se déconnecter de l'application ?"
        message="Vous fermez uniquement votre session sur cet appareil. Si votre Vendeur IA est actif, il continue de vendre et de prendre les commandes de vos clients 24h/24 sur WhatsApp."
        confirmLabel="Se déconnecter"
        cancelLabel="Rester connecté"
        type="logout"
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}

// --- ONGLET 1 : BOUTIQUE (PROFIL, LIVRAISON, PAIEMENTS) ---
function BoutiqueTab({
  merchant,
  dashboard,
  initialKnowledge,
  accessToken,
  highlightedSection: externalHighlighted
}: {
  merchant: any;
  dashboard?: any;
  initialKnowledge: any;
  accessToken: string;
  highlightedSection?: string | null;
}) {
  const queryClient = useQueryClient();
  const [localMerchant, setLocalMerchant] = useState<any>(merchant);
  const [payments, setPayments] = useState<any[]>(initialKnowledge?.businessRules?.paymentMethods || []);
  const [deliveryFees, setDeliveryFees] = useState<any[]>(initialKnowledge?.businessRules?.deliveryFees || []);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [categoryChangeWarning, setCategoryChangeWarning] = useState<{ newCategory: string; oldCategory: string } | null>(null);
  const [currencyChangeWarning, setCurrencyChangeWarning] = useState<{ newCurrency: string; oldCurrency: string } | null>(null);
  const [localHighlighted, setLocalHighlighted] = useState<string | null>(null);
  const highlightedSection = externalHighlighted || localHighlighted;

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setLocalHighlighted(hash);
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);

        const timer = setTimeout(() => {
          setLocalHighlighted(null);
        }, 7000);
        return () => clearTimeout(timer);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (merchant) {
      const copy = JSON.parse(JSON.stringify(merchant));
      if (!copy.whatsappNumber && (copy.phone || copy.whatsappConfig?.phoneNumberId)) {
        copy.whatsappNumber = copy.phone || copy.whatsappConfig?.phoneNumberId || "";
      }
      setLocalMerchant(copy);
    }
    if (initialKnowledge?.businessRules?.paymentMethods) {
      setPayments(JSON.parse(JSON.stringify(initialKnowledge.businessRules.paymentMethods)));
    }
    if (initialKnowledge?.businessRules?.deliveryFees) {
      setDeliveryFees(JSON.parse(JSON.stringify(initialKnowledge.businessRules.deliveryFees)));
    }
    setIsDirty(false);
  }, [merchant, initialKnowledge]);

  useEffect(() => {
    if ("Notification" in window) {
      setPushStatus(Notification.permission);

      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const handleCancel = () => {
    if (merchant) {
      const copy = JSON.parse(JSON.stringify(merchant));
      if (!copy.whatsappNumber && (copy.phone || copy.whatsappConfig?.phoneNumberId)) {
        copy.whatsappNumber = copy.phone || copy.whatsappConfig?.phoneNumberId || "";
      }
      setLocalMerchant(copy);
    }
    if (initialKnowledge?.businessRules?.paymentMethods) {
      setPayments(JSON.parse(JSON.stringify(initialKnowledge.businessRules.paymentMethods)));
    } else {
      setPayments([]);
    }
    if (initialKnowledge?.businessRules?.deliveryFees) {
      setDeliveryFees(JSON.parse(JSON.stringify(initialKnowledge.businessRules.deliveryFees)));
    } else {
      setDeliveryFees([]);
    }
    setIsDirty(false);
    toast.info("Modifications annulées 🔄");
  };

  const initialPayments = initialKnowledge?.businessRules?.paymentMethods || [];
  const initialFees = initialKnowledge?.businessRules?.deliveryFees || [];
  const isPaymentsModified = JSON.stringify(payments) !== JSON.stringify(initialPayments);
  const isDeliveryModified = JSON.stringify(deliveryFees) !== JSON.stringify(initialFees);

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [savedSectionType, setSavedSectionType] = useState<"delivery" | "payments" | "all">("all");

  const isModified = JSON.stringify(localMerchant) !== JSON.stringify(merchant);

  const updateMutation = useMutation({
    mutationFn: async (targetType?: "delivery" | "payments" | "all") => {
      const effectiveType = targetType || savedSectionType;

      // 1. Build sanitized merchant payload
      const merchantPayload: any = {};
      if (localMerchant?.businessName !== undefined) merchantPayload.businessName = (localMerchant.businessName || "").trim();
      if (localMerchant?.city !== undefined) merchantPayload.city = localMerchant.city;
      if (localMerchant?.country !== undefined) merchantPayload.country = localMerchant.country;
      if (localMerchant?.address !== undefined) merchantPayload.address = localMerchant.address;
      if (localMerchant?.description !== undefined) merchantPayload.description = localMerchant.description;
      if (localMerchant?.category !== undefined) merchantPayload.category = localMerchant.category;
      if (localMerchant?.currency !== undefined) merchantPayload.currency = localMerchant.currency;
      if (localMerchant?.billingCurrency !== undefined) merchantPayload.billingCurrency = localMerchant.billingCurrency;
      if (localMerchant?.phone !== undefined) merchantPayload.phone = localMerchant.phone;
      if (localMerchant?.whatsappNumber !== undefined) merchantPayload.whatsappNumber = localMerchant.whatsappNumber;

      const cleanPayments = payments.filter((p: any) => p && (p.number?.trim() || p.provider?.trim()));
      const cleanDelivery = deliveryFees.filter((f: any) => f && f.zone?.trim());

      merchantPayload.paymentChannels = cleanPayments.map((p: any) => ({
        provider: p.provider || "Wave",
        number: p.number || "",
        label: p.label || p.provider || "Wave",
        customLabel: p.customLabel || ""
      }));

      // Patch merchant with safe sanitized payload
      await apiClient.patch("/api/commerce/merchant", merchantPayload);

      // 2. Patch knowledge business rules
      await apiClient.patch("/api/commerce/knowledge", {
        businessRules: {
          ...initialKnowledge?.businessRules,
          paymentMethods: cleanPayments,
          deliveryFees: cleanDelivery
        }
      });

      return effectiveType;
    },
    onSuccess: (effectiveType) => {
      setIsDirty(false);
      setCategoryChangeWarning(null);
      setSavedSectionType(effectiveType || "all");
      if (effectiveType === "delivery") {
        toast.success("Tarifs de livraison enregistrés ! 🛵");
      } else if (effectiveType === "payments") {
        toast.success("Moyens de paiement enregistrés ! 💳");
      } else {
        toast.success("Réglages Boutique enregistrés ! 🚀");
      }
      setShowMilestoneModal(true);
      // Invalidate queries so that dashboard score and data update everywhere
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement des réglages.");
    }
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 w-full max-w-full overflow-hidden box-border">
      <section
        id="identity"
        className={cn(
          "bg-white dark:bg-vendeur-coal/50 backdrop-blur-md border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] space-y-6 sm:space-y-8 shadow-md dark:shadow-2xl scroll-mt-28 w-full max-w-full overflow-hidden box-border transition-all duration-500",
          highlightedSection === "identity"
            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/10"
            : "border-slate-200/80 dark:border-white/10"
        )}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
              <Store size={22} className="text-vendeur-emerald shrink-0" />
              <span>Profil de la Boutique</span>
              {highlightedSection === "identity" && (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-vendeur-emerald/20 text-vendeur-emerald border border-vendeur-emerald/40 animate-pulse">
                  Étape en cours 👉
                </span>
              )}
            </h2>
            <p className="text-[10px] md:text-xs text-white/40 font-medium">Vendeur IA utilise ces infos pour présenter votre business.</p>
          </div>
        </div>

        <div className="grid gap-5 md:gap-6 md:grid-cols-2 w-full max-w-full">
          <InputGroup label="Nom du commerce" value={localMerchant?.businessName} onChange={v => { setLocalMerchant({...localMerchant, businessName: v, slug: slugify(v)}); setIsDirty(true); }} placeholder="Ex: Ma Boutique Chic" />
          <InputGroup label="WhatsApp Business" type="tel" inputMode="tel" value={localMerchant?.whatsappNumber} onChange={v => { setLocalMerchant({...localMerchant, whatsappNumber: v}); setIsDirty(true); }} placeholder="Ex: 07 00 00 00 00" />

          {/* Custom Slug / Storefront URL Display */}
          <div className="md:col-span-2 p-3.5 sm:p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3 w-full max-w-full overflow-hidden box-border">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-vendeur-emerald shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider text-white">Lien de votre boutique</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full max-w-full">
              <div className="flex-1 min-w-0 h-11 sm:h-12 bg-black/40 border border-white/10 rounded-xl px-3 flex items-center gap-1 text-xs text-white/80 font-mono overflow-hidden">
                <span className="text-white/40 select-none truncate shrink-0 text-[10px] sm:text-xs">
                  {typeof window !== "undefined" ? window.location.host : ""}/shop/
                </span>
                <span className="font-bold text-vendeur-emerald truncate flex-1 min-w-0 text-[11px] sm:text-xs">
                  {slugify(localMerchant?.slug || localMerchant?.businessName || "boutique")}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const slug = slugify(localMerchant?.slug || localMerchant?.businessName || "boutique");
                    const url = `${window.location.origin}/shop/${slug}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Lien copié !");
                  }}
                  className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Copy size={14} className="text-white/60 shrink-0" />
                  <span>Copier</span>
                </button>

                <Link
                  to={`/shop/${slugify(localMerchant?.slug || localMerchant?.businessName || "boutique")}`}
                  target="_blank"
                  className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 active:scale-95 text-vendeur-coal text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-vendeur-emerald/20 transition-all font-bold"
                >
                  <ExternalLink size={14} className="shrink-0" />
                  <span>Visiter</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Devise du Catalogue &amp; Offres</label>
            <div className="relative">
              <select
                className={`w-full h-14 bg-black/40 border px-5 text-sm text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer rounded-2xl ${localMerchant?.currency !== merchant?.currency ? "border-amber-500/60 bg-amber-500/5" : "border-white/10"}`}
                value={localMerchant?.currency || "XOF"}
                onChange={e => {
                  const newCurr = e.target.value;
                  const oldCurr = merchant?.currency || "XOF";
                  if (newCurr !== oldCurr) {
                    setCurrencyChangeWarning({ newCurrency: newCurr, oldCurrency: oldCurr });
                  }
                  setLocalMerchant({
                    ...localMerchant,
                    currency: newCurr
                  });
                  setIsDirty(true);
                }}
              >
                <option value="XOF">Franc CFA (XOF) - UEMOA</option>
                <option value="XAF">Franc CFA (XAF) - CEMAC</option>
                <option value="GNF">Franc Guinéen (GNF)</option>
                <option value="NGN">Naira Nigérian (NGN)</option>
                <option value="GHS">Cedi Ghanéen (GHS)</option>
                <option value="KES">Shilling Kenyan (KES)</option>
                <option value="MAD">Dirham Marocain (MAD)</option>
                <option value="DZD">Dinar Algérien (DZD)</option>
                <option value="TND">Dinar Tunisien (TND)</option>
                <option value="CDF">Franc Congolais (CDF)</option>
                <option value="MRU">Ouguiya Mauritanien (MRU)</option>
                <option value="ZAR">Rand Sud-Africain (ZAR)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            </div>
            <p className="text-[10px] text-white/30 ml-1 font-medium">Monnaie affichée à vos clients (produits, plats, prestations, formations &amp; WhatsApp).</p>

            {/* Warning badge when currency has changed */}
            {localMerchant?.currency !== merchant?.currency && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300 leading-relaxed font-medium">
                  Conversion automatique activée : après enregistrement, les prix de l'ensemble de votre catalogue et vos frais de livraison seront automatiquement convertis en <strong className="text-white font-black">{localMerchant?.currency}</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Currency Change Confirmation Modal */}
          {currencyChangeWarning && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-vendeur-coal border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Changer la Devise Principale ?</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Cette action va convertir automatiquement les prix de vos produits, vos frais de livraison, l'affichage de vos factures et les messages de vente du Vendeur IA WhatsApp.
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex-1 text-center">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Actuelle</p>
                    <p className="text-sm font-black text-white uppercase">{currencyChangeWarning.oldCurrency}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-1">Ex: 10 000 {currencyChangeWarning.oldCurrency}</p>
                  </div>
                  <div className="text-2xl text-white/20">→</div>
                  <div className="flex-1 text-center">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Nouvelle</p>
                    <p className="text-sm font-black text-amber-400 uppercase">{currencyChangeWarning.newCurrency}</p>
                    <p className="text-[10px] text-amber-300 font-mono mt-1 font-bold">
                      ≈ {convertCurrencyAmount(10000, currencyChangeWarning.oldCurrency, currencyChangeWarning.newCurrency).toLocaleString()} {currencyChangeWarning.newCurrency}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-white/30 font-medium">
                  Tous les libellés de la vitrine et de Vendeur IA WhatsApp seront instantanément mis à jour.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setLocalMerchant({
                        ...localMerchant,
                        currency: currencyChangeWarning.oldCurrency,
                        billingCurrency: currencyChangeWarning.oldCurrency
                      });
                      setIsDirty(false);
                      setCurrencyChangeWarning(null);
                    }}
                    className="h-12 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      // Convert delivery fees in local state to avoid overwriting backend conversion with old values
                      const oldCurr = currencyChangeWarning.oldCurrency;
                      const newCurr = currencyChangeWarning.newCurrency;
                      setDeliveryFees((prev: any[]) => prev.map(f => ({
                        ...f,
                        price: convertCurrencyAmount(f.price || 0, oldCurr, newCurr)
                      })));
                      setCurrencyChangeWarning(null);
                      setIsDirty(true);
                      toast.info(`Devise changée en ${newCurr}. Pensez à enregistrer vos réglages.`);
                    }}
                    className="h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-vendeur-coal font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Catégorie de Commerce</label>

            <div className="relative">
              <select
                className={`w-full h-14 rounded-2xl bg-black/40 border px-4 text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer ${localMerchant?.category !== merchant?.category ? "border-amber-500/60 bg-amber-500/5" : "border-white/10"}`}
                value={localMerchant?.category || ""}
                onChange={e => {
                  const newCat = e.target.value;
                  if (newCat !== merchant?.category) {
                    // Trigger warning modal before committing the change
                    setCategoryChangeWarning({ newCategory: newCat, oldCategory: merchant?.category || "" });
                    setLocalMerchant({...localMerchant, category: newCat});
                    setIsDirty(true);
                  }
                }}
              >
                <option value="fashion">Mode &amp; Accessoires</option>
                <option value="food">Restauration &amp; Food</option>
                <option value="beauty">Soins &amp; Cosmétiques</option>
                <option value="electronics">Électronique &amp; High-Tech</option>
                <option value="artisan">Artisanat &amp; Fait Main</option>
                <option value="services">Prestations de Services</option>
                <option value="digital">Produits Digitaux &amp; Formations</option>
                <option value="home">Maison &amp; Décoration</option>
                <option value="grocery">Épicerie &amp; Supérette</option>
                <option value="health">Santé &amp; Bien-être</option>
                <option value="auto">Auto-Moto &amp; Pièces</option>
                <option value="other">Autre Commerce</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            </div>

            {/* Warning badge when category has been changed but not saved yet */}
            {localMerchant?.category !== merchant?.category && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-300 leading-relaxed font-medium">
                  Changement non enregistré. L'interface Admin, le Vendeur IA WhatsApp et la vitrine publique s'adapteront au nouveau type de commerce après sauvegarde.
                </p>
              </div>
            )}
          </div>

          {/* Category Change Confirmation Modal */}
          {categoryChangeWarning && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-vendeur-coal border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Changer de type de commerce ?</h3>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Cette action va adapter <strong className="text-white">l'interface Admin</strong> (labels, champs, icônes),
                    le <strong className="text-white">Vendeur IA WhatsApp</strong> (nouveau comportement et persona),
                    et la <strong className="text-white">vitrine publique</strong> (hero, CTA, messages clients).
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex-1 text-center">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Actuel</p>
                    <p className="text-sm font-black text-white uppercase">{categoryChangeWarning.oldCategory}</p>
                  </div>
                  <div className="text-2xl text-white/20">→</div>
                  <div className="flex-1 text-center">
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">Nouveau</p>
                    <p className="text-sm font-black text-amber-400 uppercase">{categoryChangeWarning.newCategory}</p>
                  </div>
                </div>

                <p className="text-[10px] text-white/30 font-medium">
                  Vos produits existants ne seront pas supprimés. Seule l'interface et le comportement de Vendeur IA seront mis à jour après sauvegarde.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      // Revert the category change
                      setLocalMerchant({...localMerchant, category: categoryChangeWarning.oldCategory});
                      setIsDirty(false);
                      setCategoryChangeWarning(null);
                    }}
                    className="h-12 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setCategoryChangeWarning(null)}
                    className="h-12 rounded-2xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Adresse / Zone</label>
             <AddressAutocomplete
               value={localMerchant?.address || ""}
               onChange={v => { setLocalMerchant({...localMerchant, address: v}); setIsDirty(true); }}
               onSelectSuggestion={(feature) => {
                 const props = feature.properties;
                 const context = props.context || {};

                 const city = props.place?.name || context.place?.name || props.name || "";
                 const countryCode = context.country?.country_code || props.country_code || "";
                 const district = props.district?.name || context.district?.name || "";
                 const neighborhood = props.neighborhood?.name || context.neighborhood?.name || "";

                 const updates: any = {
                   address: props.full_address || props.name,
                   city: city,
                 };

                 if (countryCode) {
                   const country = getProvidersForCountry(countryCode); // This is just to check if country exists in our core
                   updates.country = countryCode;
                 }

                 setLocalMerchant({ ...localMerchant, ...updates });
                 setIsDirty(true);

                 // Automatically suggest adding the detected zone/commune if not already present
                 const zoneName = neighborhood || district;
                 if (zoneName && !deliveryFees.find((f: any) => f.zone.toLowerCase().includes(zoneName.toLowerCase()))) {
                   setDeliveryFees([...deliveryFees, { zone: zoneName, price: 1000 }]);
                   toast.info(`Zone "${zoneName}" ajoutée aux frais de livraison`);
                 }
               }}
               placeholder="Ex: Cocody, Abidjan"
               className="h-14 rounded-2xl"
             />
          </div>
        </div>
      </section>

      {/* Grille de Livraison */}
      <section
        id="delivery"
        className={cn(
          "bg-white dark:bg-vendeur-coal border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] space-y-6 sm:space-y-8 shadow-md dark:shadow-2xl scroll-mt-28 w-full max-w-full overflow-hidden box-border transition-all duration-500",
          highlightedSection === "delivery"
            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/10"
            : "border-slate-200/80 dark:border-white/10"
        )}
      >
        <div className="flex items-center justify-between gap-3 md:gap-4 px-1">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className={cn(
              "h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center border shrink-0 transition-all",
              highlightedSection === "delivery"
                ? "bg-vendeur-emerald/20 border-vendeur-emerald text-vendeur-emerald shadow-lg shadow-vendeur-emerald/20"
                : "bg-sky-500/10 border-sky-500/20 text-sky-400"
            )}>
              <Truck size={22} className="md:w-7 md:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase text-white leading-tight flex items-center gap-2">
                <span>Frais de Livraison</span>
                {highlightedSection === "delivery" && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-vendeur-emerald/20 text-vendeur-emerald border border-vendeur-emerald/40 animate-pulse hidden sm:inline-block">
                    Étape en cours 👉
                  </span>
                )}
              </h2>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-white/30">Ces tarifs seront communiqués aux clients.</p>
            </div>
          </div>

          {highlightedSection === "delivery" && (
            <span className="sm:hidden text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-vendeur-emerald/20 text-vendeur-emerald border border-vendeur-emerald/40 animate-pulse shrink-0">
              À configurer
            </span>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4 w-full max-w-full">
           <div className="flex flex-row gap-2 px-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] text-white/30">
              <span className="flex-1">Zone / Commune</span>
              <span className="w-28 sm:w-40 text-right pr-2">Tarif ({localMerchant?.currency || "XOF"})</span>
           </div>

           {deliveryFees.map((fee: any, idx: number) => (
              <div key={idx} className="relative group w-full max-w-full animate-in slide-in-from-left-2 duration-200">
                {/* Bouton Supprimer en exposant au coin supérieur droit lors du clic/focus ou survol */}
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryFees((prev: any[]) => prev.filter((_: any, i: number) => i !== idx));
                    setIsDirty(true);
                  }}
                  className="absolute -top-2.5 -right-1.5 z-20 h-6 w-6 sm:h-6 sm:w-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/40 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 border border-white/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 scale-90 group-hover:scale-100 group-focus-within:scale-100"
                  title="Supprimer cette zone de livraison"
                  aria-label="Supprimer cette zone de livraison"
                >
                  <Trash2 size={12} />
                </button>

                <div className="flex items-center gap-2 w-full max-w-full">
                  <ZoneAutocomplete
                      value={fee.zone}
                      city={localMerchant?.city}
                      countryCode={localMerchant?.country}
                      onChange={(val) => {
                        setDeliveryFees((prev: any[]) => prev.map((f: any, i: number) => i === idx ? { ...f, zone: val } : f));
                        setIsDirty(true);
                      }}
                      placeholder="Ex: Riviera 3"
                      className="flex-1 min-w-0 h-12 sm:h-14 text-xs sm:text-sm font-bold"
                  />
                  <div className="relative w-28 sm:w-40 shrink-0">
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full h-12 sm:h-14 bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 text-xs sm:text-sm text-vendeur-emerald font-black outline-none focus:border-sky-500 transition-all font-mono pr-11 sm:pr-14"
                        placeholder="1500"
                        value={fee.price}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/\D/g, "")) || 0;
                          setDeliveryFees((prev: any[]) => prev.map((f: any, i: number) => i === idx ? { ...f, price: val } : f));
                          setIsDirty(true);
                        }}
                    />
                    <span className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-black text-white/30 pointer-events-none font-mono">
                      {localMerchant?.currency || "XOF"}
                    </span>
                  </div>
                </div>
              </div>
           ))}

           {deliveryFees.length === 0 && localMerchant?.city && (
              <div className="p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 space-y-2">
                 <p className="text-[10px] sm:text-xs text-white/50">Suggestions rapides pour votre ville ({localMerchant?.city}) :</p>
                 <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {getZonesForCity(localMerchant.city).slice(0, 4).map((suggestion: any, sIdx: number) => (
                      <button
                          key={sIdx}
                          type="button"
                          onClick={() => {
                            setDeliveryFees((prev: any[]) => [...prev, { zone: suggestion.name, price: suggestion.suggestedPrice }]);
                            setIsDirty(true);
                          }}
                          className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-[10px] sm:text-xs font-bold transition-all"
                      >
                        + {suggestion.name} ({suggestion.suggestedPrice} {localMerchant?.currency || "XOF"})
                      </button>
                    ))}
                 </div>
              </div>
           )}

           <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
             <button
                type="button"
                onClick={() => {
                  setDeliveryFees((prev: any[]) => [...prev, { zone: "", price: 1000 }]);
                  setIsDirty(true);
                }}
                className="flex items-center gap-2 text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] hover:underline px-1 py-1 cursor-pointer"
             >
                <Plus size={16} /> Ajouter une zone de livraison
             </button>

              <button
                type="button"
                onClick={() => {
                  const validDelivery = deliveryFees.filter((f: any) => f && f.zone && f.zone.trim() !== "");
                  if (validDelivery.length === 0) {
                    toast.error("Veuillez renseigner au moins une zone de livraison valide.");
                    return;
                  }
                  setSavedSectionType("delivery");
                  updateMutation.mutate("delivery");
                }}
                disabled={updateMutation.isPending || deliveryFees.length === 0 || !isDeliveryModified}
                className={cn(
                  "h-12 px-6 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0",
                  !isDeliveryModified && deliveryFees.length > 0
                    ? "bg-white/10 text-white/50 border border-white/10 cursor-default"
                    : "bg-sky-400 hover:bg-sky-300 text-vendeur-coal hover:scale-105 active:scale-95 shadow-sky-400/20 cursor-pointer disabled:opacity-50"
                )}
              >
                {updateMutation.isPending && savedSectionType === "delivery" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : !isDeliveryModified && deliveryFees.length > 0 ? (
                  <Check size={16} className="text-white" />
                ) : (
                  <Check size={16} />
                )}
                <span>
                  {!isDeliveryModified && deliveryFees.length > 0
                    ? "Tarifs de Livraison Validés"
                    : "Valider les Tarifs de Livraison"}
                </span>
              </button>
           </div>
        </div>
      </section>

      {/* Canal de paiement */}
      <section
        id="payments"
        className={cn(
          "bg-white dark:bg-vendeur-coal border p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] space-y-6 sm:space-y-8 shadow-md dark:shadow-2xl scroll-mt-28 transition-all duration-500",
          highlightedSection === "payments"
            ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/10"
            : "border-slate-200/80 dark:border-white/10"
        )}
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Banknote size={22} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Canal de paiement</span>
              {highlightedSection === "payments" && (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 animate-pulse hidden sm:inline-block">
                  Étape en cours 👉
                </span>
              )}
            </h2>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-white/40">Coordonnées pour les transferts d'argent.</p>
          </div>

          {highlightedSection === "payments" && (
            <span className="sm:hidden text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 animate-pulse shrink-0">
              À configurer
            </span>
          )}
        </div>

         <div className="space-y-4">
            {payments.map((p: any, idx: number) => {
              const countryProviders = getProvidersForCountry(localMerchant?.country || "CI");
              const matchedProvider = countryProviders.find(cp => cp.label === p.provider || cp.id === p.provider);
              const isPhoneType = matchedProvider ? (matchedProvider.inputKind === "phone" || matchedProvider.type === "mobile_money") : (!["Espèces", "Virement Bancaire", "Bank Transfer", "Carte Bancaire", "Autre (Préciser)"].some(k => p.provider?.includes(k)));
              const placeholder = matchedProvider?.placeholder || (p.provider === "Carte Bancaire" ? "Lien ou instructions" : p.provider?.includes("Virement") || p.provider?.includes("Bank") ? "IBAN / Détails bancaires" : p.provider === "Autre (Préciser)" ? "Détails" : "07 00 00 00 00");

              return (
                <div key={idx} className="relative group space-y-2 animate-in slide-in-from-left-2 duration-300 py-1">
                  {/* Bouton Supprimer en exposant au coin supérieur droit lors du clic/focus ou survol */}
                  <button
                    type="button"
                    onClick={() => {
                      setPayments((prev: any[]) => prev.filter((_: any, i: number) => i !== idx));
                      setIsDirty(true);
                    }}
                    className="absolute -top-1.5 -right-1.5 z-20 h-6 w-6 sm:h-6 sm:w-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/40 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 border border-white/20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 scale-90 group-hover:scale-100 group-focus-within:scale-100"
                    title="Supprimer ce canal"
                    aria-label="Supprimer ce canal"
                  >
                    <Trash2 size={12} />
                  </button>

                  <div className="flex flex-row gap-2 items-center w-full">
                    <div className="w-[38%] sm:w-[32%] md:w-[28%] shrink-0">
                        <div className="relative">
                          <select
                            className="w-full h-12 sm:h-14 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl px-2.5 sm:px-3 text-[10px] sm:text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            value={p.provider}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPayments((prev: any[]) => prev.map((item: any, i: number) => i === idx ? { ...item, provider: val } : item));
                              setIsDirty(true);
                            }}
                          >
                            {countryProviders.map(provider => (
                              <option key={provider.id} value={provider.label} className="bg-white dark:bg-vendeur-coal text-slate-900 dark:text-white">{provider.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 pointer-events-none" size={14} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="relative">
                          {isPhoneType && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-white/30 font-mono">
                              {getCountryByCode(localMerchant?.country || "CI")?.dialCode}
                            </span>
                          )}
                          <input
                            type={isPhoneType ? "tel" : "text"}
                            inputMode={isPhoneType ? "tel" : "text"}
                            className={cn(
                              "w-full h-12 sm:h-14 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl px-3 sm:px-4 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all font-mono",
                              isPhoneType && "pl-11 sm:pl-12"
                            )}
                            value={p.number}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPayments((prev: any[]) => prev.map((item: any, i: number) => i === idx ? { ...item, number: val } : item));
                              setIsDirty(true);
                            }}
                            placeholder={placeholder}
                          />
                        </div>
                    </div>
                  </div>

                  {matchedProvider?.corridorNote && (
                    <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium px-1 mt-0.5">
                      {matchedProvider.corridorNote}
                    </p>
                  )}

                  {p.provider === "Autre (Préciser)" && (
                    <div className="animate-in slide-in-from-top-1 duration-200 mt-1">
                      <input
                        className="w-full md:w-2/3 h-11 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all uppercase tracking-wider"
                        placeholder="Préciser le nom du canal..."
                        value={p.customLabel || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPayments((prev: any[]) => prev.map((item: any, i: number) => i === idx ? { ...item, customLabel: val } : item));
                          setIsDirty(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const countryProviders = getProvidersForCountry(localMerchant?.country || "CI");
                  const defaultProvider = countryProviders[0]?.label || "Wave";
                  setPayments((prev: any[]) => [...prev, { provider: defaultProvider, number: "" }]);
                  setIsDirty(true);
                }}
                className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-[0.2em] hover:underline px-1 py-1 cursor-pointer"
              >
                 <Plus size={16} /> Ajouter un canal de paiement
              </button>

              <button
                type="button"
                onClick={() => {
                  const validPayments = payments.filter((p: any) => p && p.number && p.number.trim() !== "");
                  if (validPayments.length === 0) {
                    toast.error("Veuillez renseigner le numéro pour votre moyen de paiement (ex: 0700000000).");
                    return;
                  }
                  setSavedSectionType("payments");
                  updateMutation.mutate("payments");
                }}
                disabled={updateMutation.isPending || payments.length === 0 || !isPaymentsModified}
                className={cn(
                  "h-12 px-6 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0",
                  !isPaymentsModified && payments.length > 0
                    ? "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/50 border border-slate-200 dark:border-white/10 cursor-default"
                    : "bg-emerald-500 hover:bg-emerald-400 text-white hover:scale-105 active:scale-95 shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                )}
              >
                {updateMutation.isPending && savedSectionType === "payments" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : !isPaymentsModified && payments.length > 0 ? (
                  <Check size={16} className="text-white" />
                ) : (
                  <Check size={16} />
                )}
                <span>
                  {!isPaymentsModified && payments.length > 0
                    ? "Canaux de Paiement Validés"
                    : "Valider mes Canaux de Paiement"}
                </span>
              </button>
            </div>
         </div>
      </section>

      {/* Alertes Push */}
      <section id="push" className="bg-white dark:bg-vendeur-coal border border-slate-200/80 dark:border-white/10 p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] space-y-6 overflow-hidden shadow-md dark:shadow-2xl">
        <div className="flex items-center gap-4">
           <div className="h-10 w-10 md:h-12 md:w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 dark:text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5 shrink-0">
              <Bell size={20} className="md:w-6 md:h-6" />
           </div>
           <div>
              <h2 className="text-lg md:text-xl font-black text-white whitespace-nowrap">Alertes Push</h2>
              <p className="text-[10px] md:text-xs text-white/40 font-medium leading-relaxed">Notifications en temps réel sur cet appareil.</p>
           </div>
        </div>

        <button
          onClick={async () => {
            if (!("Notification" in window)) {
              toast.error("Votre navigateur ne supporte pas les notifications.");
              return;
            }

            try {
              const permission = await Notification.requestPermission();
              setPushStatus(permission);

              if (permission === "granted") {
                const promise = subscribeToPush(accessToken);
                toast.promise(promise, {
                  loading: 'Activation des alertes...',
                  success: () => {
                    setIsSubscribed(true);
                    return 'Alertes activées !';
                  },
                  error: 'Échec de l\'activation.'
                });
                await promise;
              } else {
                toast.error("Permission refusée. Veuillez activer les notifications dans votre navigateur.");
              }
            } catch (error) {
              console.error("Push Error:", error);
              toast.error("Erreur lors de l'activation.");
            }
          }}
          disabled={isSubscribed && pushStatus === 'granted'}
          className={cn(
            "flex h-16 w-full md:w-auto px-10 items-center justify-center gap-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
            (isSubscribed && pushStatus === 'granted')
              ? "bg-vendeur-emerald/10 border-vendeur-emerald text-vendeur-emerald cursor-default"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          )}
        >
          {isSubscribed && pushStatus === 'granted' ? (
            <>
              <Bell size={18} className="text-vendeur-emerald" />
              Alertes Actives
            </>
          ) : (
            <>
              Activer les Notifications
            </>
          )}
        </button>

      </section>

      {/* Sticky Floating Save Bar (Centered & Glassmorphism, only visible when modified) */}
      {isModified && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex items-center justify-center px-3 sm:px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="pointer-events-auto p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-vendeur-coal/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-2 sm:gap-3 max-w-full">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="h-11 sm:h-12 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <RotateCcw size={15} className="shrink-0" />
              <span>Annuler</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSavedSectionType("all");
                updateMutation.mutate("all");
              }}
              disabled={updateMutation.isPending}
              className="h-11 sm:h-12 px-5 sm:px-8 rounded-xl sm:rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/30 disabled:opacity-50 shrink-0 whitespace-nowrap cursor-pointer"
            >
              {updateMutation.isPending ? <Loader2 className="animate-spin shrink-0" size={16} /> : <Save size={16} className="shrink-0" />}
              <span>{updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}</span>
            </button>
          </div>
        </div>
      )}

      {(() => {
        const steps = dashboard?.setupStatus?.steps || [];
        const hasProducts = Boolean(steps.find((s: any) => s.id === "products")?.completed);
        const hasPayments = payments.length > 0;
        const hasDelivery = deliveryFees.length > 0;
        const hasSubscription = Boolean(steps.find((s: any) => s.id === "subscription")?.completed || merchant?.subscription?.status === "active");

        let modalTitle = "Réglages Boutique Validés ! 🚀";
        let modalSubtitle = "Vos informations de boutique, frais de livraison et comptes de paiement sont enregistrés.";
        let primaryLabel = "Tester dans le Simulateur";
        let primarySub = "Vérifiez les réponses de l'IA";
        let primaryHref = "/dashboard?test_ia=true";
        let secondaryActionConfig: any = undefined;

        if (savedSectionType === "delivery") {
          modalTitle = "Tarifs de Livraison Validés ! 🛵";
          modalSubtitle = "Vos zones et tarifs de livraison sont enregistrés. Vendeur IA calculera automatiquement les frais de livraison correspondants pour vos clients.";
          if (!hasPayments) {
            primaryLabel = "Configurer mes Moyens de Paiement";
            primarySub = "Wave, Orange Money, MTN, Moov";
            primaryHref = "/settings?tab=boutique#payments";
          } else if (!hasSubscription) {
            primaryLabel = "Activer mon Forfait 24h/24";
            primarySub = "Lancez vos ventes automatiques";
            primaryHref = "/offers";
          } else {
            primaryLabel = "Tester dans le Simulateur";
            primarySub = "Simulez une commande avec livraison";
            primaryHref = "/dashboard?test_ia=true";
          }
          secondaryActionConfig = {
            label: "Ajouter une autre zone de livraison",
            onClick: () => {
              setDeliveryFees((prev: any[]) => [...prev, { zone: "", price: 1000 }]);
              setShowMilestoneModal(false);
              setTimeout(() => {
                const el = document.getElementById("delivery");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 150);
            }
          };
        } else if (savedSectionType === "payments") {
          modalTitle = "Canaux de Paiement Validés ! 💳";
          modalSubtitle = "Vos comptes et numéros de paiement (Wave, OM, MoMo...) sont enregistrés. Vendeur IA transmettra ces coordonnées directes à vos clients.";
          if (!hasDelivery) {
            primaryLabel = "Définir mes Tarifs de Livraison";
            primarySub = "Configurez vos zones d'expédition";
            primaryHref = "/settings?tab=boutique#delivery";
          } else if (!hasSubscription) {
            primaryLabel = "Activer mon Forfait 24h/24";
            primarySub = "Lancez vos ventes automatiques";
            primaryHref = "/offers";
          } else {
            primaryLabel = "Tester dans le Simulateur";
            primarySub = "Simulez une vente avec encaissement";
            primaryHref = "/dashboard?test_ia=true";
          }
          secondaryActionConfig = {
            label: "Ajouter un autre moyen de paiement",
            onClick: () => {
              const countryProviders = getProvidersForCountry(localMerchant?.country || "CI");
              const defaultProvider = countryProviders[0]?.label || "Wave";
              setPayments((prev: any[]) => [...prev, { provider: defaultProvider, number: "" }]);
              setShowMilestoneModal(false);
              setTimeout(() => {
                const el = document.getElementById("payments");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 150);
            }
          };
        } else {
          // General / all
          if (!hasProducts) {
            primaryLabel = "Ajouter mes Articles & Prix";
            primarySub = "Créez votre catalogue de vente";
            primaryHref = "/products";
          } else if (!hasPayments) {
            primaryLabel = "Configurer mes Moyens de Paiement";
            primarySub = "Wave, Orange Money, MTN, Moov";
            primaryHref = "/settings?tab=boutique#payments";
          } else if (!hasDelivery) {
            primaryLabel = "Définir mes Tarifs de Livraison";
            primarySub = "Configurez vos zones d'expédition";
            primaryHref = "/settings?tab=boutique#delivery";
          } else if (!hasSubscription) {
            primaryLabel = "Activer mon Forfait 24h/24";
            primarySub = "Lancez vos ventes automatiques";
            primaryHref = "/offers";
          } else {
            primaryLabel = "Tester dans le Simulateur";
            primarySub = "Vérifiez les réponses de l'IA";
            primaryHref = "/dashboard?test_ia=true";
          }
          if (hasProducts) {
            secondaryActionConfig = { label: "Gérer mes Produits", href: "/products" };
          }
        }

        let calculatedScore = 25; // Base WhatsApp
        if (hasProducts) calculatedScore += 25;
        if (hasPayments) calculatedScore += 20;
        if (hasDelivery) calculatedScore += 15;
        if (hasSubscription) calculatedScore += 15;

        return (
          <StepMilestoneModal
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
            title={modalTitle}
            subtitle={modalSubtitle}
            score={calculatedScore}
            primaryAction={{
              label: primaryLabel,
              sublabel: primarySub,
              href: primaryHref
            }}
            secondaryAction={secondaryActionConfig}
            dashboardActionLabel="Retour au Tableau de Bord"
            autoRedirectSeconds={7}
            autoRedirectTo="/dashboard"
          />
        );
      })()}
    </div>
  );
}

// --- ONGLET 2 : SAVOIR IA (FAQ UNIQUEMENT) ---
function SavoirTab({ initialKnowledge }: { initialKnowledge: any }) {
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState(initialKnowledge);

  useEffect(() => {
    if (initialKnowledge) setLocalData(initialKnowledge);
  }, [initialKnowledge]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch("/api/commerce/knowledge", data);
    },
    onSuccess: () => {
      toast.success("Savoir IA mis à jour !");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    }
  });

  const handleAddFaq = () => {
    const faq = [...(localData?.faq || []), { question: "", answer: "" }];
    setLocalData({ ...localData, faq });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 w-full max-w-full overflow-hidden box-border">
      <section className="bg-vendeur-coal border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] space-y-6 sm:space-y-8 shadow-2xl overflow-hidden w-full max-w-full box-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <div className="h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
              <HelpCircle size={22} className="md:w-7 md:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase text-white leading-tight break-words">
                Mémoire de Vendeur IA (FAQ)
              </h2>
              <p className="text-[10px] md:text-xs text-white/40 font-medium mt-0.5">
                Donnez des réponses précises à votre Vendeur IA.
              </p>
            </div>
          </div>
          <button
            onClick={() => saveMutation.mutate(localData)}
            disabled={saveMutation.isPending}
            className="flex h-11 sm:h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white text-vendeur-coal px-6 sm:px-8 text-xs font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
          >
            {saveMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            <span>Enregistrer</span>
          </button>
        </div>

        <div className="space-y-4 sm:space-y-5 w-full max-w-full">
          {(localData?.faq || []).map((item: any, i: number) => (
            <div key={i} className="relative p-4 sm:p-5 bg-white/[0.02] border border-white/10 rounded-2xl sm:rounded-3xl space-y-3.5 hover:border-vendeur-emerald/30 transition-all w-full max-w-full box-border">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-vendeur-emerald flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-vendeur-emerald" />
                  <span>Question & Réponse #{i + 1}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const faq = localData.faq.filter((_: any, idx: number) => idx !== i);
                    setLocalData({ ...localData, faq });
                  }}
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Supprimer cette question"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Question Client</label>
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 sm:px-4 h-11 sm:h-12 text-xs sm:text-sm font-medium text-white focus:border-vendeur-emerald outline-none transition-all box-border placeholder-white/20"
                  placeholder="Ex: Livrez-vous à Bassam ?"
                  value={item.question}
                  onChange={(e) => {
                    const faq = [...localData.faq];
                    faq[i].question = e.target.value;
                    setLocalData({ ...localData, faq });
                  }}
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Réponse de Vendeur IA</label>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-medium text-white/80 focus:border-vendeur-emerald outline-none min-h-[90px] transition-all resize-none box-border placeholder-white/20"
                  placeholder="Oui, nous livrons partout à Bassam en 24h..."
                  value={item.answer}
                  onChange={(e) => {
                    const faq = [...localData.faq];
                    faq[i].answer = e.target.value;
                    setLocalData({ ...localData, faq });
                  }}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddFaq}
            className="w-full py-4 sm:py-5 border-2 border-dashed border-white/15 hover:border-vendeur-emerald/40 rounded-2xl sm:rounded-3xl text-vendeur-emerald text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-vendeur-emerald/5 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus size={16} />
            <span>Ajouter une information</span>
          </button>
        </div>
      </section>
    </div>
  );
}

// --- ONGLET 3 : PERSONNALITE (STYLE UNIQUEMENT) ---
function PersonnaliteTab({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const [aiSettings, setAiSettings] = useState(merchant?.aiSettings || {});

  useEffect(() => {
    if (merchant?.aiSettings) setAiSettings(merchant.aiSettings);
  }, [merchant]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/api/commerce/ai-settings", aiSettings);
    },
    onSuccess: () => {
      toast.success("Style de Vendeur IA mis à jour !");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 w-full max-w-full overflow-hidden box-border">
      <section className="bg-vendeur-coal/60 sm:bg-vendeur-coal border border-white/10 p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[3rem] space-y-6 sm:space-y-10 shadow-2xl overflow-hidden w-full max-w-full box-border">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
               <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5 sm:gap-3 flex-wrap">
                 <Bot size={22} className="text-vendeur-emerald shrink-0" />
                 <span>Style de Communication</span>
               </h2>
               <p className="text-[10px] md:text-xs text-white/40 font-medium">Définissez le caractère et les automatismes de votre Vendeur IA.</p>
            </div>
            <button
               onClick={() => updateMutation.mutate()}
               disabled={updateMutation.isPending}
               className="h-11 sm:h-12 w-full sm:w-auto bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal px-6 sm:px-8 rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap cursor-pointer shrink-0"
            >
               {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
            </button>
         </div>

          <div className="grid gap-4 sm:gap-6 md:gap-8 w-full max-w-full">
            {/* Master Switch: Vendeur IA Actif 24h/24 vs Mode Pause */}
            <div className={cn(
              "p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] border transition-all space-y-3 sm:space-y-4 w-full max-w-full box-border",
              aiSettings.autoReply !== false
                ? "bg-emerald-500/10 border-emerald-500/30 shadow-xl shadow-emerald-500/5"
                : "bg-amber-500/10 border-amber-500/30 shadow-xl shadow-amber-500/5"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                  <div className={cn(
                    "h-11 w-11 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black shrink-0",
                    aiSettings.autoReply !== false
                      ? "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-vendeur-emerald/20"
                      : "bg-amber-500 text-vendeur-coal shadow-lg shadow-amber-500/20"
                  )}>
                    {aiSettings.autoReply !== false ? <Zap size={22} /> : <PauseCircle size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        aiSettings.autoReply !== false ? "bg-vendeur-emerald animate-pulse" : "bg-amber-400"
                      )} />
                      <h3 className="font-black text-white text-sm sm:text-base uppercase tracking-tight">
                        {aiSettings.autoReply !== false ? "Vendeur IA Actif (En Vente 24h/24)" : "Mode Pause (WhatsApp Manuel)"}
                      </h3>
                    </div>
                    <p className="text-xs text-white/60 mt-1 max-w-xl leading-relaxed">
                      {aiSettings.autoReply !== false
                        ? "L'IA prend le relais automatiquement pour répondre aux clients, présenter vos articles et enregistrer vos commandes."
                        : "L'IA ne répond plus automatiquement. Votre WhatsApp reste connecté et vous échangez manuellement avec vos clients."}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end sm:justify-center shrink-0 self-end sm:self-center">
                  <ToggleButton
                    active={aiSettings.autoReply !== false}
                    onToggle={() => setAiSettings({ ...aiSettings, autoReply: aiSettings.autoReply === false ? true : false })}
                    color="bg-vendeur-emerald"
                  />
                </div>
              </div>
            </div>

            {/* Personnalité */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald ml-1">Tempérament Dominant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                 <PersonalityButton
                    active={aiSettings.personality === "friendly"}
                    onClick={() => setAiSettings({...aiSettings, personality: "friendly"})}
                    label="Friendly"
                    desc="Chaleureux & Sympa"
                 />
                 <PersonalityButton
                    active={aiSettings.personality === "professional"}
                    onClick={() => setAiSettings({...aiSettings, personality: "professional"})}
                    label="Professional"
                    desc="Sérieux & Direct"
                 />
                 <PersonalityButton
                    active={aiSettings.personality === "premium"}
                    onClick={() => setAiSettings({...aiSettings, personality: "premium"})}
                    label="Premium"
                    desc="Élégant & Rare"
                 />
              </div>
            </div>

            {/* Voix & Slang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
               <div className={cn(
                 "p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] border transition-all space-y-4 sm:space-y-6 w-full max-w-full box-border",
                 aiSettings.voiceMode ? "bg-sky-500/5 border-sky-400/30" : "bg-white/[0.03] border-white/5"
               )}>
                  <div className="flex items-center justify-between gap-3">
                     <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0">
                        <Mic size={22} />
                     </div>
                     <ToggleButton
                        active={aiSettings.voiceMode}
                        onToggle={() => setAiSettings({...aiSettings, voiceMode: !aiSettings.voiceMode})}
                        color="bg-sky-400"
                     />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm sm:text-base">Mode Note Vocale</h4>
                    <p className="text-xs text-white/40 mt-1">Vendeur IA répondra par notes vocales.</p>
                  </div>
               </div>

               <div className={cn(
                 "p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] border transition-all space-y-4 sm:space-y-6 w-full max-w-full box-border",
                 aiSettings.localSlang ? "bg-amber-500/5 border-amber-400/30" : "bg-white/[0.03] border-white/5"
               )}>
                  <div className="flex items-center justify-between gap-3">
                     <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
                        <MessageSquare size={22} />
                     </div>
                     <ToggleButton
                        active={aiSettings.localSlang}
                        onToggle={() => setAiSettings({...aiSettings, localSlang: !aiSettings.localSlang})}
                        color="bg-amber-400"
                     />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm sm:text-base">Ton Ivoirien (Slang)</h4>
                    <p className="text-xs text-white/40 mt-1">Utilise le Nouchi et expressions locales pour plus de proximité.</p>
                  </div>
               </div>

               {/* Assistant Statuts WhatsApp du Matin */}
                <div className={cn(
                  "p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] border transition-all space-y-4 sm:space-y-6 w-full max-w-full box-border",
                  aiSettings.dailyStatusAssistant !== false ? "bg-emerald-500/5 border-emerald-400/30" : "bg-white/[0.03] border-white/5"
                )}>
                   <div className="flex items-center justify-between gap-3">
                      <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 shrink-0">
                         <MessageSquare size={22} />
                      </div>
                      <ToggleButton
                         active={aiSettings.dailyStatusAssistant !== false}
                         onToggle={() => setAiSettings({...aiSettings, dailyStatusAssistant: aiSettings.dailyStatusAssistant === false ? true : false})}
                         color="bg-emerald-400"
                      />
                   </div>
                   <div>
                     <h4 className="font-black text-white text-sm sm:text-base">Pack Statuts WhatsApp Quotidien</h4>
                     <p className="text-xs text-white/40 mt-1">Reçois chaque matin 3 textes percutants prêts à être postés en statut.</p>
                   </div>
                </div>

                {/* Auto-Publication Statut WhatsApp (QR Code / Baileys) */}
                <div className={cn(
                  "p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] border transition-all space-y-4 sm:space-y-6 w-full max-w-full box-border",
                  aiSettings.autoPostStatus ? "bg-purple-500/5 border-purple-400/30" : "bg-white/[0.03] border-white/5"
                )}>
                   <div className="flex items-center justify-between gap-3">
                      <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-purple-400/10 flex items-center justify-center text-purple-400 shrink-0">
                         <Zap size={22} />
                      </div>
                      <ToggleButton
                         active={aiSettings.autoPostStatus}
                         onToggle={() => setAiSettings({...aiSettings, autoPostStatus: !aiSettings.autoPostStatus})}
                         color="bg-purple-400"
                      />
                   </div>
                   <div>
                     <h4 className="font-black text-white text-sm sm:text-base">Publication Automatique en Statut</h4>
                     <p className="text-xs text-white/40 mt-1">Poste automatiquement 1 produit en statut chaque matin.</p>
                   </div>
                </div>
            </div>
         </div>
      </section>
    </div>
  );
}

// --- ONGLET 4 : CONNEXIONS ---
function ConnexionsTab({ merchant, systemSettings }: { merchant: any; systemSettings: any }) {
  const queryClient = useQueryClient();
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isMarketplaceGuideOpen, setIsMarketplaceGuideOpen] = useState(false);
  const [isPackProOpen, setIsPackProOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 w-full max-w-full overflow-hidden box-border">
      <WhatsAppConnectionFlow />

      <section className="space-y-4 sm:space-y-5 w-full max-w-full">
        <div className="flex items-center gap-3.5 px-1">
          <div className="h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20 shrink-0">
            <Globe size={22} className="md:w-7 md:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight">
              Canaux Connectés
            </h2>
            <p className="text-xs sm:text-sm text-white/40 font-medium">
              Gérez les plateformes où votre Vendeur IA est actif.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5 w-full max-w-full">
          <SocialCard
            icon={<FacebookIcon size={22} color="#FFFFFF" />}
            name="Facebook Messenger"
            status={merchant?.facebookConfig?.pageId ? "Actif & Connecté" : "Non configuré"}
            active={!!merchant?.facebookConfig?.pageId}
            color="bg-[#1877F2]"
            onClick={() => setIsFacebookModalOpen(true)}
          />
          <SocialCard
            icon={<InstagramIcon size={22} color="#FFFFFF" />}
            name="Instagram Business"
            status={merchant?.instagramConfig?.pageId ? "Actif & Connecté" : "Non configuré"}
            active={!!merchant?.instagramConfig?.pageId}
            color="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]"
          />
          <SocialCard
            icon={<TikTokIcon size={22} color="#FFFFFF" />}
            name="TikTok Shop"
            status="Bientôt disponible"
            active={false}
            color="bg-[#000000] border border-white/15"
          />
        </div>
      </section>

      <FacebookConnectionModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
        merchant={merchant}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
        onOpenMarketplaceGuide={() => setIsMarketplaceGuideOpen(true)}
      />

      <MarketplaceGuideModal
        isOpen={isMarketplaceGuideOpen}
        onClose={() => setIsMarketplaceGuideOpen(false)}
        onOpenPackPro={() => setIsPackProOpen(true)}
      />

      <PackProModal
        isOpen={isPackProOpen}
        onClose={() => setIsPackProOpen(false)}
      />
    </div>
  );
}

// --- COMPOSANTS UI PARTAGES ---
function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  pattern
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "search" | "text" | "none" | "tel" | "url" | "email" | "numeric" | "decimal";
  pattern?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{label}</label>
      <input
        type={type}
        inputMode={inputMode}
        pattern={pattern}
        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-5 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner font-sans"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function PersonalityButton({ active, onClick, label, desc, emoji }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group w-full cursor-pointer active:scale-[0.98]",
        active ? "bg-vendeur-emerald/10 border-vendeur-emerald shadow-lg" : "bg-white/5 border-white/5 hover:border-white/20"
      )}
    >
      <div className="relative z-10">
        {emoji && <span className="text-xl sm:text-2xl mb-1.5 sm:mb-2 block">{emoji}</span>}
        <p className={cn("font-black text-xs sm:text-sm uppercase tracking-wider", active ? "text-vendeur-emerald" : "text-white")}>{label}</p>
        <p className="text-[10px] text-white/40 font-medium mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

function ToggleButton({ active, onToggle, color }: any) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-16 h-9 rounded-full relative transition-all duration-300 shadow-lg",
        active ? color : "bg-white/10"
      )}
    >
      <div className={cn(
        "absolute top-1 w-7 h-7 rounded-full bg-white transition-all duration-300 shadow-md",
        active ? "left-8" : "left-1"
      )} />
    </button>
  );
}

function SocialCard({ icon, name, status, active, color, onClick }: any) {
  return (
    <div className={cn(
      "p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border transition-all flex items-center justify-between gap-3.5 group w-full max-w-full box-border",
      active
        ? "bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/15 shadow-sm"
        : "bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 opacity-80 hover:opacity-100"
    )}>
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className={cn("h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform", color)}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">{name}</h4>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 truncate">{status}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick && !active}
        className={cn(
          "h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95",
          active
            ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-vendeur-emerald border border-emerald-500/30 cursor-pointer font-bold"
            : onClick
              ? "bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-900 dark:text-white cursor-pointer border border-slate-300 dark:border-white/10"
              : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed border border-slate-200 dark:border-white/5"
        )}
      >
        {active ? "Détails" : onClick ? "Lier" : "Bientôt"}
      </button>
    </div>
  );
}
