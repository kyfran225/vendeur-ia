import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  QrCode,
  ChevronRight,
  ExternalLink,
  Wallet
} from "lucide-react";
import { CountrySelector, COUNTRIES, Country, parsePhoneNumber, formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
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

  // Guided Step state: 1 (Payment Method & Country), 2 (Transfer Details), 3 (Confirmation & Proof)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<string>("wave");
  const [activeIntent, setActiveIntent] = useState<any>(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [userCountry, setUserCountry] = useState<string>("CI");

  const initialSenderParsed = parsePhoneNumber(user?.whatsappNumber || "", userCountry);
  const [senderCountry, setSenderCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === userCountry) || initialSenderParsed.country
  );
  const [senderLocalPhone, setSenderLocalPhone] = useState(initialSenderParsed.local);
  const [loading, setLoading] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Sync sender country & local phone if user whatsappNumber hydrates
  useEffect(() => {
    if (user?.whatsappNumber) {
      const parsed = parsePhoneNumber(user.whatsappNumber, userCountry);
      setSenderCountry(parsed.country);
      setSenderLocalPhone(parsed.local);
    }
  }, [user?.whatsappNumber, userCountry]);

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

  const fullSenderPhone = senderLocalPhone ? `${senderCountry.dialCode}${senderLocalPhone}` : (user?.whatsappNumber || "");

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
          senderPhoneNumber: fullSenderPhone,
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
  }, [offerSlug, billingInterval, selectedMethod, user, userCountry, fullSenderPhone]);

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

    if (!transactionIdInput && !senderLocalPhone) {
      toast.error("Veuillez renseigner votre ID de transaction ou numéro de téléphone.");
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await apiClient.post(`/api/commerce/payments/intent/${activeIntent._id}/submit-proof`, {
        transactionId: transactionIdInput.trim(),
        senderPhoneNumber: fullSenderPhone.trim()
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
    setLoading(true);
    try {
      await apiClient.post("/api/commerce/payments/intent", {
        offerSlug,
        billingInterval,
        paymentMethod: "google_play",
        country: userCountry
      });
      toast.success("Veuillez finaliser l'achat sur la fenêtre Google Play.");
    } catch (err) {
      toast.error("Erreur d'initialisation Google Play");
    } finally {
      setLoading(false);
    }
  };

  const currentMethodConfig = paymentConfig?.methods?.find((m: any) => m.id === selectedMethod);

  // Stepper labels
  const steps = [
    { num: 1, label: "Moyen" },
    { num: 2, label: "Transfert" },
    { num: 3, label: "Validation" }
  ];

  return (
    <div className="min-h-[100dvh] bg-[#070c09] text-white p-3.5 sm:p-6 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-7">
        
        {/* Navigation & Stepper Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <button
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep((prev) => (prev - 1) as 1 | 2);
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{currentStep > 1 ? "Étape précédente" : "Retour aux offres"}</span>
          </button>

          {/* Clean Stepper Indicators */}
          {selectedMethod !== "card" && selectedMethod !== "google_play" && (
            <div className="flex items-center gap-2">
              {steps.map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div
                    onClick={() => {
                      // Allow going back to previous steps
                      if (s.num < currentStep) setCurrentStep(s.num as any);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                      currentStep === s.num
                        ? "bg-vendeur-emerald text-vendeur-coal shadow-md shadow-vendeur-emerald/20"
                        : currentStep > s.num
                        ? "bg-white/10 text-white hover:bg-white/15 cursor-pointer"
                        : "text-white/20"
                    )}
                  >
                    <span>{s.num}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={cn("w-3 h-px", currentStep > s.num ? "bg-vendeur-emerald" : "bg-white/10")} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Compact Plan Summary Banner (Always visible & reassuring) */}
        <div className="bg-[#0e1713] border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase text-white truncate">{offer.name}</h2>
                <span className="text-[9px] font-black uppercase tracking-wider text-vendeur-emerald bg-vendeur-emerald/10 px-2 py-0.5 rounded-full border border-vendeur-emerald/20">
                  {isYearly ? "Annuel (-17%)" : "Mensuel"}
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate mt-0.5">Activation instantanée & assistance 7j/7</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-lg sm:text-2xl font-black italic text-vendeur-emerald font-mono leading-none">
              {totalToday.toLocaleString()} <span className="text-xs uppercase text-vendeur-emerald/70 font-sans">{paymentConfig?.currencySymbol || offer.currency || currency}</span>
            </div>
            {isYearly && savings > 0 && (
              <span className="text-[9px] font-bold text-white/40 block mt-1">
                Économie de {savings.toLocaleString()} {offer.currency || currency}
              </span>
            )}
          </div>
        </div>

        {/* Progressive Guided Stepper Content */}
        <AnimatePresence mode="wait">
          
          {/* ================= STEP 1: CHOICE OF COUNTRY & PAYMENT METHOD ================= */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1 text-left">
                <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  1. Comment souhaitez-vous payer ?
                </h1>
                <p className="text-xs sm:text-sm text-white/50">
                  Sélectionnez votre pays et votre moyen de règlement privilégié.
                </p>
              </div>

              {/* Country Picker Pills */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Pays de facturation
                </label>
                <div className="flex flex-wrap gap-2">
                  {countries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setUserCountry(c.code)}
                      className={cn(
                        "px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        userCountry === c.code
                          ? "bg-vendeur-emerald/15 border-vendeur-emerald text-white shadow-lg shadow-vendeur-emerald/10"
                          : "bg-black/40 border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
                      )}
                    >
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods Grid */}
              <div className="space-y-2.5 text-left">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                  Moyen de paiement
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {paymentConfig?.methods?.map((method: any) => {
                    const isSelected = selectedMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethod(method.id)}
                        className={cn(
                          "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer relative overflow-hidden",
                          isSelected
                            ? "bg-vendeur-emerald/10 border-vendeur-emerald ring-1 ring-vendeur-emerald/30 shadow-lg shadow-vendeur-emerald/10"
                            : "bg-[#0b120f] border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">{method.name.split(" ")[0]}</span>
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: method.color }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-white/50 font-medium truncate">
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
                      "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer",
                      selectedMethod === "card"
                        ? "bg-vendeur-emerald/10 border-vendeur-emerald ring-1 ring-vendeur-emerald/30 shadow-lg shadow-vendeur-emerald/10"
                        : "bg-[#0b120f] border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">Carte Bancaire</span>
                      <CreditCard size={16} className="text-white/60" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-white/50 font-medium">Visa, Mastercard</span>
                  </button>

                  {/* Google Play Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("google_play")}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer",
                      selectedMethod === "google_play"
                        ? "bg-vendeur-emerald/10 border-vendeur-emerald ring-1 ring-vendeur-emerald/30 shadow-lg shadow-vendeur-emerald/10"
                        : "bg-[#0b120f] border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-white">Google Play</span>
                      <QrCode size={16} className="text-[#4285F4]" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-white/50 font-medium">Cartes / In-App</span>
                  </button>
                </div>
              </div>

              {/* Bottom Step 1 Action */}
              <div className="pt-3">
                {selectedMethod === "card" ? (
                  <button
                    type="button"
                    onClick={handleCardPaystack}
                    disabled={loading}
                    className="w-full h-13 sm:h-14 bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl cursor-pointer"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={16} />}
                    <span>Payer {totalToday.toLocaleString()} {offer.currency || currency} par Carte</span>
                    <ChevronRight size={18} />
                  </button>
                ) : selectedMethod === "google_play" ? (
                  <button
                    type="button"
                    onClick={handleGooglePlayPay}
                    disabled={loading}
                    className="w-full h-13 sm:h-14 bg-[#4285F4] hover:bg-[#3367D6] text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl cursor-pointer"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />}
                    <span>Payer via Google Play</span>
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full h-13 sm:h-14 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
                  >
                    <span>Continuer vers les coordonnées de paiement</span>
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ================= STEP 2: TRANSFER INSTRUCTIONS ================= */}
          {currentStep === 2 && currentMethodConfig && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentMethodConfig.color }} />
                    <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
                      2. Effectuez votre transfert {currentMethodConfig.name}
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm text-white/50">
                    Transférez le montant exact ci-dessous vers le numéro marchand dédié.
                  </p>
                </div>

                {/* Unobtrusive Minimal Reference Pill */}
                {activeIntent?.reference && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/60 shrink-0">
                    <span>Réf :</span>
                    <span className="text-white font-bold">{activeIntent.reference}</span>
                  </div>
                )}
              </div>

              {/* Ultra-Clear Transfer Cards (Number & Amount) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Beneficiary Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1410] border border-white/15 space-y-1 relative group shadow-lg">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Numéro Destinataire ({paymentConfig?.recipientName || "Vendeur IA"})
                  </div>
                  <div className="text-lg sm:text-2xl font-mono font-black text-white tracking-wider pt-0.5">
                    {currentMethodConfig.number}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentMethodConfig.number, "number")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-white/10 hover:bg-vendeur-emerald hover:text-black text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    {copiedField === "number" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedField === "number" ? "Copié !" : "Copier"}</span>
                  </button>
                </div>

                {/* Amount Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0c1410] border border-white/15 space-y-1 relative shadow-lg">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Montant Exact à Envoyer
                  </div>
                  <div className="text-lg sm:text-2xl font-mono font-black text-vendeur-emerald pt-0.5">
                    {paymentConfig?.localAmount ? paymentConfig.localAmount.toLocaleString() : totalToday.toLocaleString()} {paymentConfig?.currencySymbol || offer.currency || currency}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard((paymentConfig?.localAmount || totalToday).toString(), "amount")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-white/10 hover:bg-vendeur-emerald hover:text-black text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    {copiedField === "amount" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedField === "amount" ? "Copié !" : "Copier"}</span>
                  </button>
                </div>
              </div>

              {/* Simple Guidance Note */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-xs text-white/70 flex items-start gap-3">
                <ShieldCheck size={18} className="text-vendeur-emerald shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {currentMethodConfig.instructions || "Ouvrez votre application de paiement et envoyez le montant exact. Une fois le virement validé, cliquez sur le bouton ci-dessous pour confirmer."}
                </p>
              </div>

              {/* Step 2 CTA */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="order-2 sm:order-1 sm:w-1/3 h-13 sm:h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all cursor-pointer"
                >
                  ← Changer de mode
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="order-1 sm:order-2 sm:w-2/3 h-13 sm:h-14 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
                >
                  <span>J'ai effectué le transfert → Confirmer</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= STEP 3: CONFIRMATION & VALIDATION ================= */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  3. Validation de votre règlement
                </h1>
                <p className="text-xs sm:text-sm text-white/50">
                  Renseignez les détails pour que notre système active automatiquement votre boutique.
                </p>
              </div>

              {!proofSubmitted ? (
                <form onSubmit={handleSubmitProof} className="space-y-4">
                  <div className="bg-[#0b120f] border border-white/10 rounded-2xl sm:rounded-3xl p-4.5 sm:p-6 space-y-4 shadow-xl">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                        Numéro ayant effectué le transfert
                      </label>
                      <div className="flex gap-2 items-center w-full">
                        <CountrySelector
                          selected={senderCountry}
                          onSelect={(c) => {
                            setSenderCountry(c);
                            setUserCountry(c.code);
                          }}
                          dropdownPosition="top"
                          className="h-12 sm:h-14 !rounded-2xl px-3.5 sm:px-4"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="tel"
                            className="w-full h-12 sm:h-14 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 text-white font-mono text-sm placeholder:text-white/20 outline-none transition-all"
                            placeholder="01 02 27 39 66"
                            value={senderLocalPhone}
                            onChange={(e) => setSenderLocalPhone(e.target.value.replace(/\D/g, ""))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                        ID de Transaction / Réf SMS reçu (Optionnel si numéro correct)
                      </label>
                      <input
                        type="text"
                        className="w-full h-12 sm:h-14 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 text-white font-mono text-sm placeholder:text-white/20 outline-none transition-all"
                        placeholder="Ex: PP260817.1234.A56789"
                        value={transactionIdInput}
                        onChange={(e) => setTransactionIdInput(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="order-2 sm:order-1 sm:w-1/3 h-13 sm:h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all cursor-pointer"
                    >
                      ← Revoir les infos
                    </button>

                    <button
                      type="submit"
                      disabled={submittingProof}
                      className="order-1 sm:order-2 sm:w-2/3 h-13 sm:h-14 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl shadow-vendeur-emerald/25 cursor-pointer disabled:opacity-50"
                    >
                      {submittingProof ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Confirmer & Activer mon Vendeur IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 sm:p-8 rounded-3xl bg-[#0b1410] border border-emerald-500/30 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Loader2 className="animate-spin" size={28} />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                      Vérification automatique en cours...
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                      Votre notification de transfert a bien été reçue. Dès validation par le réseau, votre espace Vendeur IA sera activé et vous serez redirigé automatiquement.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security & Peace of Mind Footer */}
        <div className="pt-4 flex items-center justify-center gap-2 text-center text-white/40 text-[11px]">
          <ShieldCheck size={14} className="text-vendeur-emerald shrink-0" />
          <span>Paiement sécurisé et garanti. Support direct WhatsApp 7j/7.</span>
        </div>
      </div>
    </div>
  );
}
