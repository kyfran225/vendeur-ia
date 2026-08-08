import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, MessageCircle, Info, MapPin } from "lucide-react";
import axios from "axios";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export function PublicShopPage() {
  const { merchantId } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-shop", merchantId],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/commerce/public/shop/${merchantId}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0f0d] flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-vendeur-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0c0f0d] flex flex-col items-center justify-center p-6 text-center">
        <ShoppingBag size={64} className="text-white/10 mb-6" />
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Boutique non trouvée</h1>
        <p className="text-white/40 mt-2">Le lien semble incorrect ou la boutique n'existe plus.</p>
      </div>
    );
  }

  const { merchant, products } = data;

  const handleBuyOnWhatsApp = (productName: string, price: number) => {
    const phone = merchant.whatsappNumber?.replace(/\+/g, '') || "";
    const message = encodeURIComponent(`Bonjour ! Je suis intéressé(e) par votre produit : *${productName}* (${price} ${merchant.currency}). Est-il toujours disponible ?`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0c0f0d] text-white selection:bg-vendeur-emerald/30">
      {/* Hero Header */}
      <header className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-vendeur-emerald/20 to-[#0c0f0d] z-0" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
           <div className="h-20 w-20 md:h-24 md:w-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl">
              <ShoppingBag size={40} className="text-vendeur-emerald" />
           </div>
           <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">{merchant.businessName}</h1>
              <div className="flex items-center justify-center gap-4 mt-3 text-white/40 text-[10px] md:text-xs font-black uppercase tracking-widest">
                 <span className="flex items-center gap-1.5"><MapPin size={14} /> {merchant.city}, {merchant.country}</span>
                 <span className="h-1 w-1 bg-white/20 rounded-full" />
                 <span className="text-vendeur-emerald">{merchant.category}</span>
              </div>
           </div>
        </div>
      </header>

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto px-6 pb-24 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
           {products.map((product: any) => (
              <div key={product._id} className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-vendeur-emerald/40 transition-all duration-500 hover:translate-y-[-4px]">
                 <div className="aspect-square bg-white/5 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-white/10">
                        <ShoppingBag size={48} />
                      </div>
                    )}
                    {product.stock <= 3 && product.stock > 0 && (
                      <span className="absolute top-4 right-4 bg-orange-500 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest">Stock Limité</span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded-full tracking-[0.2em]">Épuisé</span>
                      </div>
                    )}
                 </div>

                 <div className="p-8 space-y-6">
                    <div className="space-y-2">
                       <h3 className="text-xl font-black uppercase tracking-tight line-clamp-1">{product.name}</h3>
                       <p className="text-white/40 text-xs line-clamp-2 leading-relaxed">{product.description || "Aucune description disponible."}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2">
                       <span className="text-2xl font-black text-vendeur-emerald">
                         {product.price.toLocaleString()} <span className="text-[10px] text-white/20 ml-1">{merchant.currency}</span>
                       </span>

                       <button
                         onClick={() => handleBuyOnWhatsApp(product.name, product.price)}
                         disabled={product.stock === 0}
                         className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-vendeur-emerald hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all active:scale-90 disabled:opacity-20 disabled:grayscale"
                       >
                          <MessageCircle size={22} fill="currentColor" fillOpacity={0.1} />
                       </button>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-white/5 flex flex-col items-center gap-4">
         <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Propulsé par</p>
         <img src="/apple-touch-icon.png" alt="Vendeur IA" className="h-8 opacity-40 grayscale hover:grayscale-0 transition-all cursor-pointer" />
      </footer>
    </div>
  );
}
