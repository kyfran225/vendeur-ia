import React, { useState } from "react";
import { MessageCircle, Instagram, Facebook, Globe, User } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TikTok SVG Icon
const TikTokIcon = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

// Consistent, deterministic palette for contacts without a profile picture (WhatsApp style)
const AVATAR_PALETTES = [
  { bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-400" },
  { bg: "bg-teal-500/20", border: "border-teal-500/40", text: "text-teal-400" },
  { bg: "bg-sky-500/20", border: "border-sky-500/40", text: "text-sky-400" },
  { bg: "bg-indigo-500/20", border: "border-indigo-500/40", text: "text-indigo-400" },
  { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-400" },
  { bg: "bg-pink-500/20", border: "border-pink-500/40", text: "text-pink-400" },
  { bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-400" },
  { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-400" },
];

function getPalette(seed?: string) {
  if (!seed) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export interface CustomerAvatarProps {
  name?: string;
  phone?: string;
  avatarUrl?: string | null;
  platform?: "whatsapp" | "instagram" | "facebook" | "tiktok" | "web" | string;
  size?: "sm" | "md" | "lg" | "xl";
  showPlatformBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export function CustomerAvatar({
  name,
  phone,
  avatarUrl,
  platform = "whatsapp",
  size = "md",
  showPlatformBadge = true,
  className,
  onClick
}: CustomerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const initial = (name?.trim() || phone?.trim() || "C").charAt(0).toUpperCase();
  const palette = getPalette(phone || name || "seed");

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl"
  }[size];

  const badgeSize = {
    sm: 10,
    md: 11,
    lg: 12,
    xl: 14
  }[size];

  const hasValidImage = !!avatarUrl && !imageError;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-full shrink-0 select-none overflow-visible",
        onClick ? "cursor-pointer group hover:opacity-90 active:scale-95 transition-transform" : "",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-black relative overflow-hidden transition-all",
          sizeClasses,
          hasValidImage ? "bg-[#202c33] border border-white/10" : `${palette.bg} ${palette.border} ${palette.text} border shadow-inner`
        )}
      >
        {/* Render Profile Picture Image if Available */}
        {avatarUrl && !imageError && (
          <img
            src={avatarUrl}
            alt={name || "Avatar"}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={cn(
              "h-full w-full object-cover rounded-full transition-opacity duration-200",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}

        {/* Fallback Initial or Placeholder (visible if no image or during load/error) */}
        {(!hasValidImage || !imageLoaded) && (
          <span className={cn("flex items-center justify-center", hasValidImage && !imageLoaded ? "absolute inset-0" : "")}>
            {initial && initial !== "+" ? initial : <User size={16} />}
          </span>
        )}
      </div>

      {/* Platform Badge (WhatsApp, Instagram, Facebook, etc.) */}
      {showPlatformBadge && (
        <div className="absolute -bottom-1 -right-1 bg-[#111b21] rounded-full p-0.5 border border-white/10 shadow-sm z-10">
          {platform === "instagram" && <Instagram size={badgeSize} className="text-pink-500" />}
          {platform === "facebook" && <Facebook size={badgeSize} className="text-blue-500" />}
          {platform === "tiktok" && <TikTokIcon size={badgeSize} className="text-white" />}
          {platform === "web" && <Globe size={badgeSize} className="text-sky-400" />}
          {(!platform || platform === "whatsapp") && <MessageCircle size={badgeSize} className="text-emerald-400" />}
        </div>
      )}
    </div>
  );
}
