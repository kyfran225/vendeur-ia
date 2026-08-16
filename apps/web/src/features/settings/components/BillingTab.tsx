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
  ChevronDown
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function BillingTab({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

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
  const billingHistory = dashboard?.recentTransactions || [];

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

  // Determine actual payment method label from real data
  let paymentMethodLabel = "Non défini";
  if (isMobileMoney) paymentMethodLabel = "Mobile Money";
  else if (isCard) paymentMethodLabel = "Carte Bancaire";

  const isPlanActive = sub && sub.status === 'active' && sub.offerId;

  return (
    <div id="billing" className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 pb-16">
      {/* Plan Actuel ou Card d'Activation Haute Conversion */}
      {isPlanActive ? (
        <section className="bg-vendeur-coal border border-white/10 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6 sm:gap-8">
            <div className="space-y-5 sm:space-y-6 flex-1">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20 shrink-0 shadow-inner">
                  <ShieldCheck size={26} className="sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white truncate">
                    {offer?.name || 'Forfait Vendeur IA Actif'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                      sub?.status === 'active' ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                      sub?.status === 'past_due' ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                      "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    )}>
                      {sub?.status === 'active' ? "● Plan Actif" : sub?.status === 'past_due' ? "⚠️ Retard" : "❌ Expiré"}
                    </span>
                    {hasRecurring && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-blue-500/15 text-blue-400 border-blue-500/30">
                        Auto-Renouvellement
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-2">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-wider flex items-center gap-1.5">
                    <Calendar size={12} className="text-vendeur-emerald shrink-0" />
                    <span>{isExpired ? "Expiré le" : (hasRecurring ? "Prochain prélèvement" : "Prochaine échéance")}</span>
                  </p>
                  <p className="text-base sm:text-lg font-black text-white font-mono">
                    {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-wider flex items-center gap-1.5">
                    {isMobileMoney ? <Smartphone size={12} className="text-vendeur-emerald shrink-0" /> : (isCard ? <CreditCard size={12} className="text-vendeur-emerald shrink-0" /> : <Banknote size={12} className="text-vendeur-emerald shrink-0" />)}
                    <span>Mode de paiement</span>
                  </p>
                  <p className="text-base sm:text-lg font-black text-white">
                    {paymentMethodLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-3 w-full lg:w-72 shrink-0 pt-2 lg:pt-0">
              {isExpired ? (
                <button
                  onClick={() => window.location.href = "/offers"}
                  className="w-full h-12 sm:h-14 min-h-[48px] px-6 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-rose-500/20 cursor-pointer"
                >
                  <span>Réactiver mon IA</span>
                  <ArrowRight size={18} />
                </button>
              ) : isMobileMoney ? (
                <button
                  onClick={() => window.location.href = "/offers"}
                  className="w-full h-12 sm:h-14 min-h-[48px] px-6 bg-white hover:bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 cursor-pointer"
                >
                  <span>Renouveler ({activeBillingCurrency})</span>
                  <Zap size={18} className="text-vendeur-emerald group-hover:text-vendeur-coal" />
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-vendeur-emerald shrink-0" />
                    <p className="text-[11px] font-bold text-white/80 uppercase tracking-tight leading-tight">
                      {hasRecurring ? "Prélèvement auto actif" : "Plan actif"}
                    </p>
                  </div>
                  {hasRecurring && (
                    <button
                      onClick={() => setIsCancelConfirmOpen(true)}
                      className="w-full text-[10px] font-black uppercase tracking-wider text-white/40 hover:text-rose-400 transition-colors py-1.5 cursor-pointer"
                    >
                      Désactiver le renouvellement
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal de Confirmation d'annulation */}
          {isCancelConfirmOpen && (
            <div className="absolute inset-0 z-50 bg-vendeur-coal/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-5 max-w-sm w-full p-4 rounded-3xl bg-black/60 border border-white/10 shadow-2xl">
                <div className="h-14 w-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto text-rose-500 border border-rose-500/20">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Arrêter l'IA ?</h3>
                  <p className="text-[11px] font-medium text-white/60 leading-relaxed">
                    Votre service restera actif jusqu'au {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR') : 'prochain terme'}.
                    Ensuite, l'agent IA se mettra en veille.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => setIsCancelConfirmOpen(false)}
                    className="flex-1 h-11 bg-white/10 hover:bg-white/15 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer"
                  >
                    Garder
                  </button>
                  <button
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                    className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
      ) : (
        /* Hero Card d'Activation Haute Conversion + Grille d'Offres Intégrée */
        <div className="space-y-6 sm:space-y-8">
          <section className="bg-gradient-to-br from-vendeur-coal via-vendeur-coal to-black border border-vendeur-emerald/30 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
              <div className="space-y-3.5 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Vendeur IA en veille
                </div>

                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                  Activez votre <span className="text-vendeur-emerald">Machine de Vente</span>
                </h2>

                <p className="text-white/60 text-xs sm:text-sm leading-relaxed font-medium">
                  Votre boutique et votre catalogue sont prêts. Choisissez un forfait ci-dessous pour débloquer votre commercial IA 24/7 sur WhatsApp et encaisser vos commandes en automatique.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 size={15} className="text-vendeur-emerald shrink-0" />
                    <span>Réponses 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 size={15} className="text-vendeur-emerald shrink-0" />
                    <span>Commandes Auto</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 size={15} className="text-vendeur-emerald shrink-0" />
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
                  <span>Choisir mon Forfait</span>
                  <ArrowRight size={16} />
                </a>
                <p className="text-[10px] text-center text-white/40 font-bold uppercase tracking-wider">
                  Paiement sécurisé Mobile Money / Carte
                </p>
              </div>
            </div>

            <div className="absolute -bottom-16 -right-16 h-80 w-80 bg-vendeur-emerald/10 blur-[120px] rounded-full pointer-events-none" />
          </section>

          {/* Cartes des Forfaits Intégrées Directement dans la Facturation */}
          <div id="plans-section" className="space-y-4 sm:space-y-6 scroll-mt-24">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">Forfaits Vendeur IA</h3>
              <p className="text-xs text-white/50 font-medium">Tarifs en {activeBillingCurrency} (sans engagement, modifiable à tout moment).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
              {offers?.map((offerItem: any) => {
                const isPro = offerItem.slug === 'pro';
                return (
                  <div
                    key={offerItem._id || offerItem.slug}
                    className={cn(
                      "relative bg-vendeur-coal border rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 flex flex-col justify-between group transition-all duration-300",
                      isPro ? "border-vendeur-emerald/50 shadow-xl shadow-vendeur-emerald/10" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    {isPro && (
                      <div className="absolute -top-3 left-6 sm:left-8 bg-vendeur-emerald text-vendeur-coal text-[9px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow-lg">
                        ⭐ Recommandé
                      </div>
                    )}

                    <div className="space-y-5">
                      <div className="flex items-center gap-3.5">
                        <div className={cn(
                          "h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md",
                          isPro ? "bg-vendeur-emerald text-vendeur-coal" : "bg-white/5 text-white/40 border border-white/5"
                        )}>
                          {isPro ? <Zap size={22} /> : <ShieldCheck size={22} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white truncate">{offerItem.name}</h4>
                          <p className="text-[10px] font-black uppercase text-white/40 tracking-wider truncate">{offerItem.slug === 'pro' ? 'Expérience complète & illimitée' : 'Lancement rapide'}</p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {offerItem.features?.map((feature: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className={cn(
                              "h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              isPro ? "bg-vendeur-emerald/20 text-vendeur-emerald" : "bg-white/5 text-white/40"
                            )}>
                              <CheckCircle2 size={12} />
                            </div>
                            <span className="text-xs font-bold text-white/80 leading-tight">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/5">
                      <div className="flex items-baseline gap-2 mb-5">
                        <span className="text-3xl sm:text-4xl font-black italic tracking-tight text-white font-mono">
                          {offerItem.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-black uppercase text-white/40 tracking-wider">
                          {offerItem.currency || activeBillingCurrency} / MOIS
                        </span>
                      </div>

                      <button
                        onClick={() => window.location.href = `/checkout?offer=${offerItem.slug}`}
                        className={cn(
                          "w-full h-12 sm:h-14 min-h-[48px] rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl cursor-pointer",
                          isPro
                            ? "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] shadow-vendeur-emerald/20 font-black"
                            : "bg-white text-vendeur-coal hover:bg-vendeur-emerald hover:text-vendeur-coal font-bold"
                        )}
                      >
                        <span>{isPro ? 'Activer Forfait Pro' : 'Commencer avec ce Forfait'}</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Préférence de Devise de Paiement de l'Abonnement */}
      <section className="bg-vendeur-coal border border-white/10 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0">
              <Coins size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Devise de Facturation Vendeur IA</h3>
              <p className="text-xs text-white/50 font-medium">Monnaie utilisée pour régler vos abonnements.</p>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <div className="relative">
            <select
              className="w-full h-12 sm:h-14 bg-black/40 border border-white/10 rounded-2xl px-4 text-xs sm:text-sm text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer font-bold"
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
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={16} />
          </div>
          <p className="text-[10px] text-white/40 mt-2 font-medium">
            💡 N'impacte pas les prix de vos produits sur WhatsApp ni sur votre vitrine (ceux-ci restent en {merchant?.currency || "XOF"}).
          </p>
        </div>
      </section>

      {/* Historique */}
      <section className="bg-vendeur-coal border border-white/10 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-5">
        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
          <Clock size={18} className="text-white/40" />
          <span>Dernières Transactions</span>
        </h3>

        <div className="space-y-2.5">
          {billingHistory?.map((t: any) => (
            <div key={t._id} className="flex items-center justify-between p-3.5 sm:p-4 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 shrink-0">
                  <Banknote size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase text-white tracking-tight truncate">{t.type?.replace('_', ' ')}</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold">{new Date(t.paidAt || t.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm font-black text-vendeur-emerald font-mono">+{t.amount.toLocaleString()} {t.currency}</p>
                <p className="text-[9px] text-white/30 uppercase font-black tracking-wider">{t.paymentMethod || 'Paystack'}</p>
              </div>
            </div>
          ))}
          {(!billingHistory || billingHistory.length === 0) && (
            <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
              <AlertCircle size={28} className="mx-auto text-white/20 mb-2" />
              <p className="text-[10px] font-black uppercase text-white/30 tracking-wider">Aucun historique de paiement</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
