import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Settings, Loader2, ShieldCheck, Rocket, HelpCircle } from "lucide-react";
import { FacebookIcon } from "@/components/ui/SocialIcons";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FacebookConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: any;
  onRefresh: () => void;
  onOpenMarketplaceGuide: () => void;
}

export function FacebookConnectionModal({ isOpen, onClose, merchant, onRefresh, onOpenMarketplaceGuide }: FacebookConnectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    pageId: merchant?.facebookConfig?.pageId || "",
    accessToken: merchant?.facebookConfig?.accessToken || ""
  });

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.patch("/api/facebook/config", config);
      toast.success("Configuration Facebook enregistrée ! 🚀");
      onRefresh();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-vendeur-bg border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3.5 sm:space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        <button 
          onClick={onClose} 
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="h-12 w-12 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#1877F2]/30 text-white">
            <FacebookIcon size={24} color="#FFFFFF" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Lier Facebook Pro</h2>
          <p className="text-white/40 text-xs">Automatisez votre Page et Marketplace Business.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-white/40 ml-1 tracking-wider">Page ID</label>
            <input
              className="w-full h-10 sm:h-11 bg-vendeur-coal border border-white/10 rounded-xl px-3.5 text-xs text-white focus:border-blue-500 outline-none transition-all font-mono"
              value={config.pageId}
              onChange={e => setConfig({ ...config, pageId: e.target.value })}
              placeholder="Ex: 102394857..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-white/40 ml-1 tracking-wider">Access Token (Page)</label>
            <textarea
              className="w-full h-16 sm:h-20 bg-vendeur-coal border border-white/10 rounded-xl p-3 text-[11px] text-white focus:border-blue-500 outline-none transition-all font-mono resize-none"
              value={config.accessToken}
              onChange={e => setConfig({ ...config, accessToken: e.target.value })}
              placeholder="EAAG..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !config.pageId || !config.accessToken}
            className="w-full h-11 sm:h-12 bg-blue-600 text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
            Enregistrer ma Page
          </button>
        </div>

        <div className="pt-2 border-t border-white/5">
          <div className="bg-vendeur-emerald/5 border border-vendeur-emerald/20 p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Rocket className="text-vendeur-emerald shrink-0" size={14} />
                <h4 className="font-black text-white text-[11px] sm:text-xs uppercase tracking-tight">Besoin d'aide pour votre Page ?</h4>
              </div>
              <p className="text-[10px] text-white/50 leading-tight">
                Vente sur compte Marketplace personnel ou configuration clé en main.
              </p>
            </div>
            <button
              onClick={onOpenMarketplaceGuide}
              className="w-full sm:w-auto px-3 py-1.5 bg-vendeur-emerald/10 hover:bg-vendeur-emerald/20 border border-vendeur-emerald/30 text-vendeur-emerald text-[10px] sm:text-[11px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95"
            >
              Pack Pro & Guide <HelpCircle size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
