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
          await apiClient.post("/api/commerce/merchant", {
            ...tempData,
            city: tempData.city || "Abidjan"
          });
          setIsMerchantCreated(true);
          console.log("[Onboarding] Merchant created successfully");
        } catch (err: any) {
          // If 409, it might already exist, which is fine
          if (err.response?.status === 409) {
            setIsMerchantCreated(true);
          } else {
            console.error("[Onboarding] Failed to create merchant", err);
          }
        }
      }
    };
    initMerchant();
  }, [user, accessToken, tempData, isMerchantCreated]);

  const handleNext = () => setStep(currentStep + 1);
  const handleBack = () => setStep(currentStep - 1);

  const steps = [
    { title: "Bienvenue", component: <WelcomeStep onNext={handleNext} /> },
    { title: "Abonnement", component: <SubscriptionStep onNext={handleNext} onBack={handleBack} /> },
    { title: "IA Vision", component: <VisionStep onNext={handleNext} /> },
    { title: "Connexion", component: <WhatsAppStep onNext={() => {
      clearOnboarding();
      navigate("/dashboard");
    }} /> },
  ];

  // Jump to Subscription step if coming from Simulator (avoiding double welcome)
  useEffect(() => {
    if (tempData && currentStep === 0) {
      setStep(1);
    }
  }, [tempData, setStep]);

  return (
    <div className="min-h-screen bg-vendeur-coal flex flex-col items-center justify-center p-4 md:p-8">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-12 flex items-center justify-between px-4">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
              i <= currentStep ? "bg-vendeur-emerald text-vendeur-coal" : "bg-white/5 text-white/20 border border-white/10"
            }`}>
              {i < currentStep ? <Check size={16} /> : i + 1}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              i <= currentStep ? "text-vendeur-emerald" : "text-white/20"
            }`}>{s.title}</span>
          </div>
        ))}
        {/* Connection lines */}
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-xl h-[1px] bg-white/5 -z-10" />
      </div>

      <div className="w-full max-w-4xl relative">
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

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { tempData } = useOnboardingStore();
  const { user } = useAuthStore();

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 mb-8">
        <Rocket className="text-vendeur-emerald" size={40} />
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
        Bonjour {user?.displayName?.split(" ")[0]} ! 👋
      </h1>
      <p className="text-xl text-white/50 mb-12 max-w-xl mx-auto">
        Nous avons préparé les fondations pour <span className="text-white font-bold">{tempData?.businessName || "votre boutique"}</span>.
        Prêt à activer votre puissance de vente ?
      </p>

      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12 text-left">
        <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
          <Store className="text-vendeur-emerald mb-4" size={24} />
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Commerce</h3>
          <p className="text-lg text-white/70">{tempData?.businessName}</p>
        </div>
        <div className="p-6 rounded-2xl bg-black/40 border border-white/5">
          <Smartphone className="text-vendeur-emerald mb-4" size={24} />
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">WhatsApp</h3>
          <p className="text-lg text-white/70">{tempData?.whatsappNumber}</p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="h-16 px-12 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-vendeur-emerald/20 flex items-center gap-3 mx-auto"
      >
        C'est parti <ChevronRight size={20} />
      </button>
    </div>
  );
}

function SubscriptionStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Choisissez votre puissance</h2>
        <p className="text-white/40 mt-2">Activez les fonctionnalités réelles de votre agent IA.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:border-white/20 transition-all flex flex-col">
          <div className="mb-6">
            <h3 className="text-xl font-black text-white uppercase">Explorer</h3>
            <p className="text-vendeur-emerald font-black text-2xl mt-1">Gratuit</p>
          </div>
          <ul className="space-y-4 mb-12 flex-1">
            <li className="flex items-center gap-3 text-white/60 text-sm">
              <Check className="text-vendeur-emerald shrink-0" size={18} />
              50 conversations / mois
            </li>
            <li className="flex items-center gap-3 text-white/60 text-sm">
              <Check className="text-vendeur-emerald shrink-0" size={18} />
              Catalogue IA (3 produits)
            </li>
            <li className="flex items-center gap-3 text-white/60 text-sm opacity-40">
              <Zap className="shrink-0" size={18} />
              Mode Agent Standard
            </li>
          </ul>
          <button
            onClick={onNext}
            className="w-full h-14 rounded-xl border border-white/10 text-white/60 font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
          >
            Explorer d'abord
          </button>
        </div>

        {/* Premium Plan */}
        <div className="group relative bg-vendeur-emerald/5 border-2 border-vendeur-emerald/30 rounded-[2.5rem] p-8 shadow-2xl shadow-vendeur-emerald/5 flex flex-col">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-vendeur-emerald text-vendeur-coal px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            Recommandé
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-black text-white uppercase">Vendeur Pro</h3>
            <p className="text-vendeur-emerald font-black text-2xl mt-1">5 000 FCFA <span className="text-[10px] text-white/40 font-normal">/ mois</span></p>
          </div>
          <ul className="space-y-4 mb-12 flex-1">
            <li className="flex items-center gap-3 text-white/90 text-sm">
              <Sparkles className="text-vendeur-emerald shrink-0" size={18} />
              Conversations Illimitées
            </li>
            <li className="flex items-center gap-3 text-white/90 text-sm">
              <Check className="text-vendeur-emerald shrink-0" size={18} />
              IA Vision Illimitée
            </li>
            <li className="flex items-center gap-3 text-white/90 text-sm">
              <Check className="text-vendeur-emerald shrink-0" size={18} />
              Vocal IA & Local Slang
            </li>
            <li className="flex items-center gap-3 text-white/90 text-sm">
              <ShieldCheck className="text-vendeur-emerald shrink-0" size={18} />
              Support Prioritaire
            </li>
          </ul>
          <button
            onClick={() => {
              toast.info("Redirection vers le paiement...");
              onNext();
            }}
            className="w-full h-14 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-xl shadow-vendeur-emerald/20"
          >
            Activer Premium
          </button>
        </div>
      </div>

      <button onClick={onBack} className="block mx-auto text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
        Retour aux informations
      </button>
    </div>
  );
}

function VisionStep({ onNext }: { onNext: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { accessToken } = useAuthStore();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", selected);

      const res = await apiClient.post("/api/commerce/products/vision", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResult(res.data);
      toast.success("Produit analysé par l'IA ! ✨");
    } catch (err) {
      toast.error("Échec de l'analyse IA");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12">
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

        <div className="w-full max-w-md">
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
                  {file && <img src={URL.createObjectURL(file)} className="h-full w-full object-cover opacity-50" />}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="text-vendeur-emerald" size={48} />
                  </div>
               </div>
               <div className="p-8 space-y-4">
                  <div>
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Nom suggéré</h3>
                    <p className="text-xl font-bold text-white">{result.name}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-1">Prix suggéré</h3>
                      <p className="text-2xl font-black text-vendeur-emerald">{result.price} FCFA</p>
                    </div>
                    <button onClick={onNext} className="h-12 px-6 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs">
                      Confirmer
                    </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {!result && !analyzing && (
        <button onClick={onNext} className="mt-12 block mx-auto text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
          Passer cette étape
        </button>
      )}
    </div>
  );
}

function WhatsAppStep({ onNext }: { onNext: () => void }) {
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
