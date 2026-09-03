import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Phone,
  Zap,
  MessageSquare,
  Copy,
  Check
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { stripActionTags } from "@/lib/utils";
import { WhatsAppTypingIndicator } from "@/components/ui/WhatsAppTypingIndicator";
import { AssistantIcon } from "@/components/ui/AssistantIcon";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: "customer" | "ai";
  text: string;
  timestamp: Date;
}

interface VendeurIAPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: any;
}

const SAMPLE_QUESTIONS = [
  "Bonjour, quels sont vos produits disponibles ?",
  "Quels sont vos prix et vos frais de livraison ?",
  "Comment commander un article ?",
  "Acceptez-vous le paiement par Mobile Money ?"
];

export function VendeurIAPlaygroundModal({ isOpen, onClose, merchant }: VendeurIAPlaygroundModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionId = useRef(`simulator_${merchant?._id}_${Date.now()}`).current;
  const whatsappNumber = merchant?.whatsappNumber || merchant?.phone || "";
  const waTestLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Bonjour Vendeur IA ! Je teste ton fonctionnement.")}`;
  const isPaidActive = merchant?.subscription?.status === "active";

  // Initial greeting from AI
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeText = isPaidActive
        ? `Bonjour ! 👋 Je suis l'assistant Vendeur IA de **${merchant?.businessName || merchant?.storeName || "votre boutique"}**. Je suis actif et prêt à répondre à vos clients sur WhatsApp !`
        : `Bonjour ! 👋 Je suis prêt dans ce **Banc d'Essai** ! Posez-moi des questions pour voir comment je répondrais à vos clients. *Note : Je ne répondrai sur votre vrai WhatsApp qu'une fois votre forfait activé.*`;

      setMessages([
        {
          id: "welcome",
          role: "ai",
          text: welcomeText,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, merchant, isPaidActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "customer",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    try {
      // Send message to public web-chat simulator route
      const historyPayload = messages.map((m) => ({
        role: m.role === "customer" ? "user" : "model",
        text: m.text
      }));

      const res = await apiClient.post("/api/commerce/web-chat/process", {
        merchantId: merchant?._id,
        sessionId,
        message: text,
        history: historyPayload
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: res.data.reply || "Désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error("Erreur lors de la génération de la réponse.");
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: "⚠️ [Mode Simulateur] Impossible d'obtenir la réponse de Vendeur IA pour le moment. Vérifiez votre connexion.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: "ai",
        text: `Conversation réinitialisée. Posez une nouvelle question à Vendeur IA de **${merchant?.businessName || merchant?.storeName || "votre boutique"}** !`,
        timestamp: new Date()
      }
    ]);
  };

  const handleCopyWATestLink = () => {
    navigator.clipboard.writeText(waTestLink);
    setCopied(true);
    toast.success("Lien de test WhatsApp copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[75] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-vendeur-coal border-0 sm:border sm:border-slate-200 sm:dark:border-vendeur-emerald/30 rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[90vh] sm:max-h-[750px] text-slate-900 dark:text-white"
        >
          {/* Mobile Sheet Indicator */}
          <div className="w-12 h-1 bg-slate-300 dark:bg-white/20 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

          {/* Top Header */}
          <div className="p-3.5 sm:p-5 md:p-6 bg-slate-50 dark:bg-vendeur-bg border-b border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 flex items-center justify-center">
                <AssistantIcon size="100%" color="#10B981" withBackground={false} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    Banc d'Essai IA
                  </h3>
                  <span className={cn(
                    "inline-flex items-center gap-1 border text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                    isPaidActive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-vendeur-emerald"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", isPaidActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                    {isPaidActive ? "IA en Ligne" : "Mode Simulateur"}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-white/50 font-medium truncate">
                  {merchant?.businessName || merchant?.storeName || "Votre boutique"} • Simulateur
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleResetChat}
                title="Réinitialiser le chat"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Dual Action Strip (Real WA vs Simulator) */}
          <div className={cn(
            "border-b p-2.5 px-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs shrink-0",
            isPaidActive
              ? "bg-emerald-50 dark:bg-vendeur-emerald/10 border-emerald-200 dark:border-vendeur-emerald/20"
              : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
          )}>
            <div className={cn(
              "flex items-center gap-2 font-bold text-[11px] sm:text-xs",
              isPaidActive ? "text-emerald-800 dark:text-vendeur-emerald" : "text-amber-800 dark:text-amber-400"
            )}>
              <Zap size={14} className={cn(isPaidActive && "animate-pulse", "shrink-0")} />
              <span className="truncate">
                {isPaidActive
                  ? "WhatsApp connecté & IA active !"
                  : "IA en attente de forfait (Muette sur WhatsApp)"}
              </span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyWATestLink}
                className="flex-1 sm:flex-initial h-9 sm:h-8 px-3 rounded-lg bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 hover:border-emerald-500 dark:hover:border-vendeur-emerald/40 text-slate-800 dark:text-white/90 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all truncate shadow-sm cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-600 dark:text-vendeur-emerald shrink-0" /> : <Copy size={12} className="shrink-0" />}
                <span className="truncate">{copied ? "Copié !" : "Copier lien"}</span>
              </button>
              {whatsappNumber && (
                <a
                  href={waTestLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial h-9 sm:h-8 px-3 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-105 transition-all shadow-md truncate"
                >
                  <MessageSquare size={12} className="shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50 dark:bg-transparent">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "customer" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black",
                    msg.role === "customer"
                      ? "bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white shadow-sm"
                      : "bg-transparent p-0"
                  )}
                >
                  {msg.role === "customer" ? <User size={16} /> : <AssistantIcon size="100%" color="#10B981" withBackground={false} />}
                </div>

                <div
                  className={cn(
                    "p-4 rounded-2xl text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-md",
                    msg.role === "customer"
                      ? "bg-emerald-500 text-slate-950 rounded-tr-none font-medium"
                      : "bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-tl-none shadow-sm"
                  )}
                >
                  {stripActionTags(msg.text)}
                  <div
                    className={cn(
                      "text-[9px] mt-2 text-right font-mono",
                      msg.role === "customer" ? "text-slate-900/60" : "text-slate-400 dark:text-white/30"
                    )}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <WhatsAppTypingIndicator variant="playground" />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="p-3 px-4 bg-slate-50 dark:bg-vendeur-bg border-t border-slate-200 dark:border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-vendeur-emerald/10 border border-slate-200 hover:border-emerald-300 dark:border-white/10 dark:hover:border-vendeur-emerald/30 text-[10px] text-slate-700 hover:text-emerald-700 dark:text-white/70 dark:hover:text-vendeur-emerald font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                💬 {q}
              </button>
            ))}
          </div>

          {/* Chat Input Field */}
          <div className="p-3 sm:p-4 bg-slate-50 dark:bg-vendeur-bg border-t border-slate-200 dark:border-white/10 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tapez un message de test comme un client..."
                disabled={isLoading}
                className="flex-1 h-12 px-4 rounded-2xl bg-white dark:bg-black/60 border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-emerald-500 outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
