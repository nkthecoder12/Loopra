"use client";

import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRideStore } from '@/store/useRideStore';
import { decodeToken, isTokenValid } from '@/utils/jwt';
import { authService } from '@/services/auth.service';
import { rideService } from '@/services/ride.service';
import { socketService } from '@/lib/socket';

// Issue #4: was decoding JWT only — now calls /auth/me for full user profile
// Issue #35: also checks for active ride on load so user can resume tracking

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setCredentials, clearCredentials, setHydrating, isHydrating } = useAuthStore();
  const { setActiveRide } = useRideStore();

  useEffect(() => {
    const hydrateAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token || !isTokenValid(token)) {
        clearCredentials();
        setHydrating(false);
        return;
      }

      const decoded = decodeToken(token);
      if (!decoded) {
        clearCredentials();
        setHydrating(false);
        return;
      }

      try {
        // Issue #4: call getMe for full profile (name, email, profileImage)
        const meData = await authService.getMe();
        const user = meData.user;

        setCredentials(
          {
            id: user.id || user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isVerified: user.isVerified,
          },
          token
        );

        // Connect socket now that we have a valid token
        socketService.connect(token);

        // Issue #35: check for active ride so user can resume tracking
        if (user.role === 'USER') {
          try {
            const activeRide = await rideService.getActiveRide();
            if (activeRide) {
              setActiveRide(activeRide);
              // Rejoin the socket room for this ride
              socketService.joinRoom(activeRide._id);
            }
          } catch (_) {
            // Not critical — no active ride
          }
        }
      } catch (err: any) {
        // Issue #4: 401 from /auth/me means token expired on server → force logout
        if (err.response?.status === 401) {
          clearCredentials();
          socketService.disconnect();
        } else {
          // Network error — still set basic creds from token as fallback
          setCredentials({ id: decoded.id, role: decoded.role as any, email: '' }, token);
        }
      } finally {
        setHydrating(false);
      }
    };

    hydrateAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};
