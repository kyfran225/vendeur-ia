import React, { useState, useMemo } from "react";
import { Package, Sparkles, Trash2, Edit, Camera, X, Save, Zap, Utensils, Laptop, Palette, Hammer, ShoppingBag, Loader2, MessageSquareText, Plus, Minus, Heart, Monitor, Home, ShoppingCart, Activity, Car, Box, Image as ImageIcon, Star } from "lucide-react";
import { ProductScanner } from "./components/ProductScanner";
import { CaptionModal } from "./components/CaptionModal";
import { PosterGenerator } from "./components/PosterGenerator";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { StepMilestoneModal } from "../../components/ui/StepMilestoneModal";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { useMerchant } from "@/hooks/useMerchant";
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
  description?: string;
  imageUrl?: string;
  images?: string[];
  isFeatured?: boolean;
  isService?: boolean;
  digitalUrl?: string;
  digitalFormat?: string;
  serviceDuration?: string;
  serviceDeliveryType?: string;
  preparationTime?: string;
  foodOptions?: string;
}

// Adaptive UI Configuration
const BUSINESS_CONFIGS: Record<string, any> = {
  fashion: {
    title: "Catalogue Mode & Accessoires",
    itemLabel: "Article",
    stockLabel: "Stock",
    icon: <ShoppingBag size={48} className="text-emerald-400/20" />,
    btnBg: "bg-emerald-400 hover:bg-emerald-500 text-black font-black",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Nouveau Produit"
  },
  food: {
    title: "Menu & Restauration",
    itemLabel: "Plat / Formule",
    stockLabel: "Disponibilité du jour",
    icon: <Utensils size={48} className="text-amber-500/20" />,
    btnBg: "bg-amber-400 hover:bg-amber-500 text-black font-black",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    showScanner: true,
    showStock: false,
    actionButtonLabel: "Ajouter au Menu"
  },
  services: {
    title: "Mes Prestations & Services",
    itemLabel: "Service",
    stockLabel: "Créneaux",
    icon: <Zap size={48} className="text-sky-500/20" />,
    btnBg: "bg-sky-400 hover:bg-sky-500 text-black font-black",
    badgeBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    showScanner: false,
    showStock: false,
    actionButtonLabel: "Nouveau Service"
  },
  digital: {
    title: "Produits Digitaux & Formations",
    itemLabel: "Contenu Digital",
    stockLabel: "Accès",
    icon: <Laptop size={48} className="text-purple-500/20" />,
    btnBg: "bg-purple-400 hover:bg-purple-500 text-black font-black",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    showScanner: false,
    showStock: false,
    actionButtonLabel: "Ajouter Contenu Digital"
  },
  artisan: {
    title: "Atelier & Créations",
    itemLabel: "Création",
    stockLabel: "En stock",
    icon: <Hammer size={48} className="text-orange-500/20" />,
    btnBg: "bg-orange-400 hover:bg-orange-500 text-black font-black",
    badgeBg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Création"
  },
  beauty: {
    title: "Cosmétiques & Soins",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <Heart size={48} className="text-pink-500/20" />,
    btnBg: "bg-pink-400 hover:bg-pink-500 text-black font-black",
    badgeBg: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Produit"
  },
  electronics: {
    title: "Stock High-Tech",
    itemLabel: "Appareil",
    stockLabel: "Stock",
    icon: <Monitor size={48} className="text-blue-500/20" />,
    btnBg: "bg-blue-400 hover:bg-blue-500 text-black font-black",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Appareil"
  },
  home: {
    title: "Maison & Décoration",
    itemLabel: "Article",
    stockLabel: "Stock",
    icon: <Home size={48} className="text-indigo-500/20" />,
    btnBg: "bg-indigo-400 hover:bg-indigo-500 text-black font-black",
    badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Article"
  },
  grocery: {
    title: "Épicerie & Équipement",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <ShoppingCart size={48} className="text-lime-500/20" />,
    btnBg: "bg-lime-400 hover:bg-lime-500 text-black font-black",
    badgeBg: "bg-lime-500/10 text-lime-400 border-lime-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Produit"
  },
  health: {
    title: "Santé & Bien-être",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <Activity size={48} className="text-red-500/20" />,
    btnBg: "bg-red-400 hover:bg-red-500 text-black font-black",
    badgeBg: "bg-red-500/10 text-red-400 border-red-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Produit"
  },
  auto: {
    title: "Auto & Pièces Détachées",
    itemLabel: "Pièce",
    stockLabel: "Stock",
    icon: <Car size={48} className="text-slate-500/20" />,
    btnBg: "bg-slate-300 hover:bg-slate-400 text-black font-black",
    badgeBg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Pièce"
  },
  other: {
    title: "Mon Offre & Catalogue",
    itemLabel: "Article / Service",
    stockLabel: "Disponible",
    icon: <Box size={48} className="text-gray-500/20" />,
    btnBg: "bg-emerald-400 hover:bg-emerald-500 text-black font-black",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Élément"
  }
};

const DEFAULT_CONFIG = BUSINESS_CONFIGS.other;

export function ProductManager() {
  const { tempData } = useOnboardingStore();
  const { accessToken } = useAuthStore();
  const merchantFromCache = useMerchant();
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/commerce/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    enabled: !!accessToken
  });

  const merchant = merchantFromCache || dashboardData?.merchant;
  const isMerchantLoading = !merchant && isDashboardLoading;
  const queryClient = useQueryClient();

  const businessCategory = merchant?.category || tempData?.category || "other";
  const activeCurrency = merchant?.currency || "XOF";
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
    imageUrl: "",
    digitalUrl: "",
    digitalFormat: "PDF / E-Book",
    serviceDuration: "1h",
    serviceDeliveryType: "Présentiel",
    preparationTime: "15-20 min",
    foodOptions: ""
  });

  const [captionData, setCaptionData] = useState<{ isOpen: boolean; text: string; productName: string }>({
    isOpen: false,
    text: "",
    productName: ""
  });

  const [posterProduct, setPosterProduct] = useState<Product | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [lastAddedName, setLastAddedName] = useState("");

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/commerce/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    },
    enabled: !!accessToken
  });

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
    mutationFn: (newProd: any) =>
      axios.post(`${API_URL}/api/commerce/products`, newProd, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    onSuccess: (_data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Ajouté au catalogue avec succès !");
      setIsAddingManual(false);
      setLastAddedName(variables.name || "Produit");
      setShowMilestoneModal(true);
      setNewProduct({
        name: "",
        price: NaN,
        stock: 1,
        category: businessCategory,
        description: "",
        imageUrl: "",
        digitalUrl: "",
        digitalFormat: "PDF / E-Book",
        serviceDuration: "1h",
        serviceDeliveryType: "Présentiel",
        preparationTime: "15-20 min",
        foodOptions: ""
      });
    },
    onError: (error: any) => {
      console.error("Create Product Error:", error);
      toast.error("Erreur lors de l'ajout.");
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
      toast.error("Impossible de supprimer.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: (product: Product) =>
      axios.patch(`${API_URL}/api/commerce/products/${product._id}`, product, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Mise à jour réussie !");
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
      toast.success("Analyse IA terminée !");
    },
    onError: () => {
      toast.error("Échec de l'analyse de l'image.");
    },
    onSettled: () => {
      setAnalyzing(false);
    }
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.patch(
        `${API_URL}/api/commerce/products/${id}/toggle-featured`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return res.data;
    },
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        updatedProduct.isFeatured
          ? `⭐ "${updatedProduct.name}" est maintenant en vedette dans le Hero Showcase !`
          : `Article retiré des vedettes.`
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de la mise en vedette.");
    }
  });

  const [autoAnalyzeWithIA, setAutoAnalyzeWithIA] = useState(true);

  const handleUnifiedPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          setNewProduct(prev => ({ ...prev, imageUrl: compressedDataUrl }));
        }

        // Trigger AI vision analysis if auto-analyze option is enabled
        if (autoAnalyzeWithIA && config.showScanner) {
          visionMutation.mutate(file);
        }
      } catch (error) {
        toast.error("Erreur lors du traitement de la photo");
      }
    };
    reader.readAsDataURL(file);
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
  };

  const handleScanComplete = (scannedData: any) => {
    if (scannedData.isBatch && Array.isArray(scannedData.items)) {
      scannedData.items.forEach((item: any) => {
        createMutation.mutate({
          name: item.name || "Article IA",
          price: item.price || 0,
          stock: item.stock || 1,
          category: item.category || businessCategory,
          description: item.description || "",
          imageUrl: item.image || ""
        });
      });
      setIsScannerOpen(false);
      toast.success(`${scannedData.items.length} éléments ajoutés au catalogue !`);
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

  if (isMerchantLoading) {
    return (
      <div className="p-6 space-y-8 min-h-full animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-3">
            <div className="h-10 w-72 bg-white/10 rounded-2xl" />
            <div className="h-4 w-96 bg-white/5 rounded-lg" />
          </div>
          <div className="h-12 w-48 bg-white/10 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-white/5 rounded-3xl border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6 md:space-y-8 relative min-h-full pb-24 md:pb-12 animate-in fade-in duration-500">
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            deleteMutation.mutate(deletingProduct._id);
          }
        }}
        title={`Supprimer ${config.itemLabel.toLowerCase()} ?`}
        message={`Êtes-vous sûr de vouloir retirer "${deletingProduct?.name}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        type="danger"
      />

      {/* Edit / Add Form Modal */}
      {(editingProduct || isAddingManual) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => { setEditingProduct(null); setIsAddingManual(false); }} />
          <form
            onSubmit={editingProduct ? handleUpdate : handleManualCreate}
            className="relative w-full max-w-xl bg-[#0c0f0d] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black text-white">
                {editingProduct ? "Modifier" : "Nouveau"} {config.itemLabel}
              </h2>
              <button onClick={() => { setEditingProduct(null); setIsAddingManual(false); }} type="button" className="text-white/40 hover:text-white"><X size={24} /></button>
            </div>

            <div className="space-y-4">
              {/* Unified Intelligent Photo Uploader */}
              {businessCategory !== "digital" && (
                <div className="flex flex-col items-center gap-3 pb-2">
                  <div className="relative w-full">
                    <label className={cn(
                      "relative flex flex-col items-center justify-center w-full h-36 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 hover:border-emerald-400/50 transition-all cursor-pointer overflow-hidden p-4 group text-center",
                      analyzing && "opacity-75 cursor-wait border-sky-400/50"
                    )}>
                      {(editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl) ? (
                        <img
                          src={editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl}
                          className="w-full h-full object-cover rounded-2xl"
                          alt="Preview"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          {analyzing ? (
                            <>
                              <Loader2 size={28} className="animate-spin text-sky-400" />
                              <span className="text-xs font-black uppercase text-sky-400 tracking-wider">Analyse de la photo par Vendeur IA...</span>
                            </>
                          ) : (
                            <>
                              <div className="p-3 bg-white/5 rounded-2xl text-white/40 group-hover:text-emerald-400 group-hover:bg-emerald-400/10 transition-all">
                                <Camera size={24} />
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase text-white tracking-wider">Ajouter une photo</p>
                                <p className="text-[10px] text-white/40 font-medium mt-0.5">Cliquez pour choisir une photo ou scanner</p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUnifiedPhotoUpload} disabled={analyzing} />
                    </label>

                    {(editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl) && (
                      <button
                        type="button"
                        onClick={() => editingProduct
                          ? setEditingProduct({ ...editingProduct, imageUrl: "" } as any)
                          : setNewProduct(prev => ({ ...prev, imageUrl: "" }))
                        }
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all z-10"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* AI Auto-fill Checkbox / Toggle */}
                  {config.showScanner && (
                    <label className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer w-full justify-center">
                      <input
                        type="checkbox"
                        checked={autoAnalyzeWithIA}
                        onChange={(e) => setAutoAnalyzeWithIA(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 text-emerald-400 focus:ring-emerald-400 accent-emerald-400"
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider">Pré-remplir automatiquement les infos avec Vendeur IA</span>
                    </label>
                  )}
                </div>
              )}

              {/* Title / Name Field */}
              <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                {businessCategory === "digital" && "Titre du Contenu / E-Book / Formation"}
                {businessCategory === "services" && "Intitulé de la Prestation"}
                {businessCategory === "food" && "Nom du Plat ou Formule"}
                {businessCategory !== "digital" && businessCategory !== "services" && businessCategory !== "food" && "Nom de l'Article"}
                <input
                  className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all placeholder:text-white/20"
                  value={editingProduct ? editingProduct.name : newProduct.name}
                  onChange={e => editingProduct
                    ? setEditingProduct({...editingProduct, name: e.target.value})
                    : setNewProduct({...newProduct, name: e.target.value})
                  }
                  placeholder={
                    businessCategory === "digital" ? "ex: E-Book Réussir sur WhatsApp" :
                    businessCategory === "services" ? "ex: Consultation Coaching 1h" :
                    businessCategory === "food" ? "ex: Menu Burger Gourmet + Frites" : "ex: Chaussure Sneakers Nike"
                  }
                  required
                />
              </label>

              {/* Price & Stock/Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
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

                {/* DOMAIN SPECIFIC SECOND FIELD */}
                {businessCategory === "digital" && (
                  <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                    Format du Contenu
                    <select
                      className="h-12 rounded-xl bg-[#141815] border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all"
                      value={editingProduct ? (editingProduct.digitalFormat || "PDF / E-Book") : newProduct.digitalFormat}
                      onChange={e => editingProduct
                        ? setEditingProduct({...editingProduct, digitalFormat: e.target.value})
                        : setNewProduct({...newProduct, digitalFormat: e.target.value})
                      }
                    >
                      <option value="PDF / E-Book">PDF / E-Book</option>
                      <option value="Formation Vidéo">Formation Vidéo</option>
                      <option value="Fichier ZIP / Logiciel">Fichier ZIP / Logiciel</option>
                      <option value="Lien VIP / Groupe">Lien VIP / Groupe</option>
                    </select>
                  </label>
                )}

                {businessCategory === "services" && (
                  <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                    Durée Estimée
                    <input
                      className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all"
                      value={editingProduct ? (editingProduct.serviceDuration || "1h") : newProduct.serviceDuration}
                      onChange={e => editingProduct
                        ? setEditingProduct({...editingProduct, serviceDuration: e.target.value})
                        : setNewProduct({...newProduct, serviceDuration: e.target.value})
                      }
                      placeholder="ex: 45 min, 1h30"
                    />
                  </label>
                )}

                {businessCategory === "food" && (
                  <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                    Temps de Préparation
                    <input
                      className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all"
                      value={editingProduct ? (editingProduct.preparationTime || "15-20 min") : newProduct.preparationTime}
                      onChange={e => editingProduct
                        ? setEditingProduct({...editingProduct, preparationTime: e.target.value})
                        : setNewProduct({...newProduct, preparationTime: e.target.value})
                      }
                      placeholder="ex: 15-20 min"
                    />
                  </label>
                )}

                {config.showStock && (
                  <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
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
                      placeholder="1"
                    />
                  </label>
                )}
              </div>

              {/* SPECIFIC FIELD: FOOD OPTIONS */}
              {businessCategory === "food" && (
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                  Options / Formules disponibles
                  <input
                    className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all placeholder:text-white/20"
                    value={editingProduct ? (editingProduct.foodOptions || "") : newProduct.foodOptions}
                    onChange={e => editingProduct
                      ? setEditingProduct({...editingProduct, foodOptions: e.target.value})
                      : setNewProduct({...newProduct, foodOptions: e.target.value})
                    }
                    placeholder="ex: Sans sauce, Extra fromage, Menu enfant..."
                  />
                  <span className="text-[10px] text-white/40 normal-case">Options séparées par des virgules. Le Vendeur IA les proposera automatiquement au client.</span>
                </label>
              )}

              {/* SPECIFIC FIELD: DIGITAL LINK */}
              {businessCategory === "digital" && (
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                  Lien du Fichier / Accès (Google Drive, Notion, etc.)
                  <input
                    className="h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-emerald-400 outline-none focus:border-emerald-300 transition-all placeholder:text-white/20"
                    value={editingProduct ? (editingProduct.digitalUrl || "") : newProduct.digitalUrl}
                    onChange={e => editingProduct
                      ? setEditingProduct({...editingProduct, digitalUrl: e.target.value})
                      : setNewProduct({...newProduct, digitalUrl: e.target.value})
                    }
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <span className="text-[10px] text-white/40 normal-case">Ce lien sera envoyé automatiquement par le Vendeur IA dès confirmation du paiement client.</span>
                </label>
              )}

              {/* SPECIFIC FIELD: SERVICE DELIVERY */}
              {businessCategory === "services" && (
                <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                  Mode de délivrance
                  <select
                    className="h-12 rounded-xl bg-[#141815] border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all"
                    value={editingProduct ? (editingProduct.serviceDeliveryType || "Présentiel") : newProduct.serviceDeliveryType}
                    onChange={e => editingProduct
                      ? setEditingProduct({...editingProduct, serviceDeliveryType: e.target.value})
                      : setNewProduct({...newProduct, serviceDeliveryType: e.target.value})
                    }
                  >
                    <option value="Présentiel (En cabinet/boutique)">Présentiel (En cabinet / boutique)</option>
                    <option value="À domicile">À domicile</option>
                    <option value="En Ligne (Google Meet/Zoom)">En Ligne (Google Meet / Zoom)</option>
                  </select>
                </label>
              )}

              {/* Description Field */}
              <label className="grid gap-2 text-xs font-black uppercase tracking-widest text-white/60">
                Description détaillée
                <textarea
                  className="min-h-[100px] rounded-xl bg-white/5 border border-white/10 p-4 text-white outline-none focus:border-emerald-300 transition-all resize-none placeholder:text-white/20"
                  value={editingProduct ? (editingProduct.description || "") : newProduct.description}
                  onChange={e => editingProduct
                    ? setEditingProduct({...editingProduct, description: e.target.value})
                    : setNewProduct({...newProduct, description: e.target.value})
                  }
                  placeholder={
                    businessCategory === "services" ? "Expliquez le contenu de la séance ou prestation..." :
                    businessCategory === "digital" ? "Décrivez ce que le client apprendra ou téléchargera..." :
                    "Détails, caractéristiques, ingrédients..."
                  }
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full h-14 bg-emerald-400 hover:bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-emerald-400/20 disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 size={18} className="animate-spin" />
              ) : editingProduct ? (
                <Save size={18} />
              ) : (
                <Plus size={18} />
              )}
              {editingProduct ? "Enregistrer les modifications" : "Enregistrer et Publier"}
            </button>
          </form>
        </div>
      )}

      {/* Main Header */}
      <header id="tour-products-catalog" className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase">{config.title}</h1>
          <p className="text-white/40 mt-1 md:text-lg">Gérez vos {config.itemLabel.toLowerCase()}s et laissez le Vendeur IA conclure les transactions.</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-3">
          {config.showScanner && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-2 bg-sky-400 text-black px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-sky-500 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto"
            >
              <Camera size={18} /> Scanner
            </button>
          )}
          <button
            onClick={() => setIsAddingManual(true)}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-[10px] md:text-xs tracking-widest uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto",
              config.btnBg
            )}
          >
            {!config.showScanner ? <Zap size={18} /> : <Plus size={18} />}
            {config.actionButtonLabel}
          </button>
        </div>
      </header>

      {/* Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12">
            <VendeurIALoader size="lg" label="Chargement de votre catalogue..." />
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-white/20">
            {config.icon}
            <p className="font-black uppercase tracking-[0.2em] text-xs">Aucun {config.itemLabel.toLowerCase()} créé pour le moment</p>
          </div>
        ) : (
          products.map(p => (
            <div key={p._id} className="bg-[#0c0f0d] border border-white/10 rounded-3xl overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl flex flex-col justify-between">
              <div>
                <div className="aspect-square bg-white/5 flex items-center justify-center relative overflow-hidden">
                  {(p as any).imageUrl || (p as any).images?.[0] ? (
                    <img src={(p as any).imageUrl || (p as any).images?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {config.icon}
                      <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">{businessCategory}</span>
                    </div>
                  )}
                  {/* Pin as Featured Spotlight Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFeaturedMutation.mutate(p._id);
                    }}
                    disabled={toggleFeaturedMutation.isPending}
                    className={cn(
                      "absolute top-4 left-4 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md transition-all text-[10px] font-black uppercase tracking-wider z-10",
                      p.isFeatured
                        ? "bg-amber-400 text-black shadow-lg shadow-amber-400/30 scale-105"
                        : "bg-black/60 text-white/60 hover:text-amber-300 hover:bg-black/80 border border-white/10"
                    )}
                    title={p.isFeatured ? "Article en Vedette (cliquez pour retirer)" : "Mettre en Vedette sur la vitrine"}
                  >
                    <Star size={12} fill={p.isFeatured ? "currentColor" : "none"} />
                    <span>{p.isFeatured ? "En Vedette" : "Vedette"}</span>
                  </button>

                  <div className="absolute top-4 right-4 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">IA Active</span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-lg text-white line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-white/40">{p.digitalFormat || p.serviceDuration || p.category}</p>
                    </div>
                    <p className="font-black text-emerald-400 whitespace-nowrap">{p.price.toLocaleString()} {(p as any).currency || activeCurrency}</p>
                  </div>
                  {p.description && (
                    <p className="text-xs text-white/40 line-clamp-2">{p.description}</p>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  {config.showStock ? (
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
                  ) : (
                    <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border", config.badgeBg)}>
                      {businessCategory === "digital" ? (p.digitalFormat || "Accès Digital") :
                       businessCategory === "services" ? (p.serviceDuration ? `⏳ ${p.serviceDuration}` : (p.serviceDeliveryType || "Sur RDV")) :
                       businessCategory === "food" ? (p.preparationTime ? `⏱ ${p.preparationTime}` : "Au menu") : "Disponible"}
                    </span>
                  )}

                  <div className="flex gap-1.5 md:gap-2">
                    <button
                      onClick={() => setPosterProduct(p)}
                      className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                      title="Créer Affiche Statut WhatsApp / Story"
                    >
                      <ImageIcon size={16} />
                    </button>
                    <button
                      onClick={() => generateCaptionMutation.mutate(p._id)}
                      disabled={generateCaptionMutation.isPending}
                      className="p-2 bg-sky-500/10 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all flex items-center gap-2 group/btn"
                      title="Générer Légende TikTok/Insta par IA"
                    >
                      {generateCaptionMutation.isPending && generateCaptionMutation.variables === p._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <MessageSquareText size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingProduct(p)}
                      className="p-2 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 hover:text-white transition-all"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(p)}
                      className="p-2 bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500/20 transition-all"
                      title="Supprimer"
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

      {/* Step Milestone Progression Modal */}
      {(() => {
        const setupSteps = dashboard?.setupStatus?.steps || [];
        const isWhatsAppConnected = setupSteps.find((s: any) => s.id === 'whatsapp')?.completed;
        const isPaymentSetup = setupSteps.find((s: any) => s.id === 'payments')?.completed;
        const isDeliverySetup = setupSteps.find((s: any) => s.id === 'delivery')?.completed;

        let nextActionConfig = {
          label: "Étape suivante : Connecter WhatsApp",
          sublabel: "Reliez votre WhatsApp Business",
          href: "/settings?tab=connexions#whatsapp"
        };

        if (!isWhatsAppConnected) {
          nextActionConfig = {
            label: "Étape suivante : Connecter WhatsApp",
            sublabel: "Activez votre commercial sur WhatsApp",
            href: "/settings?tab=connexions#whatsapp"
          };
        } else if (!isPaymentSetup) {
          nextActionConfig = {
            label: "Étape suivante : Moyens de Paiement",
            sublabel: "Activez Mobile Money (Wave, OM, MTN)",
            href: "/settings?tab=boutique#payments"
          };
        } else if (!isDeliverySetup) {
          nextActionConfig = {
            label: "Étape suivante : Tarifs de Livraison",
            sublabel: "Définissez vos zones d'expédition",
            href: "/settings?tab=boutique#delivery"
          };
        } else {
          nextActionConfig = {
            label: "Tester mon Vendeur IA",
            sublabel: "Simulez une conversation de vente",
            href: "/dashboard?test_ia=true"
          };
        }

        const itemLabel = config?.itemLabel || "Article";
        const isService = businessCategory === "services";
        const isFood = businessCategory === "food";
        const isDigital = businessCategory === "digital";

        const modalTitle = isFood
          ? "Plat Ajouté au Menu !"
          : isService
          ? "Prestation Enregistrée !"
          : isDigital
          ? "Contenu Digital Enregistré !"
          : `${itemLabel} Ajouté !`;

        return (
          <StepMilestoneModal
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
            title={modalTitle}
            subtitle={`« ${lastAddedName || itemLabel} » est enregistré. Votre commercial IA connaît désormais ses spécificités et ses tarifs.`}
            score={dashboard?.setupStatus?.score || 50}
            primaryAction={nextActionConfig}
            secondaryAction={{
              label: isFood
                ? "Ajouter un autre plat"
                : isService
                ? "Ajouter une autre prestation"
                : isDigital
                ? "Ajouter un autre contenu"
                : `Ajouter un autre ${itemLabel.toLowerCase()}`,
              onClick: () => {
                setShowMilestoneModal(false);
                setIsAddingManual(true);
              }
            }}
            dashboardActionLabel="Retour au Tableau de Bord"
            autoRedirectSeconds={7}
            autoRedirectTo={nextActionConfig.href}
          />
        );
      })()}

      {/* Instant Studio V2 Poster Generator */}
      {posterProduct && (
        <PosterGenerator
          productData={{
            _id: posterProduct._id,
            name: posterProduct.name,
            price: posterProduct.price,
            category: posterProduct.category,
            imageUrl: (posterProduct as any).imageUrl || (posterProduct as any).images?.[0] || "",
            currency: (posterProduct as any).currency || activeCurrency
          }}
          boutiqueName={dashboard?.merchant?.businessName || tempData?.businessName || "Ma Boutique"}
          businessCategory={businessCategory}
          currency={(posterProduct as any).currency || activeCurrency}
          whatsappNumber={dashboard?.merchant?.whatsappNumber || ""}
          merchantId={dashboard?.merchant?._id || ""}
          onBack={() => setPosterProduct(null)}
          onSave={(_img) => setPosterProduct(null)}
        />
      )}
    </div>
  );
}
