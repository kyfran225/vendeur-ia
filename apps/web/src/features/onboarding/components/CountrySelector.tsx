import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  COUNTRIES as GLOBAL_COUNTRIES,
  CountryData,
  normalizeCILocal,
  parsePhoneNumber,
  formatDisplayPhone,
  generatePhoneVariants
} from "@vendeur-ia/core";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Country = CountryData;
export const COUNTRIES = GLOBAL_COUNTRIES;

export { normalizeCILocal, parsePhoneNumber, formatDisplayPhone, generatePhoneVariants };

export function CountrySelector({
  selected,
  onSelect,
  dropdownPosition = "bottom",
  className,
}: {
  selected: Country;
  onSelect: (country: Country) => void;
  dropdownPosition?: "top" | "bottom";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-11 sm:h-12 items-center gap-2 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 px-3 sm:px-3.5 text-slate-900 dark:text-white transition-all hover:border-emerald-500/50 cursor-pointer shadow-inner shrink-0",
          className
        )}
      >
        <img src={selected.flag} alt={selected.code} className="w-5 h-auto rounded-sm" />
        <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-white/70">{selected.dialCode}</span>
        <ChevronDown size={14} className={cn("text-slate-400 dark:text-white/30 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute left-0 z-[110] w-56 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-vendeur-coal shadow-2xl animate-in fade-in duration-200 no-scrollbar",
            dropdownPosition === "top"
              ? "bottom-full mb-2 slide-in-from-bottom-2 origin-bottom"
              : "top-full mt-2 slide-in-from-top-2 origin-top"
          )}>
            {COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onSelect(country);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/5",
                  selected.code === country.code ? "bg-emerald-50 dark:bg-vendeur-emerald/5 text-emerald-600 dark:text-vendeur-emerald" : "text-slate-700 dark:text-white/70"
                )}
              >
                <div className="flex items-center gap-3">
                  <img src={country.flag} alt={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none mb-1">{country.code}</p>
                    <p className="text-[10px] opacity-60 truncate">{country.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold opacity-50">{country.dialCode}</span>
                   {selected.code === country.code && <Check size={12} />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
