import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import {
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Check,
  Lock,
  Zap,
  Sparkles,
  Tag,
  Copy,
  CheckCircle2,
  Phone,
  Clock,
  AlertCircle,
  HelpCircle,
  QrCode
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currency = useMerchantCurrency();

  const offerSlug = searchParams.get("offer") || "essential";
  const setupOption = searchParams.get("setup") || null;
  const initialInterval = searchParams.get("interval") === "yearly" ? "yearly" : "monthly";
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(initialInterval);

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<string>("wave");
  const [activeIntent, setActiveIntent] = useState<any>(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [senderPhoneInput, setSenderPhoneInput] = useState(user?.whatsappNumber || "");
  const [loading, setLoading] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("CI");

  const countries = [
    { code: "CI", name: "Côte d'Ivoire", currency: "XOF" },
    { code: "BF", name: "Burkina Faso", currency: "XOF" },
    { code: "SN", name: "Sénégal", currency: "XOF" },
    { code: "ML", name: "Mali", currency: "XOF" },
    { code: "BJ", name: "Bénin", currency: "XOF" },
    { code: "TG", name: "Togo", currency: "XOF" },
    { code: "GH", name: "Ghana", currency: "GHS" },
    { code: "GN", name: "Guinée", currency: "GNF" },
  ];

  useEffect(() => {
    // Auto-detect from phone prefix if not manually changed yet
    const prefixMap: Record<string, string> = {
      "+225": "CI", "+226": "BF", "+221": "SN", "+229": "BJ",
      "+223": "ML", "+228": "TG", "+233": "GH", "+224": "GN"
    };

    for (const [prefix, code] of Object.entries(prefixMap)) {
      if (user?.whatsappNumber?.startsWith(prefix)) {
        setUserCountry(code);
        break;
      }
    }
  }, [user]);

  // 1. Fetch Offers
  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", currency],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/offers?currency=${currency}`);
      return res.data;
    }
  });

  // 2. Fetch Payment Config
  const { data: paymentConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: ["paymentConfig", userCountry],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/payments/config?country=${userCountry}`);
      return res.data;
    }
  });

  // Auto-create or refresh PaymentIntent when method or interval changes
  useEffect(() => {
    if (selectedMethod === "card" || selectedMethod === "google_play") return;

    let isMounted = true;
    const createIntent = async () => {
      if (!user) return;
      try {
        const res = await apiClient.post("/api/commerce/payments/intent", {
          offerSlug,
          billingInterval,
          paymentMethod: selectedMethod,
          senderPhoneNumber: senderPhoneInput,
          country: userCountry
        });
        if (isMounted) {
          setActiveIntent(res.data);
          setProofSubmitted(res.data.status === "under_verification" || res.data.status === "confirmed");
        }
      } catch (err) {
        console.error("Intent creation error:", err);
      }
    };

    createIntent();
    return () => {
      isMounted = false;
    };
  }, [offerSlug, billingInterval, selectedMethod, user, userCountry]);

  // Polling to verify intent status when proof is submitted
  useEffect(() => {
    if (!activeIntent?._id || !proofSubmitted) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/api/commerce/payments/intent/${activeIntent._id}`);
        if (res.data.status === "confirmed") {
          toast.success("Paiement validé avec succès ! Votre Vendeur IA est actif.");
          clearInterval(interval);
          setTimeout(() => {
            navigate("/dashboard");
          }, 1200);
        }
      } catch (e) {
        // Silent poll error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIntent?._id, proofSubmitted, navigate]);

  if (isLoading) {
    return <VendeurIALoader fullscreen label="Chargement de votre session de paiement..." />;
  }

  const offer = offers?.find((o: any) => o.slug === offerSlug);

  if (!offer && !isLoading) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">Offre Introuvable</h2>
        <p className="text-white/40 mb-8 max-w-sm">L'offre "{offerSlug}" n'existe plus ou est momentanément indisponible.</p>
        <button onClick={() => navigate("/offers")} className="px-8 py-3 bg-vendeur-emerald text-vendeur-coal font-black uppercase rounded-xl">Voir les offres disponibles</button>
      </div>
    );
  }

  const isYearly = billingInterval === "yearly";
  const monthlyPrice = offer?.monthlyPrice || 5000;
  const yearlyPrice = offer?.yearlyPrice || Math.round(monthlyPrice * 10);
  const planPrice = isYearly ? yearlyPrice : monthlyPrice;

  const setupFee = setupOption ? (offer?.setupOptions?.find((o: any) => o.type === setupOption)?.price || 0) : 0;
  const totalToday = planPrice + setupFee;
  const savings = isYearly ? (monthlyPrice * 12 - yearlyPrice) : 0;

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success("Copié dans le presse-papier !");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCardPaystack = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post("/api/commerce/checkout", {
        offerSlug,
        email: user?.email,
        setupOption,
        billingInterval
      });

      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        toast.error("Impossible de générer le lien de paiement.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur de paiement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntent?._id) {
      toast.error("Session de paiement invalide.");
      return;
    }

    if (!transactionIdInput && !senderPhoneInput) {
      toast.error("Veuillez renseigner votre ID de transaction ou numéro de téléphone.");
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await apiClient.post(`/api/commerce/payments/intent/${activeIntent._id}/submit-proof`, {
        transactionId: transactionIdInput.trim(),
        senderPhoneNumber: senderPhoneInput.trim()
      });

      if (res.data.intent?.status === "confirmed") {
        toast.success("Paiement validé instantanément ! Redirection vers votre cockpit...");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setProofSubmitted(true);
        toast.success("Paiement reçu ! Vérification en cours par notre système.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la soumission");
    } finally {
      setSubmittingProof(false);
    }
  };


  const handleGooglePlayPay = async () => {
    toast.info("Initialisation du paiement Google Play...");
    // Integration logic for Google Play Billing via Capacitor/Cordova or Web equivalent
    // For now, we simulate a successful local verification if they click
    setLoading(true);
    try {
        const res = await apiClient.post("/api/commerce/payments/intent", {
            offerSlug,
            billingInterval,
            paymentMethod: "google_play",
            country: userCountry
        });

        toast.success("Veuillez finaliser l'achat sur la fenêtre Google Play qui s'affiche.");
        // Mock success for testing purposes
        // navigate("/dashboard");
    } catch (err) {
        toast.error("Erreur d'initialisation Google Play");
    } finally {
        setLoading(false);
    }
  };

  const currentMethodConfig = paymentConfig?.methods?.find((m: any) => m.id === selectedMethod);

  return (
    <div className="min-h-[100dvh] bg-black text-white p-3 sm:p-6 md:p-12 animate-in slide-in-from-right-4 duration-500">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-black uppercase text-white/40 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> Retour aux offres
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left: Payment Method & Instructions (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest">
                <span>Paiement 100% Local & Sécurisé</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight italic">
                Finalisez votre <span className="text-vendeur-emerald">Vendeur IA</span>
              </h1>
              <p className="text-xs text-white/50">
                Choisissez votre moyen de paiement Mobile Money préféré ou payez par carte bancaire.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                Votre pays actuel de paiement
              </label>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setUserCountry(c.code)}
                    className={cn(
                      "px-3 py-2 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-2",
                      userCountry === c.code
                        ? "bg-vendeur-emerald/20 border-vendeur-emerald text-white shadow-lg shadow-vendeur-emerald/10"
                        : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                    )}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector Pills */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                Sélectionnez votre moyen de paiement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {paymentConfig?.methods?.map((method: any) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={cn(
                        "p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer",
                        isSelected
                          ? "bg-vendeur-emerald/10 border-vendeur-emerald shadow-lg shadow-vendeur-emerald/10"
                          : "bg-[#0c0f0d] border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black uppercase tracking-tight text-white">{method.name.split(" ")[0]}</span>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: method.color }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 font-medium truncate">
                        {method.badge || method.name}
                      </span>
                    </button>
                  );
                })}

                {/* Card Option */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod("card")}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer",
                    selectedMethod === "card"
                      ? "bg-vendeur-emerald/10 border-vendeur-emerald shadow-lg shadow-vendeur-emerald/10"
                      : "bg-[#0c0f0d] border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-tight text-white">Carte Visa/Master</span>
                    <CreditCard size={14} className="text-white/60" />
                  </div>
                  <span className="text-[10px] text-white/40 font-medium">En ligne</span>
                </button>

                {/* Google Play Option */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod("google_play")}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer",
                    selectedMethod === "google_play"
                      ? "bg-vendeur-emerald/10 border-vendeur-emerald shadow-lg shadow-vendeur-emerald/10"
                      : "bg-[#0c0f0d] border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black uppercase tracking-tight text-white">Google Play</span>
                    <QrCode size={14} className="text-[#4285F4]" />
                  </div>
                  <span className="text-[10px] text-white/40 font-medium">Cartes/Play Store</span>
                </button>
              </div>
            </div>

            {/* MOBILE MONEY DETAILS & TRANSFER INSTRUCTIONS */}
            {selectedMethod !== "card" && selectedMethod !== "google_play" && currentMethodConfig && (
              <div className="bg-[#0e1411] border border-vendeur-emerald/20 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl animate-in fade-in duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentMethodConfig.color }}
                    />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Instructions de transfert {currentMethodConfig.name}
                    </h3>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-white/60 font-mono font-bold">
                    Étape 1/2
                  </span>
                </div>

                {/* Step 1: Beneficiary Number & Amount Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Number Box */}
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-1 relative group">
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/40">
                      Numéro Destinataire ({paymentConfig?.recipientName || "Vendeur IA"})
                    </div>
                    <div className="text-base sm:text-lg font-mono font-black text-white tracking-wider">
                      {currentMethodConfig.number}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(currentMethodConfig.number, "number")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 hover:bg-vendeur-emerald hover:text-black text-white/60 transition-all cursor-pointer"
                      title="Copier le numéro"
                    >
                      {copiedField === "number" ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>

                  {/* Amount Box */}
                  <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-1 relative">
                    <div className="text-[9px] font-black uppercase tracking-widest text-white/40">
                      Montant Exact à Envoyer
                    </div>
                    <div className="text-base sm:text-lg font-mono font-black text-vendeur-emerald">
                      {paymentConfig?.localAmount ? paymentConfig.localAmount.toLocaleString() : totalToday.toLocaleString()} {paymentConfig?.currencySymbol || offer.currency || currency}
                    </div>
                    {paymentConfig?.targetCurrency && paymentConfig.targetCurrency !== "XOF" && (
                        <div className="text-[10px] text-white/30 font-medium">
                            Soit {totalToday.toLocaleString()} XOF (Référence)
                        </div>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard((paymentConfig?.localAmount || totalToday).toString(), "amount")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/5 hover:bg-vendeur-emerald hover:text-black text-white/60 transition-all cursor-pointer"
                      title="Copier le montant"
                    >
                      {copiedField === "amount" ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* Reference Code Box */}
                {activeIntent?.reference && (
                  <div className="p-3.5 rounded-2xl bg-vendeur-emerald/5 border border-vendeur-emerald/15 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald/70">
                        Votre Référence Unique
                      </span>
                      <div className="font-mono text-sm font-black text-white">{activeIntent.reference}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeIntent.reference, "ref")}
                      className="text-xs font-bold text-vendeur-emerald hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedField === "ref" ? <Check size={14} /> : <Copy size={14} />}
                      <span>Copier</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-white/50 leading-relaxed">
                  {currentMethodConfig.instructions}
                </p>

                {/* Step 2: Confirmation & Transaction ID Form */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Étape 2 : Confirmation de votre transfert
                    </span>
                    {proofSubmitted && (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <Clock size={12} /> En cours de validation...
                      </span>
                    )}
                  </div>

                  {!proofSubmitted ? (
                    <form onSubmit={handleSubmitProof} className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                          ID de Transaction / SMS de confirmation
                        </label>
                        <input
                          type="text"
                          className="w-full h-12 sm:h-14 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 text-white font-mono text-sm placeholder:text-white/20 outline-none transition-all"
                          placeholder="Ex: PP260817.1234.A56789 ou Réf SMS"
                          value={transactionIdInput}
                          onChange={(e) => setTransactionIdInput(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                          Numéro ayant effectué le paiement
                        </label>
                        <input
                          type="tel"
                          className="w-full h-12 sm:h-14 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                          placeholder="Ex: +225 07 00 00 00 00"
                          value={senderPhoneInput}
                          onChange={(e) => setSenderPhoneInput(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingProof}
                        className="w-full h-12 sm:h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50 shadow-lg shadow-vendeur-emerald/25 cursor-pointer mt-2"
                      >
                        {submittingProof ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            <span>J'ai effectué le transfert & Confirmer</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 animate-in zoom-in-95">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase">
                        <Loader2 className="animate-spin" size={16} />
                        <span>Vérification automatique en cours...</span>
                      </div>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Votre signalement a bien été reçu. Dès détection de votre transfert, votre compte sera activé instantanément sans intervention de votre part.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CARD / PAYSTACK INSTRUCTIONS */}
            {selectedMethod === "card" && (
              <div className="bg-[#0e1411] border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-vendeur-emerald" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Paiement en ligne par Carte Bancaire
                  </h3>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Vous allez être redirigé vers notre passerelle sécurisée pour saisir vos coordonnées bancaires en toute conformité.
                </p>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                    <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-500/80 leading-normal font-medium">
                        Si votre carte est refusée, veuillez utiliser l'option <strong>Google Play</strong> ci-dessus qui accepte 99% des cartes internationales.
                    </p>
                </div>
                <button
                  type="button"
                  onClick={handleCardPaystack}
                  disabled={loading}
                  className="w-full h-12 sm:h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={16} />}
                  <span>Payer {totalToday.toLocaleString()} {offer.currency || currency} par Carte</span>
                </button>
              </div>
            )}

            {/* GOOGLE PLAY INSTRUCTIONS */}
            {selectedMethod === "google_play" && (
              <div className="bg-[#0e1411] border border-[#4285F4]/30 rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#4285F4]/10 text-[#4285F4]">
                    <QrCode size={20} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Paiement via Google Play Store
                  </h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-white/70">
                        <CheckCircle2 size={16} className="text-vendeur-emerald" />
                        <span>Idéal pour les cartes internationales refusées</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/70">
                        <CheckCircle2 size={16} className="text-vendeur-emerald" />
                        <span>Activation instantanée après confirmation</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/70">
                        <CheckCircle2 size={16} className="text-vendeur-emerald" />
                        <span>Sécurité Google garantie</span>
                    </div>
                </div>

                <button
                  type="button"
                  onClick={handleGooglePlayPay}
                  disabled={loading}
                  className="w-full h-12 sm:h-14 bg-[#4285F4] text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-[#4285F4]/90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-[#4285F4]/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  <span>Confirmer l'achat via Google Play</span>
                </button>

                <p className="text-[10px] text-white/30 text-center italic">
                    Une commission de 15% est appliquée par Google sur cette transaction.
                </p>
              </div>
            )}
          </div>

          {/* Right: Summary Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-vendeur-coal border border-white/10 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-6 sticky top-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h2 className="text-base font-black uppercase tracking-tight text-white">Votre Forfait</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald px-2.5 py-1 bg-vendeur-emerald/10 rounded-full">
                  {offer.name}
                </span>
              </div>

              {/* Monthly / Yearly Toggle in Summary */}
              <div className="flex bg-black/50 p-1 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setBillingInterval("monthly");
                    setSearchParams({ offer: offerSlug, ...(setupOption ? { setup: setupOption } : {}), interval: "monthly" });
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    billingInterval === "monthly"
                      ? "bg-white text-vendeur-coal shadow"
                      : "text-white/40 hover:text-white"
                  )}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingInterval("yearly");
                    setSearchParams({ offer: offerSlug, ...(setupOption ? { setup: setupOption } : {}), interval: "yearly" });
                  }}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer",
                    billingInterval === "yearly"
                      ? "bg-vendeur-emerald text-vendeur-coal shadow"
                      : "text-white/40 hover:text-white"
                  )}
                >
                  <span>Annuel</span>
                  <span className="text-[8px] bg-vendeur-coal text-vendeur-emerald px-1.5 py-0.2 rounded font-black">-17%</span>
                </button>
              </div>

              {/* Price calculation */}
              <div className="space-y-3 text-xs font-bold">
                <div className="flex justify-between uppercase text-white/50">
                  <span>Abonnement {isYearly ? "(12 mois)" : "(1 mois)"}</span>
                  <span className="text-white font-mono">{planPrice.toLocaleString()} {offer.currency || currency}</span>
                </div>

                {isYearly && savings > 0 && (
                  <div className="flex justify-between uppercase text-vendeur-emerald">
                    <span>Remise Annuelle</span>
                    <span className="font-mono">-{savings.toLocaleString()} {offer.currency || currency}</span>
                  </div>
                )}

                {setupFee > 0 && (
                  <div className="flex justify-between uppercase text-white/50">
                    <span>Installation Expert</span>
                    <span className="text-white font-mono">{setupFee.toLocaleString()} {offer.currency || currency}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex items-baseline justify-between">
                  <span className="text-xs font-black uppercase text-white/50 tracking-wider">Total</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black italic tracking-tighter text-vendeur-emerald font-mono">
                      {totalToday.toLocaleString()}
                    </span>
                    <span className="text-xs font-black uppercase text-vendeur-emerald/60">
                      {offer.currency || currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features included */}
              <div className="space-y-2.5 pt-3 border-t border-white/5">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">
                  Ce qui est inclus dès l'activation
                </p>
                <div className="space-y-2">
                  {offer.features?.slice(0, 4)?.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3.5 w-3.5 rounded-full bg-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span className="text-[11px] font-medium text-white/70">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3 text-white/40 text-[10px]">
                <ShieldCheck size={16} className="text-vendeur-emerald shrink-0" />
                <span>Garantie tranquillité : Assistance WhatsApp directe 7j/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
