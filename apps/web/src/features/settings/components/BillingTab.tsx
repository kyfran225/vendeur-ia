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
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      {/* Plan Actuel ou Card d'Activation Haute Conversion */}
      {isPlanActive ? (
        <section className="bg-vendeur-coal border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                    {offer?.name || 'Forfait Vendeur IA Actif'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                      sub?.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      sub?.status === 'past_due' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}>
                      {sub?.status === 'active' ? "Plan Actif" : sub?.status === 'past_due' ? "Retard de paiement" : "Expiré"}
                    </span>
                    {hasRecurring && (
                      <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/20">
                        Auto-Renouvellement
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                    <Calendar size={12} />
                    {isExpired ? "Expiré le" : (hasRecurring ? "Prochain prélèvement" : "Prochaine échéance")}
                  </p>
                  <p className="text-lg font-black text-white">
                    {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                    {isMobileMoney ? <Smartphone size={12} /> : (isCard ? <CreditCard size={12} /> : <Banknote size={12} />)}
                    Canal de paiement
                  </p>
                  <p className="text-lg font-black text-white">
                    {paymentMethodLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 min-w-[240px]">
              {isExpired ? (
                <button
                  onClick={() => window.location.href = "/offers"}
                  className="w-full h-16 bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-rose-500/20"
                >
                  Réactiver mon IA
                  <ArrowRight size={20} />
                </button>
              ) : isMobileMoney ? (
                <button
                  onClick={() => window.location.href = "/offers"}
                  className="w-full h-16 bg-white text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                  Renouveler ({merchant?.billingCurrency || merchant?.currency || 'XOF'})
                  <Zap size={20} className="text-vendeur-emerald" />
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-vendeur-emerald" />
                    <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">
                      {hasRecurring ? "Prélèvement automatique actif" : "Plan actif"}
                    </p>
                  </div>
                  {hasRecurring && (
                    <button
                      onClick={() => setIsCancelConfirmOpen(true)}
                      className="w-full text-[10px] font-black uppercase text-white/20 hover:text-rose-500 transition-colors py-2"
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
            <div className="absolute inset-0 z-50 bg-vendeur-coal/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-6 max-w-sm">
                <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                  <AlertCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Arrêter l'IA ?</h3>
                  <p className="text-[10px] font-medium text-white/40 uppercase leading-relaxed">
                    Votre service restera actif jusqu'au {nextDate ? new Date(nextDate).toLocaleDateString() : 'prochain terme'}.
                    Ensuite, votre IA s'arrêtera et vos clients ne recevront plus de réponses.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsCancelConfirmOpen(false)}
                    className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                  >
                    Garder
                  </button>
                  <button
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                    className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                  >
                    {cancelSubscriptionMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full" />
        </section>
      ) : (
        /* Hero Card d'Activation Haute Conversion + Grille d'Offres Intégrée */
        <div className="space-y-8">
          <section className="bg-gradient-to-br from-vendeur-coal via-vendeur-coal to-black border border-vendeur-emerald/30 p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Vendeur IA en veille
                </div>

                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
                  Activez votre <span className="text-vendeur-emerald">Machine de Vente</span>
                </h2>

                <p className="text-white/60 text-sm md:text-base leading-relaxed font-medium">
                  Votre boutique et votre catalogue sont prêts. Choisissez un forfait ci-dessous pour débloquer votre commercial IA 24/7 sur WhatsApp et encaisser vos commandes en automatique.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 size={16} className="text-vendeur-emerald shrink-0" />
                    <span>Réponses 24/7</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 size={16} className="text-vendeur-emerald shrink-0" />
                    <span>Commandes Auto</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 size={16} className="text-vendeur-emerald shrink-0" />
                    <span>Scan IA Vision</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
                <a
                  href="#plans-section"
                  className="h-16 px-8 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs md:text-sm rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 whitespace-nowrap"
                >
                  <Zap size={20} />
                  Choisir mon Forfait
                  <ArrowRight size={18} />
                </a>
                <p className="text-[10px] text-center text-white/30 font-bold uppercase tracking-widest">
                  Paiement sécurisé Mobile Money / Carte
                </p>
              </div>
            </div>

            <div className="absolute -bottom-16 -right-16 h-80 w-80 bg-vendeur-emerald/10 blur-[120px] rounded-full pointer-events-none" />
          </section>

          {/* Cartes des Forfaits Intégrées Directement dans la Facturation */}
          <div id="plans-section" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Forfaits Vendeur IA</h3>
                <p className="text-xs text-white/40 font-medium">Tarifs en {merchant?.billingCurrency || merchant?.currency || 'XOF'} (sans engagement, modifiable à tout moment).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {offers?.map((offerItem: any) => {
                const isPro = offerItem.slug === 'pro';
                return (
                  <div
                    key={offerItem._id || offerItem.slug}
                    className={cn(
                      "relative bg-vendeur-coal border rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between group transition-all duration-300",
                      isPro ? "border-vendeur-emerald/40 shadow-xl shadow-vendeur-emerald/5" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    {isPro && (
                      <div className="absolute -top-3.5 left-8 bg-vendeur-emerald text-vendeur-coal text-[9px] font-black uppercase px-4 py-1 rounded-full tracking-widest shadow-lg">
                        Recommandé
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                          isPro ? "bg-vendeur-emerald text-vendeur-coal" : "bg-white/5 text-white/40"
                        )}>
                          {isPro ? <Zap size={24} /> : <ShieldCheck size={24} />}
                        </div>
                        <div>
                          <h4 className="text-xl font-black uppercase tracking-tight text-white">{offerItem.name}</h4>
                          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">{offerItem.slug === 'pro' ? 'Expérience complète & illimitée' : 'Lancement rapide'}</p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {offerItem.features?.map((feature: string, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={cn(
                              "h-4 w-4 rounded-full flex items-center justify-center shrink-0",
                              isPro ? "bg-vendeur-emerald/20 text-vendeur-emerald" : "bg-white/5 text-white/40"
                            )}>
                              <CheckCircle2 size={12} />
                            </div>
                            <span className="text-xs font-bold text-white/70">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-8 mt-6 border-t border-white/5">
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-black italic tracking-tight text-white">
                          {offerItem.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-black uppercase text-white/30 tracking-widest">
                          {offerItem.currency || merchant?.billingCurrency || merchant?.currency || 'XOF'} / MOIS
                        </span>
                      </div>

                      <button
                        onClick={() => window.location.href = `/checkout?offer=${offerItem.slug}`}
                        className={cn(
                          "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl",
                          isPro
                            ? "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] shadow-vendeur-emerald/20"
                            : "bg-white text-vendeur-coal hover:bg-vendeur-emerald hover:text-vendeur-coal"
                        )}
                      >
                        {isPro ? 'Activer Forfait Pro' : 'Commencer avec ce Forfait'}
                        <ArrowRight size={16} />
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
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Devise de Facturation Vendeur IA</h3>
              <p className="text-xs text-white/40 font-medium">Choisissez la monnaie utilisée pour régler vos forfaits (Starter, Essential, Pro).</p>
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <div className="relative">
            <select
              className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer font-bold"
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
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
          </div>
          <p className="text-[10px] text-white/30 mt-2 font-medium">
            💡 N'impacte pas les prix de vos produits sur WhatsApp ni sur votre vitrine (ceux-ci restent en {merchant?.currency || "XOF"}).
          </p>
        </div>
      </section>

      {/* Historique */}
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
          <Clock size={20} className="text-white/40" />
          Dernières Transactions
        </h3>

        <div className="space-y-3">
          {billingHistory?.map((t: any) => (
            <div key={t._id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                  <Banknote size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white tracking-tight">{t.type?.replace('_', ' ')}</p>
                  <p className="text-[10px] text-white/20 uppercase font-bold">{new Date(t.paidAt || t.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-vendeur-emerald">+{t.amount.toLocaleString()} {t.currency}</p>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">{t.paymentMethod || 'Paystack'}</p>
              </div>
            </div>
          ))}
          {(!billingHistory || billingHistory.length === 0) && (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
              <AlertCircle size={32} className="mx-auto text-white/10 mb-2" />
              <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Aucun historique de paiement</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
