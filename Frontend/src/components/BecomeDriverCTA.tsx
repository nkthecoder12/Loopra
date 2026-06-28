"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Car, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BecomeDriverCTAProps {
  variant?: 'banner' | 'card' | 'button' | 'link';
  className?: string;
  buttonText?: string;
}

export function BecomeDriverCTA({
  variant = 'button',
  className,
  buttonText = 'Become a Driver',
}: BecomeDriverCTAProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirect_after_login', '/driver/onboarding');
      }
      router.push('/login?redirect=driver-onboarding');
    } else {
      if (user?.role === 'DRIVER') {
        router.push('/driver');
      } else {
        router.push('/driver/onboarding');
      }
    }
  };

  if (variant === 'banner') {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent p-6 text-white shadow-soft font-inter", className)}>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider font-manrope">
              <Sparkles size={12} className="text-soft-accent" /> Earn on your terms
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-manrope">Partner with Loopra</h3>
            <p className="text-xs sm:text-sm text-slate-200 font-medium">Join Coimbatore&apos;s premier fleet mobility network. Flexible hours, guaranteed payouts.</p>
          </div>
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold text-sm rounded-xl hover:bg-slate-100 transition-all shadow-md active:scale-95 shrink-0 font-manrope touch-target"
          >
            <Car size={18} className="text-accent" />
            <span>{buttonText}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn("p-6 bg-surface rounded-2xl border border-border shadow-soft space-y-4 font-inter", className)}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Car size={24} />
          </div>
          <div>
            <h4 className="font-bold text-text-primary font-manrope text-base">Driver Partnership</h4>
            <p className="text-xs text-text-secondary">Turn your vehicle into daily revenue</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Drive on scheduled return corridors with priority dispatch, transparent fares, and 24/7 RTO verification support.
        </p>
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-secondary transition-all shadow-sm active:scale-95 font-manrope touch-target"
        >
          <span>{buttonText}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  if (variant === 'link') {
    return (
      <button
        onClick={handleClick}
        className={cn("text-accent font-bold hover:underline inline-flex items-center gap-1 text-xs", className)}
      >
        <span>{buttonText}</span>
        <ArrowRight size={12} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white font-bold text-xs rounded-xl hover:bg-accent/90 transition-all shadow-sm active:scale-95 font-manrope touch-target",
        className
      )}
    >
      <Car size={16} />
      <span>{buttonText}</span>
    </button>
  );
}
