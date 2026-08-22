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

export function normalizeCILocal(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (!digits) return "";

  // 10-digit standard
  if (digits.length === 10) {
    return digits;
  }

  // 8-digit legacy restoration
  if (digits.length === 8) {
    // Moov prefixes: 01, 02, 03, 40-43, 50-53, 70-73
    if (/^(01|02|03|40|41|42|43|50|51|52|53|70|71|72|73)/.test(digits)) {
      return `01${digits}`;
    }
    // MTN prefixes: 04, 05, 06, 44-46, 54-56, 74-76, 84-86
    if (/^(04|05|06|44|45|46|54|55|56|74|75|76|84|85|86)/.test(digits)) {
      return `05${digits}`;
    }
    // Orange prefixes: 07, 08, 09, 47-49, 57-59, 77-79, 87-89
    if (/^(07|08|09|47|48|49|57|58|59|77|78|79|87|88|89)/.test(digits)) {
      return `07${digits}`;
    }
    // Landlines
    if (/^(20|21|22|23|24)/.test(digits)) {
      return `21${digits}`;
    }
    if (/^(25|26|27)/.test(digits)) {
      return `25${digits}`;
    }
    // Default fallback for any 8-digit CI number
    return `01${digits}`;
  }

  // 9-digit (missing leading 0)
  if (digits.length === 9) {
    return `0${digits}`;
  }

  return digits;
}

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
      let local = digits.slice(rawDial.length);
      // Smart prefix restoration for Côte d'Ivoire (10-digit national plan)
      if (c.code === "CI") {
        local = normalizeCILocal(local);
      }
      return { country: c, local };
    }
  }

  // If digits without dialCode (e.g. 0102273966 or 02273966)
  let local = digits;
  if (defaultCountry.code === "CI") {
    local = normalizeCILocal(local);
  }

  return { country: defaultCountry, local };
}

export function formatDisplayPhone(phoneStr?: string, defaultCountryCode?: string): string {
  if (!phoneStr) return "";
  const { country, local } = parsePhoneNumber(phoneStr, defaultCountryCode);
  if (!local) return country.dialCode;
  
  if (country.code === "CI" && local.length === 10) {
    return `${country.dialCode} ${local.slice(0, 2)} ${local.slice(2, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
  }
  return `${country.dialCode} ${local}`;
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
          "flex h-14 items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3.5 text-white transition-all hover:border-vendeur-emerald/50 cursor-pointer shadow-inner",
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
