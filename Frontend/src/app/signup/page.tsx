"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Lock } from 'lucide-react';

import { useNotificationStore } from '@/store/useNotificationStore';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotificationStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const authStore = useAuthStore.getState();
    if (!authStore.isHydrating && authStore.isAuthenticated) {
      const user = authStore.user;
      if (user) {
        if (user.role === 'ADMIN') router.push('/admin');
        else if (user.role === 'DRIVER') router.push('/driver');
        else router.push('/dashboard');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      addNotification('error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authService.signup(formData);
      sessionStorage.setItem('signup_email', formData.email);
      addNotification('success', 'OTP sent to your email');
      router.push('/otp');
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-accent opacity-80 z-10"></div>
        <div className="relative z-20 p-12 text-white space-y-6">
          <h1 className="text-6xl font-extrabold tracking-tighter">
            Join Drivo.
          </h1>
          <p className="text-xl text-surface/80 max-w-md">
            Unlock the power of scheduled returns and premium mobility. Join over 1 million happy riders today.
          </p>
          <div className="pt-12 space-y-6">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold">Secure Payments</p>
                <p className="text-sm text-surface/60">Fully encrypted transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold">Priority Matching</p>
                <p className="text-sm text-surface/60">Get drivers faster than anywhere else</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-12 md:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 py-12">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary">Create Account</h2>
            <p className="text-gray-500 text-sm sm:text-base">Start your journey with Drivo in less than a minute.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <Input 
                label="Full Name" 
                type="text" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
              <Input 
                label="Email Address" 
                type="email" 
                placeholder="john@example.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
              <Input 
                label="Phone Number" 
                type="tel" 
                placeholder="+91 9876543210" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required 
              />
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required 
              />
              <Input 
                label="Confirm Password" 
                type="password" 
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required 
              />
            </div>

            <p className="text-xs text-gray-500">
              By signing up, you agree to Drivo&apos;s{' '}
              <Link href="/terms" className="text-primary underline">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
            </p>

            <Button className="w-full h-14 text-lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
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
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
