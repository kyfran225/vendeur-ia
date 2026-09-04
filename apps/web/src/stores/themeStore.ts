import { create } from "zustand";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

const STORAGE_KEY = "vendeuria-theme";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyThemeToDOM(resolved: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  
  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
  
  root.setAttribute("data-theme", resolved);

  // Update mobile browser chrome / status bar theme color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", resolved === "dark" ? "#07100d" : "#ffffff");
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  resolvedTheme: "dark",

  initTheme: () => {
    if (typeof window === "undefined") return;
    
    const savedTheme = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    // Si l'utilisateur n'a jamais choisi manuellement, on suit son navigateur par défaut
    const resolved = (savedTheme === "light" || savedTheme === "dark") ? savedTheme : getSystemTheme();
    
    applyThemeToDOM(resolved);
    set({ theme: resolved, resolvedTheme: resolved });

    // Écoute automatique des changements du navigateur
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      // Lorsque le thème du navigateur/système change, l'application synchronise immédiatement
      const newResolved: ThemeMode = e.matches ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, newResolved);
      applyThemeToDOM(newResolved);
      set({ theme: newResolved, resolvedTheme: newResolved });
    };

    try {
      mediaQuery.addEventListener("change", handleChange);
    } catch {
      mediaQuery.addListener(handleChange);
    }
  },

  setTheme: (newTheme: ThemeMode) => {
    if (typeof window === "undefined") return;

    localStorage.setItem(STORAGE_KEY, newTheme);
    applyThemeToDOM(newTheme);
    set({ theme: newTheme, resolvedTheme: newTheme });
  },

  toggleTheme: () => {
    const current = get().resolvedTheme;
    const next: ThemeMode = current === "dark" ? "light" : "dark";
    get().setTheme(next);
  }
}));
