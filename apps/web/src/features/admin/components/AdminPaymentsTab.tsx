import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { apiClient } from "@/lib/apiClient";
import { useSocket } from "@/hooks/useSocket";
import { COUNTRIES } from "@vendeur-ia/core";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
  Filter,
  Search,
  ExternalLink,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Download,
  X,
  Phone,
  Globe,
  Sliders,
  Send,
  Camera,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { playPaymentNotificationChime } from "@/lib/audioUtils";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const REJECTION_REASONS = [
  { code: "amount_mismatch", label: "Montant reçu inférieur au tarif du forfait" },
  { code: "unreadable_receipt", label: "Reçu illisible, tronqué ou flou" },
  { code: "tx_not_found", label: "Numéro de transaction introuvable chez l'opérateur" },
  { code: "fraud_detected", label: "Falsification, retouche ou faux reçu détecté" },
  { code: "duplicate_receipt", label: "Reçu ou identifiant déjà utilisé sur un autre compte" },
  { code: "other", label: "Autre motif personnalisé" }
];

export function AdminPaymentsTab() {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { accessToken } = useAuthStore();
  const { isFounder } = useFounderRole();

  const [filterStatus, setFilterStatus] = useState<string>("under_verification");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal inspection state
  const [selectedIntent, setSelectedIntent] = useState<any | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRejectReasonCode, setSelectedRejectReasonCode] = useState<string>("amount_mismatch");
  const [rejectNotes, setRejectNotes] = useState<string>("");

  // Country config selector state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("CI");

  // 1. Fetch Payment Intents
  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ["admin:payments", filterStatus],
    queryFn: async () => {
      const url = filterStatus === "all" ? "/api/admin/payments" : `/api/admin/payments?status=${filterStatus}`;
      const res = await apiClient.get(url);
      return res.data;
    },
    enabled: !!accessToken && isFounder,
    refetchInterval: 10000
  });

  // 2. Fetch Manual Payment Config
  const { data: configData } = useQuery({
    queryKey: ["admin:payments:config"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data?.manualPaymentConfig || {};
    },
    enabled: !!accessToken && isFounder
  });

  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  useEffect(() => {
    if (configData) {
      setPaymentConfig(configData);
    }
  }, [configData]);

  // Real-time live incoming payments listener with Web Audio chime
  useEffect(() => {
    if (!socket) return;

    const handleIncomingPayment = (data: any) => {
      const intervalText = data.billingInterval === "yearly" ? "Annuel (-17%)" : "Mensuel";
      toast.info(`💰 Nouveau paiement soumis par ${data.merchantName || "un commerçant"} (${data.amount?.toLocaleString()} ${data.currency || "XOF"} • ${intervalText})`);
      queryClient.invalidateQueries({ queryKey: ["admin:payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin:payments:pendingCount"] });
      queryClient.invalidateQueries({ queryKey: ["admin:stats"] });
      playPaymentNotificationChime(0.6);
    };

    socket.on("admin:payment_incoming", handleIncomingPayment);
    socket.on("payment:pending_review", handleIncomingPayment);

    return () => {
      socket.off("admin:payment_incoming", handleIncomingPayment);
      socket.off("payment:pending_review", handleIncomingPayment);
    };
  }, [socket, queryClient]);

  // Mutation to update config
  const updateConfigMutation = useMutation({
    mutationFn: async (updated: any) => {
      const res = await apiClient.patch("/api/admin/payments/config", updated);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Paramètres de paiement et numéros multi-pays mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["admin:payments:config"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur de sauvegarde");
    }
  });

  // Mutation for Admin Decisions (Approve, Reject, Rescan)
  const decisionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      adminNotes,
      rejectionCode,
      rejectionReason
    }: {
      id: string;
      action: "approve" | "reject" | "request_rescan";
      adminNotes?: string;
      rejectionCode?: string;
      rejectionReason?: string;
    }) => {
      const res = await apiClient.post(`/api/admin/payments/${id}/decision`, {
        action,
        adminNotes,
        rejectionCode,
        rejectionReason
      });
      return res.data;
    },
    onSuccess: (data, vars) => {
      if (vars.action === "approve") {
        toast.success("Paiement validé & Abonnement activé avec succès ! 🎉");
      } else if (vars.action === "request_rescan") {
        toast.success("Demande de nouvelle capture transmise au commerçant.");
      } else {
        toast.success("Paiement rejeté et motif notifié au commerçant.");
      }
      setSelectedIntent(null);
      setIsRejectModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin:payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin:payments:pendingCount"] });
      queryClient.invalidateQueries({ queryKey: ["admin:stats"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur de traitement");
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copié dans le presse-papier !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPayments = payments.filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.reference?.toLowerCase().includes(q) ||
      p.transactionId?.toLowerCase().includes(q) ||
      p.senderPhoneNumber?.toLowerCase().includes(q) ||
      p.senderName?.toLowerCase().includes(q) ||
      p.merchantId?.businessName?.toLowerCase().includes(q) ||
      p.planName?.toLowerCase().includes(q)
    );
  });

  const pendingCount = payments.filter((p: any) => p.status === "under_verification").length;
  const confirmedCount = payments.filter((p: any) => p.status === "confirmed").length;
  const fraudFlaggedCount = payments.filter((p: any) => p.forensics?.isPhotoshopTampered || p.forensics?.isAiGenerated).length;
  const draftsCount = payments.filter((p: any) => p.status === "initiated").length;

  // Selected Country data for configuration
  const activeCountryData = COUNTRIES.find((c) => c.code === selectedCountryCode) || COUNTRIES[0];
  const activeRegionalConfig = paymentConfig?.regionalRoutes?.find(
    (r: any) => r.countryCode === selectedCountryCode
  ) || {};

  const handleUpdateRegionalField = (field: string, value: any) => {
    const existingRoutes = paymentConfig?.regionalRoutes || [];
    const index = existingRoutes.findIndex((r: any) => r.countryCode === selectedCountryCode);

    let updatedRoutes = [...existingRoutes];
    if (index >= 0) {
      updatedRoutes[index] = { ...updatedRoutes[index], [field]: value };
    } else {
      updatedRoutes.push({ countryCode: selectedCountryCode, [field]: value });
    }

    setPaymentConfig({ ...paymentConfig, regionalRoutes: updatedRoutes });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Header Stats - Clear & Readable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-amber-400/90 text-xs md:text-sm font-black uppercase tracking-wider">
            <span>À Vérifier</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="text-3xl md:text-4xl font-black font-mono text-amber-400">{pendingCount}</div>
        </div>

        <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-vendeur-emerald/30 space-y-2">
          <div className="flex items-center justify-between text-vendeur-emerald/90 text-xs md:text-sm font-black uppercase tracking-wider">
            <span>Validés</span>
            <CheckCircle2 size={18} className="text-vendeur-emerald" />
          </div>
          <div className="text-3xl md:text-4xl font-black font-mono text-vendeur-emerald">{confirmedCount}</div>
        </div>

        <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between text-rose-400/90 text-xs md:text-sm font-black uppercase tracking-wider">
            <span>Alertes Fraude</span>
            <ShieldAlert size={18} className="text-rose-400" />
          </div>
          <div className="text-3xl md:text-4xl font-black font-mono text-rose-400">{fraudFlaggedCount}</div>
        </div>

        <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-sky-500/30 space-y-2">
          <div className="flex items-center justify-between text-sky-400/90 text-xs md:text-sm font-black uppercase tracking-wider">
            <span>Brouillons / Clics</span>
            <Smartphone size={18} className="text-sky-400" />
          </div>
          <div className="text-3xl md:text-4xl font-black font-mono text-sky-400">{draftsCount}</div>
        </div>
      </div>

      {/* Main Container: Payments Review & Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left: Pending Payments List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0f0d] p-4 md:p-5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-3 flex-1">
              <Search size={18} className="text-white/40" />
              <input
                type="text"
                placeholder="Rechercher Réf, TID, Téléphone, Marchand..."
                className="bg-transparent text-sm md:text-base text-white placeholder:text-white/40 outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar pt-1 sm:pt-0">
              {[
                { id: "under_verification", label: `À Vérifier (${pendingCount})` },
                { id: "all", label: "Tous" },
                { id: "confirmed", label: "Validés" },
                { id: "rejected", label: "Rejetés" },
                { id: "initiated", label: "Brouillons" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                    filterStatus === tab.id
                      ? "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-vendeur-emerald/20 font-black scale-105"
                      : "bg-white/10 text-white/70 hover:text-white hover:bg-white/15"
                  )}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => refetch()}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
                title="Actualiser"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12">
              <VendeurIALoader size="md" label="Chargement des paiements..." />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-white/10 text-white/60 text-sm md:text-base uppercase font-black tracking-wider">
              Aucun paiement dans cette catégorie
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((p: any) => {
                const isUnderReview = p.status === "under_verification";
                const isInitiated = p.status === "initiated";
                const isConfirmed = p.status === "confirmed";
                const isRejected = p.status === "rejected";
                const hasFraudAlert = Boolean(p.forensics?.isPhotoshopTampered || p.forensics?.isAiGenerated);
                const isYearly = p.billingInterval === "yearly";

                const formattedDate = p.createdAt
                  ? `${new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} à ${new Date(p.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                  : "";

                return (
                  <div
                    key={p._id}
                    className={cn(
                      "p-5 md:p-6 rounded-2xl md:rounded-3xl border transition-all space-y-4 relative group shadow-xl",
                      hasFraudAlert
                        ? "bg-[#1a0e0e] border-rose-500/50"
                        : isUnderReview
                        ? "bg-[#111915] border-amber-500/50 ring-2 ring-amber-500/20"
                        : isConfirmed
                        ? "bg-[#0c0f0d] border-vendeur-emerald/30"
                        : isInitiated
                        ? "bg-[#0c0f0d] border-white/10 opacity-80"
                        : "bg-[#0c0f0d] border-white/10 opacity-60"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="font-mono text-sm md:text-base font-black text-white">{p.reference}</div>
                        
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                            hasFraudAlert
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                              : isUnderReview
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 font-black"
                              : isConfirmed
                              ? "bg-vendeur-emerald/20 text-vendeur-emerald border border-vendeur-emerald/40 font-black"
                              : isInitiated
                              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold"
                              : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          )}
                        >
                          {hasFraudAlert
                            ? "⚠️ FRAUDE DÉTECTÉE"
                            : isUnderReview
                            ? "⏳ À VÉRIFIER"
                            : isConfirmed
                            ? "✓ VALIDÉ"
                            : isInitiated
                            ? "BROUILLON (NON SOUMIS)"
                            : "REJETÉ"}
                        </span>

                        {/* Interval badge */}
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider",
                            isYearly
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                              : "bg-white/10 text-white/80 border border-white/15"
                          )}
                        >
                          {isYearly ? "Annuel (-17%)" : "Mensuel"}
                        </span>

                        {formattedDate && (
                          <span className="text-xs text-white/50 font-mono flex items-center gap-1.5 ml-1">
                            <Clock size={13} /> {formattedDate}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-base md:text-lg font-mono font-black text-vendeur-emerald">
                        <span>
                          {p.amount?.toLocaleString("fr-FR")} {p.currency}
                        </span>
                        <span className="text-xs md:text-sm text-white/60 uppercase font-sans font-bold">
                          ({p.planName})
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Signals - Big & Bold */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs md:text-sm">
                      <div className="space-y-1 col-span-2 md:col-span-1">
                        <span className="text-[11px] font-black uppercase text-white/40 tracking-wider">Commerçant</span>
                        <div className="font-black text-white text-sm md:text-base truncate">
                          {p.senderName || p.merchantId?.businessName || "Commerçant"}
                        </div>
                        <div className="text-white/70 font-mono text-xs">{p.senderPhoneNumber || "Numéro non renseigné"}</div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-black uppercase text-white/40 tracking-wider">Réseau & TID</span>
                        <div className="font-black text-sky-400 text-sm md:text-base uppercase">{p.paymentMethod || "Wave"}</div>
                        <div className="font-mono text-white/80 truncate text-xs">
                          {p.transactionId ? `TID: ${p.transactionId}` : "TID: Non fourni"}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-black uppercase text-white/40 tracking-wider">Preuve Reçu</span>
                        <div className="pt-0.5">
                          {p.proofImageUrl ? (
                            <span className="text-xs md:text-sm font-black text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <ImageIcon size={14} /> Reçu HD joint
                            </span>
                          ) : (
                            <span className="text-xs text-white/40">
                              Sans capture
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-black uppercase text-white/40 tracking-wider">Signal IA</span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span
                            className={cn(
                              "font-mono font-black text-base md:text-lg",
                              p.confidenceScore >= 80
                                ? "text-vendeur-emerald"
                                : p.confidenceScore >= 50
                                ? "text-amber-400"
                                : "text-rose-400"
                            )}
                          >
                            {p.confidenceScore || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIntent(p);
                          setZoomLevel(1);
                          setRotationAngle(0);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-black uppercase flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Eye size={16} /> Inspecter
                      </button>

                      <div className="flex items-center gap-2.5">
                        {isUnderReview && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedIntent(p);
                                setIsRejectModalOpen(true);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs md:text-sm font-black uppercase transition-all cursor-pointer"
                            >
                              Rejeter
                            </button>
                            <button
                              type="button"
                              onClick={() => decisionMutation.mutate({ id: p._id, action: "approve" })}
                              disabled={decisionMutation.isPending}
                              className="px-5 py-2.5 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal text-xs md:text-sm font-black uppercase flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer"
                            >
                              {decisionMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                              Valider & Activer
                            </button>
                          </>
                        )}
                        {isInitiated && (
                          <span className="text-xs md:text-sm text-white/50 italic">
                            En attente de confirmation par le client...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Multi-Country Corridors Config (5 cols) - Flattened */}
        <div className="lg:col-span-5 bg-[#0c0f0d] border border-white/10 p-5 md:p-7 rounded-2xl md:rounded-3xl space-y-6 lg:sticky lg:top-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <Globe size={20} className="text-vendeur-emerald" />
              <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-white">
                Passerelles de Paiement
              </h3>
            </div>
          </div>

          {/* Country Selector Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-1">
              Pays Cible de la Configuration
            </label>
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="w-full h-12 bg-black/60 border border-white/15 rounded-xl px-4 text-sm text-white font-bold outline-none focus:border-vendeur-emerald cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#121212] text-white">
                  {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>

          {paymentConfig && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-1">
                  Nom du Bénéficiaire Officiel
                </label>
                <input
                  type="text"
                  value={paymentConfig.recipientName || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, recipientName: e.target.value })}
                  className="w-full h-12 bg-black/50 border border-white/15 rounded-xl px-4 text-sm text-white outline-none focus:border-vendeur-emerald font-bold"
                  placeholder="Vendeur IA SAS"
                />
              </div>

              {/* Dynamic Providers */}
              <div className="space-y-4">
                <div className="text-xs md:text-sm font-black uppercase tracking-widest text-vendeur-emerald flex items-center justify-between border-b border-vendeur-emerald/20 pb-2">
                  <span>Numéros pour {activeCountryData.name}</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-[#1dc5d8] ml-1">Numéro Wave</label>
                    <input
                      type="text"
                      value={activeRegionalConfig.waveNumber || (selectedCountryCode === "CI" ? paymentConfig.waveNumber : "") || ""}
                      onChange={(e) => {
                        if (selectedCountryCode === "CI") {
                          setPaymentConfig({ ...paymentConfig, waveNumber: e.target.value });
                        } else {
                          handleUpdateRegionalField("waveNumber", e.target.value);
                        }
                      }}
                      className="w-full h-12 bg-black/50 border border-white/15 rounded-xl px-4 text-sm font-mono text-white outline-none focus:border-[#1dc5d8]"
                      placeholder="+225..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-[#ff7900] ml-1">Numéro Orange Money</label>
                    <input
                      type="text"
                      value={activeRegionalConfig.orangeMoneyNumber || (selectedCountryCode === "CI" ? paymentConfig.orangeMoneyNumber : "") || ""}
                      onChange={(e) => {
                        if (selectedCountryCode === "CI") {
                          setPaymentConfig({ ...paymentConfig, orangeMoneyNumber: e.target.value });
                        } else {
                          handleUpdateRegionalField("orangeMoneyNumber", e.target.value);
                        }
                      }}
                      className="w-full h-12 bg-black/50 border border-white/15 rounded-xl px-4 text-sm font-mono text-white outline-none focus:border-[#ff7900]"
                      placeholder="+225..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-[#ffcc00] ml-1">Numéro MTN MoMo</label>
                    <input
                      type="text"
                      value={activeRegionalConfig.mtnNumber || (selectedCountryCode === "CI" ? paymentConfig.mtnNumber : "") || ""}
                      onChange={(e) => {
                        if (selectedCountryCode === "CI") {
                          setPaymentConfig({ ...paymentConfig, mtnNumber: e.target.value });
                        } else {
                          handleUpdateRegionalField("mtnNumber", e.target.value);
                        }
                      }}
                      className="w-full h-12 bg-black/50 border border-white/15 rounded-xl px-4 text-sm font-mono text-white outline-none focus:border-[#ffcc00]"
                      placeholder="+225..."
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-1">
                    Instructions au Checkout
                  </label>
                  <textarea
                    rows={3}
                    value={activeRegionalConfig.instructions || ""}
                    onChange={(e) => handleUpdateRegionalField("instructions", e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl p-4 text-sm text-white outline-none focus:border-vendeur-emerald resize-none font-medium"
                    placeholder="Instructions spécifiques..."
                  />
                </div>
              </div>

              {/* Auto-Approval Slider */}
              <div className="p-5 rounded-2xl bg-black/50 border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs md:text-sm font-bold text-white uppercase">
                  <span className="flex items-center gap-2 text-sky-400">
                    <Sliders size={16} /> Seuil d'Auto-Validation IA
                  </span>
                  <span className="font-mono text-vendeur-emerald font-black text-base">
                    {paymentConfig.autoApproveConfidenceThreshold || 95}%
                  </span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  step="5"
                  value={paymentConfig.autoApproveConfidenceThreshold || 95}
                  onChange={(e) =>
                    setPaymentConfig({
                      ...paymentConfig,
                      autoApproveConfidenceThreshold: Number(e.target.value)
                    })
                  }
                  className="w-full accent-vendeur-emerald cursor-pointer h-2"
                />
              </div>

              <button
                type="button"
                onClick={() => updateConfigMutation.mutate(paymentConfig)}
                disabled={updateConfigMutation.isPending}
                className="w-full h-14 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-widest text-xs md:text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
              >
                {updateConfigMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>Enregistrer la Passerelle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* --- MODAL 1: HD FORENSIC RECEIPT INSPECTION & AI DIAGNOSTIC MODAL --- */}
      {/* ========================================================================= */}
      {selectedIntent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0b100d] border border-white/15 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-vendeur-emerald/15 text-vendeur-emerald border border-vendeur-emerald/30 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    Inspection Médico-Légale du Reçu • {selectedIntent.reference}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/60 mt-0.5">
                    Formule {selectedIntent.planName} • {selectedIntent.amount?.toLocaleString()} {selectedIntent.currency} ({selectedIntent.billingInterval === "yearly" ? "Annuel" : "Mensuel"})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIntent(null)}
                className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Split Screen */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0">
              {/* Left: HD Screenshot Viewer (6 cols) */}
              <div className="lg:col-span-6 bg-black p-5 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative">
                {selectedIntent.proofImageUrl ? (
                  <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-[340px] max-h-[500px] relative rounded-2xl bg-[#050806] border border-white/5">
                    <img
                      src={selectedIntent.proofImageUrl}
                      alt="Capture de reçu de paiement"
                      className="max-h-full max-w-full object-contain transition-transform duration-200"
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 w-full flex flex-col items-center justify-center text-white/40 text-sm p-8 text-center">
                    <ImageIcon size={52} className="mb-3 opacity-40" />
                    <span>Aucune capture d'écran fournie par le commerçant.</span>
                  </div>
                )}

                {/* Viewer Controls */}
                {selectedIntent.proofImageUrl && (
                  <div className="flex items-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      title="Zoom Arrière"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="font-mono text-sm text-white/80 px-2">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      title="Zoom Avant"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ml-2"
                      title="Pivoter de 90°"
                    >
                      <RotateCw size={16} />
                    </button>
                    <a
                      href={selectedIntent.proofImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ml-2"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                )}
              </div>

              {/* Right: AI Vision & Forensic Audit Breakdown (6 cols) */}
              <div className="lg:col-span-6 p-5 sm:p-7 space-y-6 overflow-y-auto bg-[#0b100d]">
                {/* Score & Platform Header */}
                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-wider text-white/50">Score de Confiance IA</span>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "font-mono font-black text-3xl",
                          selectedIntent.confidenceScore >= 80
                            ? "text-vendeur-emerald"
                            : selectedIntent.confidenceScore >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        )}
                      >
                        {selectedIntent.confidenceScore || 0}%
                      </span>
                      <span className="text-sm font-bold text-white/70">
                        {selectedIntent.confidenceScore >= 80
                          ? "Authenticité Élevée"
                          : selectedIntent.confidenceScore >= 50
                          ? "Revue Conseillée"
                          : "Risque de Fraude"}
                      </span>
                    </div>
                  </div>

                  <span className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs md:text-sm font-black uppercase">
                    {selectedIntent.paymentMethod || "Mobile Money"}
                  </span>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-widest text-white/50">
                    Comparaison : Déclaré vs Extrait par IA Vision
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                    {/* Declared */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-xs font-black uppercase text-white/60">Déclaré par Marchand</div>
                      <div>
                        <span className="text-white/40 block text-xs">Montant :</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {selectedIntent.amount?.toLocaleString()} {selectedIntent.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs">ID Transaction :</span>
                        <span className="font-mono font-bold text-white truncate block text-sm">
                          {selectedIntent.transactionId || "Non fourni"}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs">Expéditeur :</span>
                        <span className="font-mono font-bold text-white truncate block text-sm">
                          {selectedIntent.senderPhoneNumber || "Non fourni"}
                        </span>
                      </div>
                    </div>

                    {/* Extracted */}
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                      <div className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <Sparkles size={13} /> Extrait par IA Vision
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs">Montant Détecté :</span>
                        <span className="font-mono font-bold text-emerald-300 text-sm">
                          {selectedIntent.amount?.toLocaleString()} {selectedIntent.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs">ID Détecté :</span>
                        <span className="font-mono font-bold text-white truncate block text-sm">
                          {selectedIntent.transactionId || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-xs">Expéditeur OCR :</span>
                        <span className="font-mono font-bold text-white truncate block text-sm">
                          {selectedIntent.senderPhoneNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Forensic Anti-Fraud Flags */}
                <div className="space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-widest text-white/50">
                    Contrôles Médico-Légaux & Sécurité
                  </span>

                  <div className="grid grid-cols-2 gap-2.5 text-xs md:text-sm">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Retouche Photoshop :</span>
                      {selectedIntent.forensics?.isPhotoshopTampered ? (
                        <span className="text-rose-400 font-bold">⚠️ Détectée</span>
                      ) : (
                        <span className="text-vendeur-emerald font-bold">✓ Intègre</span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Génération IA :</span>
                      {selectedIntent.forensics?.isAiGenerated ? (
                        <span className="text-rose-400 font-bold">⚠️ Synthétique</span>
                      ) : (
                        <span className="text-vendeur-emerald font-bold">✓ Authentique</span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Typographie :</span>
                      {selectedIntent.forensics?.fontMismatchDetected ? (
                        <span className="text-amber-400 font-bold">⚠️ Altérée</span>
                      ) : (
                        <span className="text-vendeur-emerald font-bold">✓ Conforme</span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Anti-Rejeu (Hash) :</span>
                      <span className="text-vendeur-emerald font-bold">✓ Unique</span>
                    </div>
                  </div>

                  {selectedIntent.forensics?.analysisSummary && (
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs md:text-sm text-white/80 leading-relaxed">
                      <span className="font-bold text-white">Diagnostic IA : </span>
                      {selectedIntent.forensics.analysisSummary}
                    </div>
                  )}
                </div>

                {/* Direct Merchant Contact & Decision Actions */}
                <div className="pt-2 space-y-3">
                  {/* WhatsApp Direct Link */}
                  {selectedIntent.senderPhoneNumber && (
                    <a
                      href={`https://wa.me/${selectedIntent.senderPhoneNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Bonjour ${selectedIntent.senderName || ""}, nous avons bien reçu votre demande d'activation Vendeur IA (Réf: ${selectedIntent.reference}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs md:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MessageSquare size={18} />
                      <span>Contacter le Marchand sur WhatsApp</span>
                    </a>
                  )}

                  {/* Decision Actions Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        decisionMutation.mutate({
                          id: selectedIntent._id,
                          action: "request_rescan",
                          adminNotes: "Veuillez fournir une capture d'écran nette et complète de votre reçu de transfert."
                        })
                      }
                      disabled={decisionMutation.isPending}
                      className="h-12 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs md:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Camera size={16} />
                      <span>Demander Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={decisionMutation.isPending}
                      className="h-12 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs md:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={16} />
                      <span>Rejeter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => decisionMutation.mutate({ id: selectedIntent._id, action: "approve" })}
                      disabled={decisionMutation.isPending}
                      className="h-12 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal text-xs md:text-sm font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-vendeur-emerald/20"
                    >
                      {decisionMutation.isPending ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      <span>Valider & Activer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 2: STRUCTURED REJECTION WITH REASON SELECTOR --- */}
      {/* ========================================================================= */}
      {isRejectModalOpen && selectedIntent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0e1411] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertCircle size={22} />
                <h3 className="text-sm md:text-base font-black uppercase tracking-tight text-white">
                  Rejeter le Paiement • {selectedIntent.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-white/50">
                Sélectionner le Motif du Rejet
              </label>
              <div className="space-y-2">
                {REJECTION_REASONS.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setSelectedRejectReasonCode(r.code)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-between cursor-pointer",
                      selectedRejectReasonCode === r.code
                        ? "bg-rose-500/20 border border-rose-500/50 text-white shadow-md"
                        : "bg-black/50 border border-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    <span>{r.label}</span>
                    {selectedRejectReasonCode === r.code && <Check size={16} className="text-rose-400 shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/50">
                  Commentaire pour le Marchand (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Ex: Merci de renvoyer le complément ou la capture du SMS..."
                  className="w-full bg-black/50 border border-white/15 rounded-xl p-3.5 text-xs md:text-sm text-white outline-none focus:border-rose-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-1/2 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedReason = REJECTION_REASONS.find((r) => r.code === selectedRejectReasonCode)?.label;
                  decisionMutation.mutate({
                    id: selectedIntent._id,
                    action: "reject",
                    rejectionCode: selectedRejectReasonCode,
                    rejectionReason: selectedReason,
                    adminNotes: rejectNotes ? `${selectedReason} - Note: ${rejectNotes}` : selectedReason
                  });
                }}
                disabled={decisionMutation.isPending}
                className="w-1/2 h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs md:text-sm font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
              >
                {decisionMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                <span>Confirmer Rejet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
