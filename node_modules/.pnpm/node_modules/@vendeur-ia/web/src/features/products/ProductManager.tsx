import React, { useState } from "react";
import { Package, Plus, Sparkles, Trash2, Edit } from "lucide-react";

export function ProductManager() {
  const [products] = useState([
    { id: 1, name: "Robe Ankara Élégance", price: 15000, stock: 12, category: "Mode" },
    { id: 2, name: "Sandales Traditionnelles", price: 8500, stock: 5, category: "Accessoires" }
  ]);

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Catalogue IA</h1>
          <p className="text-white/40">Gérez vos articles et laissez l'IA créer vos fiches.</p>
        </div>
        <button className="flex items-center gap-2 bg-vendeur-emerald text-vendeur-coal px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg">
          <Plus size={18} /> Ajouter Produit
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-vendeur-coal border border-white/10 rounded-3xl overflow-hidden group">
            <div className="aspect-square bg-white/5 flex items-center justify-center relative">
              <Package size={48} className="text-white/10" />
              <div className="absolute top-4 right-4 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5">
                <Sparkles size={12} className="text-sky-400" />
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">IA Ready</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-lg">{p.name}</h3>
                  <p className="text-sm text-white/40">{p.category}</p>
                </div>
                <p className="font-black text-vendeur-emerald">{p.price.toLocaleString()} FCFA</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-xs font-bold text-white/60">Stock: <span className="text-white">{p.stock}</span></p>
                <div className="flex gap-2">
                  <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><Edit size={16} /></button>
                  <button className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
