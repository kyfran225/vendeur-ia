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
  placeholder = "Ex: Cocody Angré, Marcory, Plateau...",
  className,
  inputClassName
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: any) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 44 });

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

    if (!accessToken) return;

    if (newValue.length > 2) {
      setLoading(true);
      try {
        const response = await searchBox.suggest(newValue, {
          sessionToken,
          language: "fr",
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

  const handleSelect = async (suggestion: any) => {
    const selectedAddress = suggestion.full_address || suggestion.place_formatted || suggestion.place_name || suggestion.name;
    onChange(selectedAddress);
    setLoading(true);

    try {
      const result = await searchBox.retrieve(suggestion, {
        sessionToken,
      });
      const feature = result.features?.[0];
      onSelectSuggestion?.(feature || suggestion);
    } catch (err) {
      console.error("Mapbox retrieve error:", err);
      onSelectSuggestion?.(suggestion); // Fallback to basic suggestion
    } finally {
      setLoading(false);
      setShowSuggestions(false);
    }
  };

  return (
    <div className={cn("relative w-full group", className)} ref={containerRef}>
      <div className={cn(
        "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none",
        value ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-white/30 group-focus-within:text-emerald-500"
      )}>
        {loading ? <Loader2 size={15} className="animate-spin" /> : <MapPin size={15} />}
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
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white transition-colors z-10"
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
              width: `${coords.width}px`
            }}
            className="z-[99999] max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#111c18] p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 no-scrollbar"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion.mapbox_id || idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(suggestion);
                }}
                className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer group/item"
              >
                <MapPin size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400">
                    {suggestion.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-white/40 truncate">
                    {suggestion.full_address || suggestion.place_formatted}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Portal.Root>
      )}
    </div>
  );
}
