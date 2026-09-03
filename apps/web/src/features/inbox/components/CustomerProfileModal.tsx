import React, { useState } from "react";
import { X, Phone, Copy, Check, Sparkles, CreditCard, ShoppingCart, RefreshCw, User, ShieldCheck } from "lucide-react";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  customer?: {
    _id?: string;
    name?: string;
    phone?: string;
    avatarUrl?: string | null;
    platform?: string;
    loyaltyPoints?: number;
    location?: string;
  };
  merchantName?: string;
  onOpenOrderModal?: () => void;
  onOpenFastPayModal?: () => void;
  onTriggerFollowup?: () => void;
}

export function CustomerProfileModal({
  isOpen,
  onClose,
  conversationId,
  customer,
  merchantName,
  onOpenOrderModal,
  onOpenFastPayModal,
  onTriggerFollowup
}: CustomerProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();

  const refreshAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!conversationId) return null;
      const res = await apiClient.post(`/api/commerce/conversations/${conversationId}/refresh-avatar`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (data?.avatarUrl) {
        setImageError(false);
        toast.success("Photo de profil WhatsApp synchronisée !");
      } else {
        toast.info("Aucune nouvelle photo publique trouvée sur WhatsApp");
      }
    },
    onError: () => {
      toast.error("Impossible de rafraîchir la photo WhatsApp");
    }
  });

  if (!isOpen || !customer) return null;

  const displayName = customer.name?.trim() || formatDisplayPhone(customer.phone, "CI") || "Client WhatsApp";
  const displayPhone = formatDisplayPhone(customer.phone, "CI");
  const initial = displayName.charAt(0).toUpperCase();

  const handleCopy = () => {
    if (!customer.phone) return;
    const clean = customer.phone.replace(/@s\.whatsapp\.net/, "").replace(/\D/g, "");
    navigator.clipboard.writeText(clean);
    setCopied(true);
    toast.success(`Numéro ${clean} copié !`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-white dark:bg-[#182229] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white flex items-center justify-center border border-white/20 transition-all active:scale-95 cursor-pointer shadow-md"
        >
          <X size={18} />
        </button>

        {/* Large Profile Picture Header */}
        <div className="relative h-64 w-full bg-slate-100 dark:bg-[#111b21] flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-white/10 group">
          {customer.avatarUrl && !imageError ? (
            <img
              src={customer.avatarUrl}
              alt={displayName}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center font-black text-4xl text-emerald-600 dark:text-emerald-400 shadow-xl">
              {initial !== "+" ? initial : <User size={48} />}
            </div>
          )}

          {/* Refresh Avatar Button */}
          {conversationId && (
            <button
              onClick={() => refreshAvatarMutation.mutate()}
              disabled={refreshAvatarMutation.isPending}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-950 text-white border border-white/20 text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              title="Synchroniser la photo avec WhatsApp"
            >
              <RefreshCw size={12} className={refreshAvatarMutation.isPending ? "animate-spin text-emerald-400" : "text-emerald-400"} />
              <span>{refreshAvatarMutation.isPending ? "Sync..." : "Sync Photo WhatsApp"}</span>
            </button>
          )}
        </div>

        {/* Profile Details */}
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{displayName}</h3>
              {(customer.loyaltyPoints || 0) >= 50 && (
                <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded uppercase">
                  Client VIP
                </span>
              )}
            </div>
            {displayPhone && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
                <Phone size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-mono">{displayPhone}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-emerald-600 dark:text-white/40 dark:hover:text-emerald-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Copier le numéro"
                >
                  {copied ? <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
            {onTriggerFollowup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerFollowup();
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles size={16} className="mb-1" />
                <span className="text-[10px] font-bold">Relance IA</span>
              </button>
            )}

            {onOpenFastPayModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFastPayModal();
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <CreditCard size={16} className="mb-1" />
                <span className="text-[10px] font-bold">Fast Pay</span>
              </button>
            )}

            {onOpenOrderModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrderModal();
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20 font-black"
              >
                <ShoppingCart size={16} className="mb-1" />
                <span className="text-[10px] font-black">Vendre</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
