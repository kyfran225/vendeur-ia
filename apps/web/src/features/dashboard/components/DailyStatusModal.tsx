import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Send,
  RefreshCw,
  Share2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  ShoppingBag
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

interface StatusItem {
  headline: string;
  copyText: string;
  productName?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
}

interface DailyStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyStatusModal({ isOpen, onClose }: DailyStatusModalProps) {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingToPhone, setSendingToPhone] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/api/commerce/whatsapp-status/pack");
      if (res.data?.pack && Array.isArray(res.data.pack)) {
        setStatuses(res.data.pack);
      } else {
        setStatuses([]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Impossible de générer vos statuts du jour.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Texte du statut copié dans le presse-papier !");
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleShareToWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank");
  };

  const handleSendToMyWhatsApp = async () => {
    setSendingToPhone(true);
    try {
      const res = await apiClient.post("/api/commerce/whatsapp-status/send-to-me");
      toast.success(res.data?.message || "Pack de statuts envoyé sur votre WhatsApp !");
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Erreur lors de l'envoi sur WhatsApp";
      toast.error(errMsg);
    } finally {
      setSendingToPhone(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900/95 border border-slate-200 dark:border-white/10 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-vendeur-emerald/10 border border-emerald-200 dark:border-vendeur-emerald/20 flex items-center justify-center text-emerald-600 dark:text-vendeur-emerald shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Mes Statuts WhatsApp du Jour
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
                3 idées de statuts rédigées sur-mesure pour déclencher des ventes aujourd'hui.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Action Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50 dark:bg-vendeur-emerald/10 border border-emerald-200 dark:border-vendeur-emerald/20 rounded-2xl">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-800 dark:text-vendeur-emerald font-semibold">
            <MessageSquare size={16} className="shrink-0" />
            <span>Recevez les 3 statuts directement sur votre WhatsApp</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSendToMyWhatsApp}
              disabled={sendingToPhone || loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {sendingToPhone ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Envoyer sur mon WhatsApp</span>
                </>
              )}
            </button>
            <button
              onClick={fetchStatuses}
              disabled={loading}
              title="Regénérer 3 nouveaux statuts"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="space-y-4 py-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 animate-pulse space-y-3"
              >
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/3" />
                <div className="h-12 bg-slate-100 dark:bg-white/5 rounded w-full" />
                <div className="h-8 bg-slate-200 dark:bg-white/10 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error && statuses.length === 0 ? (
          <div className="p-8 text-center space-y-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertCircle size={36} className="text-red-400 mx-auto" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchStatuses}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-slate-900 dark:text-white transition-all cursor-pointer"
            >
              Réessayer la génération
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {statuses.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 hover:border-emerald-300 dark:hover:border-white/15 transition-all space-y-3.5"
              >
                {/* Header card */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-vendeur-emerald/10 border border-emerald-200 dark:border-vendeur-emerald/20 text-emerald-700 dark:text-vendeur-emerald text-xs font-black tracking-wide uppercase">
                    📌 {item.headline}
                  </span>

                  {item.productName && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                      <ShoppingBag size={13} className="text-slate-400 dark:text-neutral-500" />
                      <span className="font-semibold text-slate-700 dark:text-neutral-300">{item.productName}</span>
                      {item.price ? (
                        <span className="text-emerald-600 dark:text-vendeur-emerald font-bold">
                          • {item.price.toLocaleString()} {item.currency || "XOF"}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Status text */}
                <div className="relative p-3.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 font-sans text-xs sm:text-sm text-slate-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {item.copyText}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(item.copyText, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check size={14} className="text-emerald-600 dark:text-vendeur-emerald" />
                        <span className="text-emerald-600 dark:text-vendeur-emerald">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copier</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleShareToWhatsApp(item.copyText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>Partager en Statut</span>
                    <ExternalLink size={12} className="opacity-70" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer tip */}
        <div className="pt-2 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-neutral-500 flex items-center justify-between">
          <span>💡 Conseil : Copiez le texte et ajoutez la photo de votre produit avant de publier en statut.</span>
        </div>
      </div>
    </div>
  );
}