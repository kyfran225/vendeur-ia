import React, { useState, useMemo, useEffect } from "react";
import { Package, Sparkles, Trash2, Edit, Camera, X, Save, Zap, Utensils, Laptop, Palette, Hammer, ShoppingBag, Loader2, MessageSquareText, Plus, Minus, Heart, Monitor, Home, ShoppingCart, Activity, Car, Box, Image as ImageIcon, Star, Search, LayoutGrid, List, ArrowUpDown, SlidersHorizontal, AlertCircle, Filter } from "lucide-react";
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
    icon: <ShoppingBag size={48} className="text-emerald-500/30" />,
    btnBg: "bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 font-black shadow-lg shadow-emerald-500/20",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Nouveau Produit"
  },
  food: {
    title: "Menu & Restauration",
    itemLabel: "Plat / Formule",
    stockLabel: "Disponibilité du jour",
    icon: <Utensils size={48} className="text-amber-500/30" />,
    btnBg: "bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    showScanner: true,
    showStock: false,
    actionButtonLabel: "Ajouter au Menu"
  },
  services: {
    title: "Mes Prestations & Services",
    itemLabel: "Service",
    stockLabel: "Créneaux",
    icon: <Zap size={48} className="text-sky-500/30" />,
    btnBg: "bg-sky-500 hover:bg-sky-600 text-white font-black shadow-lg shadow-sky-500/20",
    badgeBg: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    showScanner: false,
    showStock: false,
    actionButtonLabel: "Nouveau Service"
  },
  digital: {
    title: "Produits Digitaux & Formations",
    itemLabel: "Contenu Digital",
    stockLabel: "Accès",
    icon: <Laptop size={48} className="text-purple-500/30" />,
    btnBg: "bg-purple-600 hover:bg-purple-700 text-white font-black shadow-lg shadow-purple-500/20",
    badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    showScanner: false,
    showStock: false,
    actionButtonLabel: "Ajouter Contenu Digital"
  },
  artisan: {
    title: "Atelier & Créations",
    itemLabel: "Création",
    stockLabel: "En stock",
    icon: <Hammer size={48} className="text-orange-500/30" />,
    btnBg: "bg-orange-500 hover:bg-orange-600 text-white font-black shadow-lg shadow-orange-500/20",
    badgeBg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Création"
  },
  beauty: {
    title: "Cosmétiques & Soins",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <Heart size={48} className="text-pink-500/30" />,
    btnBg: "bg-pink-500 hover:bg-pink-600 text-white font-black shadow-lg shadow-pink-500/20",
    badgeBg: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Produit"
  },
  electronics: {
    title: "Stock High-Tech",
    itemLabel: "Appareil",
    stockLabel: "Stock",
    icon: <Monitor size={48} className="text-blue-500/30" />,
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20",
    badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Appareil"
  },
  home: {
    title: "Maison & Décoration",
    itemLabel: "Article",
    stockLabel: "Stock",
    icon: <Home size={48} className="text-indigo-500/30" />,
    btnBg: "bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-500/20",
    badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Article"
  },
  grocery: {
    title: "Épicerie & Équipement",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <ShoppingCart size={48} className="text-lime-500/30" />,
    btnBg: "bg-lime-600 hover:bg-lime-700 text-white font-black shadow-lg shadow-lime-500/20",
    badgeBg: "bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Produit"
  },
  health: {
    title: "Santé & Bien-être",
    itemLabel: "Produit",
    stockLabel: "Stock",
    icon: <Activity size={48} className="text-red-500/30" />,
    btnBg: "bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-500/20",
    badgeBg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Produit"
  },
  auto: {
    title: "Auto & Pièces Détachées",
    itemLabel: "Pièce",
    stockLabel: "Stock",
    icon: <Car size={48} className="text-slate-500/30" />,
    btnBg: "bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-950 font-black shadow-lg",
    badgeBg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    showScanner: true,
    showStock: true,
    actionButtonLabel: "Ajouter Pièce"
  },
  other: {
    title: "Mon Offre & Catalogue",
    itemLabel: "Article / Service",
    stockLabel: "Disponible",
    icon: <Box size={48} className="text-gray-500/30" />,
    btnBg: "bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 font-black shadow-lg shadow-emerald-500/20",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
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

  // Lock background scrolling when any modal is open
  useEffect(() => {
    const isModalOpen = Boolean(editingProduct || isAddingManual || isScannerOpen || deletingProduct || captionData.isOpen || showMilestoneModal);
    if (isModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [editingProduct, isAddingManual, isScannerOpen, deletingProduct, captionData.isOpen, showMilestoneModal]);

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

  // Search, Filter, Sort & View Mode States
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    return (localStorage.getItem("vendeur_catalog_view_mode") as "grid" | "list") || "grid";
  });
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock" | "featured">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "price_asc" | "price_desc" | "name_asc" | "stock_desc" | "stock_asc">("recent");

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    localStorage.setItem("vendeur_catalog_view_mode", mode);
  };

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category.trim()) cats.add(p.category.trim());
    });
    return Array.from(cats);
  }, [products]);

  const stockCounts = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let featured = 0;

    products.forEach(p => {
      if (p.isFeatured) featured++;
      if (config.showStock) {
        if (p.stock <= 0) outOfStock++;
        else if (p.stock <= 3) lowStock++;
        else inStock++;
      }
    });

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
      featured
    };
  }, [products, config.showStock]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.foodOptions && p.foodOptions.toLowerCase().includes(q)) ||
        (p.digitalFormat && p.digitalFormat.toLowerCase().includes(q))
      );
    }

    // Stock filter
    if (stockFilter === "featured") {
      result = result.filter(p => p.isFeatured);
    } else if (stockFilter === "in_stock") {
      result = result.filter(p => !config.showStock || p.stock > 0);
    } else if (stockFilter === "low_stock") {
      result = result.filter(p => config.showStock && p.stock > 0 && p.stock <= 3);
    } else if (stockFilter === "out_of_stock") {
      result = result.filter(p => config.showStock && p.stock <= 0);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(p => (p.category || "").toLowerCase() === categoryFilter.toLowerCase());
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "stock_desc") return (b.stock || 0) - (a.stock || 0);
      if (sortBy === "stock_asc") return (a.stock || 0) - (b.stock || 0);
      return 0; // default order
    });

    return result;
  }, [products, searchTerm, stockFilter, categoryFilter, sortBy, config.showStock]);

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
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-6 md:space-y-8 relative min-h-full pb-24 md:pb-12 animate-in fade-in duration-500 overflow-x-hidden">
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

      {/* Edit / Add Form Modal - Ultra-sleek 2-Column Desktop Experience */}
      {(editingProduct || isAddingManual) && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md transition-opacity" 
            onClick={() => { setEditingProduct(null); setIsAddingManual(false); }} 
          />
          
          <form
            onSubmit={editingProduct ? handleUpdate : handleManualCreate}
            className="relative w-full max-w-4xl bg-slate-50 dark:bg-[#0c1612] border border-slate-200/90 dark:border-white/10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-8 sm:py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-vendeur-emerald shrink-0">
                  {editingProduct ? <Edit size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <span>{editingProduct ? "Modifier" : "Ajouter"} {config.itemLabel}</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">
                    Configurez les détails et le visuel que le Vendeur IA présentera à vos clients sur WhatsApp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setEditingProduct(null); setIsAddingManual(false); }}
                className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body - 2 Columns on Desktop */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* LEFT COLUMN: Media & Visual Presentation (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {businessCategory !== "digital" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70 flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-emerald-600 dark:text-vendeur-emerald" />
                          Visuel de l'article
                        </span>
                        {(editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl) && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-vendeur-emerald border border-emerald-500/20">
                            Photo Active
                          </span>
                        )}
                      </div>

                      <div className="relative w-full">
                        <label className={cn(
                          "relative flex flex-col items-center justify-center w-full aspect-square max-h-72 lg:max-h-80 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-black/40 border-2 border-dashed border-slate-300 dark:border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden p-3 group text-center select-none shadow-inner",
                          analyzing && "opacity-75 cursor-wait border-sky-400/50"
                        )}>
                          {(editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl) ? (
                            <div className="relative w-full h-full">
                              <img
                                src={editingProduct ? (editingProduct as any).imageUrl : newProduct.imageUrl}
                                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                                alt="Preview"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                <span className="text-xs font-black uppercase tracking-wider text-white px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                                  <Camera size={14} /> Changer la photo
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-3 p-4">
                              {analyzing ? (
                                <>
                                  <div className="h-14 w-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 animate-pulse">
                                    <Loader2 size={28} className="animate-spin" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-sky-400 tracking-wider">Analyse par Vendeur IA...</p>
                                    <p className="text-[10px] text-slate-500 dark:text-white/40">Extraction du produit et des prix...</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="h-14 w-14 rounded-2xl bg-slate-200/70 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/40 group-hover:text-emerald-600 dark:group-hover:text-vendeur-emerald group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:scale-110 transition-all">
                                    <Camera size={26} />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">Importer une photo</p>
                                    <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium">Glissez une image ou cliquez pour parcourir</p>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={handleUnifiedPhotoUpload} disabled={analyzing} />
                        </label>
                      </div>

                      {/* AI Auto-fill Checkbox */}
                      {config.showScanner && (
                        <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={autoAnalyzeWithIA}
                            onChange={(e) => setAutoAnalyzeWithIA(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-white/70">
                            Auto-remplir le nom et prix par Vision IA
                          </span>
                        </label>
                      )}
                    </div>
                  ) : (
                    /* Digital products banner */
                    <div className="p-6 rounded-3xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-3 text-center">
                      <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                        <Laptop size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Produit Numérique</h4>
                        <p className="text-[11px] text-slate-500 dark:text-white/40 leading-relaxed">
                          La livraison s'effectue automatiquement via le lien d'accès sécurisé dès réception du paiement Mobile Money.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Product Attributes & Data (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Title / Name Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70 flex items-center justify-between">
                      <span>Nom de l'{config.itemLabel.toLowerCase()}</span>
                      <span className="text-[10px] text-slate-400 font-bold">* Requis</span>
                    </label>
                    <input
                      className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 px-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 shadow-inner"
                      value={editingProduct ? editingProduct.name : newProduct.name}
                      onChange={e => editingProduct
                        ? setEditingProduct({...editingProduct, name: e.target.value})
                        : setNewProduct({...newProduct, name: e.target.value})
                      }
                      required
                    />
                  </div>

                  {/* Price & Operational Specs Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Price Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70 flex items-center justify-between">
                        <span>Prix</span>
                        <span className="text-[10px] text-emerald-600 dark:text-vendeur-emerald font-black uppercase">{activeCurrency}</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 pl-4 pr-16 text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 shadow-inner"
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
                        <span className="absolute right-3 px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-[10px] font-black uppercase text-slate-600 dark:text-white/40 select-none">
                          {activeCurrency}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Field by Domain */}
                    {businessCategory === "digital" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70">
                          Format du Contenu
                        </label>
                        <select
                          className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-[#121814] border border-slate-300 dark:border-white/10 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
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
                      </div>
                    )}

                    {businessCategory === "services" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70">
                          Durée Estimée
                        </label>
                        <input
                          className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                          value={editingProduct ? (editingProduct.serviceDuration || "1h") : newProduct.serviceDuration}
                          onChange={e => editingProduct
                            ? setEditingProduct({...editingProduct, serviceDuration: e.target.value})
                            : setNewProduct({...newProduct, serviceDuration: e.target.value})
                          }
                          placeholder="ex: 45 min, 1h30"
                        />
                      </div>
                    )}

                    {businessCategory === "food" && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70">
                          Temps de Préparation
                        </label>
                        <input
                          className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 px-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                          value={editingProduct ? (editingProduct.preparationTime || "15-20 min") : newProduct.preparationTime}
                          onChange={e => editingProduct
                            ? setEditingProduct({...editingProduct, preparationTime: e.target.value})
                            : setNewProduct({...newProduct, preparationTime: e.target.value})
                          }
                          placeholder="ex: 15-20 min"
                        />
                      </div>
                    )}

                    {config.showStock && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70 flex items-center justify-between">
                          <span>{config.stockLabel}</span>
                          <span className="text-[10px] text-slate-400 dark:text-white/40">Unités</span>
                        </label>
                        <input
                          type="number"
                          className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                          value={editingProduct ? (isNaN(editingProduct.stock) ? "" : editingProduct.stock) : (isNaN(newProduct.stock) ? "" : newProduct.stock)}
                          onChange={e => {
                            const val = e.target.value === "" ? NaN : parseInt(e.target.value);
                            editingProduct
                              ? setEditingProduct({...editingProduct, stock: val})
                              : setNewProduct({...newProduct, stock: val});
                          }}
                          placeholder="1"
                        />
                      </div>
                    )}
                  </div>

                  {/* Domain Specific Extensions */}
                  {businessCategory === "food" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70">
                        Options & Formules d'accompagnement
                      </label>
                      <input
                        className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                        value={editingProduct ? (editingProduct.foodOptions || "") : newProduct.foodOptions}
                        onChange={e => editingProduct
                          ? setEditingProduct({...editingProduct, foodOptions: e.target.value})
                          : setNewProduct({...newProduct, foodOptions: e.target.value})
                        }
                        placeholder="ex: Sans sauce, Extra fromage, Frites incluses..."
                      />
                      <p className="text-[10px] text-slate-500 dark:text-white/40">Le Vendeur IA proposera spontanément ces choix aux clients lors de leur commande.</p>
                    </div>
                  )}

                  {businessCategory === "digital" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70">
                        Lien d'Accès Sécurisé (Google Drive, Notion, etc.)
                      </label>
                      <input
                        className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 px-4 text-sm text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20"
                        value={editingProduct ? (editingProduct.digitalUrl || "") : newProduct.digitalUrl}
                        onChange={e => editingProduct
                          ? setEditingProduct({...editingProduct, digitalUrl: e.target.value})
                          : setNewProduct({...newProduct, digitalUrl: e.target.value})
                        }
                        placeholder="https://drive.google.com/file/d/..."
                      />
                      <p className="text-[10px] text-slate-500 dark:text-white/40">Ce lien est délivré de manière automatisée et privée au client après paiement.</p>
                    </div>
                  )}

                  {businessCategory === "services" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70">
                        Mode de délivrance
                      </label>
                      <select
                        className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-[#121814] border border-slate-300 dark:border-white/10 px-4 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
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
                    </div>
                  )}

                  {/* Description Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/70 flex items-center justify-between">
                      <span>Description détaillée</span>
                      <span className="text-[10px] text-slate-500 dark:text-white/40">Contexte pour l'IA</span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 p-4 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-white/20 shadow-inner"
                      value={editingProduct ? (editingProduct.description || "") : newProduct.description}
                      onChange={e => editingProduct
                        ? setEditingProduct({...editingProduct, description: e.target.value})
                        : setNewProduct({...newProduct, description: e.target.value})
                      }
                      placeholder={
                        businessCategory === "services" ? "Expliquez le déroulement de la séance ou prestation..." :
                        businessCategory === "digital" ? "Décrivez ce que le client apprendra ou téléchargera..." :
                        "Détails des tailles, caractéristiques, conseils d'utilisation..."
                      }
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-4 sm:px-8 sm:py-5 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 flex items-center justify-between gap-4 shrink-0">
              <button
                type="button"
                onClick={() => { setEditingProduct(null); setIsAddingManual(false); }}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-12 px-5 sm:px-7 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : editingProduct ? (
                  <Save size={18} />
                ) : (
                  <Plus size={18} />
                )}
                <span>
                  {editingProduct ? (
                    <>
                      <span className="sm:hidden">Enregistrer</span>
                      <span className="hidden sm:inline">Enregistrer les modifications</span>
                    </>
                  ) : (
                    <>
                      <span className="sm:hidden">Publier</span>
                      <span className="hidden sm:inline">Publier l'article</span>
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Header */}
      <header id="tour-products-catalog" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{config.title}</h1>
          <p className="text-slate-500 dark:text-white/50 mt-1 text-xs sm:text-sm font-normal">Gérez vos {config.itemLabel.toLowerCase()}s et laissez le Vendeur IA conclure les transactions.</p>
        </div>
        <div className="flex flex-row gap-3 shrink-0">
          {config.showScanner && (
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-2 bg-sky-500 text-white px-4 md:px-6 py-3 md:py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Camera size={16} /> <span className="hidden xs:inline">Scanner</span>
            </button>
          )}
          <button
            onClick={() => setIsAddingManual(true)}
            className={cn(
              "flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 rounded-2xl text-[10px] md:text-xs tracking-widest uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex-1 sm:flex-none",
              config.btnBg
            )}
          >
            {!config.showScanner ? <Zap size={16} /> : <Plus size={16} />}
            <span className="truncate">{config.actionButtonLabel}</span>
          </button>
        </div>
      </header>

      {/* Search, Filters & View Toggle Toolbar */}
      {products.length > 0 && (
        <div className="bg-slate-100/90 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-sm backdrop-blur-sm">
          {/* Main Controls Row: Search Input + Category + Sort + Grid/List Toggle */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Rechercher un ${config.itemLabel.toLowerCase()}, prix, mot-clé...`}
                className="w-full h-11 pl-10 pr-9 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white p-0.5 rounded-full"
                  title="Effacer la recherche"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Controls Group */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Category Dropdown (if multiple categories) */}
              {uniqueCategories.length > 1 && (
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filtrer par catégorie"
                    className="w-full sm:w-auto h-11 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="all" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Toutes catégories</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Trier le catalogue"
                  className="w-full sm:w-auto h-11 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-zinc-200 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="recent" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Plus récents</option>
                  <option value="price_asc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Prix croissant</option>
                  <option value="price_desc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Prix décroissant</option>
                  <option value="name_asc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Nom (A-Z)</option>
                  {config.showStock && <option value="stock_desc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Stock (Décroissant)</option>}
                  {config.showStock && <option value="stock_asc" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">Stock (Croissant)</option>}
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-xl p-1 shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => handleViewModeChange("grid")}
                  className={cn(
                    "h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                  title="Vue Grille (Cartes)"
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">Grille</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange("list")}
                  className={cn(
                    "h-9 px-3 rounded-lg flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                  title="Vue Liste (Tableau dense)"
                >
                  <List size={15} />
                  <span className="hidden sm:inline">Liste</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter Status Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setStockFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 text-xs flex items-center gap-1.5 cursor-pointer",
                stockFilter === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-sm font-black"
                  : "bg-white dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-zinc-800"
              )}
            >
              <span>Tous</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                stockFilter === "all" ? "bg-white/20 dark:bg-black/15" : "bg-slate-100 dark:bg-white/10"
              )}>{stockCounts.total}</span>
            </button>

            {config.showStock && (
              <>
                <button
                  type="button"
                  onClick={() => setStockFilter("in_stock")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 text-xs flex items-center gap-1.5 cursor-pointer",
                    stockFilter === "in_stock"
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm font-black"
                      : "bg-white dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  <span>En stock</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                    stockFilter === "in_stock" ? "bg-black/15" : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  )}>{stockCounts.inStock + stockCounts.lowStock}</span>
                </button>

                {stockCounts.lowStock > 0 && (
                  <button
                    type="button"
                    onClick={() => setStockFilter("low_stock")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 text-xs flex items-center gap-1.5 cursor-pointer",
                      stockFilter === "low_stock"
                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black"
                        : "bg-white dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                    <span>Stock faible (≤3)</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                      stockFilter === "low_stock" ? "bg-black/15" : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                    )}>{stockCounts.lowStock}</span>
                  </button>
                )}

                {stockCounts.outOfStock > 0 && (
                  <button
                    type="button"
                    onClick={() => setStockFilter("out_of_stock")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border shrink-0 text-xs flex items-center gap-1.5 cursor-pointer",
                      stockFilter === "out_of_stock"
                        ? "bg-rose-500 text-white border-rose-500 shadow-sm font-black"
                        : "bg-white dark:bg-zinc-900/80 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-white/10 hover:border-rose-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
                    <span>En rupture</span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                      stockFilter === "out_of_stock" ? "bg-white/20" : "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                    )}>{stockCounts.outOfStock}</span>
                  </button>
                )}
              </>
            )}

            {stockCounts.featured > 0 && (
              <button
                type="button"
                onClick={() => setStockFilter("featured")}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-all border shrink-0 text-xs flex items-center gap-1.5 cursor-pointer",
                  stockFilter === "featured"
                    ? "bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400 shadow-sm"
                    : "bg-white hover:bg-amber-50 dark:bg-zinc-900 dark:hover:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-300/80 dark:border-amber-500/30"
                )}
              >
                <Star size={13} className="fill-amber-400 text-amber-500" />
                <span>En vedette</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                  stockFilter === "featured" ? "bg-slate-950/15 text-slate-950" : "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                )}>{stockCounts.featured}</span>
              </button>
            )}

            {(searchTerm || stockFilter !== "all" || categoryFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStockFilter("all");
                  setCategoryFilter("all");
                }}
                className="ml-auto text-[11px] font-bold text-slate-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 underline underline-offset-2 shrink-0 cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Catalog Display: Grid vs List */}
      {isLoading ? (
        <div className="py-12">
          <VendeurIALoader size="lg" label="Chargement de votre catalogue..." />
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[3rem] flex flex-col items-center justify-center gap-4 text-slate-400 dark:text-white/20">
          {config.icon}
          <p className="font-black uppercase tracking-[0.2em] text-xs">Aucun {config.itemLabel.toLowerCase()} créé pour le moment</p>
          <button
            onClick={() => setIsAddingManual(true)}
            className={cn("px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider font-black shadow-lg cursor-pointer", config.btnBg)}
          >
            {config.actionButtonLabel}
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 border border-slate-200 dark:border-white/10 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] flex flex-col items-center justify-center gap-3 text-center px-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Search size={22} />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">Aucun {config.itemLabel.toLowerCase()} ne correspond à vos critères</p>
          <p className="text-xs text-slate-500 dark:text-white/40 max-w-sm">
            Essayez de modifier votre recherche ou de réinitialiser vos filtres de stock et catégories.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStockFilter("all");
              setCategoryFilter("all");
            }}
            className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div key={p._id} className="bg-white dark:bg-[#0c1612] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden group hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md dark:shadow-xl flex flex-col justify-between text-slate-900 dark:text-white">
              <div>
                <div className="aspect-square bg-slate-100 dark:bg-black/40 flex items-center justify-center relative overflow-hidden">
                  {(p as any).imageUrl || (p as any).images?.[0] ? (
                    <img src={(p as any).imageUrl || (p as any).images?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={p.name} />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      {config.icon}
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/20 tracking-widest">{businessCategory}</span>
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
                      "absolute top-3.5 left-3.5 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider z-10 cursor-pointer transition-all shadow-md",
                      p.isFeatured
                        ? "bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-amber-400/30 scale-105"
                        : "bg-white/95 hover:bg-white text-slate-800 hover:text-amber-600 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:hover:text-amber-300 border border-slate-200 dark:border-white/20 backdrop-blur-md"
                    )}
                    title={p.isFeatured ? "Article en Vedette (cliquez pour retirer)" : "Mettre en Vedette sur la vitrine"}
                  >
                    <Star size={13} className={cn(p.isFeatured ? "fill-slate-950 text-slate-950" : "fill-amber-400 text-amber-500")} />
                    <span>{p.isFeatured ? "En Vedette" : "Vedette"}</span>
                  </button>

                  <div className="absolute top-4 right-4 bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 px-3 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
                    <span className="text-[10px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-widest">IA Active</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white line-clamp-1">{p.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-white/40">{p.digitalFormat || p.serviceDuration || p.category}</p>
                    </div>
                    <p className="font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{p.price.toLocaleString()} {(p as any).currency || activeCurrency}</p>
                  </div>
                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-white/40 line-clamp-2">{p.description}</p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 space-y-3">
                {/* Stock / Badge row */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 gap-2">
                  {config.showStock ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-slate-600 dark:text-white/60 shrink-0">{config.stockLabel}:</span>
                      <div className="flex items-center bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStockMutation.mutate({ id: p._id, stock: Math.max(0, p.stock - 1) });
                          }}
                          disabled={updateStockMutation.isPending}
                          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-30 cursor-pointer"
                          title="Diminuer stock"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-white">
                          {updateStockMutation.isPending && updateStockMutation.variables?.id === p._id
                            ? <Loader2 size={11} className="animate-spin inline" />
                            : p.stock
                          }
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStockMutation.mutate({ id: p._id, stock: p.stock + 1 });
                          }}
                          disabled={updateStockMutation.isPending}
                          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-30 cursor-pointer"
                          title="Augmenter stock"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider border truncate max-w-[150px]", config.badgeBg)}>
                      {businessCategory === "digital" ? (p.digitalFormat || "Accès Digital") :
                       businessCategory === "services" ? (p.serviceDuration ? `⏳ ${p.serviceDuration}` : (p.serviceDeliveryType || "Sur RDV")) :
                       businessCategory === "food" ? (p.preparationTime ? `⏱ ${p.preparationTime}` : "Au menu") : "Disponible"}
                    </span>
                  )}

                  {/* Action buttons with enlarged comfortable tap target */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => setPosterProduct(p)}
                      className="h-9 w-9 sm:h-9 sm:w-9 flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 rounded-xl hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 active:scale-95 transition-all cursor-pointer shadow-sm"
                      title="Créer Affiche Statut WhatsApp / Story"
                    >
                      <ImageIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => generateCaptionMutation.mutate(p._id)}
                      disabled={generateCaptionMutation.isPending}
                      className="h-9 w-9 sm:h-9 sm:w-9 flex items-center justify-center bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 rounded-xl hover:bg-sky-500/20 dark:hover:bg-sky-500/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                      title="Générer Légende TikTok/Insta par IA"
                    >
                      {generateCaptionMutation.isPending && generateCaptionMutation.variables === p._id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <MessageSquareText size={16} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="h-9 w-9 sm:h-9 sm:w-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-white/10 active:scale-95 transition-all cursor-pointer shadow-sm"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(p)}
                      className="h-9 w-9 sm:h-9 sm:w-9 flex items-center justify-center bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 rounded-xl hover:bg-rose-500/20 dark:hover:bg-rose-500/30 active:scale-95 transition-all cursor-pointer shadow-sm"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="bg-white dark:bg-[#0c1612] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredProducts.map(p => (
              <div
                key={p._id}
                className="p-3 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4"
              >
                {/* Left: Thumbnail + Title + Meta */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-black/40 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-white/10">
                    {(p as any).imageUrl || (p as any).images?.[0] ? (
                      <img src={(p as any).imageUrl || (p as any).images?.[0]} className="w-full h-full object-cover" alt={p.name} />
                    ) : (
                      <div className="scale-75">{config.icon}</div>
                    )}
                    {p.isFeatured && (
                      <div className="absolute top-1 left-1 bg-amber-400 text-slate-950 p-0.5 rounded shadow-sm" title="En Vedette">
                        <Star size={10} className="fill-slate-950 text-slate-950" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">{p.name}</h3>
                      {p.isFeatured && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-400/30 uppercase tracking-wider">
                          ⭐ Vedette
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/40 mt-0.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-slate-700 dark:text-zinc-300">
                        {p.category || businessCategory}
                      </span>
                      {p.description && (
                        <span className="truncate max-w-xs sm:max-w-md hidden xs:inline">{p.description}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Price + Stock Controls + Actions */}
                <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/5">
                  {/* Price */}
                  <div className="text-left md:text-right min-w-[90px]">
                    <div className="font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400">
                      {p.price.toLocaleString()} {(p as any).currency || activeCurrency}
                    </div>
                  </div>

                  {/* Stock adjuster */}
                  {config.showStock ? (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 px-1 py-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStockMutation.mutate({ id: p._id, stock: Math.max(0, p.stock - 1) });
                        }}
                        disabled={updateStockMutation.isPending}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Diminuer stock"
                      >
                        <Minus size={13} />
                      </button>
                      <span className={cn(
                        "w-8 text-center text-xs font-black",
                        p.stock === 0 ? "text-rose-600 dark:text-rose-400" : p.stock <= 3 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"
                      )}>
                        {updateStockMutation.isPending && updateStockMutation.variables?.id === p._id
                          ? <Loader2 size={11} className="animate-spin inline" />
                          : p.stock
                        }
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStockMutation.mutate({ id: p._id, stock: p.stock + 1 });
                        }}
                        disabled={updateStockMutation.isPending}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-30 cursor-pointer"
                        title="Augmenter stock"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border truncate max-w-[120px]", config.badgeBg)}>
                      {businessCategory === "digital" ? (p.digitalFormat || "Digital") :
                       businessCategory === "services" ? (p.serviceDuration || "Sur RDV") :
                       businessCategory === "food" ? (p.preparationTime || "Au menu") : "Dispo"}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFeaturedMutation.mutate(p._id)}
                      disabled={toggleFeaturedMutation.isPending}
                      className={cn(
                        "h-8.5 w-8.5 flex items-center justify-center rounded-lg transition-all cursor-pointer shadow-xs",
                        p.isFeatured
                          ? "bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-amber-400/20"
                          : "bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-400 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-400 border border-slate-200 dark:border-white/10"
                      )}
                      title={p.isFeatured ? "Retirer de la vedette" : "Mettre en vedette"}
                    >
                      <Star size={14} className={cn(p.isFeatured ? "fill-slate-950 text-slate-950" : "fill-none text-current")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosterProduct(p)}
                      className="h-8.5 w-8.5 flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 rounded-lg transition-all cursor-pointer"
                      title="Créer Affiche Statut"
                    >
                      <ImageIcon size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => generateCaptionMutation.mutate(p._id)}
                      disabled={generateCaptionMutation.isPending}
                      className="h-8.5 w-8.5 flex items-center justify-center bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20 dark:hover:bg-sky-500/30 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                      title="Légende IA"
                    >
                      {generateCaptionMutation.isPending && generateCaptionMutation.variables === p._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <MessageSquareText size={14} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="h-8.5 w-8.5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                      title="Modifier"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(p)}
                      className="h-8.5 w-8.5 flex items-center justify-center bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 rounded-lg transition-all cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Milestone Progression Modal */}
      {(() => {
        const setupSteps = dashboard?.setupStatus?.steps || [];
        const isPaymentSetup = Boolean(setupSteps.find((s: any) => s.id === 'payments')?.completed);
        const isDeliverySetup = Boolean(setupSteps.find((s: any) => s.id === 'delivery')?.completed);
        const isSubscriptionActive = Boolean(setupSteps.find((s: any) => s.id === 'subscription')?.completed);

        let nextActionConfig = {
          label: "Configurer mes Moyens de Paiement",
          sublabel: "Activez Mobile Money (Wave, OM, MTN)",
          href: "/settings?tab=boutique#payments"
        };

        if (!isPaymentSetup) {
          nextActionConfig = {
            label: "Configurer mes Moyens de Paiement",
            sublabel: "Wave, Orange Money, MTN, Moov",
            href: "/settings?tab=boutique#payments"
          };
        } else if (!isDeliverySetup) {
          nextActionConfig = {
            label: "Définir mes Tarifs de Livraison",
            sublabel: "Configurez vos zones d'expédition",
            href: "/settings?tab=boutique#delivery"
          };
        } else if (!isSubscriptionActive) {
          nextActionConfig = {
            label: "Activer mon Forfait 24h/24",
            sublabel: "Lancez votre Vendeur IA autonome",
            href: "/offers"
          };
        } else {
          nextActionConfig = {
            label: "Tester mon Vendeur IA",
            sublabel: "Simulez une conversation dans le bac à sable",
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
