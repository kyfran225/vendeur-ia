import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Store,
  Zap,
  Check,
  Rocket,
  ImageIcon,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CountrySelector, COUNTRIES, Country, parsePhoneNumber, formatDisplayPhone } from "./components/CountrySelector";
import { CategorySelector } from "./components/CategorySelector";
import { AddressAutocomplete } from "./components/AddressAutocomplete";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export function OnboardingWizard() {
  const { tempData, currentStep, setStep, setTempData, clearOnboarding } = useOnboardingStore();
  const { user, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [isMerchantCreated, setIsMerchantCreated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const creationStarted = useRef(false);

  // Restore data from backend on mount and merge with local landing page tempData
  useEffect(() => {
    const restoreData = async () => {
      if (user && accessToken && !creationStarted.current) {
        try {
          creationStarted.current = true;
          const res = await apiClient.get("/api/commerce/dashboard");
          if (res.data?.merchant) {
            const m = res.data.merchant;
            const knowledge = res.data.knowledge;

            const restoredData = {
              businessName: m.businessName || tempData?.businessName || "",
              category: m.category || tempData?.category || "fashion",
              description: m.description || tempData?.description || "",
              country: m.country || tempData?.country || "CI",
              currency: m.currency || tempData?.currency || "XOF",
              address: m.address || tempData?.address || "",
              whatsappNumber: m.whatsappNumber || user.whatsappNumber || tempData?.whatsappNumber || "",
              city: m.city || tempData?.city || "",
              paymentMethods: knowledge?.businessRules?.paymentMethods?.map((pm: any) => pm.provider) || tempData?.paymentMethods || [],
              firstProduct: res.data.products?.[0] ? {
                name: res.data.products[0].name,
                price: res.data.products[0].price,
                description: res.data.products[0].description,
                category: res.data.products[0].category,
                tags: res.data.products[0].aiMetadata?.tags
              } : tempData?.firstProduct,
              productImage: res.data.products?.[0]?.images?.[0] || tempData?.productImage
            };

            setTempData(restoredData);
            setIsMerchantCreated(true);
          } else if (tempData) {
            // New user registering from landing page: preserve landing form data and sync phone if needed
            const finalPhone = tempData.whatsappNumber || user.whatsappNumber || "";
            setTempData({
              ...tempData,
              whatsappNumber: finalPhone
            });
          }
        } catch (err) {
          console.error("[Onboarding] Failed to restore data", err);
          creationStarted.current = false;
        }
      }
      setIsRestoring(false);
    };
    restoreData();
  }, [user, accessToken, setTempData]);

  // Create or Update merchant record (Auto-save)
  useEffect(() => {
    const saveMerchant = async () => {
      if (user && accessToken && tempData && !isRestoring) {
        try {
          await apiClient.post("/api/commerce/merchant", {
            ...tempData,
            city: tempData.city || ""
          });
          setIsMerchantCreated(true);
          creationStarted.current = true;
        } catch (err: any) {
          const isDuplicate = err.response?.status === 409;
          if (isDuplicate) {
            setIsMerchantCreated(true);
            creationStarted.current = true;
          } else {
            console.error("[Onboarding] Auto-save failed", err);
          }
        }
      }
    };

    const timer = setTimeout(saveMerchant, 2000);
    return () => clearTimeout(timer);
  }, [user, accessToken, tempData, isRestoring]);

  const handleNext = () => setStep(currentStep + 1);
  const handleBack = () => setStep(currentStep - 1);

  const steps = [
    { title: "Profil Boutique", component: <WelcomeStep onNext={handleNext} onBack={() => navigate("/")} /> },
    { title: "IA Vision", component: <VisionStep onNext={async () => {
      try {
        if (tempData) {
          await apiClient.post("/api/commerce/merchant", {
            ...tempData
          });
        }
      } catch (err) {
        console.warn("[Onboarding] Final sync failed", err);
      }
      clearOnboarding();
      navigate("/offers?from=onboarding");
    }} onBack={handleBack} /> },
  ];

  useEffect(() => {
    if (currentStep >= steps.length) {
      setStep(steps.length - 1);
    }
  }, [currentStep, steps.length, setStep]);

  if (isRestoring) {
    return <VendeurIALoader fullscreen label="Préparation de votre espace..." size="lg" />;
  }

  if (!steps[currentStep]) return null;

  return (
    <div className="min-h-[100dvh] bg-vendeur-coal flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 md:p-12 overflow-x-hidden">
      {/* Modern Minimal Progress Bar */}
      <div className="w-full max-w-md mb-6 sm:mb-10 flex gap-2 px-2">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${
              i <= currentStep ? "bg-vendeur-emerald shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-white/10"
            }`} />
            <span className={`text-[10px] font-black uppercase tracking-wider text-center transition-colors ${
              i <= currentStep ? "text-vendeur-emerald" : "text-white/20"
            }`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-7xl relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {steps[currentStep].component}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const navigate = useNavigate();
  const { tempData, setTempData } = useOnboardingStore();
  const { user } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const initialNumber = tempData?.whatsappNumber || user?.whatsappNumber || "";
  const initialParsed = parsePhoneNumber(initialNumber, tempData?.country);

  const [useAccountPhone, setUseAccountPhone] = useState<boolean>(
    Boolean(user?.whatsappNumber && (!tempData?.whatsappNumber || tempData.whatsappNumber === user.whatsappNumber))
  );

  const [selectedCountry, setSelectedCountry] = useState<Country>(
    (tempData?.country ? COUNTRIES.find(c => c.code === tempData.country) : null) || initialParsed.country
  );
  const [localPhone, setLocalPhone] = useState(initialParsed.local);

  const [form, setForm] = useState(tempData || {
    businessName: "",
    category: "fashion",
    description: "",
    country: initialParsed.country.code,
    currency: initialParsed.country.currency,
    address: "",
    whatsappNumber: initialNumber
  });

  // Sync if user.whatsappNumber hydrates after initial render
  useEffect(() => {
    const rawNumber = tempData?.whatsappNumber || user?.whatsappNumber;
    if (rawNumber && (!localPhone || !form.whatsappNumber)) {
      const parsed = parsePhoneNumber(rawNumber, tempData?.country);
      setSelectedCountry(parsed.country);
      setLocalPhone(parsed.local);
      setForm(prev => ({
        ...prev,
        country: parsed.country.code,
        currency: parsed.country.currency,
        whatsappNumber: rawNumber || ""
      }));
    }
  }, [user?.whatsappNumber, tempData?.whatsappNumber, tempData?.country]);

  useEffect(() => {
    if (useAccountPhone && user?.whatsappNumber) {
      const parsed = parsePhoneNumber(user.whatsappNumber, tempData?.country);
      setSelectedCountry(parsed.country);
      setLocalPhone(parsed.local);
      setForm(prev => ({
        ...prev,
        country: parsed.country.code,
        currency: parsed.country.currency,
        whatsappNumber: user.whatsappNumber || ""
      }));
    } else if (selectedCountry) {
      const newWhatsappNumber = `${selectedCountry.dialCode}${localPhone}`;
      setForm(prev => ({
        ...prev,
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        whatsappNumber: newWhatsappNumber
      }));
    }
  }, [useAccountPhone, localPhone, selectedCountry, user?.whatsappNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTempData(form);
    }, 1000);
    return () => clearTimeout(timer);
  }, [form, setTempData]);

  const handleNext = () => {
    if (form.businessName && form.whatsappNumber && form.address) {
      setTempData(form);
      onNext();
    } else {
      toast.error("Veuillez renseigner le nom de la boutique, le numéro WhatsApp et l'adresse.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 w-full max-w-6xl mx-auto">
      <section className="w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 text-left">
        
        {/* Left Headline */}
        <div className="w-full lg:max-w-md text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[10px] font-black uppercase tracking-wider mb-4">
            <Rocket size={14} />
            <span>Configuration 2 Min</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight leading-tight">
            Lancez votre <br />
            <span className="text-vendeur-emerald">Vendeur IA.</span>
          </h1>
          <p className="text-sm sm:text-base text-white/50 mb-6 leading-relaxed font-medium">
            Ces informations permettent à votre Vendeur IA de répondre aux clients avec vos prix, votre catalogue et vos règles de livraison.
          </p>
        </div>

        {/* Right Form Card */}
        <div className="w-full lg:w-auto flex-1 max-w-xl">
          <div className="rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-[#0c0f0d] p-5 sm:p-8 text-left shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5 pb-2 border-b border-white/5">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20 flex items-center justify-center shrink-0">
                <Store size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">Profil de votre Boutique</h2>
                <p className="text-xs text-white/40 font-medium">Modifiable à tout moment dans vos paramètres.</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Nom de votre Boutique / Marque
                </label>
                <input
                  className="w-full h-14 rounded-2xl border border-white/10 bg-black/40 px-4 text-white text-sm outline-none focus:border-vendeur-emerald transition-all placeholder:text-white/20"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="Ex: Aicha Mode Abidjan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                    Catégorie
                  </label>
                  <CategorySelector
                    value={form.category}
                    onChange={(catId) => setForm({ ...form, category: catId as any })}
                    buttonClassName="h-14 !rounded-2xl border-white/10 bg-black/40 hover:border-vendeur-emerald/50 focus:border-vendeur-emerald text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Numéro WhatsApp de vente
                    </label>
                    {user?.whatsappNumber && (
                      <button
                        type="button"
                        onClick={() => setUseAccountPhone(!useAccountPhone)}
                        className="text-[10px] font-bold text-vendeur-emerald hover:underline cursor-pointer"
                      >
                        {useAccountPhone ? "Changer" : "Mon compte"}
                      </button>
                    )}
                  </div>

                  {useAccountPhone && user?.whatsappNumber ? (
                    <div className="flex items-center justify-between w-full h-14 rounded-2xl border border-vendeur-emerald/30 bg-vendeur-emerald/5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-vendeur-emerald animate-pulse" />
                        <span className="font-mono text-sm font-bold text-white tracking-wider">
                          {formatDisplayPhone(user.whatsappNumber, selectedCountry.code)}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-vendeur-emerald bg-vendeur-emerald/10 px-2 py-0.5 rounded-full border border-vendeur-emerald/20">
                        Vérifié
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center w-full">
                      <CountrySelector
                        selected={selectedCountry}
                        onSelect={(c) => {
                          setSelectedCountry(c);
                          setForm(prev => ({ ...prev, country: c.code, currency: c.currency }));
                        }}
                        className="h-14 !rounded-2xl px-3.5 sm:px-4"
                      />
                      <div className="flex-1 min-w-0">
                        <input
                          className="w-full h-14 rounded-2xl border border-white/10 bg-black/40 px-4 text-white font-mono text-sm outline-none focus:border-vendeur-emerald transition-all placeholder:text-white/20"
                          value={localPhone}
                          onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="01 02 27 39 66"
                          type="tel"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Adresse & Ville de livraison
                </label>
                <AddressAutocomplete
                  value={form.address}
                  onChange={(value) => setForm({ ...form, address: value })}
                  onSelectSuggestion={(feature) => {
                    const props = feature.properties;
                    const context = props.context || {};
                    const city = props.place?.name || context.place?.name || props.name || "";
                    const countryCode = context.country?.country_code || props.country_code || "";

                    const updates: any = {
                      city: city,
                      address: props.full_address || props.name
                    };

                    if (countryCode) {
                      const countryData = COUNTRIES.find(c => c.code === countryCode);
                      if (countryData) {
                        setSelectedCountry(countryData);
                        updates.country = countryCode;
                        updates.currency = countryData.currency;
                      }
                    }

                    setForm(prev => ({ ...prev, ...updates }));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Votre offre (produits, services...)
                  </label>
                  <span className={cn(
                    "text-[9px] font-bold tracking-wider",
                    (form.description?.length || 0) >= 450 ? "text-amber-400 font-black" : "text-white/30"
                  )}>
                    {form.description?.length || 0}/500
                  </span>
                </div>
                <textarea
                  maxLength={500}
                  className="w-full min-h-[90px] rounded-2xl border border-white/10 bg-black/40 p-4 text-white text-sm outline-none focus:border-vendeur-emerald transition-all resize-none placeholder:text-white/20 shadow-inner"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Produits vendus, prestations de service, tarifs et modalités de livraison..."
                />
              </div>

              <button
                onClick={handleNext}
                className="w-full h-14 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 cursor-pointer mt-2"
              >
                <Sparkles size={18} />
                <span>Continuer vers IA Vision</span>
                <ChevronRight size={18} />
              </button>

              <div className="pt-2 flex flex-col items-center gap-2">
                <ConfirmationModal
                  isOpen={showLogoutConfirm}
                  onClose={() => setShowLogoutConfirm(false)}
                  onConfirm={() => {
                    useAuthStore.getState().logout();
                    navigate("/");
                  }}
                  title="Quitter la configuration ?"
                  message="Votre progression sera sauvegardée, mais vous devrez vous reconnecter pour continuer."
                  confirmLabel="Se déconnecter"
                  cancelLabel="Continuer"
                  type="logout"
                />

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="text-white/25 text-[11px] font-medium hover:text-rose-400/80 transition-colors cursor-pointer"
                >
                  Quitter la configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function VisionStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const navigate = useNavigate();
  const { tempData, setTempData } = useOnboardingStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [result, setResult] = useState<any>(tempData?.firstProduct || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(tempData?.productImage || null);
  const currency: string = (tempData as any)?.currency || "XOF";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewUrl(base64String);
      setTempData({ productImage: base64String });
    };
    reader.readAsDataURL(selected);

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", selected);

      const res = await apiClient.post("/api/commerce/products/vision", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResult(res.data);
      setTempData({ firstProduct: res.data });
      toast.success("Produit analysé avec succès ! ✨");
    } catch (err) {
      toast.error("Échec de l'analyse IA de la photo");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateResult = (updates: any) => {
    const newResult = { ...result, ...updates };
    setResult(newResult);
    setTempData({ firstProduct: newResult });
  };

  return (
    <div className="bg-[#0c0f0d] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-2xl max-w-4xl mx-auto text-left">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        
        {/* Left Explanation */}
        <div className="flex-1 space-y-4 sm:space-y-6 text-left">
          <div className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald">
            <Sparkles size={22} />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight">
            Magie <br />
            <span className="text-vendeur-emerald">IA Vision.</span>
          </h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed font-medium">
            Ajoutez votre premier produit en prenant simplement une photo. Vendeur IA génère automatiquement le nom, le prix suggéré et la description commerciale.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-2.5 text-white/50 text-xs sm:text-sm">
              <CheckCircle2 className="text-vendeur-emerald shrink-0" size={16} />
              <span>Génération instantanée en 3 secondes</span>
            </div>
            <div className="flex items-center gap-2.5 text-white/50 text-xs sm:text-sm">
              <CheckCircle2 className="text-vendeur-emerald shrink-0" size={16} />
              <span>Descriptions attractives prêtes pour WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Right Photo Zone / Result */}
        <div className="w-full md:max-w-md">
          {!result ? (
            <label className={cn(
              "relative flex flex-col items-center justify-center aspect-[4/3] sm:aspect-square rounded-[2rem] border-2 border-dashed border-white/15 bg-black/40 hover:border-vendeur-emerald/50 transition-all cursor-pointer overflow-hidden p-6 text-center group",
              analyzing && "pointer-events-none"
            )}>
              {analyzing ? (
                <div className="flex flex-col items-center justify-center p-6">
                  <VendeurIALoader label="Vendeur IA analyse votre photo..." size="sm" />
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/5 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform text-white/40 group-hover:text-vendeur-emerald">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-white font-black uppercase tracking-wider text-xs sm:text-sm">Prendre ou Choisir une photo</p>
                  <p className="text-white/30 text-[10px] mt-1">PNG, JPG ou WEBP</p>
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                </>
              )}
            </label>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="aspect-video bg-white/5 relative">
                {previewUrl && <img src={previewUrl} alt="Produit" className="h-full w-full object-cover" />}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-vendeur-emerald text-[11px] font-bold">
                  <CheckCircle2 size={14} />
                  <span>Analysé</span>
                </div>
              </div>
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Nom suggéré</label>
                  <input
                    className="w-full h-14 bg-black/40 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 text-base font-bold text-white outline-none transition-all"
                    value={result.name}
                    onChange={(e) => handleUpdateResult({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Catégorie</label>
                  <CategorySelector
                    value={result.category || tempData?.category || "fashion"}
                    onChange={(catId) => handleUpdateResult({ category: catId })}
                    buttonClassName="h-14 !rounded-2xl border-white/10 bg-black/40 hover:border-vendeur-emerald/50 focus:border-vendeur-emerald text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-3 pt-1">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Prix suggéré</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-full h-14 bg-black/40 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 text-lg font-black text-vendeur-emerald outline-none transition-all"
                        value={result.price}
                        onChange={(e) => handleUpdateResult({ price: Number(e.target.value) })}
                      />
                      <span className="text-sm font-black text-vendeur-emerald px-2">{currency}</span>
                    </div>
                  </div>
                  <button
                    onClick={onNext}
                    className="h-14 px-6 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20"
                  >
                    <span>Valider mon produit</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
        {!result && !analyzing && (
          <button
            onClick={onNext}
            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-wider text-xs hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Passer cette étape</span>
            <ChevronRight size={16} />
          </button>
        )}

        <button
          onClick={onBack}
          className="text-white/40 text-xs font-bold hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Retour à l'étape précédente</span>
        </button>

        <ConfirmationModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            useAuthStore.getState().logout();
            navigate("/");
          }}
          title="Quitter la configuration ?"
          message="Votre progression sera sauvegardée, mais vous devrez vous reconnecter pour continuer."
          confirmLabel="Se déconnecter"
          cancelLabel="Continuer"
          type="logout"
        />

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-white/20 text-[10px] font-medium hover:text-rose-400 transition-colors cursor-pointer"
        >
          Quitter la configuration
        </button>
      </div>
    </div>
  );
}
