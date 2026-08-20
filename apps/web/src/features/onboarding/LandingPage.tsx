import React, { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Store,
  Zap,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Camera,
  Send,
  ExternalLink,
  ArrowRight,
  Globe,
  Play,
  CheckCircle2,
  MousePointer2,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import {
  CountrySelector,
  COUNTRIES,
  parsePhoneNumber
} from "./components/CountrySelector";
import { CategorySelector } from "./components/CategorySelector";
import { AddressAutocomplete } from "./components/AddressAutocomplete";
import { AuthSheet } from "../auth/components/AuthSheet";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useAuthStore } from "@/stores/authStore";
import { AudioRecorder } from "@/lib/audioUtils";
import { apiClient } from "@/lib/apiClient";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { Logo } from "@/components/ui/Logo";
import { Link, useNavigate } from "react-router-dom";
import { WhatsAppTypingIndicator } from "@/components/ui/WhatsAppTypingIndicator";
import { MetaHead } from "@/components/seo/MetaHead";
import { stripActionTags } from "@/lib/utils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_DEMO_REPLIES = 7;
const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

// --- COMPONENTS ---

const FadeIn = ({ children, delay = 0, direction = "up", className = "" }: { children: React.ReactNode; delay?: number; direction?: "up" | "down" | "left" | "right"; className?: string }) => {
  const directions = {
    up: { y: 20, x: 0 },
    down: { y: -20, x: 0 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

function WhatsAppBubble({ role, text, time }: { role: string; text: string; time: string }) {
  const isAi = role === "ai";
  return (
    <div className={isAi ? "flex justify-start mb-3" : "flex justify-end mb-3"}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "p-2.5 px-3 rounded-xl shadow-sm relative text-[14px] leading-[1.4] max-w-[85%]",
          isAi
            ? "bg-[#202c33] text-white rounded-tl-none border border-white/5"
            : "bg-[#005c4b] text-white rounded-tr-none"
        )}
      >
        <p className="whitespace-pre-wrap">{stripActionTags(text)}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
           <span className="text-[10px] opacity-50">{time}</span>
           {role !== "ai" && (
             <div className="flex items-center text-[#53bdeb]">
               <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="scale-[0.85] origin-right">
                  <path d="M4.156 6.188L1.5 3.531.5 4.531l3.656 3.656 7.844-7.844-1-1-6.844 6.844z" fill="currentColor"/>
                  <path d="M15.5.344l-1-1-6.844 6.844L6.5 5.031l-1 1 2.156 2.156 7.844-7.843z" fill="currentColor"/>
               </svg>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}

const MemoizedWhatsAppBubble = memo(WhatsAppBubble);

function BentoFeatures() {
  const features = [
    {
      title: "IA Vision™ Intelligente",
      desc: "Prenez une photo, Vendeur IA identifie le produit, fixe un prix et génère une fiche de vente irrésistible en 3 secondes.",
      icon: <Bot className="text-emerald-400" size={24} />,
      size: "large",
      color: "bg-emerald-500/10 border-emerald-500/20",
      image: "/assets/landing/vision-demo.png" // Placeholder for visual
    },
    {
      title: "Paiements & Abonnements",
      desc: "Activez votre Vendeur IA instantanément via Mobile Money, Wave ou Google Play pour une gestion sans friction.",
      icon: <ShieldCheck className="text-sky-400" size={24} />,
      size: "small",
      color: "bg-sky-500/10 border-sky-500/20",
      isPayment: true
    },
    {
      title: "Notes Vocales IA",
      desc: "Vendeur IA peut communiquer par notes vocales ultra-réalistes pour créer un lien de confiance unique avec vos clients.",
      icon: <Mic className="text-purple-400" size={24} />,
      size: "small",
      color: "bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Marketing Prédictif",
      desc: "Relances automatiques des clients qui n'ont pas finalisé leur achat au moment parfait, sans spammer.",
      icon: <Megaphone className="text-amber-400" size={24} />,
      size: "medium",
      color: "bg-amber-500/10 border-amber-500/20"
    }
  ];

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto">
      <FadeIn delay={0.1}>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
            Une Armée de Vente <br className="hidden sm:block" />
            <span className="text-emerald-400">dans votre poche.</span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto font-medium">
            Oubliez les bots basiques. Vendeur IA est un écosystème complet conçu pour la conversion immédiate.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className={cn(
              "relative overflow-hidden rounded-[2.5rem] border p-8 flex flex-col justify-between transition-all group",
              f.color,
              f.size === "large" ? "md:col-span-2 md:row-span-2" : "",
              f.size === "medium" ? "md:col-span-2" : ""
            )}
          >
            <div className="relative z-10">
              <div className="mb-6 h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-xl">
                {f.icon}
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase">{f.title}</h3>
              <p className="text-white/50 leading-relaxed text-sm font-medium max-w-md">{f.desc}</p>

              {f.isPayment && (
                <div className="flex flex-wrap items-center gap-2.5 mt-5">
                  {/* Wave */}
                  <img
                    src="https://www.wave.com/img/favicon.png"
                    alt="Wave"
                    className="h-6 w-6 rounded-md shadow-lg group-hover:scale-105 transition-transform object-contain"
                  />
                  {/* Orange */}
                  <div className="h-6 w-6 rounded-md bg-[#FF7900] overflow-hidden shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg"
                      alt="Orange"
                      className="h-full w-full object-contain p-0.5"
                    />
                  </div>
                  {/* MTN */}
                  <div className="h-6 px-1.5 rounded-md bg-[#FFCC00] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 512 256" className="h-3.5 w-auto" fill="black" xmlns="http://www.w3.org/2000/svg">
                      <path d="M256 40c-110.5 0-200 38.5-200 86s89.5 86 200 86 200-38.5 200-86-89.5-86-200-86zm0 162c-104.9 0-190-34-190-76s85.1-76 190-76 190 34 190 76-85.1 76-190 76z" />
                      <path d="M125 85h25 l15 40 15-40 h25 v85 h-20 v-55 l-20 55 h-10 l-20-55 v55 h-20 V85z M225 85 h60 v20 h-20 v65 h-20 v-65 h-20 V85z M310 85 h20 l25 50 v-50 h20 v85 h-20 l-25-50 v50 h-20 V85z" />
                    </svg>
                  </div>
                  {/* Google Play */}
                  <div className="h-[26px] w-[90px] rounded-md bg-black border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden px-1">
                    <img
                      src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                      alt="Google Play"
                      className="h-[42px] w-auto object-contain max-w-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Decorative background glow */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// THE MAIN LANDING HERO
function LandingHero({
  onAuth,
  onFormUpdate,
  onLaunchDemo
}: {
  onAuth: () => void;
  onFormUpdate: (name: string) => void;
  onLaunchDemo: () => void;
}) {
  const navigate = useNavigate();
  const { tempData, setTempData, isSimulatorActive, setSimulatorActive } = useOnboardingStore();
  const [step, setStep] = useState<"form" | "simulator">(isSimulatorActive ? "simulator" : "form");
  const rawSavedPhone = tempData?.whatsappNumber || "";
  const initialParsed = parsePhoneNumber(rawSavedPhone, tempData?.country);
  const [selectedCountry, setSelectedCountry] = useState(
    (tempData?.country ? COUNTRIES.find(c => c.code === tempData.country) : null) || initialParsed.country
  );
  const [localPhone, setLocalPhone] = useState(initialParsed.local);
  const [form, setForm] = useState(tempData || {
    businessName: "",
    category: "fashion",
    description: "",
    country: initialParsed.country.code,
    city: "",
    address: "",
    whatsappNumber: rawSavedPhone
  });
  const { user } = useAuthStore();

  const recorderRef = useRef<AudioRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCountry) {
      setForm(prev => ({
        ...prev,
        country: selectedCountry.code,
        whatsappNumber: localPhone ? `${selectedCountry.dialCode}${localPhone}` : ""
      }));
    }
  }, [localPhone, selectedCountry]);

  const [testMessage, setMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [aiResponseCount, setAiResponseCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("vendeur_demo_replies_count");
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vendeur_demo_replies_count", aiResponseCount.toString());
    } catch (e) {
      console.warn("Could not persist demo replies count to localStorage", e);
    }
  }, [aiResponseCount]);

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
      setTempData({ ...form, city: form.city, country: selectedCountry.code, currency: selectedCountry.currency });
      setSimulatorActive(true);
      onFormUpdate(form.businessName);
      setStep("simulator");
      setIsReplying(true);

      try {
        const response = await axios.post(`${API_URL}/api/commerce/demo/process`, {
          ...form,
          city: form.city || selectedCountry.defaultCity,
          country: selectedCountry.code,
          currency: selectedCountry.currency,
          message: "SYSTEM_INITIAL_GREETING",
          phone: form.whatsappNumber,
          history: []
        });

        const replyText = typeof response.data.reply === 'object' ? response.data.reply.text : response.data.reply;
        setHistory([{ role: "ai", text: replyText, time: getTime() }]);
      } catch (error) {
        setHistory([{
          role: "ai",
          text: `Bonjour ! Bienvenue chez ${form.businessName}. Je suis votre assistant Vendeur IA prêt à vous servir.`,
          time: getTime()
        }]);
      } finally {
        setIsReplying(false);
      }
    } else {
      toast.error("Veuillez remplir les champs obligatoires.");
    }
  };

  const handleActivate = () => {
    setSimulatorActive(true);
    if (!user) {
      onAuth();
    } else {
      navigate("/onboarding");
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
          handleSend(res.data.transcription);
        }
      } catch (err) {
        toast.error("Échec de la transcription.");
      } finally {
        setIsReplying(false);
      }
    } else {
      try {
        if (!recorderRef.current) recorderRef.current = new AudioRecorder();
        await recorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        toast.error("Microphone non accessible.");
      }
    }
  };

  const handleSend = async (manualMessage?: string) => {
    const textToSend = manualMessage || testMessage;
    if (!textToSend.trim()) return;

    if (aiResponseCount >= MAX_DEMO_REPLIES) {
      toast.error("Limite atteinte ! Activez votre Vendeur IA réel.");
      return;
    }

    setHistory(prev => [...prev, { role: "customer", text: textToSend, time: getTime() }]);
    setMessage("");
    setIsReplying(true);

    try {
      const response = await axios.post(`${API_URL}/api/commerce/demo/process`, {
        ...form,
        city: form.city || selectedCountry.defaultCity,
        country: selectedCountry.code,
        currency: selectedCountry.currency,
        message: textToSend,
        phone: form.whatsappNumber || `${selectedCountry.dialCode.replace('+', '')}01010101`,
        history: history.slice(-4)
      });

      const replyText = typeof response.data.reply === 'object' ? response.data.reply.text : response.data.reply;
      setHistory(prev => [...prev, { role: "ai", text: replyText, time: getTime() }]);
      setAiResponseCount(prev => prev + 1);
    } catch (error) {
      toast.error("Vendeur IA est momentanément indisponible.");
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <section className="w-full px-4 pt-4 md:pt-6 lg:pt-8 pb-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 xl:gap-16 max-w-6xl mx-auto lg:min-h-[calc(100vh-96px)]">
      {/* Left Text Side */}
      <div className="w-full lg:max-w-lg xl:max-w-xl text-center lg:text-left space-y-6">
        <FadeIn delay={0.2} direction="down">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-400">
            <Rocket size={14} />
            <span>Le Futur du Commerce Social</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] text-white tracking-tighter uppercase">
            WhatsApp <br/>
            <span className="text-emerald-400">Vend tout seul.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="text-base md:text-lg text-white/50 leading-relaxed font-medium max-w-lg mx-auto lg:mx-0">
            Transformez votre WhatsApp en une machine de vente autonome. Propulsé par Vendeur IA qui comprend vos produits, gère vos clients et sécurise vos paiements 24h/7.
          </p>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button
              onClick={onLaunchDemo}
              className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              Lancer Vendeur IA <Play size={16} fill="currentColor" />
            </button>
            <button
              onClick={onAuth}
              className="w-full sm:w-auto h-14 px-10 rounded-2xl border border-white/10 bg-white/5 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer"
            >
              Connexion Marchand <ArrowRight size={18} />
            </button>
          </div>
        </FadeIn>

        <FadeIn delay={0.6}>
           <div className="grid grid-cols-3 gap-2 md:gap-8 pt-6 max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col sm:flex-row items-center sm:gap-3 bg-white/5 border border-white/10 px-2 py-3 sm:px-4 sm:py-2 rounded-2xl backdrop-blur-sm">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 sm:mb-0">
                  <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-xl font-black text-white leading-none">98%</p>
                  <p className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-white/30 mt-1">Satisfait</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:gap-3 bg-white/5 border border-white/10 px-2 py-3 sm:px-4 sm:py-2 rounded-2xl backdrop-blur-sm">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 sm:mb-0">
                  <Zap size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-xl font-black text-white leading-none">3s</p>
                  <p className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-white/30 mt-1">Réponse</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:gap-3 bg-white/5 border border-white/10 px-2 py-3 sm:px-4 sm:py-2 rounded-2xl backdrop-blur-sm">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 sm:mb-0">
                  <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-xl font-black text-white leading-none">24/7</p>
                  <p className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-white/30 mt-1">Actif</p>
                </div>
              </div>
           </div>
        </FadeIn>
      </div>

      {/* Right Visual Side - Smartphone Mockup */}
      <div id="demo-card" className="relative w-full lg:w-auto flex justify-center perspective-1000 overflow-visible z-10">
        {/* Decorative Glows */}
        <div className="absolute -inset-10 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />

        <FadeIn delay={0.4} direction="right" className="w-full flex justify-center">
          <div className="relative group w-full max-w-[360px] sm:max-w-[420px] md:w-[320px] lg:w-[340px]">
            {/* Phone Frame Mockup */}
            <div className="relative w-full h-[640px] sm:h-[700px] md:h-[620px] lg:h-[640px] rounded-[2.8rem] border-[7px] border-[#1a1c1e] bg-black shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden ring-4 ring-white/5 transition-all duration-500">
              {/* Camera Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1a1c1e] rounded-b-2xl z-[5] flex items-center justify-center">
                <div className="w-10 h-1 bg-white/10 rounded-full" />
              </div>

              {step === "form" ? (
                <div className="h-full w-full bg-[#0c0f0d] p-5 pt-8 pb-4 flex flex-col justify-between no-scrollbar overflow-y-auto">
                  <div className="mb-2.5 space-y-0.5 shrink-0">
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Lancez Vendeur IA.</h2>
                    <p className="text-[10px] md:text-[11px] text-white/40 font-medium">Configurez votre boutique en quelques secondes.</p>
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom du commerce</label>
                        <input
                          id="business-name-input"
                          className="w-full h-10 sm:h-11 rounded-xl bg-black/40 border border-white/10 px-3.5 text-white outline-none focus:border-emerald-400 transition-all text-sm shadow-inner"
                          value={form.businessName}
                          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                          placeholder="Ex: Ma Boutique Chic"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Catégorie</label>
                        <CategorySelector
                          value={form.category}
                          onChange={(catId) => setForm({ ...form, category: catId as any })}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Numéro WhatsApp</label>
                        <div className="flex gap-2 items-center w-full min-w-0">
                          <CountrySelector
                            selected={selectedCountry}
                            onSelect={(c) => { setSelectedCountry(c); setForm({ ...form, country: c.code }); }}
                            className="h-10 sm:h-11"
                          />
                          <input className="flex-1 min-w-0 w-full h-10 sm:h-11 rounded-xl bg-black/40 border border-white/10 px-3.5 text-white font-mono text-sm outline-none focus:border-emerald-400" value={localPhone} onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))} placeholder="0700000000" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Adresse / Ville</label>
                        <AddressAutocomplete value={form.address} onChange={(v) => setForm({ ...form, address: v })} onSelectSuggestion={(s) => {
                          const city = s.context?.place?.name || s.place_formatted?.split(',')[1]?.trim();
                          setForm(prev => ({ ...prev, city: city || "" }));
                        }} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Votre offre (produits, services...)</label>
                          <span className={cn(
                            "text-[9px] font-bold tracking-wider",
                            (form.description?.length || 0) >= 280 ? "text-amber-400 font-black" : "text-white/30"
                          )}>
                            {form.description?.length || 0}/300
                          </span>
                        </div>
                        <textarea
                          maxLength={300}
                          className="w-full h-16 sm:h-20 rounded-xl bg-black/40 border border-white/10 p-3 text-sm resize-none outline-none focus:border-emerald-400 placeholder:text-white/20 leading-relaxed shadow-inner"
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                          placeholder="Ex: Articles, prestations de service, tarifs ou livraison..."
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCreateVendeur}
                      disabled={!form.businessName || !form.address}
                      className="w-full h-11 sm:h-12 rounded-xl bg-emerald-400 text-vendeur-coal font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-30 shrink-0 cursor-pointer mt-3 mb-2"
                    >
                      Démarrer Vendeur IA <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full bg-[#0b141a] flex flex-col relative">
                  {/* WhatsApp UI Inside Frame */}
                  <div className="bg-[#202c33] px-3.5 pt-8 pb-3 flex items-center justify-between border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                         <Bot size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white leading-tight truncate">{form.businessName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-medium text-emerald-400 leading-none">en ligne</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Live Quota Badge */}
                    <div className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-full border shadow-sm shrink-0",
                      aiResponseCount >= MAX_DEMO_REPLIES
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    )}>
                      <Zap size={11} className={aiResponseCount >= MAX_DEMO_REPLIES ? "text-amber-400" : "text-emerald-400"} />
                      <span className="text-[10px] font-black tracking-wider uppercase">
                        {Math.max(0, MAX_DEMO_REPLIES - aiResponseCount)} / {MAX_DEMO_REPLIES} {MAX_DEMO_REPLIES - aiResponseCount <= 1 ? "essai" : "essais"}
                      </span>
                    </div>
                  </div>

                  <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar flex flex-col"
                    style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5qee.png')", backgroundSize: "400px" }}
                  >
                    {history.length === 0 && !isReplying && (
                      <div className="flex flex-col items-center justify-center py-6 text-center my-auto">
                        <div className="bg-[#182229]/90 border border-white/10 rounded-xl p-3 max-w-[260px] shadow-md">
                          <p className="text-[11px] text-[#8696a0] leading-snug">
                            🔒 Les messages de cette démonstration sont générés par le moteur Vendeur IA en temps réel.
                          </p>
                        </div>
                      </div>
                    )}
                    {history.map((msg, i) => (
                      <MemoizedWhatsAppBubble key={i} role={msg.role} text={msg.text} time={msg.time} />
                    ))}
                    {isReplying && <WhatsAppTypingIndicator variant="bubble" />}

                    {/* Interactive End of Demo Card */}
                    {aiResponseCount >= MAX_DEMO_REPLIES && !isReplying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="my-3 p-3.5 rounded-2xl bg-gradient-to-b from-[#182229] to-[#111b21] border border-emerald-500/30 text-white shadow-2xl space-y-2 text-center"
                      >
                        <div className="w-9 h-9 mx-auto rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Sparkles size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Démonstration terminée ({MAX_DEMO_REPLIES}/{MAX_DEMO_REPLIES})</p>
                          <p className="text-[11px] text-white/70 mt-1 leading-snug">
                            Vous avez testé le potentiel de Vendeur IA. Lancez votre boutique pour vendre 24h/7 sur votre propre WhatsApp.
                          </p>
                        </div>
                        <div className="pt-0.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          <span>Cliquez ci-dessous pour continuer</span>
                          <ArrowRight size={12} className="rotate-90 animate-bounce" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-[#202c33] p-2.5 sm:p-3 flex items-center gap-2.5 border-t border-white/5 shrink-0">
                     <div className="flex-1 relative">
                       <input
                          value={testMessage}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSend()}
                          disabled={aiResponseCount >= MAX_DEMO_REPLIES || isReplying}
                          placeholder={
                            aiResponseCount >= MAX_DEMO_REPLIES
                              ? "Limite démo atteinte (0 restant)"
                              : `Message (${Math.max(0, MAX_DEMO_REPLIES - aiResponseCount)} restant${MAX_DEMO_REPLIES - aiResponseCount > 1 ? "s" : ""})...`
                          }
                          className="w-full h-11 sm:h-12 bg-[#2a3942] text-white text-[15px] sm:text-base rounded-xl px-4 py-2.5 outline-none placeholder:text-[#8696a0] placeholder:text-[13px] sm:placeholder:text-[14px] disabled:opacity-50 shadow-inner"
                       />
                     </div>
                     <button
                       onClick={() => testMessage ? handleSend() : handleMicClick()}
                       disabled={aiResponseCount >= MAX_DEMO_REPLIES && !testMessage}
                       className={cn(
                         "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all shadow-xl shrink-0 cursor-pointer",
                         testMessage ? "bg-emerald-500 hover:bg-emerald-400 scale-105" : isRecording ? "bg-red-500 animate-pulse" : "bg-emerald-600 hover:bg-emerald-500",
                         aiResponseCount >= MAX_DEMO_REPLIES && !testMessage && "opacity-40 cursor-not-allowed"
                       )}
                     >
                       {testMessage ? <Send size={18} /> : <Mic size={18} />}
                     </button>
                  </div>

                  {/* Activation Sheet - more spacious & informative */}
                  <div className="p-4 bg-[#111b21] border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10 space-y-2.5 shrink-0">
                     <div className="flex items-center justify-between px-0.5 text-[9px] font-black uppercase tracking-wider">
                       <span className="text-white/40">Démo Interactive</span>
                       <span className={aiResponseCount >= MAX_DEMO_REPLIES ? "text-amber-400 font-black" : "text-emerald-400 font-bold"}>
                         {aiResponseCount}/{MAX_DEMO_REPLIES} réponses IA
                       </span>
                     </div>

                     {/* Progress bar */}
                     <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <motion.div
                         className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full"
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, (aiResponseCount / MAX_DEMO_REPLIES) * 100)}%` }}
                         transition={{ duration: 0.3 }}
                       />
                     </div>

                     <button
                        onClick={handleActivate}
                        className="w-full h-12 md:h-12 rounded-xl bg-emerald-400 text-vendeur-coal font-black uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl cursor-pointer"
                      >
                        Créer mon Vendeur IA <Rocket size={18} />
                      </button>
                      <button onClick={() => setStep("form")} className="w-full text-[10px] md:text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors cursor-pointer">
                        Modifier les infos
                      </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [dynamicTitle, setDynamicTitle] = useState("Vendeur IA");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const { user } = useAuthStore();

  const handleLaunchDemo = () => {
    const el = document.getElementById("demo-card");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        document.getElementById("business-name-input")?.focus();
      }, 500);
    }
  };

  useEffect(() => {
    if (user) {
      if (!!user.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-[100dvh] bg-[#07100d] selection:bg-emerald-300/30 overflow-x-hidden pt-16 md:pt-20 lg:pt-24 w-full text-left">
      <MetaHead
        title="Vendeur IA | Commercial Virtuel Haute-Performance sur WhatsApp"
        description="Vendeur IA : votre commercial virtuel sur WhatsApp & Instagram. Répondez, conseillez et vendez 24h/24, 7j/7."
      />

      {/* Modern Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#07100d]/80 backdrop-blur-2xl w-full h-14 md:h-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-full gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center bg-white/5 rounded-xl md:rounded-2xl border border-white/10 shadow-xl text-vendeur-emerald transition-transform hover:rotate-6">
              <Logo size={22} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm md:text-lg font-black text-white uppercase leading-tight tracking-tighter">{dynamicTitle}</p>
              <div className="flex items-center gap-1.5">
                 <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                 <p className="truncate text-[7px] md:text-[8px] uppercase tracking-[0.2em] text-white/40 font-black">AI Sales Machine</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="h-9 md:h-10 px-5 md:px-8 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Connexion
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <LandingHero
          onAuth={() => setIsAuthOpen(true)}
          onFormUpdate={(name) => setDynamicTitle(name)}
          onLaunchDemo={handleLaunchDemo}
        />

        {/* LOGOS / TRUST BAR */}
        <div className="py-24 flex flex-col items-center justify-center gap-10">
           <div className="flex items-center gap-4 w-full max-w-lg px-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/30 whitespace-nowrap">Compatible avec les meilleurs canaux</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
           </div>

           <div className="flex items-center justify-center gap-6 md:gap-20 px-4 opacity-40 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-white group cursor-default">
                <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
                  <WhatsAppIcon size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xl font-black tracking-tighter uppercase">WhatsApp</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-white group cursor-default">
                <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 group-hover:border-pink-500/50 group-hover:bg-pink-500/10 transition-all">
                  <Globe size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xl font-black tracking-tighter uppercase">Instagram</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-white group cursor-default">
                <div className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/5 border border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                  <Zap size={20} className="md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xl font-black tracking-tighter uppercase">Meta Ads</span>
              </div>
           </div>
        </div>

        {/* BENTO FEATURES */}
        <BentoFeatures />

        {/* CTA FINAL SECTION */}
        <section className="py-24 md:py-32 px-4 md:px-6">
           <div className="max-w-4xl mx-auto rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-emerald-500/20 via-emerald-900/10 to-transparent border border-emerald-500/20 p-8 md:p-20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:16px_16px]" />

              <FadeIn>
                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-6 leading-[0.95]">
                  Prêt à <span className="text-emerald-400">multiplier</span> vos ventes ?
                </h2>
                <p className="text-white/60 text-base md:text-lg mb-10 max-w-xl mx-auto font-medium">
                  Rejoignez des centaines de commerçants qui ont déjà automatisé leur croissance avec Vendeur IA.
                </p>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(16,185,129,0.4)] border-t border-white/30 flex items-center justify-center gap-3 mx-auto"
                >
                  Configurer mon Vendeur IA
                </button>
              </FadeIn>
           </div>
        </section>

        {/* FOOTER */}
        <footer className="py-20 border-t border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <Logo size={32} />
                 <span className="text-2xl font-black text-white tracking-tighter uppercase">Vendeur IA</span>
               </div>
               <p className="text-sm text-white/40 leading-relaxed font-medium">
                 L'assistant commercial intelligent conçu spécifiquement pour le commerce social en Afrique.
               </p>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-white">Produit</p>
              <ul className="space-y-2 text-sm text-white/40">
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Vendeur IA Vision</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Marketing Hub</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">API WhatsApp</li>
                <li className="hover:text-emerald-400 transition-colors cursor-pointer">Simulateur</li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-white">Légal</p>
              <ul className="space-y-2 text-sm text-white/40">
                <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Conditions</Link></li>
                <li><Link to="/data-deletion" className="hover:text-emerald-400 transition-colors">Meta Data</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <p className="text-xs font-black uppercase tracking-widest text-white">Newsletter</p>
              <div className="flex gap-2">
                 <input className="h-12 flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-emerald-400" placeholder="Votre email" />
                 <button className="h-12 w-12 rounded-xl bg-vendeur-emerald text-vendeur-coal flex items-center justify-center shrink-0">
                    <Send size={18} />
                 </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 pt-20 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 mt-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
              © 2026 Franck Corp. Built with ❤️ for Commerce.
            </p>
            <div className="flex gap-6 grayscale opacity-50">
               <WhatsAppIcon size={18} />
               <Globe size={18} />
               <ShieldCheck size={18} />
            </div>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {isAuthOpen && (
          <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
