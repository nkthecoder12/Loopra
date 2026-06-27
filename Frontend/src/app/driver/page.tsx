"use client";

import React, { useState, useEffect, useRef } from 'react';
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
    <div className="flex flex-col md:flex-row h-screen bg-surface overflow-hidden">
      {/* Driver Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="w-full h-16 md:w-24 md:h-full bg-black flex flex-row md:flex-col items-center py-2 px-6 md:py-10 justify-between order-3 md:order-1 z-30">
        <div className="flex flex-row md:flex-col items-center gap-6 md:space-y-10 md:gap-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg shadow-primary/20">D.</div>
          <button className="p-2 md:p-3 bg-white/10 rounded-2xl text-white"><Navigation size={20} className="md:w-6 md:h-6" /></button>
          <button className="p-2 md:p-3 text-white/40 hover:text-white transition-all"><Bell size={20} className="md:w-6 md:h-6" /></button>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-800 rounded-full border-2 border-zinc-700 overflow-hidden flex items-center justify-center font-bold text-white uppercase text-sm md:text-base">
          {user?.name?.[0] || 'D'}
        </div>
      </nav>

      {/* Driver Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden order-1 md:order-2 h-[calc(100vh-4rem)] md:h-full overflow-y-auto">
        {/* Mobile Stats Bar */}
        <div className="flex md:hidden w-full bg-white border border-gray-100 p-4 rounded-3xl justify-between items-center mb-6 shadow-sm">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Earnings</p>
            <p className="text-lg font-black text-primary">₹{earnings.total || 0}</p>
          </div>
          <div className="h-8 w-px bg-gray-100"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</p>
            <p className="text-lg font-black text-primary">★ {earnings.rating || 5.0}</p>
          </div>
          <div className="h-8 w-px bg-gray-100"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Trips</p>
            <p className="text-lg font-black text-primary">{earnings.rides || 0}</p>
          </div>
        </div>
        {/* Top bar with online toggle */}
        <div className="absolute top-8 right-8 z-20">
          <button 
            disabled={!!activeRide}
            onClick={toggleOnline}
            className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold shadow-xl transition-all ${
              activeRide ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed' :
              isOnline ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            <Power size={20} />
            {isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        </div>

        {/* Rating screen after ride completes */}
        {showRatingScreen && activeRide ? (
          <form onSubmit={handleRateUser} className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-2xl space-y-6 border border-gray-100 z-10 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-primary">Trip Finished!</h2>
              <p className="text-gray-500">Rate passenger for this trip</p>
              <h3 className="text-2xl font-black text-primary mt-2">₹{activeRide.finalFare || activeRide.fare}</h3>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Passenger Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className={`w-10 h-10 text-xl rounded-xl transition-all ${
                      userRating >= star ? 'bg-yellow-500 text-white scale-110 shadow-md' : 'bg-gray-100 text-gray-400'
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
                placeholder="Write optional feedback..."
                rows={3}
                className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:border-primary transition-colors text-sm resize-none"
              />
            </div>

            <div className="space-y-3 pt-2">
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:bg-primary/95 transition-all">
                Submit Review
              </button>
              <button type="button" onClick={handleSkipRating} className="w-full text-gray-400 font-bold py-2">
                Skip
              </button>
            </div>
          </form>
        ) : activeRide ? (
          /* Ongoing active trip panel */
          <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden relative z-10 animate-in slide-in-from-bottom duration-500">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Active Ride
                  </span>
                  <p className="text-sm text-gray-400 mt-1 font-medium">Status: {activeRide.status}</p>
                </div>
                <h3 className="text-2xl font-black text-primary">₹{activeRide.fare}</h3>
              </div>

              {/* Addresses */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center py-1">
                    <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100"></div>
                    <div className="w-0.5 h-8 bg-gray-100"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-sm ring-4 ring-red-100"></div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Pickup</p>
                      <p className="font-bold text-sm text-primary">{activeRide.pickupLocation?.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Drop</p>
                      <p className="font-bold text-sm text-primary">{activeRide.dropLocation?.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions based on Status */}
              {activeRide.status === 'DRIVER_ASSIGNED' && (
                <form onSubmit={handleStartRide} className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Enter Rider OTP</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 4-digit OTP"
                      className="w-full text-center tracking-widest text-2xl font-black h-16 border-2 border-gray-200 rounded-3xl outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <Button type="submit" className="w-full h-16 rounded-3xl shadow-xl shadow-primary/20">
                    Verify OTP & Start Trip
                  </Button>
                </form>
              )}

              {activeRide.status === 'ONGOING' && (
                <div className="pt-4 border-t border-gray-100">
                  <Button onClick={handleCompleteRide} className="w-full h-16 rounded-3xl bg-green-600 hover:bg-green-700 shadow-xl shadow-green-500/20">
                    End & Complete Trip
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : activeOffer ? (
          /* Normal Ride Offer panel */
          <div className="w-full max-w-lg space-y-8 animate-in zoom-in-95 duration-500 relative z-10">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                New Ride Offer
              </div>
              <h2 className="text-4xl font-black text-primary tracking-tighter italic">₹{activeOffer.fare}</h2>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center py-1">
                      <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/10"></div>
                      <div className="w-0.5 h-10 bg-gray-100"></div>
                      <div className="w-3 h-3 bg-primary rounded-sm ring-4 ring-primary/10"></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Pickup</p>
                        <p className="font-bold text-primary">{activeOffer.pickup.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase">Drop</p>
                        <p className="font-bold text-primary">{activeOffer.drop.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {activeOffer.secondaryRideId ? (
                    <>
                      <Button onClick={handleAcceptBoth} className="h-16 rounded-3xl shadow-xl shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-lg">
                        Accept Both Rides (A + B)
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleReject} className="h-14 rounded-2xl bg-surface text-gray-500 font-bold hover:bg-gray-100">
                          Reject All
                        </button>
                        <button onClick={handleAcceptSingle} className="h-14 rounded-2xl border-2 border-primary text-primary font-bold hover:bg-primary/5">
                          Accept Current Only
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={handleReject}
                        className="h-16 rounded-3xl bg-surface text-gray-400 font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                      >
                        Reject
                      </button>
                      <Button 
                        onClick={handleAcceptSingle}
                        className="h-16 rounded-3xl shadow-xl shadow-primary/20"
                      >
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Offline/Online Wait View */
          <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-1000">
            <div className="relative">
              {isOnline && <div className="w-48 h-48 border-4 border-primary/10 rounded-full animate-[ping_3s_infinite] absolute inset-0"></div>}
              <div className={`w-48 h-48 rounded-full shadow-2xl flex items-center justify-center relative z-10 transition-colors ${isOnline ? 'bg-white' : 'bg-surface'}`}>
                <Navigation size={64} className={`${isOnline ? 'text-primary animate-pulse' : 'text-gray-400'}`} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-primary tracking-tighter italic">
                {isOnline ? 'Waiting for rides...' : 'You are offline'}
              </h2>
              <p className="text-gray-400 font-medium">
                {isOnline ? 'You are currently visible to riders.' : 'Go online to start receiving ride offers.'}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Driver Stats Side Panel */}
      <aside className="hidden md:block w-80 bg-white border-l border-gray-100 p-10 space-y-12 order-2 md:order-3">
        <div className="space-y-2">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Earnings Today</p>
          <h2 className="text-4xl font-black text-primary">₹{earnings.total || 0}</h2>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Performance</h3>
          <div className="space-y-4">
            {[
              { label: 'Acceptance Rate', value: `${earnings.acceptanceRate || 100}%`, color: 'bg-green-500' },
              { label: 'Rating', value: `${earnings.rating || 5.0}`, color: 'bg-yellow-500' },
              { label: 'Trips Today', value: `${earnings.rides || 0}`, color: 'bg-blue-500' }
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface rounded-2xl">
                <p className="text-sm font-bold text-gray-500">{stat.label}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-primary">{stat.value}</span>
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
