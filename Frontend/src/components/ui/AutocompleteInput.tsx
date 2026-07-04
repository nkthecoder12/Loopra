import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/utils/useDebounce";
import { searchPlaces } from "@/lib/mapboxService";
import { Search, X, MapPin } from "lucide-react";
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
        <span key={i} className="bg-blue-500/25 text-blue-400 font-black rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative flex items-center gap-4 w-full" ref={wrapperRef}>
      {icon}
      <div className="flex-1 relative w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-2xl border border-dark-border bg-dark-card-bg py-4 pl-11 pr-11 text-sm font-semibold text-white outline-none shadow-md transition-all duration-[220ms] placeholder:text-zinc-500 focus:border-blue-500/80 focus:ring-4 focus:ring-blue-500/10"
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setPredictions([]);
            }}
            className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            aria-label={`Clear ${placeholder}`}
          >
            <X size={15} />
          </button>
        )}
        {isOpen && (
          <ul className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-auto rounded-2xl border border-dark-border bg-dark-panel-bg p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {!value.trim() && (
              <div className="p-4 text-center text-xs font-semibold text-zinc-500">
                Type address to search Coimbatore places
              </div>
            )}

            {value.trim() && isLoading && predictions.length === 0 && (
              <li className="px-4 py-6 text-center text-sm font-semibold text-zinc-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Searching Coimbatore places...
              </li>
            )}

            {value.trim() && !isLoading && predictions.length === 0 && (
              <li className="px-4 py-6 text-center text-sm font-medium text-zinc-500">
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
                    "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-sm transition-colors hover:bg-zinc-800",
                    index !== predictions.length - 1 && "mb-1"
                  )}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-dark-card-bg text-blue-400">
                    <MapPin size={15} />
                  </span>
                  <span className="min-w-0 text-left">
                    <p className="truncate font-bold text-zinc-100">{highlightText(mainText, value)}</p>
                    {secondaryText && (
                      <p className="truncate text-xs font-semibold text-zinc-400">{secondaryText}</p>
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

