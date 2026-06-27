"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from "@/store/useNotificationStore";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { addNotification } = useNotificationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addNotification("error", "Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      addNotification("success", "Password reset instructions sent to your email!");
      sessionStorage.setItem("signup_email", email);
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification("error", errObj.response?.data?.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-[36px] p-8 sm:p-10 shadow-2xl border border-gray-100 space-y-6">
        
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-inner mb-3">
            <KeyRound size={32} />
          </div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Forgot Password?</h1>
          <p className="text-xs text-gray-500 font-medium">
            Enter your email address and we will send you an OTP code to reset your account password.
          </p>
        </div>

        {sent ? (
          <div className="space-y-6 text-center py-4 animate-in fade-in duration-300">
            <div className="p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 text-xs font-bold text-left">
              <CheckCircle2 size={24} className="shrink-0 text-green-600" />
              <span>We have dispatched a 6-digit verification code to {email}.</span>
            </div>
            <Button onClick={() => router.push("/otp")} className="w-full h-14 text-base">
              Enter Verification OTP
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <Input
                label="Registered Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rider@example.com"
                required
              />
            </div>

            <Button type="submit" loading={loading} disabled={loading} className="w-full h-14 text-base">
              Send Reset Code
            </Button>
          </form>
        )}

        <div className="pt-2 text-center border-t">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
