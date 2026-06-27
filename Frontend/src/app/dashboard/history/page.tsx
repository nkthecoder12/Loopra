"use client";

import React, { useEffect, useState } from 'react';
import { rideService } from '@/services/ride.service';
import { RideInfo } from '@/store/useRideStore';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function RideHistoryPage() {
  const [rides, setRides] = useState<RideInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await rideService.getRideHistory(1, 20);
        setRides(data.rides || []);
      } catch (error) {
        console.error('Failed to load ride history', error);
        addNotification('error', 'Failed to load ride history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [addNotification]);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-surface">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-primary">Ride History</h2>
          <p className="text-gray-500">View your past trips and receipts.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px]">
            <p className="text-xl text-gray-400 font-bold">No past rides found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center group hover:shadow-md transition-all">
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase tracking-widest bg-surface px-3 py-1 rounded-full text-primary">
                      {ride.status}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      {ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <div className="w-0.5 h-6 bg-gray-200"></div>
                      <div className="w-2 h-2 bg-primary"></div>
                    </div>
                    <div className="space-y-4">
                      <p className="font-bold text-primary truncate max-w-sm">{ride.pickup?.address || ride.pickupLocation?.address}</p>
                      <p className="font-bold text-primary truncate max-w-sm">{ride.drop?.address || ride.dropLocation?.address}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end">
                  <p className="text-2xl font-black text-primary">₹{ride.fare || ride.advancePaid || 0}</p>
                  <button className="text-sm font-bold text-blue-500 hover:underline">View Receipt</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
