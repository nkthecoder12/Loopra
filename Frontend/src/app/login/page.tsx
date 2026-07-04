"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { authService } from '@/services/auth.service';
import { decodeToken } from '@/utils/jwt';
import { Footer } from '@/components/Footer';
import { BecomeDriverCTA } from '@/components/BecomeDriverCTA';

export default function LoginPage() {
  const router = useRouter();
  const { setCredentials, isAuthenticated, isHydrating, user } = useAuthStore();
  const { isLoading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [redirectMsg, setRedirectMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      if (redirectParam === '/driver/onboarding') {
        queueMicrotask(() => setRedirectMsg('Please login to continue your driver registration.'));
      }
    }
  }, []);

  const getRedirectTarget = (role: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect');
      if (redirectUrl) {
        return redirectUrl;
      }
    }
    if (role === 'ADMIN') return '/admin';
    if (role === 'DRIVER') return '/driver';
    return '/dashboard';
  };

  React.useEffect(() => {
    if (!isHydrating && isAuthenticated && user) {
      if (!user.isVerified) {
        sessionStorage.setItem('signup_email', user.email);
        router.replace('/otp');
      } else {
        router.replace(getRedirectTarget(user.role));
      }
    }
  }, [isHydrating, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setLoading(true);
    
    try {
      const response = await authService.login(email.toLowerCase().trim(), password);
      const { token } = response;
      const decoded = decodeToken(token);
      
      if (decoded) {
        const isVerified = response.user?.isVerified ?? true;
        const rawRole = decoded.role as string;
        const userRole: 'USER' | 'DRIVER' | 'ADMIN' = rawRole === 'DRIVER' ? 'DRIVER' : rawRole === 'ADMIN' ? 'ADMIN' : 'USER';
        
        setCredentials({ id: decoded.id, role: userRole, email: email.toLowerCase().trim(), isVerified }, token);
        
        if (!isVerified) {
          sessionStorage.setItem('signup_email', email.toLowerCase().trim());
          addNotification('info', 'Please verify your email first.');
          router.replace('/otp');
          return;
        }

        addNotification('success', 'Logged in successfully!');
        router.replace(getRedirectTarget(userRole));
      }
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background">
      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Left Side - Visual Hero */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-slate-900 opacity-95 z-10"></div>
          <div className="relative z-20 p-12 text-white space-y-8 max-w-xl font-inter">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-surface rounded-2xl p-2 flex items-center justify-center shadow-2xl">
                <Image src="/loopra logo.png" alt="Loopra Logo" width={64} height={64} className="object-contain" priority />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white font-manrope">
                Loopra
              </h1>
            </div>
            <p className="text-xl text-slate-200 font-medium leading-relaxed">
              Designed for modern urban mobility. Connecting riders and drivers with simple, secure, and affordable city travel.
            </p>
            <div className="pt-8 grid grid-cols-2 gap-8 border-t border-white/15">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white font-manrope">Coimbatore</h3>
                <p className="text-sm font-semibold text-slate-300">Launch Region</p>
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white font-manrope">Reliable &amp; Safe</h3>
                <p className="text-sm font-semibold text-slate-300">Verified Mobility</p>
              </div>
            </div>
          </div>
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-soft-accent/20 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-surface">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Header Branding */}
            <div className="flex lg:hidden items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl p-2 flex items-center justify-center shadow-md">
                <Image src="/loopra logo.png" alt="Loopra Logo" width={48} height={48} className="object-contain" priority />
              </div>
              <span className="text-2xl font-black tracking-tighter text-primary font-manrope">Loopra</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight font-manrope">Welcome Back</h2>
              <p className="text-text-secondary text-sm sm:text-base font-medium">Sign in to your Loopra account to book your ride.</p>
            </div>

            {redirectMsg && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-bold font-manrope animate-in fade-in slide-in-from-top-1">
                {redirectMsg}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input 
                  label="Email Address" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                />
                <Input 
                  label="Password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm text-text-secondary cursor-pointer select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-accent" />
                  <span className="font-medium">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-bold text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button variant="primary" className="w-full h-14 text-base font-bold rounded-2xl shadow-md touch-target" loading={isLoading} disabled={isLoading}>
                Sign In
              </Button>
            </form>

            {/* Partner / Become a Driver Banner CTA */}
            <div className="pt-2 border-t border-border">
              <div className="p-4 rounded-2xl bg-slate-50 border border-border flex items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-text-primary font-manrope">Want to earn with Loopra?</p>
                  <p className="text-text-secondary">Apply as a driver partner today.</p>
                </div>
                <BecomeDriverCTA variant="button" buttonText="Apply Now" />
              </div>
            </div>

            <p className="text-center text-sm font-medium text-text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-extrabold text-accent hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
