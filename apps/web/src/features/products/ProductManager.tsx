import React, { useState, useMemo } from "react";
import { Package, Sparkles, Trash2, Edit, Camera, X, Save, Zap, Utensils, Laptop, Palette, Hammer, ShoppingBag, Loader2, MessageSquareText, Plus } from "lucide-react";
import { ProductScanner } from "./components/ProductScanner";
import { CaptionModal } from "./components/CaptionModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) console.warn("VITE_API_URL is not defined! Check your .env file.");

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  isService?: boolean;
}

// Adaptive UI Configuration
const BUSINESS_CONFIGS: Record<string, any> = {
  fashion: {
    title: "Catalogue Mode",
    itemLabel: "Article",
    stockLabel: "Stock",
    icon: <ShoppingBag size={48} className="text-white/10" />,
    accent: "emerald",
    scannerHint: "Scannez vos vêtements ou accessoires"
  },
  food: {
    title: "Menu Restaurant",
    itemLabel: "Plat",
    stockLabel: "Disponibilité",
    icon: <Utensils size={48} className="text-amber-500/20" />,
    accent: "amber",
    scannerHint: "Scannez vos plats ou boissons"
  },
  services: {
    title: "Mes Prestations",
    itemLabel: "Service",
    stockLabel: "Disponibilité",
    icon: <Zap size={48} className="text-sky-500/20" />,
    accent: "sky",
    scannerHint: "Décrivez votre service à l'IA"
  },
  digital: {
    title: "Produits Digitaux",
    itemLabel: "Fichier",
    stockLabel: "Accès",
    icon: <Laptop size={48} className="text-purple-500/20" />,
    accent: "purple",
    scannerHint: "Uploadez vos contenus"
  },
  artisan: {
    title: "Atelier Artisanat",
    itemLabel: "Création",
    stockLabel: "En stock",
    icon: <Hammer size={48} className="text-orange-500/20" />,
    accent: "orange",
    scannerHint: "Scannez vos créations uniques"
  }
};

const DEFAULT_CONFIG = BUSINESS_CONFIGS.fashion;

export function ProductManager() {
  const { tempData } = useOnboardingStore();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const businessCategory = tempData?.category || "fashion";
  const config = useMemo(() => BUSINESS_CONFIGS[businessCategory] || DEFAULT_CONFIG, [businessCategory]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: 0, stock: 1, category: businessCategory });
  const [captionData, setCaptionData] = useState<{ isOpen: boolean; text: string; productName: string }>({
    isOpen: false,
    text: "",
    productName: ""
  });

  // Real Backend Data Fetching
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/commerce/products`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    },
    enabled: !!accessToken
  });

  const createMutation = useMutation({
    mutationFn: (newProduct: any) =>
      axios.post(`${API_URL}/api/commerce/products`, newProduct, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Article ajouté au catalogue !");
    },
    onError: (error: any) => {
      console.error("Create Product Error:", error);
      toast.error("Erreur lors de l'ajout. Vérifiez votre connexion.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete(`${API_URL}/api/commerce/products/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Supprimé avec succès.");
      setDeletingProduct(null);
    },
    onError: (error: any) => {
      console.error("Delete Product Error:", error);
      toast.error("Impossible de supprimer l'article.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (product: Product) =>
      axios.patch(`${API_URL}/api/commerce/products/${product._id}`, product, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Mise à jour réussie.");
      setEditingProduct(null);
    },
    onError: (error: any) => {
      console.error("Update Product Error:", error);
      toast.error("Erreur lors de la mise à jour.");
    }
  });

  const generateCaptionMutation = useMutation({
    mutationFn: (productId: string) =>
      axios.post(`${API_URL}/api/commerce/products/${productId}/caption`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    onSuccess: (response, productId) => {
      const product = products.find(p => p._id === productId);
      setCaptionData({
        isOpen: true,
        text: response.data.caption,
        productName: product?.name || ""
      });
    },
    onError: () => {
      toast.error("Impossible de générer la légende.");
    }
  });

  const handleScanComplete = (data: any) => {
    createMutation.mutate({
      name: data.name,
      price: data.price,
      stock: 1,
      category: data.category || businessCategory,
      description: data.description,
      imageUrl: data.finalPoster || data.image
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) updateMutation.mutate(editingProduct);
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...newProduct,
      category: newProduct.category || businessCategory,
      isService: businessCategory === "services"
    });
    setIsAddingManual(false);
    setNewProduct({ name: "", price: 0, stock: 1, category: businessCategory });
  };

  return (
    <div className="p-6 space-y-8 relative min-h-screen">
      {isScannerOpen && (
        <ProductScanner
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={handleScanComplete}
          boutiqueName="Ma Boutique IA"
        />
      )}

      <CaptionModal
        isOpen={captionData.isOpen}
        onClose={() => setCaptionData({ ...captionData, isOpen: false })}
        caption={captionData.text}
        productName={captionData.productName}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct._id)}
        title={`Supprimer ${config.itemLabel.toLowerCase()} ?`}
        message={`Êtes-vous sûr de vouloir retirer "${deletingProduct?.name}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        type="danger"
      />

      {/* Edit Form Modal */}
      {(editingProduct || isAddingManual) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setEditingProduct(null); setIsAddingManual(false); }} />
          <form
            onSubmit={editingProduct ? handleUpdate : handleManualCreate}
            className="relative w-full max-w-lg bg-[#0c0f0d] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-white">
                {editingProduct ? "Modifier" : "Ajouter"} {config.itemLabel.toLowerCase()}
              </h2>
              <button onClick={() => { setEditingProduct(null); setIsAddingManual(false); }} type="button" className="text-white/20 hover:text-white"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                Nom {config.itemLabel.toLowerCase() === "service" ? "de la prestation" : "de l'article"}
                <input
                  className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300"
                  value={editingProduct ? editingProduct.name : newProduct.name}
                  onChange={e => editingProduct
                    ? setEditingProduct({...editingProduct, name: e.target.value})
                    : setNewProduct({...newProduct, name: e.target.value})
                  }
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                  Prix (FCFA)
                  <input
                    type="number"
                    className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300"
                    value={editingProduct ? editingProduct.price : newProduct.price}
                    onChange={e => editingProduct
                      ? setEditingProduct({...editingProduct, price: parseInt(e.target.value)})
                      : setNewProduct({...newProduct, price: parseInt(e.target.value)})
                    }
                    required
                  />
                </label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                  {config.stockLabel}
                  <input
                    type="number"
                    className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300"
                    value={editingProduct ? editingProduct.stock : newProduct.stock}
                    onChange={e => editingProduct
                      ? setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})
                      : setNewProduct({...newProduct, stock: parseInt(e.target.value)})
                    }
                  />
                </label>
              </div>
            </div>

            <button type="submit" className="w-full h-14 bg-emerald-300 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
              {editingProduct ? <Save size={18} /> : <Plus size={18} />}
              {editingProduct ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        </div>
      )}

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">{config.title}</h1>
          <p className="text-white/40">Gérez vos {config.itemLabel.toLowerCase()}s et laissez l'IA travailler.</p>
        </div>
        <div className="flex gap-3">
          {businessCategory !== "services" && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 bg-sky-400 text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-sky-500 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Camera size={18} /> Scanner un produit
            </button>
          )}
          <button
            onClick={() => {
               if (businessCategory === "services") setIsAddingManual(true);
               else {
                 setIsAddingManual(true);
               }
            }}
            className={`flex items-center gap-2 bg-${config.accent}-300 text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] active:scale-95 transition-all`}
          >
            {businessCategory === "services" ? <Zap size={18} /> : <Plus size={18} />}
            {businessCategory === "services" ? "Ajouter Service" : "Ajout Manuel"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-white/20">
            <Loader2 size={48} className="animate-spin" />
            <p className="font-black uppercase tracking-[0.2em] text-xs">Chargement du catalogue...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-white/20">
            <Package size={48} />
            <p className="font-black uppercase tracking-[0.2em] text-xs">Votre catalogue est vide</p>
          </div>
        ) : (
          products.map(p => (
            <div key={p._id} className={`bg-[#0c0f0d] border border-white/10 rounded-3xl overflow-hidden group hover:border-${config.accent}-500/30 transition-all shadow-xl`}>
              <div className="aspect-square bg-white/5 flex items-center justify-center relative">
                {(p as any).imageUrl || (p as any).images?.[0] ? (
                  <img src={(p as any).imageUrl || (p as any).images?.[0]} className="w-full h-full object-cover" alt={p.name} />
                ) : config.icon}
                <div className="absolute top-4 right-4 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
                  <Sparkles size={12} className="text-sky-400" />
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">IA Powered</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-lg text-white line-clamp-1">{p.name}</h3>
                    <p className="text-sm text-white/40">{p.category}</p>
                  </div>
                  <p className={`font-black text-${config.accent}-400`}>{p.price.toLocaleString()} FCFA</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <p className="text-xs font-bold text-white/60">
                    {config.stockLabel}: <span className="text-white">{p.stock}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateCaptionMutation.mutate(p._id)}
                      disabled={generateCaptionMutation.isPending}
                      className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all flex items-center gap-2 group/btn"
                    >
                      {generateCaptionMutation.isPending && generateCaptionMutation.variables === p._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <MessageSquareText size={16} />
                      )}
                      <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-500 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Caption</span>
                    </button>
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="p-2 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(p)}
                      className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
