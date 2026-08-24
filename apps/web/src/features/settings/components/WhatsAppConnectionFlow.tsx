import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Bot,
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
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { StepMilestoneModal } from "@/components/ui/StepMilestoneModal";
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
    if (!storeWhatsApp.trim() || storeWhatsApp.trim().length < 8) {
      toast.error("Veuillez renseigner un numéro WhatsApp valide (ex: +2250700000000).");
      return;
    }
    setSavingPhone(true);
    try {
      await apiClient.patch("/api/commerce/merchant", {
        whatsappNumber: storeWhatsApp.trim(),
        phone: storeWhatsApp.trim()
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
    <div className="space-y-6 w-full min-w-0">
      {/* 1. Statut WhatsApp Cloud & Mode Réel */}
      <div className="bg-[#0c0f0d] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 space-y-6 text-left shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-white/5 pb-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center font-black shrink-0 border",
              isPaidActive && !isPaused
                ? "bg-vendeur-emerald/10 border-vendeur-emerald/20 text-vendeur-emerald"
                : isPaused
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            )}>
              <ShieldCheck size={26} />
            </div>
            <div>
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
                    "h-1.5 w-1.5 rounded-full",
                    isPaidActive && !isPaused ? "bg-vendeur-emerald animate-pulse" :
                    isPaused ? "bg-sky-400" : "bg-amber-400 animate-pulse"
                  )} />
                  {isPaidActive && !isPaused
                    ? "En Vente 24h/24"
                    : isPaused
                      ? "Mode Pause (Manuel)"
                      : "Mode Découverte (Manuel)"}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                  WhatsApp Cloud Direct
                </h3>
              </div>
              <p className="text-xs text-white/50 font-medium mt-1">
                Ligne associée : <strong className={cn(
                  "font-bold font-mono",
                  isPaidActive && !isPaused ? "text-vendeur-emerald" : isPaused ? "text-sky-300" : "text-amber-300"
                )}>{activeNumber || "En attente"}</strong>
                {isDiscoveryMode && (
                  <span className="block text-[11px] text-amber-200/80 font-normal mt-0.5">
                    L'IA ne répond pas encore aux clients sur WhatsApp. Vous gardez 100% le contrôle tant que votre forfait n'est pas activé.
                  </span>
                )}
                {isPaused && (
                  <span className="block text-[11px] text-sky-200/80 font-normal mt-0.5">
                    Mode pause activé : vous répondez manuellement à vos clients.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {isDiscoveryMode && (
              <button
                type="button"
                onClick={() => navigate("/offers")}
                className="h-12 px-4 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-vendeur-emerald/20"
              >
                <Zap size={15} fill="currentColor" />
                <span>Activer les Ventes 24h/24</span>
              </button>
            )}

            {cleanPhone && (
              <a
                href={`https://wa.me/${cleanPhone}?text=Bonjour`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                <MessageSquare size={15} />
                <span>Tester WhatsApp</span>
              </a>
            )}

            <button
              onClick={() => navigate("/dashboard?test_ia=true")}
              className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Bot size={15} />
              <span>Simulateur IA</span>
            </button>
          </div>
        </div>

        {/* 2. Modification du Numéro de Vente */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Numéro WhatsApp de vente de votre boutique
            </label>
            {!isEditingPhone && (
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                className="text-[10px] font-black uppercase tracking-wider text-vendeur-emerald hover:underline cursor-pointer"
              >
                Modifier le numéro
              </button>
            )}
          </div>

          {isEditingPhone ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  type="tel"
                  value={storeWhatsApp}
                  onChange={(e) => setStoreWhatsApp(e.target.value)}
                  placeholder="Ex: +2250700000000"
                  className="w-full h-14 rounded-2xl bg-black/40 border border-white/15 px-4 pl-11 text-white font-mono text-sm outline-none focus:border-vendeur-emerald transition-all shadow-inner"
                />
              </div>
              <button
                onClick={handleUpdatePhone}
                disabled={savingPhone}
                className="h-14 px-6 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingPhone ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                <span>Enregistrer</span>
              </button>
              <button
                onClick={() => {
                  setStoreWhatsApp(activeNumber);
                  setIsEditingPhone(false);
                }}
                className="h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-vendeur-emerald" />
                <span className="font-mono text-sm font-bold text-white tracking-wider">{activeNumber || "Aucun numéro défini"}</span>
              </div>
              <span className="text-[10px] font-bold text-white/40">
                {isUsingCustomMeta ? "Ligne Dédiée Meta" : "Réseau Vendeur IA Cloud"}
              </span>
            </div>
          )}
        </div>

        {/* 3. Section Dédiée Meta Cloud (Collapsible) */}
        <div className="border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvancedMeta(!showAdvancedMeta)}
            className="flex items-center justify-between w-full text-left py-2 text-xs font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={15} />
              <span>Paramètres Développeur Meta Cloud (Optionnel)</span>
            </div>
            {showAdvancedMeta ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showAdvancedMeta && (
            <div className="space-y-4 pt-3 mt-2 border-t border-white/5 animate-in fade-in duration-300">
              <p className="text-[11px] text-white/40 leading-relaxed">
                Si vous possédez votre propre compte WhatsApp Business API vérifié sur Meta Business Suite, vous pouvez saisir vos clés dédiées ici.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 1048593849502"
                    value={metaForm.phoneNumberId}
                    onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">WABA ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 2049583920194"
                    value={metaForm.wabaId}
                    onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Access Token EAAG</label>
                <textarea
                  placeholder="Ex: EAAG..."
                  value={metaForm.accessToken}
                  onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                  className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white focus:border-vendeur-emerald outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSaveMetaConfig}
                disabled={savingMeta}
                className="h-11 px-6 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {savingMeta ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
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
