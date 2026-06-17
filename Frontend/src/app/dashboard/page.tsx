"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LocationPanel } from '@/modules/ride/LocationPanel';
import { RideSelectionPanel } from '@/modules/ride/RideSelectionPanel';
import { MapPanel } from '@/modules/ride/MapPanel';
import { ReturnRideModal } from '@/modules/ride/ReturnRideModal';
import { useRideStore } from '@/store/useRideStore';
import { rideService } from '@/services/ride.service';
import { useAppStore } from '@/store/useAppStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { RAZORPAY_KEY_ID } from '@/lib/config';
import { Calendar } from 'lucide-react';

type DashboardStep = 'input' | 'selection' | 'tracking' | 'payment' | 'rating';

export default function DashboardPage() {
  const [step, setStep] = useState<DashboardStep>('input');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [pickupLocation, setPickupLocation] = useState<any>(null);
  const [dropLocation, setDropLocation] = useState<any>(null);
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
  const resetDashboard = () => {
    setActiveRide(null);
    setPickupLocation(null);
    setDropLocation(null);
    setSelectedVehicle(null);
    setPaymentStatus('idle');
    setRating(5);
    setComment('');
    setStep('input');
    setScheduleData(null);
  };

  // Ride Resume & Socket Setup
  useEffect(() => {
    let socketRef: any = null;
    let onRideUpdate: any;
    let onDriverLocation: any;
    let onRideOtp: any;
    let onRideStateSnapshot: any;

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
            onRideUpdate = (data: any) => {
              updateRideFromSocket(data);
              if (data.status === 'COMPLETED') {
                setStep('payment');
              } else if (data.status === 'CANCELLED' || data.status === 'FAILED') {
                addNotification('info', `Ride status: ${data.status}`);
                resetDashboard();
              }
            };

            onDriverLocation = (data: any) => {
              // Standardized coordinate field names: latitude, longitude
              updateDriverLocation(data.latitude || data.lat, data.longitude || data.lng);
            };

            onRideOtp = (data: any) => {
              updateRideFromSocket({ otp: data.otp });
            };

            onRideStateSnapshot = (data: any) => {
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
  }, [setActiveRide, setLoading, token, updateDriverLocation, updateRideFromSocket, addNotification]);

  const handleSeePrices = async (pickup: any, drop: any, schedule?: { date: string; time: string }) => {
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
    } catch (error: any) {
      if (error.name !== 'CanceledError') {
        addNotification('error', 'Failed to fetch price estimates');
      }
    } finally {
      setLoading(false);
    }
  };

  // Selection moves directly to Ride Creation & Tracking
  const handleConfirmRide = async (vehicle: any) => {
    setSelectedVehicle(vehicle);
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
      const rideId = activeRide._id || activeRide.id;
      const orderData = await rideService.createPaymentOrder(rideId);
      
      // 2. Open Razorpay UI
      const options = {
        key: RAZORPAY_KEY_ID || orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Drivo',
        description: `Ride Payment - ${activeRide.driver?.name || 'Trip'}`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
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
          } catch (err) {
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

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setPaymentStatus('failed');
        addNotification('error', response.error.description || 'Payment failed');
      });

      rzp.open();
      
    } catch (error) {
      setPaymentStatus('failed');
      addNotification('error', 'Failed to initialize payment. Please try again.');
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      setLoading(true);
      const rideId = activeRide._id || activeRide.id;
      await rideService.cancelRide(rideId);
      addNotification('success', 'Ride cancelled successfully.');
      resetDashboard();
    } catch (err: any) {
      addNotification('error', err.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setLoading(false);
    }
  };

  const handleBookReturnRide = async (data?: any) => {
    if (!activeRide) return;
    try {
      setLoading(true);
      const currentRideId = activeRide._id || activeRide.id;
      const orderData = await rideService.createAdvancePaymentOrder(currentRideId);
      
      const options = {
        key: RAZORPAY_KEY_ID || orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Drivo',
        description: 'Advance Payment for Return Ride',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
             setLoading(true);
             await rideService.verifyAdvancePayment({
                rideId: currentRideId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
             });
             
             await rideService.bookAdvanceRide({
                rideAId: currentRideId,
                pickupLocation: activeRide.dropLocation,
                dropLocation: activeRide.pickupLocation,
                scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString() 
             });
             
             addNotification('success', 'Return ride booked successfully!');
             setShowReturnModal(false);
          } catch(err) {
             addNotification('error', 'Payment verification failed');
          } finally {
             setLoading(false);
          }
        }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function () {
        addNotification('error', 'Advance payment failed');
      });
      rzp.open();
    } catch(err) {
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
      const rideId = activeRide._id || activeRide.id;
      await rideService.submitRating(rideId, rating, comment);
      addNotification('success', 'Thank you for your rating!');
      resetDashboard();
    } catch (err) {
      addNotification('error', 'Failed to submit rating.');
      resetDashboard();
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const fareToPay = activeRide?.finalFare || activeRide?.fare || selectedVehicle?.price || 50;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* Column 1 & 2: Dynamic Content */}
      <div className="w-full md:w-[400px] md:max-w-[400px] flex flex-col bg-white border-b md:border-b-0 md:border-r border-gray-100 z-10 relative order-2 md:order-1 h-[55vh] md:h-full overflow-y-auto">
        {step === 'input' && <LocationPanel onSearch={handleSeePrices} />}
        {step === 'selection' && <RideSelectionPanel vehicles={vehicles} onConfirm={handleConfirmRide} />}
        
        {step === 'payment' && (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
            <h2 className="text-2xl font-bold text-primary">Trip Completed!</h2>
            {paymentStatus === 'idle' && (
              <>
                <p className="text-gray-500">Confirm payment of ₹{fareToPay} for your completed trip.</p>
                <div className="w-full space-y-3">
                  <button onClick={handleProcessPayment} className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all">
                    Pay Now
                  </button>
                </div>
              </>
            )}
            {paymentStatus === 'processing' && (
              <div className="space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 font-bold">Processing payment...</p>
              </div>
            )}
            {paymentStatus === 'success' && (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                <p className="text-green-500 font-bold">Payment Successful!</p>
              </div>
            )}
            {paymentStatus === 'failed' && (
              <div className="w-full space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">✕</div>
                <p className="text-red-500 font-bold">Payment Failed</p>
                <button onClick={handleProcessPayment} className="w-full bg-primary text-white py-4 rounded-xl font-bold">
                  Retry Payment
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'rating' && (
          <form onSubmit={handleSubmitRating} className="flex-1 p-8 flex flex-col justify-center space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-primary">Trip Feedback</h2>
              <p className="text-gray-500">Rate your experience with Drivo</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500">Rating</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-12 h-12 text-2xl rounded-xl transition-all ${
                      rating >= star ? 'bg-primary text-white scale-110 shadow-md' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500">Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:border-primary transition-colors text-sm resize-none"
              />
            </div>

            <div className="space-y-3 pt-4">
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:bg-primary/95 transition-all">
                Submit Review
              </button>
              <button type="button" onClick={resetDashboard} className="w-full text-gray-400 font-bold py-2">
                Skip
              </button>
            </div>
          </form>
        )}

        {step === 'tracking' && activeRide && (
          <div className="flex-1 p-8 flex flex-col space-y-6 overflow-y-auto">
            <div className="space-y-4">
              {activeRide.status === 'REQUESTED' && (
                <>
                  {activeRide.type === 'SCHEDULED' ? (
                    <div className="space-y-4 text-center p-6 bg-yellow-50/50 border border-yellow-100 rounded-3xl">
                      <Calendar className="mx-auto text-primary w-12 h-12 animate-pulse" />
                      <h2 className="text-2xl font-black text-primary tracking-tighter italic">Ride Scheduled!</h2>
                      <p className="text-gray-500 text-sm">
                        Your ride is confirmed for <strong className="text-primary">{activeRide.scheduledAt ? new Date(activeRide.scheduledAt).toLocaleString() : ''}</strong>.
                      </p>
                      <p className="text-gray-400 text-xs">
                        A driver will be assigned closer to your pickup time.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-1/3"></div>
                      </div>
                      <h2 className="text-3xl font-black text-primary tracking-tighter italic">Finding your driver...</h2>
                    </>
                  )}
                </>
              )}
              {['DRIVER_ASSIGNED', 'ONGOING'].includes(activeRide.status) && (
                <h2 className="text-3xl font-black text-primary tracking-tighter italic">
                  {activeRide.status === 'DRIVER_ASSIGNED' ? 'Driver is on the way' : 'Trip in progress'}
                </h2>
              )}
            </div>

            {/* OTP verification display */}
            {activeRide.status === 'DRIVER_ASSIGNED' && activeRide.otp && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200 p-6 rounded-[24px] text-center shadow-sm">
                <p className="text-yellow-800 text-xs font-bold uppercase tracking-widest">Share this OTP with Driver to Start Ride</p>
                <h4 className="text-4xl font-black text-yellow-950 tracking-widest mt-2">{activeRide.otp}</h4>
              </div>
            )}

            <div className="p-8 bg-primary rounded-[32px] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-surface/60 text-sm font-bold uppercase tracking-widest">Status</p>
                  <h3 className="text-2xl font-bold">{activeRide.status}</h3>
                </div>
                {activeRide.driver && (
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold">
                      {activeRide.driver.name[0]}
                    </div>
                    <div>
                      <p className="font-bold">{activeRide.driver.name}</p>
                      <p className="text-sm text-surface/60">
                        {activeRide.driver.vehicleDetails || (activeRide.driver.vehicle ? (typeof activeRide.driver.vehicle === 'object' ? `${(activeRide.driver.vehicle as any).type} (${(activeRide.driver.vehicle as any).number})` : activeRide.driver.vehicle) : '')}
                      </p>
                      <p className="text-xs text-surface/50 mt-1">{activeRide.driver.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              {(activeRide.status === 'REQUESTED' || activeRide.status === 'DRIVER_ASSIGNED') && (
                <button onClick={handleCancelRide} className="w-full bg-red-500 text-white py-4 rounded-xl font-bold hover:bg-red-600 transition-colors">
                  Cancel Ride
                </button>
              )}
              {!activeRide.parentRideId && activeRide.status !== 'COMPLETED' && activeRide.status !== 'REQUESTED' && (
                <button onClick={() => setShowReturnModal(true)} className="w-full bg-surface text-primary py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-100 transition-colors">
                  Book Return Ride (Save 20%)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showReturnModal && activeRide && (
        <ReturnRideModal
          pickup={activeRide.pickupLocation?.address || activeRide.pickup?.address || ''}
          drop={activeRide.dropLocation?.address || activeRide.drop?.address || ''}
          onClose={() => setShowReturnModal(false)}
          onConfirm={handleBookReturnRide}
        />
      )}

      {/* Column 3: Map */}
      <div className="w-full h-[45vh] md:h-full md:flex-1 relative order-1 md:order-2">
        <MapPanel tempPickup={pickupLocation} tempDrop={dropLocation} />
      </div>
    </div>
  );
}
