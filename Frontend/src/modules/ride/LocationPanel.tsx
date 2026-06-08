"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Search, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { Location } from '@/store/useRideStore';

export const LocationPanel = ({ onSearch }: { onSearch: (pickup: Location, drop: Location) => void }) => {
  const [pickupText, setPickupText] = useState('');
  const [dropText, setDropText] = useState('');
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropLocation, setDropLocation] = useState<Location | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);

  // Geolocation fallback
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        // Reverse geocoding can be done here if needed, or just set lat/lng
        // For now we'll wait for user input or implement reverse geocoding
      });
    }
  }, []);

  return (
    <div className="w-full max-w-[400px] flex flex-col h-full bg-white animate-in slide-in-from-left-4 duration-500">
      <div className="p-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Where to?</h2>
          <p className="text-gray-500 text-sm font-medium">Book a ride in seconds</p>
        </div>

        <div className="space-y-4 relative">
          {/* Visual Connector */}
          <div className="absolute left-[23px] top-[44px] bottom-[44px] w-0.5 bg-gray-100"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-4 h-4 rounded-full border-2 border-primary bg-white z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            </div>
            <div className="flex-1">
              <AutocompleteInput
                placeholder="Pickup location"
                value={pickupText}
                onChange={setPickupText}
                onSelect={(loc) => { setPickupLocation(loc); setPickupText(loc.address); }}
              />
            </div>
          </div>

          <div className="relative flex items-center gap-4">
            <div className="w-4 h-4 bg-primary z-10 rounded-sm"></div>
            <div className="flex-1">
              <AutocompleteInput
                placeholder="Where to?"
                value={dropText}
                onChange={setDropText}
                onSelect={(loc) => { setDropLocation(loc); setDropText(loc.address); }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-surface rounded-xl">
          <button 
            onClick={() => setIsScheduled(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${!isScheduled ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            <Clock size={16} />
            Now
          </button>
          <button 
            onClick={() => setIsScheduled(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${isScheduled ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            <Calendar size={16} />
            Schedule
          </button>
        </div>

        {isScheduled && (
          <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
            <input type="date" className="bg-surface p-3 rounded-xl border-none outline-none text-sm font-bold text-primary" />
            <input type="time" className="bg-surface p-3 rounded-xl border-none outline-none text-sm font-bold text-primary" />
          </div>
        )}

        <Button 
          onClick={() => {
            if (pickupLocation && dropLocation) {
              onSearch(pickupLocation, dropLocation);
            }
          }}
          disabled={!pickupLocation || !dropLocation}
          className="w-full h-16 text-lg group"
        >
          See Prices
          <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Recent Trips / Suggestions */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Places</h3>
        <p className="text-sm text-gray-500">No recent places found.</p>
      </div>
    </div>
  );
};
