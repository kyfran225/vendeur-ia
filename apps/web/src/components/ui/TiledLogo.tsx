import React from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

interface TiledLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export const TiledLogo: React.FC<TiledLogoProps> = ({
  size = 40,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 rounded-2xl bg-[#07100d] border border-white/10 shadow-xl p-2.5",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Logo size="100%" leftBranchColor="#ffffff" rightBranchColor="#10b981" {...props} />
    </div>
  );
};
