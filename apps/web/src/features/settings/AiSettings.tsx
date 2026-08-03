import React, { useState, useEffect } from "react";
import { Mic, MessageSquare, Bot, Zap, Save, Loader2, DollarSign, Plus, Trash2, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import axios from "axios";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export function AiSettings() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<any>({
    personality: "friendly",
    responseStyle: "normal",
    autoReply: true,
    voiceMode: false,
    localSlang: false
  });
  const [payments, setPayments] = useState<any[]>([]);

  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    }
  });

  const { data: knowledge, isLoading: isKnowledgeLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/knowledge");
      return res.data;
    }
  });

  useEffect(() => {
    if (dashboard?.merchant?.aiSettings) {
      setSettings(dashboard.merchant.aiSettings);
    } else {
      setSettings({
        personality: "friendly",
        responseStyle: "normal",
        autoReply: true,
        voiceMode: false
      });
    }
    if (knowledge?.businessRules?.paymentMethods) {
      setPayments(knowledge.businessRules.paymentMethods);
    } else {
      setPayments([]);
    }
  }, [dashboard, knowledge]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      await apiClient.patch("/api/commerce/ai-settings", newSettings);
      await apiClient.patch("/api/commerce/knowledge", {
        businessRules: {
          ...knowledge?.businessRules,
          paymentMethods: payments
        }
      });
    },
    onSuccess: () => {
      toast.success("Réglages IA enregistrés ! ✨");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: () => toast.error("Échec de la mise à jour")
  });

  if (isDashboardLoading || isKnowledgeLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-vendeur-emerald" size={32} />
      </div>
    );
  }

  const toggleVoiceMode = () => {
    setSettings({ ...settings, voiceMode: !settings.voiceMode });
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
          <Bot className="text-vendeur-emerald" size={32} />
          Configuration IA
        </h1>
        <p className="text-white/40">Personnalisez la façon dont votre IA interagit avec vos clients.</p>
      </header>

      <div className="grid gap-6">
        <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-8">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Mic size={20} className="text-sky-400" />
                  Mode Vocal
                </h2>
                <p className="text-xs text-white/40 font-medium">L'IA répondra par des notes vocales au lieu du texte.</p>
              </div>
              <button
                onClick={toggleVoiceMode}
                className={cn(
                  "w-14 h-8 rounded-full relative transition-all duration-300",
                  settings.voiceMode ? "bg-vendeur-emerald" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md",
                  settings.voiceMode ? "left-7" : "left-1"
                )} />
              </button>
           </div>

           {settings.voiceMode && (
             <div className="bg-sky-500/5 border border-sky-500/20 p-4 rounded-2xl animate-in slide-in-from-top-2">
                <div className="flex gap-3">
                  <Zap size={18} className="text-sky-400 shrink-0" />
                  <p className="text-[10px] text-sky-400/80 font-black uppercase leading-relaxed tracking-wider">
                    Attention : Le mode vocal consomme plus de crédits IA. Assurez-vous d'avoir un abonnement Pro actif.
                  </p>
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({...settings, voiceMode: false})}
                className={cn(
                  "p-6 rounded-3xl border-2 transition-all text-left space-y-3",
                  !settings.voiceMode ? "bg-white/5 border-vendeur-emerald" : "bg-white/2 border-white/5 opacity-40"
                )}
              >
                <MessageSquare size={24} className={!settings.voiceMode ? "text-vendeur-emerald" : "text-white/20"} />
                <div>
                  <p className="font-black text-white text-sm">Mode Texte</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Réponses écrites</p>
                </div>
              </button>

              <button
                onClick={() => setSettings({...settings, voiceMode: true})}
                className={cn(
                  "p-6 rounded-3xl border-2 transition-all text-left space-y-3",
                  settings.voiceMode ? "bg-sky-500/5 border-sky-400" : "bg-white/2 border-white/5 opacity-40"
                )}
              >
                <Mic size={24} className={settings.voiceMode ? "text-sky-400" : "text-white/20"} />
                <div>
                  <p className="font-black text-white text-sm">Mode Vocal</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Notes vocales</p>
                </div>
              </button>
           </div>
        </section>

        <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-6">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-400" />
                  Ton Local (Slang)
                </h2>
                <p className="text-xs text-white/40 font-medium">L'IA utilisera des expressions locales (Nouchi/Wolof) pour plus de proximité.</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, localSlang: !settings.localSlang })}
                className={cn(
                  "w-14 h-8 rounded-full relative transition-all duration-300",
                  settings.localSlang ? "bg-vendeur-emerald" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md",
                  settings.localSlang ? "left-7" : "left-1"
                )} />
              </button>
           </div>
        </section>

        <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-6">
           <div className="space-y-1">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-400" />
                Moyens de Paiement
              </h2>
              <p className="text-xs text-white/40 font-medium">L'IA donnera ces numéros pour les transferts d'argent.</p>
           </div>

           <div className="space-y-4">
              {payments.map((p, idx) => (
                <div key={idx} className="flex gap-3 items-end animate-in slide-in-from-left-2 duration-300">
                   <div className="flex-1 space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-1">Opérateur</label>
                      <select
                        className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-xs text-white focus:border-emerald-500 outline-none"
                        value={p.provider}
                        onChange={(e) => {
                           const next = [...payments];
                           next[idx].provider = e.target.value;
                           setPayments(next);
                        }}
                      >
                         <option value="Wave">Wave</option>
                         <option value="Orange Money">Orange Money</option>
                         <option value="MTN MoMo">MTN MoMo</option>
                         <option value="Moov Money">Moov Money</option>
                         <option value="Virement Bancaire">Virement</option>
                      </select>
                   </div>
                   <div className="flex-[1.5] space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-1">Numéro / Détails</label>
                      <input
                        className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white focus:border-emerald-500 outline-none"
                        value={p.number}
                        onChange={(e) => {
                           const next = [...payments];
                           next[idx].number = e.target.value;
                           setPayments(next);
                        }}
                        placeholder="Ex: 07 00 00 00 00"
                      />
                   </div>
                   <button
                     onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                     className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-xl text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>
              ))}

              <button
                onClick={() => setPayments([...payments, { provider: "Wave", number: "" }])}
                className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] hover:underline pt-2"
              >
                 <Plus size={14} /> Ajouter un mode de paiement
              </button>
           </div>
        </section>

        <button
          onClick={() => updateMutation.mutate(settings)}
          disabled={updateMutation.isPending}
          className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
          Activer les nouveaux réglages
        </button>
      </div>
    </div>
  );
}
