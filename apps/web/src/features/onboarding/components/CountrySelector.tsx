import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { COUNTRIES as GLOBAL_COUNTRIES, CountryData } from "@vendeur-ia/core";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Country = CountryData;

export const COUNTRIES = GLOBAL_COUNTRIES;

export function parsePhoneNumber(phoneStr?: string, defaultCountryCode?: string): { country: Country; local: string } {
  const defaultCountry = (defaultCountryCode ? COUNTRIES.find(c => c.code === defaultCountryCode) : null) || COUNTRIES[0];
  if (!phoneStr) return { country: defaultCountry, local: "" };

  const digits = phoneStr.replace(/\D/g, "");
  if (!digits) return { country: defaultCountry, local: "" };

  // Sort dial codes by length descending (e.g. +225, +221, +33, etc.)
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.replace(/\D/g, "").length - a.dialCode.replace(/\D/g, "").length);

  for (const c of sorted) {
    const rawDial = c.dialCode.replace(/\D/g, "");
    if (digits.startsWith(rawDial) && digits.length > rawDial.length) {
      return { country: c, local: digits.slice(rawDial.length) };
    }
  }

  return { country: defaultCountry, local: digits };
}

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
          "flex h-11 sm:h-12 items-center gap-2 rounded-xl border border-white/25 bg-black/40 px-3 text-white transition-all hover:border-vendeur-emerald/50 cursor-pointer shadow-inner",
          className
        )}
      >
        <img src={selected.flag} alt={selected.code} className="w-5 h-auto rounded-sm" />
        <span className="text-[10px] sm:text-xs font-bold text-white/70">{selected.dialCode}</span>
        <ChevronDown size={14} className={cn("text-white/30 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className={cn(
            "absolute left-0 z-[110] w-56 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-vendeur-coal shadow-2xl animate-in fade-in duration-200 no-scrollbar",
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
                  "flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5",
                  selected.code === country.code ? "bg-vendeur-emerald/5 text-vendeur-emerald" : "text-white/70"
                )}
              >
                <div className="flex items-center gap-3">
                  <img src={country.flag} alt={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none mb-1">{country.code}</p>
                    <p className="text-[10px] opacity-50 truncate">{country.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold opacity-40">{country.dialCode}</span>
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
