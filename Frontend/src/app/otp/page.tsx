"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { decodeToken } from '@/utils/jwt';

export default function OTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);
  const [email] = useState(() => typeof window !== 'undefined' ? sessionStorage.getItem('signup_email') || '' : '');
  const { addNotification } = useNotificationStore();
  const { setCredentials, isAuthenticated, isHydrating, user } = useAuthStore();

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    if (!isHydrating && isAuthenticated && user && user.isVerified) {
      const targetPath = user.role === 'ADMIN' ? '/admin' : user.role === 'DRIVER' ? '/driver' : '/dashboard';
      router.replace(targetPath);
      return;
    }

    if (typeof window !== 'undefined' && !sessionStorage.getItem('signup_email') && !isAuthenticated) {
      router.replace('/signup');
    }
  }, [isHydrating, isAuthenticated, user, router]);

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      addNotification('error', 'Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const response = await authService.verifyOTP(normalizedEmail, otpCode);
      const { token } = response;
      const decoded = decodeToken(token);
      if (decoded) {
        const rawRole = decoded.role as string;
        const userRole: 'USER' | 'DRIVER' | 'ADMIN' = rawRole === 'DRIVER' ? 'DRIVER' : rawRole === 'ADMIN' ? 'ADMIN' : 'USER';
        
        setCredentials({ id: decoded.id, role: userRole, email: normalizedEmail, isVerified: true }, token);
        addNotification('success', 'Identity verified successfully!');
        sessionStorage.removeItem('signup_email');
        
        const targetPath = userRole === 'ADMIN' ? '/admin' : userRole === 'DRIVER' ? '/driver' : '/dashboard';
        router.replace(targetPath);
      }
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Invalid OTP');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.sendOTP(email);
      setTimer(59);
      addNotification('success', 'New OTP sent to your email');
    } catch (error) {
      console.error(error);
      addNotification('error', 'Failed to resend OTP');
    }
  };

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling && element.value) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  return (
    <div className="flex min-h-screen bg-surface items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-uber-lg shadow-uber p-5 sm:p-12 space-y-8 animate-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary">Verify Identity</h2>
            <p className="text-gray-500 text-sm sm:text-base">
              We&apos;ve sent a 6-digit verification code to <br />
              <span className="font-bold text-black">{email || 'your email'}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-between gap-1 sm:gap-4">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              className="w-9 h-12 sm:w-16 sm:h-20 text-center text-lg sm:text-2xl font-bold border-2 border-gray-100 rounded-lg sm:rounded-uber focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
          ))}
        </div>

        <div className="space-y-6">
          <Button 
            onClick={handleVerify}
            loading={loading}
            className="w-full h-14 text-lg"
          >
            Verify & Continue
          </Button>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-500">
              Didn&apos;t receive the code?{' '}
              {timer > 0 ? (
                <span className="font-bold text-primary">Resend in {timer}s</span>
              ) : (
                <button 
                  onClick={handleResend}
                  className="font-bold text-primary hover:underline"
                >
                  Resend Code
                </button>
              )}
            </p>
            
            <Link href="/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-primary transition-colors">
              <ArrowLeft size={16} />
              Back to Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
