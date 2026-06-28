"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Lock } from 'lucide-react';

import { useNotificationStore } from '@/store/useNotificationStore';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { Footer } from '@/components/Footer';

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
      const response = await authService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      sessionStorage.setItem('signup_email', formData.email);
      addNotification('success', response.message || 'Registration successful! Verification code sent.');
      router.push('/otp');
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background">
      <div className="flex-grow flex flex-col lg:flex-row">
        {/* Left Side - Visual */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary via-secondary to-slate-900 opacity-95 z-10"></div>
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
              Unlock the power of scheduled return rides and instant mobility. Join over 1 million happy riders today.
            </p>
            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Secure Payments</p>
                  <p className="text-xs text-slate-300">Fully encrypted instant &amp; scheduled transactions</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white">Priority Matching</p>
                  <p className="text-xs text-slate-300">Get top-rated drivers assigned seamlessly</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-surface overflow-y-auto">
          <div className="w-full max-w-md space-y-8 py-8">
            {/* Mobile Header Branding */}
            <div className="flex lg:hidden items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-primary rounded-xl p-2 flex items-center justify-center shadow-md">
                <Image src="/loopra logo.png" alt="Loopra Logo" width={48} height={48} className="object-contain" priority />
              </div>
              <span className="text-2xl font-black tracking-tighter text-primary font-manrope">Loopra</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight font-manrope">Create Account</h2>
              <p className="text-text-secondary text-sm sm:text-base font-medium">Start your journey with Loopra in less than a minute.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-3">
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

              <p className="text-xs font-medium text-text-secondary pt-1">
                By signing up, you agree to Loopra&apos;s{' '}
                <Link href="/terms-and-conditions" className="text-accent font-bold underline">Terms &amp; Conditions</Link> and{' '}
                <Link href="/privacy-policy" className="text-accent font-bold underline">Privacy Policy</Link>.
              </p>

              <Button variant="primary" className="w-full h-14 text-base font-bold rounded-2xl shadow-md touch-target" loading={loading}>
                Create Account
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-wider">
                <span className="px-3 bg-surface text-text-secondary font-manrope">Or sign up with</span>
              </div>
            </div>

            <button type="button" className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-border rounded-2xl font-bold text-text-primary hover:bg-slate-50 transition-all active:scale-[0.99] touch-target">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.87 14.13c-.22-.67-.35-1.39-.35-2.13s.13-1.46.35-2.13V7.03H2.18C1.43 8.53 1 10.21 1 12s.43 3.47 1.18 4.97l3.69-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.03l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335"/>
              </svg>
              Google
            </button>

            <p className="text-center text-sm font-medium text-text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="font-extrabold text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
