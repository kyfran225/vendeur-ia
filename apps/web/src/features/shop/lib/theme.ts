export interface ShopTheme {
  id: string;
  primary: string;
  bgClass: string;
  hoverBgClass: string;
  textClass: string;
  borderClass: string;
  badgeBgClass: string;
  badgeBorderClass: string;
  shadowClass: string;
  ringClass: string;
  gradient: string;
}

export const SHOP_THEMES: Record<string, ShopTheme> = {
  emerald: {
    id: "emerald",
    primary: "#10B981",
    bgClass: "bg-emerald-500",
    hoverBgClass: "hover:bg-emerald-400",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-500/30 dark:border-emerald-500/40",
    badgeBgClass: "bg-emerald-500/10 dark:bg-emerald-500/15",
    badgeBorderClass: "border-emerald-500/20 dark:border-emerald-500/30",
    shadowClass: "shadow-emerald-500/20",
    ringClass: "focus:border-emerald-500",
    gradient: "from-emerald-500 via-emerald-400 to-teal-500"
  },
  gold: {
    id: "gold",
    primary: "#EAB308",
    bgClass: "bg-yellow-500",
    hoverBgClass: "hover:bg-yellow-400",
    textClass: "text-amber-600 dark:text-yellow-400",
    borderClass: "border-yellow-500/30 dark:border-yellow-500/40",
    badgeBgClass: "bg-yellow-500/10 dark:bg-yellow-500/15",
    badgeBorderClass: "border-yellow-500/20 dark:border-yellow-500/30",
    shadowClass: "shadow-yellow-500/20",
    ringClass: "focus:border-yellow-500",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600"
  },
  amber: {
    id: "amber",
    primary: "#F97316",
    bgClass: "bg-orange-500",
    hoverBgClass: "hover:bg-orange-400",
    textClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-500/30 dark:border-orange-500/40",
    badgeBgClass: "bg-orange-500/10 dark:bg-orange-500/15",
    badgeBorderClass: "border-orange-500/20 dark:border-orange-500/30",
    shadowClass: "shadow-orange-500/20",
    ringClass: "focus:border-orange-500",
    gradient: "from-orange-500 via-amber-500 to-red-500"
  },
  violet: {
    id: "violet",
    primary: "#6366F1",
    bgClass: "bg-indigo-500",
    hoverBgClass: "hover:bg-indigo-400",
    textClass: "text-indigo-600 dark:text-indigo-400",
    borderClass: "border-indigo-500/30 dark:border-indigo-500/40",
    badgeBgClass: "bg-indigo-500/10 dark:bg-indigo-500/15",
    badgeBorderClass: "border-indigo-500/20 dark:border-indigo-500/30",
    shadowClass: "shadow-indigo-500/20",
    ringClass: "focus:border-indigo-500",
    gradient: "from-indigo-500 via-purple-500 to-pink-500"
  },
  rose: {
    id: "rose",
    primary: "#EC4899",
    bgClass: "bg-pink-500",
    hoverBgClass: "hover:bg-pink-400",
    textClass: "text-pink-600 dark:text-pink-400",
    borderClass: "border-pink-500/30 dark:border-pink-500/40",
    badgeBgClass: "bg-pink-500/10 dark:bg-pink-500/15",
    badgeBorderClass: "border-pink-500/20 dark:border-pink-500/30",
    shadowClass: "shadow-pink-500/20",
    ringClass: "focus:border-pink-500",
    gradient: "from-pink-500 via-rose-400 to-purple-500"
  },
  sky: {
    id: "sky",
    primary: "#0EA5E9",
    bgClass: "bg-sky-500",
    hoverBgClass: "hover:bg-sky-400",
    textClass: "text-sky-600 dark:text-sky-400",
    borderClass: "border-sky-500/30 dark:border-sky-500/40",
    badgeBgClass: "bg-sky-500/10 dark:bg-sky-500/15",
    badgeBorderClass: "border-sky-500/20 dark:border-sky-500/30",
    shadowClass: "shadow-sky-500/20",
    ringClass: "focus:border-sky-500",
    gradient: "from-sky-500 via-blue-400 to-cyan-500"
  }
};

export function getShopTheme(accentColor?: string): ShopTheme {
  const normalized = (accentColor || "emerald").toLowerCase().trim();
  return SHOP_THEMES[normalized] || SHOP_THEMES.emerald;
}
