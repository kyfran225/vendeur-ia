import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle,
  ShoppingCart,
  ShoppingBag,
  Search,
  ChevronRight,
  Star,
  Package,
  Zap,
  Clock,
  ShieldCheck,
  Globe,
  Sparkles,
  ChevronLeft,
  X
} from "lucide-react";
import { WebChatWidget } from "./components/WebChatWidget";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PublicShop() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-shop", merchantId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/public/shop/${merchantId}`);
      return res.data;
    },
    enabled: !!merchantId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vendeur-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="animate-spin text-vendeur-emerald mx-auto" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Chargement de la vitrine...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-vendeur-bg flex items-center justify-center p-8 text-center">
        <div className="max-w-sm space-y-6">
          <X className="text-rose-500 mx-auto" size={64} />
          <h1 className="text-2xl font-black uppercase text-white">Boutique Introuvable</h1>
          <p className="text-white/40 text-sm">Cette boutique n\u0027existe pas ou a été temporairement désactivée.</p>
        </div>
      </div>
    );
  }

  const { merchant, products } = data;

  const categories = ["all", ...new Set(products.map((p: any) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleWhatsAppOrder = (product: any) => {
    const message = encodeURIComponent(`Bonjour ${merchant.businessName} ! ✨\nJe suis intéressé par cet article vu sur votre site :\n\n📦 *${product.name}*\n💰 Prix : ${product.price.toLocaleString()} ${product.currency || 'XOF'}\n\nEst-il toujours disponible ?`);
    window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, '')}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-vendeur-bg text-white selection:bg-vendeur-emerald selection:text-vendeur-coal pb-24">
      {/* Header / Branding */}
      <header className="sticky top-0 z-50 bg-vendeur-bg/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-lg shadow-vendeur-emerald/20">
                <ShoppingBag size={24} />
             </div>
             <div>
                <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-none">{merchant.businessName}</h1>
                <p className="text-[9px] md:text-[10px] font-black text-vendeur-emerald uppercase tracking-widest mt-1">Propulsé par Vendeur IA</p>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">
                <Globe size={12} /> {merchant.city}, {merchant.country}
             </div>
             <button
                onClick={() => window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, '')}`, "_blank")}
                className="h-12 px-6 bg-vendeur-emerald text-vendeur-coal rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/10"
             >
                <MessageCircle size={18} />
                Contact Direct
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[3rem] bg-vendeur-coal border border-white/5 p-8 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 group">
           <div className="relative z-10 space-y-6 text-center md:text-left max-w-xl">
              <span className="px-4 py-2 bg-vendeur-emerald/10 border border-vendeur-emerald/20 rounded-full text-[10px] font-black uppercase tracking-widest text-vendeur-emerald">
                 Boutique Officielle
              </span>
              <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                 Le meilleur du <span className="text-vendeur-emerald">{merchant.category}</span> à portée de clic.
              </h2>
              <p className="text-white/40 text-sm md:text-lg font-medium leading-relaxed">
                 {merchant.description || "Découvrez notre catalogue exclusif d\u0027articles sélectionnés avec passion pour vous."}
              </p>
           </div>

           <div className="relative w-full md:w-[400px] h-[400px] bg-white/5 rounded-[4rem] border border-white/10 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-vendeur-emerald/10 to-transparent opacity-50 group-hover:scale-110 transition-transform duration-1000" />
              <Package size={120} className="text-vendeur-emerald/20" />
              <Sparkles className="absolute top-10 right-10 text-vendeur-emerald animate-pulse" size={32} />
           </div>

           {/* Decorative elements */}
           <div className="absolute -top-24 -right-24 h-96 w-96 bg-vendeur-emerald/5 blur-[120px] rounded-full" />
           <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-blue-500/5 blur-[120px] rounded-full" />
        </section>

        {/* Filters & Search */}
        <section className="space-y-8">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                 {categories.map((cat: string) => (
                    <button
                       key={cat}
                       onClick={() => setSelectedCategory(cat)}
                       className={cn(
                          "px-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                          selectedCategory === cat
                             ? "bg-white text-vendeur-coal border-white shadow-xl"
                             : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white"
                       )}
                    >
                       {cat === "all" ? "Tous les articles" : cat}
                    </button>
                 ))}
              </div>

              <div className="relative w-full md:w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                 <input
                    className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm outline-none focus:border-vendeur-emerald transition-all"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>

           {/* Products Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((p: any) => (
                 <div
                    key={p._id}
                    className="group bg-vendeur-coal border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-vendeur-emerald/30 transition-all flex flex-col shadow-lg"
                 >
                    <div className="relative aspect-square overflow-hidden bg-black/40">
                       {p.images?.[0] ? (
                          <img
                             src={p.images[0]}
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                             alt={p.name}
                          />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20">
                             <Package size={48} />
                          </div>
                       )}
                       {p.stock <= 5 && p.stock > 0 && (
                          <div className="absolute top-4 left-4 px-3 py-1 bg-rose-500 text-white text-[8px] font-black uppercase rounded-lg shadow-lg">
                             Stock Limité
                          </div>
                       )}
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button
                             onClick={() => setSelectedProduct(p)}
                             className="h-12 w-12 rounded-2xl bg-white text-vendeur-coal flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                          >
                             <Search size={20} />
                          </button>
                          <button
                             onClick={() => handleWhatsAppOrder(p)}
                             className="h-12 w-12 rounded-2xl bg-vendeur-emerald text-vendeur-coal flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                          >
                             <ShoppingCart size={20} />
                          </button>
                       </div>
                    </div>

                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                       <div>
                          <p className="text-[9px] font-black text-vendeur-emerald uppercase tracking-[0.2em] mb-1">{p.category || 'Article'}</p>
                          <h3 className="text-lg font-black uppercase tracking-tight line-clamp-1">{p.name}</h3>
                          <p className="text-white/40 text-xs mt-2 line-clamp-2 font-medium">{p.description || "Aucune description détaillée."}</p>
                       </div>

                       <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <p className="text-xl font-black text-white">{p.price.toLocaleString()} <span className="text-[10px] text-white/40 ml-1">{p.currency || 'XOF'}</span></p>
                          <div className="flex items-center gap-1 text-amber-400">
                             <Star size={10} fill="currentColor" />
                             <span className="text-[10px] font-black uppercase">Exclusif</span>
                          </div>
                       </div>
                    </div>
                 </div>
              ))}
           </div>

           {filteredProducts.length === 0 && (
              <div className="py-20 text-center space-y-6 opacity-20">
                 <Package size={64} className="mx-auto" />
                 <h3 className="text-xl font-black uppercase tracking-widest">Aucun article trouvé</h3>
              </div>
           )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-24 pb-12 border-t border-white/5 mt-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4 text-center md:text-left">
               <h4 className="text-xl font-black uppercase tracking-tighter">{merchant.businessName}</h4>
               <p className="text-white/40 text-sm">{merchant.description}</p>
            </div>

            <div className="flex flex-col items-center gap-4">
               <div className="flex items-center gap-3 text-vendeur-emerald">
                  <ShieldCheck size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Paiements Sécurisés</span>
               </div>
               <div className="flex items-center gap-3 text-sky-400">
                  <Clock size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Réponse IA 24h/7</span>
               </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-6">
                <button
                   onClick={() => window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, '')}`, "_blank")}
                   className="h-14 px-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
                >
                   <MessageCircle size={20} className="text-vendeur-emerald" />
                   Discuter sur WhatsApp
                </button>
            </div>
         </div>
         <div className="text-center mt-20 pt-8 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.4em] text-white/10">
            &copy; {new Date().getFullYear()} {merchant.businessName} \u2022 Propulsé par Vendeur IA
         </div>
      </footer>

      {/* IA Web Chat Widget */}
      <WebChatWidget merchant={merchant} />

      {/* Product Quick View Modal */}
      {selectedProduct && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-vendeur-bg/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl bg-vendeur-coal border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
               <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-6 right-6 z-20 h-10 w-10 bg-black/40 text-white/40 hover:text-white rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 transition-colors"
               >
                  <X size={20} />
               </button>

               <div className="flex-1 bg-black/40 aspect-square md:aspect-auto h-[350px] md:h-[600px] overflow-hidden">
                  {selectedProduct.images?.[0] ? (
                     <img src={selectedProduct.images[0]} className="w-full h-full object-cover" alt="" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={80} /></div>
                  )}
               </div>

               <div className="flex-1 p-8 md:p-12 space-y-8 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <span className="text-[10px] font-black text-vendeur-emerald uppercase tracking-[0.3em]">{selectedProduct.category}</span>
                        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">{selectedProduct.name}</h2>
                     </div>
                     <p className="text-white/60 text-sm md:text-base leading-relaxed font-medium">
                        {selectedProduct.description || "Cet article d\u0027exception est disponible dès maintenant dans notre catalogue. Contactez-nous sur WhatsApp pour valider votre commande et organiser la livraison."}
                     </p>

                     <div className="flex items-center gap-8">
                        <div>
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Prix unitaire</p>
                           <p className="text-3xl font-black text-white">{selectedProduct.price.toLocaleString()} <span className="text-xs text-white/40">{selectedProduct.currency || 'XOF'}</span></p>
                        </div>
                        {selectedProduct.stock > 0 ? (
                           <div>
                              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Disponibilité</p>
                              <div className="flex items-center gap-2">
                                 <div className="h-2 w-2 rounded-full bg-vendeur-emerald animate-pulse" />
                                 <p className="text-xs font-black uppercase text-vendeur-emerald">En Stock ({selectedProduct.stock})</p>
                              </div>
                           </div>
                        ) : (
                           <p className="text-xs font-black uppercase text-rose-500">Rupture de stock</p>
                        )}
                     </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                     <button
                        onClick={() => window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, '')}?text=${encodeURIComponent(\`Bonjour, je souhaite plus d\u0027informations sur : \${selectedProduct.name}\`)}`, "_blank")}
                        className="h-16 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                     >
                        <MessageCircle size={18} />
                        Infos
                     </button>
                     <button
                        onClick={() => handleWhatsAppOrder(selectedProduct)}
                        className="h-16 rounded-2xl bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-vendeur-emerald/10"
                     >
                        <ShoppingCart size={20} />
                        Commander
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
