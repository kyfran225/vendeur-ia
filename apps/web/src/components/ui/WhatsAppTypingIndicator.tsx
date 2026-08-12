import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Nouvel indicateur d'état de frappe WhatsApp (Style officiel WhatsApp 2026 / Modern Bubble & Pill)
 * - 3 petits points oscillants animés avec des délais échelonnés.
 * - Peut s'afficher sous forme de bulle de discussion dans le fil de conversation
 *   ou sous forme d'indicateur compact dans l'en-tête.
 */
export function WhatsAppTypingIndicator({
  variant = "bubble",
  label = "en train d'écrire..."
}: {
  variant?: "bubble" | "header" | "pill";
  label?: string;
}) {
  if (variant === "header") {
    return (
      <div className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold tracking-wide">
        <span className="italic">{label}</span>
        <span className="flex items-center gap-1 ml-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.32s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.16s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
        </span>
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className="inline-flex items-center gap-2 bg-[#1f2c34] border border-emerald-500/20 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
        <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">{label}</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.32s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.16s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-bounce" />
        </span>
      </div>
    );
  }

  // Defaut: Bulle de chat WhatsApp (Left-aligned AI Bubble)
  return (
    <div className="flex justify-start mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-[#202c33] border border-white/5 text-white px-4 py-3 rounded-2xl rounded-tl-none shadow-md flex items-center gap-3">
        <span className="flex items-center gap-1.5 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.32s]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.16s]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
        </span>
      </div>
    </div>
  );
}
