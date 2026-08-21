import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: "fashion", name: "Mode & Habillement", icon: "👗", desc: "Vêtements, chaussures, sacs & accessoires" },
  { id: "food", name: "Restauration & Food", icon: "🍔", desc: "Fast-food, plats traiteur, pâtisserie" },
  { id: "beauty", name: "Soins & Cosmétiques", icon: "💄", desc: "Maquillage, soins cheveux, parfums" },
  { id: "electronics", name: "Électronique & High-Tech", icon: "📱", desc: "Smartphones, ordinateurs, accessoires" },
  { id: "artisan", name: "Artisanat & Fait Main", icon: "🛠️", desc: "Créations uniques, couture, déco" },
  { id: "services", name: "Prestations de Services", icon: "💼", desc: "Coaching, consultations, réparations" },
  { id: "digital", name: "Produits Digitaux", icon: "📚", desc: "E-books, formations, fichiers PDF" },
  { id: "home", name: "Maison & Décoration", icon: "🏠", desc: "Meubles, literie, luminaires" },
  { id: "grocery", name: "Épicerie & Supérette", icon: "🛒", desc: "Produits vivriers, alimentation générale" },
  { id: "health", name: "Santé & Bien-être", icon: "💊", desc: "Compléments, tisanes, produits bio" },
  { id: "auto", name: "Auto-Moto & Pièces", icon: "🚗", desc: "Pièces détachées, accessoires" },
  { id: "other", name: "Autre Commerce", icon: "📦", desc: "Tout autre type d'activité" },
];

export function CategorySelector({
  value,
  onChange,
  className
}: {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = CATEGORIES.find(c => c.id === value) || CATEGORIES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={dropdownRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-12 md:h-10 rounded-xl bg-black/40 border border-white/25 px-3.5 text-white flex items-center justify-between text-sm md:text-xs font-semibold outline-none transition-all hover:border-emerald-400/50 focus:border-emerald-400 cursor-pointer shadow-inner",
          open && "border-emerald-400 ring-1 ring-emerald-400/20"
        )}
      >
        <span className="flex items-center gap-2.5 truncate">
          <span className="text-base shrink-0">{selectedCategory.icon}</span>
          <span className="truncate text-white font-semibold">{selectedCategory.name}</span>
        </span>
        <ChevronDown
          size={16}
          className={cn("text-white/40 transition-transform duration-200 shrink-0 ml-2", open && "rotate-180 text-emerald-400")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-[120] w-full max-h-72 overflow-y-auto rounded-2xl border border-white/15 bg-[#0e1411] shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1 custom-scrollbar backdrop-blur-xl">
          {CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedCategory.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer",
                  isSelected
                    ? "bg-emerald-400/15 text-emerald-300 font-bold border border-emerald-400/20"
                    : "text-white/85 hover:bg-white/8 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{cat.name}</p>
                    <p className="text-xs text-white/45 truncate mt-0.5">{cat.desc}</p>
                  </div>
                </div>
                {isSelected && <Check size={16} className="text-emerald-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
