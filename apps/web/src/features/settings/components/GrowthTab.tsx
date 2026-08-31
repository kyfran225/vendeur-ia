import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Gift,
  Target,
  ShoppingCart,
  Zap,
  Save,
  Loader2,
  Sparkles,
  ChevronRight,
  Trophy,
  Copy,
  Check,
  Share2,
  Flame,
  Award,
  Users,
  Coins
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function GrowthTab({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const [copiedFeed, setCopiedFeed] = useState(false);

  const [localSettings, setLocalSettings] = useState(merchant?.loyaltySettings || {
    enabled: false,
    pointsPerOrder: 10,
    threshold: 50,
    rewardDescription: "la livraison express offerte sur votre commande"
  });

  useEffect(() => {
    if (merchant?.loyaltySettings) {
      setLocalSettings({
        enabled: !!merchant.loyaltySettings.enabled,
        pointsPerOrder: merchant.loyaltySettings.pointsPerOrder || 10,
        threshold: merchant.loyaltySettings.threshold || 50,
        rewardDescription: merchant.loyaltySettings.rewardDescription || "la livraison express offerte sur votre commande"
      });
    }
  }, [merchant]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/api/commerce/merchant", {
        loyaltySettings: localSettings
      });
    },
    onSuccess: () => {
      toast.success("Programme de croissance et fidélité mis à jour ! 🚀");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour des paramètres de fidélité.");
    }
  });

  // Dynamic Catalog Feed URL for Meta / Facebook Shop / Instagram / TikTok Ads
  const catalogFeedUrl = `${window.location.origin}/api/commerce/storefront/${merchant?.slug || merchant?._id}/feed.xml`;

  const handleCopyFeedUrl = () => {
    navigator.clipboard.writeText(catalogFeedUrl);
    setCopiedFeed(true);
    toast.success("Lien du flux catalogue copié ! À coller dans Meta Commerce Manager / TikTok Ads.");
    setTimeout(() => setCopiedFeed(false), 2500);
  };

  const currency = merchant?.currency || "XOF";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 pb-16">
      
      {/* 1. PROGRAMME DE FIDELITE & RECOMPENSES VIP */}
      <section
        id="loyalty"
        className={cn(
          "bg-vendeur-coal border p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-2xl transition-all space-y-6 scroll-mt-24",
          localSettings.enabled ? "border-vendeur-emerald/40 bg-vendeur-emerald/[0.015]" : "border-white/10"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center border transition-all shrink-0 shadow-lg",
              localSettings.enabled
                ? "bg-vendeur-emerald text-vendeur-coal border-vendeur-emerald"
                : "bg-white/5 text-white/40 border-white/5"
            )}>
              <Trophy size={26} className="sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">
                  Programme de Fidélité IA
                </h2>
                {localSettings.enabled && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-vendeur-emerald/15 text-vendeur-emerald border border-vendeur-emerald/30 shrink-0">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 font-medium leading-relaxed">
                Vendeur IA attribue des points après chaque commande et récompense automatiquement vos clients réguliers.
              </p>
            </div>
          </div>

          {/* iOS-Style Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-center bg-black/40 px-3.5 py-2 rounded-2xl border border-white/10 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/60">
              {localSettings.enabled ? "Activé" : "Désactivé"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={(e) => setLocalSettings({ ...localSettings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vendeur-emerald"></div>
            </label>
          </div>
        </div>

        {localSettings.enabled && (
          <div className="space-y-6 pt-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Seuil de Points */}
              <div className="space-y-2 p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/5">
                <label className="text-[11px] font-black uppercase tracking-wider text-vendeur-emerald flex items-center gap-2">
                  <Target size={14} className="shrink-0" />
                  <span>Seuil de déclenchement (Points)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    step="5"
                    className="w-full h-12 sm:h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-lg font-black text-white focus:border-vendeur-emerald outline-none transition-all font-mono"
                    value={localSettings.threshold}
                    onChange={(e) => setLocalSettings({ ...localSettings, threshold: parseInt(e.target.value) || 0 })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/40 uppercase tracking-wider">
                    Points requis
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-medium">
                  💡 1 commande = 10 points. Avec un seuil à 50 points, la récompense se débloque à la 5ème commande.
                </p>
              </div>

              {/* Récompense Offerte */}
              <div className="space-y-2 p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/5">
                <label className="text-[11px] font-black uppercase tracking-wider text-vendeur-emerald flex items-center gap-2">
                  <Gift size={14} className="shrink-0" />
                  <span>Avantage ou Cadeau offert</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: la livraison offerte, un échantillon offert, -15% sur la commande"
                  className="w-full h-12 sm:h-14 bg-white/5 border border-white/10 rounded-xl px-4 text-xs sm:text-sm font-medium text-white focus:border-vendeur-emerald outline-none transition-all"
                  value={localSettings.rewardDescription}
                  onChange={(e) => setLocalSettings({ ...localSettings, rewardDescription: e.target.value })}
                />
                <p className="text-[10px] text-white/40 font-medium">
                  Texte exact mentionné par Vendeur IA lors de la conversation WhatsApp avec le client VIP.
                </p>
              </div>
            </div>

            {/* Simulation Discours IA */}
            <div className="p-4 sm:p-5 bg-vendeur-emerald/5 border border-vendeur-emerald/20 rounded-2xl flex items-start gap-3.5">
              <Sparkles className="text-vendeur-emerald shrink-0 mt-0.5" size={20} />
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-vendeur-emerald">
                  Discours IA en direct sur WhatsApp
                </h4>
                <p className="text-xs text-white/80 leading-relaxed italic bg-black/30 p-3 rounded-xl border border-white/5 mt-1 font-medium">
                  « Félicitations ! Grâce à vos achats réguliers, vous avez atteint <strong>{localSettings.threshold} points</strong> de fidélité ⭐. Le responsable m'a autorisé à vous offrir <strong>{localSettings.rewardDescription || 'un cadeau exclusif'}</strong> sur cette commande ! »
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto h-12 sm:h-14 min-h-[48px] px-8 bg-white hover:bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Enregistrer la Fidélité</span>
          </button>
        </div>
      </section>

      {/* 2. CANAUX META & FACEBOOK / INSTAGRAM SHOP */}
      <section
        id="facebook"
        className="bg-vendeur-coal border border-white/10 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-2xl space-y-5 scroll-mt-24"
      >
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-lg">
            <Share2 size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">
                Catalogue Meta (Facebook &amp; Instagram Shop)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                Croissance Ads
              </span>
            </div>
            <p className="text-xs text-white/50 font-medium leading-relaxed mt-0.5">
              Synchronisez automatiquement l'ensemble de vos articles avec Meta Commerce Manager pour taguer vos produits sur Instagram et lancer des campagnes publicitaires Facebook Ads.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-black/30 border border-white/5 space-y-3">
          <label className="text-[11px] font-black uppercase tracking-wider text-white/70 flex items-center gap-2">
            <span>URL de Synchronisation Flux Catalogue (XML / RSS)</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              readOnly
              value={catalogFeedUrl}
              className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white/70 font-mono select-all outline-none"
            />
            <button
              onClick={handleCopyFeedUrl}
              className="h-12 px-5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              {copiedFeed ? <Check size={16} className="text-vendeur-emerald" /> : <Copy size={16} />}
              <span>{copiedFeed ? "Copié !" : "Copier le lien"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-white/40 font-medium">
            <span>📌</span>
            <span>Mise à jour en temps réel selon les stocks et prix de votre boutique Vendeur IA.</span>
          </div>
        </div>
      </section>

      {/* 3. RELANCE AUTOMATIQUE DES PANIERS SUR WHATSAPP */}
      <section className="bg-vendeur-coal border border-white/10 p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="h-12 w-12 sm:h-14 sm:w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0 shadow-lg">
            <ShoppingCart size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                Relance des Paniers Abandonnés
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                Automatisé IA
              </span>
            </div>
            <p className="text-xs text-white/50 font-medium leading-relaxed mt-0.5">
              Quand un acheteur sélectionne des articles dans votre catalogue sans finaliser le paiement, Vendeur IA lui envoie une relance WhatsApp bienveillante avec un récapitulatif pour sauver la vente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-vendeur-emerald/10 flex items-center justify-center text-vendeur-emerald shrink-0">
              <Flame size={16} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-white/80">+25% de conversion moyenne</p>
              <p className="text-[10px] text-white/40">Recouvre les ventes hésitantes sur WhatsApp.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
              <Award size={16} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-white/80">Lien de commande direct</p>
              <p className="text-[10px] text-white/40">Paiement Mobile Money en 1 clic pour le client.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. METRIQUES DE CROISSANCE & PERFORMANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <StatCard
          label="Points Fidélité Détenus"
          value={`${merchant?.metrics?.totalPoints || 0} pts`}
          subtitle="Cumulés par vos clients"
          icon={<Coins className="text-amber-400" size={20} />}
        />
        <StatCard
          label="Clients Éligibles VIP"
          value={merchant?.metrics?.loyalCustomersCount || 0}
          subtitle="Clients récurrents qualifiés"
          icon={<Users className="text-vendeur-emerald" size={20} />}
        />
        <StatCard
          label="Chiffre d'Affaires IA"
          value={`${(merchant?.metrics?.aiRevenue || 0).toLocaleString()} ${currency}`}
          subtitle="Encaissé via l'agent WhatsApp"
          icon={<TrendingUp className="text-sky-400" size={20} />}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, subtitle, icon }: { label: string; value: string | number; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="bg-vendeur-coal border border-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 hover:border-white/20 transition-all shadow-xl">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-wider text-white/30">KPI</span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-white/40">{label}</p>
        <p className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{value}</p>
        <p className="text-[10px] text-white/30 font-medium mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
