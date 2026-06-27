"use client";

import React, { useState } from 'react';
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

export default function LoginPage() {
  const router = useRouter();
  const { setCredentials } = useAuthStore();
  const { isLoading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  React.useEffect(() => {
    if (!useAuthStore.getState().isHydrating && useAuthStore.getState().isAuthenticated) {
      const user = useAuthStore.getState().user;
      if (user) {
        if (user.role === 'ADMIN') router.push('/admin');
        else if (user.role === 'DRIVER') router.push('/driver');
        else router.push('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setLoading(true);
    
    try {
      const response = await authService.login(email, password);
      const { token } = response;
      const decoded = decodeToken(token);
      
      if (decoded) {
        const isVerified = response.user?.isVerified ?? true;
        const rawRole = decoded.role as string;
        const userRole: 'USER' | 'DRIVER' | 'ADMIN' = rawRole === 'DRIVER' ? 'DRIVER' : rawRole === 'ADMIN' ? 'ADMIN' : 'USER';
        setCredentials({ id: decoded.id, role: userRole, email, isVerified }, token);
        
        if (!isVerified) {
          sessionStorage.setItem('signup_email', email);
          addNotification('info', 'Please verify your email first.');
          router.push('/otp');
          return;
        }

        addNotification('success', 'Logged in successfully!');
        
        // Redirect based on role
        if (decoded.role === 'ADMIN') router.push('/admin');
        else if (decoded.role === 'DRIVER') router.push('/driver');
        else router.push('/dashboard');
      }
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-primary-brand/40 opacity-90 z-10"></div>
        <div className="relative z-20 p-12 text-white space-y-8 max-w-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl p-2 flex items-center justify-center shadow-2xl">
              <Image src="/loopra logo.png" alt="Loopra Logo" width={64} height={64} className="object-contain" priority />
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white">
              Loopra
            </h1>
          </div>
          <p className="text-xl text-zinc-300 font-medium leading-relaxed">
            The world&apos;s premier automated return ride system. Experience seamless, instant mobility like never before.
          </p>
          <div className="pt-8 grid grid-cols-2 gap-8 border-t border-zinc-800">
            <div className="space-y-1">
              <h3 className="text-4xl font-black text-white">1M+</h3>
              <p className="text-sm font-semibold text-zinc-400">Active Riders</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-4xl font-black text-white">4.9★</h3>
              <p className="text-sm font-semibold text-zinc-400">User Rating</p>
            </div>
          </div>
        </div>
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-brand/30 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header Branding */}
          <div className="flex lg:hidden items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-black rounded-xl p-2 flex items-center justify-center shadow-md">
              <Image src="/loopra logo.png" alt="Loopra Logo" width={48} height={48} className="object-contain" priority />
            </div>
            <span className="text-2xl font-black tracking-tighter text-black">Loopra</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 text-sm sm:text-base font-medium">Sign in to your Loopra account to book your ride.</p>
          </div>

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
              <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black" />
                <span className="font-medium">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-bold text-black hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button className="w-full h-14 text-base font-bold bg-black text-white hover:bg-zinc-800 rounded-2xl shadow-lg active:scale-[0.99]" loading={isLoading} disabled={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
              <span className="px-3 bg-white text-slate-400">Or continue with</span>
            </div>
          </div>

          <button type="button" className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.99] touch-target">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18C1.43 8.53 1 10.21 1 12s.43 3.47 1.18 4.97l3.69-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="text-center text-sm font-medium text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-extrabold text-black hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

