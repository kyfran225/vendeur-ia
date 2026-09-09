import React, { useState, useMemo } from "react";
import {
  X,
  ShoppingBag,
  Send,
  Search,
  Check,
  Sparkles,
  Package,
  CreditCard,
  ExternalLink,
  Tag,
  Loader2,
  Zap,
  Flame,
  Info,
  Copy,
  Plus
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardSenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  customerName?: string;
  customerPhone?: string;
  customerAvatarUrl?: string | null;
  customerPlatform?: string;
  currency?: string;
}

const ACTION_TYPES = [
  {
    id: "order",
    label: "🛒 Bouton Commander en 1 clic",
    description: "Lien direct vers la boutique avec panier pré-rempli pour ce client",
    badge: "Recommandé",
    color: "from-emerald-500 to-teal-600"
  },
  {
    id: "pay",
    label: "💳 Bouton Payer maintenant (Wave / OM)",
    description: "Invite au paiement direct en ligne ou à la livraison",
    badge: "Paiement Rapide",
    color: "from-sky-500 to-indigo-600"
  },
  {
    id: "details",
    label: "🔎 Fiche & Détails complets",
    description: "Ouvre la vitrine pour voir toutes les photos et variantes",
    badge: "Information",
    color: "from-amber-500 to-orange-600"
  },
  {
    id: "promo",
    label: "🔥 Offre Promo Flash",
    description: "Met en avant une réduction ou un stock limité d'urgence",
    badge: "Conversion Boost",
    color: "from-rose-500 to-pink-600"
  }
];

export function ProductCardSenderModal({
  isOpen,
  onClose,
  conversationId,
  customerName = "Client",
  customerPhone,
  customerAvatarUrl,
  customerPlatform = "whatsapp",
  currency = "XOF"
}: ProductCardSenderModalProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string>("order");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Fetch Merchant Catalog Products
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/products");
      return res.data;
    },
    enabled: isOpen
  });

  const products = useMemo(() => {
    return Array.isArray(productsData) ? productsData : productsData?.products || [];
  }, [productsData]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Set default selected product
  React.useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0]._id);
    }
  }, [products, selectedProductId]);

  const selectedProduct = useMemo(() => {
    return products.find((p: any) => p._id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const activePrice = useMemo(() => {
    if (customPrice && !isNaN(Number(customPrice)) && Number(customPrice) > 0) {
      return Number(customPrice);
    }
    return selectedProduct?.price || 0;
  }, [customPrice, selectedProduct]);

  const sendCardMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Veuillez sélectionner un article");
      const res = await apiClient.post(`/api/commerce/conversations/${conversationId}/send-product-card`, {
        productId: selectedProduct._id,
        actionType,
        customText: customText.trim() || undefined,
        customPrice: customPrice ? Number(customPrice) : undefined
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Fiche article WhatsApp envoyée avec succès ! ✨");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi de la carte.");
    }
  });

  if (!isOpen) return null;

  const handleCopyCardText = () => {
    if (!selectedProduct) return;
    const lines = [
      `🛍️ *FICHE ARTICLE : ${selectedProduct.name.toUpperCase()}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *Prix* : *${activePrice.toLocaleString()} ${selectedProduct.currency || currency}*`,
      selectedProduct.category ? `🏷️ *Catégorie* : ${selectedProduct.category}` : "",
      selectedProduct.stock > 0 ? `✅ *Disponibilité* : En stock (${selectedProduct.stock} dispo)` : `⚡ *Disponibilité* : Commande directe`,
      selectedProduct.description ? `\n📝 *Détails* :\n${selectedProduct.description}` : "",
      customText.trim() ? `\n✨ *Note du vendeur* : ${customText.trim()}` : "",
      `\n👉 *Pour commander immédiatement en 1 clic :*`,
      `🛒 [Lien boutique direct]`
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Texte de la fiche copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#111b21] text-slate-900 dark:text-white border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <header className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202c33] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-[#00a884] flex items-center justify-center shrink-0 shadow-sm">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Envoyer un article WhatsApp
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
                Partagez un article avec photo, prix et lien direct pour <span className="font-bold text-slate-900 dark:text-white">{customerName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 dark:text-white/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          
          {/* Left Column: Product Selector & Configuration (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Search Catalog */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/50">
                1. Sélectionner l'article du catalogue
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, catégorie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-slate-100 dark:bg-[#202c33] border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
                />
              </div>

              {/* Product Horizontal Grid / List */}
              {loadingProducts ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-white/40">
                  <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                  Chargement des articles...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-center text-xs text-slate-500 dark:text-white/40">
                  Aucun article trouvé. Ajoutez des articles dans votre catalogue.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 no-scrollbar">
                  {filteredProducts.map((p: any) => {
                    const isSelected = selectedProduct?._id === p._id;
                    const img = p.images?.[0] || p.imageUrl;
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p._id);
                          if (customPrice) setCustomPrice("");
                        }}
                        className={cn(
                          "p-2 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative group",
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md"
                            : "bg-slate-50 dark:bg-[#202c33] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                        <div className="h-20 w-full rounded-xl bg-slate-200 dark:bg-black/30 overflow-hidden shrink-0">
                          {img ? (
                            <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-white/20">
                              <Package size={24} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{p.name}</p>
                          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {p.price?.toLocaleString()} {p.currency || currency}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Choose Action CTA */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/50">
                2. Type d'action &amp; Bouton WhatsApp
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ACTION_TYPES.map((act) => {
                  const isSelected = actionType === act.id;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActionType(act.id)}
                      className={cn(
                        "p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer",
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                          : "bg-slate-50 dark:bg-[#202c33] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{act.label}</span>
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/60">
                          {act.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 leading-tight">
                        {act.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Customizations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/50 mb-1">
                  Prix personnalisé (optionnel)
                </label>
                <input
                  type="number"
                  placeholder={`Ex: ${selectedProduct?.price || 15000}`}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full h-10 bg-slate-100 dark:bg-[#202c33] border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/50 mb-1">
                  Note ou offre promo (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: -10% si commandé maintenant !"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full h-10 bg-slate-100 dark:bg-[#202c33] border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Live WhatsApp Realistic Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 lg:bg-slate-100 lg:dark:bg-[#0c1317] p-0 lg:p-5 lg:rounded-3xl lg:border lg:border-slate-200 lg:dark:border-white/5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-500" />
                  Aperçu WhatsApp
                </span>
              </div>

              {/* Realistic WhatsApp Chat Bubble Mockup */}
              {selectedProduct ? (
                <div className="bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-[#e9edef] rounded-2xl rounded-tr-none p-3 shadow-md space-y-2.5 text-xs select-none w-full sm:max-w-sm sm:ml-auto border border-emerald-500/20">
                  
                  {/* Image Card Header */}
                  {(selectedProduct.images?.[0] || selectedProduct.imageUrl) && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/20 shadow-inner">
                      <img
                        src={selectedProduct.images?.[0] || selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="font-black text-sm uppercase tracking-tight text-slate-950 dark:text-white">
                      🛍️ {selectedProduct.name}
                    </p>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-sm font-black text-emerald-800 dark:text-emerald-200 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-lg">
                        💰 {activePrice.toLocaleString()} {selectedProduct.currency || currency}
                      </span>
                      <span className="text-[10px] font-bold opacity-80">
                        {selectedProduct.stock > 0 ? "✅ En Stock" : "⚡ Dispo"}
                      </span>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <p className="text-[11px] opacity-90 line-clamp-2 leading-tight">
                      {selectedProduct.description}
                    </p>
                  )}

                  {customText.trim() && (
                    <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 bg-amber-500/20 px-2 py-1 rounded-lg">
                      ✨ {customText.trim()}
                    </p>
                  )}

                  {/* Interactive Button Preview inside WhatsApp */}
                  <div className="pt-2 border-t border-emerald-600/20 dark:border-white/10 space-y-1.5">
                    <div className="h-9 w-full bg-white dark:bg-[#111b21] hover:bg-slate-50 text-emerald-600 dark:text-[#00a884] font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-sm border border-emerald-500/30">
                      <span>{actionType === "order" ? "🛒 Commander en 1 clic" : actionType === "pay" ? "💳 Payer Wave / OM" : "🔎 Voir les détails"}</span>
                      <ExternalLink size={12} />
                    </div>
                  </div>

                  <div className="flex justify-end text-[9px] opacity-60 font-bold">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &bull; Envoyé
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Sélectionnez un article pour voir l'aperçu.
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => sendCardMutation.mutate()}
                disabled={!selectedProduct || sendCardMutation.isPending}
                className="w-full h-13 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {sendCardMutation.isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>Envoyer l'article sur WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyCardText}
                className="w-full h-10 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? "Texte copié !" : "Copier le texte de l'article"}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
