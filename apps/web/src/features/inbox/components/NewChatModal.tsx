import { useState } from "react";
import { MessageCircle, X, Send, User, Phone, Sparkles, ShieldCheck, Store, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { CountrySelector, COUNTRIES, Country } from "@/features/onboarding/components/CountrySelector";
import { useAuthStore } from "@/stores/authStore";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (conversationId: string) => void;
}

export function NewChatModal({ isOpen, onClose, onChatCreated }: NewChatModalProps) {
  const { user } = useAuthStore();
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find((c) => c.code === "CI") || COUNTRIES[0]
  );
  const [rawPhone, setRawPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [senderChannel, setSenderChannel] = useState<"merchant" | "system">("merchant");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = rawPhone.replace(/\D/g, "");
    if (!cleanDigits || cleanDigits.length < 8) {
      toast.error("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    // Build full E.164 phone string
    const fullPhone = `${selectedCountry.dialCode}${cleanDigits}`;

    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/api/commerce/conversations/start", {
        phone: fullPhone,
        name: customerName.trim() || undefined,
        initialMessage: initialMessage.trim() || undefined,
        senderChannel
      });

      const conversationId = res.data?.conversationId || res.data?.conversation?._id;
      if (conversationId) {
        toast.success("Discussion WhatsApp ouverte avec succès !");
        onChatCreated(conversationId);
        onClose();
      } else {
        toast.error("Impossible de créer la discussion.");
      }
    } catch (err: any) {
      console.error("[NewChat Error]:", err);
      toast.error(err.response?.data?.error || "Erreur lors de la création de la discussion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e9edef] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header WhatsApp Style */}
        <div className="px-6 py-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
              <MessageCircle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Nouvelle discussion WhatsApp</h3>
              <p className="text-xs text-[#8696a0]">Initier un chat direct avec n'importe quel numéro</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8696a0] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Channel Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center justify-between">
              <span>Canal d'expédition</span>
              <span className="text-[10px] text-[#00a884] font-normal">Officiel WhatsApp</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSenderChannel("merchant")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  senderChannel === "merchant"
                    ? "bg-[#00a884]/10 border-[#00a884] text-white shadow-sm"
                    : "bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:border-[#3b4a54]"
                }`}
              >
                <Store size={18} className={senderChannel === "merchant" ? "text-[#00a884]" : "text-[#8696a0]"} />
                <div>
                  <div className="text-xs font-bold text-white">Ma Boutique</div>
                  <div className="text-[10px] text-[#8696a0]">WhatsApp Connecté</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSenderChannel("system")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  senderChannel === "system"
                    ? "bg-[#00a884]/10 border-[#00a884] text-white shadow-sm"
                    : "bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:border-[#3b4a54]"
                }`}
              >
                <ShieldCheck size={18} className={senderChannel === "system" ? "text-[#00a884]" : "text-[#8696a0]"} />
                <div>
                  <div className="text-xs font-bold text-white">Numéro Système</div>
                  <div className="text-[10px] text-[#8696a0]">0505111157 (Admin)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Phone & Country */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={13} />
              <span>Numéro WhatsApp du contact *</span>
            </label>
            <div className="flex gap-2">
              <CountrySelector
                selected={selectedCountry}
                onSelect={(country) => setSelectedCountry(country)}
                className="bg-[#202c33] border-[#2a3942] h-12"
              />
              <div className="relative flex-1">
                <input
                  type="tel"
                  value={rawPhone}
                  onChange={(e) => setRawPhone(e.target.value)}
                  placeholder="Ex: 07 08 09 10 11"
                  required
                  autoFocus
                  className="w-full h-12 px-4 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-[#8696a0] text-sm focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Format détecté : <span className="font-mono text-[#00a884]">{selectedCountry.dialCode} {rawPhone || "..."}</span>
            </p>
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} />
              <span>Nom du contact (optionnel)</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: M. Jean Kouassi"
              className="w-full h-11 px-4 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-[#8696a0] text-sm focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all"
            />
          </div>

          {/* Initial Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Send size={13} />
                <span>Premier message (optionnel)</span>
              </span>
              <span className="text-[10px] text-[#8696a0]">Envoyé immédiatement</span>
            </label>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={3}
              placeholder="Ex: Bonjour ! Suite à votre demande sur notre boutique, voici les informations..."
              className="w-full p-3.5 bg-[#202c33] border border-[#2a3942] rounded-xl text-white placeholder-[#8696a0] text-sm focus:outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#2a3942]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#2a3942] bg-transparent text-sm font-medium text-[#8696a0] hover:text-white hover:bg-white/5 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rawPhone.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#00a884]/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm font-bold text-[#111b21] flex items-center gap-2 shadow-lg shadow-[#00a884]/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Ouverture...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Démarrer la discussion</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
