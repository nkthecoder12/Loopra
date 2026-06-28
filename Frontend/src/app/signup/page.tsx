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
import { BecomeDriverCTA } from '@/components/BecomeDriverCTA';

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

            <div className="pt-2 border-t border-border">
              <div className="p-4 rounded-2xl bg-slate-50 border border-border flex items-center justify-between gap-3">
                <div className="text-xs">
                  <p className="font-bold text-text-primary font-manrope">Want to drive for Loopra?</p>
                  <p className="text-text-secondary">One account works for both riders &amp; drivers.</p>
                </div>
                <BecomeDriverCTA variant="button" buttonText="Become Driver" />
              </div>
            </div>

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
