"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'USER' | 'DRIVER' | 'ADMIN'>;
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const router = useRouter();
  const { isAuthenticated, isHydrating, user } = useAuthStore();

  useEffect(() => {
    if (!isHydrating) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && !user.isVerified) {
        sessionStorage.setItem('signup_email', user.email);
        router.push('/otp');
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Role mismatch redirect
        router.push(user.role === 'DRIVER' ? '/driver' : user.role === 'ADMIN' ? '/admin' : '/dashboard');
      }
    }
  }, [isHydrating, isAuthenticated, user, allowedRoles, router]);

  if (isHydrating || !isAuthenticated || (user && !user.isVerified)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};
