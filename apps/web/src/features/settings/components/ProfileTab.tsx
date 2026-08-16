import React, { useState, useRef } from "react";
import {
  User as UserIcon,
  Mail,
  Camera,
  Trash2,
  Upload,
  Link as LinkIcon,
  Check,
  Copy,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Loader2,
  ShieldCheck,
  KeyRound,
  LogOut,
  Store
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { compressImage } from "@/lib/imageUtils";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ProfileTab({ merchant }: { merchant?: any }) {
  const { user, updateUser, logout } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  
  // Loading & Action States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Helper: Get user initials for fallback avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .trim()
      .split(" ")
      .map(part => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Helper: Copy ID
  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    toast.success("ID utilisateur copié !");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Process and Upload Image File
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("L'image dépasse 10 Mo. Veuillez choisir une image plus légère.");
      return;
    }

    setIsUploadingPhoto(true);
    const toastId = toast.loading("Traitement et optimisation de la photo...");

    try {
      // 1. Read file as Data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Compress image to optimal square avatar size (512x512)
      const compressedBlob = await compressImage(dataUrl, 512, 0.85);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
        type: "image/jpeg"
      });

      // 3. Upload to backend media API
      let finalAvatarUrl = "";
      try {
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("folder", "avatars");

        const uploadRes = await apiClient.post("/api/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (uploadRes.data?.url) {
          finalAvatarUrl = uploadRes.data.url;
        }
      } catch (uploadErr) {
        console.warn("Media API upload fallback to base64 preview:", uploadErr);
        finalAvatarUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(compressedBlob);
        });
      }

      if (!finalAvatarUrl) {
        throw new Error("Impossible de générer l'URL de l'image.");
      }

      // 4. Update state & save directly to profile
      setAvatarUrl(finalAvatarUrl);
      const res = await apiClient.patch("/api/auth/me", { avatarUrl: finalAvatarUrl });
      updateUser(res.data);

      toast.success("Photo de profil mise à jour avec succès ! ✨", { id: toastId });
    } catch (err: any) {
      console.error("Avatar upload error:", err);
      toast.error(err.response?.data?.error || err.message || "Échec de l'importation de la photo", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Remove Photo
  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      setAvatarUrl("");
      const res = await apiClient.patch("/api/auth/me", { avatarUrl: "" });
      updateUser(res.data);
      toast.success("Photo de profil supprimée");
    } catch (err: any) {
      toast.error("Échec de la suppression de la photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Apply Custom URL
  const handleApplyCustomUrl = async () => {
    if (!customUrl.trim()) return;
    if (!customUrl.startsWith("http://") && !customUrl.startsWith("https://")) {
      toast.error("L'URL doit commencer par http:// ou https://");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      setAvatarUrl(customUrl.trim());
      const res = await apiClient.patch("/api/auth/me", { avatarUrl: customUrl.trim() });
      updateUser(res.data);
      setShowCustomUrlInput(false);
      setCustomUrl("");
      toast.success("Photo mise à jour avec l'URL externe ! ✨");
    } catch (err) {
      toast.error("Impossible d'enregistrer l'URL");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Le nom d'affichage ne peut pas être vide.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await apiClient.patch("/api/auth/me", {
        displayName: displayName.trim(),
        avatarUrl
      });
      updateUser(res.data);
      toast.success("Profil mis à jour avec succès ! ✨");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Échec de l'enregistrement du profil");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Veuillez renseigner tous les champs de mot de passe.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post("/api/auth/change-password", {
        currentPassword,
        newPassword
      });
      toast.success("Mot de passe modifié avec succès ! 🔒");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Échec du changement de mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-500 max-w-4xl pb-16">
      {/* 1. Profile Hero & Photo Upload — Mobile First */}
      <section className="bg-vendeur-coal/70 backdrop-blur-2xl border border-white/10 p-5 sm:p-7 md:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-vendeur-emerald/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
          {/* Avatar / Dropzone */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative group h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 rounded-3xl sm:rounded-[2.2rem] p-1 transition-all cursor-pointer select-none shrink-0",
                "bg-gradient-to-tr from-vendeur-emerald/30 via-white/10 to-vendeur-emerald/20",
                "hover:scale-105 active:scale-95 shadow-2xl",
                isDragging ? "ring-4 ring-vendeur-emerald scale-105" : ""
              )}
              title="Cliquer ou glisser-déposer une photo"
            >
              <div className="h-full w-full rounded-[1.4rem] sm:rounded-[2rem] bg-vendeur-coal overflow-hidden relative flex items-center justify-center border border-white/10">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || "Avatar"}
                    className="h-full w-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-white/10 to-white/5 text-white font-black text-2xl tracking-wider">
                    {getInitials(displayName || user?.displayName)}
                  </div>
                )}

                {/* Hover overlay with upload icon */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity">
                  <Camera size={22} className="text-vendeur-emerald animate-bounce shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">Changer</span>
                </div>

                {/* Loading state */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-vendeur-emerald z-20">
                    <Loader2 size={26} className="animate-spin shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/80">Envoi...</span>
                  </div>
                )}
              </div>

              {/* Floating Camera Button badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploadingPhoto}
                aria-label="Sélectionner une photo"
                className="absolute -right-1 -bottom-1 h-9 w-9 sm:h-11 sm:w-11 bg-vendeur-emerald text-vendeur-coal rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border-2 border-vendeur-coal cursor-pointer z-10 shrink-0"
              >
                <Camera size={18} className="shrink-0" />
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Photo Action Links */}
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-bold mt-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="text-vendeur-emerald hover:underline flex items-center gap-1 text-[11px] uppercase tracking-wider active:scale-95"
              >
                <Upload size={12} className="shrink-0" />
                <span>Importer</span>
              </button>

              {avatarUrl && (
                <>
                  <span className="text-white/20">•</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isUploadingPhoto}
                    className="text-red-400/80 hover:text-red-300 flex items-center gap-1 text-[11px] uppercase tracking-wider hover:underline active:scale-95"
                  >
                    <Trash2 size={12} className="shrink-0" />
                    <span>Supprimer</span>
                  </button>
                </>
              )}

              <span className="text-white/20">•</span>
              <button
                type="button"
                onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                className="text-white/50 hover:text-white flex items-center gap-1 text-[11px] uppercase tracking-wider active:scale-95"
              >
                <LinkIcon size={12} className="shrink-0" />
                <span>URL</span>
              </button>
            </div>

            {/* Custom URL Popover */}
            {showCustomUrlInput && (
              <div className="w-full mt-2 p-3 bg-black/50 border border-white/10 rounded-2xl space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <input
                  type="url"
                  placeholder="https://exemple.com/photo.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-xs text-white placeholder-white/30 focus:border-vendeur-emerald outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(false)}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/50 hover:bg-white/5"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    disabled={!customUrl.trim() || isUploadingPhoto}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-vendeur-emerald text-vendeur-coal disabled:opacity-50"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Information & Quick Metadata */}
          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                  {displayName || "Utilisateur Vendeur IA"}
                </h2>
                <span className="px-3 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                  <ShieldCheck size={13} className="shrink-0" />
                  <span>{user?.roles?.includes("admin") ? "Administrateur" : "Marchand Vérifié"}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-white/50">{user?.email}</p>
            </div>

            {/* Quick Metadata Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 pt-1">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <Store size={14} className="text-vendeur-emerald shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Boutique :</span>
                <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-none">
                  {merchant?.businessName || "Non configurée"}
                </span>
              </div>

              {user?.id && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 group shrink-0"
                  title="Copier l'identifiant utilisateur"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">ID :</span>
                  <span className="text-xs font-mono text-white/80">{user.id.slice(0, 8)}...</span>
                  {copiedId ? (
                    <Check size={14} className="text-vendeur-emerald shrink-0" />
                  ) : (
                    <Copy size={14} className="group-hover:scale-110 transition-transform text-white/40 shrink-0" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal Information Edit Form */}
      <section className="bg-vendeur-coal/60 backdrop-blur-2xl border border-white/10 p-5 sm:p-7 md:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0">
            <UserIcon size={20} className="shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg md:text-xl font-black uppercase text-white tracking-tight leading-tight">
              Informations Personnelles
            </h3>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/40 mt-0.5">
              Modifiez votre nom public et vos coordonnées
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Display Name Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">
                Nom d'affichage
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 shrink-0" size={18} />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Franck Kouassi"
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 pl-11 sm:pl-12 pr-4 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner font-medium text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">
                Adresse Email (Liée au compte)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 shrink-0" size={18} />
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black/20 border border-white/5 pl-11 sm:pl-12 pr-4 text-white/40 outline-none cursor-not-allowed font-medium text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingProfile || !displayName.trim()}
              className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
            >
              {isSavingProfile ? (
                <Loader2 className="animate-spin shrink-0" size={18} />
              ) : (
                <>
                  <Save size={16} className="shrink-0" />
                  <span>Enregistrer les modifications</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Security & Password Change */}
      <section className="bg-vendeur-coal/60 backdrop-blur-2xl border border-white/10 p-5 sm:p-7 md:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <KeyRound size={20} className="shrink-0" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg md:text-xl font-black uppercase text-white tracking-tight leading-tight">
              Sécurité &amp; Mot de Passe
            </h3>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/40 mt-0.5">
              Gérez la confidentialité et l'accès à votre compte
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 shrink-0" size={17} />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 pl-11 sm:pl-12 pr-11 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1"
                >
                  {showCurrentPassword ? <EyeOff size={16} className="shrink-0" /> : <Eye size={16} className="shrink-0" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 shrink-0" size={17} />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 pl-11 sm:pl-12 pr-11 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1"
                >
                  {showNewPassword ? <EyeOff size={16} className="shrink-0" /> : <Eye size={16} className="shrink-0" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white/50 ml-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 shrink-0" size={17} />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 pl-11 sm:pl-12 pr-4 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword}
              className="w-full sm:w-auto px-6 sm:px-8 h-12 sm:h-14 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
            >
              {isChangingPassword ? (
                <Loader2 className="animate-spin shrink-0" size={18} />
              ) : (
                <>
                  <Lock size={16} className="shrink-0" />
                  <span>Mettre à jour le mot de passe</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* 4. Session & Disconnect */}
      <section className="bg-red-500/5 border border-red-500/20 p-5 sm:p-7 md:p-8 rounded-3xl sm:rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-black text-white uppercase tracking-tight">Déconnexion de session</h3>
          <p className="text-xs text-white/40">Fermer votre session active sur cet appareil en toute sécurité.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full sm:w-auto px-6 h-12 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-black uppercase tracking-widest text-xs rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <LogOut size={16} className="shrink-0" />
          <span>Se déconnecter</span>
        </button>
      </section>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir fermer votre session ? Vous pourrez vous reconnecter à tout moment."
        confirmLabel="Déconnexion"
        cancelLabel="Annuler"
        type="logout"
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
