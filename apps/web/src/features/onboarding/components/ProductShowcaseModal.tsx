import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Megaphone,
  Code2,
  Cpu,
  Sparkles,
  Zap,
  CheckCircle2,
  ArrowRight,
  X,
  Copy,
  Check,
  ShieldCheck,
  Camera,
  Layers,
  BarChart3,
  Bot,
  Terminal,
  Play,
  RotateCw,
  TrendingUp,
  Flame,
  Lock,
  ChevronRight
} from "lucide-react";
import { AnimatedAssistantBot } from "@/components/ui/AnimatedAssistantBot";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ProductTab = "vision" | "marketing" | "api" | "simulator";

interface ProductShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ProductTab;
  onLaunchDemo?: () => void;
}

export function ProductShowcaseModal({
  isOpen,
  onClose,
  initialTab = "vision",
  onLaunchDemo
}: ProductShowcaseModalProps) {
  const [activeTab, setActiveTab] = useState<ProductTab>(initialTab);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCodeLang, setActiveCodeLang] = useState<"curl" | "node" | "python" | "php">("curl");
  const [activeVisionPreset, setActiveVisionPreset] = useState<"product" | "receipt" | "chat">("product");
  const [activeMarketingAudience, setActiveMarketingAudience] = useState<"cart" | "vip" | "inactive">("cart");
  const [activeMarketingTone, setActiveMarketingTone] = useState<"promo" | "friendly" | "urgent">("promo");
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [webhookEvent, setWebhookEvent] = useState<"message.received" | "payment.receipt_detected" | "order.closed">("message.received");

  // Keep active tab in sync when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success("Code copié dans le presse-papier !");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const triggerVisionScan = (preset: "product" | "receipt" | "chat") => {
    setActiveVisionPreset(preset);
    setIsVisionScanning(true);
    setTimeout(() => setIsVisionScanning(false), 1200);
  };

  const products = [
    {
      id: "vision" as ProductTab,
      title: "Vendeur IA Vision™",
      shortName: "Vendeur IA Vision",
      badge: "Multimodal Gemini",
      icon: Eye,
      tagline: "Reconnaissance visuelle instantanée & OCR de paiement",
      description: "Le moteur visuel capable d'analyser des photos de produits en rayon, d'extraire les fiches techniques et d'auditer les reçus de virement Mobile Money."
    },
    {
      id: "marketing" as ProductTab,
      title: "Marketing Hub™",
      shortName: "Marketing Hub",
      badge: "Relances Prédictives",
      icon: Megaphone,
      tagline: "Broadcast WhatsApp ciblé & Récupération de paniers",
      description: "Automatisez vos campagnes promotionnelles WhatsApp, récupérez les clients indécis au moment idéal et générez des visuels promotionnels par IA."
    },
    {
      id: "api" as ProductTab,
      title: "API WhatsApp & Cloud",
      shortName: "API WhatsApp",
      badge: "Infrastructure 99.99%",
      icon: Code2,
      tagline: "Passerelle développeur & automatisation haute disponibilité",
      description: "Connectez vos boutiques, webhooks et ERP à WhatsApp en moins de 2 minutes avec notre passerelle robuste et son système anti-bannissement."
    },
    {
      id: "simulator" as ProductTab,
      title: "Simulateur Commercial IA",
      shortName: "Simulateur",
      badge: "Bac à Sable Live",
      icon: Cpu,
      tagline: "Testez votre vendeur IA en conditions réelles",
      description: "Simulez instantanément le comportement de votre commercial virtuel face à différents types de clients (négociateur, pressé, curieux)."
    }
  ];

  const currentProduct = products.find((p) => p.id === activeTab) || products[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl transition-all"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-5xl bg-[#09130e] border border-emerald-500/20 rounded-2xl sm:rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden z-10 flex flex-col max-h-[94vh] min-w-0"
        >
          {/* Top Header Bar */}
          <div className="px-4 py-3.5 sm:px-8 sm:py-5 border-b border-white/10 bg-[#0c1913]/90 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <AnimatedAssistantBot size={22} glow={false} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-400">Écosystème Produit</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/10 text-[9px] sm:text-[10px] font-bold text-white/70">Vendeur IA Enterprise</span>
                </div>
                <h3 className="text-sm sm:text-lg md:text-xl font-black text-white uppercase tracking-tight truncate">
                  {currentProduct.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Active Product Banner Indicator */}
          <div className="px-4 sm:px-8 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 truncate">
                Onglet actif : <span className="text-white underline decoration-emerald-400 font-black">{currentProduct.title}</span>
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-emerald-300/80 border border-emerald-500/30 shrink-0">
              {currentProduct.badge}
            </span>
          </div>

          {/* Tab Navigation Pill Bar - Horizontal Scrollable with clear text */}
          <div className="px-3 sm:px-8 py-2.5 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 w-full">
            {products.map((p) => {
              const Icon = p.icon;
              const isActive = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border shrink-0",
                    isActive
                      ? "bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50"
                      : "bg-white/5 border-transparent text-white/50 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon size={15} className={isActive ? "text-emerald-400" : "text-white/40"} />
                  <span className={isActive ? "text-emerald-300 font-black" : ""}>{p.shortName}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Modal Content Scroll Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-6 md:p-8 space-y-6 sm:space-y-8 no-scrollbar w-full min-w-0">

            {/* TAB 1: VENDEUR IA VISION */}
            {activeTab === "vision" && (
              <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#0a1812] to-black/60 border border-emerald-500/25 w-full min-w-0">
                  <div className="space-y-2 max-w-xl min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <Camera size={13} />
                      <span>Technologie Multimodale Avancée</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight break-words">
                      Vendeur IA <span className="text-emerald-400">Vision™</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium">
                      Analyse instantanée des photos envoyées par vos clients sur WhatsApp, création de catalogue en un clic à partir d'une photo de rayon, et audit anti-fraude des reçus de paiement Mobile Money.
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                      <p className="text-lg sm:text-2xl font-black text-emerald-400 leading-none">&lt; 800ms</p>
                      <p className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-white/40 mt-1">Vitesse d'Analyse</p>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                      <p className="text-lg sm:text-2xl font-black text-white leading-none">99.4%</p>
                      <p className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-white/40 mt-1">Précision OCR</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Live Vision Sandbox */}
                <div className="space-y-4 w-full min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
                      <Sparkles size={14} className="text-emerald-400" />
                      Démonstration Interactive en Direct :
                    </h4>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <button
                        onClick={() => triggerVisionScan("product")}
                        className={cn(
                          "px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                          activeVisionPreset === "product"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                        )}
                      >
                        1. Photo Produit
                      </button>
                      <button
                        onClick={() => triggerVisionScan("receipt")}
                        className={cn(
                          "px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                          activeVisionPreset === "receipt"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                        )}
                      >
                        2. Reçu Mobile Money
                      </button>
                      <button
                        onClick={() => triggerVisionScan("chat")}
                        className={cn(
                          "px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                          activeVisionPreset === "chat"
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                        )}
                      >
                        3. Demande WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* Sandbox Preview Container */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#07110c] border border-white/10 relative overflow-hidden w-full min-w-0">
                    {/* Visual Scanning Effect Bar */}
                    {isVisionScanning && (
                      <motion.div
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] z-30 pointer-events-none"
                      />
                    )}

                    {/* Left: Simulated Visual Input */}
                    <div className="lg:col-span-5 rounded-xl sm:rounded-2xl bg-black/60 border border-white/10 p-4 flex flex-col items-center justify-center relative min-h-[220px] sm:min-h-[260px] overflow-hidden group w-full min-w-0">
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 z-10">
                        <Camera size={12} />
                        {activeVisionPreset === "product" && "Scan Photo Rayon"}
                        {activeVisionPreset === "receipt" && "Scan Reçu Wave/OM"}
                        {activeVisionPreset === "chat" && "Image Client WhatsApp"}
                      </div>

                      {activeVisionPreset === "product" && (
                        <div className="text-center space-y-3 p-4">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-950 to-emerald-800/40 border border-emerald-500/30 flex items-center justify-center shadow-lg relative">
                            <span className="text-3xl sm:text-4xl">👟</span>
                            {/* Simulated Detection Bounding Box */}
                            <div className="absolute inset-1 border-2 border-dashed border-emerald-400/80 rounded-xl flex items-end justify-end p-1">
                              <span className="text-[7px] sm:text-[8px] font-black uppercase bg-emerald-400 text-black px-1 rounded">Confidence 99.2%</span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-white">Sneakers Nike Air Max Limited</p>
                          <p className="text-[10px] sm:text-[11px] text-white/40">Détection d'article & attributs automatiques</p>
                        </div>
                      )}

                      {activeVisionPreset === "receipt" && (
                        <div className="text-center space-y-3 p-4 w-full">
                          <div className="max-w-[200px] mx-auto p-3 rounded-xl bg-[#14211a] border border-emerald-500/30 text-left space-y-1.5 font-mono text-[10px] text-white/80 shadow-md relative">
                            <div className="flex justify-between items-center text-emerald-400 font-bold border-b border-white/10 pb-1">
                              <span>WAVE CI</span>
                              <span>SUCCÈS ✅</span>
                            </div>
                            <p className="text-white font-bold text-xs">25 000 FCFA</p>
                            <p className="text-white/60 break-all">TID: CI240901847192</p>
                            <p className="text-white/40">À: Boutique Abidjan</p>
                            {/* Scanning indicator */}
                            <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-400/60 rounded-xl pointer-events-none" />
                          </div>
                          <p className="text-xs font-bold text-white">Reçu Mobile Money Analysé</p>
                        </div>
                      )}

                      {activeVisionPreset === "chat" && (
                        <div className="text-center space-y-3 p-4">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-2xl bg-[#1f2c34] border border-emerald-500/30 flex items-center justify-center shadow-lg relative">
                            <span className="text-3xl sm:text-4xl">👜</span>
                            <div className="absolute -bottom-2 bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">
                              Match Produit ID #402
                            </div>
                          </div>
                          <p className="text-xs font-bold text-white">"Vous avez ce modèle en rouge ?"</p>
                          <p className="text-[10px] sm:text-[11px] text-white/40">Correspondance exacte dans votre stock</p>
                        </div>
                      )}
                    </div>

                    {/* Right: AI Output Extraction & Commercial Action */}
                    <div className="lg:col-span-7 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 p-3.5 sm:p-5 flex flex-col justify-between space-y-4 w-full min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Bot size={16} className="text-emerald-400 shrink-0" />
                            <span className="text-xs font-black uppercase tracking-wider text-white">Extraction & Réponse IA Vision</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            Prêt pour WhatsApp
                          </span>
                        </div>

                        {activeVisionPreset === "product" && (
                          <div className="space-y-3 mt-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-white/40 block">Titre Détecté</span>
                                <span className="font-black text-white truncate block">Sneakers Nike Air</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-white/40 block">Prix Estimé/Stock</span>
                                <span className="font-black text-emerald-400">35 000 FCFA</span>
                              </div>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-white/80 leading-relaxed break-words">
                              <p className="font-bold text-emerald-400 text-[11px] mb-1">Argumentaire Commercial Généré :</p>
                              "Disponible immédiatement en pointures 40 à 45 ! Semelle ultra confort avec amorti bulle d'air. Livraison express offerte sur Abidjan aujourd'hui."
                            </div>
                          </div>
                        )}

                        {activeVisionPreset === "receipt" && (
                          <div className="space-y-3 mt-3">
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                                <span className="text-xs font-bold text-white">Validation Anti-Fraude Reçu</span>
                              </div>
                              <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-emerald-400 text-black">Authentique 100%</span>
                            </div>
                            <div className="space-y-1.5 text-xs text-white/70 font-mono bg-black/60 p-3 rounded-xl border border-white/5 break-words">
                              <p>• Montant Extrait : <strong className="text-white">25 000 FCFA</strong></p>
                              <p>• ID Transaction : <strong className="text-emerald-400 break-all">CI240901847192</strong></p>
                              <p>• Statut Commande : <strong className="text-emerald-400">Marquée Payée & Prête</strong></p>
                            </div>
                          </div>
                        )}

                        {activeVisionPreset === "chat" && (
                          <div className="space-y-3 mt-3">
                            <div className="p-3 rounded-xl bg-[#202c33] border border-white/10 text-white text-xs leading-relaxed break-words">
                              <p className="text-[10px] text-emerald-400 font-bold mb-1">Message Réponse WhatsApp Automatique :</p>
                              "Bonjour ! Oui absolument, notre sac bandoulière en cuir est bien disponible en Rouge Bordeaux et Noir Intense à 18 500 FCFA. Souhaitez-vous le réserver avec livraison aujourd'hui ? ✨"
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-white/40 flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                              Envoyé automatiquement en 1.4s sur WhatsApp sans intervention manuelle.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10 flex-wrap gap-2">
                        <button
                          onClick={() => triggerVisionScan(activeVisionPreset)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <RotateCw size={14} className={isVisionScanning ? "animate-spin" : ""} />
                          Ré-exécuter le scan
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onLaunchDemo?.();
                          }}
                          className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-400 text-black font-black uppercase text-[10px] sm:text-[11px] tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          Activer sur ma Boutique <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Pillars of Vision Technology */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Camera size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">Scan de Catalogue Express</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Prenez votre rayon ou stock en photo. Vendeur IA découpe les articles, renseigne les catégories et génère les fiches produits complètes.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <ShieldCheck size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">OCR Reçus Anti-Fraude</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Vérifie l'authenticité des captures d'écran de virements Orange Money, Wave, MTN et Moov. Empêche les faux reçus retouchés.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Layers size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">Reconnaissance Photos Clients</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Vos clients envoient une photo de ce qu'ils cherchent ? L'IA identifie instantanément l'article équivalent dans votre boutique.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MARKETING HUB */}
            {activeTab === "marketing" && (
              <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#18140a] to-black/60 border border-amber-500/25 w-full min-w-0">
                  <div className="space-y-2 max-w-xl min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                      <Megaphone size={13} />
                      <span>Croissance & Relances Automatisées</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight break-words">
                      Marketing <span className="text-amber-400">Hub™</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium">
                      Décuplez votre chiffre d'affaires avec des relances prédictives WhatsApp, des broadcasts ultra-ciblés et des affiches promotionnelles créées par IA.
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                      <p className="text-lg sm:text-2xl font-black text-amber-400 leading-none">+340%</p>
                      <p className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-white/40 mt-1">Conversions Paniers</p>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                      <p className="text-lg sm:text-2xl font-black text-white leading-none">98%</p>
                      <p className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-white/40 mt-1">Ouverture WhatsApp</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Broadcast & Campaign Simulator */}
                <div className="space-y-4 w-full min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
                      <Flame size={14} className="text-amber-400" />
                      Simulateur de Campagne WhatsApp :
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#100d07] border border-amber-500/20 w-full min-w-0">
                    {/* Left Campaign Controls */}
                    <div className="lg:col-span-5 space-y-4 w-full min-w-0">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-white/50">Segment d'Audience Cible :</label>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => setActiveMarketingAudience("cart")}
                            className={cn(
                              "p-3 rounded-xl text-left transition-all cursor-pointer border flex items-center justify-between gap-2",
                              activeMarketingAudience === "cart"
                                ? "bg-amber-500/20 border-amber-500/50 text-white"
                                : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">🛒 Paniers Abandonnés (&lt; 24h)</p>
                              <p className="text-[10px] text-white/40 truncate">Clients ayant demandé le prix sans finaliser</p>
                            </div>
                            <span className="text-xs font-black text-amber-400 shrink-0">42 clients</span>
                          </button>

                          <button
                            onClick={() => setActiveMarketingAudience("vip")}
                            className={cn(
                              "p-3 rounded-xl text-left transition-all cursor-pointer border flex items-center justify-between gap-2",
                              activeMarketingAudience === "vip"
                                ? "bg-amber-500/20 border-amber-500/50 text-white"
                                : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">💎 Clients VIP / Récurrents</p>
                              <p className="text-[10px] text-white/40 truncate">Plus de 2 commandes passées ce mois</p>
                            </div>
                            <span className="text-xs font-black text-amber-400 shrink-0">18 clients</span>
                          </button>

                          <button
                            onClick={() => setActiveMarketingAudience("inactive")}
                            className={cn(
                              "p-3 rounded-xl text-left transition-all cursor-pointer border flex items-center justify-between gap-2",
                              activeMarketingAudience === "inactive"
                                ? "bg-amber-500/20 border-amber-500/50 text-white"
                                : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                            )}
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">💤 Inactifs (Plus de 30 jours)</p>
                              <p className="text-[10px] text-white/40 truncate">Réactivation avec offre exclusive</p>
                            </div>
                            <span className="text-xs font-black text-amber-400 shrink-0">89 clients</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-white/50">Tonalité du Message :</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setActiveMarketingTone("promo")}
                            className={cn(
                              "p-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border",
                              activeMarketingTone === "promo"
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                : "bg-white/5 border-white/5 text-white/50"
                            )}
                          >
                            🎁 Promo
                          </button>
                          <button
                            onClick={() => setActiveMarketingTone("friendly")}
                            className={cn(
                              "p-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border",
                              activeMarketingTone === "friendly"
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                : "bg-white/5 border-white/5 text-white/50"
                            )}
                          >
                            💬 Doux
                          </button>
                          <button
                            onClick={() => setActiveMarketingTone("urgent")}
                            className={cn(
                              "p-2 rounded-xl text-center text-xs font-bold transition-all cursor-pointer border",
                              activeMarketingTone === "urgent"
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                : "bg-white/5 border-white/5 text-white/50"
                            )}
                          >
                            ⚡ Flash
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right WhatsApp Live Preview */}
                    <div className="lg:col-span-7 rounded-xl sm:rounded-2xl bg-[#0b141a] border border-white/10 p-3.5 sm:p-4 flex flex-col justify-between space-y-4 w-full min-w-0">
                      <div className="space-y-3 min-w-0">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <WhatsAppIcon size={18} className="shrink-0" />
                            <span className="text-xs font-black uppercase text-white">Aperçu Broadcast WhatsApp</span>
                          </div>
                          <span className="text-[10px] text-amber-400 font-mono">Délivrance : 100%</span>
                        </div>

                        {/* WhatsApp Message Bubble Simulation */}
                        <div className="p-3.5 rounded-2xl bg-[#005c4b] text-white text-xs leading-relaxed space-y-2 max-w-full shadow-md break-words">
                          {activeMarketingAudience === "cart" && (
                            <>
                              <p className="font-bold">Bonjour Ibrahim ! 👋</p>
                              <p>Votre article <span className="underline font-semibold">Sneakers Nike Air Max</span> est toujours mis de côté à la boutique.</p>
                              {activeMarketingTone === "promo" && (
                                <p className="bg-black/20 p-2 rounded-lg text-emerald-300 font-medium">
                                  🎁 Profitez de <strong>-10% aujourd'hui</strong> avec le code <strong>FLASH10</strong> !
                                </p>
                              )}
                              {activeMarketingTone === "urgent" && (
                                <p className="bg-black/20 p-2 rounded-lg text-amber-300 font-medium">
                                  ⚠️ Dernières paires en stock ! Nous libérons les réservations ce soir à 18h.
                                </p>
                              )}
                              {activeMarketingTone === "friendly" && (
                                <p className="text-white/90">
                                  Avez-vous besoin d'une confirmation sur la pointure ou l'adresse de livraison ?
                                </p>
                              )}
                              <p className="text-[10px] text-white/50 text-right">14:32 • Envoyé par Vendeur IA</p>
                            </>
                          )}

                          {activeMarketingAudience === "vip" && (
                            <>
                              <p className="font-bold">Privilège Client VIP ⭐</p>
                              <p>Cher(e) client(e), nous venons de recevoir nos nouvelles collections en avant-première avant publication générale !</p>
                              <p className="bg-black/20 p-2 rounded-lg text-amber-300 font-medium">
                                🚀 Découvrez les nouveautés avec livraison gratuite garantie.
                              </p>
                              <p className="text-[10px] text-white/50 text-right">14:32 • Envoyé par Vendeur IA</p>
                            </>
                          )}

                          {activeMarketingAudience === "inactive" && (
                            <>
                              <p className="font-bold">Vous nous manquez ! ✨</p>
                              <p>Cela fait un moment que nous n'avons pas eu de vos nouvelles. Pour fêter votre retour, nous vous offrons un cadeau surprise sur votre prochaine commande !</p>
                              <p className="text-[10px] text-white/50 text-right">14:32 • Envoyé par Vendeur IA</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <TrendingUp size={14} className="text-amber-400 shrink-0" />
                          <span>ROI : <strong>+180 000 FCFA</strong></span>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            onLaunchDemo?.();
                          }}
                          className="px-3.5 sm:px-4 py-2 rounded-xl bg-amber-400 text-black font-black uppercase text-[10px] sm:text-[11px] tracking-wider hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          Lancer une Campagne <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Core Marketing Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <BarChart3 size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">Relances Prédictives</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      L'IA détecte le créneau d'attention optimal de chaque acheteur pour maximiser le taux de réponse sans paraître intrusif.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Sparkles size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">Créateur d'Affiches IA</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Générez en quelques secondes des visuels de promotion percutants adaptés aux Stories WhatsApp, Instagram et TikTok.
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Lock size={18} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">Anti-Spam & Délivrabilité</h4>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Algorithme de lissage des envois respectant les quotas stricts de WhatsApp pour préserver votre numéro et éviter tout blocage.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: API WHATSAPP */}
            {activeTab === "api" && (
              <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-950/40 via-[#0a141a] to-black/60 border border-sky-500/25 w-full min-w-0">
                  <div className="space-y-2 max-w-xl min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest">
                      <Code2 size={13} />
                      <span>Passerelle Développeur & Cloud</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight break-words">
                      API <span className="text-sky-400">WhatsApp Engine</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium">
                      Intégrez la puissance de vente de Vendeur IA directement dans vos applications, boutiques en ligne (WooCommerce, Shopify) et systèmes ERP via notre API REST et nos Webhooks temps réel.
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                      <p className="text-lg sm:text-2xl font-black text-sky-400 leading-none">99.99%</p>
                      <p className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-white/40 mt-1">SLA Haute Disponibilité</p>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center flex-1">
                      <p className="text-lg sm:text-2xl font-black text-white leading-none">12ms</p>
                      <p className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-white/40 mt-1">Latence Passerelle</p>
                    </div>
                  </div>
                </div>

                {/* Interactive Code Playground */}
                <div className="space-y-4 w-full min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
                      <Terminal size={14} className="text-sky-400" />
                      Playground Développeur API :
                    </h4>
                    <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                      {(["curl", "node", "python", "php"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setActiveCodeLang(lang)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                            activeCodeLang === lang
                              ? "bg-sky-500 text-black shadow-sm"
                              : "text-white/40 hover:text-white"
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Editor Preview Box */}
                  <div className="rounded-xl sm:rounded-2xl bg-[#060b0e] border border-sky-500/20 overflow-hidden font-mono text-xs shadow-2xl w-full min-w-0">
                    <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-white/40 text-[10px] sm:text-[11px] truncate">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block shrink-0" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block shrink-0" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shrink-0" />
                        <span className="ml-1 text-white/60 font-mono truncate">POST /api/commerce/messages/send</span>
                      </div>
                      <button
                        onClick={() => {
                          const code = activeCodeLang === "curl"
                            ? `curl -X POST https://api.vendeur-ia.com/v1/messages \\
  -H "Authorization: Bearer vk_live_948271038" \\
  -H "Content-Type: application/json" \\
  -d '{"recipient": "+22507000000", "aiSalesAgent": true, "intent": "auto_close"}'`
                            : activeCodeLang === "node"
                            ? `import { VendeurIA } from '@vendeur-ia/sdk';
const client = new VendeurIA({ apiKey: process.env.VENDEUR_KEY });

const result = await client.messages.dispatch({
  to: '+22507000000',
  autoNegotiate: true,
  enableVoiceResponse: true
});`
                            : activeCodeLang === "python"
                            ? `from vendeur_ia import VendeurClient

client = VendeurClient(api_key="vk_live_948271038")
response = client.sales.dispatch(
    to="+22507000000",
    enable_vision=True
)`
                            : `<?php
$vendeur = new VendeurIA\\Client('vk_live_948271038');
$res = $vendeur->messages->send([
    'to' => '+22507000000',
    'auto_close' => true
]);`;
                          handleCopy(code);
                        }}
                        className="flex items-center gap-1.5 text-[10px] text-white/60 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        <span>{copiedCode ? "Copié !" : "Copier"}</span>
                      </button>
                    </div>

                    <div className="p-3 sm:p-5 overflow-x-auto text-sky-200/90 leading-relaxed text-[10px] sm:text-xs max-w-full">
                      {activeCodeLang === "curl" && (
                        <pre className="whitespace-pre overflow-x-auto">{`curl -X POST https://api.vendeur-ia.com/v1/messages \\
  -H "Authorization: Bearer vk_live_948271038" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+2250701020304",
    "agentMode": "autonomous_sales",
    "enableVision": true
  }'`}</pre>
                      )}
                      {activeCodeLang === "node" && (
                        <pre className="whitespace-pre overflow-x-auto">{`import { VendeurClient } from '@vendeur-ia/node-sdk';

const vendeur = new VendeurClient({ apiKey: 'vk_live_948271038' });

vendeur.webhooks.on('order.payment_verified', async (event) => {
  console.log('Paiement Mobile Money validé :', event.data);
});`}</pre>
                      )}
                      {activeCodeLang === "python" && (
                        <pre className="whitespace-pre overflow-x-auto">{`from vendeur_ia import VendeurClient

client = VendeurClient(api_key="vk_live_948271038")
conversation = client.conversations.create(
    phone="+2250701020304",
    initial_intent="CATALOG_INQUIRY"
)`}</pre>
                      )}
                      {activeCodeLang === "php" && (
                        <pre className="whitespace-pre overflow-x-auto">{`<?php
require_once 'vendor/autoload.php';

$vendeur = new \\VendeurIA\\Client('vk_live_948271038');
$order = $vendeur->orders->createFromWhatsApp([
    'phone' => '+2250701020304'
]);`}</pre>
                      )}
                    </div>
                  </div>
                </div>

                {/* Webhook & Event Stream Simulator */}
                <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 space-y-3 sm:space-y-4 w-full min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase text-white">Événements Webhook en Direct :</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setWebhookEvent("message.received")}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer",
                          webhookEvent === "message.received" ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "text-white/40 hover:text-white"
                        )}
                      >
                        message.received
                      </button>
                      <button
                        onClick={() => setWebhookEvent("payment.receipt_detected")}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer",
                          webhookEvent === "payment.receipt_detected" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-white/40 hover:text-white"
                        )}
                      >
                        payment.receipt_detected
                      </button>
                      <button
                        onClick={() => setWebhookEvent("order.closed")}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-mono transition-all cursor-pointer",
                          webhookEvent === "order.closed" ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "text-white/40 hover:text-white"
                        )}
                      >
                        order.closed
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/80 font-mono text-[10px] sm:text-[11px] text-white/70 overflow-x-auto max-w-full">
                    {webhookEvent === "message.received" && (
                      <pre className="text-sky-300 whitespace-pre overflow-x-auto">{`{
  "event": "message.received",
  "sender": "+2250709080706",
  "content": "Bonjour, le sac en cuir rouge est disponible ?",
  "ai_intent": "PRODUCT_STOCK_CHECK",
  "ai_response_time_ms": 340
}`}</pre>
                    )}
                    {webhookEvent === "payment.receipt_detected" && (
                      <pre className="text-emerald-300 whitespace-pre overflow-x-auto">{`{
  "event": "payment.receipt_detected",
  "provider": "WAVE_CI",
  "amount": 25000,
  "currency": "XOF",
  "transaction_id": "CI240901847192",
  "anti_fraud_status": "VERIFIED_AUTHENTIC"
}`}</pre>
                    )}
                    {webhookEvent === "order.closed" && (
                      <pre className="text-purple-300 whitespace-pre overflow-x-auto">{`{
  "event": "order.closed",
  "order_id": "ORD-2026-9812",
  "customer_name": "Aïcha Diallo",
  "delivery_zone": "Abidjan, Cocody Angré",
  "total_paid": 25000
}`}</pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SIMULATEUR */}
            {activeTab === "simulator" && (
              <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/40 via-[#071710] to-black/60 border border-emerald-500/25 w-full min-w-0">
                  <div className="space-y-2 max-w-xl min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <Cpu size={13} />
                      <span>Laboratoire d'Essai & Simulation</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight break-words">
                      Simulateur <span className="text-emerald-400">Commercial Live</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-medium">
                      Testez immédiatement comment Vendeur IA répond à vos prospects, négocie les tarifs, surmonte les objections et finalise la vente en direct sans configurer de numéro.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onLaunchDemo?.();
                    }}
                    className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-emerald-400 text-black font-black uppercase text-xs tracking-wider hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2 shrink-0 cursor-pointer w-full md:w-auto"
                  >
                    Tester le Simulateur Live <Play size={16} fill="currentColor" />
                  </button>
                </div>

                {/* Scenario Tester Cards */}
                <div className="space-y-3 w-full min-w-0">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/70">
                    Scénarios Commerciaux Pré-configurés à Essayer :
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 w-full min-w-0">
                    <div
                      onClick={() => {
                        onClose();
                        onLaunchDemo?.();
                      }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 uppercase">1. Négociation de Prix</span>
                        <ChevronRight size={14} className="text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs font-bold text-white">"C'est trop cher, vous pouvez faire un rabais ?"</p>
                      <p className="text-[11px] text-white/40">
                        Démontre comment l'IA valorise la qualité du produit tout en proposant une remise contrôlée.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        onClose();
                        onLaunchDemo?.();
                      }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 uppercase">2. Urgence Livraison</span>
                        <ChevronRight size={14} className="text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs font-bold text-white">"Est-ce livrable dans 2 heures à Cocody ?"</p>
                      <p className="text-[11px] text-white/40">
                        Vérifie la zone géographique et coordonne les livreurs partenaires instantanément.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        onClose();
                        onLaunchDemo?.();
                      }}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer group space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 uppercase">3. Validation Virement</span>
                        <ChevronRight size={14} className="text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-xs font-bold text-white">"J'ai envoyé l'argent par Wave, voici le reçu"</p>
                      <p className="text-[11px] text-white/40">
                        Reconnaissance instantanée du montant et validation de la commande en temps réel.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer CTA */}
          <div className="px-4 py-3 sm:px-8 sm:py-4 bg-[#08120d] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">Sans carte de crédit requise • Essai instantané</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none h-10 sm:h-11 px-4 sm:px-5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  onClose();
                  onLaunchDemo?.();
                }}
                className="flex-1 sm:flex-none h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Démarrer Vendeur IA <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
