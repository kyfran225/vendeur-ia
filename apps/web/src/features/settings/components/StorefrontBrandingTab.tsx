import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  Megaphone,
  Instagram,
  Facebook,
  Clock,
  ExternalLink,
  Check,
  Save,
  UploadCloud,
  Eye,
  Store,
  Flame,
  RotateCcw,
  Trash2,
  Upload,
  Link as LinkIcon,
  ShoppingBag,
  Smartphone,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  MessageCircle,
  HelpCircle,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMerchantShopUrl } from "@/lib/slugify";
import { compressImage } from "@/lib/imageUtils";

const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 16 16" className={`shrink-0 ${className}`}>
    <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.38 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
  </svg>
);

export const THEME_PALETTES = [
  {
    id: "emerald",
    name: "Émeraude Signature",
    subtitle: "Universel, Mode & Croissance",
    primary: "#10B981",
    bgClass: "bg-emerald-500",
    borderClass: "border-emerald-500",
    textClass: "text-emerald-400",
    ringClass: "ring-emerald-500",
    gradientFrom: "from-emerald-500",
    lightBg: "bg-emerald-500/10",
    btnColor: "bg-emerald-500 hover:bg-emerald-400 text-black font-black"
  },
  {
    id: "gold",
    name: "Or & Luxe Prestige",
    subtitle: "Bijoux, Parfums & Haut de Gamme",
    primary: "#EAB308",
    bgClass: "bg-yellow-500",
    borderClass: "border-yellow-500",
    textClass: "text-yellow-400",
    ringClass: "ring-yellow-500",
    gradientFrom: "from-yellow-500",
    lightBg: "bg-yellow-500/10",
    btnColor: "bg-yellow-500 hover:bg-yellow-400 text-black font-black"
  },
  {
    id: "amber",
    name: "Ambre & Saveurs",
    subtitle: "Restauration, Fast-food & Épices",
    primary: "#F97316",
    bgClass: "bg-orange-500",
    borderClass: "border-orange-500",
    textClass: "text-orange-400",
    ringClass: "ring-orange-500",
    gradientFrom: "from-orange-500",
    lightBg: "bg-orange-500/10",
    btnColor: "bg-orange-500 hover:bg-orange-400 text-black font-black"
  },
  {
    id: "violet",
    name: "Cyber Indigo & Tech",
    subtitle: "High-Tech, Formations & Digital",
    primary: "#6366F1",
    bgClass: "bg-indigo-500",
    borderClass: "border-indigo-500",
    textClass: "text-indigo-400",
    ringClass: "ring-indigo-500",
    gradientFrom: "from-indigo-500",
    lightBg: "bg-indigo-500/10",
    btnColor: "bg-indigo-500 hover:bg-indigo-400 text-white font-black"
  },
  {
    id: "rose",
    name: "Rose Glamour & Beauté",
    subtitle: "Cosmétiques, Spa & Mode Féminine",
    primary: "#EC4899",
    bgClass: "bg-pink-500",
    borderClass: "border-pink-500",
    textClass: "text-pink-400",
    ringClass: "ring-pink-500",
    gradientFrom: "from-pink-500",
    lightBg: "bg-pink-500/10",
    btnColor: "bg-pink-500 hover:bg-pink-400 text-white font-black"
  },
  {
    id: "sky",
    name: "Bleu Océan & Pro",
    subtitle: "Services, Consulting & Immobilier",
    primary: "#0EA5E9",
    bgClass: "bg-sky-500",
    borderClass: "border-sky-500",
    textClass: "text-sky-400",
    ringClass: "ring-sky-500",
    gradientFrom: "from-sky-500",
    lightBg: "bg-sky-500/10",
    btnColor: "bg-sky-500 hover:bg-sky-400 text-black font-black"
  }
];

const ANNOUNCEMENT_PRESETS = [
  "🚚 Livraison offerte à Abidjan dès 25 000 FCFA d'achats !",
  "🔥 Promo Spéciale : -20% sur les nouveautés du catalogue !",
  "✨ Nouveaux arrivages disponibles en stock limité !"
];

const HOURS_PRESETS = [
  "08:30 - 20:00 (Lun - Sam)",
  "24h/24 & 7j/7",
  "09:00 - 18:00 (Lun - Ven)",
  "Sur rendez-vous"
];

interface StorefrontBrandingTabProps {
  merchant: any;
}

export function StorefrontBrandingTab({ merchant }: StorefrontBrandingTabProps) {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [savedBranding, setSavedBranding] = useState({
    accentColor: merchant?.branding?.accentColor || "emerald",
    logoUrl: merchant?.branding?.logoUrl || "",
    coverUrl: merchant?.branding?.coverUrl || "",
    announcementEnabled: merchant?.branding?.announcement?.enabled || false,
    announcementText: merchant?.branding?.announcement?.text || "🚚 Livraison offerte à Abidjan dès 25 000 FCFA d'achats !",
    instagram: merchant?.branding?.socialLinks?.instagram || "",
    tiktok: merchant?.branding?.socialLinks?.tiktok || "",
    facebook: merchant?.branding?.socialLinks?.facebook || "",
    openingHours: merchant?.branding?.openingHours || "08:30 - 20:00 (Lun - Sam)"
  });

  const [accentColor, setAccentColor] = useState(merchant?.branding?.accentColor || "emerald");
  const [logoUrl, setLogoUrl] = useState(merchant?.branding?.logoUrl || "");
  const [coverUrl, setCoverUrl] = useState(merchant?.branding?.coverUrl || "");
  const [announcementEnabled, setAnnouncementEnabled] = useState(merchant?.branding?.announcement?.enabled || false);
  const [announcementText, setAnnouncementText] = useState(
    merchant?.branding?.announcement?.text || "🚚 Livraison offerte à Abidjan dès 25 000 FCFA d'achats !"
  );
  const [instagram, setInstagram] = useState(merchant?.branding?.socialLinks?.instagram || "");
  const [tiktok, setTiktok] = useState(merchant?.branding?.socialLinks?.tiktok || "");
  const [facebook, setFacebook] = useState(merchant?.branding?.socialLinks?.facebook || "");
  const [openingHours, setOpeningHours] = useState(merchant?.branding?.openingHours || "08:30 - 20:00 (Lun - Sam)");

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  const [isCoverDragging, setIsCoverDragging] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const [activePreviewMode, setActivePreviewMode] = useState<"phone" | "card">("phone");

  // Sync state when merchant changes
  useEffect(() => {
    if (merchant?.branding) {
      const b = merchant.branding;
      const initial = {
        accentColor: b.accentColor || "emerald",
        logoUrl: b.logoUrl || "",
        coverUrl: b.coverUrl || "",
        announcementEnabled: b.announcement?.enabled || false,
        announcementText: b.announcement?.text || "🚚 Livraison offerte à Abidjan dès 25 000 FCFA d'achats !",
        instagram: b.socialLinks?.instagram || "",
        tiktok: b.socialLinks?.tiktok || "",
        facebook: b.socialLinks?.facebook || "",
        openingHours: b.openingHours || "08:30 - 20:00 (Lun - Sam)"
      };
      setSavedBranding(initial);
      setAccentColor(initial.accentColor);
      setLogoUrl(initial.logoUrl);
      setCoverUrl(initial.coverUrl);
      setAnnouncementEnabled(initial.announcementEnabled);
      setAnnouncementText(initial.announcementText);
      setInstagram(initial.instagram);
      setTiktok(initial.tiktok);
      setFacebook(initial.facebook);
      setOpeningHours(initial.openingHours);
    }
  }, [merchant]);

  // Dirty State Checker against currently saved branding
  const isDirty =
    accentColor !== savedBranding.accentColor ||
    logoUrl !== savedBranding.logoUrl ||
    coverUrl !== savedBranding.coverUrl ||
    announcementEnabled !== savedBranding.announcementEnabled ||
    (announcementEnabled && announcementText !== savedBranding.announcementText) ||
    instagram !== savedBranding.instagram ||
    tiktok !== savedBranding.tiktok ||
    facebook !== savedBranding.facebook ||
    openingHours !== savedBranding.openingHours;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        branding: {
          accentColor,
          logoUrl: logoUrl.trim(),
          coverUrl: coverUrl.trim(),
          announcement: {
            enabled: announcementEnabled,
            text: announcementText.trim()
          },
          socialLinks: {
            instagram: instagram.trim(),
            tiktok: tiktok.trim(),
            facebook: facebook.trim()
          },
          openingHours: openingHours.trim()
        }
      };
      const res = await apiClient.patch("/api/commerce/merchant", payload);
      return res.data;
    },
    onSuccess: (updatedMerchant) => {
      const newSaved = {
        accentColor,
        logoUrl: logoUrl.trim(),
        coverUrl: coverUrl.trim(),
        announcementEnabled,
        announcementText: announcementText.trim(),
        instagram: instagram.trim(),
        tiktok: tiktok.trim(),
        facebook: facebook.trim(),
        openingHours: openingHours.trim()
      };
      setSavedBranding(newSaved);

      // Invalidate queries so header, dashboard and public shop update in real time
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      queryClient.invalidateQueries({ queryKey: ["public-shop"] });
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: {
            ...old.merchant,
            ...(updatedMerchant || {}),
            branding: updatedMerchant?.branding || newSaved
          }
        };
      });
      toast.success("✨ Apparence de la boutique enregistrée avec succès !");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement de l'apparence.");
    }
  });

  // Client-side image compression & multi-tier upload handler
  const processAndUploadImage = async (file: File, type: "logo" | "cover") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("L'image dépasse 15 Mo. Veuillez choisir une image plus légère.");
      return;
    }

    if (type === "logo") setIsUploadingLogo(true);
    else setIsUploadingCover(true);

    const toastId = toast.loading(`Optimisation du ${type === "logo" ? "logo" : "de la bannière"}...`);

    try {
      // 1. Read file as Data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Client-side Compression: Logo (600px square), Cover (1600px wide banner)
      const maxDim = type === "logo" ? 600 : 1600;
      const quality = type === "logo" ? 0.88 : 0.82;
      const compressedBlob = await compressImage(dataUrl, maxDim, quality);
      const cleanFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
      const compressedFile = new File([compressedBlob], cleanFileName, { type: "image/jpeg" });

      // 3. Upload via multipart FormData
      let finalUrl = "";
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", type === "logo" ? "logos" : "covers");

      try {
        const uploadRes = await apiClient.post("/api/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data?.url) {
          finalUrl = uploadRes.data.url;
        }
      } catch (primaryErr) {
        // Fallback to /api/commerce/upload route
        try {
          const fallbackRes = await apiClient.post("/api/commerce/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          if (fallbackRes.data?.url) {
            finalUrl = fallbackRes.data.url;
          }
        } catch (secErr) {
          // If network error, preview directly as base64
          finalUrl = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(compressedBlob);
          });
        }
      }

      if (!finalUrl) {
        throw new Error("Impossible de téléverser l'image.");
      }

      if (type === "logo") {
        setLogoUrl(finalUrl);
        toast.success("Logo de la boutique importé avec succès ! ✨", { id: toastId });
      } else {
        setCoverUrl(finalUrl);
        toast.success("Bannière de couverture importée avec succès ! ✨", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Erreur lors de l'importation de l'image.", { id: toastId });
    } finally {
      setIsUploadingLogo(false);
      setIsUploadingCover(false);
      setIsLogoDragging(false);
      setIsCoverDragging(false);
    }
  };

  const handleReset = () => {
    setAccentColor(savedBranding.accentColor);
    setLogoUrl(savedBranding.logoUrl);
    setCoverUrl(savedBranding.coverUrl);
    setAnnouncementEnabled(savedBranding.announcementEnabled);
    setAnnouncementText(savedBranding.announcementText);
    setInstagram(savedBranding.instagram);
    setTiktok(savedBranding.tiktok);
    setFacebook(savedBranding.facebook);
    setOpeningHours(savedBranding.openingHours);
    toast.info("Modifications réinitialisées 🔄");
  };

  const currentPalette = THEME_PALETTES.find((p) => p.id === accentColor) || THEME_PALETTES[0];
  const shopUrl = getMerchantShopUrl(merchant);
  const businessName = merchant?.businessName || "Ma Boutique";

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-28">
      
      {/* ─── Hero Information & Quick Actions Bar ─── */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center shrink-0 border border-vendeur-emerald/30 shadow-md">
              <Palette size={20} className="shrink-0" />
            </div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
              Studio Apparence &amp; Vitrine Web
            </h3>
          </div>
          <p className="text-xs text-white/50 leading-relaxed mt-1">
            Personnalisez le logo de votre boutique, votre palette de couleurs, vos bannières et vos coordonnées.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shopUrl);
              toast.success("Lien de la vitrine copié ! 📋");
            }}
            className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Copier le lien de la vitrine"
          >
            <Copy size={15} className="text-white/60 shrink-0" />
            <span className="hidden sm:inline">Copier</span>
          </button>

          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 sm:h-12 px-4 sm:px-5 rounded-xl sm:rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 shrink-0"
          >
            <Eye size={16} className="shrink-0" />
            <span>Ouvrir la Vitrine</span>
            <ExternalLink size={14} className="opacity-60 shrink-0" />
          </a>
        </div>
      </div>

      {/* ─── LIVE INTERACTIVE STOREFRONT PREVIEW ─── */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal/90 border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-vendeur-emerald shrink-0 border border-white/10">
              <Smartphone size={16} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Aperçu de votre Vitrine en Direct
              </h4>
              <p className="text-[10px] sm:text-[11px] text-white/40 font-medium">
                Voyez immédiatement ce que vos clients découvriront sur leur téléphone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActivePreviewMode("phone")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activePreviewMode === "phone" ? "bg-vendeur-emerald text-vendeur-coal shadow-sm" : "text-white/40 hover:text-white"
              }`}
            >
              <Smartphone size={13} />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewMode("card")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activePreviewMode === "card" ? "bg-vendeur-emerald text-vendeur-coal shadow-sm" : "text-white/40 hover:text-white"
              }`}
            >
              <Layers size={13} />
              <span>Large</span>
            </button>
          </div>
        </div>

        {/* Preview Viewport Container */}
        <div className="flex justify-center items-center py-2 sm:py-4">
          <div
            className={`w-full transition-all duration-300 rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#0b1210] ${
              activePreviewMode === "phone" ? "max-w-sm" : "max-w-3xl"
            }`}
          >
            {/* Mock Announcement Bar */}
            {announcementEnabled && announcementText && (
              <div
                className="text-black px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 truncate shadow-sm transition-all"
                style={{ background: `linear-gradient(90deg, #F59E0B, #EC4899, ${currentPalette.primary})` }}
              >
                <Megaphone size={11} className="shrink-0 animate-bounce" />
                <span className="truncate">{announcementText}</span>
              </div>
            )}

            {/* Mock Cover Banner (If present) */}
            {coverUrl && (
              <div className="h-28 sm:h-36 w-full relative overflow-hidden bg-black/50">
                <img src={coverUrl} alt="Bannière" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1210] via-transparent to-black/30" />
              </div>
            )}

            {/* Mock Header Navigation */}
            <div className={`p-4 flex items-center justify-between border-b border-white/5 ${coverUrl ? "-mt-8 relative z-10" : ""}`}>
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden shrink-0 border border-white/10"
                  style={{ backgroundColor: currentPalette.primary }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    <Store size={22} className="text-black" />
                  )}
                </div>
                <div>
                  <h5 className="text-sm font-black uppercase tracking-tight text-white leading-tight">
                    {businessName}
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {openingHours ? openingHours.split("(")[0] : "Ouvert"}
                    </span>
                    {instagram && <Instagram size={11} className="text-rose-400" />}
                    {tiktok && <TikTokIcon size={11} className="text-cyan-400" />}
                    {facebook && <Facebook size={11} className="text-blue-400" />}
                  </div>
                </div>
              </div>

              <div
                className="h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider shadow-lg"
                style={{ backgroundColor: currentPalette.primary, color: currentPalette.id === "violet" || currentPalette.id === "rose" ? "#ffffff" : "#000000" }}
              >
                <ShoppingBag size={13} />
                <span className="hidden sm:inline">Panier</span>
              </div>
            </div>

            {/* Mock Store Body */}
            <div className="p-4 space-y-3">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Catalogue Actif</p>
                  <p className="text-xs font-black text-white">Articles &amp; Commandes WhatsApp 24/7</p>
                </div>
                <div
                  className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider"
                  style={{ backgroundColor: `${currentPalette.primary}20`, color: currentPalette.primary }}
                >
                  {currentPalette.name.split(" ")[0]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 1. PALETTE DE COULEURS ─── */}
      <div id="theme" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28 shadow-xl">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
            <Sparkles size={16} className={`${currentPalette.textClass} shrink-0`} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
              1. Thème de Couleur &amp; Ambiance de Marque
            </h4>
            <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
              Harmonise automatiquement les boutons d'achat, les bannières, le chat et les badges de votre vitrine.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {THEME_PALETTES.map((pal) => {
            const isSelected = accentColor === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => setAccentColor(pal.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? `bg-white/[0.08] ${pal.borderClass} ring-2 ${pal.ringClass} shadow-xl scale-[1.01]`
                    : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white"
                  style={{ backgroundColor: pal.primary }}
                >
                  {isSelected && <Check size={18} strokeWidth={3} className="text-black shrink-0" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-white leading-tight truncate">
                    {pal.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/40 truncate leading-tight mt-0.5">
                    {pal.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. LOGO DE LA BOUTIQUE & BANNIÈRE COUVERTURE ─── */}
      <div id="logo" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28 shadow-xl">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
            <ImageIcon size={16} className="text-vendeur-emerald shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
              2. Identité Visuelle (Logo &amp; Bannière Officielle)
            </h4>
            <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
              Ces images apparaissent sur votre vitrine, vos cartes de partage WhatsApp et l'en-tête de votre application.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* ── Logo Card & Dropzone ── */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-white/90">
                Logo de la Boutique (Carré recommandé)
              </label>
              <p className="text-[10px] text-white/40">Affiché dans le header de l'app et sur la boutique en ligne.</p>
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsLogoDragging(true); }}
              onDragLeave={() => setIsLogoDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsLogoDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processAndUploadImage(file, "logo");
              }}
              onClick={() => logoInputRef.current?.click()}
              className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center ${
                isLogoDragging
                  ? "border-vendeur-emerald bg-vendeur-emerald/10 scale-[1.02]"
                  : "border-white/15 bg-black/20 hover:border-white/30 hover:bg-black/40"
              }`}
            >
              <div className="h-20 w-20 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner relative group">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <UploadCloud size={20} className="text-vendeur-emerald" />
                    </div>
                  </>
                ) : (
                  <Store size={32} className="text-white/20 shrink-0" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-black text-white uppercase tracking-tight">
                  {isUploadingLogo ? "Téléversement en cours..." : "Glissez votre logo ici ou cliquez"}
                </p>
                <p className="text-[10px] text-white/40 font-mono">PNG, JPG, WebP (Optimisé automatiquement)</p>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processAndUploadImage(file, "logo");
                }}
              />
            </div>

            {/* Actions for Logo */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                className="text-[11px] font-bold text-white/50 hover:text-white flex items-center gap-1"
              >
                <LinkIcon size={12} />
                <span>{showLogoUrlInput ? "Masquer l'URL" : "Saisir une URL"}</span>
              </button>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl("");
                    toast.info("Logo retiré. N'oubliez pas d'enregistrer !");
                  }}
                  className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Supprimer le logo</span>
                </button>
              )}
            </div>

            {showLogoUrlInput && (
              <input
                type="text"
                placeholder="https://monsite.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-vendeur-emerald font-mono animate-in fade-in"
              />
            )}
          </div>

          {/* ── Cover Banner Card & Dropzone ── */}
          <div id="cover" className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-white/90">
                Image de Couverture / Bannière (Optionnel)
              </label>
              <p className="text-[10px] text-white/40">Bannière panoramique en haut de votre boutique.</p>
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsCoverDragging(true); }}
              onDragLeave={() => setIsCoverDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsCoverDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processAndUploadImage(file, "cover");
              }}
              onClick={() => coverInputRef.current?.click()}
              className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center ${
                isCoverDragging
                  ? "border-vendeur-emerald bg-vendeur-emerald/10 scale-[1.02]"
                  : "border-white/15 bg-black/20 hover:border-white/30 hover:bg-black/40"
              }`}
            >
              <div className="h-20 w-36 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner relative group">
                {coverUrl ? (
                  <>
                    <img src={coverUrl} alt="Bannière" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <UploadCloud size={20} className="text-vendeur-emerald" />
                    </div>
                  </>
                ) : (
                  <ImageIcon size={32} className="text-white/20 shrink-0" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-black text-white uppercase tracking-tight">
                  {isUploadingCover ? "Téléversement en cours..." : "Glissez votre bannière ici ou cliquez"}
                </p>
                <p className="text-[10px] text-white/40 font-mono">Format 16:9 recommandé (Ex: 1200x400)</p>
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processAndUploadImage(file, "cover");
                }}
              />
            </div>

            {/* Actions for Cover */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                className="text-[11px] font-bold text-white/50 hover:text-white flex items-center gap-1"
              >
                <LinkIcon size={12} />
                <span>{showCoverUrlInput ? "Masquer l'URL" : "Saisir une URL"}</span>
              </button>

              {coverUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCoverUrl("");
                    toast.info("Bannière retirée. N'oubliez pas d'enregistrer !");
                  }}
                  className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Supprimer la bannière</span>
                </button>
              )}
            </div>

            {showCoverUrlInput && (
              <input
                type="text"
                placeholder="https://monsite.com/banniere.jpg"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-vendeur-emerald font-mono animate-in fade-in"
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── 3. BANDEAU PROMOTIONNEL DÉFILANT ─── */}
      <div id="announcement" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
              <Megaphone size={16} className="text-amber-400 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
                3. Bandeau Promotionnel Flash
              </h4>
              <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
                Bannière d'accroche animée tout en haut de votre vitrine.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
            />
            <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vendeur-emerald"></div>
          </label>
        </div>

        {announcementEnabled && (
          <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in duration-200">
            <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-300">
              Texte du message promotionnel
            </label>
            <input
              type="text"
              placeholder="Ex: 🔥 Promo du weekend : -20% sur les robes | Livraison express offerte !"
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="w-full h-11 bg-black/40 border border-amber-500/30 rounded-xl px-3.5 text-xs text-white outline-none focus:border-amber-400 transition-all font-medium"
            />
            
            {/* Quick Presets */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-200/70">Suggestions rapides :</p>
              <div className="flex flex-wrap gap-1.5">
                {ANNOUNCEMENT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAnnouncementText(preset)}
                    className="px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-amber-500/30 text-[10px] text-amber-200 text-left transition-all active:scale-95"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. RÉSEAUX SOCIAUX & HORAIRES D'OUVERTURE ─── */}
      <div id="socials" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28 shadow-xl">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 border border-white/10">
            <Clock size={16} className="text-sky-400 shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
              4. Réseaux Sociaux &amp; Horaires de Vente
            </h4>
            <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
              Ces liens cliquables s'affichent dans l'en-tête de votre vitrine et rassureront vos clients.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <Instagram size={14} className="text-rose-400 shrink-0" />
              <span>Instagram (Lien ou @pseudo)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: @maboutique ou https://instagram.com/maboutique"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <TikTokIcon size={14} className="text-cyan-400 shrink-0" />
              <span>TikTok (Lien ou @pseudo)</span>
            </label>
            <input
              type="text"
              placeholder="Ex: @maboutique ou https://tiktok.com/@maboutique"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <Facebook size={14} className="text-blue-400 shrink-0" />
              <span>Page Facebook</span>
            </label>
            <input
              type="text"
              placeholder="Ex: https://facebook.com/maboutique"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400 shrink-0" />
              <span>Horaires de Prise de Commande</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 08:30 - 20:00 (Lun - Sam)"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-medium"
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {HOURS_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setOpeningHours(preset)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] text-white/60 transition-all active:scale-95"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── STICKY FLOATING SAVE BAR ─── */}
      {isDirty && (
        <div className="fixed bottom-6 inset-x-0 z-50 flex items-center justify-center px-3 sm:px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="pointer-events-auto p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl bg-vendeur-coal/95 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-2 sm:gap-3 max-w-full">
            <button
              type="button"
              onClick={handleReset}
              disabled={saveMutation.isPending}
              className="h-11 sm:h-12 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95"
            >
              <RotateCcw size={15} className="shrink-0" />
              <span>Annuler</span>
            </button>

            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="h-11 sm:h-12 px-5 sm:px-8 rounded-xl sm:rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/30 disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              <Save size={16} className="shrink-0" />
              <span>{saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
