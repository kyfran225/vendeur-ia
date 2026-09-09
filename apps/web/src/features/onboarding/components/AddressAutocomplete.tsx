import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Loader2, X, Navigation, Building2, Map, Landmark } from "lucide-react";
import { useSearchBoxCore } from "@mapbox/search-js-react";
import * as Portal from "@radix-ui/react-portal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { searchAfricanLocations, type AfricanLocation } from "@vendeur-ia/core";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: any) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  countryCode?: string;
  city?: string;
}

interface UnifiedSuggestion {
  id: string;
  name: string;
  secondaryText: string;
  fullAddress: string;
  type: 'neighborhood' | 'commune' | 'city' | 'landmark' | 'street' | 'mapbox';
  badgeLabel?: string;
  badgeClass?: string;
  source: 'local' | 'mapbox';
  raw?: any;
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  neighborhood: {
    label: "Quartier",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: MapPin
  },
  commune: {
    label: "Commune",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-700 dark:text-blue-300",
    icon: Building2
  },
  city: {
    label: "Ville",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    icon: Map
  },
  landmark: {
    label: "Repère clé",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    icon: Landmark
  },
  street: {
    label: "Rue / Axe",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-700 dark:text-cyan-300",
    icon: Navigation
  },
  mapbox: {
    label: "Adresse",
    bg: "bg-slate-500/10 dark:bg-white/10",
    text: "text-slate-600 dark:text-slate-300",
    icon: MapPin
  }
};

export function AddressAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "Ex: Cocody Angré 8ème tranche, Marcory Zone 4, Almadies...",
  className,
  inputClassName,
  countryCode = "CI",
  city
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<UnifiedSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 44 });

  const accessToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;

  // Session token for billing optimization
  const sessionToken = useMemo(() => {
    return Math.random().toString(36).substring(2, 15);
  }, []);

  const searchBox = useSearchBoxCore({
    accessToken: accessToken || ""
  });

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
  };

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!portalRef.current || !portalRef.current.contains(target))
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSuggestions && suggestions.length > 0) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [showSuggestions, suggestions.length]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.trim().length >= 2) {
      setLoading(true);

      // 1. Instant local African database search (West & Central Africa)
      const localMatches: AfricanLocation[] = searchAfricanLocations(newValue, {
        countryCode: countryCode?.toUpperCase() || "CI",
        city: city,
        limit: 8
      });

      const unifiedResults: UnifiedSuggestion[] = localMatches.map((loc) => {
        const secondary = [loc.commune, loc.city, loc.countryName].filter(Boolean).join(", ");
        return {
          id: `local-${loc.id}`,
          name: loc.name,
          secondaryText: secondary,
          fullAddress: loc.formattedAddress,
          type: loc.type,
          source: 'local',
          raw: loc
        };
      });

      // 2. Query Mapbox Geocoding with African country restrictions if token exists
      if (accessToken) {
        try {
          const targetCountries = countryCode
            ? `${countryCode.toLowerCase()},ci,sn,bj,tg,ml,bf,gn,ne,cm,ga,cd,gh`
            : "ci,sn,bj,tg,ml,bf,gn,ne,cm,ga,cd,gh";

          const response = await searchBox.suggest(newValue, {
            sessionToken,
            language: "fr",
            country: targetCountries,
            types: "country,region,postcode,district,place,locality,neighborhood,address,poi,street"
          });

          if (response?.suggestions && response.suggestions.length > 0) {
            for (const item of response.suggestions) {
              const name = item.name || "";
              const fullAddr = item.full_address || item.place_formatted || name;
              
              // Prevent duplicates already covered by high-quality local curated data
              const exists = unifiedResults.some(
                (u) => u.name.toLowerCase() === name.toLowerCase() ||
                       u.fullAddress.toLowerCase() === fullAddr.toLowerCase()
              );

              if (!exists) {
                unifiedResults.push({
                  id: `mapbox-${item.mapbox_id || Math.random()}`,
                  name: name,
                  secondaryText: item.place_formatted || item.full_address || "",
                  fullAddress: fullAddr,
                  type: 'mapbox',
                  source: 'mapbox',
                  raw: item
                });
              }
            }
          }
        } catch (err) {
          console.warn("Mapbox geocoding suggestion warning:", err);
        }
      }

      setSuggestions(unifiedResults);
      setShowSuggestions(unifiedResults.length > 0);
      setLoading(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  };

  const handleSelect = async (suggestion: UnifiedSuggestion) => {
    onChange(suggestion.fullAddress);
    setShowSuggestions(false);

    if (suggestion.source === 'mapbox' && suggestion.raw && accessToken) {
      setLoading(true);
      try {
        const result = await searchBox.retrieve(suggestion.raw, { sessionToken });
        const feature = result.features?.[0];
        onSelectSuggestion?.(feature || suggestion.raw);
      } catch (err) {
        console.error("Mapbox retrieve error:", err);
        onSelectSuggestion?.(suggestion.raw);
      } finally {
        setLoading(false);
      }
    } else {
      onSelectSuggestion?.(suggestion.raw || suggestion);
    }
  };

  return (
    <div className={cn("relative w-full group", className)} ref={containerRef}>
      <div className={cn(
        "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none",
        value ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-white/30 group-focus-within:text-emerald-500"
      )}>
        {loading ? <Loader2 size={15} className="animate-spin text-emerald-500" /> : <MapPin size={15} />}
      </div>

      <input
        type="text"
        className={cn(
          "h-11 w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-vendeur-coal pl-10 pr-9 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-white/30 shadow-inner",
          inputClassName
        )}
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            updateCoords();
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setSuggestions([]);
            setShowSuggestions(false);
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}

      {/* Suggestions Dropdown via Portal */}
      {showSuggestions && suggestions.length > 0 && (
        <Portal.Root>
          <div
            ref={portalRef}
            style={{
              position: 'fixed',
              top: `${coords.top + coords.height + 6}px`,
              left: `${coords.left}px`,
              width: `${Math.max(coords.width, 320)}px`
            }}
            className="z-[99999] max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111c18] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 no-scrollbar divide-y divide-slate-100 dark:divide-white/5"
          >
            {suggestions.map((suggestion) => {
              const conf = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.neighborhood;
              const IconComponent = conf.icon;

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(suggestion);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 cursor-pointer group/item text-left"
                >
                  <div className="mt-0.5 p-1 rounded-lg bg-slate-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">
                    <IconComponent size={14} />
                  </div>

                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">
                        {suggestion.name}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.2 rounded-md tracking-wider uppercase",
                        conf.bg,
                        conf.text
                      )}>
                        {conf.label}
                      </span>
                    </div>

                    {suggestion.secondaryText && (
                      <span className="text-[10px] text-slate-500 dark:text-white/50 truncate">
                        {suggestion.secondaryText}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Portal.Root>
      )}
    </div>
  );
}
