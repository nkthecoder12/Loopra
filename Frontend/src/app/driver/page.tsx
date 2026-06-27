"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Navigation, Bell, Power } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { socketService } from '@/lib/socket';
import { driverService } from '@/services/driver.service';
import { rideService } from '@/services/ride.service';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useRouter } from 'next/navigation';

interface RideOffer {
  id: string;
  pickup: { address: string };
  drop: { address: string };
  fare: number;
  type: string;
  eta: string;
  secondaryRideId?: string;
}

interface DriverRide {
  _id?: string;
  id?: string;
  rideId?: string;
  status?: string;
  fare?: number;
  finalFare?: number;
  pickupLocation?: { address?: string };
  dropLocation?: { address?: string };
}

export default function DriverDashboard() {
  const { token, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const router = useRouter();
  
  const [isOnline, setIsOnline] = useState(false);
  const [activeOffer, setActiveOffer] = useState<RideOffer | null>(null);
  const [activeRide, setActiveRide] = useState<DriverRide | null>(null);
  const [earnings, setEarnings] = useState({ total: 0, rides: 0, rating: 5.0, acceptanceRate: 100 });
  
  // Start / Complete Ride inputs
  const [otp, setOtp] = useState('');
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');

  const lastLocationUpdate = useRef<number>(0);
  const watchId = useRef<number | null>(null);

  // Resume active ride & earnings on load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const statusData = await driverService.getStatus();
        if (statusData && statusData.onboardingStatus !== 'APPROVED') {
          router.push('/driver/onboarding');
          return;
        }

        setIsOnline(statusData.isAvailable);

        if (statusData.currentRideId) {
          const rideDetails = await rideService.getRide(statusData.currentRideId);
          if (rideDetails) {
            setActiveRide(rideDetails);
            if (token) {
              socketService.connect(token);
              socketService.joinRoom(rideDetails._id || rideDetails.id);
            }
          }
        }

        const data = await driverService.getEarnings();
        if (data) {
          setEarnings(data);
        }
      } catch (err) {
        console.error('Failed to fetch initial driver data', err);
      }
    };
    fetchInitialData();
  }, [router, token]);

  // Handle Socket Ride Offers
  useEffect(() => {
    if (!token || !isOnline) return;

    socketService.connect(token);
    const socket = socketService.getSocket();

    if (socket) {
      // Driver room setup
      socket.emit("driver-go-online");

      const mapInstantOffer = (offer: Record<string, unknown>): RideOffer => ({
        id: String(offer.rideId || offer.id),
        pickup: { address: (offer.pickupLocation as { address?: string })?.address || (offer.pickup as { address?: string })?.address || 'Pickup' },
        drop: { address: (offer.dropLocation as { address?: string })?.address || (offer.drop as { address?: string })?.address || 'Drop' },
        fare: (offer.fare as number) ?? 0,
        type: (offer.type as string) || 'instant',
        eta: (offer.eta as string) || `${(offer.etaMin as number) ?? 5} min`,
        secondaryRideId: offer.secondaryRideId as string | undefined,
      });

      socket.off('new-ride-offer');
      socket.on('new-ride-offer', (offer: Record<string, unknown>) => {
        setActiveOffer(mapInstantOffer(offer));
        addNotification('success', 'New ride offer received!');
      });

      socket.off('combined-ride-offer');
      socket.on('combined-ride-offer', (offer: Record<string, unknown>) => {
        setActiveOffer(mapInstantOffer({ ...offer, id: offer.primaryRideId || offer.rideId }));
        addNotification('success', 'New combined ride offer received!');
      });

      // Listen to cancellation updates
      socket.off('ride-cancelled');
      socket.on('ride-cancelled', (data: { rideId: string }) => {
        if (activeRide && (activeRide._id === data.rideId || activeRide.id === data.rideId)) {
          addNotification('info', 'Ride was cancelled by the passenger.');
          setActiveRide(null);
          setOtp('');
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new-ride-offer');
        socket.off('combined-ride-offer');
        socket.off('ride-cancelled');
      }
    };
  }, [token, isOnline, activeRide, addNotification]);

  // Live Location Tracker
  useEffect(() => {
    if (isOnline || activeRide) {
      if ("geolocation" in navigator) {
        watchId.current = navigator.geolocation.watchPosition((position) => {
          const { latitude, longitude } = position.coords;

          const now = Date.now();
          // Throttle updates to every 5 seconds
          if (now - lastLocationUpdate.current > 5000) {
            const socket = socketService.getSocket();
            if (socket) {
              // Send location format backend expects: { rideId, latitude, longitude }
              const rideId = activeRide?._id || activeRide?.id || activeRide?.rideId || null;
              socket.emit('driver-location', {
                rideId,
                latitude,
                longitude
              });
              lastLocationUpdate.current = now;
            }
          }
        }, (error) => {
          console.error("Error watching position", error);
        }, { enableHighAccuracy: true });
      }
    } else {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isOnline, activeRide]);

  const toggleOnline = async () => {
    try {
      const newState = !isOnline;
      await driverService.toggleAvailability(newState);
      setIsOnline(newState);
      if (!newState) {
        setActiveOffer(null);
      }
      
      const socket = socketService.getSocket();
      if (socket && newState) {
        socket.emit("driver-go-online");
      }
      
      addNotification('success', `You are now ${newState ? 'Online' : 'Offline'}`);
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to update availability status');
    }
  };

  const handleAcceptBoth = async () => {
    if (!activeOffer) return;
    try {
      await driverService.respondToAdvanceOffer(activeOffer.id, true, true);
      setActiveOffer(null);
      // Scheduled/combined rides assign status
      addNotification('success', 'Both rides accepted successfully!');
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to accept combined offer.');
      setActiveOffer(null);
    }
  };

  const handleAcceptSingle = async () => {
    if (!activeOffer) return;
    try {
      let acceptedRide: DriverRide;
      if (activeOffer.secondaryRideId) {
        acceptedRide = await driverService.respondToAdvanceOffer(activeOffer.id, true, false);
      } else {
        const res = await driverService.acceptRide(activeOffer.id);
        acceptedRide = res.ride;
      }
      
      setActiveRide(acceptedRide);
      setActiveOffer(null);
      
      // Join ride room
      const rideId = acceptedRide._id || acceptedRide.id || acceptedRide.rideId;
      if (rideId) {
        socketService.joinRoom(rideId);
      }
      
      addNotification('success', 'Ride accepted successfully!');
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to accept ride.');
      setActiveOffer(null);
    }
  };

  const handleReject = async () => {
    if (!activeOffer) return;
    try {
      await driverService.rejectRide(activeOffer.id);
      setActiveOffer(null);
    } catch (error) {
      console.error(error);
      setActiveOffer(null);
    }
  };

  // Start Ride (OTP verification)
  const handleStartRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide) return;
    try {
      const rideId = activeRide._id || activeRide.id || activeRide.rideId;
      if (!rideId) return;
      const res = await driverService.startRide(rideId, otp);
      
      // Update active ride
      setActiveRide(res.data);
      addNotification('success', 'OTP Verified! Ride Started.');
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      const msg = errObj.response?.data?.message || 'Failed to start ride. Invalid OTP.';
      addNotification('error', msg);
    }
  };

  // Complete Ride
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    try {
      const rideId = activeRide._id || activeRide.id || activeRide.rideId;
      if (!rideId) return;
      const res = await driverService.completeRide(rideId);
      setActiveRide(res.ride);
      addNotification('success', 'Ride Completed! Show summary.');
      setShowRatingScreen(true);
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Failed to complete ride');
    }
  };

  // Driver rates user post-ride
  const handleRateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide) return;
    try {
      const rideId = activeRide._id || activeRide.id || activeRide.rideId;
      if (!rideId) return;
      await rideService.submitDriverRating(rideId, userRating, userComment);
      addNotification('success', 'User rating submitted!');
      
      // Reset states
      setActiveRide(null);
      setOtp('');
      setShowRatingScreen(false);
      setUserRating(5);
      setUserComment('');
      
      // Refresh earnings
      const data = await driverService.getEarnings();
      if (data) {
        setEarnings(data);
      }
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to submit user rating');
      setActiveRide(null);
      setShowRatingScreen(false);
    }
  };

  const handleSkipRating = () => {
    setActiveRide(null);
    setOtp('');
    setShowRatingScreen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-900 overflow-hidden relative">
      {/* Driver Sidebar (Desktop) / Header Top (Mobile) */}
      <nav className="w-full h-16 md:w-20 lg:w-24 md:h-full bg-black flex flex-row md:flex-col items-center py-2 px-4 md:py-8 justify-between order-3 md:order-1 z-30 border-t md:border-t-0 md:border-r border-zinc-800">
        <div className="flex flex-row md:flex-col items-center gap-4 md:gap-8">
          <div className="w-11 h-11 bg-white rounded-2xl p-1 flex items-center justify-center shadow-lg">
            <Image src="/loopra logo.png" alt="Loopra Logo" width={36} height={36} className="object-contain" priority />
          </div>
          <button className="p-2.5 bg-zinc-800 rounded-xl text-white touch-target"><Navigation size={20} /></button>
          <button className="p-2.5 text-zinc-400 hover:text-white transition-all touch-target"><Bell size={20} /></button>
        </div>
        <div className="w-10 h-10 bg-zinc-800 rounded-full border border-zinc-700 overflow-hidden flex items-center justify-center font-extrabold text-white uppercase text-sm">
          {user?.name?.[0] || 'L'}
        </div>
      </nav>

      {/* Driver Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden order-1 md:order-2 h-[calc(100vh-4rem)] md:h-full overflow-y-auto bg-slate-950">
        {/* Mobile Stats Bar */}
        <div className="flex md:hidden w-full bg-black border border-zinc-800 p-4 rounded-2xl justify-between items-center mb-4 shadow-xl text-white">
          <div className="text-center">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Earnings</p>
            <p className="text-base font-black text-white">₹{earnings.total || 0}</p>
          </div>
          <div className="h-6 w-px bg-zinc-800"></div>
          <div className="text-center">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Rating</p>
            <p className="text-base font-black text-amber-400">★ {earnings.rating || 5.0}</p>
          </div>
          <div className="h-6 w-px bg-zinc-800"></div>
          <div className="text-center">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Trips</p>
            <p className="text-base font-black text-white">{earnings.rides || 0}</p>
          </div>
        </div>

        {/* Top bar with online toggle */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-20">
          <button 
            disabled={!!activeRide}
            onClick={toggleOnline}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full font-extrabold text-sm shadow-2xl transition-all touch-target ${
              activeRide ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' :
              isOnline ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Power size={18} />
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>

        {/* Rating screen after ride completes */}
        {showRatingScreen && activeRide ? (
          <form onSubmit={handleRateUser} className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 border border-slate-100 z-10 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-black">Trip Completed!</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium">Rate passenger experience</p>
              <h3 className="text-2xl font-black text-black mt-2">₹{activeRide.finalFare || activeRide.fare}</h3>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Passenger Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className={`w-10 h-10 text-xl rounded-xl transition-all touch-target ${
                      userRating >= star ? 'bg-black text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Optional passenger feedback..."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-black transition-colors text-xs font-medium resize-none"
              />
            </div>

            <div className="space-y-2 pt-2">
              <button type="submit" className="w-full bg-black text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-zinc-800 transition-all touch-target text-sm">
                Submit Review
              </button>
              <button type="button" onClick={handleSkipRating} className="w-full text-slate-400 font-bold py-2 text-xs hover:text-slate-600">
                Skip
              </button>
            </div>
          </form>
        ) : activeRide ? (
          /* Ongoing active trip panel */
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in slide-in-from-bottom duration-300">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Current Ride
                  </span>
                  <p className="text-xs text-slate-400 mt-1 font-bold">Status: {activeRide.status}</p>
                </div>
                <h3 className="text-2xl font-black text-black">₹{activeRide.fare}</h3>
              </div>

              {/* Addresses */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center py-1">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <div className="w-0.5 h-8 bg-slate-200"></div>
                    <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase">Pickup Location</p>
                      <p className="font-bold text-xs sm:text-sm text-black">{activeRide.pickupLocation?.address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase">Drop Location</p>
                      <p className="font-bold text-xs sm:text-sm text-black">{activeRide.dropLocation?.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions based on Status */}
              {activeRide.status === 'DRIVER_ASSIGNED' && (
                <form onSubmit={handleStartRide} className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Enter Rider OTP</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-digit OTP"
                      className="w-full text-center tracking-widest text-2xl font-black h-14 border-2 border-slate-200 rounded-2xl outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-black text-white hover:bg-zinc-800 rounded-2xl font-bold text-base shadow-lg touch-target">
                    Verify OTP & Start Trip
                  </Button>
                </form>
              )}

              {activeRide.status === 'ONGOING' && (
                <div className="pt-4 border-t border-slate-100">
                  <Button onClick={handleCompleteRide} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base shadow-lg touch-target">
                    End & Complete Trip
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : activeOffer ? (
          /* Normal Ride Offer panel */
          <div className="w-full max-w-lg space-y-6 animate-in zoom-in-95 duration-300 relative z-10">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="bg-emerald-500/20 text-emerald-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-emerald-500/30">
                Incoming Offer
              </div>
              <h2 className="text-4xl font-black text-white tracking-tight">₹{activeOffer.fare}</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center py-1">
                      <div className="w-3 h-3 rounded-full bg-black"></div>
                      <div className="w-0.5 h-10 bg-slate-200"></div>
                      <div className="w-3 h-3 bg-black rounded-sm"></div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase">Pickup Address</p>
                        <p className="font-bold text-xs sm:text-sm text-black">{activeOffer.pickup.address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase">Drop Address</p>
                        <p className="font-bold text-xs sm:text-sm text-black">{activeOffer.drop.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {activeOffer.secondaryRideId ? (
                    <>
                      <Button onClick={handleAcceptBoth} className="h-14 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg touch-target">
                        Accept Both Rides (A + B)
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleReject} className="h-12 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 touch-target">
                          Reject All
                        </button>
                        <button onClick={handleAcceptSingle} className="h-12 rounded-xl border-2 border-black text-black font-bold text-xs hover:bg-slate-50 touch-target">
                          Accept Current Only
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={handleReject}
                        className="h-14 rounded-2xl bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-wider hover:bg-slate-200 transition-all touch-target"
                      >
                        Decline
                      </button>
                      <Button 
                        onClick={handleAcceptSingle}
                        className="h-14 rounded-2xl bg-black text-white hover:bg-zinc-800 font-black uppercase text-xs tracking-wider shadow-lg touch-target"
                      >
                        Accept Ride
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Offline/Online Wait View */
          <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-700 text-center">
            <div className="relative">
              {isOnline && <div className="w-40 h-40 border-4 border-emerald-500/20 rounded-full animate-[ping_3s_infinite] absolute inset-0"></div>}
              <div className={`w-40 h-40 rounded-full shadow-2xl flex items-center justify-center relative z-10 transition-colors border ${isOnline ? 'bg-black border-zinc-800' : 'bg-slate-900 border-zinc-800'}`}>
                <Navigation size={56} className={`${isOnline ? 'text-white animate-pulse' : 'text-zinc-600'}`} />
              </div>
            </div>
            <div className="space-y-1 max-w-xs">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isOnline ? 'Searching for trips...' : 'You are currently offline'}
              </h2>
              <p className="text-zinc-400 text-xs font-medium">
                {isOnline ? 'You will be notified instantly when a ride offer matches.' : 'Tap Go Online to start accepting trip requests.'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Driver Stats Side Panel (Desktop) */}
      <aside className="hidden md:block w-80 bg-black border-l border-zinc-800 p-8 space-y-10 order-2 md:order-3 text-white">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Earnings Today</p>
          <h2 className="text-4xl font-black text-white">₹{earnings.total || 0}</h2>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Performance Metrics</h3>
          <div className="space-y-3">
            {[
              { label: 'Acceptance Rate', value: `${earnings.acceptanceRate || 100}%`, color: 'bg-emerald-500' },
              { label: 'Rating', value: `${earnings.rating || 5.0}`, color: 'bg-amber-400' },
              { label: 'Trips Today', value: `${earnings.rides || 0}`, color: 'bg-blue-500' }
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl">
                <p className="text-xs font-bold text-zinc-400">{stat.label}</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-black text-white">{stat.value}</span>
                  <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

