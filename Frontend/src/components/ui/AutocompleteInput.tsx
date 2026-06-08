"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/utils/useDebounce";
import { searchPlaces } from "@/lib/openRouteService";

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
      setPredictions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    searchPlaces(debouncedValue).then((results) => {
      if (!cancelled) {
        setPredictions(results);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
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

  return (
    <div className="relative flex items-center gap-4" ref={wrapperRef}>
      {icon}
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-surface border-none rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
        />
        {isOpen && (predictions.length > 0 || isLoading) && (
          <ul className="absolute z-50 w-full bg-white mt-1 rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-auto">
            {isLoading && predictions.length === 0 && (
              <li className="px-4 py-3 text-sm text-gray-400">Searching...</li>
            )}
            {predictions.map((prediction, index) => {
              const parts = prediction.label.split(",");
              const mainText = parts[0]?.trim() || prediction.label;
              const secondaryText = parts.slice(1).join(",").trim();

              return (
                <li
                  key={`${prediction.lat}-${prediction.lng}-${index}`}
                  onClick={() => handleSelect(prediction)}
                  className="px-4 py-3 hover:bg-surface cursor-pointer text-sm border-b border-gray-50 last:border-0"
                >
                  <p className="font-bold text-primary truncate">{mainText}</p>
                  {secondaryText && (
                    <p className="text-xs text-gray-500 truncate">{secondaryText}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
