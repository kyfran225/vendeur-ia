import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Sparkles,
  Store,
  Smartphone,
  Zap,
  Check,
  ShieldCheck,
  Rocket,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import axios from "axios";
import { useSocket } from "@/hooks/useSocket";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CountrySelector, COUNTRIES } from "./components/CountrySelector";
import { AddressAutocomplete } from "./components/AddressAutocomplete";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export function OnboardingWizard() {
  const { tempData, currentStep, setStep, clearOnboarding } = useOnboardingStore();
  const { user, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [isMerchantCreated, setIsMerchantCreated] = useState(false);

  // Redirect if no temp data and no user (should be handled by App.tsx guard but safe check)
  if (!tempData && !user) {
    navigate("/");
    return null;
  }

  // Create real merchant record as soon as the wizard starts if not already done
  useEffect(() => {
    const initMerchant = async () => {
      if (user && accessToken && tempData && !isMerchantCreated) {
        try {
          console.log("[Onboarding] Attempting to create/update merchant with complete data...");
          await apiClient.post("/api/commerce/merchant", {
            ...tempData,
            city: tempData.city || "Abidjan" // Default to Abidjan if not detected
          });
          setIsMerchantCreated(true);
          console.log("[Onboarding] Merchant data persisted successfully");
        } catch (err: any) {
          const isDuplicate = err.response?.status === 409;
          if (isDuplicate) {
            setIsMerchantCreated(true);
          } else {
            console.error("[Onboarding] Failed to persist data", err);
          }
        }
      }
    };
    initMerchant();
  }, [user, accessToken, tempData, isMerchantCreated]);

  const handleNext = () => setStep(currentStep + 1);
  const handleBack = () => setStep(currentStep - 1);

  const steps = [
    { title: "Bienvenue", component: <WelcomeStep onNext={handleNext} onBack={() => navigate("/")} /> },
    { title: "IA Vision", component: <VisionStep onNext={handleNext} onBack={handleBack} /> },
    { title: "Connexion", component: <WhatsAppStep onNext={async () => {
      // Final sync before dashboard
      try {
        if (tempData) {
          await apiClient.post("/api/commerce/merchant", tempData);
        }
      } catch (err) {
        console.warn("[Onboarding] Final sync failed", err);
      }
      clearOnboarding();
      navigate("/dashboard");
    }} onBack={handleBack} /> },
  ];

  // Safety check: if currentStep is out of bounds (e.g. after removing a step), reset to 0 or last valid step
  useEffect(() => {
    if (currentStep >= steps.length) {
      setStep(steps.length - 1);
    }
  }, [currentStep, steps.length, setStep]);

  // Pre-render check to avoid crash
  if (!steps[currentStep]) return null;

  return (
    <div className="min-h-screen bg-vendeur-coal flex flex-col items-center justify-center p-4 md:p-12 overflow-x-hidden">
      {/* Progress Bar */}
      <div className="w-full max-w-3xl mb-16 flex items-center justify-between px-6 relative">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-3 z-10">
            <div className={`h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-xs md:text-sm font-black transition-all shadow-2xl ${
              i <= currentStep ? "bg-vendeur-emerald text-vendeur-coal scale-110 shadow-vendeur-emerald/20" : "bg-white/5 text-white/20 border border-white/10"
            }`}>
              {i < currentStep ? <Check size={20} /> : i + 1}
            </div>
            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ${
              i <= currentStep ? "text-vendeur-emerald" : "text-white/20"
            }`}>{s.title}</span>
          </div>
        ))}
        {/* Connection lines */}
        <div className="absolute left-1/2 -translate-x-1/2 top-5 md:top-6 w-[80%] h-[2px] bg-white/5 -z-10" />
      </div>

      <div className="w-full max-w-7xl relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
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
  const { tempData, setTempData } = useOnboardingStore();
  const [form, setForm] = useState(tempData || {
    businessName: "",
    category: "fashion",
    description: "",
    country: "CI",
    address: "",
    whatsappNumber: ""
  });

  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === (form.country || "CI")) || COUNTRIES[0]
  );

  // Extract local phone from whatsappNumber if it already has the dialCode
  const initialLocalPhone = form.whatsappNumber?.startsWith(selectedCountry.dialCode)
    ? form.whatsappNumber.replace(selectedCountry.dialCode, "")
    : form.whatsappNumber || "";

  const [localPhone, setLocalPhone] = useState(initialLocalPhone);

  useEffect(() => {
    if (selectedCountry) {
      setForm(prev => ({
        ...prev,
        country: selectedCountry.code,
        whatsappNumber: `${selectedCountry.dialCode}${localPhone}`
      }));
    }
  }, [localPhone, selectedCountry]);

  const handleNext = () => {
    if (form.businessName && form.whatsappNumber && form.address) {
      setTempData(form);
      onNext();
    } else {
      toast.error("Veuillez remplir tous les champs obligatoires (Nom, WhatsApp et Adresse).");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700 w-full max-w-7xl mx-auto">
      <section className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24 text-left">
        <div className="w-full lg:max-w-lg">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20">
            <Rocket className="text-vendeur-emerald" size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-tight">
            {tempData?.businessName ? "Vérifiez votre" : "Lancez votre"} <br/>
            <span className="text-vendeur-emerald">machine de vente.</span>
          </h1>
          <p className="text-lg text-white/50 mb-8 max-w-xl leading-relaxed font-medium">
            Ces informations permettent à l'IA de personnaliser ses réponses et de vendre vos produits avec votre propre style.
          </p>
        </div>

        <div className="relative w-full lg:w-auto">
          <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0c0f0d] p-8 text-left w-full lg:min-w-[600px] shadow-2xl">
            <div className="mb-8 flex items-center gap-4 relative z-10">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20">
                <Store size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Profil du commerce</h2>
                <p className="text-xs text-white/40 font-medium">Ceci aidera l'IA à mieux vendre pour vous.</p>
              </div>
            </div>

            <div className="grid gap-6 relative z-10">
               <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Nom du commerce</span>
                <input
                   className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-vendeur-emerald transition-all"
                   value={form.businessName}
                   onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                   placeholder="Ex: Aicha Mode"
                />
              </label>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 min-w-0 grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Catégorie</span>
                  <div className="relative">
                    <select
                      className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-vendeur-emerald transition-all appearance-none cursor-pointer"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      <option value="fashion">👗 Mode & Beauté</option>
                      <option value="food">🍔 Restauration</option>
                      <option value="services">💼 Services</option>
                      <option value="beauty">💄 Soins & Cosmétiques</option>
                      <option value="electronics">📱 Électronique</option>
                      <option value="other">📦 Autre</option>
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-white/30 pointer-events-none" />
                  </div>
                </label>
                <label className="flex-1 min-w-0 grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">WhatsApp Business</span>
                  <div className="flex gap-2 items-center w-full">
                    <CountrySelector
                      selected={selectedCountry}
                      onSelect={(c) => setSelectedCountry(c)}
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-vendeur-emerald transition-all placeholder:text-white/10 text-sm"
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="07 00 00 00 00"
                        type="tel"
                      />
                    </div>
                  </div>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Adresse précise</span>
                <AddressAutocomplete
                  value={form.address}
                  onChange={(value) => setForm({ ...form, address: value })}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Ce que vous vendez / Instructions</span>
                <textarea
                  className="min-h-[100px] rounded-xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-vendeur-emerald transition-all resize-none text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Je vends des sacs de luxe. Livraison partout sous 2h."
                />
              </label>

              <button
                onClick={handleNext}
                className="mt-4 flex h-16 items-center justify-center gap-3 rounded-2xl bg-vendeur-emerald px-8 text-sm font-black uppercase tracking-widest text-vendeur-coal shadow-xl shadow-vendeur-emerald/10 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Sparkles size={18} /> Continuer vers l'IA Vision
              </button>

              <button onClick={onBack} className="mt-4 text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors text-center w-full">
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function VisionStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { tempData, setTempData } = useOnboardingStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(tempData?.firstProduct || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(tempData?.productImage || null);
  const { accessToken } = useAuthStore();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Create a preview and store it
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
      toast.success("Produit analysé par l'IA ! ✨");
    } catch (err) {
      toast.error("Échec de l'analyse IA");
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
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-4 md:p-8">
      <div className="flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20">
            <Sparkles className="text-vendeur-emerald" size={24} />
          </div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            La Magie <br/> <span className="text-vendeur-emerald">IA Vision.</span>
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Ajoutez votre premier produit en prenant simplement une photo. Notre IA se charge du reste : titre, prix, description et tags.
          </p>

          <div className="space-y-4">
             <div className="flex items-center gap-3 text-white/40 text-sm">
                <CheckCircle2 className="text-vendeur-emerald" size={18} />
                Gain de temps massif
             </div>
             <div className="flex items-center gap-3 text-white/40 text-sm">
                <CheckCircle2 className="text-vendeur-emerald" size={18} />
                Descriptions vendeuses
             </div>
          </div>
        </div>

        <div className="w-full max-w-xl">
          {!result ? (
            <label className={`relative flex flex-col items-center justify-center aspect-square rounded-[2.5rem] border-2 border-dashed border-white/10 bg-black/40 hover:border-vendeur-emerald/40 transition-all cursor-pointer overflow-hidden ${analyzing ? "pointer-events-none" : ""}`}>
               {analyzing ? (
                 <div className="flex flex-col items-center gap-4 text-center p-8">
                    <Loader2 className="text-vendeur-emerald animate-spin" size={48} />
                    <p className="text-vendeur-emerald font-black uppercase tracking-widest text-xs">L'IA analyse votre produit...</p>
                 </div>
               ) : (
                 <>
                   <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="text-white/20" size={32} />
                   </div>
                   <p className="text-white/60 font-bold uppercase tracking-widest text-[10px]">Prendre une photo</p>
                   <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                 </>
               )}
            </label>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="aspect-video bg-white/5 relative">
                  {previewUrl && <img src={previewUrl} className="h-full w-full object-cover opacity-50" />}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="text-vendeur-emerald" size={48} />
                  </div>
               </div>
               <div className="p-4 md:p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Nom suggéré</h3>
                    <input
                      className="w-full bg-transparent border-b border-white/10 text-xl font-bold text-white outline-none focus:border-vendeur-emerald transition-colors"
                      value={result.name}
                      onChange={(e) => handleUpdateResult({ name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Prix suggéré</h3>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-full bg-transparent border-b border-white/10 text-2xl font-black text-vendeur-emerald outline-none focus:border-vendeur-emerald transition-colors"
                          value={result.price}
                          onChange={(e) => handleUpdateResult({ price: Number(e.target.value) })}
                        />
                        <span className="text-xl font-black text-vendeur-emerald">FCFA</span>
                      </div>
                    </div>
                    <button onClick={onNext} className="w-full sm:w-auto h-12 px-8 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs shrink-0">
                      Confirmer
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-6">
        {!result && !analyzing && (
          <button onClick={onNext} className="text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
            Passer cette étape
          </button>
        )}
        <button onClick={onBack} className="text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
          Retour aux informations
        </button>
      </div>
    </div>
  );
}

function WhatsAppStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { accessToken } = useAuthStore();
  const socket = useSocket();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("whatsapp:qr", (data: { qrCodeData: string }) => {
      setQrCode(data.qrCodeData);
      setLoading(false);
    });

    socket.on("whatsapp:connected", () => {
      setConnected(true);
      toast.success("WhatsApp connecté avec succès ! 🎉");
      setTimeout(onNext, 2000);
    });

    return () => {
      socket.off("whatsapp:qr");
      socket.off("whatsapp:connected");
    };
  }, [socket, onNext]);

  const startConnection = async () => {
    setLoading(true);
    try {
      await apiClient.post("/api/whatsapp/connect", {});
    } catch (err) {
      toast.error("Échec du lancement de la connexion");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 text-center">
      <div className={`inline-flex h-20 w-20 items-center justify-center rounded-3xl mb-8 transition-colors ${connected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-[#25d366]/10 border-[#25d366]/20"}`}>
        {connected ? <CheckCircle2 className="text-emerald-500" size={40} /> : <Smartphone className="text-[#25d366]" size={40} />}
      </div>

      <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tighter">
        {connected ? "WhatsApp Connecté !" : "Liez votre WhatsApp"}
      </h2>

      {!connected ? (
        <>
          <p className="text-lg text-white/50 mb-12 max-w-xl mx-auto">
            Scannez le code QR avec votre téléphone pour activer votre agent vendeur.
          </p>

          <div className="flex flex-col items-center justify-center gap-8">
            <div className="relative h-64 w-64 bg-white rounded-3xl p-4 flex items-center justify-center shadow-2xl">
               {qrCode ? (
                 <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
               ) : (
                 <div className="flex flex-col items-center gap-4 text-vendeur-coal">
                   {loading ? (
                     <Loader2 className="animate-spin text-vendeur-emerald" size={48} />
                   ) : (
                     <button onClick={startConnection} className="flex flex-col items-center gap-2 group">
                        <RefreshCw className="text-vendeur-emerald group-hover:rotate-180 transition-transform duration-500" size={48} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Générer QR Code</span>
                     </button>
                   )}
                 </div>
               )}
            </div>

            <div className="max-w-md w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-left">
              <h4 className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest mb-4">Marche à suivre</h4>
              <ul className="space-y-4">
                <li className="flex gap-4 text-xs text-white/60">
                  <span className="h-5 w-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  Ouvrez WhatsApp sur votre téléphone.
                </li>
                <li className="flex gap-4 text-xs text-white/60">
                  <span className="h-5 w-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  Allez dans Réglages {">"} Appareils connectés.
                </li>
                <li className="flex gap-4 text-xs text-white/60">
                  <span className="h-5 w-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  Appuyez sur "Connecter un appareil" et scannez le code.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 mt-12">
            <button
              onClick={onNext}
              className="h-14 px-8 rounded-2xl border border-vendeur-emerald/30 bg-vendeur-emerald/5 text-vendeur-emerald text-sm font-black uppercase tracking-widest hover:bg-vendeur-emerald/10 transition-all"
            >
              Terminer et connecter plus tard
            </button>

            <button onClick={onBack} className="text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
              Retour à l'étape précédente
            </button>
          </div>
        </>
      ) : (
        <div className="py-12">
           <div className="animate-bounce mb-8">
             <Rocket className="text-vendeur-emerald mx-auto" size={64} />
           </div>
           <p className="text-xl text-white/70 font-bold">Initialisation de votre machine de vente...</p>
        </div>
      )}
    </div>
  );
}
