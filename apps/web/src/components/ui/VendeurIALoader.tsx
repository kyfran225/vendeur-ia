import React from "react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

interface VendeurIALoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullscreen?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { logo: 22, ring: "h-11 w-11 border-[2px]", aura: "h-11 w-11", text: "text-[10px]" },
  md: { logo: 34, ring: "h-16 w-16 border-[2.5px]", aura: "h-16 w-16", text: "text-xs" },
  lg: { logo: 46, ring: "h-20 w-20 border-[3px]", aura: "h-20 w-20", text: "text-xs md:text-sm" },
  xl: { logo: 64, ring: "h-28 w-28 border-[3.5px]", aura: "h-28 w-28", text: "text-sm md:text-base" },
};

export const VendeurIALoader: React.FC<VendeurIALoaderProps> = ({
  size = "lg",
  label,
  fullscreen = false,
  className,
}) => {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 select-none animate-in fade-in duration-300",
        fullscreen ? "fixed inset-0 z-[60] bg-[#07100d] p-4" : "py-12 w-full",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Neon Glow Aura */}
        <div
          className={cn(
            "absolute rounded-full bg-vendeur-emerald/20 blur-xl pointer-events-none",
            config.aura
          )}
        />

        {/* Outer Tech Ring with Emerald Accents */}
        <div
          className={cn(
            "rounded-full border-white/5 border-t-vendeur-emerald border-r-vendeur-emerald/40 animate-brand-ring",
            config.ring
          )}
        />

        {/* Center Logo with Breathing Pulse and Emerald Glow */}
        <div className="absolute inset-0 flex items-center justify-center animate-brand-pulse">
          <Logo
            size={config.logo}
            leftBranchColor="#ffffff"
            rightBranchColor="#10b981"
          />
        </div>
      </div>

      {label && (
        <div className="flex flex-col items-center gap-1.5 animate-in fade-in duration-500">
          <p className={cn("font-black uppercase tracking-[0.2em] text-white/70 text-center", config.text)}>
            {label}
          </p>
          <div className="h-0.5 w-10 bg-gradient-to-r from-transparent via-vendeur-emerald to-transparent rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
};
