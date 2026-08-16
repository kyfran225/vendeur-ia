import React, { useState } from "react";
import {
  X,
  CreditCard,
  Send,
  Copy,
  Check,
  Sparkles,
  DollarSign,
  Smartphone,
  ShieldCheck,
  Loader2,
  Zap,
  ArrowRight
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

interface FastPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  customerName?: string;
  currency?: string;
}

const PROVIDER_OPTIONS = [
  { id: "all", label: "Tous les moyens", badge: "Recommandé", color: "from-emerald-500 to-sky-500" },
  { id: "wave", label: "Wave Uniquement", badge: "0% frais", color: "from-sky-500 to-blue-600" },
  { id: "orange", label: "Orange Money", badge: "#144#", color: "from-orange-500 to-amber-600" },
  { id: "mtn", label: "MTN Mobile Money", badge: "*133#", color: "from-yellow-400 to-amber-500" }
];

const QUICK_AMOUNTS = [5000, 10000, 15000, 25000, 50000];

export function FastPayModal({
  isOpen,
  onClose,
  conversationId,
  customerName = "Client",
  currency = "XOF"
}: FastPayModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>("10000");
  const [title, setTitle] = useState<string>("Règlement de commande");
  const [provider, setProvider] = useState<string>("all");
  const [customNumber, setCustomNumber] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const fastPayMutation = useMutation({
    mutationFn: async (payload: { sendDirectly: boolean }) => {
      const res = await apiClient.post(`/api/commerce/conversations/${conversationId}/fast-pay`, {
        amount: Number(amount),
        title,
        provider,
        customNumber: customNumber.trim() || undefined,
        sendDirectly: payload.sendDirectly
      });
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.sendDirectly) {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        toast.success("Demande de paiement envoyée avec succès dans la discussion !");
        onClose();
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de la génération du paiement.");
    }
  });

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;

  const handleCopyFormattedText = async () => {
    try {
      const res = await apiClient.post(`/api/commerce/conversations/${conversationId}/fast-pay`, {
        amount: numAmount,
        title,
        provider,
        customNumber: customNumber.trim() || undefined,
        sendDirectly: false
      });
      if (res.data?.formattedText) {
        navigator.clipboard.writeText(res.data.formattedText);
        setCopied(true);
        toast.success("Message de paiement copié !");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      toast.error("Erreur de copie");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-vendeur-coal border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center shadow-lg shadow-vendeur-emerald/20">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Fast Pay Mobile Money</h3>
              <p className="text-xs text-white/40 font-medium">Demande de paiement express pour {customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest">
              Montant à Encaisser ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 15000"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-2xl font-black text-white outline-none focus:border-vendeur-emerald transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-white/40">
                {currency}
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    numAmount === amt
                      ? "bg-vendeur-emerald text-vendeur-coal border-vendeur-emerald font-black shadow-md shadow-vendeur-emerald/20"
                      : "bg-white/5 border-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  +{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Title / Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Objet du Paiement / Articles
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Commande 2 Robes + Livraison Angré"
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-vendeur-emerald transition-all"
            />
          </div>

          {/* Provider Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Moyen de Paiement Cible
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProvider(opt.id)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    provider === opt.id
                      ? "bg-white/10 border-vendeur-emerald text-white shadow-lg"
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{opt.label}</p>
                    <p className="text-[9px] text-vendeur-emerald font-bold mt-0.5">{opt.badge}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleCopyFormattedText}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check size={16} className="text-vendeur-emerald" /> : <Copy size={16} />}
            <span>{copied ? "Copié" : "Copier"}</span>
          </button>

          <button
            type="button"
            onClick={() => fastPayMutation.mutate({ sendDirectly: true })}
            disabled={fastPayMutation.isPending || !numAmount}
            className="col-span-2 h-14 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 disabled:opacity-50"
          >
            {fastPayMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Send size={18} />
                <span>Envoyer dans le Chat</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30 pt-1">
          <ShieldCheck size={12} className="text-vendeur-emerald" />
          <span>Génère le lien direct Wave + instructions instantanées</span>
        </div>
      </div>
    </div>
  );
}
