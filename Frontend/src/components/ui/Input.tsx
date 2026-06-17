"use client";

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
          className={`peer w-full px-4 pt-6 pb-2 border-2 rounded-uber outline-none transition-all
            ${error ? 'border-red-500' : 'border-gray-200 focus:border-primary'}
            placeholder-transparent`}
          placeholder={label}
        />
        <label className={`absolute left-4 top-1 text-xs font-semibold text-gray-500 transition-all
          peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:font-normal
          peer-focus:top-1 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-primary pointer-events-none`}>
          {label}
        </label>
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-4 text-gray-400 hover:text-primary transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
    </div>
  );
};
