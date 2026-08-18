import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { apiClient } from "@/lib/apiClient";
import {
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Save,
  Filter,
  Search,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AdminPaymentsTab() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  React.useEffect(() => {
    if (configData) {
      setPaymentConfig(configData);
    }
  }, [configData]);

  // Mutation to update config
  const updateConfigMutation = useMutation({
    mutationFn: async (updated: any) => {
      const res = await apiClient.patch("/api/admin/payments/config", updated);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Numéros de paiement Mobile Money mis à jour avec succès ! ✅");
      queryClient.invalidateQueries({ queryKey: ["admin:payments:config"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur de sauvegarde");
    }
  });

  // Mutation to approve/reject
  const decisionMutation = useMutation({
    mutationFn: async ({ id, action, adminNotes }: { id: string; action: "approve" | "reject"; adminNotes?: string }) => {
      const res = await apiClient.post(`/api/admin/payments/${id}/decision`, {
        action,
        adminNotes
      });
      return res.data;
    },
    onSuccess: (data, vars) => {
      toast.success(vars.action === "approve" ? "🎉 Paiement validé & Abonnement activé !" : "Paiement rejeté.");
      queryClient.invalidateQueries({ queryKey: ["admin:payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin:stats"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur de traitement");
    }
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copié !");
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
      p.merchantId?.businessName?.toLowerCase().includes(q)
    );
  });

  const pendingCount = payments.filter((p: any) => p.status === "under_verification" || p.status === "initiated" || p.status === "awaiting_payment").length;
  const confirmedCount = payments.filter((p: any) => p.status === "confirmed").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#0c0f0d] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs font-black uppercase tracking-wider">
            <span>En Attente de Vérification</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">{pendingCount}</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c0f0d] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs font-black uppercase tracking-wider">
            <span>Souscriptions Confirmées</span>
            <CheckCircle2 size={16} className="text-vendeur-emerald" />
          </div>
          <div className="text-3xl font-black font-mono text-vendeur-emerald">{confirmedCount}</div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0c0f0d] border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-white/40 text-xs font-black uppercase tracking-wider">
            <span>Moteur Anti-Fraude</span>
            <ShieldCheck size={16} className="text-sky-400" />
          </div>
          <div className="text-xs font-bold text-white/60">
            Anti-rejeu actif & validation 1-clic
          </div>
        </div>
      </div>

      {/* Main Container: Payments Review & Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Pending Payments List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c0f0d] p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 flex-1">
              <Search size={16} className="text-white/30" />
              <input
                type="text"
                placeholder="Rechercher par référence, transaction ID, téléphone..."
                className="bg-transparent text-xs text-white placeholder:text-white/30 outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
              {["all", "under_verification", "confirmed", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    filterStatus === st
                      ? "bg-vendeur-emerald text-vendeur-coal"
                      : "bg-white/5 text-white/50 hover:text-white"
                  )}
                >
                  {st === "all" ? "Tous" : st === "under_verification" ? "À Vérifier" : st === "confirmed" ? "Validés" : "Rejetés"}
                </button>
              ))}
              <button
                onClick={() => refetch()}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
                title="Actualiser"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12">
              <VendeurIALoader size="md" label="Chargement des intentions de paiement..." />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#0c0f0d] border border-white/5 text-white/40 text-xs">
              Aucun paiement correspondant.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((p: any) => {
                const isUnderReview = p.status === "under_verification" || p.status === "initiated" || p.status === "awaiting_payment";
                const isConfirmed = p.status === "confirmed";

                return (
                  <div
                    key={p._id}
                    className={cn(
                      "p-5 rounded-3xl border transition-all space-y-4",
                      isUnderReview
                        ? "bg-[#111714] border-amber-500/30 shadow-lg shadow-amber-500/5"
                        : isConfirmed
                        ? "bg-[#0c0f0d] border-vendeur-emerald/20"
                        : "bg-[#0c0f0d] border-white/5 opacity-60"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-sm font-black text-white">{p.reference}</div>
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            isUnderReview
                              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                              : isConfirmed
                              ? "bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          )}
                        >
                          {p.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono font-black text-vendeur-emerald">
                        <span>{p.amount?.toLocaleString()} {p.currency}</span>
                        <span className="text-[10px] text-white/40 uppercase font-sans">({p.planName} - {p.billingInterval})</span>
                      </div>
                    </div>

                    {/* Metadata & Signals */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-wider">Client / Boutique</span>
                        <div className="font-bold text-white truncate">{p.senderName || p.merchantId?.businessName || "Commerçant"}</div>
                        <div className="text-white/50 text-[11px] font-mono">{p.senderPhoneNumber || "Numéro non précisé"}</div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-wider">Moyen & Transaction ID</span>
                        <div className="font-bold text-sky-400 uppercase">{p.paymentMethod}</div>
                        <div className="font-mono text-[11px] text-white/80 truncate">
                          {p.transactionId || "Aucun ID renseigné"}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-white/40 tracking-wider">Score Confiance</span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "font-mono font-black text-sm",
                            p.confidenceScore >= 80 ? "text-vendeur-emerald" : p.confidenceScore >= 50 ? "text-amber-400" : "text-rose-400"
                          )}>
                            {p.confidenceScore || 0}%
                          </span>
                          <span className="text-[9px] text-white/40">
                            {p.confidenceScore >= 80 ? "Élevé" : "À vérifier"}
                          </span>
                        </div>
                        <div className="text-[9px] text-white/30">
                          {new Date(p.createdAt).toLocaleString("fr-FR")}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons if under review */}
                    {isUnderReview && (
                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          onClick={() => decisionMutation.mutate({ id: p._id, action: "reject", adminNotes: "Paiement non identifié" })}
                          disabled={decisionMutation.isPending}
                          className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Rejeter
                        </button>
                        <button
                          onClick={() => decisionMutation.mutate({ id: p._id, action: "approve" })}
                          disabled={decisionMutation.isPending}
                          className="px-5 py-2.5 rounded-xl bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer"
                        >
                          <CheckCircle2 size={16} />
                          <span>Valider & Activer l'Abonnement</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Manual Payment Numbers Config (4 cols) */}
        <div className="lg:col-span-4 bg-[#0c0f0d] border border-white/5 p-6 rounded-3xl space-y-5 sticky top-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <Smartphone size={20} className="text-vendeur-emerald" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Numéros de Réception Mobile Money
            </h3>
          </div>

          <p className="text-xs text-white/50 leading-relaxed">
            Ces numéros sont directement affichés aux commerçants lors du paiement de leur abonnement Vendeur IA.
          </p>

          {paymentConfig && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Nom du Bénéficiaire</label>
                <input
                  type="text"
                  value={paymentConfig.recipientName || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, recipientName: e.target.value })}
                  className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-vendeur-emerald"
                  placeholder="Vendeur IA"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#1dc5d8]">Numéro Wave</label>
                <input
                  type="text"
                  value={paymentConfig.waveNumber || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, waveNumber: e.target.value })}
                  className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-mono text-white outline-none focus:border-[#1dc5d8]"
                  placeholder="+2250700000000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#ff7900]">Numéro Orange Money</label>
                <input
                  type="text"
                  value={paymentConfig.orangeMoneyNumber || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, orangeMoneyNumber: e.target.value })}
                  className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-mono text-white outline-none focus:border-[#ff7900]"
                  placeholder="+2250700000000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#ffcc00]">Numéro MTN MoMo</label>
                <input
                  type="text"
                  value={paymentConfig.mtnNumber || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, mtnNumber: e.target.value })}
                  className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-mono text-white outline-none focus:border-[#ffcc00]"
                  placeholder="+2250500000000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#0066b2]">Numéro Moov Money</label>
                <input
                  type="text"
                  value={paymentConfig.moovNumber || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, moovNumber: e.target.value })}
                  className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-mono text-white outline-none focus:border-[#0066b2]"
                  placeholder="+2250100000000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#10b981]">Tag Djamo</label>
                <input
                  type="text"
                  value={paymentConfig.djamoTag || ""}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, djamoTag: e.target.value })}
                  className="w-full h-10 bg-black/50 border border-white/10 rounded-xl px-3 text-xs font-mono text-white outline-none focus:border-[#10b981]"
                  placeholder="$vendeuria"
                />
              </div>

              <button
                type="button"
                onClick={() => updateConfigMutation.mutate(paymentConfig)}
                disabled={updateConfigMutation.isPending}
                className="w-full h-11 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 mt-4 cursor-pointer"
              >
                {updateConfigMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Enregistrer les numéros</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
