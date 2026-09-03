import React from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "button" | "segmented";
  className?: string;
}

export function ThemeToggle({ variant = "button", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme, toggleTheme } = useThemeStore();

  // Segmented control (utilisé dans la page Paramètres)
  if (variant === "segmented") {
    return (
      <div className={cn("inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 gap-1", className)}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            resolvedTheme === "light"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
          )}
        >
          <Sun size={15} className="text-amber-500" />
          <span>Clair</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
            resolvedTheme === "dark"
              ? "bg-vendeur-emerald text-vendeur-coal font-black shadow-sm"
              : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
          )}
        >
          <Moon size={15} />
          <span>Sombre</span>
        </button>
      </div>
    );
  }

  // 1-Click Direct Header Button (Pas de liste déroulante, bascule directe)
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all overflow-hidden group shadow-sm cursor-pointer active:scale-95",
        "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-vendeur-emerald",
        className
      )}
      title={isDark ? "Passer en mode clair ☀️" : "Passer en mode sombre 🌙"}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      {isDark ? (
        <Sun size={19} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon size={19} className="text-slate-700 group-hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
