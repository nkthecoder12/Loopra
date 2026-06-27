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
    <div className="flex-1 p-4 sm:p-8 md:p-12 overflow-y-auto bg-slate-50 pb-20 md:pb-12">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight">Trip Activity</h2>
          <p className="text-slate-500 font-medium text-xs sm:text-sm">View your past rides and trip receipts.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-white border border-slate-200/80 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 text-center rounded-3xl border border-slate-200/80 shadow-sm">
            <p className="text-lg text-slate-400 font-bold">No past trips recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride, i) => (
              <div key={i} className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center group hover:shadow-md transition-all">
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                      ride.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {ride.status}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">
                      {ride.scheduledTime ? new Date(ride.scheduledTime).toLocaleDateString() : 'Instant Trip'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0 py-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
                      <div className="w-0.5 h-6 bg-slate-200"></div>
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></div>
                    </div>
                    <div className="space-y-2 min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-black truncate">{ride.pickup?.address || ride.pickupLocation?.address || 'Pickup location'}</p>
                      <p className="font-bold text-xs sm:text-sm text-black truncate">{ride.drop?.address || ride.dropLocation?.address || 'Drop location'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <p className="text-2xl font-black text-black">₹{ride.fare || ride.advancePaid || 0}</p>
                  <button className="text-xs font-bold text-black hover:underline touch-target">View Receipt</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
