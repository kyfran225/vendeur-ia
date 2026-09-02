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
  Scan,
  User
} from "lucide-react";
import { CountrySelector, COUNTRIES, Country, parsePhoneNumber, formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { convertCurrencyAmount, CURRENCIES_DATA } from "@vendeur-ia/core";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { AuthSheet } from "@/features/auth/components/AuthSheet";

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
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
    selectedMethod && paymentConfig?.methods?.some((m: any) => m.id === selectedMethod)
  );
  const isStep1Ready = Boolean(userCountry && isMethodValid);

  const fullSenderPhone = senderLocalPhone ? `${senderCountry.dialCode}${senderLocalPhone}` : (user?.whatsappNumber || "");

  // Auto-create or refresh PaymentIntent when method or interval changes
  useEffect(() => {
    let isMounted = true;
    const createIntent = async () => {
      if (!user || !selectedMethod) return;
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

  const handleReceiptUploadAndScan = async (file: File) => {
    if (!file) return;
    if (!user) {
      toast.info("Veuillez vous connecter ou créer votre compte pour déposer un reçu.");
      setIsAuthOpen(true);
      return;
    }
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
    if (!user) {
      toast.info("Veuillez vous connecter ou créer votre compte pour valider votre paiement.");
      setIsAuthOpen(true);
      return;
    }
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
        setProofSubmitted(true);
        setTimeout(() => navigate("/dashboard"), 2500);
      } else {
        setProofSubmitted(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la soumission");
    } finally {
      setSubmittingProof(false);
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

        {/* Unauthenticated Visitor Identification Card */}
        {!user && (
          <div className="bg-gradient-to-r from-emerald-950/70 via-[#0c1611] to-emerald-950/70 border border-vendeur-emerald/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-left space-y-3.5 shadow-xl animate-in fade-in">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-vendeur-emerald/20 text-vendeur-emerald border border-vendeur-emerald/40 flex items-center justify-center shrink-0">
                <User size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-tight">
                  Identifiez-vous pour lier votre Vendeur IA
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-0.5 leading-relaxed">
                  Créez votre compte ou connectez-vous en 30 secondes pour associer votre abonnement et votre numéro WhatsApp commercial.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="h-11 sm:h-12 px-6 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-vendeur-emerald/20 cursor-pointer shrink-0"
              >
                <Sparkles size={16} />
                <span>Créer mon compte / Me connecter</span>
              </button>
              <span className="text-[11px] text-white/40 sm:ml-2">
                ✓ Sans engagement · Configuration immédiate
              </span>
            </div>
          </div>
        )}

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

                  {/* Carte Bancaire (Bientôt disponible) */}
                  <div
                    onClick={() => {
                      toast.info("💳 Le paiement par Carte Bancaire (Visa / Mastercard) sera bientôt disponible ! Pour une activation instantanée, choisissez Wave, MTN MoMo ou Orange Money. 🚀");
                    }}
                    className="p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer bg-[#0b120f]/60 border-white/10 opacity-70 hover:opacity-100 hover:border-white/20 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-tight text-white/80">Carte Bancaire</span>
                      <CreditCard size={16} className="text-white/40 group-hover:text-white/70" />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] sm:text-[11px] text-white/40 font-medium">Visa, Mastercard</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        Bientôt dispo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Step 1 Action */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      toast.info("Veuillez vous identifier pour préparer votre accès Vendeur IA.");
                      setIsAuthOpen(true);
                      return;
                    }
                    if (isStep1Ready) setCurrentStep(2);
                  }}
                  disabled={!isStep1Ready}
                  className="w-full h-14 min-h-[56px] bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl shadow-vendeur-emerald/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-vendeur-emerald disabled:shadow-none shrink-0"
                >
                  <span>Continuer le paiement</span>
                  <ChevronRight size={18} className="shrink-0" />
                </button>
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
                    Montant Exact à Envoyer {isYearly && <span className="text-amber-400">(Réduction Annuelle Incluse)</span>}
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
                  <div className="bg-[#0b120f] border border-white/10 rounded-2xl sm:rounded-3xl p-4.5 sm:p-6 space-y-6 shadow-xl">
                    {/* Element Principal: Numéro émetteur */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 rounded-xl bg-vendeur-emerald/15 text-vendeur-emerald border border-vendeur-emerald/30 flex items-center justify-center">
                          <Phone size={15} />
                        </div>
                        <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                          Numéro ayant effectué le transfert
                        </label>
                      </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* ID de Transaction : Plus discret */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                          ID Transaction / Réf SMS (Optionnel)
                        </label>
                        <input
                          type="text"
                          className="w-full h-11 bg-black/30 border border-white/5 focus:border-vendeur-emerald/50 rounded-xl px-4 text-white font-mono text-[11px] placeholder:text-white/10 outline-none transition-all"
                          placeholder="Ex: PP260817..."
                          value={transactionIdInput}
                          onChange={(e) => setTransactionIdInput(e.target.value)}
                        />
                      </div>

                      {/* Upload Photo : Zone réduite */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                          Capture du reçu (Optionnel)
                        </label>
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
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-11 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold text-white/60 transition-all cursor-pointer"
                          >
                            <Camera size={14} />
                            <span>Ajouter une photo</span>
                          </button>
                        ) : (
                          <div className="h-11 bg-vendeur-emerald/10 border border-vendeur-emerald/20 rounded-xl px-2 flex items-center justify-between gap-2 overflow-hidden">
                            <div className="flex items-center gap-2 min-w-0">
                               <img src={receiptPreview} className="h-7 w-7 rounded object-cover" />
                               <span className="text-[10px] font-bold text-emerald-400 truncate">{receiptFile?.name}</span>
                            </div>
                            <button type="button" onClick={handleRemoveReceipt} className="text-red-400/60 hover:text-red-400 p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scan Progress Feedback (if scanning) */}
                    {isScanningReceipt && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2 animate-pulse">
                        <Loader2 size={12} className="animate-spin text-vendeur-emerald" />
                        <span className="text-[10px] font-bold text-emerald-300">Analyse IA du reçu en cours...</span>
                      </div>
                    )}
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
                <CheckoutSuccessModal
                  activeIntent={activeIntent}
                  totalToday={totalToday}
                  activeCurrencySymbol={activeCurrencySymbol}
                  offerName={offer?.name || "Vendeur IA Pro"}
                  onNavigateDashboard={() => navigate("/dashboard")}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security & Peace of Mind Footer */}
        <div className="pt-4 flex items-center justify-center gap-2 text-center text-white/40 text-[11px]">
          <ShieldCheck size={14} className="text-vendeur-emerald shrink-0" />
          <span>Paiement sécurisé et garanti. Support direct WhatsApp 7j/7.</span>
        </div>

        {/* Global Auth Sheet for Unauthenticated Visitors */}
        <AuthSheet
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      </div>
    </div>
  );
}

function CheckoutSuccessModal({
  activeIntent,
  totalToday,
  activeCurrencySymbol,
  offerName,
  onNavigateDashboard
}: {
  activeIntent: any;
  totalToday: number;
  activeCurrencySymbol: string;
  offerName: string;
  onNavigateDashboard: () => void;
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(7);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    if (secondsRemaining <= 0) {
      onNavigateDashboard();
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPaused, secondsRemaining, onNavigateDashboard]);

  const handleSupportWhatsApp = () => {
    const waUrl = `https://wa.me/2250505111157?text=${encodeURIComponent(
      `Bonjour Support Vendeur IA,\nJe viens d'effectuer mon transfert de ${totalToday.toLocaleString()} ${activeCurrencySymbol} pour l'offre ${offerName}.\nRéférence : ${activeIntent?.reference || ""}`
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    // Directly redirect current window to dashboard so when user comes back they are on Dashboard
    setTimeout(() => {
      onNavigateDashboard();
    }, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#0c1410] border border-vendeur-emerald/30 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 text-center space-y-6 sm:space-y-8 shadow-[0_0_100px_rgba(16,185,129,0.15)] relative overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-vendeur-emerald/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5 sm:space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center text-vendeur-emerald shadow-inner">
            <CheckCircle2 size={36} className="animate-bounce sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              Félicitations ! 🎉
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-emerald-300/80 leading-relaxed font-medium max-w-sm mx-auto">
              Votre demande de règlement a bien été transmise. Notre équipe valide votre accès sous 10 à 30 minutes.
            </p>
          </div>

          {/* Info Recap Card */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 sm:p-4 grid grid-cols-2 gap-3 text-left">
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Référence</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-white truncate">
                #{activeIntent?.reference?.slice(-8) || "TRX-OK"}
              </p>
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">Montant</p>
              <p className="text-xs sm:text-sm font-mono font-bold text-vendeur-emerald truncate">
                {totalToday.toLocaleString()} {activeCurrencySymbol}
              </p>
            </div>
          </div>

          {/* Action buttons (Mobile-optimized, generous height) */}
          <div className="flex flex-col gap-2.5 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="w-full h-12 sm:h-14 min-h-[48px] bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-vendeur-emerald/20 active:scale-95 cursor-pointer px-3 sm:px-4"
            >
              <span className="truncate">Accéder au tableau de bord</span>
              <span className="text-[10px] sm:text-[11px] font-bold bg-vendeur-coal/20 px-2 py-0.5 rounded-full text-vendeur-coal shrink-0">
                {secondsRemaining}s
              </span>
              <ChevronRight size={16} className="shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleSupportWhatsApp}
              className="w-full h-11 sm:h-12 text-white/70 hover:text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 hover:bg-white/5 rounded-xl cursor-pointer"
            >
              <WhatsAppIcon size={16} variant="brand" />
              <span>Assistance WhatsApp</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
