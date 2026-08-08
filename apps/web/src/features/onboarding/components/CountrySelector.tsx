import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  currency: string;
};

export const COUNTRIES: Country[] = [
  { code: "CI", name: "Côte d'Ivoire",  dialCode: "+225", flag: "https://flagcdn.com/w40/ci.png", currency: "XOF" },
  { code: "SN", name: "Sénégal",        dialCode: "+221", flag: "https://flagcdn.com/w40/sn.png", currency: "XOF" },
  { code: "ML", name: "Mali",           dialCode: "+223", flag: "https://flagcdn.com/w40/ml.png", currency: "XOF" },
  { code: "BF", name: "Burkina Faso",   dialCode: "+226", flag: "https://flagcdn.com/w40/bf.png", currency: "XOF" },
  { code: "NE", name: "Niger",          dialCode: "+227", flag: "https://flagcdn.com/w40/ne.png", currency: "XOF" },
  { code: "TG", name: "Togo",           dialCode: "+228", flag: "https://flagcdn.com/w40/tg.png", currency: "XOF" },
  { code: "BJ", name: "Bénin",          dialCode: "+229", flag: "https://flagcdn.com/w40/bj.png", currency: "XOF" },
  { code: "CM", name: "Cameroun",       dialCode: "+237", flag: "https://flagcdn.com/w40/cm.png", currency: "XAF" },
  { code: "GN", name: "Guinée",         dialCode: "+224", flag: "https://flagcdn.com/w40/gn.png", currency: "GNF" },
  { code: "NG", name: "Nigeria",        dialCode: "+234", flag: "https://flagcdn.com/w40/ng.png", currency: "NGN" },
  { code: "GH", name: "Ghana",          dialCode: "+233", flag: "https://flagcdn.com/w40/gh.png", currency: "GHS" },
  { code: "KE", name: "Kenya",          dialCode: "+254", flag: "https://flagcdn.com/w40/ke.png", currency: "KES" },
  { code: "TZ", name: "Tanzanie",       dialCode: "+255", flag: "https://flagcdn.com/w40/tz.png", currency: "TZS" },
  { code: "ZA", name: "Afrique du Sud", dialCode: "+27",  flag: "https://flagcdn.com/w40/za.png", currency: "ZAR" },
  { code: "MA", name: "Maroc",          dialCode: "+212", flag: "https://flagcdn.com/w40/ma.png", currency: "MAD" },
  { code: "DZ", name: "Algérie",        dialCode: "+213", flag: "https://flagcdn.com/w40/dz.png", currency: "DZD" },
  { code: "TN", name: "Tunisie",        dialCode: "+216", flag: "https://flagcdn.com/w40/tn.png", currency: "TND" },
  { code: "CD", name: "Congo (RDC)",    dialCode: "+243", flag: "https://flagcdn.com/w40/cd.png", currency: "CDF" },
  { code: "MR", name: "Mauritanie",     dialCode: "+222", flag: "https://flagcdn.com/w40/mr.png", currency: "MRU" },
  { code: "FR", name: "France",         dialCode: "+33",  flag: "https://flagcdn.com/w40/fr.png", currency: "EUR" },
  { code: "BE", name: "Belgique",       dialCode: "+32",  flag: "https://flagcdn.com/w40/be.png", currency: "EUR" },
  { code: "US", name: "États-Unis",     dialCode: "+1",   flag: "https://flagcdn.com/w40/us.png", currency: "USD" },
];

export function CountrySelector({
  selected,
  onSelect,
}: {
  selected: Country;
  onSelect: (country: Country) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 text-white transition-all hover:border-vendeur-emerald/50"
      >
        <img src={selected.flag} alt={selected.code} className="w-5 h-auto rounded-sm" />
        <span className="text-[10px] sm:text-xs font-bold text-white/70">{selected.dialCode}</span>
        <ChevronDown size={14} className={cn("text-white/30 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-[110] mt-2 w-56 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-vendeur-coal shadow-2xl animate-in fade-in zoom-in-95 duration-200 no-scrollbar">
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
