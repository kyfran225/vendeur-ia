import React from "react";
import { Store, Phone, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { commerceCategories } from "@vendeur-ia/core";

export function BusinessForm({ onNext }: { onNext: () => void }) {
  const { draft, setDraft } = useOnboardingStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const updateChannel = (provider: string, number: string) => {
    const existing = draft.paymentChannels.find(p => p.provider === provider);
    let newChannels = [...draft.paymentChannels];
    if (existing) {
      if (!number) newChannels = newChannels.filter(p => p.provider !== provider);
      else existing.number = number;
    } else if (number) {
      newChannels.push({ provider, label: provider.toUpperCase(), number });
    }
    setDraft({ paymentChannels: newChannels });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left max-w-xl mx-auto bg-vendeur-coal p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-lg">
          <Store size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Votre Boutique</h2>
          <p className="text-xs text-white/40">Configurez votre assistant en 30 secondes.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom du commerce</label>
          <input
            required
            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none transition-all"
            value={draft.businessName}
            onChange={e => setDraft({ businessName: e.target.value })}
            placeholder="Aicha Mode, Koffi Grill..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Catégorie</label>
            <select
              className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none transition-all appearance-none"
              value={draft.category}
              onChange={e => setDraft({ category: e.target.value })}
            >
              {commerceCategories.map(c => (
                <option key={c} value={c} className="bg-vendeur-coal">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">WhatsApp Business</label>
            <input
              required
              className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none transition-all"
              value={draft.whatsappNumber}
              onChange={e => setDraft({ whatsappNumber: e.target.value })}
              placeholder="225..."
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-white/5">
          <label className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald ml-1">Canaux de paiement (Reçu par les clients)</label>
          <div className="grid gap-3">
            {["wave", "orange", "mtn"].map(provider => (
              <div key={provider} className="flex items-center gap-3">
                <div className="w-16 text-[10px] font-black uppercase text-white/30">{provider}</div>
                <input
                  className="flex-1 h-10 bg-black/40 border border-white/5 rounded-lg px-3 text-sm text-white focus:border-vendeur-emerald outline-none transition-all"
                  placeholder="Numéro..."
                  value={draft.paymentChannels.find(p => p.provider === provider)?.number || ""}
                  onChange={e => updateChannel(provider, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!draft.businessName || !draft.whatsappNumber}
        className="w-full h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 mt-6"
      >
        Tester mon IA <ChevronRight size={20} />
      </button>
    </form>
  );
}
