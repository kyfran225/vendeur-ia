import { useMemo } from "react";
import { X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getProvidersForCountry } from "@vendeur-ia/core";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PaymentMethodSelector({
  value,
  countryCode,
  onChange
}: {
  value: string;
  countryCode?: string;
  onChange: (val: string) => void;
}) {
  const methods = getProvidersForCountry(countryCode || "CI").map(p => ({
    id: p.id,
    label: p.label,
    color: p.color
  }));

  const parsed = useMemo(() => {
    const map: Record<string, string> = {};
    if (!value) return map;
    value.split(";").forEach(p => {
      const [id, num] = p.split(":");
      if (id && num) map[id] = num;
    });
    return map;
  }, [value]);

  const update = (id: string, num: string) => {
    const newMap = { ...parsed, [id]: num };
    if (!num) delete newMap[id];
    onChange(Object.entries(newMap).map(([k, v]) => `${k}:${v}`).join(";"));
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {methods.map(m => {
          const isActive = !!parsed[m.id];
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (isActive) update(m.id, "");
                else update(m.id, "FIXME"); // Trigger input focus
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                isActive
                  ? "border-vendeur-emerald bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-vendeur-emerald/20"
                  : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
              )}
            >
              <div className={cn("h-1.5 w-1.5 rounded-full", m.color)} />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2">
        {Object.entries(parsed).map(([id, num]) => {
          const meta = methods.find(m => m.id === id);
          if (!meta) return null;
          return (
            <div key={id} className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
               <div className={cn("w-14 shrink-0 text-[10px] font-black uppercase text-white/40")}>{meta.label}</div>
               <input
                 className="flex-1 h-10 rounded-lg border border-white/5 bg-black/40 px-3 text-white text-xs outline-none focus:border-vendeur-emerald transition-all"
                 placeholder={id === "visa" ? "Lien ou IBAN..." : `Numéro...`}
                 value={num === "FIXME" ? "" : num}
                 autoFocus={num === "FIXME"}
                 onChange={(e) => update(id, e.target.value)}
               />
               <button type="button" onClick={() => update(id, "")} className="text-white/20 hover:text-red-400 p-1">
                 <X size={14} />
               </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
