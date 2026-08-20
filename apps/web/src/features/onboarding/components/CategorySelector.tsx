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
          "w-full h-11 md:h-9 rounded-xl bg-black/40 border border-white/10 px-3 text-white flex items-center justify-between text-xs md:text-[11px] font-medium outline-none transition-all hover:border-emerald-400/50 focus:border-emerald-400 cursor-pointer shadow-inner",
          open && "border-emerald-400 ring-1 ring-emerald-400/20"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <span className="text-sm shrink-0">{selectedCategory.icon}</span>
          <span className="truncate text-white font-medium">{selectedCategory.name}</span>
        </span>
        <ChevronDown
          size={14}
          className={cn("text-white/40 transition-transform duration-200 shrink-0 ml-1.5", open && "rotate-180 text-emerald-400")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-[120] w-full max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0f1411] shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-0.5 custom-scrollbar">
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
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer",
                  isSelected
                    ? "bg-emerald-400/10 text-emerald-400 font-bold"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs truncate font-medium">{cat.name}</p>
                    <p className="text-[9px] text-white/30 truncate leading-tight">{cat.desc}</p>
                  </div>
                </div>
                {isSelected && <Check size={13} className="text-emerald-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
