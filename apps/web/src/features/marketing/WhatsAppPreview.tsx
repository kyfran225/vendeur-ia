import React from "react";
import { CheckCheck, MessageCircle, Store, ShieldCheck } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { stripActionTags } from "@/lib/utils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WhatsAppPreviewProps {
  product?: any;
  text: string;
  businessName?: string;
  sampleCustomerName?: string;
}

export function WhatsAppPreview({
  product,
  text,
  businessName = "Votre Boutique",
  sampleCustomerName = "Marc"
}: WhatsAppPreviewProps) {
  // Replace {{name}} with sample customer name and strip internal action tags
  const formattedText = text ? stripActionTags(text.replace(/{{name}}/g, sampleCustomerName)) : "";

  const currentTime = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0b141a] text-white flex flex-col animate-in fade-in duration-300 font-sans">
      {/* WhatsApp Header */}
      <div className="bg-[#1f2c34] px-3.5 py-2.5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#00a884] flex items-center justify-center text-black font-black text-xs shadow">
            <Store size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">{businessName}</span>
              <ShieldCheck size={12} className="text-[#00a884]" />
            </div>
            <span className="text-[10px] text-[#00a884] font-medium leading-none block">Compte professionnel • En ligne</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-white/70">Aperçu direct</span>
        </div>
      </div>

      {/* WhatsApp Chat Area */}
      <div className="p-3.5 sm:p-4 bg-[#0b141a] min-h-[180px] flex flex-col justify-end relative bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Date pill */}
        <div className="text-center mb-3">
          <span className="px-2.5 py-0.5 rounded-md bg-[#182229] text-[9px] font-bold text-white/50 shadow-sm uppercase tracking-wider">
            Aujourd'hui
          </span>
        </div>

        {/* Message Bubble (Outgoing) */}
        <div className="self-end max-w-[88%] sm:max-w-[80%] bg-[#005c4b] rounded-2xl rounded-tr-xs p-2 sm:p-2.5 shadow-md space-y-2 relative border border-[#00705b]/50">
          {/* Product Image preview */}
          {product?.images?.[0] && (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/30 border border-white/10">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-black text-white">
                {product.price?.toLocaleString()} {product.currency || "XOF"}
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="text-xs sm:text-[13px] text-white/95 leading-relaxed whitespace-pre-wrap break-words font-normal px-0.5">
            {formattedText || (
              <span className="italic text-white/40">Le message rédigé apparaîtra ici...</span>
            )}
          </div>

          {/* Time & Double Checkmark */}
          <div className="flex items-center justify-end gap-1 text-[10px] text-white/60 pt-0.5">
            <span>{currentTime}</span>
            <CheckCheck size={14} className="text-[#53bdeb]" />
          </div>
        </div>
      </div>

      {/* WhatsApp Input Bar Mockup */}
      <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-t border-white/5 text-white/30 text-xs">
        <span className="text-[11px] text-white/40">Répondre à ce message pour réserver...</span>
        <MessageCircle size={15} className="text-[#00a884]" />
      </div>
    </div>
  );
}
