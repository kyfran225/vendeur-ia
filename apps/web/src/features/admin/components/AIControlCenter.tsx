import React, { useState } from "react";
import {
  Bot,
  Cpu,
  Activity,
  Key,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Shield,
  Save,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AIControlCenter() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [localAiConfig, setLocalAiConfig] = useState<any>(null);

  // 1. Fetch AI Status
  const { data: aiStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["admin:ai:status"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/ai/status");
      return res.data;
    }
  });

  // 2. Fetch System Settings (includes aiConfig)
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin:settings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data;
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await apiClient.patch("/api/admin/settings", newSettings);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Configuration IA mise à jour !");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["admin:settings"] });
    }
  });

  const handleEditClick = () => {
    if (!isEditing) {
      setLocalAiConfig(settings?.aiConfig || {
        providers: [
          { name: 'gemini', apiKey: '', isActive: true },
          { name: 'openai', apiKey: '', isActive: true },
          { name: 'groq', apiKey: '', isActive: true },
          { name: 'openrouter', apiKey: '', isActive: true },
          { name: 'elevenlabs', apiKey: '', isActive: true }
        ],
        defaultTextProvider: 'gemini',
        defaultVisionProvider: 'gemini',
        defaultAudioProvider: 'elevenlabs'
      });
    }
    setIsEditing(!isEditing);
  };

  const testProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await apiClient.post(`/api/admin/ai/test/${provider}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      refetchStatus();
    }
  });

  if (statusLoading || settingsLoading) {
    return <div className="flex h-48 items-center justify-center"><Sparkles className="animate-spin text-vendeur-emerald" size={32} /></div>;
  }

  const aiConfig = settings?.aiConfig || {
    providers: [
      { name: 'gemini', apiKey: '', isActive: true },
      { name: 'openai', apiKey: '', isActive: true },
      { name: 'groq', apiKey: '', isActive: true },
      { name: 'openrouter', apiKey: '', isActive: true },
      { name: 'elevenlabs', apiKey: '', isActive: true }
    ],
    defaultTextProvider: 'gemini',
    defaultVisionProvider: 'gemini',
    defaultAudioProvider: 'elevenlabs'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. PROVIDER STATUS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {aiStatus?.map((p: any) => (
          <div key={p.name} className="bg-vendeur-coal border border-white/5 p-6 rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center border",
                  p.success ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  <Cpu size={20} />
                </div>
                <h3 className="font-black uppercase tracking-tighter text-sm">{p.name}</h3>
              </div>
              <button
                onClick={() => testProviderMutation.mutate(p.name)}
                disabled={testProviderMutation.isPending}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/20 hover:text-white"
              >
                <RefreshCw size={14} className={testProviderMutation.isPending ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {p.success ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={10} /> Opérationnel
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-[10px] font-black uppercase text-rose-400 border border-rose-500/20">
                  <XCircle size={10} /> Échec
                </div>
              )}
            </div>

            {!p.success && (
              <p className="text-[9px] text-rose-400/60 font-medium leading-tight line-clamp-2">
                {p.message}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 2. CONFIGURATION PANEL */}
      <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-tight">Cerveau & API Keys</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Governance IA</p>
            </div>
          </div>
          <button
            onClick={handleEditClick}
            className="w-full md:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            {isEditing ? "Annuler" : "Modifier la Config"}
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Default Routing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoutingSelect
              label="Cerveau Texte (Chat)"
              value={isEditing ? localAiConfig?.defaultTextProvider : aiConfig.defaultTextProvider}
              onChange={(v: string) => isEditing && setLocalAiConfig({ ...localAiConfig, defaultTextProvider: v })}
              options={['gemini', 'openai', 'groq', 'openrouter']}
              disabled={!isEditing}
            />
            <RoutingSelect
              label="Cerveau Vision (Images)"
              value={isEditing ? localAiConfig?.defaultVisionProvider : aiConfig.defaultVisionProvider}
              onChange={(v: string) => isEditing && setLocalAiConfig({ ...localAiConfig, defaultVisionProvider: v })}
              options={['gemini', 'openai']}
              disabled={!isEditing}
            />
            <RoutingSelect
              label="Cerveau Audio (TTS)"
              value={isEditing ? localAiConfig?.defaultAudioProvider : aiConfig.defaultAudioProvider}
              onChange={(v: string) => isEditing && setLocalAiConfig({ ...localAiConfig, defaultAudioProvider: v })}
              options={['elevenlabs', 'openai']}
              disabled={!isEditing}
            />
          </div>

          {/* Providers List */}
          <div className="space-y-4 pt-4">
            {(isEditing ? localAiConfig?.providers : aiConfig.providers).map((p: any, idx: number) => (
              <div key={p.name} className="flex flex-col md:flex-row items-center gap-4 p-4 md:p-6 bg-black/40 rounded-3xl border border-white/5 group">
                <div className="flex items-center gap-4 w-full md:w-48">
                  <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 font-black uppercase text-[10px]">
                    {p.name.charAt(0)}
                  </div>
                  <span className="font-black uppercase tracking-widest text-xs">{p.name}</span>
                </div>

                <div className="flex-1 w-full relative">
                  <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type="password"
                    disabled={!isEditing}
                    value={p.apiKey || ""}
                    onChange={(e) => {
                      if (!isEditing) return;
                      const newProviders = [...localAiConfig.providers];
                      newProviders[idx] = { ...newProviders[idx], apiKey: e.target.value };
                      setLocalAiConfig({ ...localAiConfig, providers: newProviders });
                    }}
                    placeholder="sk-••••••••••••••••••••••••"
                    className="w-full h-12 bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 text-xs font-mono text-white/60 focus:border-amber-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isEditing}
                      checked={p.isActive}
                      onChange={(e) => {
                        if (!isEditing) return;
                        const newProviders = [...localAiConfig.providers];
                        newProviders[idx] = { ...newProviders[idx], isActive: e.target.checked };
                        setLocalAiConfig({ ...localAiConfig, providers: newProviders });
                      }}
                      className="w-4 h-4 rounded border-white/10 bg-black/40 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[10px] font-black uppercase text-white/40">Actif</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => updateSettingsMutation.mutate({ aiConfig: localAiConfig })}
                disabled={updateSettingsMutation.isPending}
                className="w-full md:w-auto min-w-[240px] px-8 h-14 bg-amber-500 text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
              >
                {updateSettingsMutation.isPending ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                Sauvegarder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. PERFORMANCE & QUOTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-vendeur-coal border border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Activity className="text-vendeur-emerald" size={24} />
              Utilisation (Tokens)
            </h2>
            <div className="space-y-6">
               <UsageBar label="Gemini 1.5 Flash" used={450000} total={1000000} color="emerald" />
               <UsageBar label="Groq Llama 3" used={120000} total={500000} color="sky" />
               <UsageBar label="OpenRouter (Llama 3.3)" used={25000} total={500000} color="indigo" />
               <UsageBar label="ElevenLabs Audio" used={8500} total={10000} color="amber" />
            </div>
          </div>

          <div className="bg-vendeur-coal border border-white/5 p-8 rounded-[2.5rem] space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Zap className="text-amber-500" size={24} />
                  Dernières Erreurs
                </h2>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Temps Réel</span>
             </div>
             <div className="space-y-3">
                <ErrorLog time="23:45" provider="Gemini" error="Quota Exceeded (RPM)" />
                <ErrorLog time="22:12" provider="ElevenLabs" error="Invalid Voice ID" />
                <ErrorLog time="19:05" provider="Vision" error="Unsupported image format" />
             </div>
          </div>
      </div>
    </div>
  );
}

function RoutingSelect({ label, value, onChange, options, disabled }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{label}</label>
      <div className="relative">
        <select
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-amber-500 appearance-none disabled:opacity-50 cursor-pointer"
        >
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
      </div>
    </div>
  );
}

function UsageBar({ label, used, total, color }: any) {
  const percent = Math.min(100, (used / total) * 100);
  const colors: any = {
    emerald: "bg-vendeur-emerald",
    sky: "bg-sky-500",
    indigo: "bg-indigo-500",
    amber: "bg-amber-500"
  };
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span className="text-white/40">{label}</span>
        <span className="text-white">{Math.round(percent)}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-1000", colors[color])}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-[8px] font-bold text-white/20 uppercase">
        <span>{used.toLocaleString()} used</span>
        <span>{total.toLocaleString()} limit</span>
      </div>
    </div>
  );
}

function ErrorLog({ time, provider, error }: any) {
  return (
    <div className="flex items-center gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-rose-500/20 transition-colors group">
      <div className="text-[10px] font-black text-white/20 group-hover:text-rose-500/40">{time}</div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase text-white/60 tracking-tight">{provider}</p>
        <p className="text-[11px] font-medium text-rose-400/80">{error}</p>
      </div>
      <AlertTriangle size={14} className="text-rose-500/40" />
    </div>
  );
}
