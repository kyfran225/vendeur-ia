import React, { useState, useEffect, useRef } from "react";
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
  Wallet,
  UploadCloud,
  Camera,
  Image as ImageIcon,
  FileCheck2,
  Trash2,
  Scan
} from "lucide-react";
import { CountrySelector, COUNTRIES, Country, parsePhoneNumber, formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { convertCurrencyAmount, CURRENCIES_DATA } from "@vendeur-ia/core";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const merchantCurrency = useMerchantCurrency();

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

  const targetCurrency = countries.find(c => c.code === userCountry)?.currency || "XOF";

  const initialSenderParsed = parsePhoneNumber(user?.whatsappNumber || "", userCountry);
  const [senderCountry, setSenderCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === userCountry) || initialSenderParsed.country
  );
  const [senderLocalPhone, setSenderLocalPhone] = useState(initialSenderParsed.local);
  const [loading, setLoading] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Vision AI Receipt & Anti-Fraud Scanner states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadedReceiptUrl, setUploadedReceiptUrl] = useState<string>("");
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scanResult, setScanResult] = useState<{
    isPaymentProof?: boolean;
    platform?: string;
    amount?: number;
    currency?: string;
    transactionId?: string;
    senderPhone?: string;
    senderName?: string;
    confidenceScore?: number;
    amountMatches?: boolean;
    analysisSummary?: string;
    flags?: string[];
  } | null>(null);

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

  // 1. Fetch Offers converted for the active target currency
  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", targetCurrency],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/offers?currency=${targetCurrency}`);
      return res.data;
    }
  });

  // 2. Fetch Payment Config for the chosen country
  const { data: paymentConfig, isLoading: isConfigLoading } = useQuery({
    queryKey: ["paymentConfig", userCountry],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/payments/config?country=${userCountry}`);
      return res.data;
    }
  });

  // When payment config loads or userCountry changes, ensure selectedMethod is valid for that country
  useEffect(() => {
    if (!paymentConfig?.methods) return;
    if (selectedMethod === "card" || selectedMethod === "google_play") return;

    const isAvailable = paymentConfig.methods.some((m: any) => m.id === selectedMethod);
    if (!isAvailable) {
      if (paymentConfig.methods.length > 0) {
        setSelectedMethod(paymentConfig.methods[0].id);
      } else {
        setSelectedMethod("");
      }
    }
  }, [paymentConfig, userCountry, selectedMethod]);

  const isMethodValid = Boolean(
    selectedMethod &&
    (selectedMethod === "card" || selectedMethod === "google_play" || paymentConfig?.methods?.some((m: any) => m.id === selectedMethod))
  );
  const isStep1Ready = Boolean(userCountry && isMethodValid);

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
  const offerCurr = offer?.currency || "XOF";
  const rawMonthly = offer?.monthlyPrice || 5000;
  const monthlyPrice = offerCurr === targetCurrency ? rawMonthly : convertCurrencyAmount(rawMonthly, offerCurr, targetCurrency);
  const rawYearly = offer?.yearlyPrice || Math.round(rawMonthly * 10);
  const yearlyPrice = offerCurr === targetCurrency ? rawYearly : convertCurrencyAmount(rawYearly, offerCurr, targetCurrency);
  const planPrice = isYearly ? yearlyPrice : monthlyPrice;

  const rawSetupFee = setupOption ? (offer?.setupOptions?.find((o: any) => o.type === setupOption)?.price || (setupOption === 'EXPERT' ? 25000 : 0)) : 0;
  const setupFee = offerCurr === targetCurrency ? rawSetupFee : convertCurrencyAmount(rawSetupFee, offerCurr, targetCurrency);

  const totalToday = planPrice + setupFee;
  const savings = isYearly ? (monthlyPrice * 12 - yearlyPrice) : 0;
  const activeCurrencySymbol = CURRENCIES_DATA[targetCurrency]?.symbol || paymentConfig?.currencySymbol || targetCurrency;

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

  const handleReceiptUploadAndScan = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (JPG, PNG, WebP).");
      return;
    }

    if (!activeIntent?._id) {
      toast.error("Session de paiement en cours d'initialisation, veuillez patienter.");
      return;
    }

    setReceiptFile(file);
    const localUrl = URL.createObjectURL(file);
    setReceiptPreview(localUrl);
    setIsScanningReceipt(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const res = await apiClient.post(`/api/commerce/payments/intent/${activeIntent._id}/scan-proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const data = res.data;
      if (data.proofImageUrl) {
        setUploadedReceiptUrl(data.proofImageUrl);
      }
      setScanResult(data);

      // Auto-populate transaction details from AI OCR
      if (data.transactionId) {
        setTransactionIdInput(data.transactionId);
      }
      if (data.senderPhone) {
        const parsed = parsePhoneNumber(data.senderPhone, userCountry);
        setSenderCountry(parsed.country);
        setSenderLocalPhone(parsed.local);
      }

      if (data.isPaymentProof) {
        if (data.forensics?.isPhotoshopTampered || data.forensics?.isAiGenerated) {
          toast.warning("L'image présente des incohérences visuelles. Le paiement sera vérifié manuellement.");
        } else {
          toast.success(`Reçu ${data.platform || "Paiement"} analysé avec succès ! 🎉`);
        }
      } else {
        toast.warning("L'image ne semble pas être un reçu de paiement officiel. Vous pouvez compléter les champs manuellement.");
      }
    } catch (err: any) {
      console.error("Scan error:", err);
      toast.error(err.response?.data?.error || "Erreur lors de l'analyse du reçu. Vous pouvez renseigner vos informations manuellement.");
    } finally {
      setIsScanningReceipt(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setUploadedReceiptUrl("");
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntent?._id) {
      toast.error("Session de paiement invalide.");
      return;
    }

    if (!transactionIdInput && !senderLocalPhone && !uploadedReceiptUrl) {
      toast.error("Veuillez déposer votre reçu ou renseigner votre ID de transaction / numéro.");
      return;
    }

    setSubmittingProof(true);
    try {
      const res = await apiClient.post(`/api/commerce/payments/intent/${activeIntent._id}/submit-proof`, {
        transactionId: transactionIdInput.trim(),
        senderPhoneNumber: fullSenderPhone.trim(),
        proofImageUrl: uploadedReceiptUrl || undefined
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

        {/* Compact Plan Summary Banner (Mobile-Optimized & Reassuring) */}
        <div className="bg-[#0e1713] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black uppercase text-white tracking-tight">{offer.name}</h2>
                  <span className="text-[9px] font-black uppercase tracking-wider text-vendeur-emerald bg-vendeur-emerald/10 px-2 py-0.5 rounded-full border border-vendeur-emerald/20 whitespace-nowrap">
                    {isYearly ? "Annuel (-17%)" : "Mensuel"}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mt-0.5">Activation instantanée & assistance 7j/7</p>
              </div>
            </div>

            <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t border-white/5 sm:border-t-0 pt-2 sm:pt-0 shrink-0">
              <div className="text-lg sm:text-2xl font-black italic text-vendeur-emerald font-mono leading-none">
                {totalToday.toLocaleString()} <span className="text-xs uppercase text-vendeur-emerald/70 font-sans">{activeCurrencySymbol}</span>
              </div>
              {isYearly && savings > 0 && (
                <span className="text-[9px] font-bold text-white/40 block mt-0.5 sm:mt-1">
                  Économie de {savings.toLocaleString()} {activeCurrencySymbol}
                </span>
              )}
            </div>
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
                      onClick={() => {
                        setUserCountry(c.code);
                        const found = COUNTRIES.find(country => country.code === c.code);
                        if (found) setSenderCountry(found);
                      }}
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

              {/* Bottom Step 1 Action - Always visible, disabled when incomplete */}
              <div className="pt-3">
                {selectedMethod === "card" ? (
                  <button
                    type="button"
                    onClick={handleCardPaystack}
                    disabled={!isStep1Ready || loading}
                    className="w-full h-14 min-h-[56px] bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white shrink-0"
                  >
                    {loading ? <Loader2 className="animate-spin shrink-0" size={18} /> : <Lock size={16} className="shrink-0" />}
                    <span>Payer par Carte ({totalToday.toLocaleString()} {activeCurrencySymbol})</span>
                    <ChevronRight size={18} className="shrink-0" />
                  </button>
                ) : selectedMethod === "google_play" ? (
                  <button
                    type="button"
                    onClick={handleGooglePlayPay}
                    disabled={!isStep1Ready || loading}
                    className="w-full h-14 min-h-[56px] bg-[#4285F4] hover:bg-[#3367D6] text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#4285F4] shrink-0"
                  >
                    {loading ? <Loader2 className="animate-spin shrink-0" size={18} /> : <QrCode size={18} className="shrink-0" />}
                    <span>Payer via Google Play</span>
                    <ChevronRight size={18} className="shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => isStep1Ready && setCurrentStep(2)}
                    disabled={!isStep1Ready}
                    className="w-full h-14 min-h-[56px] bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl shadow-vendeur-emerald/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-vendeur-emerald disabled:shadow-none shrink-0"
                  >
                    <span>Continuer le paiement</span>
                    <ChevronRight size={18} className="shrink-0" />
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
                    {totalToday.toLocaleString()} {activeCurrencySymbol}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(totalToday.toString(), "amount")}
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
                  className="order-2 sm:order-1 sm:w-1/3 h-14 min-h-[56px] bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                  ← Changer de mode
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="order-1 sm:order-2 sm:w-2/3 h-14 min-h-[56px] bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl shadow-vendeur-emerald/20 cursor-pointer shrink-0"
                >
                  <span>J'ai envoyé le montant → Continuer</span>
                  <ChevronRight size={18} className="shrink-0" />
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
                  {/* 1. Zone d'Upload Reçu Photo avec IA Vision & Scanner Anti-Fraude */}
                  <div className="bg-[#0b120f] border border-white/10 rounded-2xl sm:rounded-3xl p-4.5 sm:p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-vendeur-emerald/15 text-vendeur-emerald border border-vendeur-emerald/30 flex items-center justify-center">
                          <Camera size={15} />
                        </div>
                        <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                          Capture d'écran du reçu (Recommandé)
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20">
                        Scan IA Vision ✨
                      </span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReceiptUploadAndScan(file);
                      }}
                    />

                    {!receiptPreview ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleReceiptUploadAndScan(file);
                        }}
                        className="border-2 border-dashed border-white/15 hover:border-vendeur-emerald/50 bg-black/40 hover:bg-vendeur-emerald/[0.02] p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 cursor-pointer transition-all group"
                      >
                        <div className="h-12 w-12 rounded-2xl bg-white/5 group-hover:bg-vendeur-emerald/20 text-white/50 group-hover:text-vendeur-emerald flex items-center justify-center transition-colors">
                          <UploadCloud size={24} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-white">
                            Déposez la capture du reçu Wave / Orange / MTN / Moov
                          </p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            Cliquez ou glissez une image (JPG, PNG) • Remplissage automatique par IA
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 rounded-2xl bg-black/50 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                              <img src={receiptPreview} alt="Reçu de paiement" className="h-full w-full object-cover" />
                              {isScanningReceipt && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
                                  <Loader2 className="animate-spin text-vendeur-emerald" size={18} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-black text-white truncate">
                                  {receiptFile?.name || "Capture de reçu"}
                                </span>
                              </div>
                              <p className="text-[11px] text-white/50">
                                {isScanningReceipt ? "IA Vision : Analyse médico-légale en cours..." : "Reçu chargé"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            disabled={isScanningReceipt}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/5 transition-all cursor-pointer"
                            title="Supprimer la photo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Scanner Radar Feedback */}
                        {isScanningReceipt && (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 animate-pulse">
                            <Scan size={16} className="text-vendeur-emerald animate-spin" />
                            <span className="text-xs font-bold text-emerald-300">
                              Audit médico-légal et extraction de la référence en cours...
                            </span>
                          </div>
                        )}

                        {/* Scan Success / Result Feedback */}
                        {!isScanningReceipt && scanResult && (
                          <div className="space-y-2">
                            {scanResult.isPaymentProof ? (
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                                <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                                  <CheckCircle2 size={14} />
                                  <span>Reçu {scanResult.platform || "Paiement"} Détecté</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                                  {scanResult.amount ? (
                                    <div className="text-white/80">
                                      <span className="text-white/40">Montant : </span>
                                      <span className="font-mono font-bold text-emerald-300">{scanResult.amount.toLocaleString()} {scanResult.currency || "XOF"}</span>
                                    </div>
                                  ) : null}
                                  {scanResult.transactionId ? (
                                    <div className="text-white/80 truncate">
                                      <span className="text-white/40">Réf : </span>
                                      <span className="font-mono font-bold text-white">{scanResult.transactionId}</span>
                                    </div>
                                  ) : null}
                                  {scanResult.senderPhone ? (
                                    <div className="text-white/80 truncate">
                                      <span className="text-white/40">Expéditeur : </span>
                                      <span className="font-mono font-bold text-white">{scanResult.senderPhone}</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <span>L'image ne ressemble pas à un reçu officiel standard. Vous pouvez vérifier ou corriger les champs ci-dessous.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                          Informations de transaction
                        </span>
                        {scanResult?.transactionId && (
                          <span className="text-[10px] text-vendeur-emerald font-black uppercase flex items-center gap-1">
                            <Sparkles size={11} /> Pré-rempli par IA
                          </span>
                        )}
                      </div>

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
                          ID de Transaction / Réf SMS reçu (Optionnel si reçu fourni)
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
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="order-2 sm:order-1 sm:w-1/3 h-14 min-h-[56px] bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                    >
                      ← Revoir les infos
                    </button>

                    <button
                      type="submit"
                      disabled={submittingProof}
                      className="order-1 sm:order-2 sm:w-2/3 h-14 min-h-[56px] bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl shadow-vendeur-emerald/25 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {submittingProof ? (
                        <Loader2 className="animate-spin shrink-0" size={18} />
                      ) : (
                        <>
                          <CheckCircle2 size={18} className="shrink-0" />
                          <span>Confirmer mon paiement</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  {/* Status Banner */}
                  <div className="p-5 sm:p-7 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 shadow-2xl">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                      <CheckCircle2 size={32} className="animate-bounce" />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
                        Votre transfert a bien été enregistré !
                      </h3>
                      <p className="text-xs sm:text-sm text-emerald-300/80 leading-relaxed font-medium">
                        Notre équipe et nos algorithmes vérifient actuellement votre transaction. Votre Vendeur IA 24h/24 sera activé automatiquement dès validation.
                      </p>
                    </div>
                  </div>

                  {/* Complete Receipt Card */}
                  <div className="bg-[#0c1410] border border-white/10 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-white/50">Reçu de transaction</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Vérification en cours (10 - 30 min)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                      {/* Reference */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1 relative">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                          Référence Unique
                        </div>
                        <div className="text-sm sm:text-base font-mono font-black text-white tracking-wider">
                          {activeIntent?.reference || "EN COURS"}
                        </div>
                        {activeIntent?.reference && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(activeIntent.reference, "ref_proof")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-white/10 hover:bg-vendeur-emerald hover:text-black text-white text-xs transition-all cursor-pointer"
                            title="Copier la référence"
                          >
                            {copiedField === "ref_proof" ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>

                      {/* Montant */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                          Montant Déclaré
                        </div>
                        <div className="text-sm sm:text-base font-mono font-black text-vendeur-emerald">
                          {totalToday.toLocaleString()} {activeCurrencySymbol}
                        </div>
                      </div>

                      {/* Numéro émetteur */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                          Numéro Émetteur
                        </div>
                        <div className="text-sm sm:text-base font-mono font-bold text-white/90">
                          {fullSenderPhone || "Non renseigné"}
                        </div>
                      </div>

                      {/* Moyen de Paiement */}
                      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
                          Moyen Utilisé
                        </div>
                        <div className="text-sm sm:text-base font-bold text-white capitalize flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: currentMethodConfig?.color || "#10B981" }}
                          />
                          <span>{currentMethodConfig?.name || selectedMethod}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Claires & Non Bloquantes */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate("/dashboard")}
                      className="flex-1 h-14 min-h-[56px] bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-vendeur-emerald/20 active:scale-98 cursor-pointer shrink-0"
                    >
                      <span>Aller à mon tableau de bord</span>
                      <ChevronRight size={18} className="shrink-0" />
                    </button>

                    <a
                      href={`https://wa.me/2250505111157?text=${encodeURIComponent(
                        `Bonjour Support Vendeur IA,\nJe viens d'effectuer mon transfert de ${totalToday.toLocaleString()} ${activeCurrencySymbol} pour l'offre ${offer?.name}.\nRéférence : ${activeIntent?.reference || ""}\nNuméro émetteur : ${fullSenderPhone}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-14 min-h-[56px] px-6 bg-white/10 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 border border-white/10 text-white hover:text-[#25D366] font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-98 cursor-pointer shrink-0"
                    >
                      <WhatsAppIcon size={18} variant="brand" className="shrink-0" />
                      <span>Assistance WhatsApp</span>
                    </a>
                  </div>

                  {/* Discreet Background Polling Indicator */}
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 text-center flex items-center justify-center gap-2 text-xs text-white/40 font-medium">
                    <Loader2 size={14} className="animate-spin text-vendeur-emerald shrink-0" />
                    <span>Synchronisation active en direct : Vous serez notifié et redirigé automatiquement dès approbation.</span>
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
