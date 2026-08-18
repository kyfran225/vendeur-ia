import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  RefreshCw, 
  Sparkles, 
  Smartphone, 
  Hash, 
  Calendar, 
  DollarSign,
  X
} from "lucide-react";
import { toast } from "sonner";

interface PaymentProofAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentProofAuditorModal({ isOpen, onClose }: PaymentProofAuditorModalProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "tester">("logs");

  // Fetch audit logs
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["payment-proofs"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/payment-proofs");
      return res.data;
    },
    enabled: isOpen
  });

  // Direct Scan Tester Mutation
  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post("/api/commerce/payment-proofs/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Audit médico-légal terminé avec succès !");
      queryClient.invalidateQueries({ queryKey: ["payment-proofs"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'analyse");
    }
  });

  // Review mutation (Approve/Reject)
  const reviewMutation = useMutation({
    mutationFn: async ({ logId, action }: { logId: string; action: "approve" | "reject" }) => {
      const res = await apiClient.post(`/api/commerce/payment-proofs/${logId}/review`, { action });
      return res.data;
    },
    onSuccess: (data, vars) => {
      toast.success(vars.action === "approve" ? "Paiement validé manuellement !" : "Preuve rejetée");
      queryClient.invalidateQueries({ queryKey: ["payment-proofs"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de la mise à jour");
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      scanMutation.mutate(file);
    }
  };

  if (!isOpen) return null;

  const proofs = data?.proofs || [];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0B1512] border-t sm:border border-white/10 w-full max-w-4xl h-[94vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Mobile Pull Handle */}
        <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Shield size={22} className="animate-pulse shrink-0" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white truncate">
                  Shield OCR Anti-Fraude
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                  Forensic IA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/50 line-clamp-1 sm:line-clamp-none">
                Audit des captures Wave, Orange Money et MTN (Détection Photoshop, IA & Doublons).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center shrink-0 transition-colors active:scale-95"
            title="Fermer"
          >
            <X size={18} className="shrink-0" />
          </button>
        </div>

        {/* Navigation Tabs - Mobile Optimized */}
        <div className="flex border-b border-white/5 bg-white/[0.01] px-3 sm:px-6">
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex-1 sm:flex-initial py-3.5 px-3 sm:px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === "logs"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <ShieldCheck size={14} className="shrink-0" />
            <span>Registre d'Audit</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono shrink-0">
              {proofs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("tester")}
            className={`flex-1 sm:flex-initial py-3.5 px-3 sm:px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === "tester"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Sparkles size={14} className="shrink-0 text-emerald-400" />
            <span>Tester une Capture</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-28 sm:pb-6">
          {activeTab === "logs" ? (
            <div>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/50 gap-3">
                  <RefreshCw size={24} className="animate-spin text-emerald-400 shrink-0" />
                  <p className="text-xs">Chargement du journal d'audit Shield...</p>
                </div>
              ) : proofs.length === 0 ? (
                <div className="text-center py-16 space-y-3 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                  <ShieldCheck size={48} className="mx-auto text-emerald-400/40 shrink-0" />
                  <p className="text-sm font-black uppercase text-white">Aucune capture d'écran reçue pour l'instant</p>
                  <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">
                    Dès qu'un client envoie un reçu sur WhatsApp, Shield OCR analysera l'authenticité et l'affichera ici en temps réel.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {proofs.map((proof: any) => {
                    const isApproved = proof.decision === "AUTO_APPROVED" || proof.merchantDecision === "approved";
                    const isFraud = proof.decision === "REJECTED_FRAUD" || proof.merchantDecision === "rejected";
                    const isReview = proof.decision === "FLAGGED_FOR_REVIEW" && !proof.reviewedByMerchant;

                    return (
                      <div
                        key={proof._id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isApproved
                            ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-[0_4px_15px_rgba(16,185,129,0.05)]"
                            : isFraud
                            ? "bg-rose-500/[0.03] border-rose-500/20 shadow-[0_4px_15px_rgba(244,63,94,0.05)]"
                            : "bg-amber-500/[0.03] border-amber-500/30 shadow-[0_4px_15px_rgba(245,158,11,0.08)]"
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          
                          {/* Top Row: Status badge & Score */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                                isApproved
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : isFraud
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                              }`}>
                                {isApproved && <ShieldCheck size={13} className="shrink-0" />}
                                {isFraud && <ShieldAlert size={13} className="shrink-0" />}
                                {isReview && <AlertTriangle size={13} className="shrink-0" />}
                                <span>{isApproved ? "Authentifié & Validé" : isFraud ? "Fraude / Rejeté" : "Vérification Requise"}</span>
                              </span>

                              <span className="text-xs font-black uppercase text-white bg-white/10 px-2 py-0.5 rounded-lg shrink-0">
                                {proof.platform}
                              </span>
                            </div>

                            <span className="text-[11px] text-white/60 shrink-0">
                              Score : <strong className="text-white font-mono text-xs">{proof.fraudAnalysis?.confidenceScore}%</strong>
                            </span>
                          </div>

                          {/* Data Details (Touch-friendly wrap) */}
                          <div className="flex items-center gap-x-4 gap-y-1.5 text-xs text-white/80 flex-wrap">
                            <span className="flex items-center gap-1.5 shrink-0">
                              <DollarSign size={13} className="text-emerald-400 shrink-0" />
                              <strong className="text-white text-sm">{proof.amount?.toLocaleString()} {proof.currency}</strong>
                            </span>

                            {proof.transactionId && (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded shrink-0">
                                <Hash size={11} className="shrink-0" />
                                {proof.transactionId}
                              </span>
                            )}

                            {proof.customerId?.phone && (
                              <span className="flex items-center gap-1 text-white/60 text-[11px] shrink-0">
                                <Smartphone size={12} className="shrink-0 text-white/40" />
                                {proof.customerId.phone}
                              </span>
                            )}

                            <span className="flex items-center gap-1 text-white/40 text-[10px] shrink-0">
                              <Calendar size={11} className="shrink-0" />
                              {new Date(proof.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>

                          {/* Forensic Flags if any */}
                          {proof.fraudAnalysis?.tamperingFlags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {proof.fraudAnalysis.tamperingFlags.map((flag: string, idx: number) => (
                                <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  ⚠️ {flag}
                                </span>
                              ))}
                            </div>
                          )}

                          {proof.fraudAnalysis?.rawAiVerdict && (
                            <p className="text-[11px] text-white/50 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
                              "{proof.fraudAnalysis.rawAiVerdict}"
                            </p>
                          )}

                          {/* Action Buttons for Pending Review */}
                          {isReview && (
                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                              <button
                                onClick={() => reviewMutation.mutate({ logId: proof._id, action: "approve" })}
                                disabled={reviewMutation.isPending}
                                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                              >
                                <CheckCircle size={15} className="shrink-0" />
                                <span>Valider Paiement</span>
                              </button>

                              <button
                                onClick={() => reviewMutation.mutate({ logId: proof._id, action: "reject" })}
                                disabled={reviewMutation.isPending}
                                className="flex-1 h-11 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 border border-rose-500/30 transition-all active:scale-95"
                              >
                                <XCircle size={15} className="shrink-0" />
                                <span>Rejeter Preuve</span>
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
          ) : (
            /* Tester Tab */
            <div className="space-y-4 sm:space-y-6">
              <div className="border-2 border-dashed border-white/15 hover:border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center transition-all bg-white/[0.01]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="shield-test-upload"
                />
                <label
                  htmlFor="shield-test-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] shrink-0">
                    <Upload size={26} className="shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight text-white">Sélectionner une capture d'écran</p>
                    <p className="text-xs text-white/50 pt-0.5">Wave, Orange Money, MTN MoMo, virement bancaire...</p>
                  </div>
                </label>
              </div>

              {scanMutation.isPending && (
                <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center gap-3 text-center">
                  <RefreshCw size={28} className="animate-spin text-emerald-400 shrink-0" />
                  <p className="text-sm font-black uppercase text-white">Audit médico-légal en cours...</p>
                  <p className="text-xs text-white/50 max-w-sm">Détection d'artefacts Photoshop, falsification de polices, fraîcheur et contrôle de cohérence.</p>
                </div>
              )}

              {scanMutation.data && (
                <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                      <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
                      Résultat de l'Audit Forensic
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${
                      scanMutation.data.decision === "AUTO_APPROVED"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : scanMutation.data.decision === "FLAGGED_FOR_REVIEW"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}>
                      {scanMutation.data.decision} ({scanMutation.data.confidenceScore}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Opérateur</span>
                      <strong className="text-white text-xs sm:text-sm block truncate">{scanMutation.data.extraction?.platform}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Montant</span>
                      <strong className="text-emerald-400 text-xs sm:text-sm block truncate">{scanMutation.data.extraction?.amount} {scanMutation.data.extraction?.currency}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Transaction ID</span>
                      <strong className="text-white font-mono text-[11px] block truncate">{scanMutation.data.extraction?.transactionId || "N/A"}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                      <span className="text-white/40 block text-[10px] uppercase font-bold">Faux Reçu IA ?</span>
                      <strong className={`text-xs sm:text-sm block truncate ${scanMutation.data.extraction?.forensics?.isAiGenerated ? "text-rose-400" : "text-emerald-400"}`}>
                        {scanMutation.data.extraction?.forensics?.isAiGenerated ? "OUI (Suspect)" : "NON (Réel)"}
                      </strong>
                    </div>
                  </div>

                  {scanMutation.data.extraction?.forensics?.analysisSummary && (
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-white/80 leading-relaxed">
                      <strong className="text-emerald-400">Rapport Vendeur IA : </strong>
                      {scanMutation.data.extraction.forensics.analysisSummary}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
