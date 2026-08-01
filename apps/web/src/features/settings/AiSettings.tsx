import React, { useState, useEffect } from "react";
import { Mic, MessageSquare, Bot, Zap, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
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
  const [settings, setSettings] = useState<any>(null);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/commerce/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    }
  });

  useEffect(() => {
    if (dashboard?.merchant?.aiSettings) {
      setSettings(dashboard.merchant.aiSettings);
    }
  }, [dashboard]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      await axios.patch(`${API_URL}/api/commerce/ai-settings`, newSettings, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    },
    onSuccess: () => {
      toast.success("Réglages IA enregistrés ! ✨");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Échec de la mise à jour")
  });

  if (isLoading || !settings) {
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
