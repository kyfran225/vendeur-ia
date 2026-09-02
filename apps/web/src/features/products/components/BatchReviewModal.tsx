import React, { useState } from "react";
import { Check, Edit3, Trash2, Plus, Sparkles, Layers, PackageCheck, ShoppingBag, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

export interface BatchItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description: string;
  tags?: string[];
  image: string;
  selected: boolean;
}

interface BatchReviewModalProps {
  image: string;
  rawItems: any[];
  boutiqueName: string;
  currency?: string;
  onConfirm: (confirmedItems: any[]) => void;
  onCancel: () => void;
}

export function BatchReviewModal({ image, rawItems, boutiqueName, currency = "XOF", onConfirm, onCancel }: BatchReviewModalProps) {
  const [items, setItems] = useState<BatchItem[]>(() =>
    rawItems.map((item, index) => ({
      id: `item-${index}-${Date.now()}`,
      name: item.name || `Article #${index + 1}`,
      price: typeof item.price === "number" ? item.price : 0,
      stock: item.stock || 1,
      category: item.category || "fashion",
      description: item.description || "",
      tags: item.tags || [],
      image,
      selected: true,
    }))
  );

  const [activeTabId, setActiveTabId] = useState<string>(items[0]?.id || "");

  const selectedCount = items.filter((i) => i.selected).length;

  const toggleSelect = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const updateItem = (id: string, field: keyof BatchItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    if (activeTabId === id && next.length > 0) {
      setActiveTabId(next[0].id);
    }
  };

  const addNewItem = () => {
    const newItem: BatchItem = {
      id: `item-${Date.now()}`,
      name: "Nouvel article",
      price: 5000,
      stock: 1,
      category: "fashion",
      description: "Description optimisée réseaux sociaux",
      image,
      selected: true,
    };
    setItems((prev) => [...prev, newItem]);
    setActiveTabId(newItem.id);
  };

  const handleSaveAll = () => {
    const toSave = items.filter((i) => i.selected);
    if (toSave.length === 0) {
      toast.error("Veuillez sélectionner au moins un produit.");
      return;
    }
    onConfirm(toSave);
  };

  const activeItem = items.find((i) => i.id === activeTabId) || items[0];

  return (
    <div className="fixed inset-0 z-[110] bg-zinc-950 flex flex-col animate-in fade-in duration-300 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider truncate">
                Scanner Multi-Articles
              </h2>
              <span className="text-[10px] sm:text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 whitespace-nowrap">
                IA Batch ({items.length} détecté{items.length > 1 ? "s" : ""})
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-white/60 truncate">
              Vérifiez les prix et descriptions avant mise en ligne.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white shrink-0 transition-colors"
          title="Annuler et fermer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Mobile Horizontal Articles Tab Strip */}
      <div className="md:hidden border-b border-white/10 bg-zinc-900/60 px-3 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-white/50 whitespace-nowrap">
          Articles ({selectedCount}/{items.length}):
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {items.map((item, idx) => {
            const isActive = item.id === activeTabId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTabId(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-emerald-500 text-black border-emerald-400 shadow-md font-black"
                    : item.selected
                    ? "bg-white/10 border-white/20 text-white/90 hover:bg-white/15 font-semibold"
                    : "bg-white/5 border-white/10 text-white/40 line-through font-medium"
                }`}
              >
                <span>#{idx + 1}</span>
                <span className="max-w-[110px] truncate">{item.name || "Sans nom"}</span>
                {item.price > 0 && (
                  <span className={`text-[10px] opacity-80 ${isActive ? "text-black" : "text-emerald-400"}`}>
                    • {item.price.toLocaleString("fr-FR")}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={addNewItem}
          className="h-7 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1 shrink-0 hover:bg-emerald-500/20 whitespace-nowrap"
        >
          <Plus size={13} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: Detected items list (Desktop) */}
        <div className="hidden md:flex w-80 border-r border-white/10 bg-zinc-900/30 flex-col overflow-hidden shrink-0">
          <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              Articles Détectés ({selectedCount}/{items.length})
            </span>
            <button
              onClick={addNewItem}
              className="text-xs text-emerald-400 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.map((item, idx) => {
              const isActive = item.id === activeTabId;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTabId(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-lg"
                      : item.selected
                      ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                      : "bg-white/[0.02] border-white/5 text-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(item.id);
                      }}
                      className="h-4 w-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500 bg-black accent-emerald-500 cursor-pointer"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">
                        {idx + 1}. {item.name || "Sans nom"}
                      </p>
                      <p className="text-[10px] text-emerald-400 font-black">
                        {item.price > 0 ? `${item.price.toLocaleString("fr-FR")} ${currency}` : "Prix non défini"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="text-white/30 hover:text-red-400 p-1 transition-colors"
                    title="Supprimer l'article"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Section: Focused Item Details Editor */}
        {activeItem ? (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-5 bg-zinc-950/50">
            {/* Context Badge */}
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-black shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                    Proposition IA pour cet article
                  </h3>
                  <p className="text-[11px] sm:text-xs text-white/70 truncate">
                    Vendeur IA a généré ces données. Vous avez le contrôle total.
                  </p>
                </div>
              </div>

              {/* Quick actions for active item on mobile/desktop */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleSelect(activeItem.id)}
                  className={`text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                    activeItem.selected
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-white/5 text-white/40 border-white/10"
                  }`}
                >
                  {activeItem.selected ? "Inclus ✓" : "Exclu"}
                </button>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(activeItem.id)}
                    className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                    title="Supprimer cet article"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Editor Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Product Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/60">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={activeItem.name}
                  onChange={(e) => updateItem(activeItem.id, "name", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="ex: Robe Fleurie d'Été"
                />
              </div>

              {/* Price Dynamic Currency */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Prix de Vente ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={activeItem.price || ""}
                    onChange={(e) => updateItem(activeItem.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-emerald-400 font-black focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="15000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400/60">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/60">
                  Stock initial
                </label>
                <input
                  type="number"
                  value={activeItem.stock}
                  onChange={(e) => updateItem(activeItem.id, "stock", parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Category */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/60">
                  Catégorie
                </label>
                <select
                  value={activeItem.category}
                  onChange={(e) => updateItem(activeItem.id, "category", e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  <option value="fashion">Mode & Vêtements</option>
                  <option value="beauty">Beauté & Cosmétiques</option>
                  <option value="electronics">Électronique & High-Tech</option>
                  <option value="food">Nourriture & Restaurants</option>
                  <option value="artisan">Artisanat</option>
                  <option value="home">Maison & Déco</option>
                  <option value="grocery">Épicerie</option>
                  <option value="services">Services</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            {/* Social Commerce Description */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-400" />
                  Description Vendeuse (Réseaux Sociaux / WhatsApp)
                </label>
              </div>
              <textarea
                rows={3}
                value={activeItem.description}
                onChange={(e) => updateItem(activeItem.id, "description", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-white/90 focus:border-emerald-500 focus:outline-none leading-relaxed transition-colors"
                placeholder="Description rédigée par Vendeur IA..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40 font-medium p-4">
            Aucun article sélectionné
          </div>
        )}
      </div>

      {/* Footer / Confirm Actions */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-white/10 bg-zinc-950/95 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="text-xs text-white/60 text-center sm:text-left hidden sm:block">
          <span className="font-bold text-white">{selectedCount} article{selectedCount > 1 ? "s" : ""}</span> prêt{selectedCount > 1 ? "s" : ""} à être ajouté{selectedCount > 1 ? "s" : ""} au catalogue de <strong className="text-emerald-400">{boutiqueName}</strong>.
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 sm:py-3 rounded-xl border border-white/10 text-white/60 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex-1 sm:flex-none px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
          >
            <PackageCheck size={16} className="shrink-0" />
            <span className="truncate">Tout Valider & Enregistrer ({selectedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
