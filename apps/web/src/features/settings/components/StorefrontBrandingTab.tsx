import React, { useState, useEffect } from "react";
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
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMerchantShopUrl } from "@/lib/slugify";

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
    ringClass: "ring-emerald-500"
  },
  {
    id: "gold",
    name: "Or & Luxe Prestige",
    subtitle: "Bijoux, Parfums & Haut de Gamme",
    primary: "#EAB308",
    bgClass: "bg-yellow-500",
    borderClass: "border-yellow-500",
    textClass: "text-yellow-400",
    ringClass: "ring-yellow-500"
  },
  {
    id: "amber",
    name: "Ambre & Saveurs",
    subtitle: "Restauration, Fast-food & Épices",
    primary: "#F97316",
    bgClass: "bg-orange-500",
    borderClass: "border-orange-500",
    textClass: "text-orange-400",
    ringClass: "ring-orange-500"
  },
  {
    id: "violet",
    name: "Cyber Indigo & Tech",
    subtitle: "High-Tech, Formations & Digital",
    primary: "#6366F1",
    bgClass: "bg-indigo-500",
    borderClass: "border-indigo-500",
    textClass: "text-indigo-400",
    ringClass: "ring-indigo-500"
  },
  {
    id: "rose",
    name: "Rose Glamour & Beauté",
    subtitle: "Cosmétiques, Spa & Mode Féminine",
    primary: "#EC4899",
    bgClass: "bg-pink-500",
    borderClass: "border-pink-500",
    textClass: "text-pink-400",
    ringClass: "ring-pink-500"
  },
  {
    id: "sky",
    name: "Bleu Océan & Pro",
    subtitle: "Services, Consulting & Immobilier",
    primary: "#0EA5E9",
    bgClass: "bg-sky-500",
    borderClass: "border-sky-500",
    textClass: "text-sky-400",
    ringClass: "ring-sky-500"
  }
];

interface StorefrontBrandingTabProps {
  merchant: any;
}

export function StorefrontBrandingTab({ merchant }: StorefrontBrandingTabProps) {
  const queryClient = useQueryClient();

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

  const [accentColor, setAccentColor] = useState(
    merchant?.branding?.accentColor || "emerald"
  );
  const [logoUrl, setLogoUrl] = useState(merchant?.branding?.logoUrl || "");
  const [coverUrl, setCoverUrl] = useState(merchant?.branding?.coverUrl || "");
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    merchant?.branding?.announcement?.enabled || false
  );
  const [announcementText, setAnnouncementText] = useState(
    merchant?.branding?.announcement?.text || "🚚 Livraison offerte à Abidjan dès 25 000 FCFA d'achats !"
  );
  const [instagram, setInstagram] = useState(
    merchant?.branding?.socialLinks?.instagram || ""
  );
  const [tiktok, setTiktok] = useState(
    merchant?.branding?.socialLinks?.tiktok || ""
  );
  const [facebook, setFacebook] = useState(
    merchant?.branding?.socialLinks?.facebook || ""
  );
  const [openingHours, setOpeningHours] = useState(
    merchant?.branding?.openingHours || "08:30 - 20:00 (Lun - Sam)"
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Sync state if merchant changes from parent query
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
          logoUrl,
          coverUrl,
          announcement: {
            enabled: announcementEnabled,
            text: announcementText
          },
          socialLinks: {
            instagram,
            tiktok,
            facebook
          },
          openingHours
        }
      };
      const res = await apiClient.patch("/api/commerce/merchant", payload);
      return res.data;
    },
    onSuccess: (updatedMerchant) => {
      const newSaved = {
        accentColor,
        logoUrl,
        coverUrl,
        announcementEnabled,
        announcementText,
        instagram,
        tiktok,
        facebook,
        openingHours
      };
      setSavedBranding(newSaved);

      // Invalidate queries so all tabs and the public shop receive updated merchant branding
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      if (type === "logo") setIsUploadingLogo(true);
      else setIsUploadingCover(true);

      const res = await apiClient.post("/api/commerce/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const uploadedUrl = res.data?.url || res.data?.fileUrl;
      if (uploadedUrl) {
        if (type === "logo") setLogoUrl(uploadedUrl);
        else setCoverUrl(uploadedUrl);
        toast.success(`${type === "logo" ? "Logo" : "Bannière"} importé(e) avec succès !`);
      }
    } catch (err: any) {
      toast.error("Erreur lors du téléchargement de l'image.");
    } finally {
      setIsUploadingLogo(false);
      setIsUploadingCover(false);
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
    toast.info("Modifications annulées.");
  };

  const currentPalette = THEME_PALETTES.find((p) => p.id === accentColor) || THEME_PALETTES[0];
  const shopUrl = getMerchantShopUrl(merchant);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-20">
      
      {/* Header Info Banner — Mobile First */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center shrink-0">
              <Palette size={20} className="shrink-0" />
            </div>
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
              Studio Apparence &amp; Vitrine
            </h3>
          </div>
          <p className="text-xs text-white/50 leading-relaxed mt-1">
            Personnalisez le thème couleur, le logo, les bannières promo et l'image de marque de votre boutique.
          </p>
        </div>

        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shrink-0"
        >
          <Eye size={16} className="text-vendeur-emerald shrink-0" />
          <span>Aperçu Vitrine</span>
          <ExternalLink size={14} className="opacity-50 shrink-0" />
        </a>
      </div>

      {/* 1. Palette de Couleurs & Thème de Marque */}
      <div id="theme" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={16} className={`${currentPalette.textClass} shrink-0`} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
              1. Thème de Couleur &amp; Ambiance
            </h4>
            <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
              Adapte automatiquement les boutons, les dégradés et les badges de votre boutique.
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
                className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
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

      {/* 2. Logo & Image de Couverture */}
      <div id="logo" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
            <ImageIcon size={16} className="text-vendeur-emerald shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
              2. Identité Visuelle (Logo &amp; Bannière)
            </h4>
            <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
              Images officielles affichées dans l'en-tête et sur les partages réseaux sociaux.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Logo Field */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-white/80">
              Logo de la Boutique
            </label>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              <div className="h-16 w-16 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store size={28} className="text-white/20 shrink-0" />
                )}
              </div>

              <div className="space-y-2 flex-1 w-full">
                <input
                  type="text"
                  placeholder="URL du logo ou fichier"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-mono"
                />

                <label className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all active:scale-95">
                  <UploadCloud size={15} className="shrink-0" />
                  <span>{isUploadingLogo ? "Téléchargement..." : "Parcourir une photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "logo")}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Cover Banner Field */}
          <div id="cover" className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <label className="block text-[11px] sm:text-xs font-black uppercase tracking-wider text-white/80">
              Image de Couverture / Bannière (Optionnel)
            </label>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
              <div className="h-16 w-24 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                {coverUrl ? (
                  <img src={coverUrl} alt="Bannière" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={28} className="text-white/20 shrink-0" />
                )}
              </div>

              <div className="space-y-2 flex-1 w-full">
                <input
                  type="text"
                  placeholder="URL de la bannière"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-mono"
                />

                <label className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all active:scale-95">
                  <UploadCloud size={15} className="shrink-0" />
                  <span>{isUploadingCover ? "Téléchargement..." : "Parcourir une bannière"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "cover")}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bandeau d'Annonce Défilant Promo */}
      <div id="announcement" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
              <Megaphone size={16} className="text-amber-400 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
                3. Bandeau Promotionnel Défilant
              </h4>
              <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
                Bannière d'accroche tout en haut de votre vitrine.
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
            <p className="text-[10px] text-amber-200/60 font-bold leading-relaxed">
              💡 Conseil : Un emoji et une offre claire maximisent immédiatement vos ventes.
            </p>
          </div>
        )}
      </div>

      {/* 4. Réseaux Sociaux & Horaires d'Ouverture */}
      <div id="socials" className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-vendeur-coal border border-white/10 space-y-4 sm:space-y-6 scroll-mt-28">
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
            <Clock size={16} className="text-sky-400 shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white leading-tight">
              4. Réseaux Sociaux &amp; Horaires
            </h4>
            <p className="text-[11px] sm:text-xs text-white/40 leading-relaxed mt-0.5">
              Liens cliquables intégrés dans l'en-tête et le pied de page.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <Instagram size={14} className="text-rose-400 shrink-0" />
              <span>Instagram</span>
            </label>
            <input
              type="text"
              placeholder="https://instagram.com/maboutique ou @maboutique"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <TikTokIcon size={14} className="text-cyan-400 shrink-0" />
              <span>TikTok</span>
            </label>
            <input
              type="text"
              placeholder="https://tiktok.com/@maboutique"
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
              placeholder="https://facebook.com/maboutique"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400 shrink-0" />
              <span>Horaires de Commande</span>
            </label>
            <input
              type="text"
              placeholder="Ex: 08:30 - 20:00 (Lun - Sam)"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3.5 text-xs text-white outline-none focus:border-vendeur-emerald transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Sticky Floating Save Bar (Centered & Glassmorphism, only visible when modified) */}
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
