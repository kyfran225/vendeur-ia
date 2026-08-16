import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Send, Sparkles, AlertCircle, MessageSquare, Lightbulb, Bug, Handshake, CheckCircle2, X } from "lucide-react";
import { useCopilotStore } from "@/stores/copilotStore";
import { useAuthStore } from "@/stores/authStore";

const CATEGORIES = [
  { id: "founder_message", label: "Message direct au Fondateur", icon: MessageSquare, desc: "Poser une question ou échanger avec l'équipe dirigeante" },
  { id: "suggestion", label: "Idée d'amélioration / Suggestion", icon: Lightbulb, desc: "Proposer une nouvelle fonctionnalité pour votre boutique" },
  { id: "bug", label: "Signaler un problème ou blocage", icon: Bug, desc: "Aide rapide en cas de dysfonctionnement technique" },
  { id: "partnership", label: "Partenariat & Distribution", icon: Handshake, desc: "Opportunités commerciales et collaborations" }
];

export function FounderContactModal() {
  const { isFounderModalOpen, setFounderModalOpen, dispatchToFounder } = useCopilotStore();
  const { user } = useAuthStore();

  const [category, setCategory] = useState("founder_message");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isFounderModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const ok = await dispatchToFounder({
      subject: subject.trim() || `Message de ${user?.displayName || "Commerçant"}`,
      message: message.trim(),
      category,
      priority: category === "bug" ? "urgent" : "high",
      pageRoute: window.location.pathname
    });

    setIsSending(false);
    if (ok) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setSubject("");
        setMessage("");
        setFounderModalOpen(false);
      }, 2500);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-vendeur-coal border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-vendeur-slate/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Ligne Directe avec les Fondateurs</h3>
              <p className="text-xs text-white/50">Votre avis et vos besoins construisent Vendeur IA</p>
            </div>
          </div>
          <button
            onClick={() => setFounderModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center text-vendeur-emerald animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-xl font-bold text-white">Message transmis au bureau des Fondateurs !</h4>
            <p className="text-sm text-white/70 max-w-md">
              Merci pour votre confiance. Notre Lead & l'équipe fondatrice traitent votre demande avec la plus haute priorité.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                Objet de votre demande
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-vendeur-emerald/10 border-vendeur-emerald text-white shadow-sm"
                          : "bg-white/[0.02] border-white/5 text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Icon size={18} className={`shrink-0 mt-0.5 ${isSelected ? "text-vendeur-emerald" : "text-white/40"}`} />
                      <div>
                        <p className="text-xs font-bold">{cat.label}</p>
                        <p className="text-[10px] text-white/40 leading-tight mt-0.5">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Titre court (Optionnel)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Idée pour l'encaissement Wave ou question de stock"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-vendeur-emerald transition-colors"
              />
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Votre Message <span className="text-vendeur-emerald">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Expliquez-nous en toute franchise votre idée, le blocage rencontré ou ce dont vous avez besoin pour vendre encore plus..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-vendeur-emerald transition-colors resize-none"
              />
            </div>

            {/* Founder Note Alert */}
            <div className="p-3 rounded-xl bg-vendeur-emerald/5 border border-vendeur-emerald/15 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-vendeur-emerald shrink-0 mt-0.5" />
              <p className="text-xs text-white/60">
                Ce message sera envoyé directement en notification prioritaire sur le tableau de bord de l'équipe fondatrice.
              </p>
            </div>

            {/* Footer Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFounderModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white/60 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className="px-6 py-2.5 rounded-xl bg-vendeur-emerald text-vendeur-coal font-bold text-xs flex items-center gap-2 hover:bg-vendeur-emerald/90 disabled:opacity-50 transition-all shadow-lg shadow-vendeur-emerald/20"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-vendeur-coal border-t-transparent rounded-full animate-spin" />
                    Transmission en cours...
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Envoyer au Fondateur
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
