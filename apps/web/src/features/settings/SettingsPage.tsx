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
  ChevronDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { WhatsAppConnectionFlow } from "./components/WhatsAppConnectionFlow";
import { FacebookConnectionModal } from "./components/fb/FacebookConnectionModal";
import { MarketplaceGuideModal } from "./components/fb/MarketplaceGuideModal";
import { PackProModal } from "../dashboard/components/PackProModal";
import { BillingTab } from "./components/BillingTab";
import { ReferralCard } from "./components/ReferralCard";
import { GrowthTab } from "./components/GrowthTab";
import { subscribeToPush } from "@/lib/pushUtils";
import { AddressAutocomplete } from "../onboarding/components/AddressAutocomplete";
import { ZoneAutocomplete } from "../onboarding/components/ZoneAutocomplete";

import { useSocket } from "@/hooks/useSocket";
import { getProvidersForCountry, getZonesForCity, getCountryByCode } from "@vendeur-ia/core";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TikTokIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 16 16" className={className}>
    <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.38 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
  </svg>
);

const InstagramIcon = ({ size = 22, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

import { Gift, TrendingUp } from "lucide-react";

type SettingsTab = "boutique" | "savoir" | "personnalite" | "connexions" | "growth" | "billing" | "referral" | "compte";

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const handleScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftScroll(scrollLeft > 10);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
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

  const qrCodeData = queryClient.getQueryData<string>(["whatsapp:qr"]);
  const [localQrCode, setLocalQrCode] = useState<string | null>(qrCodeData || null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on("whatsapp:qr", (data: { qrCodeData: string }) => {
      setLocalQrCode(data.qrCodeData);
      queryClient.setQueryData(["whatsapp:qr"], data.qrCodeData);
    });
    return () => {
      socket.off("whatsapp:qr");
    };
  }, [socket, queryClient]);

  if (isDashboardLoading || isKnowledgeLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Sparkles className="animate-spin text-vendeur-emerald" size={48} />
      </div>
    );
  }

  const merchant = dashboard?.merchant;
  const systemSettings = dashboard?.systemSettings;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-8 md:space-y-10 animate-in fade-in duration-700 pb-24 overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-5xl font-black tracking-tighter uppercase text-white flex items-center gap-3 md:gap-4">
            <Settings className="text-vendeur-emerald shrink-0" size={32} />
            <span className="truncate">Centre de Contrôle</span>
          </h1>
          <p className="text-white/40 text-sm md:text-lg">Pilotez votre machine de vente et configurez votre IA.</p>
        </div>

        <button
          onClick={logout}
          className="h-12 px-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </header>

      {/* Navigation Onglets */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-vendeur-bg/95 backdrop-blur-xl">
        <div className="relative max-w-full w-full group">
          {/* Indicateurs de Scroll */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-vendeur-coal to-transparent pointer-events-none rounded-l-2xl md:rounded-l-3xl transition-opacity duration-300",
            showLeftScroll ? "opacity-100" : "opacity-0"
          )} />
          <div className={cn(
            "absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-vendeur-coal to-transparent pointer-events-none rounded-r-2xl md:rounded-r-3xl transition-opacity duration-300",
            showRightScroll ? "opacity-100" : "opacity-0"
          )} />

          <div
            ref={tabsRef}
            className="flex gap-2 p-1.5 bg-vendeur-coal/80 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/10 w-fit shadow-2xl overflow-x-auto no-scrollbar max-w-full relative"
          >
            <TabButton
              active={activeTab === "boutique"}
              onClick={() => setActiveTab("boutique")}
              icon={<Store size={18} />}
              label="Boutique"
            />
            <TabButton
              active={activeTab === "savoir"}
              onClick={() => setActiveTab("savoir")}
              icon={<Brain size={18} />}
              label="Savoir IA"
            />
            <TabButton
              active={activeTab === "personnalite"}
              onClick={() => setActiveTab("personnalite")}
              icon={<Bot size={18} />}
              label="Personnalité"
            />
            <TabButton
              active={activeTab === "connexions"}
              onClick={() => setActiveTab("connexions")}
              icon={<Globe size={18} />}
              label="Connexions"
            />
            <TabButton
              active={activeTab === "growth"}
              onClick={() => setActiveTab("growth")}
              icon={<TrendingUp size={18} />}
              label="Croissance"
            />
            <TabButton
              active={activeTab === "billing"}
              onClick={() => setActiveTab("billing")}
              icon={<Banknote size={18} />}
              label="Facturation"
            />
            <TabButton
              active={activeTab === "referral"}
              onClick={() => setActiveTab("referral")}
              icon={<Gift size={18} />}
              label="Parrainage"
            />
            <TabButton
              active={activeTab === "compte"}
              onClick={() => setActiveTab("compte")}
              icon={<UserIcon size={18} />}
              label="Mon Profil"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        {activeTab === "boutique" && <BoutiqueTab merchant={merchant} initialKnowledge={knowledge} accessToken={accessToken || ""} />}
        {activeTab === "savoir" && <SavoirTab initialKnowledge={knowledge} />}
        {activeTab === "personnalite" && <PersonnaliteTab merchant={merchant} />}
        {activeTab === "connexions" && (
          <ConnexionsTab
            merchant={merchant}
            systemSettings={systemSettings}
            qrCode={localQrCode}
            onCancelScan={() => {
              setLocalQrCode(null);
              queryClient.setQueryData(["whatsapp:qr"], null);
            }}
          />
        )}
        {activeTab === "growth" && <GrowthTab merchant={merchant} />}
        {activeTab === "billing" && <BillingTab merchant={merchant} />}
        {activeTab === "referral" && <ReferralCard merchant={merchant} />}
        {activeTab === "compte" && <CompteTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      data-active={active}
      className={cn(
        "flex items-center justify-center gap-2 px-4 md:px-5 h-12 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-tight transition-all shrink-0 whitespace-nowrap",
        active ? "bg-vendeur-emerald text-vendeur-coal shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="shrink-0">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 16 }) : icon}
      </div>
      <span className="leading-none">{label}</span>
    </button>
  );
}

// --- ONGLET 1 : BOUTIQUE (PROFIL, LIVRAISON, PAIEMENTS) ---
function BoutiqueTab({ merchant, initialKnowledge, accessToken }: { merchant: any; initialKnowledge: any; accessToken: string }) {
  const queryClient = useQueryClient();
  const [localMerchant, setLocalMerchant] = useState(merchant);
  const [payments, setPayments] = useState(initialKnowledge?.businessRules?.paymentMethods || []);
  const [deliveryFees, setDeliveryFees] = useState(initialKnowledge?.businessRules?.deliveryFees || []);

  useEffect(() => {
    if (merchant) setLocalMerchant(merchant);
    if (initialKnowledge?.businessRules?.paymentMethods) setPayments(initialKnowledge.businessRules.paymentMethods);
    if (initialKnowledge?.businessRules?.deliveryFees) setDeliveryFees(initialKnowledge.businessRules.deliveryFees);
  }, [merchant, initialKnowledge]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/api/commerce/merchant", localMerchant);
      await apiClient.patch("/api/commerce/knowledge", {
        businessRules: {
          ...initialKnowledge?.businessRules,
          paymentMethods: payments,
          deliveryFees: deliveryFees
        }
      });
    },
    onSuccess: () => {
      toast.success("Réglages Boutique enregistrés ! ✨");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    }
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <section className="bg-vendeur-coal/50 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
              <Store size={22} className="text-vendeur-emerald shrink-0" />
              <span className="whitespace-nowrap">Profil de la Boutique</span>
            </h2>
            <p className="text-[10px] md:text-xs text-white/40 font-medium">L'IA utilise ces infos pour présenter votre business.</p>
          </div>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-vendeur-emerald px-6 text-[10px] font-black uppercase text-vendeur-coal shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <InputGroup label="Nom du commerce" value={localMerchant?.businessName} onChange={v => setLocalMerchant({...localMerchant, businessName: v})} placeholder="Ex: Ma Boutique Chic" />
          <InputGroup label="WhatsApp Business" value={localMerchant?.whatsappNumber} onChange={v => setLocalMerchant({...localMerchant, whatsappNumber: v})} placeholder="Ex: 07 00 00 00 00" />

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Devise du Commerce</label>
            <div className="relative">
              <select
                className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer"
                value={localMerchant?.currency}
                onChange={e => setLocalMerchant({...localMerchant, currency: e.target.value})}
              >
                <option value="XOF">Franc CFA (XOF) - UEMOA</option>
                <option value="XAF">Franc CFA (XAF) - CEMAC</option>
                <option value="GNF">Franc Guinéen (GNF)</option>
                <option value="NGN">Naira (NGN)</option>
                <option value="GHS">Cedi (GHS)</option>
                <option value="KES">Shilling (KES)</option>
                <option value="MAD">Dirham Marocain (MAD)</option>
                <option value="DZD">Dinar Algérien (DZD)</option>
                <option value="TND">Dinar Tunisien (TND)</option>
                <option value="CDF">Franc Congolais (CDF)</option>
                <option value="MRU">Ouguiya (MRU)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Catégorie</label>

            <select
              className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer"
              value={localMerchant?.category || ""}
              onChange={e => setLocalMerchant({...localMerchant, category: e.target.value})}
            >
              <option value="fashion">👗 Mode & Beauté</option>
              <option value="food">🍔 Restauration & Food</option>
              <option value="beauty">💄 Soins & Cosmétiques</option>
              <option value="electronics">📱 Électronique & High-Tech</option>
              <option value="artisan">🛠️ Artisanat & Fait Main</option>
              <option value="services">💼 Prestations de Services</option>
              <option value="digital">📚 Produits Digitaux & Formations</option>
              <option value="home">🏠 Maison & Décoration</option>
              <option value="grocery">🛒 Épicerie & Supérette</option>
              <option value="health">💊 Santé & Bien-être</option>
              <option value="auto">🚗 Auto-Moto & Pièces</option>
              <option value="other">📦 Autre Commerce</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Devise de Facturation</label>
            <select
              className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer"
              value={localMerchant?.billingCurrency || "XOF"}
              onChange={e => setLocalMerchant({...localMerchant, billingCurrency: e.target.value})}
            >
              <option value="XOF">FCFA (XOF)</option>
              <option value="GHS">Cedi (GHS)</option>
              <option value="NGN">Naira (NGN)</option>
              <option value="USD">Dollar (USD)</option>
              <option value="KES">Shilling (KES)</option>
              <option value="ZAR">Rand (ZAR)</option>
            </select>
          </div>
          <div className="space-y-1.5">
             <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Adresse / Zone</label>
             <AddressAutocomplete
               value={localMerchant?.address || ""}
               onChange={v => setLocalMerchant({...localMerchant, address: v})}
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
                   // Logic to update currency could go here if we want to be aggressive
                 }

                 setLocalMerchant({ ...localMerchant, ...updates });

                 // Automatically suggest adding the detected zone/commune if not already present
                 const zoneName = neighborhood || district;
                 if (zoneName && !deliveryFees.find((f: any) => f.zone.toLowerCase().includes(zoneName.toLowerCase()))) {
                   setDeliveryFees([...deliveryFees, { zone: zoneName, price: 1000 }]);
                   toast.info(`Zone "${zoneName}" ajoutée aux frais de livraison 🚚`);
                 }
               }}
               placeholder="Ex: Cocody, Abidjan"
               className="h-14 rounded-2xl"
             />
          </div>
        </div>
      </section>

      {/* Grille de Livraison */}
      <section className="bg-vendeur-coal border border-white/10 p-4 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 md:gap-4 px-2">
          <div className="h-12 w-12 md:h-14 md:w-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/20 shrink-0">
            <Truck size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase text-white leading-tight whitespace-nowrap">Frais de Livraison</h2>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-white/30">Ces tarifs seront communiqués aux clients.</p>
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex flex-row gap-2 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              <span className="flex-1">Zone / Commune</span>
              <span className="w-24 md:w-40 text-right pr-2">Tarif ({localMerchant?.currency || "XOF"})</span>
           </div>

           {deliveryFees.map((fee: any, idx: number) => (
              <div key={idx} className="relative group animate-in slide-in-from-left-2 duration-200 py-1">
                 <div className="flex flex-row gap-2 items-center">
                    <ZoneAutocomplete
                        value={fee.zone}
                        city={localMerchant?.city}
                        countryCode={localMerchant?.country}
                        onChange={(val) => {
                          const next = [...deliveryFees];
                          next[idx].zone = val;
                          setDeliveryFees(next);
                        }}
                        placeholder="Ex: Riviera 3"
                        className="flex-1 h-14 text-sm font-bold"
                    />
                    <div className="relative w-24 md:w-40 shrink-0">
                      <input
                          type="number"
                          className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-3 text-sm text-vendeur-emerald font-black outline-none focus:border-sky-500 transition-all font-mono"
                          placeholder="1500"
                          value={fee.price}
                          onChange={(e) => {
                            const next = [...deliveryFees];
                            next[idx].price = parseInt(e.target.value) || 0;
                            setDeliveryFees(next);
                          }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/10 pointer-events-none uppercase">
                        {localMerchant?.currency || "XOF"}
                      </span>
                    </div>
                 </div>

                 <button
                    onClick={() => setDeliveryFees(deliveryFees.filter((_: any, i: number) => i !== idx))}
                    className="absolute -right-2 -top-1 h-7 w-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-95 z-10"
                 >
                    <Trash2 size={12} />
                 </button>
              </div>
           ))}

           {deliveryFees.length === 0 && localMerchant?.city && (
             <div className="p-6 rounded-3xl bg-white/5 border border-dashed border-white/10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Suggestions pour {localMerchant.city}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                   {getZonesForCity(localMerchant.city).map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setDeliveryFees([...deliveryFees, { zone: suggestion.name, price: suggestion.suggestedPrice }])}
                        className="px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold hover:bg-sky-500 hover:text-white transition-all"
                      >
                         + {suggestion.name} ({suggestion.suggestedPrice} {localMerchant.currency || "XOF"})
                      </button>
                   ))}
                </div>
             </div>
           )}

           <button
              onClick={() => setDeliveryFees([...deliveryFees, { zone: "", price: 1000 }])}
              className="flex items-center gap-2 text-sky-400 text-xs font-black uppercase tracking-widest hover:underline px-4 pt-2"
           >
              <Plus size={16} /> Ajouter une zone
           </button>
        </div>
      </section>

      {/* Canal de paiement */}
      <section className="bg-vendeur-coal border border-white/10 p-4 md:p-8 rounded-[2.5rem] space-y-8 shadow-2xl overflow-hidden">
         <div className="space-y-1 px-2">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
              <Banknote size={22} className="text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Canal de paiement</span>
            </h2>
            <p className="text-[10px] md:text-xs text-white/40">Coordonnées pour les transferts d'argent.</p>
         </div>

         <div className="space-y-4">
            {payments.map((p: any, idx: number) => (
              <div key={idx} className="relative group space-y-2 animate-in slide-in-from-left-2 duration-300 py-1">
                <div className="flex flex-row gap-2 items-center w-full">
                  <div className="w-[35%] md:w-[25%] shrink-0">
                      <div className="relative">
                        <select
                          className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-2 text-[10px] font-black uppercase tracking-tight text-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                          value={p.provider}
                          onChange={(e) => {
                            const next = [...payments];
                            next[idx].provider = e.target.value;
                            setPayments(next);
                          }}
                        >
                          {getProvidersForCountry(localMerchant?.country || "CI").map(provider => (
                            <option key={provider.id} value={provider.label}>{provider.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={14} />
                      </div>
                  </div>
                  <div className="flex-1 min-w-0">
                      <div className="relative">
                        {p.provider !== "Espèces" && p.provider !== "Virement Bancaire" && p.provider !== "Bank Transfer" && p.provider !== "Carte Bancaire" && p.provider !== "Autre (Préciser)" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 font-mono">
                            {getCountryByCode(localMerchant?.country || "CI")?.dialCode}
                          </span>
                        )}
                        <input
                          className={cn(
                            "w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-4 text-sm font-bold text-white focus:border-emerald-500 outline-none transition-all font-mono",
                            (p.provider !== "Espèces" && p.provider !== "Virement Bancaire" && p.provider !== "Bank Transfer" && p.provider !== "Carte Bancaire" && p.provider !== "Autre (Préciser)") && "pl-12"
                          )}
                          value={p.number}
                          onChange={(e) => {
                            const next = [...payments];
                            next[idx].number = e.target.value;
                            setPayments(next);
                          }}
                          placeholder={
                            p.provider === "Carte Bancaire"
                              ? "Lien ou instructions"
                              : p.provider === "Virement Bancaire" || p.provider === "Bank Transfer"
                              ? "RIB / Détails bancaires"
                              : p.provider === "Autre (Préciser)"
                              ? "Détails"
                              : "07 00 00 00 00"
                          }
                        />
                      </div>
                  </div>
                </div>

                {p.provider === "Autre (Préciser)" && (
                  <div className="animate-in slide-in-from-top-1 duration-200">
                    <input
                      className="w-full md:w-2/3 h-10 bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 text-[9px] font-black text-emerald-400 outline-none focus:border-emerald-500 transition-all uppercase tracking-widest"
                      placeholder="NOM DU CANAL..."
                      value={p.customLabel || ""}
                      onChange={(e) => {
                        const next = [...payments];
                        next[idx].customLabel = e.target.value;
                        setPayments(next);
                      }}
                    />
                  </div>
                )}

                <button
                  onClick={() => setPayments(payments.filter((_: any, i: number) => i !== idx))}
                  className="absolute -right-2 top-0 h-7 w-7 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-95 z-10"
                >
                    <Trash2 size={12} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setPayments([...payments, { provider: "Wave", number: "" }])}
              className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] hover:underline pt-2 px-1"
            >
               <Plus size={16} /> Ajouter un canal de paiement
            </button>
         </div>
      </section>

      {/* Alertes Push */}
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-8 rounded-[2.5rem] space-y-6 overflow-hidden">
        <div className="flex items-center gap-4">
           <div className="h-10 w-10 md:h-12 md:w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5 shrink-0">
              <Bell size={20} className="md:w-6 md:h-6" />
           </div>
           <div>
              <h2 className="text-lg md:text-xl font-black text-white whitespace-nowrap">Alertes Push</h2>
              <p className="text-[10px] md:text-xs text-white/40 font-medium leading-relaxed">Notifications en temps réel sur cet appareil.</p>
           </div>
        </div>

        <button
          onClick={async () => {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              await subscribeToPush(accessToken);
              toast.success("Alertes activées ! 🔔");
            } else {
              toast.error("Permission refusée.");
            }
          }}
          className="flex h-16 w-full md:w-auto px-10 items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <Sparkles size={18} className="text-amber-400" />
          Activer les Notifications
        </button>


      </section>
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
      toast.success("Savoir IA mis à jour ! 🧠");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    }
  });

  const handleAddFaq = () => {
    const faq = [...(localData?.faq || []), { question: "", answer: "" }];
    setLocalData({ ...localData, faq });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-12 w-12 md:h-14 md:w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
                <HelpCircle size={24} className="md:w-7 md:h-7" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase text-white leading-tight whitespace-nowrap">Mémoire de l'IA (FAQ)</h2>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Donnez des réponses précises à votre IA.</p>
              </div>
            </div>
            <button
              onClick={() => saveMutation.mutate(localData)}
              disabled={saveMutation.isPending}
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white text-vendeur-coal px-8 text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>

          <div className="space-y-6">
            {(localData?.faq || []).map((item: any, i: number) => (
              <div key={i} className="relative group p-6 bg-black/20 border border-white/5 rounded-3xl space-y-4 hover:border-vendeur-emerald/30 transition-all">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/20 ml-1">Question Client</label>
                    <input
                      className="w-full bg-vendeur-coal border border-white/5 rounded-xl px-4 h-12 text-sm font-bold text-white focus:border-vendeur-emerald outline-none transition-all"
                      placeholder="Ex: Livrez-vous à Bassam ?"
                      value={item.question}
                      onChange={(e) => {
                         const faq = [...localData.faq];
                         faq[i].question = e.target.value;
                         setLocalData({...localData, faq});
                      }}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/20 ml-1">Réponse de l'IA</label>
                    <textarea
                      className="w-full bg-vendeur-coal border border-white/5 rounded-xl px-4 py-4 text-sm text-white/70 focus:border-vendeur-emerald outline-none min-h-[100px] transition-all resize-none"
                      placeholder="Oui, nous livrons partout à Bassam..."
                      value={item.answer}
                      onChange={(e) => {
                         const faq = [...localData.faq];
                         faq[i].answer = e.target.value;
                         setLocalData({...localData, faq});
                      }}
                    />
                 </div>
                <button
                  onClick={() => {
                    const faq = localData.faq.filter((_: any, idx: number) => idx !== i);
                    setLocalData({ ...localData, faq });
                  }}
                  className="absolute right-4 top-4 h-10 w-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddFaq}
              className="w-full py-6 border-2 border-dashed border-white/10 rounded-[2rem] text-vendeur-emerald text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
            >
              <Plus size={16} /> Ajouter une information
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
      toast.success("Style de l'IA mis à jour ! ✨");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-10 shadow-2xl overflow-hidden">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
               <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                 <Sparkles size={22} className="text-amber-400 shrink-0" />
                 <span className="whitespace-nowrap">Style de Communication</span>
               </h2>
               <p className="text-[10px] md:text-xs text-white/40">Définissez le caractère de votre IA.</p>
            </div>
            <button
               onClick={() => updateMutation.mutate()}
               disabled={updateMutation.isPending}
               className="h-12 w-full sm:w-auto bg-vendeur-emerald text-vendeur-coal px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap"
            >
               {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
            </button>
         </div>

         <div className="grid gap-10">
            {/* Personnalité */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-vendeur-emerald ml-1">Tempérament Dominant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <PersonalityButton
                    active={aiSettings.personality === "friendly"}
                    onClick={() => setAiSettings({...aiSettings, personality: "friendly"})}
                    label="Friendly"
                    desc="Chaleureux & Sympa"
                    emoji="👋"
                 />
                 <PersonalityButton
                    active={aiSettings.personality === "professional"}
                    onClick={() => setAiSettings({...aiSettings, personality: "professional"})}
                    label="Professional"
                    desc="Sérieux & Direct"
                    emoji="💼"
                 />
                 <PersonalityButton
                    active={aiSettings.personality === "premium"}
                    onClick={() => setAiSettings({...aiSettings, personality: "premium"})}
                    label="Premium"
                    desc="Élégant & Rare"
                    emoji="💎"
                 />
              </div>
            </div>

            {/* Voix & Slang */}
            <div className="grid md:grid-cols-2 gap-6">
               <div className={cn(
                 "p-8 rounded-[2rem] border transition-all space-y-6",
                 aiSettings.voiceMode ? "bg-sky-500/5 border-sky-400/30" : "bg-white/5 border-white/5"
               )}>
                  <div className="flex items-center justify-between">
                     <div className="h-12 w-12 rounded-2xl bg-sky-400/10 flex items-center justify-center text-sky-400">
                        <Mic size={24} />
                     </div>
                     <ToggleButton
                        active={aiSettings.voiceMode}
                        onToggle={() => setAiSettings({...aiSettings, voiceMode: !aiSettings.voiceMode})}
                        color="bg-sky-400"
                     />
                  </div>
                  <div>
                    <h4 className="font-black text-white">Mode Note Vocale</h4>
                    <p className="text-xs text-white/40 mt-1">L'IA répondra par audio.</p>
                  </div>
               </div>

               <div className={cn(
                 "p-8 rounded-[2rem] border transition-all space-y-6",
                 aiSettings.localSlang ? "bg-amber-500/5 border-amber-400/30" : "bg-white/5 border-white/5"
               )}>
                  <div className="flex items-center justify-between">
                     <div className="h-12 w-12 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                        <MessageSquare size={24} />
                     </div>
                     <ToggleButton
                        active={aiSettings.localSlang}
                        onToggle={() => setAiSettings({...aiSettings, localSlang: !aiSettings.localSlang})}
                        color="bg-amber-400"
                     />
                  </div>
                  <div>
                    <h4 className="font-black text-white">Ton Ivoirien (Slang)</h4>
                    <p className="text-xs text-white/40 mt-1">Utilise le Nouchi/etc pour plus de proximité.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}

// --- ONGLET 4 : CONNEXIONS ---
function ConnexionsTab({ merchant, systemSettings, qrCode, onCancelScan }: { merchant: any; systemSettings: any; qrCode: string | null; onCancelScan: () => void }) {
  const queryClient = useQueryClient();
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isMarketplaceGuideOpen, setIsMarketplaceGuideOpen] = useState(false);
  const [isPackProOpen, setIsPackProOpen] = useState(false);

  const connectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/whatsapp/connect", {});
    },
    onSuccess: () => {
      toast.info("Initialisation de WhatsApp...");
    }
  });

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500 overflow-x-hidden">
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl overflow-hidden">
         <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-white whitespace-nowrap">Liaison WhatsApp</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.15em] md:tracking-[0.2em] font-black">Indispensable pour vos ventes automatisées.</p>
         </div>

         <WhatsAppConnectionFlow
           merchant={{ ...merchant, systemSettings }}
           qrCode={qrCode}
           onInitBaileys={() => connectMutation.mutate()}
           onRefreshMerchant={() => queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
           onCancelScan={onCancelScan}
         />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 md:h-14 md:w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20 shrink-0">
              <Globe size={24} className="md:w-7 md:h-7" />
           </div>
           <div>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-tight whitespace-nowrap">Canaux Connectés</h2>
              <p className="text-xs md:text-sm text-white/40">Gérez les plateformes où votre IA est active.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <SocialCard
              icon={<Facebook size={24} />}
              name="Facebook Messenger"
              status={merchant?.facebookConfig?.pageId ? "Actif" : "Non configuré"}
              active={!!merchant?.facebookConfig?.pageId}
              color="bg-[#1877F2]"
              onClick={() => setIsFacebookModalOpen(true)}
           />
           <SocialCard
              icon={<InstagramIcon size={24} />}
              name="Instagram Business"
              status={merchant?.instagramConfig?.pageId ? "Actif" : "Non configuré"}
              active={!!merchant?.instagramConfig?.pageId}
              color="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]"
           />
           <SocialCard
              icon={<TikTokIcon size={24} />}
              name="TikTok Shop"
              status="En développement 🚀"
              active={false}
              color="bg-black"
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

function CompteTab() {
  const { user, updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    avatarUrl: user?.avatarUrl || ""
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await apiClient.patch("/api/auth/me", form);
      updateUser(res.data);
      toast.success("Profil mis à jour ! ✨");
    } catch (err) {
      toast.error("Échec de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 max-w-2xl overflow-x-hidden">
      <section className="bg-vendeur-coal/50 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="h-12 w-12 md:h-14 md:w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20 shrink-0">
            <UserIcon size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase text-white leading-tight whitespace-nowrap">Mon Profil Personnel</h2>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Gérez vos informations de compte.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 py-4">
           <div className="relative group">
              <div className="h-24 w-24 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/20">
                    <UserIcon size={40} />
                  </div>
                )}
              </div>
              <label className="absolute -right-2 -bottom-2 h-10 w-10 bg-vendeur-emerald text-vendeur-coal rounded-xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-all">
                <Camera size={18} />
                <input
                  type="text"
                  className="hidden"
                  placeholder="URL de l'image"
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                />
              </label>
           </div>
           <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Cliquez sur l'icône pour modifier l'URL de l'image</p>
        </div>

        <div className="grid gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom d'affichage</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-12 pr-4 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="space-y-1.5 opacity-50">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email (Non modifiable)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                disabled
                className="w-full h-14 rounded-2xl bg-black/20 border border-white/10 pl-12 pr-4 text-white/40 outline-none cursor-not-allowed"
                value={user?.email || ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">URL Photo de Profil</label>
            <input
              className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner text-xs"
              value={form.avatarUrl}
              onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 shadow-xl shadow-vendeur-emerald/20 whitespace-nowrap"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              Enregistrer
              <Save size={18} />
            </>
          )}
        </button>
      </section>
    </div>
  );
}

// --- COMPOSANTS UI PARTAGES ---
function InputGroup({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{label}</label>
      <input
        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-5 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner"
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
        "p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group",
        active ? "bg-vendeur-emerald/10 border-vendeur-emerald shadow-lg" : "bg-white/5 border-white/5 hover:border-white/20"
      )}
    >
      <div className="relative z-10">
        <span className="text-2xl mb-2 block">{emoji}</span>
        <p className={cn("font-black text-sm uppercase tracking-widest", active ? "text-vendeur-emerald" : "text-white")}>{label}</p>
        <p className="text-[10px] text-white/40 font-medium mt-0.5">{desc}</p>
      </div>
      {active && <div className="absolute -right-2 -bottom-2 opacity-10"><Sparkles size={80} className="text-vendeur-emerald" /></div>}
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
      "p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group",
      active ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 opacity-60"
    )}>
       <div className="flex items-center gap-6">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", color)}>
             {icon}
          </div>
          <div>
             <h4 className="text-lg font-black text-white">{name}</h4>
             <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{status}</p>
          </div>
       </div>
       <button
         onClick={onClick}
         disabled={!onClick && !active}
         className={cn(
           "h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
           active ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-white/10 text-white/20 hover:bg-white/20 cursor-pointer"
         )}
       >
          {active ? "Détails" : "Lier"}
       </button>
    </div>
  );
}
