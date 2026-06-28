"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  type?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, type = 'text', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col space-y-1 w-full">
      <div className="relative group">
        <input
          {...props}
          type={inputType}
          className={cn(
            "peer w-full rounded-premium border bg-surface px-4 pb-2 pt-6 text-sm font-semibold text-text-primary outline-none transition-all duration-[220ms] placeholder-transparent shadow-sm disabled:cursor-not-allowed disabled:bg-background disabled:text-text-secondary",
            error ? "border-danger focus:border-danger focus:ring-4 focus:ring-danger/10" : "border-border focus:border-accent focus:ring-4 focus:ring-accent/15"
          )}
          placeholder={label}
        />
        <label className="pointer-events-none absolute left-4 top-1 text-xs font-bold text-text-secondary transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-semibold peer-focus:top-1 peer-focus:text-xs peer-focus:font-bold peer-focus:text-primary">
          {label}
        </label>
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 rounded-full"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger ml-1">{error}</p>}
    </div>
  );
};
