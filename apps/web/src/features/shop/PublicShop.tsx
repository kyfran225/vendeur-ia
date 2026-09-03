import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MessageCircle,
  ShoppingCart,
  ShoppingBag,
  Search,
  Star,
  Package,
  Zap,
  Clock,
  ShieldCheck,
  Globe,
  Sparkles,
  X,
  Utensils,
  Laptop,
  Calendar,
  Heart,
  Monitor,
  Home,
  Activity,
  Car,
  Hammer,
  Box,
  Download,
  Share2,
  Flame,
  Film,
  Grid,
  Plus,
  Instagram,
  Facebook,
  Sun,
  Moon
} from "lucide-react";
import { getShopTheme, type ShopTheme } from "./lib/theme";

const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 16 16" className={`shrink-0 ${className}`}>
    <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.38 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
  </svg>
);
import { WebChatWidget } from "./components/WebChatWidget";
import { CartDrawer, type CartItem } from "./components/CartDrawer";
import { StoryViewerModal } from "./components/StoryViewerModal";
import { VoiceSearchButton } from "./components/VoiceSearchButton";
import { SocialProofBanner } from "./components/SocialProofBanner";
import { ShareShopModal } from "./components/ShareShopModal";
import { HeroProductShowcase } from "./components/HeroProductShowcase";
import { MetaHead } from "@/components/seo/MetaHead";
import { SITE_CONFIG } from "@/lib/seoConfig";
import { apiClient } from "@/lib/apiClient";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { slugify } from "@/lib/slugify";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Category Configuration for the Public Storefront ──────────────────────
const SHOP_CONFIGS: Record<string, {
  heroLine1: string;
  heroLine2: string;
  heroSub: string;
  ctaLabel: string;
  ctaModalLabel: string;
  infoLabel: string;
  buildWhatsAppMessage: (businessName: string, product: any) => string;
  showStock: boolean;
  productHint: (product: any) => string | null;
}> = {
  fashion: {
    heroLine1: "Le style qui vous ressemble,",
    heroLine2: "livré en un clic.",
    heroSub: "Découvrez notre collection exclusive de mode & accessoires, sélectionnés avec passion.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander sur WhatsApp",
    infoLabel: "Infos taille / couleur",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe suis intéressé(e) par cet article vu sur votre boutique :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nEst-il disponible et en quelle taille / couleur ?`,
    showStock: true,
    productHint: () => null
  },
  food: {
    heroLine1: "Saveurs authentiques,",
    heroLine2: "livrées chez vous.",
    heroSub: "Découvrez notre carte du jour, préparez votre commande et régalez-vous.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander ce plat",
    infoLabel: "Voir la carte complète",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe souhaite commander :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}${p.preparationTime ? `\n⏱ Préparation : ${p.preparationTime}` : ""}\n\nEst-ce disponible ? Je souhaite : ⬜ Sur place  ⬜ À emporter  ⬜ Livraison`,
    showStock: false,
    productHint: (p) => p.preparationTime ? `⏱ ${p.preparationTime}` : null
  },
  services: {
    heroLine1: "Des experts à votre service,",
    heroLine2: "en ligne ou en présentiel.",
    heroSub: "Réservez votre séance en quelques secondes. Notre équipe vous accompagne à chaque étape.",
    ctaLabel: "Réserver",
    ctaModalLabel: "Réserver une séance",
    infoLabel: "En savoir plus",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe souhaite réserver :\n\n*${p.name}*\n💰 Tarif : ${p.price.toLocaleString()} ${p.currency || "XOF"}${p.serviceDuration ? `\n⏳ Durée : ${p.serviceDuration}` : ""}${p.serviceDeliveryType ? `\n📍 Mode : ${p.serviceDeliveryType}` : ""}\n\nQuels sont vos prochains créneaux disponibles ?`,
    showStock: false,
    productHint: (p) => p.serviceDuration ? `⏳ ${p.serviceDuration}${p.serviceDeliveryType ? ` · ${p.serviceDeliveryType}` : ""}` : null
  },
  digital: {
    heroLine1: "Formations & contenus,",
    heroLine2: "accès immédiat.",
    heroSub: "Téléchargez ou accédez instantanément à vos formations, e-books et groupes VIP dès réception du paiement.",
    ctaLabel: "Obtenir l'accès",
    ctaModalLabel: "Obtenir l'accès instantané",
    infoLabel: "En savoir plus",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe souhaite accéder à :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}${p.digitalFormat ? `\n📁 Format : ${p.digitalFormat}` : ""}\n\nComment procéder au paiement pour recevoir l'accès immédiatement ?`,
    showStock: false,
    productHint: (p) => p.digitalFormat ? `📁 ${p.digitalFormat}` : "⚡ Accès immédiat"
  },
  beauty: {
    heroLine1: "Prenez soin de vous,",
    heroLine2: "avec les meilleurs soins.",
    heroSub: "Cosmétiques, soins du visage, beauté naturelle. Des produits sélectionnés pour révéler votre éclat.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander sur WhatsApp",
    infoLabel: "Conseils d'utilisation",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe suis intéressé(e) par :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nPourriez-vous me donner plus d'infos sur ce produit et les conseils d'utilisation ?`,
    showStock: true,
    productHint: () => null
  },
  electronics: {
    heroLine1: "High-Tech & Électronique,",
    heroLine2: "au meilleur prix.",
    heroSub: "Smartphones, ordinateurs, accessoires. Produits neufs et reconditionnés avec garantie.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander sur WhatsApp",
    infoLabel: "Fiche technique",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe suis intéressé(e) par :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nPourriez-vous m'indiquer la fiche technique complète et la disponibilité ?`,
    showStock: true,
    productHint: () => null
  },
  home: {
    heroLine1: "Décorez votre intérieur",
    heroLine2: "à votre image.",
    heroSub: "Meubles, déco, accessoires de maison. Des pièces uniques pour sublimer chaque espace.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander sur WhatsApp",
    infoLabel: "Voir les dimensions",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe suis intéressé(e) par :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nPourriez-vous me communiquer les dimensions exactes et les matériaux ?`,
    showStock: true,
    productHint: () => null
  },
  grocery: {
    heroLine1: "L'épicerie du quartier,",
    heroLine2: "directement chez vous.",
    heroSub: "Produits frais, en gros ou au détail. Commandez vos essentiels en quelques secondes sur WhatsApp.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander sur WhatsApp",
    infoLabel: "Infos produit",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe souhaite commander :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nQuelle est la disponibilité ? Proposez-vous des packs ou des lots ?`,
    showStock: true,
    productHint: () => null
  },
  health: {
    heroLine1: "Prenez soin de votre santé,",
    heroLine2: "naturellement.",
    heroSub: "Compléments, bien-être, produits de santé naturels. Des solutions pour prendre soin de vous au quotidien.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander sur WhatsApp",
    infoLabel: "Conseils d'usage",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe suis intéressé(e) par :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nPourriez-vous me donner plus d'infos sur ce produit et les conseils d'utilisation ?`,
    showStock: true,
    productHint: () => null
  },
  auto: {
    heroLine1: "Pièces auto & moto,",
    heroLine2: "référencées et disponibles.",
    heroSub: "Pièces détachées, accessoires véhicules. Compatibilité garantie avec votre modèle sur WhatsApp.",
    ctaLabel: "Vérifier la compatibilité",
    ctaModalLabel: "Vérifier la compatibilité",
    infoLabel: "Référence & compatibilité",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe cherche :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nPourriez-vous confirmer la compatibilité avec mon véhicule ? Je vais préciser la marque/modèle/année.`,
    showStock: true,
    productHint: () => null
  },
  artisan: {
    heroLine1: "Créations uniques,",
    heroLine2: "faites à la main.",
    heroSub: "Artisanat authentique, pièces uniques et commandes personnalisées. Chaque création raconte une histoire.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander ou personnaliser",
    infoLabel: "Personnaliser",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe suis intéressé(e) par cette création :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nEst-elle disponible ? Proposez-vous des commandes personnalisées ?`,
    showStock: true,
    productHint: () => null
  },
  other: {
    heroLine1: "Découvrez notre catalogue",
    heroLine2: "et nos offres exclusives.",
    heroSub: "Produits et services sélectionnés avec soin. Commandez directement sur WhatsApp en quelques secondes.",
    ctaLabel: "Commander",
    ctaModalLabel: "Commander sur WhatsApp",
    infoLabel: "Infos & disponibilité",
    buildWhatsAppMessage: (name, p) =>
      `Bonjour ${name} !\nJe suis intéressé(e) par :\n\n*${p.name}*\n💰 Prix : ${p.price.toLocaleString()} ${p.currency || "XOF"}\n\nEst-il toujours disponible ?`,
    showStock: true,
    productHint: () => null
  }
};

const DEFAULT_SHOP_CONFIG = SHOP_CONFIGS.other;

function getCategoryIcon(category: string, size = 120, className = "text-vendeur-emerald/20") {
  const icons: Record<string, React.ReactNode> = {
    fashion: <ShoppingBag size={size} className={className} />,
    food: <Utensils size={size} className={className} />,
    services: <Calendar size={size} className={className} />,
    digital: <Laptop size={size} className={className} />,
    beauty: <Heart size={size} className={className} />,
    electronics: <Monitor size={size} className={className} />,
    home: <Home size={size} className={className} />,
    grocery: <ShoppingCart size={size} className={className} />,
    health: <Activity size={size} className={className} />,
    auto: <Car size={size} className={className} />,
    artisan: <Hammer size={size} className={className} />,
    other: <Box size={size} className={className} />
  };
  return icons[category] || icons.other;
}

function getCtaIcon(category: string) {
  if (category === "digital") return <Download size={20} />;
  if (category === "services") return <Calendar size={20} />;
  return <ShoppingCart size={20} />;
}

export function PublicShop() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // New State additions for Interactive Shopping & Story Engine
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

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
      <VendeurIALoader fullscreen size="xl" label="Chargement de la vitrine..." />
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[100dvh] bg-vendeur-bg flex items-center justify-center p-8 text-center">
        <div className="max-w-sm space-y-6">
          <X className="text-rose-500 mx-auto" size={64} />
          <h1 className="text-2xl font-black uppercase text-white">Boutique Introuvable</h1>
          <p className="text-white/40 text-sm">Cette boutique n&apos;existe pas ou a été temporairement désactivée.</p>
        </div>
      </div>
    );
  }

  const { merchant, products } = data;
  const shopCfg = SHOP_CONFIGS[merchant.category] || DEFAULT_SHOP_CONFIG;

  const categories: string[] = ["all", ...Array.from(new Set(products.map((p: any) => p.category).filter(Boolean))) as string[]];

  const filteredProducts = products.filter((p: any) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Story generation from catalog
  const stories = products.slice(0, 6).map((prod: any, idx: number) => ({
    id: prod._id,
    title: prod.name,
    tag: idx === 0 ? "Tendance" : idx === 1 ? "Coup de cœur" : "Sélection",
    product: prod,
    highlightText: idx === 0 ? "Le plus demandé" : "Disponible immédiatement"
  }));

  // Cart operations
  const handleAddToCart = (product: any) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        toast.success(`Quantité augmentée : ${product.name}`);
        return prev.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`Ajouté au panier : ${product.name}`);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product._id !== productId));
    toast.info("Article retiré du panier.");
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleWhatsAppCTA = (product: any) => {
    const enrichedProduct = {
      ...product,
      currency: product.currency || merchant.currency || "XOF"
    };
    const msg = shopCfg.buildWhatsAppMessage(merchant.businessName, enrichedProduct);
    window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleWhatsAppInfo = (product: any) => {
    const msg = encodeURIComponent(`Bonjour ${merchant.businessName}, je souhaite plus d'informations sur : *${product.name}*`);
    window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, "")}?text=${msg}`, "_blank");
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const merchantSlug = merchant?.slug || (merchant?.businessName ? slugify(merchant.businessName) : merchantId);
  const shopUrl = `${window.location.origin}/shop/${merchantSlug}`;
  const theme = getShopTheme(merchant?.branding?.accentColor);

  // Storefront Adaptive Theme Engine (Merchant default + Visitor 1-click override)
  const defaultStorefrontMode = merchant?.branding?.storefrontTheme || "dark";
  const [shopThemeMode, setShopThemeMode] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const localPref = localStorage.getItem(`shop_theme_${merchantId}`);
    if (localPref === "light" || localPref === "dark") return localPref;
    if (defaultStorefrontMode === "light") return "light";
    if (defaultStorefrontMode === "dark") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const toggleShopTheme = () => {
    const next = shopThemeMode === "dark" ? "light" : "dark";
    setShopThemeMode(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(`shop_theme_${merchantId}`, next);
    }
  };

  const isDark = shopThemeMode === "dark";

  return (
    <div className={cn("min-h-[100dvh] pb-24 transition-colors duration-200 selection:bg-emerald-500 selection:text-black font-sans", isDark ? "dark bg-[#07100d] text-white" : "light bg-[#f8fafc] text-slate-900")}>
      <MetaHead
        title={`${merchant.businessName} | Boutique Officielle WhatsApp Vendeur IA`}
        description={`Achetez directement chez ${merchant.businessName} (${merchant.category}). Commandes instantanées et réponses 24/7 via WhatsApp sur Vendeur IA.`}
        keywords={[
          merchant.businessName,
          `boutique ${merchant.businessName}`,
          `achats ${merchant.category}`,
          "vendeur IA boutique",
          "whatsapp commerce"
        ]}
        canonicalUrl={`${SITE_CONFIG.baseUrl}/shop/${merchantSlug}`}
        schemaRaw={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: merchant.businessName,
          description: merchant.description || `Boutique officielle ${merchant.businessName} propulsée par Vendeur IA.`,
          address: {
            "@type": "PostalAddress",
            addressLocality: merchant.city || "",
            addressCountry: merchant.country || ""
          },
          telephone: merchant.whatsappNumber
        }}
      />

      {/* Top Flash Announcement Banner */}
      {merchant?.branding?.announcement?.enabled && merchant?.branding?.announcement?.text && (
        <div
          className="text-slate-950 px-4 py-2 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-4 duration-300"
          style={{ background: `linear-gradient(90deg, #F59E0B, #EC4899, ${theme.primary})` }}
        >
          <span>{merchant.branding.announcement.text}</span>
        </div>
      )}

      {/* Header / Branding */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#07100d]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={cn("h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center text-slate-950 shadow-lg overflow-hidden shrink-0", theme.bgClass, theme.shadowClass)}>
              {merchant?.branding?.logoUrl ? (
                <img src={merchant.branding.logoUrl} alt={merchant.businessName} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={24} />
              )}
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">{merchant.businessName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className={cn("text-[9px] md:text-[10px] font-black uppercase tracking-widest", theme.textClass)}>
                  {merchant?.branding?.openingHours ? `Ouvert • ${merchant.branding.openingHours.split("(")[0]}` : "Propulsé par Vendeur IA"}
                </p>
                {merchant?.branding?.socialLinks?.instagram && (
                  <a
                    href={merchant.branding.socialLinks.instagram.startsWith("http") ? merchant.branding.socialLinks.instagram : `https://instagram.com/${merchant.branding.socialLinks.instagram.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-rose-500 dark:text-white/40 dark:hover:text-rose-400 transition-colors"
                    title="Instagram"
                  >
                    <Instagram size={13} />
                  </a>
                )}
                {merchant?.branding?.socialLinks?.tiktok && (
                  <a
                    href={merchant.branding.socialLinks.tiktok.startsWith("http") ? merchant.branding.socialLinks.tiktok : `https://tiktok.com/@${merchant.branding.socialLinks.tiktok.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-cyan-500 dark:text-white/40 dark:hover:text-cyan-400 transition-colors"
                    title="TikTok"
                  >
                    <TikTokIcon size={13} />
                  </a>
                )}
                {merchant?.branding?.socialLinks?.facebook && (
                  <a
                    href={merchant.branding.socialLinks.facebook.startsWith("http") ? merchant.branding.socialLinks.facebook : `https://facebook.com/${merchant.branding.socialLinks.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-500 dark:text-white/40 dark:hover:text-blue-400 transition-colors"
                    title="Facebook"
                  >
                    <Facebook size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 md:gap-3">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="h-10 md:h-12 px-3 md:px-4 rounded-2xl bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
              title="Partager le lien & QR Code"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline text-[10px]">Partager</span>
            </button>

            {/* ☀️/🌙 1-Click Storefront Visitor Theme Toggle */}
            <button
              type="button"
              onClick={toggleShopTheme}
              className="h-10 md:h-12 w-10 md:w-12 rounded-2xl bg-slate-100 hover:bg-slate-200/70 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-all shadow-sm cursor-pointer active:scale-95"
              title={isDark ? "Passer en mode clair ☀️" : "Passer en mode sombre 🌙"}
              aria-label="Changer le thème de la boutique"
            >
              {isDark ? (
                <Sun size={18} className="text-amber-400" />
              ) : (
                <Moon size={18} className="text-slate-700" />
              )}
            </button>

            {/* Floating Cart Trigger in Header */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative h-10 md:h-12 px-4 md:px-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black uppercase text-xs tracking-wider flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Panier</span>
              {totalCartCount > 0 && (
                <span className={cn("h-5 w-5 rounded-full text-slate-950 text-[10px] font-black flex items-center justify-center shadow", theme.bgClass)}>
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, "")}`, "_blank")}
              className={cn("hidden md:flex h-12 px-6 text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer", theme.bgClass, theme.hoverBgClass, theme.shadowClass)}
            >
              <MessageCircle size={18} />
              Contact Direct
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 space-y-10">
        
        {/* Story Circle Showcase Bar */}
        {stories.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white/80">
                  Stories &amp; Nouveautés Flash
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedStoryIndex(0);
                  setIsStoryModalOpen(true);
                }}
                className={cn("text-[10px] font-black uppercase tracking-wider hover:underline flex items-center gap-1", theme.textClass)}
              >
                <Film size={12} />
                <span>Voir tout (Reels)</span>
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {stories.map((story: any, index: number) => (
                <button
                  key={story.id}
                  onClick={() => {
                    setSelectedStoryIndex(index);
                    setIsStoryModalOpen(true);
                  }}
                  className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer"
                >
                  <div className="p-1 rounded-full bg-gradient-to-tr from-emerald-500 via-amber-400 to-rose-500 group-hover:scale-105 transition-transform">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-100 dark:bg-[#0d1f18] p-0.5 overflow-hidden">
                      {story.product.images?.[0] || story.product.imageUrl ? (
                        <img
                          src={story.product.images?.[0] || story.product.imageUrl}
                          alt={story.title}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/20">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-white/70 max-w-[70px] truncate text-center group-hover:text-slate-950 dark:group-hover:text-white">
                    {story.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Hero Section — Category Adaptive & Cover Image */}
        <section className="relative overflow-hidden rounded-3xl md:rounded-[3rem] bg-white dark:bg-[#0d1f18] border border-slate-200/80 dark:border-white/5 p-5 sm:p-8 md:p-12 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 group min-h-[380px] shadow-xl">
          {merchant?.branding?.coverUrl && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img
                src={merchant.branding.coverUrl}
                alt="Bannière de couverture"
                className="w-full h-full object-cover opacity-20 dark:opacity-25 scale-105 group-hover:scale-100 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0d1f18] via-white/80 dark:via-[#0d1f18]/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#0d1f18] via-white/90 dark:via-[#0d1f18]/90 to-transparent" />
            </div>
          )}

          <div className="relative z-10 space-y-4 md:space-y-6 text-center md:text-left max-w-xl">
            <span className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border", theme.badgeBgClass, theme.badgeBorderClass, theme.textClass)}>
              Boutique Officielle Certifiée
            </span>
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95] text-slate-900 dark:text-white">
              {shopCfg.heroLine1}<br />
              <span className={theme.textClass}>{shopCfg.heroLine2}</span>
            </h2>
            <p className="text-slate-600 dark:text-white/50 text-sm md:text-base font-medium leading-relaxed">
              {merchant.description || shopCfg.heroSub}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={() => window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, "")}`, "_blank")}
                className={cn("inline-flex items-center gap-2 h-14 px-6 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer", theme.bgClass, theme.hoverBgClass, theme.shadowClass)}
              >
                <MessageCircle size={18} />
                WhatsApp Direct
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-2 h-14 px-6 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <ShoppingCart size={18} />
                Voir le Panier ({totalCartCount})
              </button>
            </div>
          </div>

          {/* Dynamic Interactive Product Showcase Carousel */}
          <HeroProductShowcase
            products={products}
            currency={merchant.currency || "XOF"}
            merchant={merchant}
            theme={theme}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p) => handleAddToCart(p)}
          />

          <div className={cn("absolute -top-24 -right-24 h-96 w-96 blur-[120px] rounded-full pointer-events-none opacity-20", theme.bgClass)} />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        </section>

        {/* Social Proof & Trust Metrics Bar */}
        <SocialProofBanner merchant={merchant} productCount={products.length} />

        {/* Filters & Search */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
              {categories.map((cat: string) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-5 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border cursor-pointer",
                    selectedCategory === cat
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xl"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 border-slate-200 dark:border-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {cat === "all" ? "Tous les articles" : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full md:w-96">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={18} />
                <input
                  className={cn("w-full h-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none transition-all shadow-sm", theme.ringClass)}
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Voice Search Recognition */}
              <VoiceSearchButton onSearch={(query) => setSearchQuery(query)} />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((p: any) => {
              const hint = shopCfg.productHint(p);
              return (
                <div
                  key={p._id}
                  className="group bg-white dark:bg-[#0d1f18] border border-slate-200/80 dark:border-white/5 rounded-3xl overflow-hidden hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col shadow-sm hover:shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-black/40">
                    {p.images?.[0] || p.imageUrl ? (
                      <img
                        src={p.images?.[0] || p.imageUrl}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        alt={p.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-white/20">
                        <Package size={48} />
                      </div>
                    )}

                    {shopCfg.showStock && p.stock <= 5 && p.stock > 0 && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-rose-500 text-white text-[8px] font-black uppercase rounded-lg shadow-lg">
                        Stock Limité
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="h-11 w-11 rounded-2xl bg-white text-slate-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg cursor-pointer"
                        title="Voir le détail"
                      >
                        <Search size={18} />
                      </button>
                      <button
                        onClick={() => handleAddToCart(p)}
                        className={cn("h-11 w-11 rounded-2xl text-slate-950 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg cursor-pointer", theme.bgClass, theme.shadowClass)}
                        title="Ajouter au panier"
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1", theme.textClass)}>
                        {p.category || "Article"}
                      </p>
                      <h3 className="text-base font-black uppercase tracking-tight line-clamp-1 text-slate-900 dark:text-white">{p.name}</h3>
                      <p className="text-slate-600 dark:text-white/40 text-xs mt-1.5 line-clamp-2 font-medium">
                        {p.description || "Aucune description détaillée."}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-black text-slate-950 dark:text-white">
                          {p.price.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-500 dark:text-white/40 ml-1">
                            {p.currency || merchant.currency || "XOF"}
                          </span>
                        </p>
                        {hint ? (
                          <span className="text-[9px] font-black text-slate-500 dark:text-white/30 uppercase tracking-wider text-right max-w-[100px] leading-tight">
                            {hint}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                            <Star size={10} fill="currentColor" />
                            <span className="text-[9px] font-black uppercase">Exclusif</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons: Cart + WhatsApp */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="h-11 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase text-[9px] tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <Plus size={14} className={theme.textClass} />
                          <span>Panier</span>
                        </button>

                        <button
                          onClick={() => handleWhatsAppCTA(p)}
                          className={cn("h-11 text-slate-950 font-black uppercase text-[9px] tracking-wider rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all shadow-md cursor-pointer", theme.bgClass, theme.shadowClass)}
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center space-y-4 opacity-40">
              <Package size={56} className="mx-auto" />
              <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">Aucun article correspondant</h3>
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 animate-in slide-in-from-bottom-6 duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className={cn("w-full h-14 text-slate-950 rounded-2xl p-4 flex items-center justify-between font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer", theme.bgClass, theme.shadowClass)}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-slate-950 text-white flex items-center justify-center text-xs font-black shadow-inner">
                {totalCartCount}
              </div>
              <span>Voir mon panier</span>
            </div>
            <span>Finaliser la commande &rarr;</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 pt-20 pb-12 border-t border-slate-200 dark:border-white/5 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3 text-center md:text-left">
            <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">{merchant.businessName}</h4>
            <p className="text-slate-600 dark:text-white/40 text-xs leading-relaxed">{merchant.description || shopCfg.heroSub}</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className={cn("flex items-center gap-2", theme.textClass)}>
              <ShieldCheck size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">Paiements Sécurisés</span>
            </div>
            <div className="flex items-center gap-2 text-sky-500 dark:text-sky-400">
              <Clock size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">Réponse IA 24h/7</span>
            </div>
            {merchant.category === "digital" && (
              <div className="flex items-center gap-2 text-purple-500 dark:text-purple-400">
                <Zap size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest">Accès Instantané</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <button
              onClick={() => window.open(`https://wa.me/${merchant.whatsappNumber?.replace(/\+/g, "")}`, "_blank")}
              className="h-12 px-6 bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <MessageCircle size={18} className={theme.textClass} />
              Discuter sur WhatsApp
            </button>
          </div>
        </div>
        <div className="text-center mt-16 pt-8 border-t border-slate-200 dark:border-white/5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/20">
          &copy; {new Date().getFullYear()} {merchant.businessName} &bull; Propulsé par Vendeur IA
        </div>
      </footer>

      {/* IA Web Chat Widget */}
      <WebChatWidget merchant={merchant} />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        merchant={merchant}
        theme={theme}
      />

      {/* Full-Screen Stories / Reels Modal */}
      <StoryViewerModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        stories={stories}
        initialIndex={selectedStoryIndex}
        onAddToCart={handleAddToCart}
        onDirectWhatsApp={handleWhatsAppCTA}
        merchant={merchant}
      />

      {/* Share & QR Code Modal */}
      <ShareShopModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        merchant={merchant}
        shopUrl={shopUrl}
      />

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl bg-white dark:bg-[#0d1f18] border border-slate-200 dark:border-white/10 rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-20 h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 dark:bg-black/40 dark:text-white/40 dark:hover:text-white rounded-full flex items-center justify-center backdrop-blur-xl border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shadow-md"
            >
              <X size={20} />
            </button>

            {/* Product Image */}
            <div className="flex-1 bg-slate-100 dark:bg-black/40 aspect-square md:aspect-auto h-[260px] md:h-[500px] overflow-hidden">
              {selectedProduct.images?.[0] || selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.images?.[0] || selectedProduct.imageUrl}
                  className="w-full h-full object-cover"
                  alt={selectedProduct.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20">
                  {getCategoryIcon(merchant.category, 80, "text-slate-400 dark:text-white/20")}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 p-5 md:p-8 space-y-5 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", theme.textClass)}>
                    {selectedProduct.category}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none text-slate-900 dark:text-white">
                    {selectedProduct.name}
                  </h2>
                </div>

                <p className="text-slate-600 dark:text-white/60 text-xs md:text-sm leading-relaxed font-medium">
                  {selectedProduct.description ||
                    "Cet article est disponible dès maintenant. Contactez-nous sur WhatsApp ou ajoutez-le au panier pour passer commande."}
                </p>

                <div className="space-y-2.5">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-0.5">Prix</p>
                    <p className="text-2xl font-black text-slate-950 dark:text-white">
                      {selectedProduct.price.toLocaleString()}{" "}
                      <span className="text-xs text-slate-500 dark:text-white/40">
                        {selectedProduct.currency || merchant.currency || "XOF"}
                      </span>
                    </p>
                  </div>

                  {shopCfg.showStock && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-0.5">Disponibilité</p>
                      {selectedProduct.stock > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full animate-pulse", theme.bgClass)} />
                          <p className={cn("text-xs font-black uppercase", theme.textClass)}>En Stock ({selectedProduct.stock})</p>
                        </div>
                      ) : (
                        <p className="text-xs font-black uppercase text-rose-500">Rupture de stock</p>
                      )}
                    </div>
                  )}

                  {/* Food specific */}
                  {merchant.category === "food" && selectedProduct.preparationTime && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-0.5">Temps de Préparation</p>
                      <p className="text-xs font-black text-amber-500 dark:text-amber-400 flex items-center gap-1.5"><Clock size={14} /> {selectedProduct.preparationTime}</p>
                    </div>
                  )}
                  {merchant.category === "food" && selectedProduct.foodOptions && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-0.5">Options disponibles</p>
                      <p className="text-xs text-slate-600 dark:text-white/60">{selectedProduct.foodOptions}</p>
                    </div>
                  )}

                  {/* Services specific */}
                  {merchant.category === "services" && selectedProduct.serviceDuration && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-0.5">Durée</p>
                      <p className="text-xs font-black text-sky-500 dark:text-sky-400 flex items-center gap-1.5"><Clock size={14} /> {selectedProduct.serviceDuration}</p>
                    </div>
                  )}
                  {merchant.category === "services" && selectedProduct.serviceDeliveryType && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-0.5">Mode de délivrance</p>
                      <p className="text-xs text-slate-600 dark:text-white/60">{selectedProduct.serviceDeliveryType}</p>
                    </div>
                  )}

                  {/* Digital specific */}
                  {merchant.category === "digital" && selectedProduct.digitalFormat && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-0.5">Format</p>
                      <p className="text-xs font-black text-purple-500 dark:text-purple-400">{selectedProduct.digitalFormat}</p>
                    </div>
                  )}
                  {merchant.category === "digital" && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                      <Zap size={14} className="text-purple-500 dark:text-purple-400 shrink-0" />
                      <p className="text-xs text-purple-600 dark:text-purple-300 font-black">Accès instantané dès paiement confirmé</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="h-14 md:h-16 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase text-xs md:text-sm tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <ShoppingCart size={20} className="text-slate-900 dark:text-white" />
                  <span>+ Panier</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWhatsAppCTA(selectedProduct)}
                  className={cn("h-14 md:h-16 text-slate-950 font-black uppercase text-xs md:text-sm tracking-wider flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer", theme.bgClass, theme.hoverBgClass, theme.shadowClass)}
                >
                  {getCtaIcon(merchant.category)}
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
