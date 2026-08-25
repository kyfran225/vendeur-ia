import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Loader2,
  Check,
  Sparkles,
  Phone,
  Settings2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
  ExternalLink
} from "lucide-react";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { StepMilestoneModal } from "@/components/ui/StepMilestoneModal";
import { formatDisplayPhone, parsePhoneNumber } from "@/features/onboarding/components/CountrySelector";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function WhatsAppConnectionFlow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [savingPhone, setSavingPhone] = useState(false);
  const [storeWhatsApp, setStoreWhatsApp] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [metaForm, setMetaForm] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: ""
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [showAdvancedMeta, setShowAdvancedMeta] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const { data: dashboard, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    }
  });

  const merchant = dashboard?.merchant;
  const whatsapp = dashboard?.whatsappConnection;
  const subscription = dashboard?.subscription;

  const activeNumber = merchant?.whatsappNumber || merchant?.phone || whatsapp?.phoneNumber || "";

  useEffect(() => {
    if (activeNumber) {
      setStoreWhatsApp(activeNumber);
    }
  }, [activeNumber]);

  useEffect(() => {
    if (merchant?.whatsappConfig?.meta) {
      setMetaForm({
        phoneNumberId: merchant.whatsappConfig.meta.phoneNumberId || "",
        wabaId: merchant.whatsappConfig.meta.wabaId || "",
        accessToken: merchant.whatsappConfig.meta.accessToken || ""
      });
    }
  }, [merchant?.whatsappConfig]);

  const handleUpdatePhone = async () => {
    const raw = storeWhatsApp.trim();
    if (!raw || raw.replace(/\D/g, "").length < 6) {
      toast.error("Veuillez renseigner un numéro WhatsApp valide (ex: +225 07 00 00 00 00).");
      return;
    }
    const parsed = parsePhoneNumber(raw, merchant?.country || "CI");
    const normalizedPhone = parsed.e164 || raw;

    setSavingPhone(true);
    try {
      await apiClient.patch("/api/commerce/merchant", {
        whatsappNumber: normalizedPhone,
        phone: normalizedPhone
      });
      toast.success("Numéro WhatsApp de vente mis à jour avec succès ! 🚀");
      setIsEditingPhone(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la mise à jour du numéro.");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveMetaConfig = async () => {
    if (!metaForm.phoneNumberId || !metaForm.accessToken) {
      toast.error("Veuillez remplir le Phone Number ID et le Jeton d'accès Meta.");
      return;
    }
    setSavingMeta(true);
    try {
      await apiClient.post("/api/whatsapp/meta-config", metaForm);
      toast.success("Configuration Meta Cloud enregistrée avec succès ! 🚀");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement de la configuration Meta.");
    } finally {
      setSavingMeta(false);
    }
  };

  const isUsingCustomMeta = !!merchant?.whatsappConfig?.meta?.phoneNumberId;
  const cleanPhone = activeNumber.replace(/\D/g, "");

  const isPaidActive = merchant?.subscription?.status === "active";
  const isPaused = isPaidActive && merchant?.aiSettings?.autoReply === false;
  const isDiscoveryMode = !isPaidActive;

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden box-border">
      {/* 1. Statut WhatsApp Cloud & Mode Réel */}
      <div className="bg-vendeur-coal border border-white/10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 text-left shadow-2xl w-full max-w-full overflow-hidden box-border">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5 border-b border-white/5 pb-5 sm:pb-6 w-full">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1 w-full">
            <div className={cn(
              "h-11 w-11 sm:h-13 sm:w-13 md:h-14 md:w-14 rounded-2xl flex items-center justify-center font-black shrink-0 border",
              isPaidActive && !isPaused
                ? "bg-vendeur-emerald/10 border-vendeur-emerald/20 text-vendeur-emerald"
                : isPaused
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            )}>
              <ShieldCheck size={24} className="md:w-7 md:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
                  isPaidActive && !isPaused
                    ? "bg-vendeur-emerald/15 border-vendeur-emerald/30 text-vendeur-emerald"
                    : isPaused
                      ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-300"
                )}>
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    isPaidActive && !isPaused ? "bg-vendeur-emerald animate-pulse" :
                    isPaused ? "bg-sky-400" : "bg-amber-400 animate-pulse"
                  )} />
                  <span>
                    {isPaidActive && !isPaused
                      ? "En Vente 24h/24"
                      : isPaused
                        ? "Mode Pause (Manuel)"
                        : "IA en attente d'activation"}
                  </span>
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-tight">
                  WhatsApp Cloud Direct
                </h3>
              </div>
              <p className="text-xs text-white/50 font-medium mt-1 break-words">
                Ligne associée : <strong className={cn(
                  "font-bold font-mono",
                  isPaidActive && !isPaused ? "text-vendeur-emerald" : isPaused ? "text-sky-300" : "text-amber-300"
                )}>{formatDisplayPhone(activeNumber, merchant?.country || "CI") || "En attente"}</strong>
                {isDiscoveryMode && (
                  <span className="block text-[11px] text-amber-200/80 font-normal mt-0.5 leading-relaxed">
                    L'IA ne répond pas encore aux clients sur WhatsApp. Vous gardez 100% le contrôle tant que votre forfait n'est pas activé.
                  </span>
                )}
                {isPaused && (
                  <span className="block text-[11px] text-sky-200/80 font-normal mt-0.5 leading-relaxed">
                    Mode pause activé : vous répondez manuellement à vos clients.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
            {isDiscoveryMode && (
              <button
                type="button"
                onClick={() => navigate("/offers")}
                className="h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-vendeur-emerald/20"
              >
                <Zap size={15} fill="currentColor" className="shrink-0" />
                <span>Activer les Ventes 24h/24</span>
              </button>
            )}

            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=Bonjour`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="truncate">Tester WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => navigate("/dashboard?test_ia=true")}
                className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] text-center"
              >
                <AssistantIcon size={15} color="#10B981" />
                <span className="truncate">Simulateur IA</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Modification du Numéro de Vente */}
        <div className="space-y-2.5 w-full max-w-full">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/40">
              Numéro WhatsApp de vente
            </label>
            {!isEditingPhone && (
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-vendeur-emerald hover:underline cursor-pointer"
              >
                Modifier
              </button>
            )}
          </div>

          {isEditingPhone ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-full">
              <div className="relative flex-1 min-w-0">
                <Phone className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-white/30 shrink-0" size={16} />
                <input
                  type="tel"
                  value={storeWhatsApp}
                  onChange={(e) => setStoreWhatsApp(e.target.value)}
                  placeholder="Ex: +2250700000000"
                  className="w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl bg-black/40 border border-white/15 px-3 pl-10 sm:pl-11 text-white font-mono text-xs sm:text-sm outline-none focus:border-vendeur-emerald transition-all shadow-inner box-border"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleUpdatePhone}
                  disabled={savingPhone}
                  className="flex-1 sm:flex-initial h-12 sm:h-13 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingPhone ? <Loader2 className="animate-spin shrink-0" size={15} /> : <Check size={15} className="shrink-0" />}
                  <span>Enregistrer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStoreWhatsApp(activeNumber);
                    setIsEditingPhone(false);
                  }}
                  className="h-12 sm:h-13 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone size={15} className="text-vendeur-emerald shrink-0" />
                <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider truncate">
                  {activeNumber || "Aucun numéro défini"}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/40">
                {isUsingCustomMeta ? "Ligne Dédiée Meta" : "Réseau Vendeur IA Cloud"}
              </span>
            </div>
          )}
        </div>

        {/* 3. Section Dédiée Meta Cloud (Collapsible) */}
        <div className="border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={() => setShowAdvancedMeta(!showAdvancedMeta)}
            className="flex items-center justify-between w-full text-left py-1 text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={14} className="text-white/40 shrink-0" />
              <span className="text-[11px] sm:text-xs">Paramètres Développeur Meta Cloud (Optionnel)</span>
            </div>
            {showAdvancedMeta ? <ChevronUp size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
          </button>

          {showAdvancedMeta && (
            <div className="space-y-3.5 pt-3 mt-1 border-t border-white/5 animate-in fade-in duration-300 w-full max-w-full">
              <p className="text-[10px] sm:text-[11px] text-white/40 leading-relaxed">
                Si vous possédez votre propre compte WhatsApp Business API vérifié sur Meta Business Suite, vous pouvez saisir vos clés dédiées ici.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div className="space-y-1 min-w-0">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 1048593849502"
                    value={metaForm.phoneNumberId}
                    onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all box-border"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">WABA ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 2049583920194"
                    value={metaForm.wabaId}
                    onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all box-border"
                  />
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Access Token EAAG</label>
                <textarea
                  placeholder="Ex: EAAG..."
                  value={metaForm.accessToken}
                  onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                  className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white focus:border-vendeur-emerald outline-none transition-all resize-none box-border"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveMetaConfig}
                disabled={savingMeta}
                className="h-11 px-5 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {savingMeta ? <Loader2 className="animate-spin shrink-0" size={14} /> : <Check size={14} className="shrink-0" />}
                <span>Enregistrer mes clés Meta</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <StepMilestoneModal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        title="WhatsApp Connecté ! 🚀"
        subtitle="Votre commercial IA est désormais synchronisé avec votre ligne WhatsApp et prêt à répondre 24h/24."
        score={dashboard?.setupStatus?.score || 100}
        primaryAction={{
          label: "Tester mon Vendeur IA",
          sublabel: "Simulez des ventes en direct",
          href: "/dashboard?test_ia=true"
        }}
        dashboardActionLabel="Retour au Tableau de Bord"
      />
    </div>
  );
}
