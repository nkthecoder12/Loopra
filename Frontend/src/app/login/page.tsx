"use client";

import React, { useState } from 'react';
import Link from 'next/link';
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
        setCredentials({ id: decoded.id, role: decoded.role as any, email }, token);
        addNotification('success', 'Logged in successfully!');
        
        // Redirect based on role
        if (decoded.role === 'ADMIN') router.push('/admin');
        else if (decoded.role === 'DRIVER') router.push('/driver');
        else router.push('/dashboard');
      }
    } catch (err: any) {
      addNotification('error', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-80 z-10"></div>
        <div className="relative z-20 p-12 text-white space-y-6">
          <h1 className="text-6xl font-extrabold tracking-tighter">
            Drivo.
          </h1>
          <p className="text-xl text-surface/80 max-w-md">
            The world's first automated return ride system. Experience premium mobility like never before.
          </p>
          <div className="pt-12 grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold">1M+</h3>
              <p className="text-sm text-surface/60">Active Users</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold">4.9/5</h3>
              <p className="text-sm text-surface/60">User Rating</p>
            </div>
          </div>
        </div>
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-24 bg-white">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-primary">Welcome Back</h2>
            <p className="text-gray-500">Sign in to your Drivo account to book your next ride.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
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
              <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button className="w-full h-14 text-lg" loading={isLoading} disabled={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-100 rounded-uber font-semibold hover:bg-gray-50 transition-all active:scale-95">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18C1.43 8.53 1 10.21 1 12s.43 3.47 1.18 4.97l3.69-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
