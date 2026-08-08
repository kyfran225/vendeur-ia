import React, { useState, useMemo } from "react";
import { Package, Sparkles, Trash2, Edit, Camera, X, Save, Zap, Utensils, Laptop, Palette, Hammer, ShoppingBag, Loader2, MessageSquareText, Plus, Minus, Heart, Monitor, Home, ShoppingCart, Activity, Car, Box } from "lucide-react";
import { ProductScanner } from "./components/ProductScanner";
import { CaptionModal } from "./components/CaptionModal";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { compressImage } from "@/lib/imageUtils";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  },
  beauty: {
    title: "Cosmétiques & Beauté",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <Heart size={48} className="text-pink-500/20" />,
    accent: "pink",
    scannerHint: "Scannez vos produits de beauté"
  },
  electronics: {
    title: "Stock High-Tech",
    itemLabel: "Article",
    stockLabel: "Stock",
    icon: <Monitor size={48} className="text-blue-500/20" />,
    accent: "blue",
    scannerHint: "Scannez vos appareils électroniques"
  },
  home: {
    title: "Maison & Déco",
    itemLabel: "Article",
    stockLabel: "Stock",
    icon: <Home size={48} className="text-indigo-500/20" />,
    accent: "indigo",
    scannerHint: "Scannez vos articles de maison"
  },
  grocery: {
    title: "Mon Épicerie",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <ShoppingCart size={48} className="text-lime-500/20" />,
    accent: "lime",
    scannerHint: "Scannez vos produits alimentaires"
  },
  health: {
    title: "Santé & Bien-être",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <Activity size={48} className="text-red-500/20" />,
    accent: "red",
    scannerHint: "Scannez vos produits de santé"
  },
  auto: {
    title: "Auto-Moto",
    itemLabel: "Pièce",
    stockLabel: "Stock",
    icon: <Car size={48} className="text-slate-500/20" />,
    accent: "slate",
    scannerHint: "Scannez vos pièces ou accessoires"
  },
  other: {
    title: "Mon Catalogue",
    itemLabel: "Article",
    stockLabel: "Stock",
    icon: <Box size={48} className="text-gray-500/20" />,
    accent: "gray",
    scannerHint: "Scannez vos articles"
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
  const [analyzing, setAnalyzing] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: NaN,
    stock: 1,
    category: businessCategory,
    description: "",
    imageUrl: ""
  });
  const [captionData, setCaptionData] = useState<{ isOpen: boolean; text: string; productName: string }>({
    isOpen: false,
    text: "",
    productName: ""
  });

  // Real Backend Data Fetching
  const { data: merchant } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/commerce/merchant/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    },
    enabled: !!accessToken
  });

  const activeCurrency = merchant?.currency || "XOF";

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

  const updateStockMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      axios.patch(`${API_URL}/api/commerce/products/${id}`, { stock }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => {
      toast.error("Échec de la mise à jour du stock.");
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
        text: response.data,
        productName: product?.name || ""
      });
    },
    onError: () => {
      toast.error("Impossible de générer la légende.");
    }
  });

  const visionMutation = useMutation({
    mutationFn: async (file: File) => {
      setAnalyzing(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(`${API_URL}/api/commerce/products/vision`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`
        }
      });
      return res.data;
    },
    onSuccess: (data) => {
      const sanitizedPrice = isNaN(parseInt(data.price)) ? NaN : parseInt(data.price);
      if (editingProduct) {
        setEditingProduct({
          ...editingProduct,
          name: data.name || editingProduct.name,
          price: isNaN(sanitizedPrice) ? editingProduct.price : sanitizedPrice
        });
      } else {
        setNewProduct(prev => ({
          ...prev,
          name: data.name || prev.name,
          price: sanitizedPrice,
          description: data.description || prev.description
        }));
        setIsAddingManual(true);
      }
      toast.success("Analyse terminée ! ✨");
    },
    onError: () => {
      toast.error("Échec de l'analyse de l'image.");
    },
    onSettled: () => {
      setAnalyzing(false);
    }
  });

  const handleVisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (editingProduct) setEditingProduct({ ...editingProduct, imageUrl: dataUrl } as any);
        else setNewProduct(prev => ({ ...prev, imageUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
      visionMutation.mutate(file);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        try {
          const compressedBlob = await compressImage(dataUrl, 1080, 0.7);
          const compressedDataUrl = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(compressedBlob);
          });

          if (editingProduct) {
            setEditingProduct({ ...editingProduct, imageUrl: compressedDataUrl } as any);
          } else {
            setNewProduct({ ...newProduct, imageUrl: compressedDataUrl });
          }
        } catch (error) {
          toast.error("Erreur lors de la compression de l'image");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) updateMutation.mutate(editingProduct);
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...newProduct,
      price: isNaN(newProduct.price) ? 0 : newProduct.price,
      stock: isNaN(newProduct.stock) ? 0 : newProduct.stock,
      category: newProduct.category || businessCategory,
      isService: businessCategory === "services"
    });
    setIsAddingManual(false);
    setNewProduct({ name: "", price: NaN, stock: 1, category: businessCategory, description: "", imageUrl: "" });
  };

  const handleScanComplete = (scannedData: any) => {
    if (scannedData.isBatch && Array.isArray(scannedData.items)) {
      let createdCount = 0;
      scannedData.items.forEach((item: any) => {
        createMutation.mutate({
          name: item.name || "Article IA",
          price: item.price || 0,
          stock: item.stock || 1,
          category: item.category || businessCategory,
          description: item.description || "",
          imageUrl: item.image || ""
        }, {
          onSuccess: () => {
            createdCount++;
          }
        });
      });
      setIsScannerOpen(false);
      toast.success(`${scannedData.items.length} articles ajoutés au catalogue !`);
      return;
    }

    if (scannedData.finalPoster || scannedData.image) {
      setNewProduct(prev => ({
        ...prev,
        name: scannedData.name || prev.name,
        price: isNaN(parseInt(scannedData.price)) ? prev.price : parseInt(scannedData.price),
        category: scannedData.category || prev.category,
        description: scannedData.description || prev.description,
        imageUrl: scannedData.finalPoster || scannedData.image
      }));
    }
    setIsScannerOpen(false);
    setIsAddingManual(true);
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
              <div className="flex flex-col items-center gap-4 pb-4">
                {/* Image Upload Area */}
                <div className="relative group">
                  <label className="relative flex flex-col items-center justify-center w-32 h-32 rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 hover:border-emerald-300/50 transition-all cursor-pointer overflow-hidden">
                    {(editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl) ? (
                      <img
                        src={editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl}
                        className="w-full h-full object-cover"
                        alt="Preview"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-white/20">
                        <Camera size={24} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Photo</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {(editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl) && (
                    <button
                      type="button"
                      onClick={() => editingProduct
                        ? setEditingProduct({ ...editingProduct, imageUrl: "" } as any)
                        : setNewProduct({ ...newProduct, imageUrl: "" })
                      }
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <label className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-400/10 border border-sky-400/20 text-sky-400 text-[10px] font-black uppercase tracking-widest hover:bg-sky-400/20 transition-all cursor-pointer shadow-lg shadow-sky-400/5",
                  analyzing && "opacity-50 cursor-wait"
                )}>
                   {analyzing ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
                   Remplir par IA Vision
                   <input type="file" accept="image/*" className="hidden" onChange={handleVisionUpload} disabled={analyzing} />
                </label>
              </div>

              <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                Nom {config.itemLabel.toLowerCase() === "service" ? "de la prestation" : "de l'article"}
                <input
                  className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all"
                  value={editingProduct ? editingProduct.name : newProduct.name}
                  onChange={e => editingProduct
                    ? setEditingProduct({...editingProduct, name: e.target.value})
                    : setNewProduct({...newProduct, name: e.target.value})
                  }
                  required
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                  Prix ({activeCurrency})
                  <input
                    type="number"
                    className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all"
                    value={editingProduct ? (isNaN(editingProduct.price) ? "" : editingProduct.price) : (isNaN(newProduct.price) ? "" : newProduct.price)}
                    onChange={e => {
                      const val = e.target.value === "" ? NaN : parseInt(e.target.value);
                      editingProduct
                        ? setEditingProduct({...editingProduct, price: val})
                        : setNewProduct({...newProduct, price: val});
                    }}
                    placeholder="0"
                    required
                  />
                </label>
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                  {config.stockLabel}
                  <input
                    type="number"
                    className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all"
                    value={editingProduct ? (isNaN(editingProduct.stock) ? "" : editingProduct.stock) : (isNaN(newProduct.stock) ? "" : newProduct.stock)}
                    onChange={e => {
                      const val = e.target.value === "" ? NaN : parseInt(e.target.value);
                      editingProduct
                        ? setEditingProduct({...editingProduct, stock: val})
                        : setNewProduct({...newProduct, stock: val});
                    }}
                    placeholder="0"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/40">
                Description
                <textarea
                  className="min-h-[100px] rounded-xl bg-white/5 border border-white/10 p-4 text-white outline-none focus:border-emerald-300 transition-all resize-none"
                  value={editingProduct ? (editingProduct as any).description : newProduct.description}
                  onChange={e => editingProduct
                    ? setEditingProduct({...editingProduct, description: e.target.value} as any)
                    : setNewProduct({...newProduct, description: e.target.value})
                  }
                  placeholder="Détails du produit..."
                />
              </label>
            </div>

            <button type="submit" className="w-full h-14 bg-emerald-300 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all">
              {editingProduct ? <Save size={18} /> : <Plus size={18} />}
              {editingProduct ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase">{config.title}</h1>
          <p className="text-white/40 mt-1 md:text-lg">Gérez vos {config.itemLabel.toLowerCase()}s et laissez l'IA travailler.</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-3">
          {businessCategory !== "services" && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-2 bg-sky-400 text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-sky-500 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
            >
              <Camera size={18} /> Scanner
            </button>
          )}
          <button
            onClick={() => {
               if (businessCategory === "services") setIsAddingManual(true);
               else {
                 setIsAddingManual(true);
               }
            }}
            className={`flex items-center justify-center gap-2 bg-${config.accent}-300 text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto`}
          >
            {businessCategory === "services" ? <Zap size={18} /> : <Plus size={18} />}
            {businessCategory === "services" ? "Ajouter Service" : "Manuel"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  <p className={`font-black text-${config.accent}-400`}>{p.price.toLocaleString()} {(p as any).currency || activeCurrency}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/60">{config.stockLabel}:</span>
                    <div className="flex items-center bg-white/5 rounded-lg border border-white/10 px-1 py-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStockMutation.mutate({ id: p._id, stock: Math.max(0, p.stock - 1) });
                        }}
                        disabled={updateStockMutation.isPending}
                        className="p-1 hover:text-rose-400 transition-colors disabled:opacity-30"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-black text-white">
                        {updateStockMutation.isPending && updateStockMutation.variables?.id === p._id
                          ? <Loader2 size={10} className="animate-spin inline" />
                          : p.stock
                        }
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStockMutation.mutate({ id: p._id, stock: p.stock + 1 });
                        }}
                        disabled={updateStockMutation.isPending}
                        className="p-1 hover:text-emerald-400 transition-colors disabled:opacity-30"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
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
