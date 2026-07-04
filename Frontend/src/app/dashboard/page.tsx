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
import { Calendar, RotateCw, Sparkles } from 'lucide-react';

type DashboardStep = 'input' | 'selection' | 'confirm' | 'tracking' | 'payment' | 'rating';

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
  const [lockReturnSelected, setLockReturnSelected] = useState(false);
  
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
    setLockReturnSelected(false);
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

  const handleSeePrices = async (
    pickup: LocationObj,
    drop: LocationObj,
    schedule?: { date: string; time: string },
    lockReturn?: boolean
  ) => {
    setPickupLocation(pickup);
    setDropLocation(drop);
    setScheduleData(schedule || null);
    setLockReturnSelected(!!lockReturn);
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

  const handleSelectVehicle = (vehicle: VehicleOption) => {
    setSelectedVehicle(vehicle as Vehicle);
    setStep('confirm');
  };

  // Selection moves directly to Ride Creation & Tracking
  const handleConfirmRide = async (vehicle: Vehicle) => {
    if (!pickupLocation || !dropLocation) return;
    setLoading(true);
    try {
      const scheduledAt = scheduleData ? `${scheduleData.date}T${scheduleData.time}:00` : undefined;
      
      // 1. Create Outbound Ride A
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
      addNotification('success', 'Ride booked successfully! Finding driver...');

      // 2. If return ride is locked in, trigger return booking & advance fee payment
      if (lockReturnSelected) {
        try {
          addNotification('info', 'Initializing advance payment for your locked return ride...');
          const orderData = await rideService.createAdvancePaymentOrder(newRide.rideId);
          
          const options = {
            key: RAZORPAY_KEY_ID || orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Loopra Return Lock',
            description: 'Advance payment for return ride (5% Discount locked)',
            order_id: orderData.orderId,
            handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              try {
                setLoading(true);
                // Verify return payment
                await rideService.verifyAdvancePayment({
                  rideId: newRide.rideId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });
                
                // Book return ride B
                await rideService.bookAdvanceRide({
                  rideAId: newRide.rideId,
                  pickupLocation: dropLocation as unknown as Record<string, unknown>,
                  dropLocation: pickupLocation as unknown as Record<string, unknown>,
                  scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString() // 2 hours later
                });
                
                addNotification('success', 'Return ride locked in successfully!');
              } catch (error) {
                console.error(error);
                addNotification('error', 'Failed to verify return ride payment. Outbound remains active.');
              } finally {
                setLoading(false);
              }
            }
          };
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function () {
            addNotification('error', 'Advance payment failed. Return ride lock cancelled.');
          });
          rzp.open();
        } catch (advanceErr) {
          console.error('Failed return lock setup', advanceErr);
          addNotification('error', 'Return ride lock setup failed, but outbound is active.');
        }
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
      const rideId = activeRide._id || activeRide.id || activeRide.rideId || '';
      const orderData = await rideService.createPaymentOrder(rideId);
      
      const options = {
        key: RAZORPAY_KEY_ID || orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Loopra',
        description: `Ride Payment - ${activeRide.driver?.name || 'Trip'}`,
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await rideService.verifyPayment({
              rideId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            setPaymentStatus('success');
            addNotification('success', 'Payment verified successfully!');
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
          color: '#1c1c1e'
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
      <div className="flex-1 flex items-center justify-center bg-[#1c1c1e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading Loopra...</p>
        </div>
      </div>
    );
  }

  const fareToPay = activeRide?.finalFare || activeRide?.fare || selectedVehicle?.price || 50;
  const returnFare = Math.round(Number(selectedVehicle?.price || 114) * 0.95);

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-900">
      {/* Background Map Viewport */}
      <div className="absolute inset-0 w-full h-full z-0 pb-16 md:pb-0">
        <MapPanel tempPickup={pickupLocation} tempDrop={dropLocation} />
      </div>

      {/* Floating Panel / Drawer Overlay */}
      <div className="relative z-20 flex flex-col h-full w-full pointer-events-none">
        <div className="flex-1 pointer-events-none"></div>

        {/* Interactive Bottom Sheet (Mobile) & Floating Side Drawer (Desktop) */}
        <div className="pointer-events-auto w-full md:w-[440px] md:max-w-[440px] bg-[#1c1c1e] rounded-t-[32px] md:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] md:shadow-2xl border-t md:border border-zinc-800 md:m-6 flex flex-col max-h-[75vh] md:max-h-[calc(100vh-48px)] transition-all duration-300 overflow-hidden pb-16 md:pb-0 text-white">
          
          {/* Mobile Sheet Pull Bar */}
          <div className="w-full flex items-center justify-center pt-3 pb-1 md:hidden">
            <div className="w-12 h-1.5 bg-zinc-700 rounded-full"></div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {step === 'input' && <LocationPanel onSearch={handleSeePrices} />}
            {step === 'selection' && <RideSelectionPanel vehicles={vehicles} onConfirm={handleSelectVehicle} />}
            
            {/* Confirm Screen (Step 2 in Mockup) */}
            {step === 'confirm' && selectedVehicle && pickupLocation && dropLocation && (
              <div className="flex-1 p-5 sm:p-7 flex flex-col space-y-5 animate-in slide-in-from-bottom duration-300">
                <div>
                  <div className="mb-2 flex w-fit items-center gap-1.5 rounded-full border border-blue-900/60 bg-[#0d2240] px-3 py-1 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    <Sparkles size={11} className="text-blue-400" />
                    Live Pricing
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-manrope">Confirm your ride</h2>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-zinc-400">
                    {pickupLocation.address.split(",")[0]} to {dropLocation.address.split(",")[0]}
                  </p>
                </div>

                {/* Green Card Banner */}
                {lockReturnSelected && (
                  <div className="rounded-2xl bg-[#0f3d24]/60 border border-green-900/50 p-4.5 space-y-1 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 text-green-400">
                      <span className="font-extrabold text-xs">✓</span>
                      <p className="font-bold text-xs">Good call locking this in</p>
                    </div>
                    <p className="text-[11px] text-green-200 font-semibold leading-relaxed">
                      Cabs around {dropLocation.address.split(",")[0]} get scarce after 12. Yours is already waiting.
                    </p>
                  </div>
                )}

                {/* Blue Card Banner */}
                {lockReturnSelected && (
                  <div className="rounded-2xl bg-[#09203f] border border-blue-900/60 p-4.5 space-y-3 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-blue-400">
                        <RotateCw size={14} className="animate-spin-slow" />
                        <span className="font-bold text-xs">Return ride locked in</span>
                      </div>
                      <span className="text-[11px] font-bold text-blue-300">2 hours • 12:30 PM</span>
                    </div>
                    <p className="text-[10px] text-blue-200/90 font-medium">
                      {"🔔 We'll check in at 11:30 AM. Plans change, just tap to reschedule."}
                    </p>
                  </div>
                )}

                {/* Driver box */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Your Driver, both ways</p>
                  <div className="flex items-center gap-4 bg-[#252528] p-4 rounded-2xl border border-zinc-800/80">
                    <div className="w-11 h-11 bg-blue-900/80 text-blue-400 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                      RK
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-white">Rajesh Kumar</p>
                      <p className="text-xs text-zinc-400 font-semibold truncate">Dzire • TN 38 BX 4521</p>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-xl text-amber-400 text-xs font-bold">
                      ★ 4.9
                    </div>
                  </div>
                </div>

                {/* Fare breakdown */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Fare Breakdown</p>
                  <div className="bg-[#252528] rounded-2xl border border-zinc-800/80 p-4.5 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-300">Outbound trip</span>
                      <span className="font-black text-white">₹{selectedVehicle.price}</span>
                    </div>
                    {lockReturnSelected && (
                      <div className="flex justify-between items-center text-xs border-t border-zinc-800/80 pt-3">
                        <span className="font-bold text-zinc-300">Return trip <strong className="text-green-400 font-semibold">(5% off)</strong></span>
                        <span className="font-black text-white">₹{returnFare}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Action Button */}
                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => setStep('selection')}
                    className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.99] touch-target text-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => handleConfirmRide(selectedVehicle)}
                    className="flex-1 bg-white hover:bg-zinc-100 text-black font-black py-4 rounded-2xl transition-all active:scale-[0.99] touch-target text-sm shadow-xl"
                  >
                    Confirm & Book
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl">
                  ✓
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white font-manrope">Trip Completed!</h2>
                  <p className="text-zinc-400 text-sm font-semibold">Thank you for riding with Loopra.</p>
                </div>

                {paymentStatus === 'idle' && (
                  <div className="w-full space-y-4 pt-2">
                    <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Amount</span>
                      <span className="text-2xl font-black text-white">₹{fareToPay}</span>
                    </div>
                    <button onClick={handleProcessPayment} className="w-full bg-white text-black py-4 rounded-2xl font-black hover:bg-zinc-100 transition-all shadow-lg active:scale-[0.99] touch-target text-sm">
                      Pay Now (Razorpay)
                    </button>
                  </div>
                )}
                {paymentStatus === 'processing' && (
                  <div className="space-y-3 py-4">
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-zinc-400 font-bold text-sm">Verifying payment status...</p>
                  </div>
                )}
                {paymentStatus === 'success' && (
                  <div className="space-y-4 py-2">
                    <div className="w-16 h-16 bg-emerald-950/80 text-emerald-400 border border-emerald-900/50 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
                    <p className="text-emerald-400 font-extrabold">Payment Verified!</p>
                  </div>
                )}
                {paymentStatus === 'failed' && (
                  <div className="w-full space-y-4 py-2">
                    <div className="w-16 h-16 bg-rose-950/80 text-rose-400 border border-rose-900/50 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✕</div>
                    <p className="text-rose-400 font-bold">Payment Transaction Failed</p>
                    <button onClick={handleProcessPayment} className="w-full bg-white text-black py-4 rounded-2xl font-black hover:bg-zinc-100 transition-all touch-target text-sm">
                      Retry Payment
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 'rating' && (
              <form onSubmit={handleSubmitRating} className="flex-1 p-6 sm:p-8 flex flex-col justify-center space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tight font-manrope">Trip Feedback</h2>
                  <p className="text-zinc-400 text-sm font-semibold">Rate your experience with Loopra</p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-3 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`w-12 h-12 text-2xl rounded-2xl transition-all touch-target flex items-center justify-center ${
                          rating >= star ? 'bg-white text-black scale-110 shadow-lg font-black' : 'bg-zinc-800 text-zinc-650 hover:bg-zinc-700'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">Comments (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us how your ride went..."
                    rows={3}
                    className="w-full p-4 border border-zinc-800 bg-zinc-900/40 rounded-2xl outline-none focus:border-zinc-700 transition-colors text-sm resize-none font-semibold text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black shadow-lg hover:bg-zinc-100 transition-all touch-target text-sm">
                    Submit Feedback
                  </button>
                  <button type="button" onClick={resetDashboard} className="w-full text-zinc-500 font-bold py-2 text-sm hover:text-zinc-300">
                    Skip for now
                  </button>
                </div>
              </form>
            )}

            {step === 'tracking' && activeRide && (
              <div className="flex-1 p-5 sm:p-7 flex flex-col space-y-6 overflow-y-auto">
                <div className="space-y-3">
                  
                  {/* High-End Pulsing Radar Driver Searching View (Mockup/Phase 4) */}
                  {activeRide.status === 'REQUESTED' && (
                    <>
                      {activeRide.type === 'SCHEDULED' ? (
                        <div className="space-y-3 text-center p-6 bg-blue-950/80 border border-blue-900/60 rounded-3xl animate-in zoom-in-95">
                          <Calendar className="mx-auto text-blue-400 w-10 h-10 animate-pulse" />
                          <h2 className="text-2xl font-black text-white tracking-tight font-manrope">Ride Scheduled!</h2>
                          <p className="text-zinc-300 text-sm font-semibold">
                            Confirmed for <strong className="text-white">{activeRide.scheduledAt ? new Date(activeRide.scheduledAt).toLocaleString() : ''}</strong>.
                          </p>
                          <p className="text-zinc-500 text-xs font-semibold leading-relaxed">
                            A Loopra partner driver will be assigned prior to your pickup.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-6 bg-[#1c1c1e] text-white animate-in zoom-in-95 duration-300">
                          {/* Radar Pulse Animation */}
                          <div className="relative w-32 h-32 flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-500 rounded-full z-20 shadow-lg border-2 border-white animate-pulse"></div>
                            <div className="absolute w-28 h-28 border border-blue-500/30 rounded-full animate-radar-slow z-0"></div>
                            <div className="absolute w-28 h-28 border border-blue-400/50 rounded-full animate-radar-fast z-0"></div>
                            <div className="absolute w-20 h-20 border border-blue-500/20 rounded-full animate-ping z-0"></div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Searching Nearby Drivers</p>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-white font-manrope">Connecting with Loopra partner...</h2>
                            <p className="text-zinc-500 text-xs font-semibold">Estimated match time: &lt; 2 minutes</p>
                          </div>

                          {/* Quick Summary Box */}
                          <div className="w-full bg-[#252528] border border-zinc-800/80 p-4.5 rounded-2xl flex justify-between items-center text-left">
                            <div className="min-w-0 flex-1">
                              <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Pickup</p>
                              <p className="text-xs font-bold text-white truncate pr-2">{pickupLocation?.address.split(",")[0] || "Avinashi Rd"}</p>
                            </div>
                            <div className="h-8 w-px bg-zinc-800 shrink-0"></div>
                            <div className="min-w-0 flex-1 pl-4">
                              <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Drop</p>
                              <p className="text-xs font-bold text-white truncate pr-2">{dropLocation?.address.split(",")[0] || "Gandhipuram"}</p>
                            </div>
                            <div className="h-8 w-px bg-zinc-800 shrink-0"></div>
                            <div className="pl-4 shrink-0">
                              <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Locked Fare</p>
                              <p className="text-xs font-black text-white">₹{activeRide.fare || 114}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {['DRIVER_ASSIGNED', 'ONGOING'].includes(activeRide.status) && (
                    <div className="space-y-1 animate-in slide-in-from-bottom duration-300">
                      <span className="px-3 py-1 bg-blue-950/80 text-blue-400 border border-blue-900/30 text-[10px] font-black uppercase tracking-widest rounded-full">Active Trip</span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-manrope">
                        {activeRide.status === 'DRIVER_ASSIGNED' ? 'Driver is en route' : 'Trip in progress'}
                      </h2>
                    </div>
                  )}
                </div>

                {/* OTP verification display */}
                {activeRide.status === 'DRIVER_ASSIGNED' && activeRide.otp && (
                  <div className="bg-[#09203f] border border-blue-900/50 p-5 rounded-2xl text-center shadow-sm animate-in zoom-in-95">
                    <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Share OTP with Driver</p>
                    <h4 className="text-4xl font-black text-white tracking-widest mt-2">{activeRide.otp}</h4>
                  </div>
                )}

                <div className="p-6 bg-zinc-900 rounded-3xl text-white shadow-xl border border-zinc-850 relative overflow-hidden space-y-4">
                  <div>
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Trip Status</p>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">{activeRide.status}</h3>
                  </div>
                  {activeRide.driver && (
                    <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
                      <div className="w-11 h-11 bg-blue-900/80 text-blue-400 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                        {activeRide.driver.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-sm text-white truncate">{activeRide.driver.name}</p>
                        <p className="text-xs text-zinc-400 font-semibold truncate">
                          {activeRide.driver.vehicleDetails || (activeRide.driver.vehicle ? (typeof activeRide.driver.vehicle === 'object' ? `${activeRide.driver.vehicle.type} (${activeRide.driver.vehicle.number})` : activeRide.driver.vehicle) : '')}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5 font-mono font-semibold">{activeRide.driver.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-2">
                  {(activeRide.status === 'REQUESTED' || activeRide.status === 'DRIVER_ASSIGNED') && (
                    <button onClick={handleCancelRide} className="w-full bg-rose-950/60 text-rose-400 border border-rose-900/50 py-4 rounded-2xl font-bold hover:bg-rose-900/80 transition-colors touch-target text-sm">
                      Cancel Ride
                    </button>
                  )}
                  {!activeRide.parentRideId && activeRide.status !== 'COMPLETED' && activeRide.status !== 'REQUESTED' && (
                    <button onClick={() => setShowReturnModal(true)} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-zinc-100 transition-colors shadow-lg touch-target">
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
