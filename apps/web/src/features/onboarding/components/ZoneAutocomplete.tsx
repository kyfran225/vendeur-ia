import React, { useEffect, useRef, useState, useMemo } from "react";
import { Loader2, X, Search, MapPin, Building2, Map, Landmark, Navigation } from "lucide-react";
import { useSearchBoxCore } from "@mapbox/search-js-react";
import * as Portal from "@radix-ui/react-portal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { searchAfricanLocations, type AfricanLocation } from "@vendeur-ia/core";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ZoneSuggestionItem {
  id: string;
  name: string;
  secondaryText: string;
  type: string;
  source: 'local' | 'mapbox';
  raw?: any;
}

const TYPE_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  neighborhood: { label: "Quartier", bg: "bg-emerald-500/10 text-emerald-400", text: "text-emerald-400" },
  commune: { label: "Commune", bg: "bg-blue-500/10 text-blue-400", text: "text-blue-400" },
  city: { label: "Ville", bg: "bg-purple-500/10 text-purple-400", text: "text-purple-400" },
  landmark: { label: "Repère", bg: "bg-amber-500/10 text-amber-400", text: "text-amber-400" },
  street: { label: "Axe / Rue", bg: "bg-cyan-500/10 text-cyan-400", text: "text-cyan-400" },
  mapbox: { label: "Zone", bg: "bg-white/10 text-white/70", text: "text-white/70" }
};

export function ZoneAutocomplete({
  value,
  onChange,
  city,
  countryCode = "CI",
  placeholder = "Ex: Plateau, Cocody Angré, Almadies, Zone 4...",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  city?: string;
  countryCode?: string;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<ZoneSuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const accessToken = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN;

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
        width: rect.width
      });
    }
  };

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

    if (newValue.trim().length > 1) {
      setLoading(true);

      // 1. Search local curated African database
      const localMatches = searchAfricanLocations(newValue, {
        countryCode: countryCode?.toUpperCase() || "CI",
        city: city,
        limit: 7
      });

      const unified: ZoneSuggestionItem[] = localMatches.map((loc) => ({
        id: `local-${loc.id}`,
        name: loc.name,
        secondaryText: [loc.commune, loc.city, loc.countryName].filter(Boolean).join(", "),
        type: loc.type,
        source: 'local',
        raw: loc
      }));

      // 2. Query Mapbox if available
      if (accessToken) {
        try {
          const targetCountries = countryCode
            ? `${countryCode.toLowerCase()},ci,sn,bj,tg,ml,bf,gn,ne,cm,ga,cd,gh`
            : "ci,sn,bj,tg,ml,bf,gn,ne,cm,ga,cd,gh";

          const response = await searchBox.suggest(newValue, {
            sessionToken,
            types: "district,neighborhood,locality,place",
            country: targetCountries,
            language: "fr"
          });

          const mapboxSuggestions = response?.suggestions || [];
          for (const item of mapboxSuggestions) {
            const name = item.name || "";
            const exists = unified.some(u => u.name.toLowerCase() === name.toLowerCase());
            if (!exists) {
              unified.push({
                id: `mapbox-${item.mapbox_id || Math.random()}`,
                name: name,
                secondaryText: item.place_formatted || item.full_address || "",
                type: 'mapbox',
                source: 'mapbox',
                raw: item
              });
            }
          }
        } catch (err) {
          console.error("Mapbox zone search error:", err);
        }
      }

      setSuggestions(unified);
      setShowSuggestions(unified.length > 0);
      setLoading(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: ZoneSuggestionItem) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full group" ref={containerRef}>
      <div className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10",
        value ? "text-sky-500" : "text-white/20 group-focus-within:text-sky-500"
      )}>
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
      </div>

      <input
        type="text"
        className={cn(
          "h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-11 pr-10 text-white outline-none focus:border-sky-500 transition-all placeholder:text-white/20 text-xs",
          className
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
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/20 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X size={12} />
        </button>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <Portal.Root>
          <div
            ref={portalRef}
            style={{
              position: 'fixed',
              top: `${coords.top + 48 + 4}px`,
              left: `${coords.left}px`,
              width: `${Math.max(coords.width, 300)}px`
            }}
            className="z-[99999] max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-vendeur-coal p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200 no-scrollbar divide-y divide-white/5"
          >
            {suggestions.map((suggestion) => {
              const badge = TYPE_BADGES[suggestion.type] || TYPE_BADGES.neighborhood;
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(suggestion);
                  }}
                  className="flex w-full flex-col gap-0.5 rounded-lg px-3.5 py-2 text-left transition-colors hover:bg-white/5 cursor-pointer group/item"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white leading-tight group-hover/item:text-sky-400 transition-colors">
                      {suggestion.name}
                    </span>
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded tracking-wider uppercase", badge.bg)}>
                      {badge.label}
                    </span>
                  </div>
                  {suggestion.secondaryText && (
                    <span className="text-[10px] text-white/40 truncate">
                      {suggestion.secondaryText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Portal.Root>
      )}
    </div>
  );
}
