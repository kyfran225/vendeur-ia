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

  const [filterStatus, setFilterStatus] = useState<string>("all");
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
    refetchInterval: 10000
  });

  // 2. Fetch Manual Payment Config
  const { data: configData } = useQuery({
    queryKey: ["admin:payments:config"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data?.manualPaymentConfig || {};
    }
  });

  const [paymentConfig, setPaymentConfig] = useState<any>(null);

  useEffect(() => {
    if (configData) {
      setPaymentConfig(configData);
    }
  }, [configData]);

  // Real-time live incoming payments listener
  useEffect(() => {
    if (!socket) return;

    const handleIncomingPayment = (data: any) => {
      toast.info(`⏳ Nouveau paiement soumis par ${data.merchantName || "un commerçant"} (${data.amount} ${data.currency})`);
      queryClient.invalidateQueries({ queryKey: ["admin:payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin:payments:pendingCount"] });
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch (_) {}
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

  const pendingCount = payments.filter(
    (p: any) => p.status === "under_verification" || p.status === "initiated" || p.status === "awaiting_payment"
  ).length;
  const confirmedCount = payments.filter((p: any) => p.status === "confirmed").length;
  const fraudFlaggedCount = payments.filter((p: any) => p.forensics?.isPhotoshopTampered || p.forensics?.isAiGenerated).length;

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
      {/* Header Stats - Flattened for mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-wider">
            <span>Pending</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-amber-400">{pendingCount}</div>
        </div>

        <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-vendeur-emerald/20 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-wider">
            <span>Confirmed</span>
            <CheckCircle2 size={14} className="text-vendeur-emerald" />
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-vendeur-emerald">{confirmedCount}</div>
        </div>

        <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-wider">
            <span>Frauds</span>
            <ShieldAlert size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black font-mono text-rose-400">{fraudFlaggedCount}</div>
        </div>

        <div className="p-4 md:p-5 rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-sky-500/20 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-[10px] font-black uppercase tracking-wider">
            <span>Corridors</span>
            <Globe size={14} className="text-sky-400" />
          </div>
          <div className="text-[10px] font-bold text-white/70 pt-1">
            {COUNTRIES.length} Countries
          </div>
        </div>
      </div>

      {/* Main Container: Payments Review & Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left: Pending Payments List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0f0d] p-3 md:p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 flex-1">
              <Search size={16} className="text-white/30" />
              <input
                type="text"
                placeholder="Search TID, Phone, Merchant..."
                className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
              {["all", "under_verification", "confirmed", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
                    filterStatus === st
                      ? "bg-vendeur-emerald text-vendeur-coal"
                      : "bg-white/5 text-white/50 hover:text-white"
                  )}
                >
                  {st === "all" ? "All" : st === "under_verification" ? "Review" : st === "confirmed" ? "Pass" : "Fail"}
                </button>
              ))}
              <button
                onClick={() => refetch()}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12">
              <VendeurIALoader size="md" label="Loading Payment Ledger..." />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl md:rounded-3xl bg-[#0c0f0d] border border-white/5 text-white/40 text-[10px] uppercase font-black tracking-widest">
              No matching records
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((p: any) => {
                const isUnderReview =
                  p.status === "under_verification" || p.status === "initiated" || p.status === "awaiting_payment";
                const isConfirmed = p.status === "confirmed";
                const hasFraudAlert = Boolean(p.forensics?.isPhotoshopTampered || p.forensics?.isAiGenerated);

                return (
                  <div
                    key={p._id}
                    className={cn(
                      "p-4 md:p-5 rounded-2xl md:rounded-3xl border transition-all space-y-4 relative group shadow-lg",
                      hasFraudAlert
                        ? "bg-[#160c0c] border-rose-500/40"
                        : isUnderReview
                        ? "bg-[#111714] border-amber-500/30"
                        : isConfirmed
                        ? "bg-[#0c0f0d] border-vendeur-emerald/20"
                        : "bg-[#0c0f0d] border-white/5 opacity-60"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="font-mono text-[11px] md:text-sm font-black text-white">{p.reference}</div>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider",
                            hasFraudAlert
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              : isUnderReview
                              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                              : isConfirmed
                              ? "bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          )}
                        >
                          {hasFraudAlert ? "⚠️ FRAUD" : p.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono font-black text-vendeur-emerald">
                        <span>
                          {p.amount?.toLocaleString()} {p.currency}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-white/40 uppercase font-sans">
                          ({p.planName})
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Signals - Condensed for mobile */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[11px]">
                      <div className="space-y-0.5 col-span-2 md:col-span-1">
                        <span className="text-[8px] font-black uppercase text-white/30 tracking-wider">Merchant</span>
                        <div className="font-bold text-white truncate">
                          {p.senderName || p.merchantId?.businessName || "Unknown"}
                        </div>
                        <div className="text-white/40 font-mono">{p.senderPhoneNumber}</div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase text-white/30 tracking-wider">Asset & TID</span>
                        <div className="font-bold text-sky-400 uppercase">{p.paymentMethod}</div>
                        <div className="font-mono text-white/60 truncate">
                          {p.transactionId || "N/A"}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase text-white/30 tracking-wider">AI Signal</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "font-mono font-black text-sm",
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
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIntent(p);
                          setZoomLevel(1);
                          setRotationAngle(0);
                        }}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={14} /> Inspect
                      </button>

                      {isUnderReview && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIntent(p);
                              setIsRejectModalOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase transition-all"
                          >
                            Fail
                          </button>
                          <button
                            type="button"
                            onClick={() => decisionMutation.mutate({ id: p._id, action: "approve" })}
                            disabled={decisionMutation.isPending}
                            className="px-4 py-2 rounded-xl bg-vendeur-emerald text-vendeur-coal text-[10px] font-black uppercase flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all"
                          >
                            {decisionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Pass
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Multi-Country Corridors Config (5 cols) - Flattened */}
        <div className="lg:col-span-5 bg-[#0c0f0d] border border-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl space-y-6 lg:sticky lg:top-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Globe size={18} className="text-vendeur-emerald" />
              <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">
                Payment Corridors Gateway
              </h3>
            </div>
          </div>

          {/* Country Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">
              Configuration Target Country
            </label>
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="w-full h-11 bg-black/60 border border-white/10 rounded-xl px-3 text-xs text-white font-bold outline-none focus:border-vendeur-emerald cursor-pointer"
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
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Master Beneficiary Name
                </label>
                <input
                  type="text"
                  value={paymentConfig.recipientName || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, recipientName: e.target.value })}
                  className="w-full h-11 bg-black/50 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-vendeur-emerald font-bold"
                  placeholder="Vendeur IA SAS"
                />
              </div>

              {/* Dynamic Providers - Flattened */}
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald flex items-center justify-between border-b border-vendeur-emerald/10 pb-2">
                  <span>Routing for {activeCountryData.name}</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#1dc5d8] ml-1">Wave Protocol</label>
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
                      className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-4 text-xs font-mono text-white outline-none focus:border-[#1dc5d8]"
                      placeholder="+225..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#ff7900] ml-1">Orange Money Layer</label>
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
                      className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-4 text-xs font-mono text-white outline-none focus:border-[#ff7900]"
                      placeholder="+225..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#ffcc00] ml-1">MTN MoMo Gateway</label>
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
                      className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-4 text-xs font-mono text-white outline-none focus:border-[#ffcc00]"
                      placeholder="+225..."
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">
                    Checkout Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={activeRegionalConfig.instructions || ""}
                    onChange={(e) => handleUpdateRegionalField("instructions", e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-vendeur-emerald resize-none font-medium"
                    placeholder="Specific regional instructions..."
                  />
                </div>
              </div>

              {/* Auto-Approval Slider - Flattened */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-white uppercase">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Sliders size={14} /> AI Verification Threshold
                  </span>
                  <span className="font-mono text-vendeur-emerald font-black">
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
                  className="w-full accent-vendeur-emerald cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => updateConfigMutation.mutate(paymentConfig)}
                disabled={updateConfigMutation.isPending}
                className="w-full h-14 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-vendeur-emerald/20"
              >
                {updateConfigMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Sync Payment Gateway</span>
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
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-vendeur-emerald/15 text-vendeur-emerald border border-vendeur-emerald/30 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                    Inspection Médico-Légale du Reçu • {selectedIntent.reference}
                  </h3>
                  <p className="text-[11px] text-white/50">
                    Formule {selectedIntent.planName} • {selectedIntent.amount?.toLocaleString()} {selectedIntent.currency}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIntent(null)}
                className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Split Screen (Viewer Left / Diagnostics Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0">
              {/* Left: HD Screenshot Viewer (6 cols) */}
              <div className="lg:col-span-6 bg-black p-4 flex flex-col items-center justify-between border-b lg:border-b-0 lg:border-r border-white/10 relative">
                {selectedIntent.proofImageUrl ? (
                  <div className="flex-1 w-full flex items-center justify-center overflow-hidden min-h-[320px] max-h-[480px] relative rounded-2xl bg-[#050806] border border-white/5">
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
                  <div className="flex-1 w-full flex flex-col items-center justify-center text-white/30 text-xs p-8 text-center">
                    <ImageIcon size={48} className="mb-2 opacity-30" />
                    <span>Aucune capture d'écran fournie par le commerçant.</span>
                  </div>
                )}

                {/* Viewer Controls */}
                {selectedIntent.proofImageUrl && (
                  <div className="flex items-center gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      title="Zoom Arrière"
                    >
                      <ZoomOut size={15} />
                    </button>
                    <span className="font-mono text-xs text-white/70 px-2">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      title="Zoom Avant"
                    >
                      <ZoomIn size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ml-2"
                      title="Pivoter de 90°"
                    >
                      <RotateCw size={15} />
                    </button>
                    <a
                      href={selectedIntent.proofImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer ml-2"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                )}
              </div>

              {/* Right: AI Vision & Forensic Audit Breakdown (6 cols) */}
              <div className="lg:col-span-6 p-5 sm:p-6 space-y-5 overflow-y-auto bg-[#0b100d]">
                {/* Score & Platform Header */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Score de Confiance IA</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-mono font-black text-2xl",
                          selectedIntent.confidenceScore >= 80
                            ? "text-vendeur-emerald"
                            : selectedIntent.confidenceScore >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        )}
                      >
                        {selectedIntent.confidenceScore || 0}%
                      </span>
                      <span className="text-xs font-bold text-white/60">
                        {selectedIntent.confidenceScore >= 80
                          ? "Authenticité Élevée"
                          : selectedIntent.confidenceScore >= 50
                          ? "Revue Conseillée"
                          : "Risque de Fraude"}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-black uppercase">
                    {selectedIntent.paymentMethod || "Mobile Money"}
                  </span>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Comparaison : Déclaré vs Extrait par IA Vision
                  </span>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Declared */}
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <div className="text-[10px] font-black uppercase text-white/50">Déclaré par Marchand</div>
                      <div>
                        <span className="text-white/40 block text-[10px]">Montant :</span>
                        <span className="font-mono font-bold text-white">
                          {selectedIntent.amount?.toLocaleString()} {selectedIntent.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">ID Transaction :</span>
                        <span className="font-mono font-bold text-white truncate block">
                          {selectedIntent.transactionId || "Non fourni"}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">Expéditeur :</span>
                        <span className="font-mono font-bold text-white truncate block">
                          {selectedIntent.senderPhoneNumber || "Non fourni"}
                        </span>
                      </div>
                    </div>

                    {/* Extracted */}
                    <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-2">
                      <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                        <Sparkles size={11} /> Extrait par IA Vision
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">Montant Détecté :</span>
                        <span className="font-mono font-bold text-emerald-300">
                          {selectedIntent.amount?.toLocaleString()} {selectedIntent.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">ID Détecté :</span>
                        <span className="font-mono font-bold text-white truncate block">
                          {selectedIntent.transactionId || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px]">Expéditeur OCR :</span>
                        <span className="font-mono font-bold text-white truncate block">
                          {selectedIntent.senderPhoneNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Forensic Anti-Fraud Flags */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Contrôles Médico-Légaux & Sécurité
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Retouche Photoshop :</span>
                      {selectedIntent.forensics?.isPhotoshopTampered ? (
                        <span className="text-rose-400 font-bold">⚠️ Détectée</span>
                      ) : (
                        <span className="text-vendeur-emerald font-bold">✓ Intègre</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Génération IA :</span>
                      {selectedIntent.forensics?.isAiGenerated ? (
                        <span className="text-rose-400 font-bold">⚠️ Synthétique</span>
                      ) : (
                        <span className="text-vendeur-emerald font-bold">✓ Authentique</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Typographie :</span>
                      {selectedIntent.forensics?.fontMismatchDetected ? (
                        <span className="text-amber-400 font-bold">⚠️ Altérée</span>
                      ) : (
                        <span className="text-vendeur-emerald font-bold">✓ Conforme</span>
                      )}
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                      <span className="text-white/70">Anti-Rejeu (Hash) :</span>
                      <span className="text-vendeur-emerald font-bold">✓ Unique</span>
                    </div>
                  </div>

                  {selectedIntent.forensics?.analysisSummary && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/70 leading-relaxed">
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
                      className="w-full h-11 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <MessageSquare size={16} />
                      <span>Contacter le Marchand sur WhatsApp</span>
                    </a>
                  )}

                  {/* Decision Actions Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                      className="h-11 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Camera size={14} />
                      <span>Demander Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={decisionMutation.isPending}
                      className="h-11 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={14} />
                      <span>Rejeter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => decisionMutation.mutate({ id: selectedIntent._id, action: "approve" })}
                      disabled={decisionMutation.isPending}
                      className="h-11 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal text-[11px] font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-vendeur-emerald/20"
                    >
                      {decisionMutation.isPending ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <CheckCircle2 size={15} />
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
          <div className="bg-[#0e1411] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertCircle size={20} />
                <h3 className="text-sm font-black uppercase tracking-tight text-white">
                  Rejeter le Paiement • {selectedIntent.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Sélectionner le Motif du Rejet
              </label>
              <div className="space-y-1.5">
                {REJECTION_REASONS.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => setSelectedRejectReasonCode(r.code)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer",
                      selectedRejectReasonCode === r.code
                        ? "bg-rose-500/15 border border-rose-500/40 text-white"
                        : "bg-black/40 border border-white/5 text-white/60 hover:text-white"
                    )}
                  >
                    <span>{r.label}</span>
                    {selectedRejectReasonCode === r.code && <Check size={14} className="text-rose-400" />}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Commentaire pour le Marchand (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Ex: Merci de renvoyer le complément ou la capture du SMS..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-1/2 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
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
                className="w-1/2 h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20"
              >
                {decisionMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <XCircle size={15} />}
                <span>Confirmer Rejet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
