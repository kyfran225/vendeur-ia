import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  MapPin,
  Truck,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Sparkles,
  Loader2,
  Phone,
  Plus,
  Trash2,
  DollarSign,
  Building,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StoreSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard?: any;
}

const CATEGORIES = [
  { id: "clothing", label: "Mode & Vêtements", icon: "👗" },
  { id: "beauty", label: "Beauté & Cosmétiques", icon: "💄" },
  { id: "food", label: "Restauration & Fast-Food", icon: "🍔" },
  { id: "electronics", label: "Électronique & High-Tech", icon: "💻" },
  { id: "shoes", label: "Chaussures & Maroquinerie", icon: "👠" },
  { id: "services", label: "Prestations & Services", icon: "🛠️" },
  { id: "other", label: "Autre commerce", icon: "📦" }
];

const DEFAULT_PAYMENT_PROVIDERS = [
  { id: "wave", name: "Wave Mobile Money", badge: "Populaire" },
  { id: "orange", name: "Orange Money", badge: "Mobile" },
  { id: "mtn", name: "MTN MoMo", badge: "Mobile" },
  { id: "moov", name: "Moov Money", badge: "Mobile" }
];

function getDetectedProvider(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "").slice(-10);
  if (/^(01|02|03|40|41|42|43|50|51|52|53|70|71|72|73)/.test(digits)) {
    return "Moov Money";
  }
  if (/^(04|05|06|44|45|46|54|55|56|74|75|76|84|85|86)/.test(digits)) {
    return "MTN MoMo";
  }
  if (/^(07|08|09|47|48|49|57|58|59|77|78|79|87|88|89)/.test(digits)) {
    return "Orange Money";
  }
  return "Moov Money";
}

export function StoreSetupWizardModal({
  isOpen,
  onClose,
  dashboard
}: StoreSetupWizardModalProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Merchant Identity State
  const merchant = dashboard?.merchant || {};
  const [businessName, setBusinessName] = useState(merchant?.businessName || "");
  const [category, setCategory] = useState(merchant?.category || "clothing");
  const [city, setCity] = useState(merchant?.city || "Abidjan");
  const [whatsappNumber, setWhatsappNumber] = useState(merchant?.whatsappNumber || merchant?.phone || "");
  const [description, setDescription] = useState(merchant?.description || "");

  // Delivery Fees State
  const [deliveryFees, setDeliveryFees] = useState<Array<{ zoneName: string; fee: number }>>([
    { zoneName: "Abidjan Centre (Cocody, Plateau, Marcory)", fee: 1500 },
    { zoneName: "Abidjan Périphérie (Yopougon, Abobo, Songon)", fee: 2000 },
    { zoneName: "Expédition Intérieur du pays", fee: 3500 }
  ]);

  const initialPhone = merchant?.whatsappNumber || merchant?.phone || "";
  const initialProvider = getDetectedProvider(initialPhone);

  // Payment Channels State
  const [paymentMethods, setPaymentMethods] = useState<Array<{ provider: string; number: string; customLabel?: string }>>([
    { provider: "Wave", number: initialPhone },
    { provider: initialProvider, number: initialPhone }
  ]);

  // Sync payment methods provider when whatsappNumber changes
  useEffect(() => {
    if (whatsappNumber) {
      const detected = getDetectedProvider(whatsappNumber);
      setPaymentMethods(prev => {
        if (prev.length === 2 && prev[0].provider === "Wave") {
          return [
            { provider: "Wave", number: whatsappNumber },
            { provider: detected, number: whatsappNumber }
          ];
        }
        return prev;
      });
    }
  }, [whatsappNumber]);

  // Fetch Knowledge Base to populate delivery & payment defaults
  const { data: knowledge } = useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/api/commerce/knowledge");
        return res.data;
      } catch (e) {
        console.warn("[StoreSetupWizardModal] Knowledge load warning:", e);
        return {};
      }
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (merchant) {
      if (merchant.businessName) setBusinessName(merchant.businessName);
      if (merchant.category) setCategory(merchant.category);
      if (merchant.city) setCity(merchant.city);
      if (merchant.whatsappNumber || merchant.phone) setWhatsappNumber(merchant.whatsappNumber || merchant.phone);
      if (merchant.description) setDescription(merchant.description);
    }

    if (knowledge?.businessRules) {
      if (knowledge.businessRules.deliveryFees && knowledge.businessRules.deliveryFees.length > 0) {
        setDeliveryFees(knowledge.businessRules.deliveryFees);
      }
      if (knowledge.businessRules.paymentMethods && knowledge.businessRules.paymentMethods.length > 0) {
        setPaymentMethods(knowledge.businessRules.paymentMethods);
      }
    }
  }, [merchant, knowledge]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Update Merchant Info
      await apiClient.patch("/api/commerce/merchant", {
        businessName: businessName.trim(),
        category,
        city: city.trim(),
        phone: whatsappNumber.trim(),
        whatsappNumber: whatsappNumber.trim(),
        description: description.trim()
      });

      // 2. Update Knowledge Rules (Payments + Delivery)
      const cleanPayments = paymentMethods.filter(p => p.number && p.number.trim() !== "");
      const cleanDelivery = deliveryFees.filter(d => d.zoneName && d.zoneName.trim() !== "");

      await apiClient.patch("/api/commerce/knowledge", {
        businessRules: {
          paymentMethods: cleanPayments.length > 0 ? cleanPayments : [{ provider: "Wave", number: whatsappNumber }],
          deliveryFees: cleanDelivery.length > 0 ? cleanDelivery : [{ zoneName: "Livraison Standard", fee: 1500 }]
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      toast.success("Boutique configurée avec succès ! 🎉");
      onClose();
    },
    onError: (err: any) => {
      console.error("Save Store Error:", err);
      toast.error(err?.response?.data?.error || "Erreur lors de la sauvegarde.");
    }
  });

  const handleAddDeliveryZone = () => {
    setDeliveryFees([...deliveryFees, { zoneName: "", fee: 1500 }]);
  };

  const handleRemoveDeliveryZone = (index: number) => {
    setDeliveryFees(deliveryFees.filter((_, i) => i !== index));
  };

  const handleAddPaymentMethod = (providerName: string) => {
    const exists = paymentMethods.some(p => p.provider.toLowerCase() === providerName.toLowerCase());
    if (!exists) {
      setPaymentMethods([...paymentMethods, { provider: providerName, number: whatsappNumber }]);
    }
  };

  const handleRemovePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-6 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="relative w-full h-full sm:h-auto max-w-xl bg-white dark:bg-[#0c1612] border-0 sm:border border-slate-200 dark:border-white/10 rounded-none sm:rounded-[2.5rem] shadow-2xl overflow-hidden text-slate-900 dark:text-white flex flex-col sm:max-h-[90vh] supports-[height:100dvh]:h-[100dvh] sm:supports-[height:100dvh]:h-auto"
      >
        {/* Header with Step Progress */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 flex items-center justify-center text-vendeur-emerald shrink-0">
              {currentStep === 1 && <Store size={22} />}
              {currentStep === 2 && <Truck size={22} />}
              {currentStep === 3 && <CreditCard size={22} />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-vendeur-emerald tracking-widest bg-vendeur-emerald/10 px-2.5 py-0.5 rounded-full border border-vendeur-emerald/20">
                Étape {currentStep} sur 3
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white mt-0.5">
                {currentStep === 1 && "Profil de votre boutique"}
                {currentStep === 2 && "Tarifs de Livraison"}
                {currentStep === 3 && "Moyens de Paiement"}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Gauge */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 overflow-hidden shrink-0">
          <motion.div
            className="h-full bg-vendeur-emerald"
            initial={{ width: "33%" }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 custom-scrollbar">

          {/* STEP 1: Identity & Profile */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                  Nom commercial de la boutique <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Boutique Chic Abidjan"
                  className="w-full h-12 sm:h-13 px-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-vendeur-emerald text-sm font-bold outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                    Secteur d'activité
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 sm:h-13 px-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-vendeur-emerald text-sm font-bold outline-none transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                    Ville principale
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Abidjan, Bouaké, Yamoussoukro"
                    className="w-full h-12 sm:h-13 px-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-vendeur-emerald text-sm font-bold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                  Numéro WhatsApp de réception des commandes <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Ex: 07 00 00 00 00"
                  className="w-full h-12 sm:h-13 px-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-vendeur-emerald text-sm font-bold outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                    Présentation de la boutique <span className="text-slate-400 font-normal">(Optionnel)</span>
                  </label>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Vente de vêtements tendance de qualité supérieure avec livraison rapide à Abidjan."
                  rows={2}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 focus:border-vendeur-emerald text-sm font-medium outline-none transition-all resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2: Delivery Fees */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
                🚚 <strong>Information pour vos clients</strong> : Vendeur IA utilisera ces tarifs pour calculer automatiquement les frais d'expédition lorsqu'un client demande une livraison sur WhatsApp.
              </div>

              <div className="space-y-3">
                {deliveryFees.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10"
                  >
                    <input
                      type="text"
                      value={item.zoneName}
                      onChange={(e) => {
                        const updated = [...deliveryFees];
                        updated[idx].zoneName = e.target.value;
                        setDeliveryFees(updated);
                      }}
                      placeholder="Ex: Abidjan Centre / Intérieur"
                      className="flex-1 h-11 px-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold outline-none focus:border-vendeur-emerald"
                    />

                    <div className="relative w-28 sm:w-32 shrink-0">
                      <input
                        type="number"
                        value={item.fee}
                        onChange={(e) => {
                          const updated = [...deliveryFees];
                          updated[idx].fee = Number(e.target.value);
                          setDeliveryFees(updated);
                        }}
                        className="w-full h-11 pl-3 pr-8 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold outline-none focus:border-vendeur-emerald text-right"
                      />
                      <span className="absolute right-2.5 top-3 text-[10px] font-black text-slate-400">
                        FCFA
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveDeliveryZone(idx)}
                      className="h-11 w-11 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                      title="Supprimer la zone"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddDeliveryZone}
                  className="w-full h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Ajouter une zone de livraison</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Payment Channels */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                💰 <strong>Encaissement direct</strong> : Indiquez les numéros Mobile Money sur lesquels vos clients effectueront leurs règlements. Vendeur IA transmettra ces numéros au moment du paiement.
              </div>

              {/* Quick Add Provider Buttons */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                  Activer un canal rapidement
                </span>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_PAYMENT_PROVIDERS.map((prov) => {
                    const isAdded = paymentMethods.some(p => p.provider.toLowerCase() === prov.name.toLowerCase());
                    return (
                      <button
                        key={prov.id}
                        type="button"
                        disabled={isAdded}
                        onClick={() => handleAddPaymentMethod(prov.name)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border",
                          isAdded
                            ? "bg-vendeur-emerald/10 border-vendeur-emerald/30 text-vendeur-emerald opacity-60"
                            : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:border-vendeur-emerald"
                        )}
                      >
                        {isAdded ? <Check size={13} /> : <Plus size={13} />}
                        <span>{prov.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Payment Methods Inputs */}
              <div className="space-y-3 pt-2">
                {paymentMethods.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 sm:gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10"
                  >
                    <div className="w-32 sm:w-36 font-black text-xs text-slate-900 dark:text-white truncate shrink-0">
                      {item.provider}
                    </div>

                    <input
                      type="tel"
                      value={item.number}
                      onChange={(e) => {
                        const updated = [...paymentMethods];
                        updated[idx].number = e.target.value;
                        setPaymentMethods(updated);
                      }}
                      placeholder="N° de téléphone (ex: 07 00 00 00 00)"
                      className="flex-1 h-11 px-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold outline-none focus:border-vendeur-emerald"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemovePaymentMethod(idx)}
                      className="h-11 w-11 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                      title="Retirer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Précédent</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              disabled={!businessName.trim()}
              onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
              className="h-11 px-6 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 text-white font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              <span>Suivant</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saveMutation.isPending || !businessName.trim()}
              onClick={() => saveMutation.mutate()}
              className="h-11 px-6 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 text-white font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
            >
              {saveMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span>Enregistrer & Valider</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
