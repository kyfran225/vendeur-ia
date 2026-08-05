import React, { useMemo, useState, useEffect, useRef, memo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Hand,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Plus,
  Save,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wand2,
  WifiOff,
  Zap,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Camera,
  AlertCircle,
  Trash2,
  X,
  Pencil,
  Rocket,
  ChevronDown,
  LogIn,
  User,
  Megaphone
} from "lucide-react";
import { toast } from "sonner";
import {
  CountrySelector,
  COUNTRIES
} from "./components/CountrySelector";
import { AddressAutocomplete } from "./components/AddressAutocomplete";
import { PaymentMethodSelector } from "./components/PaymentMethodSelector";
import { AuthSheet } from "../auth/components/AuthSheet";
import { useAuthStore } from "@/stores/authStore";
import { AudioRecorder } from "@/lib/audioUtils";
import { apiClient } from "@/lib/apiClient";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Constants from original CommerceApp.tsx
const MAX_DEMO_REPLIES = 7;
const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

// Helper components copied from original
function WhatsAppBubble({ role, text, time }: { role: string; text: string; time: string }) {
  const isAi = role === "ai";
  return (
    <div className={isAi ? "flex justify-start mb-3" : "flex justify-end mb-3"}>
      <div className={cn(
        "p-2.5 px-3 rounded-xl shadow-sm relative text-[14px] leading-[1.4]",
        isAi
          ? "bg-[#202c33] text-white rounded-tl-none max-w-[90%] border border-white/5"
          : "bg-[#005c4b] text-white rounded-tr-none max-w-[90%]"
      )}>
        <p className="whitespace-pre-wrap">{text}</p>
        <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
           <span className="text-[10px]">{time}</span>
           {role !== "ai" && (
             <div className="flex -space-x-1">
               <Check size={12} className="text-[#53bdeb]" />
               <Check size={12} className="text-[#53bdeb]" />
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

const MemoizedWhatsAppBubble = memo(WhatsAppBubble);

function PillarSection() {
  const pillars = [
    {
      icon: <Bot className="text-emerald-400" />,
      title: "Cerveau IA Vendeur",
      desc: "L'IA analyse vos photos, gère vos stocks et répond à vos clients par texte ou notes vocales 24h/7 sur WhatsApp et Instagram."
    },
    {
      icon: <Megaphone className="text-sky-400" />,
      title: "Hub Marketing",
      desc: "Diffusez vos promos vers vos segments VIP. Tracking en temps réel et protection anti-spam intelligente pour votre compte WhatsApp."
    },
    {
      icon: <ShieldCheck className="text-amber-400" />,
      title: "Conversion & Paiement",
      desc: "Validez vos commandes en un clic. L'IA sécurise vos encaissements Wave, Orange et MTN sans aucune erreur de numéro."
    }
  ];

  return (
    <section className="py-24 bg-black/40 border-y border-white/5 text-left">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-3 gap-12">
        {pillars.map((p, i) => (
          <div key={i} className="group p-10 rounded-[2.5rem] border border-white/5 bg-[#0c0f0d] hover:border-emerald-300/30 transition-all hover:shadow-2xl hover:shadow-emerald-500/5">
            <div className="mb-8 h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              {p.icon}
            </div>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{p.title}</h3>
            <p className="text-white/50 leading-relaxed text-base">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

import { useOnboardingStore } from "@/stores/onboardingStore";

// THE MAIN LANDING HERO (1:1 UI REPLICA)
function LandingHero({
  onAuth,
  onFormUpdate
}: {
  onAuth: () => void;
  onFormUpdate: (name: string) => void;
}) {
  const { tempData, setTempData, isSimulatorActive, setSimulatorActive } = useOnboardingStore();
  const [step, setStep] = useState<"form" | "simulator">(isSimulatorActive ? "simulator" : "form");
  const [form, setForm] = useState(tempData || {
    businessName: "",
    category: "fashion",
    description: "",
    country: "CI",
    city: "Abidjan",
    address: "",
    whatsappNumber: ""
  });
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === (tempData?.country || "CI")) || COUNTRIES[0]
  );
  const [localPhone, setLocalPhone] = useState(tempData?.whatsappNumber?.replace(selectedCountry.dialCode, "") || "");
  const { user, accessToken } = useAuthStore();

  const recorderRef = useRef<AudioRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localPhone && selectedCountry) {
      setForm(prev => ({ ...prev, whatsappNumber: `${selectedCountry.dialCode}${localPhone}` }));
    }
  }, [localPhone, selectedCountry]);

  const [testMessage, setMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [aiResponseCount, setAiResponseCount] = useState(0);

  type ChatMessage = { role: "customer" | "ai"; text: string; time: string };
  const [history, setHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isReplying]);

  const getTime = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const handleCreateVendeur = async () => {
    if (form.businessName && form.address && form.whatsappNumber) {
      // 1. Save to local store
      setTempData({ ...form, city: form.city || "Abidjan" });
      setSimulatorActive(true);

      // 2. Persist to Backend if authenticated
      if (accessToken) {
        try {
          await apiClient.post("/api/commerce/merchant", {
            businessName: form.businessName,
            category: form.category,
            description: form.description,
            address: form.address,
            whatsappNumber: form.whatsappNumber,
            city: form.city || "Abidjan",
            country: form.country
          });
          toast.success("Boutique configurée avec succès !");
        } catch (error) {
          console.error("Merchant Creation Error:", error);
          // Non-blocking for demo, but logged
        }
      }

      onFormUpdate(form.businessName);
      setStep("simulator");

      setIsReplying(true);

      try {
        const response = await axios.post(`${API_URL}/api/commerce/demo/process`, {
          businessName: form.businessName,
          city: form.city || "Abidjan",
          address: form.address,
          category: form.category,
          description: form.description,
          message: "SYSTEM_INITIAL_GREETING",
          phone: form.whatsappNumber,
          history: []
        });

        const replyText = typeof response.data.reply === 'object' ? response.data.reply.text : response.data.reply;
        setHistory([{
          role: "ai",
          text: replyText,
          time: getTime()
        }]);
      } catch (error) {
        setHistory([{
          role: "ai",
          text: `Bonjour ! ✨ Bienvenue chez ${form.businessName}. Nous sommes à votre écoute pour vos besoins en ${form.category}.`,
          time: getTime()
        }]);
      } finally {
        setIsReplying(false);
      }
    } else {
      toast.error("Veuillez remplir tous les champs obligatoires.");
    }
  };

  const handleActivate = () => {
    setSimulatorActive(true); // Ensure it's active for onboarding store
    if (user) {
      // If already logged in, go straight to onboarding
      window.location.href = "/onboarding";
    } else {
      onAuth();
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      const audioBlob = await recorderRef.current?.stop();
      setIsRecording(false);
      if (!audioBlob) return;

      setIsReplying(true);
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "demo.webm");
        const res = await axios.post(`${API_URL}/api/commerce/demo/transcribe`, formData);

        if (res.data.transcription) {
          setMessage(res.data.transcription);
          // Auto-send if transcription is good
          setTimeout(() => handleSend(res.data.transcription), 500);
        }
      } catch (err) {
        toast.error("Échec de la transcription vocale.");
      } finally {
        setIsReplying(false);
      }
    } else {
      try {
        if (!recorderRef.current) recorderRef.current = new AudioRecorder();
        await recorderRef.current.start();
        setIsRecording(true);
        toast.info("Enregistrement en cours...");
      } catch (err) {
        toast.error("Microphone non accessible.");
      }
    }
  };

  const handleSend = async (manualMessage?: string) => {
    const textToSend = manualMessage || testMessage;
    if (!textToSend.trim()) return;

    if (aiResponseCount >= MAX_DEMO_REPLIES) {
      toast.error("Limite de démonstration atteinte. Activez votre machine pour continuer !");
      return;
    }

    const userTime = getTime();
    const newMsg: ChatMessage = { role: "customer", text: textToSend, time: userTime };
    setHistory(prev => [...prev, newMsg]);
    const currentInput = textToSend;
    setMessage("");
    setIsReplying(true);

    try {
      const response = await axios.post(`${API_URL}/api/commerce/demo/process`, {
        businessName: form.businessName,
        city: form.city || "Abidjan",
        address: form.address,
        category: form.category,
        description: form.description,
        message: currentInput,
        phone: form.whatsappNumber || "22501010101",
        history: history.slice(-4)
      });

      const replyText = typeof response.data.reply === 'object' ? response.data.reply.text : response.data.reply;
      setHistory(prev => [...prev, {
        role: "ai",
        text: replyText,
        time: getTime()
      }]);
      setAiResponseCount(prev => prev + 1);
    } catch (error) {
      toast.error("Erreur de connexion avec l'IA.");
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <section className="w-full px-0 py-2 md:py-4 lg:py-6 flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16 text-left max-w-6xl mx-auto">
      <div className="animate-in fade-in slide-in-from-left-4 duration-700 w-full lg:max-w-lg lg:pt-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-300">
          <Sparkles size={12} />
          vendeurIa™
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-[1.05] text-white mb-6 tracking-tighter">
          Votre WhatsApp <br/>
          <span className="text-emerald-300 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">vend tout seul.</span>
        </h1>
        <p className="text-lg text-white/60 mb-8 max-w-xl leading-relaxed font-medium">
          L'Employé Numérique du Commerce Social. Transformez votre WhatsApp en machine de vente. Propulsez votre croissance grâce à une performance IA disponible 24h/7.
        </p>
      </div>

      <div className="relative w-full lg:w-auto px-2 flex justify-center">
        <div className="absolute -inset-4 bg-emerald-300/5 blur-[100px] rounded-full pointer-events-none" />

        {step === "form" ? (
          <div className="relative rounded-[2.5rem] border border-white/10 bg-[#0c0f0d] p-4 md:p-6 lg:p-7 animate-in fade-in zoom-in-95 duration-300 text-left w-full lg:min-w-[550px] max-w-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-300/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="mb-6 flex items-center gap-4 relative z-10">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 text-[#06130d] shadow-lg shadow-emerald-500/20">
                <Store size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-tight">Prêt à vendre ?</h2>
                <p className="text-[10px] text-white/50">Lancez votre machine de vente en 2 minutes.</p>
              </div>
            </div>

            <div className="grid gap-4 relative z-10">
              <label className="grid gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Nom de votre commerce</span>
                <input className="h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-emerald-300 transition-all placeholder:text-white/10 text-sm" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Aicha Mode, Koffi Restaurant..." />
              </label>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex-1 min-w-0 grid gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Catégorie</span>
                  <div className="relative">
                    <select className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-emerald-300 transition-all appearance-none cursor-pointer text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
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
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-white/30 pointer-events-none" />
                  </div>
                </label>
                <label className="flex-1 min-w-0 grid gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">WhatsApp Business</span>
                  <div className="flex gap-2 items-center w-full">
                    <CountrySelector
                      selected={selectedCountry}
                      onSelect={(c) => {
                        setSelectedCountry(c);
                        setForm({ ...form, country: c.code });
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <input
                        className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-emerald-300 transition-all placeholder:text-white/10 text-sm"
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="07 00 00 00 00"
                        type="tel"
                      />
                    </div>
                  </div>
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Adresse précise (La ville sera détectée)</span>
                <AddressAutocomplete
                  value={form.address}
                  onChange={(value) => setForm({ ...form, address: value })}
                  onSelectSuggestion={(suggestion) => {
                    const city = suggestion.context?.place?.name || suggestion.context?.region?.name || suggestion.place_formatted?.split(',')[1]?.trim() || "Abidjan";
                    setForm(prev => ({ ...prev, city }));
                  }}
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Ce que vous vendez / Instructions de livraison</span>
                <textarea
                  className="min-h-[100px] rounded-xl border border-white/10 bg-black/40 p-4 text-white outline-none focus:border-emerald-300 transition-all resize-none placeholder:text-white/10 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Robes, chaussures. Livraison partout sous 2h."
                />
              </label>

              <div className="flex items-center gap-2 px-1">
                <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-medium text-white/40 italic">
                  Ces données pourront être modifiées par la suite dans vos paramètres.
                </p>
              </div>

              <button
                onClick={handleCreateVendeur}
                disabled={!form.businessName || !form.address}
                className="mt-2 flex h-12 items-center justify-center gap-3 rounded-2xl bg-emerald-300 px-6 text-sm font-black uppercase tracking-widest text-[#06130d] shadow-xl shadow-emerald-500/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30"
              >
                {user ? "Lancer ma configuration" : "Créer mon vendeurIa"} <ChevronRight size={18} />
              </button>

              {user && (
                <button
                  onClick={() => window.location.href = "/dashboard"}
                  className="mt-1 flex h-12 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/10"
                >
                  <LayoutDashboard size={18} /> Mon Tableau de bord
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative rounded-[3rem] border border-[#2a2f32] bg-[#0b141a] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-400 flex flex-col h-[750px] w-full max-w-[400px] mx-auto scale-[1.02] ring-8 ring-black/20">
            {/* WhatsApp Header */}
            <div className="bg-[#202c33] px-4 py-3.5 flex items-center justify-between border-b border-white/5 z-20">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[#6a7175] flex items-center justify-center text-white/80 overflow-hidden border border-white/10 shadow-inner">
                   <Bot size={26} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white leading-tight">{form.businessName}</p>
                  <p className={cn(
                    "text-[11px] font-medium transition-all duration-300",
                    isReplying ? "text-white/50 italic animate-pulse" : "text-emerald-400"
                  )}>
                    {isReplying ? "en train d'écrire..." : "en ligne"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-[#aebac1]">
                <Camera size={20} className="hover:text-white transition-colors cursor-pointer" />
                <MoreVertical size={20} className="hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0b141a] bg-repeat opacity-95 no-scrollbar scroll-smooth"
              style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5qee.png')", backgroundSize: "400px" }}
            >
              <div className="flex justify-center mb-6">
                <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1.5 rounded-lg uppercase font-bold tracking-widest shadow-sm">Aujourd'hui</span>
              </div>

              {history.map((msg, i) => (
                <MemoizedWhatsAppBubble key={i} role={msg.role} text={msg.text} time={msg.time} />
              ))}

              {aiResponseCount >= 4 && aiResponseCount < MAX_DEMO_REPLIES && (
                <div className="flex justify-center my-4 animate-bounce">
                   <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest shadow-lg">
                     Attention : Plus que {MAX_DEMO_REPLIES - aiResponseCount} réponse{MAX_DEMO_REPLIES - aiResponseCount > 1 ? 's' : ''} gratuite{MAX_DEMO_REPLIES - aiResponseCount > 1 ? 's' : ''} ⏳
                   </div>
                </div>
              )}

              {aiResponseCount >= MAX_DEMO_REPLIES && (
                <div className="flex justify-center my-6">
                   <div className="bg-[#111b21] border-2 border-emerald-300 border-dashed p-6 rounded-[2rem] text-center max-w-[90%] shadow-2xl animate-in zoom-in-95">
                      <Sparkles className="mx-auto mb-4 text-emerald-300" size={32} />
                      <p className="text-lg font-black text-white uppercase tracking-tight">Potentiel Débloqué ! 🚀</p>
                      <p className="text-xs text-white/60 mt-2 leading-relaxed">
                        Vous avez vu un aperçu de la puissance de votre <b>Vendeur IA</b>.
                        Ne laissez plus vos clients attendre. Activez votre machine réelle maintenant !
                      </p>
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-[#202c33] p-3 flex items-center gap-2 z-20">
               <div className="flex items-center gap-3 text-[#aebac1] px-2">
                 <Smile size={24} className="cursor-pointer hover:text-white transition-colors" />
                 <Paperclip size={24} className="cursor-pointer hover:text-white transition-colors" />
               </div>
               <div className="flex-1 relative">
                 <input
                    value={testMessage}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={aiResponseCount >= MAX_DEMO_REPLIES || isReplying}
                    placeholder={aiResponseCount >= MAX_DEMO_REPLIES ? "Limite atteinte" : "Message"}
                    className="w-full bg-[#2a3942] text-white text-[15px] rounded-xl px-4 py-3 outline-none placeholder:text-[#8696a0] shadow-inner disabled:opacity-50"
                 />
               </div>
               <div
                 className={cn(
                   "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer",
                   testMessage ? "bg-[#00a884] scale-110" : isRecording ? "bg-red-500 animate-pulse" : "bg-[#00a884]/80",
                   (aiResponseCount >= MAX_DEMO_REPLIES || isReplying) && !isRecording && "opacity-30 cursor-not-allowed"
                 )}
                 onClick={() => testMessage ? handleSend() : handleMicClick()}
               >
                 {testMessage ? <Send size={20} /> : <Mic size={20} />}
               </div>
            </div>

            {/* ACTIVATION OVERLAY */}
            <div className="p-8 bg-[#111b21] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.6)] z-30 text-left relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />

               <button
                  onClick={handleActivate}
                  className="w-full flex h-16 items-center justify-between px-8 rounded-[2rem] bg-gradient-to-r from-[#00a884] to-[#00c9a0] text-sm font-black uppercase tracking-[0.15em] text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,168,132,0.4)] active:scale-95 shadow-2xl relative overflow-hidden group/btn"
                >
                  <Sparkles className="animate-pulse shrink-0" size={18} />
                  <span className="flex-1 text-center px-4">Activer ma machine</span>
                  <ChevronRight size={22} className="group-hover/btn:translate-x-1 transition-transform shrink-0" />
                </button>

                <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4 px-2">
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                     <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] italic">REAL AI ENGINE DEMO</span>
                  </div>
                  <div className="flex gap-4 order-2 sm:order-1">
                    <button onClick={() => {
                      setStep("form");
                      setSimulatorActive(false);
                    }} className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <ChevronLeft size={14} /> Modifier
                    </button>
                    <button onClick={() => window.location.href = "/dashboard"} className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      Dashboard <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function LandingPage() {
  const [dynamicTitle, setDynamicTitle] = useState("Vendeur IA");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#07100d] selection:bg-emerald-300/30 overflow-x-hidden text-left pt-14 md:pt-20 w-full">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#07100d]/80 backdrop-blur-md w-full h-14 md:h-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-full gap-4">
          <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
            <div className="flex h-9 w-9 md:h-12 md:w-12 shrink-0 items-center justify-center overflow-hidden bg-white/5 rounded-xl md:rounded-2xl p-1.5 border border-white/10 shadow-xl">
              <img src="/apple-touch-icon.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base md:text-xl font-black text-white uppercase leading-tight tracking-tight">{dynamicTitle}</p>
              <p className="truncate text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-emerald-300/60 font-black">AI Sales Machine</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6 shrink-0">
            {user ? (
              <div className="flex items-center gap-3 md:gap-5">
                <span className="hidden lg:inline text-xs font-black uppercase tracking-widest text-white/40">Salut, <span className="text-white">{user.displayName}</span></span>
                <div className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 overflow-hidden shadow-lg">
                   {user.avatarUrl ? (
                     <img src={user.avatarUrl} className="h-full w-full object-cover" />
                   ) : (
                     <User size={20} />
                   )}
                </div>
                <button
                  onClick={logout}
                  className="h-9 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border border-white/10 text-white/40 text-[10px] font-black uppercase hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 transition-all hidden md:block tracking-widest"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-emerald-300/20 md:border-white/10 flex items-center justify-center text-emerald-300 md:text-white/60 hover:bg-white/10 hover:border-emerald-300/30 hover:text-emerald-300 transition-all shadow-lg group relative overflow-hidden"
              >
                <User size={20} className="group-hover:scale-110 transition-transform" />

                {/* Subtle Glow Effect - Visible by default on mobile, hover only on desktop */}
                <div className="absolute inset-0 bg-emerald-300/5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-2">
        <LandingHero
          onAuth={() => setIsAuthOpen(true)}
          onFormUpdate={(name) => setDynamicTitle(name)}
        />
        <PillarSection />
        <footer className="py-16 text-center border-t border-white/5 opacity-40">
           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Sécurisé par vendeurIa Passport SSO</p>
        </footer>
      </main>

      <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
