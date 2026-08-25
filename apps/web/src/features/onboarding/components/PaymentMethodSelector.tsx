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
  const methods = getProvidersForCountry(countryCode || "CI");

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
            <div key={id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/5 animate-in slide-in-from-left-2 duration-300">
               <div className="flex items-center gap-1.5 min-w-[120px]">
                 <div className={cn("h-2 w-2 rounded-full shrink-0", meta.color)} />
                 <span className="text-[10px] font-black uppercase text-white/70 truncate">{meta.label}</span>
               </div>
               <div className="flex-1 flex items-center gap-2">
                 <input
                   className="flex-1 h-10 rounded-lg border border-white/10 bg-black/40 px-3 text-white text-xs outline-none focus:border-vendeur-emerald transition-all font-mono"
                   placeholder={meta.placeholder || (meta.inputKind === "iban" ? "IBAN / Coordonnées..." : "Numéro...")}
                   value={num === "FIXME" ? "" : num}
                   autoFocus={num === "FIXME"}
                   onChange={(e) => update(id, e.target.value)}
                 />
                 <button type="button" onClick={() => update(id, "")} className="text-white/30 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                   <X size={14} />
                 </button>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
