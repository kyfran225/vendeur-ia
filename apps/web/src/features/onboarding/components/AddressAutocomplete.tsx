import { useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { useSearchBoxCore } from "@mapbox/search-js-react";
import * as Portal from "@radix-ui/react-portal";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "Ex: Rue 12, Plateaux, face à...",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: any) => void;
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

  // Create a session token for billing optimization
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

    if (!accessToken) return;

    if (newValue.length > 2) {
      setLoading(true);
      try {
        const response = await searchBox.suggest(newValue, {
          sessionToken,
          language: "fr",
          country: "ci,sn,gn,ml,bf,ne,tg,bj,cm" // Restrict to West Africa
        });
        setSuggestions(response.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Mapbox search error:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (suggestion: any) => {
    const selectedAddress = suggestion.full_address || suggestion.place_name || suggestion.name;
    onChange(selectedAddress);
    onSelectSuggestion?.(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full group" ref={containerRef}>
      <div className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10",
        value ? "text-vendeur-emerald" : "text-white/20 group-focus-within:text-vendeur-emerald"
      )}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
      </div>

      <input
        type="text"
        className={cn(
          "h-12 w-full rounded-xl border border-white/10 bg-black/40 pl-11 pr-10 text-white outline-none focus:border-vendeur-emerald transition-all placeholder:text-white/10",
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
          <X size={14} />
        </button>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Portal.Root>
          <div
            ref={portalRef}
            style={{
              position: 'fixed',
              top: `${coords.top + 48 + 8}px`,
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
                className="flex w-full flex-col gap-0.5 rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
              >
                <span className="text-sm font-bold text-white leading-tight">
                  {suggestion.name}
                </span>
                <span className="text-[10px] text-white/40 truncate">
                  {suggestion.full_address || suggestion.place_formatted}
                </span>
              </button>
            ))}
          </div>
        </Portal.Root>
      )}
    </div>
  );
}
