import React, { useState } from "react";
import {
  Bot,
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
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Skull
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_PROVIDERS = [
  { name: 'gemini', apiKey: '', isActive: true },
  { name: 'openai', apiKey: '', isActive: true },
  { name: 'groq', apiKey: '', isActive: true },
  { name: 'openrouter', apiKey: '', isActive: true },
  { name: 'elevenlabs', apiKey: '', isActive: true }
];

const mergeProviders = (existing: any[] = []) => {
  return DEFAULT_PROVIDERS.map(def => {
    const found = existing.find(p => p.name === def.name);
    return found ? { ...def, ...found } : def;
  });
};

export function AIControlCenter() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const { isFounder } = useFounderRole();
  const [isEditing, setIsEditing] = useState(false);
  const [localAiConfig, setLocalAiConfig] = useState<any>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (name: string) => {
    setVisibleKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Clé copiée !");
  };

  // 1. Fetch AI Status
  const { data: aiStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["admin:ai:status"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/ai/status");
      return res.data;
    },
    enabled: !!accessToken && isFounder
  });

  // 2. Fetch System Settings (includes aiConfig)
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin:settings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data;
    },
    enabled: !!accessToken && isFounder
  });

  // 3. Fetch Real Usage Stats
  const { data: adminStats } = useQuery({
    queryKey: ["admin:stats"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/stats");
      return res.data;
    },
    enabled: !!accessToken && isFounder
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
      queryClient.invalidateQueries({ queryKey: ["admin:ai:status"] });
    }
  });

  const handleEditClick = () => {
    if (!isEditing) {
      setLocalAiConfig({
        ...(settings?.aiConfig || {}),
        providers: mergeProviders(settings?.aiConfig?.providers || []),
        defaultTextProvider: settings?.aiConfig?.defaultTextProvider || 'gemini',
        defaultVisionProvider: settings?.aiConfig?.defaultVisionProvider || 'gemini',
        defaultAudioProvider: settings?.aiConfig?.defaultAudioProvider || 'elevenlabs'
      });
    }
    setIsEditing(!isEditing);
  };

  const emergencyStopMutation = useMutation({
    mutationFn: async (action: 'pause' | 'resume') => {
      const res = await apiClient.post("/api/admin/system/emergency-stop", { action });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message, {
        duration: 5000,
        icon: <Skull className="text-rose-500" />
      });
    }
  });

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

  const aiConfig = {
    ...(settings?.aiConfig || {}),
    providers: mergeProviders(settings?.aiConfig?.providers || []),
    defaultTextProvider: settings?.aiConfig?.defaultTextProvider || 'gemini',
    defaultVisionProvider: settings?.aiConfig?.defaultVisionProvider || 'gemini',
    defaultAudioProvider: settings?.aiConfig?.defaultAudioProvider || 'elevenlabs'
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* 1. PROVIDER STATUS GRID - Flattened */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {aiStatus?.map((p: any) => (
          <div key={p.name} className="bg-vendeur-coal/60 border border-white/5 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black uppercase tracking-tighter text-[11px] text-white/60">{p.name}</h3>
              <button
                onClick={() => testProviderMutation.mutate(p.name)}
                disabled={testProviderMutation.isPending}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-white/20"
              >
                <RefreshCw size={12} className={testProviderMutation.isPending ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {p.success ? (
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              )}
              <span className={cn("text-[9px] font-black uppercase tracking-widest", p.success ? "text-emerald-400" : "text-rose-400")}>
                {p.success ? "Online" : "Error"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. CONFIGURATION PANEL - Flattened */}
      <div className="bg-vendeur-coal border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden">
        <div className="p-4 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-vendeur-emerald/10 rounded-xl md:rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20 shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-none">AI Governance Layer</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1">Core Neural Routing</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => emergencyStopMutation.mutate('pause')}
              className="flex-1 md:flex-none px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-rose-500/20"
            >
              <Skull size={14} /> STOP
            </button>
            <button
              onClick={handleEditClick}
              className="flex-1 md:flex-none px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
            >
              {isEditing ? "Cancel" : "Modify"}
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          {/* Default Routing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <RoutingSelect
              label="Neural Text (Chat)"
              value={isEditing ? localAiConfig?.defaultTextProvider : aiConfig.defaultTextProvider}
              onChange={(v: string) => isEditing && setLocalAiConfig({ ...localAiConfig, defaultTextProvider: v })}
              options={['gemini', 'openai', 'groq', 'openrouter']}
              disabled={!isEditing}
            />
            <RoutingSelect
              label="Vision Layer (OCR)"
              value={isEditing ? localAiConfig?.defaultVisionProvider : aiConfig.defaultVisionProvider}
              onChange={(v: string) => isEditing && setLocalAiConfig({ ...localAiConfig, defaultVisionProvider: v })}
              options={['gemini', 'openai']}
              disabled={!isEditing}
            />
            <RoutingSelect
              label="Audio Matrix (TTS)"
              value={isEditing ? localAiConfig?.defaultAudioProvider : aiConfig.defaultAudioProvider}
              onChange={(v: string) => isEditing && setLocalAiConfig({ ...localAiConfig, defaultAudioProvider: v })}
              options={['elevenlabs', 'openai']}
              disabled={!isEditing}
            />
          </div>

          {/* Providers List - Flattened */}
          <div className="space-y-3">
            {(isEditing ? localAiConfig?.providers : aiConfig.providers).map((p: any, idx: number) => (
              <div key={p.name} className="flex flex-col md:flex-row items-center gap-3 p-3 md:p-5 bg-black/40 rounded-2xl border border-white/5 group">
                <div className="flex items-center gap-3 w-full md:w-40 shrink-0">
                  <span className="font-black uppercase tracking-widest text-[10px] text-white/60">{p.name}</span>
                </div>

                <div className="flex-1 w-full relative">
                  <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input
                    type={visibleKeys[p.name] ? "text" : "password"}
                    disabled={!isEditing}
                    value={p.apiKey || ""}
                    onChange={(e) => {
                      if (!isEditing) return;
                      const newProviders = [...localAiConfig.providers];
                      newProviders[idx] = { ...newProviders[idx], apiKey: e.target.value };
                      setLocalAiConfig({ ...localAiConfig, providers: newProviders });
                    }}
                    placeholder="sk-••••••••"
                    className="w-full h-10 md:h-11 bg-black/20 border border-white/10 rounded-xl pl-10 pr-20 text-[10px] font-mono text-white/60 focus:border-vendeur-emerald outline-none"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
                    <button
                      onClick={() => toggleKeyVisibility(p.name)}
                      className="p-1.5 text-white/30 hover:text-white"
                    >
                      {visibleKeys[p.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(p.apiKey)}
                      className="p-1.5 text-white/30 hover:text-white"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
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
                      className="w-3.5 h-3.5 rounded border-white/10 bg-black/40 text-vendeur-emerald"
                    />
                    <span className="text-[9px] font-black uppercase text-white/40">Active</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="flex justify-center">
              <button
                onClick={() => updateSettingsMutation.mutate({ aiConfig: localAiConfig })}
                disabled={updateSettingsMutation.isPending}
                className="w-full md:w-auto min-w-[200px] h-12 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 text-[11px]"
              >
                {updateSettingsMutation.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                Commit Config
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. PERFORMANCE & QUOTA - Flattened */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-vendeur-coal border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] space-y-6">
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Activity className="text-vendeur-emerald" size={20} />
              Token Economics Matrix
            </h2>
            <div className="space-y-6">
               <RealUsageBar
                 label="Gemini 1.5 Flash (Core)"
                 provider="gemini"
                 usageData={adminStats?.providerUsage}
                 total={1000000}
                 color="emerald"
               />
               <RealUsageBar
                 label="Groq Llama 3 (Latency Ops)"
                 provider="groq"
                 usageData={adminStats?.providerUsage}
                 total={500000}
                 color="sky"
               />
               <RealUsageBar
                 label="OpenRouter (Universal)"
                 provider="openrouter"
                 usageData={adminStats?.providerUsage}
                 total={500000}
                 color="indigo"
               />
               <RealUsageBar
                 label="ElevenLabs (Neural Voice)"
                 provider="elevenlabs"
                 usageData={adminStats?.providerUsage}
                 total={10000}
                 color="vendeur"
               />
            </div>
          </div>

          <div className="bg-vendeur-coal border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Zap className="text-vendeur-emerald" size={20} />
                  Live Error Registry
                </h2>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Master Logs</span>
             </div>
             <div className="space-y-2 md:space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                {settings?.aiConfig?.lastErrors?.length > 0 ? (
                  settings.aiConfig.lastErrors.map((err: any, i: number) => (
                    <ErrorLog
                      key={i}
                      time={new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      provider={err.provider}
                      error={err.message}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-white/10 uppercase text-[10px] font-black tracking-widest italic border border-dashed border-white/5 rounded-2xl">
                    Clear Skies - No errors ✨
                  </div>
                )}
             </div>
          </div>
      </div>

      {/* 4. NOTIFICATION SETTINGS - Flattened */}
      <div className="bg-vendeur-coal border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-none">Alerte Protocol</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1">Foundation Supervision</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Transmission Channels</h3>

            <NotificationToggle
              label="Push Infrastructure"
              description="Direct browser/OS critical alerts."
              checked={isEditing ? localAiConfig?.notificationSettings?.enablePush : settings?.aiConfig?.notificationSettings?.enablePush}
              onChange={(v: boolean) => isEditing && setLocalAiConfig({
                ...localAiConfig,
                notificationSettings: { ...localAiConfig.notificationSettings, enablePush: v }
              })}
              disabled={!isEditing}
            />

            <NotificationToggle
              label="Email Ledger Report"
              description="Detailed error dumps via SMTP."
              checked={isEditing ? localAiConfig?.notificationSettings?.enableEmail : settings?.aiConfig?.notificationSettings?.enableEmail}
              onChange={(v: boolean) => isEditing && setLocalAiConfig({
                ...localAiConfig,
                notificationSettings: { ...localAiConfig.notificationSettings, enableEmail: v }
              })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Pulse Frequency</h3>
            <div className="p-4 md:p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
               <select
                 disabled={!isEditing}
                 value={isEditing ? localAiConfig?.notificationSettings?.alertThreshold : settings?.aiConfig?.notificationSettings?.alertThreshold}
                 onChange={(e) => isEditing && setLocalAiConfig({
                   ...localAiConfig,
                   notificationSettings: { ...localAiConfig.notificationSettings, alertThreshold: e.target.value }
                 })}
                 className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-vendeur-emerald transition-all"
               >
                 <option value="always">Continuous (Every Signal)</option>
                 <option value="high_frequency">Threshold Pattern Only</option>
               </select>
               <p className="text-[9px] text-white/20 uppercase font-bold leading-relaxed italic">
                 Web-Push requires active handshake permission in Master browser.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({ label, description, checked, onChange, disabled }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5 group">
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-tight text-white/80 group-hover:text-white transition-colors">{label}</p>
        <p className="text-[10px] text-white/30 font-medium leading-tight max-w-[200px]">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/20 after:border-transparent after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vendeur-emerald peer-checked:after:bg-white"></div>
      </label>
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
          className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-vendeur-emerald appearance-none disabled:opacity-50 cursor-pointer"
        >
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
      </div>
    </div>
  );
}

function RealUsageBar({ label, provider, usageData, total, color }: any) {
  const usage = usageData?.find((u: any) => u.provider === provider);
  const used = usage?.tokens || 0;
  const percent = Math.min(100, (used / total) * 100);

  const colors: any = {
    emerald: "bg-vendeur-emerald",
    sky: "bg-sky-500",
    indigo: "bg-indigo-500",
    vendeur: "bg-vendeur-emerald"
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
        <span>{Math.round(used).toLocaleString()} tokens used</span>
        <span>{total.toLocaleString()} limit</span>
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
    amber: "bg-vendeur-emerald"
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
    <div className="flex items-start gap-4 p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-rose-500/20 transition-colors group">
      <div className="text-[10px] font-black text-white/20 group-hover:text-rose-500/40 mt-0.5">{time}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase text-white/60 tracking-tight">{provider}</p>
        <p className="text-[11px] font-medium text-rose-400/80 break-words leading-normal">{error}</p>
      </div>
      <AlertTriangle size={14} className="text-rose-500/40 shrink-0 mt-0.5" />
    </div>
  );
}
