import React, { useState } from "react";
import { X, Facebook, Settings, Loader2, ShieldCheck, Rocket, HelpCircle } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-vendeur-bg border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center space-y-4">
          <div className="h-20 w-20 bg-blue-600/10 border border-blue-600/20 rounded-[2rem] flex items-center justify-center mx-auto">
            <Facebook className="text-blue-500" size={40} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Lier Facebook Pro</h2>
          <p className="text-white/40 text-sm">Automatisez votre Page et Marketplace Business.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/40 ml-1 tracking-widest">Page ID</label>
            <input
              className="w-full h-14 bg-vendeur-coal border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-blue-500 outline-none transition-all font-mono"
              value={config.pageId}
              onChange={e => setConfig({ ...config, pageId: e.target.value })}
              placeholder="Ex: 102394857..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/40 ml-1 tracking-widest">Access Token (Page)</label>
            <textarea
              className="w-full h-32 bg-vendeur-coal border border-white/5 rounded-2xl p-6 text-[10px] text-white focus:border-blue-500 outline-none transition-all font-mono resize-none"
              value={config.accessToken}
              onChange={e => setConfig({ ...config, accessToken: e.target.value })}
              placeholder="EAAG..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !config.pageId || !config.accessToken}
            className="w-full h-16 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
            Enregistrer ma Page
          </button>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
           <div className="bg-vendeur-emerald/5 border border-vendeur-emerald/20 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                 <Rocket className="text-vendeur-emerald" size={20} />
                 <h4 className="font-black text-white text-xs uppercase tracking-tight">Besoin d'aide pour votre Page ?</h4>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                 Vous n'avez pas de Page Business ou vous vendez sur un compte Marketplace personnel ?
              </p>
              <button
                 onClick={onOpenMarketplaceGuide}
                 className="flex items-center gap-2 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-transform"
              >
                 Découvrir le Pack Pro & Guide Marketplace <HelpCircle size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
