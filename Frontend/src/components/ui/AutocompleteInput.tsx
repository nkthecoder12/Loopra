import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/utils/useDebounce";
import { searchPlaces } from "@/lib/mapboxService";
import { Search, X, MapPin, Home, Briefcase, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationResult {
  address: string;
  lat: number;
  lng: number;
}

interface AutocompleteInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: LocationResult) => void;
  icon?: React.ReactNode;
}

const DEFAULT_SAVED = [
  { label: "PSG College of Technology, Avinashi Road, Peelamedu, Coimbatore", lat: 11.0247, lng: 77.0028, type: "home", title: "Home (PSG Tech)" },
  { label: "TIDEL Park Coimbatore, Aerodrome Post, Civil Aerodrome, Coimbatore", lat: 11.0284, lng: 77.0267, type: "work", title: "Work (TIDEL Park)" },
];

const RECENT_SEARCHES = [
  { label: "Coimbatore Junction Railway Station, State Bank Road, Coimbatore", lat: 10.9980, lng: 76.9680 },
  { label: "Coimbatore International Airport (CJB), Avinashi Road, Peelamedu", lat: 11.0300, lng: 77.0434 },
];

export const AutocompleteInput = ({
  placeholder,
  value,
  onChange,
  onSelect,
  icon,
}: AutocompleteInputProps) => {
  const [predictions, setPredictions] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedValue = useDebounce(value, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedValue || !isOpen) {
      if (!debouncedValue) {
        queueMicrotask(() => setPredictions([]));
      }
      return;
    }

    const controller = new AbortController();
    queueMicrotask(() => setIsLoading(true));

    searchPlaces(debouncedValue, controller.signal)
      .then((results) => {
        setPredictions(results);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const error = err as Error;
        if (error.name !== "AbortError") {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedValue, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: { label: string; lat: number; lng: number }) => {
    onChange(result.label);
    setIsOpen(false);
    onSelect({
      address: result.label,
      lat: result.lat,
      lng: result.lng,
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-primary/15 text-primary font-black rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative flex items-center gap-4" ref={wrapperRef}>
      {icon}
      <div className="flex-1 relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-premium border border-border bg-surface py-4 pl-11 pr-11 text-sm font-semibold text-text-primary outline-none shadow-sm transition-all duration-[220ms] placeholder:text-text-secondary focus:border-accent focus:ring-4 focus:ring-accent/15"
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setPredictions([]);
            }}
            className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
            aria-label={`Clear ${placeholder}`}
          >
            <X size={15} />
          </button>
        )}
        {isOpen && (
          <ul className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-premium border border-border bg-surface p-2 shadow-premium animate-in fade-in zoom-in-95 duration-200">
            {!value.trim() && (
              <div className="p-2 space-y-3">
                <div className="px-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Saved Places</div>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_SAVED.map((saved, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelect(saved)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background hover:bg-primary/5 border border-border/50 text-left transition-all"
                    >
                      {saved.type === "home" ? (
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Home size={14} /></span>
                      ) : (
                        <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Briefcase size={14} /></span>
                      )}
                      <span className="truncate text-xs font-bold text-primary">{saved.title}</span>
                    </button>
                  ))}
                </div>

                <div className="px-2 text-[10px] font-black uppercase tracking-widest text-gray-400 pt-2">Recent Searches</div>
                {RECENT_SEARCHES.map((recent, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelect(recent)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs transition-colors hover:bg-background cursor-pointer"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-background text-gray-400">
                      <Clock size={14} />
                    </span>
                    <span className="truncate font-medium text-text-primary">{recent.label}</span>
                  </li>
                ))}
              </div>
            )}

            {value.trim() && isLoading && predictions.length === 0 && (
              <li className="px-4 py-6 text-center text-sm font-semibold text-text-secondary flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Searching Coimbatore places...
              </li>
            )}

            {value.trim() && !isLoading && predictions.length === 0 && (
              <li className="px-4 py-6 text-center text-sm font-medium text-gray-500">
                No matching locations found in Coimbatore.
              </li>
            )}

            {value.trim() && predictions.map((prediction, index) => {
              const parts = prediction.label.split(",");
              const mainText = parts[0]?.trim() || prediction.label;
              const secondaryText = parts.slice(1).join(",").trim();

              return (
                <li
                  key={`${prediction.lat}-${prediction.lng}-${index}`}
                  onClick={() => handleSelect(prediction)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-background",
                    index !== predictions.length - 1 && "mb-1"
                  )}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
                    <MapPin size={15} />
                  </span>
                  <span className="min-w-0 text-left">
                    <p className="truncate font-bold text-text-primary">{highlightText(mainText, value)}</p>
                    {secondaryText && (
                      <p className="truncate text-xs font-medium text-text-secondary">{secondaryText}</p>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
