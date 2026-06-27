"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocationPanel } from '@/modules/ride/LocationPanel';
import { RideSelectionPanel, VehicleOption } from '@/modules/ride/RideSelectionPanel';
import { MapPanel } from '@/modules/ride/MapPanel';
import { ReturnRideModal } from '@/modules/ride/ReturnRideModal';
import { useRideStore, RideInfo } from '@/store/useRideStore';
import { rideService } from '@/services/ride.service';
import { useAppStore } from '@/store/useAppStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { RAZORPAY_KEY_ID } from '@/lib/config';
import { Calendar } from 'lucide-react';

type DashboardStep = 'input' | 'selection' | 'tracking' | 'payment' | 'rating';

interface LocationObj {
  lat: number;
  lng: number;
  address: string;
}

interface Vehicle {
  id: string;
  name: string;
  price: number | string;
  eta: number | string;
  desc?: string;
  image?: string;
  capacity?: number;
}

export default function DashboardPage() {
  const [step, setStep] = useState<DashboardStep>('input');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pickupLocation, setPickupLocation] = useState<LocationObj | null>(null);
  const [dropLocation, setDropLocation] = useState<LocationObj | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [scheduleData, setScheduleData] = useState<{ date: string; time: string } | null>(null);
  
  // Rating form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { activeRide, setActiveRide, updateRideFromSocket, updateDriverLocation } = useRideStore();
  const { isLoading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  const { token } = useAuthStore();

  // Reset helper
  const resetDashboard = useCallback(() => {
    setActiveRide(null);
    setPickupLocation(null);
    setDropLocation(null);
    setSelectedVehicle(null);
    setPaymentStatus('idle');
    setRating(5);
    setComment('');
    setStep('input');
    setScheduleData(null);
  }, [setActiveRide]);

  // Ride Resume & Socket Setup
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let socketRef: any = null;
    let onRideUpdate: (data: Partial<RideInfo>) => void;
    let onDriverLocation: (data: { latitude?: number; lat?: number; longitude?: number; lng?: number }) => void;
    let onRideOtp: (data: { otp: string }) => void;
    let onRideStateSnapshot: (data: RideInfo) => void;

    const initApp = async () => {
      try {
        setLoading(true);
        const ride = await rideService.getActiveRide();
        if (ride) {
          setActiveRide(ride);
          if (ride.status === 'COMPLETED') {
            setStep('payment');
          } else {
            setStep('tracking');
          }
        }
        
        if (token) {
          socketService.connect(token);
          socketRef = socketService.getSocket();
          if (socketRef) {
            onRideUpdate = (data: Partial<RideInfo>) => {
              updateRideFromSocket(data);
              if (data.status === 'COMPLETED') {
                setStep('payment');
              } else if (data.status === 'CANCELLED' || (data.status as string) === 'FAILED') {
                addNotification('info', `Ride status: ${data.status}`);
                resetDashboard();
              }
            };

            onDriverLocation = (data) => {
              // Standardized coordinate field names: latitude, longitude
              const lat = data.latitude ?? data.lat ?? 0;
              const lng = data.longitude ?? data.lng ?? 0;
              updateDriverLocation(lat, lng);
            };

            onRideOtp = (data) => {
              updateRideFromSocket({ otp: data.otp });
            };

            onRideStateSnapshot = (data) => {
              setActiveRide(data);
              if (data.status === 'COMPLETED') {
                setStep('payment');
              } else {
                setStep('tracking');
              }
            };

            // Join ride room if active ride exists
            if (ride) {
              socketService.joinRoom(ride._id || ride.id);
            }

            // Remove any existing listeners to prevent duplicates
            socketRef.off('ride-status-updated');
            socketRef.off('live-location');
            socketRef.off('ride-otp');
            socketRef.off('ride-state-snapshot');

            socketRef.on('ride-status-updated', onRideUpdate);
            socketRef.on('live-location', onDriverLocation);
            socketRef.on('ride-otp', onRideOtp);
            socketRef.on('ride-state-snapshot', onRideStateSnapshot);
            
            // Reconnect recovery
            socketService.onReconnect(async () => {
              const recoveredRide = await rideService.getActiveRide();
              if (recoveredRide) {
                setActiveRide(recoveredRide);
                socketService.joinRoom(recoveredRide._id || recoveredRide.id);
                if (recoveredRide.status === 'COMPLETED') {
                  setStep('payment');
                } else {
                  setStep('tracking');
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to resume ride', err);
      } finally {
        setLoading(false);
      }
    };

    initApp();

    return () => {
      if (socketRef) {
        socketRef.off('ride-status-updated', onRideUpdate);
        socketRef.off('live-location', onDriverLocation);
        socketRef.off('ride-otp', onRideOtp);
        socketRef.off('ride-state-snapshot', onRideStateSnapshot);
      }
    };
  }, [setActiveRide, setLoading, token, updateDriverLocation, updateRideFromSocket, addNotification, resetDashboard]);

  const handleSeePrices = async (pickup: LocationObj, drop: LocationObj, schedule?: { date: string; time: string }) => {
    setPickupLocation(pickup);
    setDropLocation(drop);
    setScheduleData(schedule || null);
    setLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const data = await rideService.estimateRide(pickup, drop, abortControllerRef.current.signal);
      setVehicles(data.vehicles || []); 
      setStep('selection');
    } catch (error: unknown) {
      const errObj = error as { name?: string };
      if (errObj.name !== 'CanceledError') {
        addNotification('error', 'Failed to fetch price estimates');
      }
    } finally {
      setLoading(false);
    }
  };

  // Selection moves directly to Ride Creation & Tracking
  const handleConfirmRide = async (vehicle: VehicleOption) => {
    if (!pickupLocation || !dropLocation) return;
    setSelectedVehicle(vehicle as Vehicle);
    setLoading(true);
    try {
      const scheduledAt = scheduleData ? `${scheduleData.date}T${scheduleData.time}:00` : undefined;
      const newRide = await rideService.createRide({
        pickupLocation,
        dropLocation,
        vehicleType: vehicle.id,
        type: scheduleData ? 'SCHEDULED' : 'INSTANT',
        scheduledAt
      });
      
      const fullRide = await rideService.getRide(newRide.rideId);
      setActiveRide(fullRide);
      
      // Join ride socket room
      socketService.joinRoom(newRide.rideId);
      setStep('tracking');
      if (scheduleData) {
        addNotification('success', 'Advance ride scheduled successfully!');
      } else {
        addNotification('success', 'Ride booked successfully! Finding driver...');
      }
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to book ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Post-ride Payment Processing
  const handleProcessPayment = async () => {
    if (!activeRide) return;
    setPaymentStatus('processing');
    try {
      // 1. Create Razorpay order via backend
      const rideId = activeRide._id || activeRide.id || activeRide.rideId || '';
      const orderData = await rideService.createPaymentOrder(rideId);
      
      // 2. Open Razorpay UI
      const options = {
        key: RAZORPAY_KEY_ID || orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Loopra',
        description: `Ride Payment - ${activeRide.driver?.name || 'Trip'}`,
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // 3. Verify payment via backend
            await rideService.verifyPayment({
              rideId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setPaymentStatus('success');
            addNotification('success', 'Payment verified successfully!');
            // Move to Rating step
            setStep('rating');
          } catch (error) {
            console.error(error);
            setPaymentStatus('failed');
            addNotification('error', 'Payment verification failed');
          }
        },
        prefill: {
          name: useAuthStore.getState().user?.name || 'Rider',
          email: useAuthStore.getState().user?.email || 'rider@example.com',
        },
        theme: {
          color: '#000000'
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: { error: { description?: string } }) {
        setPaymentStatus('failed');
        addNotification('error', response.error?.description || 'Payment failed');
      });

      rzp.open();
      
    } catch (error) {
      console.error(error);
      setPaymentStatus('failed');
      addNotification('error', 'Failed to initialize payment. Please try again.');
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      setLoading(true);
      const rideId = activeRide._id || activeRide.id || activeRide.rideId || '';
      await rideService.cancelRide(rideId);
      addNotification('success', 'Ride cancelled successfully.');
      resetDashboard();
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setLoading(false);
    }
  };

  const handleBookReturnRide = async () => {
    if (!activeRide) return;
    try {
      setLoading(true);
      const currentRideId = activeRide._id || activeRide.id || activeRide.rideId || '';
      const orderData = await rideService.createAdvancePaymentOrder(currentRideId);
      
      const options = {
        key: RAZORPAY_KEY_ID || orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Loopra',
        description: 'Advance Payment for Return Ride',
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
             setLoading(true);
             await rideService.verifyAdvancePayment({
                rideId: currentRideId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
             });
             
             if (activeRide.dropLocation && activeRide.pickupLocation) {
               await rideService.bookAdvanceRide({
                  rideAId: currentRideId,
                  pickupLocation: activeRide.dropLocation as unknown as Record<string, unknown>,
                  dropLocation: activeRide.pickupLocation as unknown as Record<string, unknown>,
                  scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString() 
               });
             }
             
             addNotification('success', 'Return ride booked successfully!');
             setShowReturnModal(false);
          } catch (error) {
             console.error(error);
             addNotification('error', 'Payment verification failed');
          } finally {
             setLoading(false);
          }
        }
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        addNotification('error', 'Advance payment failed');
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to initiate return ride');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRide) return;
    try {
      setLoading(true);
      const rideId = activeRide._id || activeRide.id || activeRide.rideId || '';
      await rideService.submitRating(rideId, rating, comment);
      addNotification('success', 'Thank you for your rating!');
      resetDashboard();
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to submit rating.');
      resetDashboard();
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Loopra...</p>
        </div>
      </div>
    );
  }

  const fareToPay = activeRide?.finalFare || activeRide?.fare || selectedVehicle?.price || 50;

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-900">
      {/* Background Map Viewport */}
      <div className="absolute inset-0 w-full h-full z-0 pb-16 md:pb-0">
        <MapPanel tempPickup={pickupLocation} tempDrop={dropLocation} />
      </div>

      {/* Floating Panel / Drawer Overlay */}
      <div className="relative z-20 flex flex-col h-full w-full pointer-events-none">
        {/* Mobile Drag/Indicator Handle Box */}
        <div className="flex-1 pointer-events-none"></div>

        {/* Interactive Bottom Sheet (Mobile) & Floating Side Drawer (Desktop) */}
        <div className="pointer-events-auto w-full md:w-[440px] md:max-w-[440px] bg-white rounded-t-[32px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] md:shadow-2xl border-t md:border border-slate-100 md:m-6 flex flex-col max-h-[75vh] md:max-h-[calc(100vh-48px)] transition-all duration-300 overflow-hidden pb-16 md:pb-0">
          
          {/* Mobile Sheet Pull Bar */}
          <div className="w-full flex items-center justify-center pt-3 pb-1 md:hidden">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {step === 'input' && <LocationPanel onSearch={handleSeePrices} />}
            {step === 'selection' && <RideSelectionPanel vehicles={vehicles} onConfirm={handleConfirmRide} />}
            
            {step === 'payment' && (
              <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">
                  ✓
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold text-black">Trip Completed!</h2>
                  <p className="text-slate-500 text-sm font-medium">Thank you for riding with Loopra.</p>
                </div>

                {paymentStatus === 'idle' && (
                  <div className="w-full space-y-4 pt-2">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
                      <span className="text-2xl font-black text-black">₹{fareToPay}</span>
                    </div>
                    <button onClick={handleProcessPayment} className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.99] touch-target">
                      Pay Now (Razorpay)
                    </button>
                  </div>
                )}
                {paymentStatus === 'processing' && (
                  <div className="space-y-3 py-4">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-600 font-bold text-sm">Verifying payment status...</p>
                  </div>
                )}
                {paymentStatus === 'success' && (
                  <div className="space-y-4 py-2">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
                    <p className="text-emerald-600 font-extrabold">Payment Verified!</p>
                  </div>
                )}
                {paymentStatus === 'failed' && (
                  <div className="w-full space-y-4 py-2">
                    <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✕</div>
                    <p className="text-rose-500 font-bold">Payment Transaction Failed</p>
                    <button onClick={handleProcessPayment} className="w-full bg-black text-white py-4 rounded-2xl font-bold touch-target">
                      Retry Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 'rating' && (
              <form onSubmit={handleSubmitRating} className="flex-1 p-6 sm:p-8 flex flex-col justify-center space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-extrabold text-black">Trip Feedback</h2>
                  <p className="text-slate-500 text-sm font-medium">Rate your experience with Loopra</p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-3 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`w-12 h-12 text-2xl rounded-2xl transition-all touch-target flex items-center justify-center ${
                          rating >= star ? 'bg-black text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Comments (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us how your ride went..."
                    rows={3}
                    className="w-full p-4 border border-slate-200 rounded-2xl outline-none focus:border-black transition-colors text-sm resize-none font-medium"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-zinc-800 transition-all touch-target">
                    Submit Feedback
                  </button>
                  <button type="button" onClick={resetDashboard} className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600">
                    Skip for now
                  </button>
                </div>
              </form>
            )}

            {step === 'tracking' && activeRide && (
              <div className="flex-1 p-6 sm:p-8 flex flex-col space-y-6 overflow-y-auto">
                <div className="space-y-3">
                  {activeRide.status === 'REQUESTED' && (
                    <>
                      {activeRide.type === 'SCHEDULED' ? (
                        <div className="space-y-3 text-center p-6 bg-amber-50/80 border border-amber-200/60 rounded-3xl">
                          <Calendar className="mx-auto text-amber-600 w-10 h-10 animate-pulse" />
                          <h2 className="text-2xl font-black text-amber-950 tracking-tight">Ride Scheduled!</h2>
                          <p className="text-slate-600 text-sm font-medium">
                            Confirmed for <strong className="text-black">{activeRide.scheduledAt ? new Date(activeRide.scheduledAt).toLocaleString() : ''}</strong>.
                          </p>
                          <p className="text-slate-400 text-xs font-medium">
                            A Loopra partner driver will be assigned prior to your pickup.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 text-center py-4">
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-black animate-[shimmer_1.8s_infinite] w-1/2"></div>
                          </div>
                          <h2 className="text-2xl font-black text-black tracking-tight animate-pulse">Connecting with nearby drivers...</h2>
                        </div>
                      )}
                    </>
                  )}
                  {['DRIVER_ASSIGNED', 'ONGOING'].includes(activeRide.status) && (
                    <div className="space-y-1">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full">Active Trip</span>
                      <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                        {activeRide.status === 'DRIVER_ASSIGNED' ? 'Driver is en route' : 'Trip in progress'}
                      </h2>
                    </div>
                  )}
                </div>

                {/* OTP verification display */}
                {activeRide.status === 'DRIVER_ASSIGNED' && activeRide.otp && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200/80 p-5 rounded-2xl text-center shadow-sm">
                    <p className="text-amber-900 text-xs font-black uppercase tracking-widest">Share OTP with Driver</p>
                    <h4 className="text-4xl font-black text-black tracking-widest mt-2">{activeRide.otp}</h4>
                  </div>
                )}

                <div className="p-6 bg-black rounded-3xl text-white shadow-xl relative overflow-hidden space-y-4">
                  <div>
                    <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">Trip Status</p>
                    <h3 className="text-xl font-extrabold text-white mt-0.5">{activeRide.status}</h3>
                  </div>
                  {activeRide.driver && (
                    <div className="flex items-center gap-4 bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                      <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-black text-xl shrink-0">
                        {activeRide.driver.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{activeRide.driver.name}</p>
                        <p className="text-xs text-zinc-400 truncate">
                          {activeRide.driver.vehicleDetails || (activeRide.driver.vehicle ? (typeof activeRide.driver.vehicle === 'object' ? `${activeRide.driver.vehicle.type} (${activeRide.driver.vehicle.number})` : activeRide.driver.vehicle) : '')}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5 font-mono">{activeRide.driver.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {(activeRide.status === 'REQUESTED' || activeRide.status === 'DRIVER_ASSIGNED') && (
                    <button onClick={handleCancelRide} className="w-full bg-rose-50 text-rose-600 border border-rose-200/60 py-4 rounded-2xl font-bold hover:bg-rose-100 transition-colors touch-target">
                      Cancel Ride
                    </button>
                  )}
                  {!activeRide.parentRideId && activeRide.status !== 'COMPLETED' && activeRide.status !== 'REQUESTED' && (
                    <button onClick={() => setShowReturnModal(true)} className="w-full bg-black text-white py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs hover:bg-zinc-800 transition-colors shadow-lg touch-target">
                      Book Return Ride (Save 20%)
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReturnModal && activeRide && (
        <ReturnRideModal
          pickup={activeRide.pickupLocation?.address || activeRide.pickup?.address || ''}
          drop={activeRide.dropLocation?.address || activeRide.drop?.address || ''}
          onClose={() => setShowReturnModal(false)}
          onConfirm={handleBookReturnRide}
        />
      )}
    </div>
  );
}

