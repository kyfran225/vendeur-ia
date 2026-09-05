import React, { useState } from "react";
import {
  Banknote,
  Calendar,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Coins,
  ChevronDown,
  Sparkles,
  Tag,
  Rocket,
  Copy,
  Check
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function BillingTab({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isFounder } = useFounderRole();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success("Copié dans le presse-papier !");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // New Models Query
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    }
  });

  const activeBillingCurrency = merchant?.billingCurrency || merchant?.currency || "XOF";

  // Fetch Available Offers in the merchant's billing currency
  const { data: offers } = useQuery({
    queryKey: ["offers", activeBillingCurrency],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/offers?currency=${activeBillingCurrency}`);
      return res.data;
    }
  });

  const subscription = dashboard?.subscription;
  const latestPaymentIntent = dashboard?.latestPaymentIntent;
  const billingHistory = dashboard?.recentTransactions || [];

  const isUnderVerification = Boolean(
    latestPaymentIntent &&
    (latestPaymentIntent.status === "under_verification" ||
     latestPaymentIntent.status === "pending" ||
     latestPaymentIntent.status === "payment_detected" ||
     latestPaymentIntent.status === "awaiting_payment")
  );

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/commerce/subscription/cancel");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Votre abonnement ne sera pas renouvelé.");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setIsCancelConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Une erreur est survenue.");
    }
  });

  const sub = subscription;
  const isExpired = sub?.status === 'expired';
  const isPastDue = sub?.status === 'past_due';
  const nextDate = sub?.nextBillingDate || sub?.currentPeriodEnd;

  const isMobileMoney = sub?.paymentMethod === 'mobile_money';
  const isCard = sub?.paymentMethod === 'card';
  const hasRecurring = !!sub?.providerSubscriptionId;

  const offer = sub?.offerId;
  const currentInterval = sub?.billingInterval || (sub?.price > 10000 && !offer?.slug?.includes('pro') ? 'yearly' : 'monthly');

  // Determine actual payment method label from real data
  let paymentMethodLabel = "Non défini";
  if (isMobileMoney) paymentMethodLabel = "Mobile Money";
  else if (isCard) paymentMethodLabel = "Carte Bancaire";

  const isPlanActive = sub && sub.status === 'active' && sub.offerId;
  const isCurrentlyMonthly = isPlanActive && currentInterval === 'monthly';

  if (isFounder) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 pb-16">
        <section className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-vendeur-coal dark:to-black border border-emerald-300 dark:border-vendeur-emerald/30 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-xl transition-all space-y-6">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-vendeur-emerald/15 text-emerald-800 dark:text-vendeur-emerald border border-vendeur-emerald/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-vendeur-emerald animate-pulse" />
                  Accès Maître Fondateur
                </span>
                <span className="text-xs text-slate-500 dark:text-white/50 font-mono font-bold">
                  Licence Illimitée Plateforme
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Compte Administrateur & Fondateur
              </h2>
              <p className="text-sm text-slate-600 dark:text-white/70 font-medium max-w-xl leading-relaxed">
                Ce compte bénéficie d'un accès intégral et permanent à toutes les fonctionnalités système (Vendeur IA 24h/24, Meta Cloud API, PaymentShield OCR, Studio Créatif et Cockpit Administrateur).
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="h-12 px-6 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0"
            >
              <ShieldCheck size={18} />
              <span>Ouvrir le Cockpit Admin</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-1 shadow-sm dark:shadow-none">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Statut Forfait</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-vendeur-emerald flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>Illimité & Actif</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-1 shadow-sm dark:shadow-none">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Ligne Système</div>
              <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">+225 05 05 11 11 57</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-1 shadow-sm dark:shadow-none">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">Canal WhatsApp</div>
              <div className="text-sm font-bold text-sky-600 dark:text-sky-400">Meta Cloud API (Officiel)</div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 pb-16">
      {/* 0. Carte Dédiée : Paiement / Virement en cours d'approbation */}
      {isUnderVerification && latestPaymentIntent && (
        <section className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-emerald-950/40 dark:via-[#0c1611] dark:to-black border border-emerald-400/60 dark:border-emerald-500/40 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-xl transition-all space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Vérification du paiement en cours
                </span>
                <span className="text-xs text-slate-500 dark:text-white/50 font-bold">
                  (Délai estimé : 10 à 30 min)
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Règlement reçu & en cours de validation
              </h2>
              <p className="text-sm text-slate-600 dark:text-white/70 font-medium max-w-xl leading-relaxed">
                Votre notification de paiement a bien été transmise. Nos équipes confirment la transaction pour activer instantanément votre Vendeur IA 24h/24.
              </p>

              {/* Grid Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-0.5 relative shadow-sm dark:shadow-none">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                    Référence
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white truncate">
                    {latestPaymentIntent.reference}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-0.5 shadow-sm dark:shadow-none">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                    Montant & Moyen
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {latestPaymentIntent.amount?.toLocaleString()} {latestPaymentIntent.currency || "XOF"}
                    <span className="text-xs font-normal text-slate-500 dark:text-white/50 ml-1.5 capitalize">
                      ({latestPaymentIntent.paymentMethod || "Mobile Money"})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-0.5 shadow-sm dark:shadow-none">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                    Forfait Choisi
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {latestPaymentIntent.planName || "Vendeur IA"}
                  </div>
                </div>
              </div>
            </div>

            {/* Support Direct Action */}
            <div className="w-full md:w-auto flex flex-col gap-2 shrink-0 pt-2 md:pt-0">
              <a
                href={`https://wa.me/2250505111157?text=${encodeURIComponent(
                  `Bonjour Support Vendeur IA,\nJe souhaite une assistance pour mon paiement en cours.\nRéférence : ${latestPaymentIntent.reference}\nMontant : ${latestPaymentIntent.amount} ${latestPaymentIntent.currency || "XOF"}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-5 bg-slate-100 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 border border-slate-300 dark:bg-white/10 dark:hover:bg-[#25D366]/20 dark:border-white/10 text-slate-800 dark:text-white hover:text-[#25D366] font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <WhatsAppIcon size={16} variant="brand" />
                <span>Assistance WhatsApp</span>
              </a>
            </div>
          </div>
          <div className="absolute -top-12 -right-12 h-64 w-64 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
        </section>
      )}

      {/* 1. Plan Actuel (si actif) */}
      {isPlanActive && (
        <section id="billing" className="bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-xl transition-all space-y-6 scroll-mt-28">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6 sm:gap-8">
            <div className="space-y-5 sm:space-y-6 flex-1">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20 shrink-0 shadow-inner">
                  <ShieldCheck size={26} className="sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                      {offer?.name || 'Forfait Vendeur IA Actif'}
                    </h2>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-vendeur-emerald/15 text-emerald-800 dark:text-vendeur-emerald border border-vendeur-emerald/30">
                      {currentInterval === 'yearly' ? 'Facturation Annuelle' : 'Facturation Mensuelle'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border",
                      sub?.status === 'active' ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" :
                      sub?.status === 'past_due' ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" :
                      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    )}>
                      {sub?.status === 'active' ? "● En service 24/7" : sub?.status === 'past_due' ? "⚠️ En attente" : "❌ Expiré"}
                    </span>
                    {hasRecurring && (
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                        Auto-Renouvellement
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1 shadow-sm dark:shadow-none">
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-white/50 tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-vendeur-emerald shrink-0" />
                    <span>{isExpired ? "Expiré le" : (hasRecurring ? "Prochain prélèvement" : "Prochaine échéance")}</span>
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                    {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-1 shadow-sm dark:shadow-none">
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-white/50 tracking-wider flex items-center gap-1.5">
                    {isMobileMoney ? <Smartphone size={14} className="text-vendeur-emerald shrink-0" /> : (isCard ? <CreditCard size={14} className="text-vendeur-emerald shrink-0" /> : <Banknote size={14} className="text-vendeur-emerald shrink-0" />)}
                    <span>Mode de règlement</span>
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {paymentMethodLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 w-full lg:w-72 shrink-0 pt-2 lg:pt-0">
              {isExpired ? (
                <button
                  onClick={() => navigate("/offers")}
                  className="w-full h-12 sm:h-14 min-h-[48px] px-6 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-rose-500/20 cursor-pointer"
                >
                  <span>Réactiver mon IA</span>
                  <ArrowRight size={18} />
                </button>
              ) : isCurrentlyMonthly ? (
                <button
                  onClick={() => {
                    const el = document.getElementById("plans-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    setBillingInterval("yearly");
                  }}
                  className="w-full h-12 sm:h-14 min-h-[48px] px-6 bg-vendeur-emerald hover:bg-vendeur-emerald/90 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-vendeur-emerald/20 active:scale-95 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Passer à l'Annuel (-17%)</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center gap-3 shadow-sm dark:shadow-none">
                    <CheckCircle2 size={18} className="text-vendeur-emerald shrink-0" />
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white/90 uppercase tracking-tight leading-tight">
                      Abonnement annuel actif
                    </p>
                  </div>
                  {hasRecurring && (
                    <button
                      onClick={() => setIsCancelConfirmOpen(true)}
                      className="w-full text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/40 hover:text-rose-500 dark:hover:text-rose-400 transition-colors py-1.5 cursor-pointer"
                    >
                      Désactiver le renouvellement
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bannière d'incitation Annuel si forfait mensuel */}
          {isCurrentlyMonthly && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center shrink-0">
                  <Tag size={22} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Passez à la facturation annuelle et économisez 2 mois !
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 font-medium">
                    Bénéficiez de 12 mois de Vendeur IA pour le prix de 10 mois.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/checkout?offer=${offer?.slug || 'essential'}&interval=yearly`)}
                className="w-full sm:w-auto px-6 py-3 bg-vendeur-emerald text-vendeur-coal text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
              >
                Activer l'Annuel
              </button>
            </div>
          )}

          {/* Modal de Confirmation d'annulation */}
          {isCancelConfirmOpen && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 dark:bg-vendeur-coal/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-5 max-w-sm w-full p-6 rounded-3xl bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 shadow-2xl">
                <div className="h-14 w-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto text-rose-500 border border-rose-500/20">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Arrêter Vendeur IA ?</h3>
                  <p className="text-xs font-medium text-slate-600 dark:text-white/70 leading-relaxed">
                    Votre service restera actif jusqu'au {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR') : 'prochain terme'}.
                    Ensuite, l'agent IA se mettra en veille.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setIsCancelConfirmOpen(false)}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 rounded-xl text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white transition-all cursor-pointer"
                  >
                    Garder
                  </button>
                  <button
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                    className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {cancelSubscriptionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    <span>Confirmer</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full pointer-events-none" />
        </section>
      )}

      {/* 2. Hero d'Activation si pas de plan actif */}
      {!isPlanActive && (
        <section className="bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-vendeur-coal dark:via-vendeur-coal dark:to-black border border-slate-200 dark:border-vendeur-emerald/30 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] relative overflow-hidden shadow-sm hover:shadow-md dark:shadow-xl transition-all">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
            <div className="space-y-3.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Mode Découverte Actif (Gratuit)
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                Activez votre <span className="text-emerald-600 dark:text-vendeur-emerald">Vendeur IA 24h/24</span>
              </h2>

              <p className="text-slate-600 dark:text-white/70 text-sm sm:text-base leading-relaxed font-medium">
                Votre boutique et vos articles sont configurés. Activez votre forfait pour lancer les réponses automatiques sur WhatsApp et encaisser vos commandes 24h/24.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-white/90">
                  <CheckCircle2 size={16} className="text-emerald-500 dark:text-vendeur-emerald shrink-0" />
                  <span>Réponses 24h/24</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-white/90">
                  <CheckCircle2 size={16} className="text-emerald-500 dark:text-vendeur-emerald shrink-0" />
                  <span>Commandes Auto</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-white/90">
                  <CheckCircle2 size={16} className="text-emerald-500 dark:text-vendeur-emerald shrink-0" />
                  <span>Scan IA Vision</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-2.5 shrink-0 pt-2 md:pt-0">
              <a
                href="#plans-section"
                className="h-12 sm:h-14 min-h-[48px] px-6 sm:px-8 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
              >
                <Zap size={18} />
                <span>Activer mon Forfait</span>
                <ArrowRight size={16} />
              </a>
              <p className="text-xs text-center text-slate-500 dark:text-white/50 font-bold uppercase tracking-wider">
                Mobile Money (Wave, OM, MTN, Moov) &amp; Carte
              </p>
            </div>
          </div>

          <div className="absolute -bottom-16 -right-16 h-80 w-80 bg-vendeur-emerald/10 blur-[120px] rounded-full pointer-events-none" />
        </section>
      )}

      {/* 3. Grille des Forfaits (TOUJOURS DISPONIBLE POUR CHANGER DE PLAN OU PASSER À L'ANNUEL) */}
      <section id="plans-section" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {isPlanActive ? "Changer de forfait ou passer à l'Annuel" : "Forfaits Vendeur IA"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 font-medium">
              Tarifs en {activeBillingCurrency} (sans engagement, modifiable à tout moment).
            </p>
          </div>

          {/* Toggle Mensuel / Annuel */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer",
                billingInterval === "monthly"
                  ? "bg-white text-slate-950 shadow dark:bg-white dark:text-vendeur-coal"
                  : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
              )}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer",
                billingInterval === "yearly"
                  ? "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-vendeur-emerald/20"
                  : "text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white"
              )}
            >
              <span>Annuel</span>
              <span className={cn(
                "text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black uppercase",
                billingInterval === "yearly"
                  ? "bg-vendeur-coal text-vendeur-emerald"
                  : "bg-vendeur-emerald/20 text-vendeur-emerald"
              )}>
                2 mois offerts
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {offers?.map((offerItem: any) => {
            const isPro = offerItem.slug === 'pro';
            const isCurrentActivePlan = isPlanActive && offer?.slug === offerItem.slug;
            const isCurrentActiveAndInterval = isCurrentActivePlan && currentInterval === billingInterval;

            const monthlyPrice = offerItem.monthlyPrice;
            const yearlyPrice = offerItem.yearlyPrice || Math.round(monthlyPrice * 10);
            const isYearly = billingInterval === "yearly";

            const monthlyEquivalent = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
            const savingsAmount = isYearly ? (monthlyPrice * 12 - yearlyPrice) : 0;

            return (
              <div
                key={offerItem._id || offerItem.slug}
                className={cn(
                  "relative bg-white dark:bg-vendeur-coal border rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 flex flex-col justify-between group transition-all duration-300 shadow-sm dark:shadow-none",
                  isPro ? "border-emerald-400 dark:border-vendeur-emerald/50 shadow-xl shadow-emerald-500/10" : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20",
                  isCurrentActiveAndInterval && "ring-2 ring-vendeur-emerald/40 bg-emerald-50/20 dark:bg-vendeur-emerald/[0.02]"
                )}
              >
                {isCurrentActiveAndInterval ? (
                  <div className="absolute -top-3 left-6 sm:left-8 bg-slate-900 text-white dark:bg-white/10 dark:text-white border border-slate-700 dark:border-white/20 text-xs font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow-lg">
                    ✓ Votre forfait actuel
                  </div>
                ) : isPro ? (
                  <div className="absolute -top-3 left-6 sm:left-8 bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow-lg">
                    ⭐ Recommandé
                  </div>
                ) : null}

                <div className="space-y-5">
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                      isPro ? "bg-vendeur-emerald text-vendeur-coal" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border border-slate-200 dark:border-white/5"
                    )}>
                      {isPro ? <Rocket size={24} /> : <Zap size={24} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{offerItem.name}</h4>
                      <p className="text-xs sm:text-sm font-bold uppercase text-slate-500 dark:text-white/50 tracking-wider truncate">{offerItem.slug === 'pro' ? 'Expérience complète & illimitée' : 'Lancement rapide'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {offerItem.features?.map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          isPro ? "bg-vendeur-emerald/15 text-vendeur-emerald border border-vendeur-emerald/25" : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border border-slate-200 dark:border-white/10"
                        )}>
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="text-sm sm:text-[15px] font-medium text-slate-700 dark:text-white/90 leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/5 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black italic tracking-tight text-slate-900 dark:text-white font-mono">
                        {monthlyEquivalent.toLocaleString()}
                      </span>
                      <span className="text-xs sm:text-sm font-black uppercase text-slate-500 dark:text-white/50 tracking-wider">
                        {offerItem.currency || activeBillingCurrency} / MOIS
                      </span>
                    </div>

                    {isYearly ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-white/60">
                        <span>Facturé {yearlyPrice.toLocaleString()} {offerItem.currency || activeBillingCurrency} / an</span>
                        {savingsAmount > 0 && (
                          <span className="text-xs text-emerald-700 dark:text-vendeur-emerald font-black uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            2 mois gratuits
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-white/50">Sans engagement</p>
                    )}
                  </div>

                  <button
                    onClick={() => !isUnderVerification && navigate(`/checkout?offer=${offerItem.slug}&interval=${billingInterval}`)}
                    disabled={isUnderVerification}
                    className={cn(
                      "w-full h-12 sm:h-14 min-h-[48px] rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl",
                      isUnderVerification
                        ? "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 cursor-not-allowed shadow-none"
                        : isCurrentActiveAndInterval
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white dark:border-white/10 active:scale-95 cursor-pointer"
                        : isPro
                        ? "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] shadow-vendeur-emerald/20 font-black active:scale-95 cursor-pointer"
                        : "bg-slate-900 text-white dark:bg-white dark:text-vendeur-coal hover:bg-vendeur-emerald hover:text-vendeur-coal font-bold active:scale-95 cursor-pointer"
                    )}
                  >
                    <span>
                      {isUnderVerification
                        ? "Paiement en attente de validation ⏳"
                        : isCurrentActiveAndInterval
                        ? "Renouveler ce forfait"
                        : isYearly
                        ? `Passer à l'Annuel (${isPro ? 'Pro' : 'Essentiel'})`
                        : isPro
                        ? 'Activer Forfait Pro'
                        : 'Commencer avec ce Forfait'}
                    </span>
                    {!isUnderVerification && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3.1 Pack Pro Expert Clé en Main */}
        <div className="bg-gradient-to-r from-emerald-50 via-white to-slate-50 dark:from-vendeur-coal dark:via-vendeur-coal dark:to-black border border-emerald-300 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-vendeur-emerald/30 p-6 sm:p-8 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden transition-all shadow-sm hover:shadow-md dark:shadow-xl">
          <div className="space-y-3 relative z-10 text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[11px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-sm">
              <Sparkles size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Pack Pro Expert · VIP</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
              Besoin d'une installation clé en main par notre équipe ?
            </h4>
            <p className="text-slate-600 dark:text-white/70 text-sm sm:text-base font-medium leading-relaxed">
              Nous configurons votre compte Meta Cloud WhatsApp API, créons votre page professionnelle, intégrons votre catalogue et paramétrons votre Vendeur IA pour un résultat prêt à vendre.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-white dark:bg-white/5 text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 shadow-sm">✓ Configuration Meta WhatsApp</span>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-white dark:bg-white/5 text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 shadow-sm">✓ Import Catalogue</span>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-white dark:bg-white/5 text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10 shadow-sm">✓ Support VIP Dédié</span>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-2 shrink-0 pt-2 md:pt-0 relative z-10">
            <button
              onClick={() => !isUnderVerification && navigate(`/checkout?offer=pro&setup=EXPERT&interval=${billingInterval}`)}
              disabled={isUnderVerification}
              className={cn(
                "w-full md:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl",
                isUnderVerification
                  ? "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 cursor-not-allowed shadow-none"
                  : "bg-slate-900 text-white dark:bg-white dark:text-vendeur-coal hover:bg-vendeur-emerald hover:text-vendeur-coal active:scale-95 cursor-pointer hover:scale-105"
              )}
            >
              <span>{isUnderVerification ? "Paiement en attente de validation ⏳" : "Commander le Pack Pro"}</span>
              {!isUnderVerification && <ArrowRight size={16} />}
            </button>
            <p className="text-xs text-center text-slate-500 dark:text-white/50 font-bold uppercase tracking-wider">
              Installation + Forfait Pro
            </p>
          </div>

          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full pointer-events-none" />
        </div>
      </section>

      {/* 4. Préférence de Devise de Paiement de l'Abonnement */}
      <section className="bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Devise de Facturation Vendeur IA</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 font-medium">Monnaie utilisée pour régler vos abonnements.</p>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <div className="relative">
            <select
              className="w-full h-12 sm:h-14 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-sm sm:text-base text-slate-900 dark:text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer font-bold shadow-sm"
              value={merchant?.billingCurrency || merchant?.currency || "XOF"}
              onChange={async (e) => {
                const newBillingCurrency = e.target.value;
                try {
                  await apiClient.patch("/api/commerce/merchant", { billingCurrency: newBillingCurrency });
                  toast.success(`Devise de facturation mise à jour en ${newBillingCurrency} ! ✨`);
                  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                  queryClient.invalidateQueries({ queryKey: ["offers"] });
                } catch (err: any) {
                  toast.error("Erreur lors de la mise à jour de la devise de facturation.");
                }
              }}
            >
              <option value="XOF">Franc CFA (XOF) - UEMOA</option>
              <option value="XAF">Franc CFA (XAF) - CEMAC</option>
              <option value="GNF">Franc Guinéen (GNF)</option>
              <option value="NGN">Naira Nigérian (NGN)</option>
              <option value="GHS">Cedi Ghanéen (GHS)</option>
              <option value="KES">Shilling Kenyan (KES)</option>
              <option value="MAD">Dirham Marocain (MAD)</option>
              <option value="DZD">Dinar Algérien (DZD)</option>
              <option value="TND">Dinar Tunisien (TND)</option>
              <option value="CDF">Franc Congolais (CDF)</option>
              <option value="MRU">Ouguiya Mauritanien (MRU)</option>
              <option value="ZAR">Rand Sud-Africain (ZAR)</option>
              <option value="EUR">Euro (€) - Carte Visa / Mastercard</option>
              <option value="USD">Dollar ($) - Carte Internationale</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" size={18} />
          </div>
          <p className="text-xs text-slate-500 dark:text-white/50 mt-2 font-medium">
            💡 N'impacte pas les prix de vos produits sur WhatsApp ni sur votre vitrine (ceux-ci restent en {merchant?.currency || "XOF"}).
          </p>
        </div>
      </section>

      {/* 5. Historique des transactions */}
      <section className="bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-2xl space-y-5">
        <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2.5">
          <Clock size={20} className="text-slate-400 dark:text-white/50" />
          <span>Dernières Transactions</span>
        </h3>

        <div className="space-y-2.5">
          {billingHistory?.map((t: any) => (
            <div key={t._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 group hover:border-slate-300 dark:hover:border-white/10 transition-all gap-3 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-slate-200/60 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white/50 shrink-0">
                  <Banknote size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-tight truncate">{t.type?.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-500 dark:text-white/50 uppercase font-bold">{new Date(t.paidAt || t.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-vendeur-emerald font-mono">+{t.amount.toLocaleString()} {t.currency}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 dark:text-white/40 uppercase font-black tracking-wider">{t.paymentMethod || 'Paystack'}</p>
              </div>
            </div>
          ))}
          {(!billingHistory || billingHistory.length === 0) && (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
              <AlertCircle size={32} className="mx-auto text-slate-300 dark:text-white/20 mb-2" />
              <p className="text-xs sm:text-sm font-black uppercase text-slate-400 dark:text-white/40 tracking-wider">Aucun historique de paiement</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
