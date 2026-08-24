import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Bot, Sparkles } from "lucide-react";
import { Logo } from "./Logo";
import { AssistantIcon } from "./AssistantIcon";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface WhatsAppTypingIndicatorProps {
  variant?: "bubble" | "header" | "pill" | "copilot" | "playground" | "storefront";
  label?: string;
  className?: string;
}

/**
 * Indicateur d'ondulation de frappe Vendeur IA / WhatsApp (Style natif WhatsApp & Vendeur IA 2026)
 * - 3 points émeraudes brillants à ondulation verticale fluide et dynamique (haute visibilité).
 * - Utilisable dans tous les chats : Démo Landing, Sales Inbox, Copilote IA, Simulateur & Web Chat.
 */
export function WhatsAppTypingIndicator({
  variant = "bubble",
  label,
  className
}: WhatsAppTypingIndicatorProps) {
  // 1. Variante Header (en-tête de conversation dans l'inbox)
  if (variant === "header") {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold tracking-wide", className)}>
        <span className="italic">{label || "Vendeur IA est en train d'écrire"}</span>
        <span className="inline-flex items-center gap-1.5 ml-1 pt-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-typing-compact-1 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-typing-compact-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-typing-compact-3 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </span>
      </div>
    );
  }

  // 2. Variante Pill (Badge flottant moderne)
  if (variant === "pill") {
    return (
      <div className={cn("inline-flex items-center gap-2.5 bg-[#1f2c34]/95 border border-emerald-500/30 px-3.5 py-1.5 rounded-full shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300", className)}>
        <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">{label || "En train d'écrire..."}</span>
        <span className="inline-flex items-center gap-1.5 pt-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-typing-compact-1 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-typing-compact-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-typing-compact-3 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </span>
      </div>
    );
  }

  // 3. Variante Copilote IA (Widget Copilote)
  if (variant === "copilot") {
    return (
      <div className={cn("flex items-center gap-3 mr-auto max-w-[85%] min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-300", className)}>
        <div className="w-8 h-8 rounded-xl bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center p-1 text-vendeur-emerald shrink-0">
          <Logo size={16} leftBranchColor="#ffffff" rightBranchColor="#10b981" className="animate-spin" />
        </div>
        <div className="bg-vendeur-slate/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/80 flex items-center gap-3 min-w-0 shadow-lg">
          <div className="flex items-center gap-1.5 shrink-0 pt-2 pb-1 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-vendeur-emerald animate-typing-dot-1" />
            <span className="w-2.5 h-2.5 rounded-full bg-vendeur-emerald animate-typing-dot-2" />
            <span className="w-2.5 h-2.5 rounded-full bg-vendeur-emerald animate-typing-dot-3" />
          </div>
          <span className="text-xs sm:text-[13px] text-white/70 font-medium truncate">
            {label || "Le Copilote analyse votre boutique..."}
          </span>
        </div>
      </div>
    );
  }

  // 4. Variante Playground / Simulateur IA
  if (variant === "playground") {
    return (
      <div className={cn("flex gap-3 mr-auto max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300", className)}>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0">
          <AssistantIcon size="100%" bubbleFillColor="#10B981" withBackground={false} />
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1f2c34]/90 border border-white/10 text-white/70 text-xs flex items-center gap-3 rounded-tl-none shadow-lg">
          <div className="flex items-center gap-1.5 shrink-0 pt-2 pb-1 px-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-typing-dot-1" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-typing-dot-2" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-typing-dot-3" />
          </div>
          <span className="italic text-[11px] sm:text-xs text-white/70 font-medium">
            {label || "Le Vendeur IA compose sa réponse..."}
          </span>
        </div>
      </div>
    );
  }

  // 5. Variante Storefront (Chatbot Web Boutique)
  if (variant === "storefront") {
    return (
      <div className={cn("flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300", className)}>
        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1.5 shrink-0 pt-2 pb-1 px-1">
            <span className="h-2.5 w-2.5 rounded-full bg-vendeur-emerald animate-typing-dot-1" />
            <span className="h-2.5 w-2.5 rounded-full bg-vendeur-emerald animate-typing-dot-2" />
            <span className="h-2.5 w-2.5 rounded-full bg-vendeur-emerald animate-typing-dot-3" />
          </div>
          <span className="text-[11px] font-bold text-vendeur-emerald tracking-wide">
            {label || "Vendeur IA réfléchit..."}
          </span>
        </div>
      </div>
    );
  }

  // 6. Défaut : Bulle de chat WhatsApp (Left-aligned AI Bubble haute visibilité pour Démo & Inbox)
  return (
    <div className={cn("flex justify-start mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300", className)}>
      <div className="bg-[#202c33] border border-white/10 text-white px-4 py-3.5 rounded-2xl rounded-tl-none shadow-xl flex items-center gap-3">
        <span className="flex items-center gap-1.5 pt-2 pb-1 px-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-typing-dot-1" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-typing-dot-2" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-typing-dot-3" />
        </span>
        {label && (
          <span className="text-xs text-white/60 font-medium italic pr-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
