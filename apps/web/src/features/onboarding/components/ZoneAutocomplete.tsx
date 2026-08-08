import { useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";
import { useSearchBoxCore } from "@mapbox/search-js-react";
import * as Portal from "@radix-ui/react-portal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ZoneAutocomplete({
  value,
  onChange,
  city,
  countryCode,
  placeholder = "Ex: Plateau, Cocody...",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  city?: string;
  countryCode?: string;
  placeholder?: string;
  className?: string;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const accessToken = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN;

  const sessionToken = useMemo(() => {
    return Math.random().toString(36).substring(2, 15);
  }, []);

  const searchBox = useSearchBoxCore({
    accessToken
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

    if (!accessToken) return;

    if (newValue.length > 1) {
      setLoading(true);
      try {
        // We use the city in the proximity search rather than the query string to avoid polluting it
        const response = await searchBox.suggest(newValue, {
          sessionToken,
          types: "district,neighborhood,locality,place",
          country: countryCode?.toLowerCase(),
          // Use city/place for hint if possible, otherwise we rely on search query
          language: "fr"
        });

        let filtered = response.suggestions || [];

        // If we have a city, we prioritize results that are in that city
        if (city && newValue.length < 5) {
          const cityLower = city.toLowerCase();
          filtered = filtered.sort((a: any, b: any) => {
            const aInCity = a.place_formatted?.toLowerCase().includes(cityLower) || a.full_address?.toLowerCase().includes(cityLower);
            const bInCity = b.place_formatted?.toLowerCase().includes(cityLower) || b.full_address?.toLowerCase().includes(cityLower);
            if (aInCity && !bInCity) return -1;
            if (!aInCity && bInCity) return 1;
            return 0;
          });
        }

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Mapbox zone search error:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (suggestion: any) => {
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
          "h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-11 pr-10 text-white outline-none focus:border-sky-500 transition-all placeholder:text-white/10 text-xs",
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
          onClick={() => {
            onChange("");
            setSuggestions([]);
            setShowSuggestions(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/20 hover:text-white transition-colors z-10"
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
              width: `${coords.width}px`
            }}
            className="z-[9999] max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-vendeur-coal p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200 no-scrollbar"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.mapbox_id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="flex w-full flex-col gap-0.5 rounded-lg px-4 py-2.5 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-xs font-bold text-white leading-tight">
                  {suggestion.name}
                </span>
                <span className="text-[9px] text-white/40 truncate">
                  {suggestion.place_formatted || suggestion.full_address}
                </span>
              </button>
            ))}
          </div>
        </Portal.Root>
      )}
    </div>
  );
}
