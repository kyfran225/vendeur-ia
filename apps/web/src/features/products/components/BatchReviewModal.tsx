import React, { useState } from "react";
import { Check, Edit3, Trash2, Plus, Sparkles, Layers, PackageCheck, ShoppingBag, ArrowRight } from "lucide-react";
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
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-white/10 bg-black/40 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Scanner Multi-Articles
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                IA Batch ({items.length} détecté{items.length > 1 ? "s" : ""})
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Vérifiez, modifiez le prix ou la description commerciale avant mise en ligne.
            </p>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10"
        >
          Annuler
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar: Detected items list */}
        <div className="w-full md:w-80 border-r border-white/10 bg-black/20 flex flex-col overflow-hidden shrink-0">
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
                      className="h-4 w-4 rounded border-white/20 text-emerald-500 focus:ring-emerald-500 bg-black"
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
                    className="text-white/20 hover:text-red-400 p-1"
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-black/40">
            {/* Context Badge */}
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-black font-black">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Proposition IA pour cet article
                  </h3>
                  <p className="text-xs text-white/70">
                    L'IA a généré ces données. Vous avez le contrôle total pour les modifier.
                  </p>
                </div>
              </div>
            </div>

            {/* Editor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={activeItem.name}
                  onChange={(e) => updateItem(activeItem.id, "name", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
                  placeholder="ex: Robe Fleurie d'Été"
                />
              </div>

              {/* Price Dynamic Currency */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Prix de Vente ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={activeItem.price || ""}
                    onChange={(e) => updateItem(activeItem.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-emerald-500/40 rounded-xl px-4 py-3 text-sm text-emerald-400 font-black focus:border-emerald-500 focus:outline-none"
                    placeholder="15000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400/60">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Stock */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Stock initial
                </label>
                <input
                  type="number"
                  value={activeItem.stock}
                  onChange={(e) => updateItem(activeItem.id, "stock", parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
                  Catégorie
                </label>
                <select
                  value={activeItem.category}
                  onChange={(e) => updateItem(activeItem.id, "category", e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold focus:border-emerald-500 focus:outline-none"
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
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1">
                  <Sparkles size={12} className="text-emerald-400" />
                  Description Vendeuse (Réseaux Sociaux / WhatsApp)
                </label>
              </div>
              <textarea
                rows={4}
                value={activeItem.description}
                onChange={(e) => updateItem(activeItem.id, "description", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/90 focus:border-emerald-500 focus:outline-none leading-relaxed"
                placeholder="Description rédigée par l'IA..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40 font-medium">
            Aucun article sélectionné
          </div>
        )}
      </div>

      {/* Footer / Confirm Actions */}
      <div className="p-4 sm:p-6 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="text-xs text-white/60 text-center sm:text-left">
          <span className="font-bold text-white">{selectedCount} article{selectedCount > 1 ? "s" : ""}</span> prêt{selectedCount > 1 ? "s" : ""} à être ajouté{selectedCount > 1 ? "s" : ""} au catalogue de <strong className="text-emerald-400">{boutiqueName}</strong>.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-white/10 text-white/60 font-bold text-xs uppercase tracking-widest hover:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <PackageCheck size={16} />
            Tout Valider & Enregistrer ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
