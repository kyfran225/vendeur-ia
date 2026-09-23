import React, { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { AnimatedAssistantBot } from "@/components/ui/AnimatedAssistantBot";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { InstagramIcon, MetaIcon, TikTokIcon } from "@/components/ui/SocialIcons";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  MousePointer2,
  Phone,
  Eye,
  Code2,
  Cpu,
  Menu,
  X,
  Layers,
  Flame,
  Layers3,
  CreditCard,
  RotateCw
} from "lucide-react";
import { toast } from "sonner";
import { AuthSheet } from "../auth/components/AuthSheet";
import { ProductShowcaseModal, type ProductTab } from "./components/ProductShowcaseModal";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { MetaHead } from "@/components/seo/MetaHead";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

function BentoFeatures({ onOpenProduct }: { onOpenProduct?: (tab: ProductTab) => void }) {
  const secondaryFeatures = [
    {
      id: "api" as ProductTab,
      title: "Paiements & Abonnements",
      desc: "Activez votre Vendeur IA instantanément via Wave, MTN MoMo, Orange Money ou Moov avec validation immédiate.",
      icon: <ShieldCheck className="text-sky-400" size={24} />,
      color: "bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40",
      badge: "API Cloud & Sécurisé",
      isPayment: true
    },
    {
      id: "vision" as ProductTab,
      title: "Notes Vocales & IA Vision",
      desc: "Vendeur IA communique par notes vocales ultra-réalistes et comprend instantanément les photos de vos clients.",
      icon: <Mic className="text-purple-400" size={24} />,
      color: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40",
      badge: "Gemini 1.5 Multimodal",
      isPayment: false
    },
    {
      id: "marketing" as ProductTab,
      title: "Marketing Prédictif",
      desc: "Relances intelligentes et automatiques des prospects indécis au moment optimal pour maximiser vos encaissements.",
      icon: <Megaphone className="text-amber-400" size={24} />,
      color: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40",
      badge: "Hub de Relances",
      isPayment: false
    }
  ];

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto">
      <FadeIn delay={0.1}>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4">
            <Sparkles size={14} />
            <span>Moteur d'Intelligence Commerciale</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
            Une Armée de Vente <br className="hidden sm:block" />
            <span className="text-emerald-600 dark:text-emerald-400">dans votre poche.</span>
          </h2>
          <p className="text-slate-600 dark:text-white/40 max-w-2xl mx-auto font-medium">
            Oubliez les bots basiques. Vendeur IA est un cerveau commercial autonome conçu pour convertir vos prospects en clients payants.
          </p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* STAR CARD: Flagship Showcase spanning full width across all 3 columns */}
        <motion.div
          whileHover={{ y: -3 }}
          className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border bg-white dark:bg-gradient-to-br dark:from-[#07130e] dark:via-[#091511] dark:to-[#040907] border-slate-200 dark:border-emerald-500/25 p-6 sm:p-8 md:p-10 flex flex-col justify-between transition-all group md:col-span-3 shadow-xl transform-gpu text-slate-900 dark:text-white"
        >
          {/* Lightweight Ambient Background Glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Top clean badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                <span>Commercial Virtuel Intelligent</span>
              </div>
              <button
                onClick={() => onOpenProduct?.("vision")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-700 hover:text-emerald-600 dark:text-white/70 dark:hover:text-emerald-400 text-xs font-bold transition-all cursor-pointer"
              >
                <span>Découvrir nos 4 technologies clés</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-3 leading-tight">
                Vendez 24h/7 avec <span className="text-emerald-600 dark:text-emerald-400">Vendeur IA.</span>
              </h3>
              <p className="text-slate-600 dark:text-white/60 leading-relaxed text-sm md:text-base font-medium max-w-2xl">
                Votre assistant commercial ne dort jamais : il comprend vos produits, conseille vos clients, négocie les ventes et sécurise vos encaissements instantanément.
              </p>
            </div>

            {/* Content Showcase: Bot Icon & 4 Commercial Pillars in a 4-column balanced row */}
            <div className="py-2 flex flex-col lg:flex-row items-center gap-6 lg:gap-8 my-2">
              {/* Bot Icon Showcase Container */}
              <div className="relative flex items-center justify-center shrink-0">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-slate-100/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3.5 flex items-center justify-center shadow-sm">
                  <AnimatedAssistantBot size={52} glow={false} />
                </div>
              </div>

              {/* 4 Commercial Pillars Grid - 4 columns on lg, 2 on sm, 1 on xs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full flex-1 min-w-0">
                <div
                  onClick={() => onOpenProduct?.("simulator")}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-start gap-3 cursor-pointer group/pillar shadow-sm"
                >
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover/pillar:scale-110 transition-transform">
                    <Zap size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
                      Réponse en 3s <ArrowRight size={10} className="opacity-0 group-hover/pillar:opacity-100 transition-opacity text-emerald-500" />
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug mt-0.5">Zéro prospect perdu par attente</p>
                  </div>
                </div>

                <div
                  onClick={() => onOpenProduct?.("vision")}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-start gap-3 cursor-pointer group/pillar shadow-sm"
                >
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover/pillar:scale-110 transition-transform">
                    <Camera size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
                      IA Vision™ <ArrowRight size={10} className="opacity-0 group-hover/pillar:opacity-100 transition-opacity text-emerald-500" />
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug mt-0.5">Scan photo & fiche produit</p>
                  </div>
                </div>

                <div
                  onClick={() => onOpenProduct?.("marketing")}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-start gap-3 cursor-pointer group/pillar shadow-sm"
                >
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover/pillar:scale-110 transition-transform">
                    <Mic size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
                      Voix WhatsApp <ArrowRight size={10} className="opacity-0 group-hover/pillar:opacity-100 transition-opacity text-emerald-500" />
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug mt-0.5">Notes vocales réalistes</p>
                  </div>
                </div>

                <div
                  onClick={() => onOpenProduct?.("api")}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all flex items-start gap-3 cursor-pointer group/pillar shadow-sm"
                >
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover/pillar:scale-110 transition-transform">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
                      Closing 24/7 <ArrowRight size={10} className="opacity-0 group-hover/pillar:opacity-100 transition-opacity text-emerald-500" />
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug mt-0.5">Négociation & encaissement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-5 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-white/40 text-center sm:text-left">
            <span className="font-medium">Compatible avec votre numéro WhatsApp existant</span>
            <button
              onClick={() => onOpenProduct?.("vision")}
              className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Explorer les fonctionnalités en détail <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>

        {/* 3 Secondary Cards: 1 column each in the 3-column grid (Paiements, Notes Vocales, Marketing Prédictif) */}
        {secondaryFeatures.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            onClick={() => onOpenProduct?.(f.id)}
            className={cn(
              "relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border bg-white dark:bg-[#0b1813] border-slate-200 dark:border-white/10 p-7 sm:p-8 flex flex-col justify-between transition-all group col-span-1 shadow-md hover:shadow-xl cursor-pointer text-slate-900 dark:text-white"
            )}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:scale-105 transition-transform shadow-sm">
                  {f.icon}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/60 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors">
                  {f.badge}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{f.title}</h3>
              <p className="text-slate-600 dark:text-white/50 leading-relaxed text-xs sm:text-sm font-medium">{f.desc}</p>

              {f.isPayment && (
                <div className="flex flex-wrap items-center gap-2.5 mt-5">
                  {/* Wave */}
                  <img
                    src="https://www.wave.com/img/favicon.png"
                    alt="Wave"
                    className="h-6 w-6 rounded-md shadow-md group-hover:scale-105 transition-transform object-contain"
                  />

                  {/* Orange Money */}
                  <div className="h-6 w-6 rounded-md bg-[#FF7900] overflow-hidden shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg"
                      alt="Orange"
                      className="h-full w-full object-contain p-0.5"
                    />
                  </div>

                  {/* MTN */}
                  <div className="h-6 px-1.5 rounded-md bg-[#FFCC00] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <svg viewBox="0 0 512 256" className="h-3.5 w-auto" fill="black" xmlns="http://www.w3.org/2000/svg">
                      <path d="M256 40c-110.5 0-200 38.5-200 86s89.5 86 200 86 200-38.5 200-86-89.5-86-200-86zm0 162c-104.9 0-190-34-190-76s85.1-76 190-76 190 34 190 76-85.1 76-190 76z" />
                      <path d="M125 85h25 l15 40 15-40 h25 v85 h-20 v-55 l-20 55 h-10 l-20-55 v55 h-20 V85z M225 85 h60 v20 h-20 v65 h-20 v-65 h-20 V85z M310 85 h20 l25 50 v-50 h20 v85 h-20 l-25-50 v50 h-20 V85z" />
                    </svg>
                  </div>

                  {/* Moov Money */}
                  <div className="h-6 px-2 rounded-md bg-[#005CA9] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform" title="Moov Money">
                    <svg viewBox="0 0 110 26" className="h-3.5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19.5V7.5h3.6l3 6.8 3-6.8h3.6v12h-2.6v-7.8l-2.8 6.4h-2.4l-2.8-6.4v7.8H6z" fill="#FFFFFF"/>
                      <circle cx="27.5" cy="13.5" r="5.5" stroke="#FFFFFF" strokeWidth="2.4" fill="none"/>
                      <path d="M27.5 8a5.5 5.5 0 0 1 5.5 5.5" stroke="#FF7900" strokeWidth="2.8" strokeLinecap="round"/>
                      <circle cx="39.5" cy="13.5" r="5.5" stroke="#FFFFFF" strokeWidth="2.4" fill="none"/>
                      <path d="M39.5 8a5.5 5.5 0 0 1 5.5 5.5" stroke="#FF7900" strokeWidth="2.8" strokeLinecap="round"/>
                      <path d="M47 7.5h2.8l3.4 12h-2.6l-2.1-7.8-2.1 7.8h-2.6l3.2-12z" fill="#FFFFFF"/>
                      <text x="56" y="17" fill="#FF7900" fontSize="8.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="0.8">MONEY</text>
                    </svg>
                  </div>

                  {/* Paystack */}
                  <div className="h-6 px-2 rounded-md bg-[#011B33] border border-[#00C3F8]/30 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform" title="Paystack">
                    <svg viewBox="0 0 96 26" className="h-3.5 w-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 2.5H1.5C.7 2.5 0 3.2 0 4v2c0 .8.7 1.5 1.5 1.5H19c.8 0 1.5-.7 1.5-1.5V4c0-.8-.7-1.5-1.5-1.5zm0 11.5H1.5c-.8 0-1.5.7-1.5 1.5v2c0 .8.7 1.5 1.5 1.5H19c.8 0 1.5-.7 1.5-1.5V15.5c0-.8-.7-1.5-1.5-1.5zm-8 6H1.5c-.8 0-1.5.7-1.5 1.5v2c0 .8.7 1.5 1.5 1.5H11c.8 0 1.5-.7 1.5-1.5v-2c0-.8-.7-1.5-1.5-1.5zM20 8.5H1.5C.7 8.5 0 9.2 0 10v2c0 .8.7 1.5 1.5 1.5H20c.8 0 1.5-.7 1.5-1.5V10c0-.8-.7-1.5-1.5-1.5z" fill="#00C3F8"/>
                      <text x="26" y="17.5" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.2">paystack</text>
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-white/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              <span>Voir la démo interactive</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Decorative background glow */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 dark:bg-white/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-all" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const IndustrySolutions = () => {
  const industries = [
    { title: "Agent E-commerce IA", desc: "Automatisez la vente de vos produits physiques, de la présentation du catalogue à l'encaissement." },
    { title: "Agent Immobilier IA", desc: "Gérez vos visites, envoyez les fiches techniques des biens et qualifiez vos prospects 24h/7." },
    { title: "Agent de Support Client", desc: "Répondez instantanément aux questions fréquentes et libérez du temps pour votre équipe." },
    { title: "Assistant de Vente Services", desc: "Prenez des rendez-vous et vendez vos prestations de service directement sur WhatsApp." }
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {industries.map((item, i) => (
          <FadeIn key={i} delay={0.1 * i} direction="up">
            <div className="space-y-3">
              <h3 className="text-[12px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2">Solution Métier</h3>
              <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">{item.title}</h4>
              <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed font-medium">{item.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};

const SEOFAQ = () => {
  const faqs = [
    {
      q: "Qu'est-ce qu'un Agent WhatsApp IA ?",
      a: "Un agent WhatsApp IA est un assistant virtuel intelligent capable de comprendre le langage naturel pour interagir avec vos clients, répondre à leurs questions et réaliser des actions de vente de manière autonome."
    },
    {
      q: "Comment un agent IA peut-il augmenter mes ventes sur WhatsApp ?",
      a: "En étant disponible 24h/24 et 7j/7, l'agent IA répond instantanément aux prospects, ce qui évite les pertes de clients liées à l'attente et permet de conclure des ventes même pendant votre sommeil."
    },
    {
      q: "L'agent IA WhatsApp gère-t-il les paiements Mobile Money ?",
      a: "Oui, Vendeur IA intègre les solutions de paiement locales comme Wave, Orange Money et MTN MoMo pour sécuriser vos transactions directement dans la conversation WhatsApp."
    },
    {
      q: "Quelle est la différence entre un chatbot classique et un Agent IA ?",
      a: "Contrairement à un chatbot classique basé sur des boutons rigides, un Agent IA utilise le traitement du langage naturel (NLP) pour comprendre les intentions réelles des clients et conseiller vos produits de manière personnalisée."
    }
  ];

  return (
    <section className="py-24 px-4 max-w-4xl mx-auto border-t border-slate-200 dark:border-white/5">
      <FadeIn>
        <h2 className="text-3xl md:text-4xl font-black text-center uppercase tracking-tighter mb-16 text-slate-900 dark:text-white">
          Tout savoir sur les <br className="sm:hidden" />
          <span className="text-emerald-600 dark:text-emerald-400">Agents WhatsApp IA</span>
        </h2>
      </FadeIn>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {faqs.map((faq, i) => (
          <FadeIn key={i} delay={0.1 * i}>
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-start gap-3 leading-tight">
                <span className="text-emerald-500 shrink-0">Q.</span> {faq.q}
              </h3>
              <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed font-medium pl-7">{faq.a}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
};

// THE MAIN LANDING HERO
function LandingHero({
  onAuth,
  onFormUpdate,
  onLaunchDemo
}: {
  onAuth: () => void;
  onFormUpdate?: (name: string) => void;
  onLaunchDemo?: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isFounder } = useFounderRole();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12 xl:gap-16 max-w-6xl mx-auto lg:min-h-[calc(100vh-96px)]">
      {/* Left Text Side */}
      <div className="w-full lg:max-w-xl xl:max-w-2xl text-center lg:text-left space-y-6 flex-1">
        <FadeIn delay={0.2} direction="down">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            <Sparkles size={14} />
            <span>Essai Gratuit 7 Jours • Zéro Engagement</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] text-slate-900 dark:text-white tracking-tighter uppercase">
            WhatsApp <br/>
            <span className="text-emerald-600 dark:text-emerald-400">Vend tout seul.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.4}>
          <p className="text-base md:text-lg text-slate-600 dark:text-white/50 leading-relaxed font-medium max-w-lg mx-auto lg:mx-0">
            Transformez votre WhatsApp en une machine de vente autonome. Propulsé par une IA qui conseille vos clients, présente vos produits et encaisse par Mobile Money 24h/7.
          </p>
        </FadeIn>

        <FadeIn delay={0.5}>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start flex-wrap">
              <button
                onClick={onAuth}
                className="w-full sm:w-auto h-13 px-7 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] cursor-pointer whitespace-nowrap"
              >
                <span>Démarrer l'essai gratuit</span>
                <ArrowRight size={17} />
              </button>
              
              {user ? (
                <button
                  onClick={() => navigate(isFounder ? "/admin" : "/dashboard")}
                  className="w-full sm:w-auto h-13 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                >
                  <span>Accéder au Cockpit</span>
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  onClick={onAuth}
                  className="w-full sm:w-auto h-13 px-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white/90 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer shadow-sm whitespace-nowrap"
                >
                  Connexion Marchand
                </button>
              )}
            </div>

            <p className="text-[11px] font-semibold text-slate-500 dark:text-white/40 flex items-center justify-center lg:justify-start gap-2">
              <span className="text-emerald-500">✓</span> Aucune carte bancaire requise
              <span>•</span>
              <span className="text-emerald-500">✓</span> Prêt en 2 minutes
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="grid grid-cols-3 gap-2 md:gap-8 pt-4 max-w-lg mx-auto lg:mx-0">
            <div className="flex flex-col sm:flex-row items-center sm:gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-3 sm:px-4 sm:py-2 rounded-2xl shadow-sm backdrop-blur-sm">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 sm:mb-0">
                <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none">98%</p>
                <p className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-white/30 mt-1">Satisfait</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-3 sm:px-4 sm:py-2 rounded-2xl shadow-sm backdrop-blur-sm">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 sm:mb-0">
                <Zap size={16} className="sm:w-[18px] sm:h-[18px]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none">3s</p>
                <p className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-white/30 mt-1">Réponse</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:gap-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2 py-3 sm:px-4 sm:py-2 rounded-2xl shadow-sm backdrop-blur-sm">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 sm:mb-0">
                <AnimatedAssistantBot size={20} glow={false} />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-none">24/7</p>
                <p className="text-[7px] sm:text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-white/30 mt-1">Actif</p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Right Visual Side - Responsive Showcase */}
      <div id="demo-card" className="relative w-full lg:w-auto flex justify-center perspective-1000 overflow-visible z-10 mt-6 sm:mt-8 lg:mt-0 shrink-0">
        {/* Soft Ambient Background Aura */}
        <div className="absolute -top-6 -right-6 w-48 sm:w-60 h-48 sm:h-60 bg-emerald-500/15 dark:bg-emerald-400/15 blur-[60px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute -bottom-6 -left-6 w-48 sm:w-60 h-48 sm:h-60 bg-teal-500/15 dark:bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />

        <FadeIn delay={0.4} direction="right" className="w-full flex justify-center">
          <div className="relative group w-[270px] xs:w-[290px] sm:w-[310px] lg:w-[295px] xl:w-[315px] mx-auto">

            {/* Clean & Compact Video Stage - 100% Crisp on Mobile and Desktop */}
            <div
              className="relative w-full aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#07100d] border border-slate-200/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] group"
            >
              {/* Minimalist Glass Audio Button (Top Right) */}
              <button
                onClick={toggleMute}
                title={isMuted ? "Activer le son" : "Couper le son"}
                className="absolute top-3 right-3 z-30 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-slate-200/80 dark:border-white/20 text-slate-800 dark:text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-md hover:bg-white dark:hover:bg-black/80 group/btn"
              >
                {isMuted ? (
                  <VolumeX size={15} className="text-slate-600 dark:text-white/80" />
                ) : (
                  <Volume2 size={15} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                )}
              </button>

              {/* Video Element */}
              <video
                ref={videoRef}
                src="/videos/vendeur-ia-demo-optimized.mp4"
                poster="/videos/vendeur-ia-demo-poster.webp"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                className="w-full h-full object-cover select-none"
              />

              {/* Play/Pause Overlay Controller */}
              <button
                onClick={togglePlay}
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all cursor-pointer z-10",
                  isPlaying
                    ? "bg-black/10 opacity-0 group-hover:opacity-100"
                    : "bg-slate-900/40 dark:bg-black/50 backdrop-blur-[2px] opacity-100"
                )}
                aria-label={isPlaying ? "Mettre en pause" : "Lire la vidéo"}
              >
                <div className="p-3.5 sm:p-4 rounded-full bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center">
                  {isPlaying ? (
                    <Pause size={18} className="text-slate-900 dark:text-white" />
                  ) : (
                    <Play size={20} className="text-emerald-600 dark:text-emerald-400 ml-0.5 fill-current" />
                  )}
                </div>
              </button>
            </div>

          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dynamicTitle, setDynamicTitle] = useState("Vendeur IA");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProductTab, setSelectedProductTab] = useState<ProductTab>("vision");
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribingNewsletter, setIsSubscribingNewsletter] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { user } = useAuthStore();
  const { isFounder } = useFounderRole();

  const handleLaunchDemo = () => {
    setIsAuthOpen(true);
  };

  const handleSubscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newsletterEmail.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Veuillez saisir votre adresse email.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      toast.error("Format d'adresse email invalide.");
      return;
    }

    setIsSubscribingNewsletter(true);
    try {
      const response = await axios.post(`${API_URL}/api/commerce/newsletter/subscribe`, {
        email: cleanEmail
      });

      if (response.data.success) {
        toast.success(response.data.message || "Inscription réussie !");
        setNewsletterSuccess(true);
        setNewsletterEmail("");
        setTimeout(() => setNewsletterSuccess(false), 6000);
      } else {
        toast.info(response.data.message || "Information enregistrée.");
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || "Erreur lors de l'inscription à la newsletter.";
      toast.error(msg);
    } finally {
      setIsSubscribingNewsletter(false);
    }
  };

  const openProduct = (tab: ProductTab) => {
    setSelectedProductTab(tab);
    setProductModalOpen(true);
    setProductsDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // Synchronize URL query or hash with product modal
  useEffect(() => {
    const productParam = searchParams.get("product") as ProductTab | null;
    const hashParam = location.hash.replace("#", "") as ProductTab;

    const validTabs: ProductTab[] = ["vision", "marketing", "api", "simulator"];
    if (productParam && validTabs.includes(productParam)) {
      setSelectedProductTab(productParam);
      setProductModalOpen(true);
    } else if (hashParam && validTabs.includes(hashParam)) {
      setSelectedProductTab(hashParam);
      setProductModalOpen(true);
    }
  }, [searchParams, location.hash]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on outside click, Escape key, or screen resize
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileMenuOpen]);

  const { isMasterAdmin } = useFounderRole();

  useEffect(() => {
    if (user) {
      if (isMasterAdmin) {
        navigate("/admin", { replace: true });
        return;
      }
      if (user.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        const el = document.getElementById("demo-card");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            document.getElementById("business-name-input")?.focus();
          }, 600);
        }
      }
    }
  }, [user, isMasterAdmin, navigate]);

  return (
    <div data-page="landing" className="min-h-[100dvh] bg-slate-50 dark:bg-[#07100d] text-slate-900 dark:text-white selection:bg-emerald-300/30 overflow-x-hidden pt-16 md:pt-20 lg:pt-24 w-full text-left transition-colors duration-200">
      <MetaHead
        title="Vendeur IA | Commercial Virtuel Haute-Performance sur WhatsApp"
        description="Vendeur IA : votre commercial virtuel sur WhatsApp & Instagram. Répondez, conseillez et vendez 24h/24, 7j/7."
        schemaRaw={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Qu'est-ce qu'un Agent WhatsApp IA ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Un agent WhatsApp IA est un assistant virtuel intelligent capable de comprendre le langage naturel pour interagir avec vos clients, répondre à leurs questions et réaliser des actions de vente de manière autonome."
              }
            },
            {
              "@type": "Question",
              "name": "Comment un agent IA peut-il augmenter mes ventes sur WhatsApp ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "En étant disponible 24h/24 et 7j/7, l'agent IA répond instantanément aux prospects, ce qui évite les pertes de clients liées à l'attente et permet de conclure des ventes même pendant votre sommeil."
              }
            },
            {
              "@type": "Question",
              "name": "L'agent IA WhatsApp gère-t-il les paiements Mobile Money ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Oui, Vendeur IA intègre les solutions de paiement locales comme Wave, Orange Money et MTN MoMo pour sécuriser vos transactions directement dans la conversation WhatsApp."
              }
            },
            {
              "@type": "Question",
              "name": "Quelle est la différence entre un chatbot classique et un Agent IA ?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Contrairement à un chatbot classique basé sur des boutons rigides, un Agent IA utilise le traitement du langage naturel (NLP) pour comprendre les intentions réelles des clients et conseiller vos produits de manière personnalisée."
              }
            }
          ]
        }}
      />

      {/* Modern Header / Glassmorphism Giant-Tech Nav */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-[100] border-b border-slate-200/80 dark:border-white/5 bg-white/90 dark:bg-[#07100d]/90 backdrop-blur-2xl w-full h-16 md:h-20 transition-all text-slate-900 dark:text-white"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 sm:px-6 md:px-8 h-full gap-2 sm:gap-4">
          
          {/* Logo & Dynamic Brand Name */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex shrink-0 items-center justify-center text-slate-900 dark:text-white transition-all hover:scale-105"
            >
              <Logo size={26} />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tight">{dynamicTitle}</p>
              <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="truncate text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/50 font-black">AI Sales Machine</p>
              </div>
            </div>
          </div>

          {/* Desktop Center Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white/70">
            
            {/* Mega Dropdown: Produit */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProductsDropdownOpen(prev => !prev)}
                onMouseEnter={() => setProductsDropdownOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer",
                  productsDropdownOpen && "text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-white/5"
                )}
              >
                <span>Produits</span>
                <ChevronDown size={14} className={cn("transition-transform duration-200", productsDropdownOpen && "rotate-180 text-emerald-500")} />
              </button>

              <AnimatePresence>
                {productsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onMouseLeave={() => setProductsDropdownOpen(false)}
                    className="absolute top-full left-0 mt-2 w-80 p-3 rounded-2xl bg-white dark:bg-[#09140f] border border-slate-200 dark:border-emerald-500/20 shadow-2xl grid gap-1.5 z-50 text-slate-900 dark:text-white"
                  >
                    <button
                      onClick={() => openProduct("vision")}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Eye size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Vendeur IA Vision</p>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">OCR</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 leading-snug mt-0.5">Scan photo de rayon, fiches produits & OCR de reçus Mobile Money.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => openProduct("marketing")}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Megaphone size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Marketing Hub</p>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">+340%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 leading-snug mt-0.5">Relances prédictives WhatsApp, affiches IA & récupération paniers.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => openProduct("api")}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0 group-hover:scale-110 transition-transform">
                        <Code2 size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">API WhatsApp</p>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20">Cloud</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 leading-snug mt-0.5">Passerelle développeur, webhooks instantanés & multi-numéros.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => openProduct("payments")}
                      className="w-full p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-left flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                        <CreditCard size={17} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">Mobile Money & Encaissement</p>
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">Wave • MoMo</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 leading-snug mt-0.5">Encaissement automatique, audit forensic anti-fraude & reçus instantanés.</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Links */}
            <button
              onClick={() => openProduct("vision")}
              className="px-3.5 py-2 rounded-xl transition-all hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              IA Vision™
            </button>

            <button
              onClick={() => openProduct("marketing")}
              className="px-3.5 py-2 rounded-xl transition-all hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              Marketing Hub
            </button>

            <Link
              to="/offers"
              className="px-3.5 py-2 rounded-xl transition-all hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              Tarifs & Offres
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAuthOpen(true);
              }}
              className="hidden sm:flex h-9 md:h-10 px-4 md:px-5 rounded-xl md:rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md items-center gap-2 cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Essai Gratuit 7j</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (user && !user.onboardingCompleted) {
                  handleLaunchDemo();
                } else {
                  setIsAuthOpen(true);
                }
              }}
              className="h-9 md:h-10 px-4 md:px-6 rounded-xl md:rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-900 dark:text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              {user && !user.onboardingCompleted ? "Créer ma Boutique" : "Connexion"}
            </button>

            {/* ☀️/🌙 1-Click Direct Theme Switcher (Desktop only) */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Menu principal"
              className="lg:hidden h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Backdrop & Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Semi-transparent backdrop overlay to dismiss on outside click */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 top-16 bg-slate-950/40 backdrop-blur-sm -z-10 lg:hidden"
              />

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#07100d] shadow-2xl px-5 py-4 space-y-3 text-slate-900 dark:text-white"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 px-2">Nos Produits</p>
                  <button
                    onClick={() => openProduct("vision")}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
                  >
                    <Eye size={16} className="text-emerald-500" />
                    <span>Vendeur IA Vision™</span>
                  </button>
                  <button
                    onClick={() => openProduct("marketing")}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
                  >
                    <Megaphone size={16} className="text-amber-500" />
                    <span>Marketing Hub™</span>
                  </button>
                  <button
                    onClick={() => openProduct("api")}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
                  >
                    <Code2 size={16} className="text-sky-500" />
                    <span>API WhatsApp & Cloud</span>
                  </button>
                  <button
                    onClick={() => openProduct("payments")}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-left text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
                  >
                    <CreditCard size={16} className="text-purple-500" />
                    <span>Mobile Money & Encaissement</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2.5">
                  <Link
                    to="/offers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
                  >
                    <CreditCard size={16} className="text-emerald-500" />
                    <span>Offres & Tarifs</span>
                  </Link>

                  {/* Theme Switcher inside Mobile Drawer */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/80 px-1">Thème d'affichage</span>
                    <ThemeToggle variant="segmented" />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent" />
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/30 whitespace-nowrap">Compatible avec les meilleurs canaux</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 dark:via-white/10 to-transparent" />
           </div>

           <div className="flex flex-wrap items-center justify-center gap-6 md:gap-16 px-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
              {/* WhatsApp */}
              <div className="flex items-center gap-2 md:gap-3 text-slate-800 dark:text-white group cursor-default">
                <div className="p-2 md:p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 group-hover:text-[#25D366] transition-all shadow-sm">
                  <WhatsAppIcon size={22} className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-xs md:text-lg font-black tracking-tighter uppercase">WhatsApp</span>
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-2 md:gap-3 text-slate-800 dark:text-white group cursor-default">
                <div className="p-2 md:p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white group-hover:border-pink-500/50 group-hover:bg-pink-500/10 group-hover:text-[#E4405F] transition-all shadow-sm">
                  <InstagramIcon size={20} className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-xs md:text-lg font-black tracking-tighter uppercase">Instagram</span>
              </div>

              {/* Meta Ads */}
              <div className="flex items-center gap-2 md:gap-3 text-slate-800 dark:text-white group cursor-default">
                <div className="p-2 md:p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white group-hover:border-blue-500/50 group-hover:bg-blue-500/10 group-hover:text-[#0081FB] transition-all shadow-sm">
                  <MetaIcon size={22} className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-xs md:text-lg font-black tracking-tighter uppercase">Meta Ads</span>
              </div>

              {/* TikTok */}
              <div className="flex items-center gap-2 md:gap-3 text-slate-800 dark:text-white group cursor-default">
                <div className="p-2 md:p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 group-hover:text-[#00F2FE] transition-all shadow-sm">
                  <TikTokIcon size={20} className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-xs md:text-lg font-black tracking-tighter uppercase">TikTok</span>
              </div>
           </div>
        </div>

        {/* BENTO FEATURES WITH INTERACTIVE MODAL CALLBACKS */}
        <BentoFeatures onOpenProduct={openProduct} />

        {/* SEO OPTIMIZED INDUSTRY SOLUTIONS */}
        <IndustrySolutions />

        {/* CTA FINAL SECTION */}
        <section className="py-24 md:py-32 px-4 md:px-6">
           <div className="max-w-4xl mx-auto rounded-[2rem] md:rounded-[2.5rem] bg-white dark:bg-gradient-to-br dark:from-[#0c1813] dark:via-[#07110d] dark:to-[#040806] border border-slate-200 dark:border-emerald-500/15 p-8 md:p-16 text-center relative overflow-hidden shadow-xl dark:shadow-2xl text-slate-900 dark:text-white transition-colors">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 dark:opacity-10 pointer-events-none bg-[radial-gradient(#00000020_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:16px_16px]" />

              <FadeIn>
                <div className="inline-flex items-center justify-center mb-6">
                  <div className="h-16 w-16 md:h-18 md:w-18 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 flex items-center justify-center shadow-sm">
                    <AnimatedAssistantBot size={40} glow={false} />
                  </div>
                </div>

                <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6 leading-[0.95]">
                  Prêt à <span className="text-emerald-600 dark:text-emerald-400">multiplier</span> vos ventes ?
                </h2>
                <p className="text-slate-600 dark:text-white/70 text-base md:text-lg mb-10 max-w-xl mx-auto font-medium">
                  Rejoignez des centaines de commerçants qui ont déjà automatisé leur croissance avec Vendeur IA.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handleLaunchDemo}
                    className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_20px_60px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 mx-auto cursor-pointer"
                  >
                    Démarrer mon essai gratuit (7 jours) <ArrowRight size={18} />
                  </button>
                  <p className="text-xs text-slate-500 dark:text-white/40 font-semibold">
                    Essai gratuit de 7 jours • Aucune carte requise • Configuration en 2 minutes
                  </p>
                </div>
              </FadeIn>
           </div>
        </section>

        {/* SEO OPTIMIZED FAQ SECTION */}
        <SEOFAQ />

        {/* FOOTER WITH INTERACTIVE PRODUCT LINKS */}
        <footer className="py-20 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-black/20 text-slate-900 dark:text-white transition-colors">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                 <Logo size={32} />
                 <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Vendeur IA</span>
               </div>
               <p className="text-sm text-slate-600 dark:text-white/40 leading-relaxed font-medium">
                 L'assistant commercial intelligent conçu spécifiquement pour le commerce social en Afrique.
               </p>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Produit</p>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-white/40">
                <li>
                  <button
                    onClick={() => openProduct("vision")}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer text-left flex items-center gap-1.5 group"
                  >
                    <span>Vendeur IA Vision</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-500" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openProduct("marketing")}
                    className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-1.5 group"
                  >
                    <span>Marketing Hub</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-500" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openProduct("api")}
                    className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors cursor-pointer text-left flex items-center gap-1.5 group"
                  >
                    <span>API WhatsApp</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-sky-500" />
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => openProduct("payments")}
                    className="hover:text-purple-500 dark:hover:text-purple-400 transition-colors cursor-pointer text-left flex items-center gap-1.5 group"
                  >
                    <span>Mobile Money & Encaissement</span>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-purple-500" />
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Légal</p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-white/40">
                <li><Link to="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Confidentialité</Link></li>
                <li><Link to="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Conditions</Link></li>
                <li><Link to="/data-deletion" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Meta Data</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Newsletter Stratégique</p>
                <p className="text-[11px] text-slate-500 dark:text-white/40 leading-snug mt-1">
                  Recevez nos analyses e-commerce et secrets d'automatisation WhatsApp.
                </p>
              </div>

              <form onSubmit={handleSubscribeNewsletter} className="space-y-2">
                <div className="flex gap-2">
                   <input
                     type="email"
                     value={newsletterEmail}
                     onChange={(e) => setNewsletterEmail(e.target.value)}
                     disabled={isSubscribingNewsletter}
                     className="h-12 flex-1 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 focus:border-emerald-500 rounded-xl px-4 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30 disabled:opacity-50"
                     placeholder="Votre adresse email"
                   />
                   <button
                     type="submit"
                     disabled={isSubscribingNewsletter || !newsletterEmail.trim()}
                     className={cn(
                       "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer font-black",
                       newsletterSuccess
                         ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                         : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                     )}
                   >
                     {isSubscribingNewsletter ? (
                       <RotateCw size={16} className="animate-spin" />
                     ) : newsletterSuccess ? (
                       <Check size={18} />
                     ) : (
                       <Send size={16} />
                     )}
                   </button>
                </div>
                {newsletterSuccess && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 size={12} />
                    <span>Inscrit avec succès ! Bienvenue dans la communauté.</span>
                  </p>
                )}
              </form>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 pt-20 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-200 dark:border-white/5 mt-10 text-slate-500 dark:text-white/40">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
              © 2026 Franck Corp. Built with ❤️ for Commerce.
            </p>
            <div className="flex items-center gap-3">
               {/* WhatsApp Support Direct Button (Numéro Système Officiel) */}
               <a
                 href="https://wa.me/2250505111157?text=Bonjour%20Vendeur%20IA%2C%20je%20souhaite%20d%C3%A9couvrir%20la%20plateforme%20et%20lancer%20mon%20commercial%20virtuel."
                 target="_blank"
                 rel="noopener noreferrer"
                 title="Contacter le numéro système officiel Vendeur IA sur WhatsApp"
                 className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 hover:text-[#25D366] dark:text-white/60 dark:hover:text-[#25D366] transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 flex items-center justify-center"
               >
                 <WhatsAppIcon size={18} />
               </a>

               {/* Web / Currency info Button */}
               <button
                 onClick={() => {
                   toast.info("Vendeur IA est disponible dans toute la zone UEMOA / CEMAC (XOF, XAF, GNF, NGN, EUR, USD).");
                 }}
                 title="Disponibilité multi-pays & devises"
                 className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-sky-500/50 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-slate-600 hover:text-sky-500 dark:text-white/60 dark:hover:text-sky-400 transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 flex items-center justify-center"
               >
                 <Globe size={18} />
               </button>

               {/* Security & Shield Privacy Link */}
               <Link
                 to="/privacy"
                 title="Sécurité des données & Chiffrement RGPD"
                 className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 hover:text-emerald-600 dark:text-white/60 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95 flex items-center justify-center"
               >
                 <ShieldCheck size={18} />
               </Link>
            </div>
          </div>
        </footer>
      </main>

      {/* PRODUCT SHOWCASE DEEP-DIVE MODAL */}
      <ProductShowcaseModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        initialTab={selectedProductTab}
        onLaunchDemo={handleLaunchDemo}
      />

      <AnimatePresence>
        {isAuthOpen && (
          <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
